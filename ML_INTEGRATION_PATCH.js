/* ML Integration Patch for results.js */

// Add this section near the top after global state declarations
let mlFactors = [];  // Store ML-predicted factors
const ML_API_URL = 'http://localhost:5000/api/v1/predict';
const USE_ML_BACKEND = true;  // Set to false to use rule-based fallback

// ============================================================================
// ML API Integration
// ============================================================================

/**
 * Fetch ML prediction from baseline model
 * This replaces client-side score calculation with server-side ML prediction
 */
async function fetchMLPrediction(responses) {
    try {
        const response = await fetch(ML_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ responses })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        logger.log('ML Prediction successful:', result);
        return result;

    } catch (error) {
        logger.error('ML API error:', error);
        throw error;
    }
}

/**
 * Display ML-generated factors instead of hardcoded ones
 */
function displayMLFactors(factors) {
    const container = document.getElementById('factors-container');
    container.innerHTML = '';

    if (!factors || factors.length === 0) {
        container.innerHTML = '<div class="loading-placeholder"><p>No factors available</p></div>';
        return;
    }

    factors.forEach((factor, index) => {
        const factorCard = document.createElement('div');
        factorCard.className = 'factor-card';
        factorCard.innerHTML = `
            <div class="factor-rank">#${index + 1}</div>
            <div class="factor-name">${sanitizeHTML(factor.name)}</div>
            <div class="factor-importance">
                <div class="importance-bar">
                    <div class="importance-fill" style="width: ${factor.importance}%"></div>
                </div>
                <div class="importance-percent">${factor.importance.toFixed(1)}%</div>
            </div>
            <div class="factor-explanation">${sanitizeHTML(factor.explanation)}</div>
        `;
        container.appendChild(factorCard);
    });
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// Updated Initialization
// ============================================================================

/**
 * Load assessment and get ML prediction
 * Modified version with ML backend support
 */
async function initializeResults() {
    const assessmentDataStr = localStorage.getItem('assessment_data');

    if (!assessmentDataStr) {
        logger.warn('No assessment data found, generating demo data');
        generateDemoData();
        displayResults();
        return;
    }

    try {
        const assessmentData = JSON.parse(assessmentDataStr);

        if (USE_ML_BACKEND) {
            // Fetch ML prediction
            const mlResult = await fetchMLPrediction(assessmentData.responses);

            // Update global state with ML results
            hesitancyScore = mlResult.score;
            hesitancyTier = mlResult.tier;
            mlFactors = mlResult.factors;

            logger.log(`ML Result - Score: ${hesitancyScore}, Tier: ${hesitancyTier}`);
        } else {
            // Fallback to rule-based calculation
            console.warn('ML_BACKEND disabled, using rule-based calculation');
            calculateScoreFromResponses(assessmentData.responses);
        }

        displayResults();

    } catch (error) {
        console.error('Error loading assessment:', error);

        // Fallback to rule-based if ML fails
        if (USE_ML_BACKEND) {
            console.warn('ML failed, falling back to rule-based calculation');

            const assessmentData = JSON.parse(assessmentDataStr);
            calculateScoreFromResponses(assessmentData.responses);
            displayResults();
        } else {
            displayError('Failed to load assessment data');
        }
    }
}

// ============================================================================
// Updated Display Functions
// ============================================================================

/**
 * Display results using either ML factors or rule-based fallback
 */
function displayResults() {
    displayGauge();
    displayScore();

    // Use ML factors if available, otherwise fall back to rule-based
    if (USE_ML_BACKEND && mlFactors.length > 0) {
        displayMLFactors(mlFactors);
    } else {
        displayFactors();  // Rule-based fallback
    }

    displayMyths();
}

/**
 * Add error display helper
 */
function displayError(message) {
    console.error(message);
    const container = document.getElementById('factors-container');
    if (container) {
        container.innerHTML = `<div class="error-message"><p>${sanitizeHTML(message)}</p></div>`;
    }
}

// ============================================================================
// Logger utility (optional but recommended)
// ============================================================================

const logger = {
    log: (...args) => {
        if (window.DEBUG_MODE) {
            console.log('[Results]', ...args);
        }
    },
    error: (...args) => {
        console.error('[Results]', ...args);
    },
    warn: (...args) => {
        console.warn('[Results]', ...args);
    }
};

// ============================================================================
// Usage Notes
// ============================================================================

/*

INTEGRATION STEPS:

1. Add this code to results.js (before the existing initializeResults call)

2. Set USE_ML_BACKEND flag:
   - true = Use ML service (if running on localhost:5000)
   - false = Use rule-based fallback

3. Ensure ML service is running:
   cd ml_service
   python src/train_model.py
   python src/app.py

4. Load results page:
   - Fill survey: frontend/public/individual-assessment.html
   - Submit survey
   - Auto-redirects to frontend/public/results.html

FALLBACK BEHAVIOR:

- If ML API is unreachable → uses rule-based calculation
- If ML returns invalid data → uses rule-based calculation
- If USE_ML_BACKEND = false → always uses rule-based calculation

TESTING:

1. Open browser console
2. Set: window.DEBUG_MODE = true  (to see debug logs)
3. Reload results page
4. Check console for prediction data

DEBUG EXAMPLE:

window.DEBUG_MODE = true;
window.USE_ML_BACKEND = true;
initializeResults();  // Clear console first

*/
