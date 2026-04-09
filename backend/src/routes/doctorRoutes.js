/**
 * Doctor Routes - Complete Implementation
 * Handles doctor myth submission and management
 */

const express = require('express');
const router = express.Router();
const { Myth, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./authRoutes');

// POST /api/doctor/submit-myth - Submit a new myth/concern response
router.post('/submit-myth', authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor role required.' });
    }

    const { concern, myth, response, sources } = req.body;

    // Validate input
    if (!concern || !response) {
      return res.status(400).json({ 
        error: 'Concern and response are required' 
      });
    }

    // Create myth record
    const mythId = uuidv4();
    const newMyth = new Myth({
      _id: mythId,
      doctor_id: req.user.userId,
      concern,
      myth: myth || '',
      response,
      sources: sources || [],
      status: 'pending_review',
      submitted_at: new Date()
    });

    await newMyth.save();

    res.status(201).json({
      success: true,
      message: 'Myth submitted for review',
      myth: {
        id: newMyth._id,
        concern: newMyth.concern,
        status: newMyth.status,
        submitted_at: newMyth.submitted_at
      }
    });

  } catch (error) {
    console.error('Myth submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit myth',
      message: error.message 
    });
  }
});

// GET /api/doctor/submissions - Get doctor's myth submissions
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor role required.' });
    }

    const myths = await Myth.find({ doctor_id: req.user.userId })
      .sort({ created_at: -1 })
      .select('concern myth response status created_at submitted_at reviewed_by review_notes');

    res.status(200).json({
      success: true,
      count: myths.length,
      submissions: myths.map(m => ({
        id: m._id,
        concern: m.concern,
        myth: m.myth,
        response: m.response,
        status: m.status,
        created_at: m.created_at,
        submitted_at: m.submitted_at,
        review_notes: m.review_notes
      }))
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/doctor/myth/:mythId - Update myth (only if draft or revision requested)
router.put('/myth/:mythId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const myth = await Myth.findById(req.params.mythId);
    
    if (!myth) {
      return res.status(404).json({ error: 'Myth not found' });
    }

    // Check ownership
    if (myth.doctor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this myth' });
    }

    // Can only edit if draft or revision requested
    if (!['draft', 'revision_requested'].includes(myth.status)) {
      return res.status(400).json({ 
        error: 'Cannot edit myth in current status' 
      });
    }

    const { concern, myth: mythText, response, sources } = req.body;

    // Update fields
    if (concern) myth.concern = concern;
    if (mythText) myth.myth = mythText;
    if (response) myth.response = response;
    if (sources) myth.sources = sources;

    await myth.save();

    res.status(200).json({
      success: true,
      message: 'Myth updated successfully',
      myth: {
        id: myth._id,
        status: myth.status
      }
    });

  } catch (error) {
    console.error('Update myth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctor/stats - Get doctor statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const totalSubmissions = await Myth.countDocuments({ doctor_id: req.user.userId });
    const published = await Myth.countDocuments({ 
      doctor_id: req.user.userId, 
      status: 'published' 
    });
    const pending = await Myth.countDocuments({ 
      doctor_id: req.user.userId, 
      status: 'pending_review' 
    });

    // Get total views for published myths
    const publishedMyths = await Myth.find({ 
      doctor_id: req.user.userId, 
      status: 'published' 
    }).select('view_count');
    
    const totalViews = publishedMyths.reduce((sum, m) => sum + (m.view_count || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        total_submissions: totalSubmissions,
        published,
        pending,
        total_views: totalViews
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
