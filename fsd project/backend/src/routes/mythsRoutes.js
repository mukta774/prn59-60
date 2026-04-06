/**
 * Myths Routes
 * Handles myth-busting content management
 */

const express = require('express');
const router = express.Router();

// GET /api/myths - List approved myths
router.get('/', async (req, res) => {
  try {
    res.status(200).json({ myths: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
