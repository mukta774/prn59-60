/**
 * API Configuration
 * Centralized API endpoint configuration for frontend
 */

// API Base URL - dynamically determined based on environment
const API_BASE_URL = window.location.origin;

// API Endpoints
const API = {
  // Survey endpoints
  SUBMIT_SURVEY: `${API_BASE_URL}/api/survey/submit`,
  GET_SURVEY: (surveyId) => `${API_BASE_URL}/api/survey/${surveyId}`,
  
  // Results endpoints
  GET_RESULTS: (resultId) => `${API_BASE_URL}/api/results/${resultId}`,
  
  // Myths endpoints
  GET_MYTHS: `${API_BASE_URL}/api/myths`,
  GET_MYTH: (mythId) => `${API_BASE_URL}/api/myths/${mythId}`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

