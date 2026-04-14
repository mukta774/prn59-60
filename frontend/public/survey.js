/**
 * Survey Form - JavaScript Logic
 * Vaccine Hesitancy Assessment System
 * Includes: Navigation, Validation, Integrity Checks, Progress Tracking
 */

// ============================================================================
// Global State
// ============================================================================

let currentQuestion = 1;
const totalQuestions = 15;
const questionsPerSection = {
    demographics: { start: 1, end: 5 },
    experience: { start: 6, end: 11 },
    attitudes: { start: 12, end: 15 }
};

const sectionNames = {
    demographics: '📋 About You',
    experience: '💉 Your Experience',
    attitudes: '🤔 Your Views'
};

const sectionDescriptions = {
    demographics: 'Help us understand your background',
    experience: 'Tell us about your vaccine experience',
    attitudes: 'Tell us what you think and feel'
};

// Survey response timing and integrity checks
const surveyStartTime = Date.now();
let responseTimes = {};
let responses = {};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Survey Form Loaded');
    initializeSurvey();
    setupEventListeners();
    loadSavedResponses();
});

function initializeSurvey() {
    updateProgress();
    showHideQuestions(); // Show only first question on load
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', previousQuestion);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);

    // Language selector
    document.getElementById('language').addEventListener('change', changeLanguage);

    // Form submission
    document.getElementById('survey-form').addEventListener('submit', submitSurvey);

    // Radio button changes
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', onResponseChange);
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Window unload - save responses
    window.addEventListener('beforeunload', saveResponsesToStorage);
}

// ============================================================================
// Navigation
// ============================================================================

function nextQuestion() {
    if (currentQuestion < totalQuestions) {
        // Validate current question
        if (!validateQuestion(currentQuestion)) {
            showErrorMessage(`Please answer question ${currentQuestion}`);
            return;
        }

        currentQuestion++;
        console.log('Moving to question:', currentQuestion); // Debug
        updateProgress();
        showHideQuestions();
        saveResponsesToStorage();
    } else if (currentQuestion === totalQuestions) {
        // Already on last question - validate and show submit
        if (!validateQuestion(currentQuestion)) {
            showErrorMessage(`Please answer question ${currentQuestion}`);
            return;
        }
        console.log('On last question, showing submit section'); // Debug
        updateProgress(); // This should show the submit section
    }
}

function previousQuestion() {
    if (currentQuestion > 1) {
        currentQuestion--;
        updateProgress();
        showHideQuestions();
    }
}

function showHideQuestions() {
    const questionElements = document.querySelectorAll('.survey-question');
    questionElements.forEach((el) => {
        const questionNum = parseInt(el.getAttribute('data-question'));
        if (questionNum === currentQuestion) {
            // Show current question
            el.classList.add('active-question');
            el.classList.remove('hidden-question');
            // Scroll to it
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            // Hide other questions
            el.classList.remove('active-question');
            el.classList.add('hidden-question');
        }
    });
}

function focusCurrentQuestion() {
    showHideQuestions();
}

function handleKeyboardNavigation(e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.target.type !== 'radio') {
            nextQuestion();
        }
    } else if (e.key === 'ArrowLeft') {
        previousQuestion();
    }
}

// ============================================================================
// Progress Updates
// ============================================================================

function updateProgress() {
    // Update progress bar
    const percentage = (currentQuestion / totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('progress-percent').textContent = Math.round(percentage);

    // Update question counter
    document.getElementById('current-question').textContent = `Question ${currentQuestion}`;

    // Update section header
    const section = getSectionName(currentQuestion);
    document.getElementById('section-title').textContent = sectionNames[section];
    document.getElementById('section-description').textContent = sectionDescriptions[section];

    // Enable/disable buttons
    document.getElementById('prev-btn').disabled = currentQuestion === 1;
    
    // Show/hide submit section and next button based on current question
    const submitSection = document.getElementById('submit-section');
    const nextBtn = document.getElementById('next-btn');
    
    if (currentQuestion === totalQuestions) {
        // On last question - show submit, hide next
        if (submitSection) {
            submitSection.style.display = 'block';
            submitSection.style.visibility = 'visible';
        }
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
    } else {
        // Not on last question - hide submit, show next
        if (submitSection) {
            submitSection.style.display = 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = 'inline-block';
        }
    }
}

function getSectionName(questionNum) {
    if (questionNum >= 1 && questionNum <= 5) return 'demographics';
    if (questionNum >= 6 && questionNum <= 11) return 'experience';
    if (questionNum >= 12 && questionNum <= 15) return 'attitudes';
}

// ============================================================================
// Validation
// ============================================================================

function validateQuestion(questionNum) {
    const questionElement = document.querySelector(`[data-question="${questionNum}"]`);
    if (!questionElement) return false;

    const radioButtons = questionElement.querySelectorAll('input[type="radio"]');
    const isAnswered = Array.from(radioButtons).some(rb => rb.checked);

    if (!isAnswered) {
        questionElement.classList.add('has-error');
        return false;
    } else {
        questionElement.classList.remove('has-error');
        return true;
    }
}

function validateAllQuestions() {
    let allValid = true;
    for (let i = 1; i <= totalQuestions; i++) {
        if (!validateQuestion(i)) {
            allValid = false;
        }
    }
    return allValid;
}

// ============================================================================
// Response Tracking
// ============================================================================

function onResponseChange(e) {
    const questionElement = e.target.closest('.survey-question');
    const questionNum = parseInt(questionElement.getAttribute('data-question'));
    const answer = e.target.value;

    // Store response
    responses[questionNum] = {
        answer: answer,
        timestamp: Date.now(),
        responseTime: Date.now() - surveyStartTime
    };

    // Remove error state
    questionElement.classList.remove('has-error');

    // Auto-save
    saveResponsesToStorage();

    console.log(`Q${questionNum}: ${answer}`);
}

// ============================================================================
// Integrity Checks
// ============================================================================

function performIntegrityChecks(allResponses) {
    const checks = {
        contradictions: detectContradictions(allResponses),
        responseTimes: checkResponseTimes(allResponses),
        patterns: detectPatterns(allResponses),
        completeness: allResponses.length === totalQuestions
    };

    // Log integrity checks
    console.log('Integrity Checks:', checks);

    return checks;
}

/**
 * Detect contradictory responses
 * E.g., "fully vaccinated" but "definitely will not vaccinate next"
 */
function detectContradictions(allResponses) {
    const contradictions = [];

    // Check Q5 (vaccination status) vs Q15 (intention)
    const q5 = allResponses[4]?.answer; // Index 4 = Q5
    const q15 = allResponses[14]?.answer; // Index 14 = Q15

    if (q5 === 'fully_vaccinated' && (q15 === 'probably_no' || q15 === 'definitely_no')) {
        contradictions.push({
            type: 'vaccination_contradiction',
            q5: q5,
            q15: q15
        });
    }

    return contradictions;
}

/**
 * Check if response times are suspiciously fast or slow
 * Minimum: 3-5 minutes (180-300 seconds)
 * Flag if < 60 seconds total
 */
function checkResponseTimes(allResponses) {
    const firstResponse = allResponses[0]?.timestamp || surveyStartTime;
    const lastResponse = allResponses[allResponses.length - 1]?.timestamp || Date.now();
    const totalTime = (lastResponse - firstResponse) / 1000; // seconds

    const flags = [];

    if (totalTime < 60) {
        flags.push('suspiciously_fast'); // Too fast - likely not genuine
    }

    // Check for individual questions answered too fast
    allResponses.forEach((resp, i) => {
        if (resp.responseTime < 2000) { // Less than 2 seconds for first q
            flags.push(`q${i + 1}_very_fast`);
        }
    });

    return {
        totalTime: totalTime,
        flags: flags
    };
}

/**
 * Detect answer patterns (e.g., straight-line answers)
 */
function detectPatterns(allResponses) {
    const patterns = [];

    // Check for straight-line pattern in Likert scale questions (Q12-Q15)
    const likertAnswers = [11, 12, 13, 14].map(i => parseInt(allResponses[i - 1]?.answer));

    if (likertAnswers.every(a => a === likertAnswers[0])) {
        patterns.push('straight_line_response');
    }

    return patterns;
}

// ============================================================================
// Storage
// ============================================================================

function saveResponsesToStorage() {
    try {
        const surveyData = {
            responses: responses,
            currentQuestion: currentQuestion,
            timestamp: Date.now(),
            startTime: surveyStartTime
        };
        localStorage.setItem('vaccine_survey_draft', JSON.stringify(surveyData));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadSavedResponses() {
    try {
        const saved = localStorage.getItem('vaccine_survey_draft');
        if (saved) {
            const surveyData = JSON.parse(saved);
            responses = surveyData.responses;

            // Restore checked radio buttons
            Object.entries(responses).forEach(([qNum, data]) => {
                const radio = document.querySelector(`input[name="q${qNum}"][value="${data.answer}"]`);
                if (radio) {
                    radio.checked = true;
                }
            });
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

// ============================================================================
// Form Submission
// ============================================================================

function showSubmitSection() {
    const submitSection = document.getElementById('submit-section');
    submitSection.style.display = 'block';
    submitSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function submitSurvey(e) {
    e.preventDefault();

    // Validate all questions
    if (!validateAllQuestions()) {
        showErrorMessage('Please answer all questions before submitting');
        return;
    }

    // Check consent
    if (!document.getElementById('consent').checked) {
        showErrorMessage('Please agree to data usage');
        return;
    }

    // Collect all responses
    const allResponses = [];
    for (let i = 1; i <= totalQuestions; i++) {
        allResponses.push(responses[i]);
    }

    // Perform integrity checks
    const integrityChecks = performIntegrityChecks(allResponses);

    // Prepare submission data
    const submissionData = {
        responses: allResponses,
        integrityChecks: integrityChecks,
        totalTime: (Date.now() - surveyStartTime) / 1000,
        timestamp: new Date().toISOString(),
        language: document.getElementById('language').value
    };

    console.log('Submission Data:', submissionData);

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';

    try {
        // Send to backend API (use window.location.origin for dynamic URL)
        const API_BASE = window.location.origin;
        const response = await fetch(`${API_BASE}/api/survey/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                responses: allResponses,
                metadata: {
                    timestamp: new Date().toISOString(),
                    device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    language: document.getElementById('language').value,
                    session_id: generateSessionId(),
                    total_time: (Date.now() - surveyStartTime) / 1000
                }
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Survey submitted:', result);

            // Save result ID for results page
            localStorage.setItem('result_id', result.result_id);
            localStorage.removeItem('vaccine_survey_draft'); // Clear draft

            // Redirect to results page
            setTimeout(() => {
                window.location.href = `results.html?id=${result.result_id}`;
            }, 500);
        } else {
            const errorData = await response.json();
            showErrorMessage(errorData.message || 'Failed to submit survey. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Submission error:', error);
        showErrorMessage('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Helper function to generate session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
}

// ============================================================================
// Error Handling
// ============================================================================

function showErrorMessage(message) {
    // Create temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    errorDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideInDown 0.3s ease-out;
    `;

    document.body.appendChild(errorDiv);

    // Remove after 4 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 4000);
}

// ============================================================================
// Language Support (Stub for future implementation)
// ============================================================================

function changeLanguage(e) {
    const language = e.target.value;
    console.log(`Language changed to: ${language}`);

    // Store language preference
    localStorage.setItem('preferred_language', language);

    // In full implementation, this would:
    // 1. Load translated strings
    // 2. Update all question text
    // 3. Update button labels
    // 4. Update section headers

    // For now, just show a notification
    console.log('Language support to be implemented');
}

// ============================================================================
// Utility Functions
// ============================================================================

function getSurveyData() {
    return {
        responses: responses,
        totalTime: (Date.now() - surveyStartTime) / 1000,
        completionPercentage: (Object.keys(responses).length / totalQuestions) * 100,
        currentQuestion: currentQuestion
    };
}

function exportSurveyData() {
    const data = getSurveyData();
    console.log(JSON.stringify(data, null, 2));
    return data;
}

// ============================================================================
// Testing/Debug Functions (Remove in production)
// ============================================================================

function autoFillSurvey() {
    const answers = [
        { q: 'q1', value: '26-35' },
        { q: 'q2', value: 'female' },
        { q: 'q3', value: 'bachelor' },
        { q: 'q4', value: 'no' },
        { q: 'q5', value: 'fully_vaccinated' },
        { q: 'q6', value: 'mild' },
        { q: 'q7', value: 'yes_mild' },
        { q: 'q8', value: 'no_allergy' },
        { q: 'q9', value: 'yes_detailed' },
        { q: 'q10', value: 'doctor' },
        { q: 'q11', value: 'past_month' },
        { q: 'q12', value: '4' },
        { q: 'q13', value: '2' },
        { q: 'q14', value: '4' },
        { q: 'q15', value: 'probably_yes' }
    ];

    answers.forEach(({ q, value }) => {
        const radio = document.querySelector(`input[name="${q}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    console.log('Survey auto-filled (for testing only)');
}

// Make available in console for testing
window.surveyDebug = {
    autoFill: autoFillSurvey,
    exportData: exportSurveyData,
    getSurveyData: getSurveyData,
    getCurrentQuestion: () => currentQuestion,
    setCurrentQuestion: (q) => { currentQuestion = q; updateProgress(); }
};
