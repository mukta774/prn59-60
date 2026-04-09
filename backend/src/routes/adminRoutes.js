/**
 * Admin Routes - Complete Implementation
 * Handles admin approvals, moderation, and management
 */

const express = require('express');
const router = express.Router();
const { User, Myth, Institution, AuditLog } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./authRoutes');

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

// GET /api/admin/queue/myths - Get pending myth submissions
router.get('/queue/myths', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingMyths = await Myth.find({ status: 'pending_review' })
      .sort({ submitted_at: 1 })
      .populate('doctor_id', 'email profile');

    res.status(200).json({
      success: true,
      count: pendingMyths.length,
      myths: pendingMyths.map(m => ({
        id: m._id,
        concern: m.concern,
        myth: m.myth,
        response: m.response,
        sources: m.sources,
        doctor: {
          id: m.doctor_id,
          name: m.profile?.name || 'Unknown'
        },
        submitted_at: m.submitted_at
      }))
    });

  } catch (error) {
    console.error('Get myth queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/myth/:mythId/approve - Approve myth
router.put('/myth/:mythId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const myth = await Myth.findById(req.params.mythId);
    
    if (!myth) {
      return res.status(404).json({ error: 'Myth not found' });
    }

    myth.status = 'published';
    myth.reviewed_by = req.user.userId;
    myth.published_at = new Date();
    
    await myth.save();

    // Create audit log
    await createAuditLog({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'approve_myth',
      resource_type: 'myth',
      resource_id: myth._id,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Myth approved and published',
      myth: {
        id: myth._id,
        status: myth.status
      }
    });

  } catch (error) {
    console.error('Approve myth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/myth/:mythId/reject - Reject myth
router.put('/myth/:mythId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const myth = await Myth.findById(req.params.mythId);
    
    if (!myth) {
      return res.status(404).json({ error: 'Myth not found' });
    }

    myth.status = 'rejected';
    myth.reviewed_by = req.user.userId;
    myth.review_notes = reason || 'Rejected by admin';
    
    await myth.save();

    // Create audit log
    await createAuditLog({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'reject_myth',
      resource_type: 'myth',
      resource_id: myth._id,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Myth rejected',
      myth: {
        id: myth._id,
        status: myth.status
      }
    });

  } catch (error) {
    console.error('Reject myth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/myth/:mythId/request-revision - Request revision
router.put('/myth/:mythId/request-revision', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const myth = await Myth.findById(req.params.mythId);
    
    if (!myth) {
      return res.status(404).json({ error: 'Myth not found' });
    }

    myth.status = 'revision_requested';
    myth.reviewed_by = req.user.userId;
    myth.review_notes = notes || 'Revision requested';
    
    await myth.save();

    res.status(200).json({
      success: true,
      message: 'Revision requested',
      myth: {
        id: myth._id,
        status: myth.status
      }
    });

  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/queue/institutions - Get pending institution approvals
router.get('/queue/institutions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingInstitutions = await Institution.find({ verified: false })
      .sort({ created_at: 1 });

    res.status(200).json({
      success: true,
      count: pendingInstitutions.length,
      institutions: pendingInstitutions.map(i => ({
        id: i._id,
        name: i.name,
        type: i.type,
        contact_email: i.contact_email,
        created_at: i.created_at
      }))
    });

  } catch (error) {
    console.error('Get institution queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/institution/:institutionId/verify - Verify institution
router.put('/institution/:institutionId/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.institutionId);
    
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    institution.verified = true;
    // Generate API key
    institution.api_key = uuidv4();
    institution.api_key_created = new Date();
    
    await institution.save();

    // Create audit log
    await createAuditLog({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'verify_institution',
      resource_type: 'institution',
      resource_id: institution._id,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Institution verified',
      institution: {
        id: institution._id,
        verified: institution.verified,
        api_key: institution.api_key
      }
    });

  } catch (error) {
    console.error('Verify institution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMyths = await Myth.countDocuments();
    const pendingMyths = await Myth.countDocuments({ status: 'pending_review' });
    const publishedMyths = await Myth.countDocuments({ status: 'published' });
    const totalInstitutions = await Institution.countDocuments();
    const pendingInstitutions = await Institution.countDocuments({ verified: false });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          doctors: await User.countDocuments({ role: 'doctor' }),
          institutions: await User.countDocuments({ role: 'institution' }),
          individuals: await User.countDocuments({ role: 'individual' })
        },
        myths: {
          total: totalMyths,
          pending: pendingMyths,
          published: publishedMyths
        },
        institutions: {
          total: totalInstitutions,
          pending: pendingInstitutions
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create audit log
async function createAuditLog(data) {
  try {
    const log = new AuditLog({
      _id: uuidv4(),
      ...data
    });
    await log.save();
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = router;
