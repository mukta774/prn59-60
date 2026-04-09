/**
 * Myths Routes - Basic Implementation
 * Handles myth listing for public display
 */

const express = require('express');
const router = express.Router();
const { Myth } = require('../models');

// GET /api/myths - List all published myths
router.get('/', async (req, res) => {
  try {
    const myths = await Myth.find({ status: 'published' })
      .sort({ created_at: -1 })
      .limit(10)
      .select('concern myth response sources rating_avg view_count');

    res.status(200).json({
      success: true,
      count: myths.length,
      myths: myths.map(m => ({
        id: m._id,
        concern: m.concern,
        myth: m.myth,
        response: m.response,
        sources: m.sources,
        rating: m.rating_avg,
        views: m.view_count
      }))
    });

  } catch (error) {
    console.error('Myths retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve myths',
      message: error.message 
    });
  }
});

// GET /api/myths/:mythId - Get specific myth
router.get('/:mythId', async (req, res) => {
  try {
    const myth = await Myth.findById(req.params.mythId);
    
    if (!myth || myth.status !== 'published') {
      return res.status(404).json({ error: 'Myth not found' });
    }

    // Increment view count
    myth.view_count += 1;
    await myth.save();

    res.status(200).json({
      success: true,
      myth: {
        id: myth._id,
        concern: myth.concern,
        myth: myth.myth,
        response: myth.response,
        sources: myth.sources,
        rating: myth.rating_avg,
        views: myth.view_count
      }
    });

  } catch (error) {
    console.error('Myth retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
