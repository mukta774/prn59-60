/**
 * Results Routes - Complete Implementation
 * Handles results retrieval and display
 */

const express = require('express');
const router = express.Router();
const { Result, Myth } = require('../models');

// GET /api/results/:resultId - Get survey results
router.get('/:resultId', async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Result not found',
        message: 'No results found with this ID'
      });
    }

    // Update viewed timestamp
    result.viewed_at = new Date();
    await result.save();

    // Get recommended myths (top 3 approved myths)
    const myths = await Myth.find({ status: 'published' })
      .sort({ view_count: -1 })
      .limit(3)
      .select('concern response doctor_id sources');

    res.status(200).json({
      success: true,
      result: {
        id: result._id,
        survey_id: result.survey_id,
        hesitancy_score: result.hesitancy_score,
        tier: result.tier,
        shap_factors: result.shap_factors,
        recommended_myths: myths.map(m => ({
          id: m._id,
          concern: m.concern,
          response: m.response,
          sources: m.sources
        })),
        validation_flags: result.validation_flags,
        result_timestamp: result.result_timestamp
      }
    });

  } catch (error) {
    console.error('Results retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve results',
      message: error.message 
    });
  }
});

module.exports = router;
