/**
 * Survey Routes - Complete Implementation (Production Ready)
 * Handles survey submission with simple scoring algorithm (no ML dependency)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Survey, Result } = require('../models');

// Simple scoring algorithm to replace ML service
function calculateHesitancyScore(responses) {
  let score = 50; // Start at neutral
  
  // Process responses (q1-q15)
  const responseMap = {};
  responses.forEach(r => {
    responseMap[`q${r.q}`] = r.answer;
  });
  
  // Q12: Trust in authorities (1-5, lower = more hesitant)
  const q12 = parseInt(responseMap.q12) || 3;
  score += (3 - q12) * 8; // -16 to +16
  
  // Q13: Vaccine concerns (1-5, higher = more hesitant)
  const q13 = parseInt(responseMap.q13) || 3;
  score += (q13 - 3) * 10; // -20 to +20
  
  // Q14: Vaccine effectiveness belief (1-5, lower = more hesitant)
  const q14 = parseInt(responseMap.q14) || 3;
  score += (3 - q14) * 8; // -16 to +16
  
  // Q15: Vaccination intent (definitely_no=0, probably_no=1, unsure=2, probably_yes=3, definitely_yes=4)
  const intentMap = {
    'definitely_no': 0,
    'probably_no': 1,
    'unsure': 2,
    'probably_yes': 3,
    'definitely_yes': 4
  };
  const q15 = intentMap[responseMap.q15] || 2;
  score += (2 - q15) * 12; // -24 to +24
  
  // Q5: Vaccination status (not_vaccinated=+15, partially=+5, fully=-10)
  if (responseMap.q5 === 'not_vaccinated') score += 15;
  else if (responseMap.q5 === 'partially') score += 5;
  else if (responseMap.q5 === 'fully') score -= 10;
  
  // Q6-Q8: Side effects, COVID experience, allergies
  if (responseMap.q6 === 'yes') score += 8; // Side effects experienced
  if (responseMap.q7 === 'yes') score -= 5; // COVID experience reduces hesitancy
  if (responseMap.q8 === 'yes') score += 10; // Allergies increase hesitancy
  
  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score);
}

// Generate top factors based on responses
function generateFactors(responses, score) {
  const responseMap = {};
  responses.forEach(r => {
    responseMap[`q${r.q}`] = r.answer;
  });
  
  const factors = [];
  
  // Trust in authorities
  const q12 = parseInt(responseMap.q12) || 3;
  if (q12 <= 2) {
    factors.push({
      name: 'Trust In Health Authorities',
      importance: 35,
      explanation: 'Your trust level in health authorities significantly influences your hesitancy score.'
    });
  }
  
  // Vaccine concerns
  const q13 = parseInt(responseMap.q13) || 3;
  if (q13 >= 4) {
    factors.push({
      name: 'Vaccine Safety Concerns',
      importance: 30,
      explanation: 'Concerns about vaccine safety are a major factor in your assessment.'
    });
  }
  
  // Effectiveness belief
  const q14 = parseInt(responseMap.q14) || 3;
  if (q14 <= 2) {
    factors.push({
      name: 'Vaccine Effectiveness Belief',
      importance: 25,
      explanation: 'Your belief in vaccine effectiveness is a key driver of your score.'
    });
  }
  
  // Vaccination intent
  const intentMap = {
    'definitely_no': 0,
    'probably_no': 1,
    'unsure': 2,
    'probably_yes': 3,
    'definitely_yes': 4
  };
  const q15 = intentMap[responseMap.q15] || 2;
  if (q15 <= 1) {
    factors.push({
      name: 'Vaccination Intent',
      importance: 40,
      explanation: 'Your overall vaccination intent strongly impacts your hesitancy level.'
    });
  }
  
  // Side effects
  if (responseMap.q6 === 'yes') {
    factors.push({
      name: 'Side Effects Experience',
      importance: 20,
      explanation: 'Your past experience with vaccine side effects affects your assessment.'
    });
  }
  
  // If less than 3 factors, add generic ones
  if (factors.length < 3) {
    if (!factors.find(f => f.name === 'Vaccination Intent')) {
      factors.push({
        name: 'Vaccination Intent',
        importance: 20,
        explanation: 'Your vaccination intent contributes to your hesitancy score.'
      });
    }
    if (factors.length < 3) {
      factors.push({
        name: 'Personal Health Factors',
        importance: 15,
        explanation: 'Your health status and medical history play a role in your assessment.'
      });
    }
  }
  
  // Return top 3 factors
  return factors.slice(0, 3);
}

// POST /api/survey/submit - Submit survey responses and get prediction
router.post('/submit', async (req, res) => {
  try {
    const { responses, metadata } = req.body;

    console.log('Received survey submission:', { 
      responseCount: responses?.length, 
      metadata 
    });

    // Validate request
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ 
        error: 'Invalid request: responses array is required' 
      });
    }

    // Create survey record
    const surveyId = uuidv4();
    const survey = new Survey({
      _id: surveyId,
      responses: {
        demographics: {},
        prior_experience: {},
        attitudes: {}
      },
      metadata: metadata || {},
      validation: {
        passed: true,
        flags: [],
        risk_score: 0
      }
    });

    await survey.save();
    console.log('Survey saved:', surveyId);

    // Calculate hesitancy score using simple algorithm (no ML service needed)
    const hesitancyScore = calculateHesitancyScore(responses);
    const tier = getTierFromScore(hesitancyScore);
    const factors = generateFactors(responses, hesitancyScore);
    
    console.log('Score calculated:', { hesitancyScore, tier });

    // Create result record
    const resultId = uuidv4();
    const result = new Result({
      _id: resultId,
      survey_id: surveyId,
      hesitancy_score: hesitancyScore,
      tier: tier,
      shap_factors: factors.map(f => ({
        factor: f.name,
        influence_percentage: f.importance,
        explanation: f.explanation
      })),
      recommended_myths: [],
      validation_flags: [],
      contribute_anonymised: false
    });

    await result.save();
    console.log('Result saved:', resultId);

    // Return response
    res.status(201).json({
      success: true,
      survey_id: surveyId,
      result_id: resultId,
      message: 'Survey submitted successfully'
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({ 
      error: 'Survey submission failed',
      message: error.message 
    });
  }
});

// GET /api/survey/:surveyId - Get survey responses
router.get('/:surveyId', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.status(200).json({
      success: true,
      survey: {
        id: survey._id,
        responses: survey.responses,
        metadata: survey.metadata,
        created_at: survey.created_at
      }
    });
  } catch (error) {
    console.error('Survey retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to determine tier
function getTierFromScore(score) {
  if (score <= 25) return 'Confident';
  if (score <= 50) return 'Mildly Hesitant';
  if (score <= 75) return 'Moderately Hesitant';
  return 'Strongly Hesitant';
}

module.exports = router;
