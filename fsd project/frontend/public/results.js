/**
 * Results Page - JavaScript Logic
 * Displays assessment results with gauge, SHAP factors, and doctors myths
 */

// ============================================================================
// Global State & Data
// ============================================================================

let assessmentData = null;
let hesitancyScore = 0;
let hesitancyTier = '';

// Sample SHAP Factors (will be replaced by actual ML service data)
const factorDatabase = {
    trust: {
        name: 'Trust in Health Authorities',
        explanation: 'Your level of trust in organizations like WHO and government health ministries affects your willingness to vaccinate.',
        icon: '🏛️'
    },
    side_effects: {
        name: 'Concern About Side Effects',
        explanation: 'Concerns about potential side effects are a major factor in vaccine hesitancy. Most side effects are mild and temporary.',
        icon: '⚠️'
    },
    effectiveness: {
        name: 'Belief in Vaccine Effectiveness',
        explanation: 'Your confidence that vaccines actually work to prevent disease significantly influences your decision.',
        icon: '💪'
    },
    speed: {
        name: 'Concern About Development Speed',
        explanation: 'The rapid development of vaccines raises questions for some people despite rigorous testing.',
        icon: '⚡'
    },
    ingredients: {
        name: 'Concerns About Ingredients',
        explanation: 'Questions about what\'s in vaccines and whether all ingredients are safe can contribute to hesitancy.',
        icon: '🧪'
    },
    health_status: {
        name: 'Personal Health Status',
        explanation: 'Your existing health conditions may make you more cautious about vaccinating.',
        icon: '🏥'
    }
};

// Myth Database (will be enhanced with real data)
const mythDatabase = [
    {
        concern: 'Severe Side Effects',
        icon: '⚠️',
        response: 'Most vaccine side effects are mild and temporary, like arm soreness, fatigue, or low fever. These usually resolve within 1-2 days. Serious side effects are extremely rare (less than 1 in 1 million).',
        doctor: 'Dr. Sarah Johnson',
        credential: 'MD, Immunologist',
        institution: 'National Health Institute'
    },
    {
        concern: 'Vaccine Development Speed',
        icon: '⚡',
        response: 'Rapid vaccine development happened due to massive funding and global cooperation, not skipped safety tests. All clinical trials were completed with rigorous safety monitoring.',
        doctor: 'Dr. Rajesh Patel',
        credential: 'MBBS, Epidemiologist',
        institution: 'Regional Medical Center'
    },
    {
        concern: 'Ingredients Safety',
        icon: '🧪',
        response: 'All vaccine ingredients are carefully chosen and tested for safety. mRNA technology has been studied for decades. No long-term toxic ingredients are used in vaccines.',
        doctor: 'Dr. Jennifer Lee',
        credential: 'PhD, Biochemistry',
        institution: 'University Medical School'
    },
    {
        concern: 'Fertility & Pregnancy',
        icon: '👶',
        response: 'There is no evidence that vaccines affect fertility or cause pregnancy complications. Millions of vaccinated women have had healthy pregnancies and babies.',
        doctor: 'Dr. Priya Sharma',
        credential: 'MBBS, Obstetrics',
        institution: 'Women\'s Health Center'
    },
    {
        concern: 'Long-term Effects',
        icon: '🔬',
        response: 'Vaccines do not cause long-term effects years later. If side effects occur, they typically appear within weeks. Billions of doses have been safely used worldwide.',
        doctor: 'Dr. Ahmed Hassan',
        credential: 'MD, Pharmacology',
        institution: 'Clinical Research Institute'
    }
];

// Tier Definitions
const tierDefinitions = {
    confident: {
        name: 'Confident',
        range: '0-25',
        description: 'You feel confident about vaccines. You understand the benefits and are comfortable with vaccination.',
        color: '#10b981'
    },
    mild: {
        name: 'Mildly Hesitant',
        range: '26-50',
        description: 'You have some concerns but are open to vaccination with more information. These concerns are commonly addressed easily.',
        color: '#f59e0b'
    },
    moderate: {
        name: 'Moderately Hesitant',
        range: '51-75',
        description: 'You have significant concerns about vaccines. Speaking with a healthcare provider is recommended to address your specific worries.',
        color: '#ef5350'
    },
    strong: {
        name: 'Strongly Hesitant',
        range: '76-100',
        description: 'You have substantial concerns about vaccinating. We encourage you to have a detailed conversation with your doctor to discuss your specific health situation.',
        color: '#c62828'
    }
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Results Page Loaded');
    loadAssessmentData();
    calculateHesitancyScore();
    displayResults();
});

// ============================================================================
// Load Assessment Data
// ============================================================================

function loadAssessmentData() {
    // Try to load from localStorage first
    let data = localStorage.getItem('assessment_data');

    if (data) {
        try {
            assessmentData = JSON.parse(data);
            console.log('Loaded assessment data from localStorage');
        } catch (e) {
            console.error('Error parsing assessment data:', e);
            showError('Could not load assessment data');
        }
    } else {
        // Try to get from URL parameter (for API response)
        const params = new URLSearchParams(window.location.search);
        const assessmentId = params.get('id');

        if (assessmentId) {
            // In production, would fetch from API
            console.log('Assessment ID:', assessmentId);
        }

        // Use demo data if nothing found
        console.log('Using demo assessment data');
        assessmentData = generateDemoData();
    }
}

function generateDemoData() {
    return {
        responses: [
            { q: 1, answer: '26-35' },
            { q: 2, answer: 'female' },
            { q: 3, answer: 'bachelor' },
            { q: 4, answer: 'no' },
            { q: 5, answer: 'partially' },
            { q: 6, answer: 'mild' },
            { q: 7, answer: 'yes_mild' },
            { q: 8, answer: 'no_allergy' },
            { q: 9, answer: 'yes_brief' },
            { q: 10, answer: 'internet' },
            { q: 11, answer: 'past_month' },
            { q: 12, answer: '2' },
            { q: 13, answer: '3' },
            { q: 14, answer: '4' },
            { q: 15, answer: 'probably_yes' }
        ],
        timestamp: new Date().toISOString()
    };
}

// ============================================================================
// Calculate Hesitancy Score
// ============================================================================

function calculateHesitancyScore() {
    if (!assessmentData || !assessmentData.responses) {
        hesitancyScore = 50; // Default
        return;
    }

    const responses = assessmentData.responses;

    // Get key responses
    const q12Trust = parseInt(responses[11]?.answer) || 3; // Scale 1-5
    const q13Concerns = parseInt(responses[12]?.answer) || 3; // Scale 1-5
    const q14Effectiveness = parseInt(responses[13]?.answer) || 3; // Scale 1-5
    const q15Intent = responses[14]?.answer; // Categorical

    // Map responses to hesitancy indicators (0-100)
    let hesitancyFactors = [];

    // Factor 1: Trust (higher distrust = higher hesitancy)
    // 1 (don't trust) = 100, 5 (trust completely) = 20
    const trustMapping = { 1: 100, 2: 75, 3: 50, 4: 25, 5: 20 };
    hesitancyFactors.push(trustMapping[q12Trust] || 50);

    // Factor 2: Concerns (higher concerns = higher hesitancy)
    // 1 (not concerned) = 20, 5 (extremely concerned) = 100
    const concernsMapping = { 1: 20, 2: 35, 3: 50, 4: 75, 5: 100 };
    hesitancyFactors.push(concernsMapping[q13Concerns] || 50);

    // Factor 3: Effectiveness belief (lower belief = higher hesitancy)
    // 1 (not effective) = 100, 5 (extremely effective) = 20
    const effectivenessMapping = { 1: 100, 2: 75, 3: 50, 4: 35, 5: 20 };
    hesitancyFactors.push(effectivenessMapping[q14Effectiveness] || 50);

    // Factor 4: Vaccination intent
    // Map to hesitancy scale
    const intentMapping = {
        definitely_yes: 15,
        probably_yes: 35,
        unsure: 50,
        probably_no: 70,
        definitely_no: 95
    };
    hesitancyFactors.push(intentMapping[q15Intent] || 50);

    // Factor 5: Prior vaccination status
    const q5Status = responses[4]?.answer;
    const statusMapping = {
        fully_vaccinated: 20,
        partially: 40,
        not_vaccinated: 70,
        unsure_status: 50
    };
    hesitancyFactors.push(statusMapping[q5Status] || 50);

    // Calculate average hesitancy score
    hesitancyScore = Math.round(
        hesitancyFactors.reduce((a, b) => a + b, 0) / hesitancyFactors.length
    );

    // Clamp to 0-100
    hesitancyScore = Math.max(0, Math.min(100, hesitancyScore));

    // Determine tier
    if (hesitancyScore <= 25) {
        hesitancyTier = 'confident';
    } else if (hesitancyScore <= 50) {
        hesitancyTier = 'mild';
    } else if (hesitancyScore <= 75) {
        hesitancyTier = 'moderate';
    } else {
        hesitancyTier = 'strong';
    }

    console.log('Hesitancy Score:', hesitancyScore, 'Tier:', hesitancyTier);
}

// ============================================================================
// Display Results
// ============================================================================

function displayResults() {
    displayGauge();
    displayScore();
    displayFactors();
    displayMyths();
}

function displayScore() {
    document.getElementById('hesitancy-score').textContent = hesitancyScore;

    const tier = tierDefinitions[hesitancyTier];
    document.getElementById('hesitancy-tier').textContent = tier.name;
    document.getElementById('hesitancy-tier').style.color = tier.color;
    document.getElementById('tier-description').textContent = tier.description;
}

// ============================================================================
// Gauge Animation
// ============================================================================

function displayGauge() {
    const gauge = document.getElementById('gauge-svg');
    const gaugePath = document.getElementById('gauge-progress');
    const needle = document.getElementById('gauge-needle');

    // SVG path for full arc: M 50 150 A 100 100 0 0 1 250 150
    // Full circumference for 180 degree arc is approximately 314 (half of 2*pi*100)
    const arcLength = 314;
    const fillLength = (hesitancyScore / 100) * arcLength;

    // Animate progress
    animateStrokeDasharray(gaugePath, 0, fillLength, arcLength);

    // Animate needle
    const angle = (hesitancyScore / 100) * 180 - 90; // Rotate from -90 to 90 degrees
    animateNeedle(needle, angle);
}

function animateStrokeDasharray(element, fromLength, toLength, total) {
    const duration = 1500;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentLength = fromLength + (toLength - fromLength) * easeOutCubic(progress);
        element.style.strokeDasharray = `${currentLength}, ${total}`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

function animateNeedle(needle, finalAngle) {
    const duration = 1500;
    const startTime = Date.now();
    const startAngle = -90;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAngle = startAngle + (finalAngle - startAngle) * easeOutCubic(progress);
        needle.style.transform = `rotate(${currentAngle}deg)`;
        needle.style.transformOrigin = '150px 150px';

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// ============================================================================
// Display SHAP Factors
// ============================================================================

function displayFactors() {
    const container = document.getElementById('factors-container');
    container.innerHTML = '';

    // Get the top 3 factors based on responses
    const topFactors = getTopFactors(3);

    topFactors.forEach((factor, index) => {
        const card = document.createElement('div');
        card.className = 'factor-card';
        card.innerHTML = `
            <div class="factor-rank">#${index + 1} Factor</div>
            <div class="factor-name">${factor.name}</div>
            <div class="factor-importance">
                <div class="importance-bar">
                    <div class="importance-fill" style="width: ${factor.importance}%"></div>
                </div>
                <div class="importance-percent">${factor.importance}%</div>
            </div>
            <div class="factor-explanation">${factor.explanation}</div>
        `;
        container.appendChild(card);
    });
}

function getTopFactors(count) {
    const factors = [];

    // Analyze responses to identify key factors
    const responses = assessmentData.responses || [];

    // Factor: Trust (Q12)
    const q12 = parseInt(responses[11]?.answer) || 3;
    if (q12 <= 2) {
        factors.push({
            name: factorDatabase.trust.name,
            explanation: factorDatabase.trust.explanation,
            importance: (3 - q12) * 50
        });
    }

    // Factor: Concerns (Q13)
    const q13 = parseInt(responses[12]?.answer) || 3;
    if (q13 >= 3) {
        factors.push({
            name: factorDatabase.side_effects.name,
            explanation: factorDatabase.side_effects.explanation,
            importance: q13 * 20
        });
    }

    // Factor: Effectiveness (Q14)
    const q14 = parseInt(responses[13]?.answer) || 3;
    if (q14 <= 3) {
        factors.push({
            name: factorDatabase.effectiveness.name,
            explanation: factorDatabase.effectiveness.explanation,
            importance: (4 - q14) * 25
        });
    }

    // Factor: Health Status (Q4)
    const q4 = responses[3]?.answer;
    if (q4 === 'yes') {
        factors.push({
            name: factorDatabase.health_status.name,
            explanation: factorDatabase.health_status.explanation,
            importance: 60
        });
    }

    // If less than count, add default factors
    while (factors.length < count && factors.length < Object.keys(factorDatabase).length) {
        const randomKey = Object.keys(factorDatabase)[Math.floor(Math.random() * Object.keys(factorDatabase).length)];
        if (!factors.some(f => f.name === factorDatabase[randomKey].name)) {
            factors.push({
                name: factorDatabase[randomKey].name,
                explanation: factorDatabase[randomKey].explanation,
                importance: Math.floor(Math.random() * 60) + 30
            });
        }
    }

    return factors.slice(0, count).sort((a, b) => b.importance - a.importance);
}

// ============================================================================
// Display Doctor Myths
// ============================================================================

function displayMyths() {
    const container = document.getElementById('myths-container');
    container.innerHTML = '';

    // Select relevant myths based on hesitancy tier
    const relevantMyths = selectRelevantMyths(3);

    relevantMyths.forEach(myth => {
        const card = document.createElement('div');
        card.className = 'myth-card';
        card.innerHTML = `
            <div class="myth-concern">
                <div class="myth-icon">${myth.icon}</div>
                <div class="myth-concern-text">
                    <h3>${myth.concern}</h3>
                    <p>One of your main concerns</p>
                </div>
            </div>
            <div class="myth-response">
                <h4>✓ What We Know</h4>
                <p>${myth.response}</p>
            </div>
            <div class="myth-doctor">
                <div class="doctor-badge">👨‍⚕️</div>
                <div class="doctor-info">
                    <strong>${myth.doctor}</strong>
                    <small>${myth.credential} • ${myth.institution}</small>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function selectRelevantMyths(count) {
    // In production, would match myths to user's specific concerns
    // For now, return a mix of myths
    const shuffled = [...mythDatabase].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// ============================================================================
// Action Modal
// ============================================================================

function showAction(action) {
    const modal = document.getElementById('action-modal');
    const body = document.getElementById('modal-body');

    const actionContent = {
        'vaccination-centre': `
            <h3>Find Vaccination Centre Near You</h3>
            <p>Visit the following official resources to locate vaccination centers:</p>
            <p><a href="https://www.who.int" target="_blank">WHO Vaccination Finder →</a></p>
            <p><a href="https://main.mohfw.gov.in/" target="_blank">India Health Ministry →</a></p>
            <p><a href="#" onclick="alert('Enter your zip code to find nearby centers')">Search by Location →</a></p>
        `,
        'helpline': `
            <h3>National COVID-19 Helplines</h3>
            <p><strong>India:</strong> 1075 (National Toll-free) • 011-2358-1111</p>
            <p><strong>WHO:</strong> Available 24/7 for general health queries</p>
            <p>Trained health counselors can answer your specific questions about vaccines.</p>
            <p>Best time to call: Weekdays 9 AM - 6 PM</p>
        `,
        'resources': `
            <h3>Trusted Information Sources</h3>
            <p><strong>Official:</strong></p>
            <p><a href="https://www.who.int/teams/immunization-vaccines-and-biologicals" target="_blank">WHO Immunization →</a></p>
            <p><a href="https://main.mohfw.gov.in/" target="_blank">Indian Ministry of Health →</a></p>
            <p><strong>Research:</strong></p>
            <p><a href="https://www.pubmed.gov" target="_blank">PubMed (Scientific Studies) →</a></p>
            <p><a href="https://www.cdc.gov/vaccines" target="_blank">CDC Vaccines →</a></p>
        `,
        'doctor-talk': `
            <h3>Prepare for Your Doctor Conversation</h3>
            <p><strong>Questions to Ask:</strong></p>
            <ul style="text-align: left; color: var(--text-secondary);">
                <li>Which vaccine is recommended for me?</li>
                <li>Are there any risks for my health conditions?</li>
                <li>What are common side effects I should expect?</li>
                <li>When should I get vaccinated?</li>
                <li>What happens if I have allergies?</li>
            </ul>
            <p><strong>Bring:</strong> Your medical history, current medications, any allergies</p>
        `
    };

    body.innerHTML = actionContent[action] || '<p>Information not available</p>';
    modal.style.display = 'flex';
}

function closeAction() {
    document.getElementById('action-modal').style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('action-modal');
    if (e.target === modal) {
        closeAction();
    }
});

// ============================================================================
// Export Functions
// ============================================================================

function exportPDF() {
    alert('PDF export functionality - Connect to PDF library in production\nSuggested: jsPDF or html2pdf');
    // In production: use html2pdf or jsPDF library
}

function printResults() {
    window.print();
}

function retakeSurvey() {
    if (confirm('Are you sure? Your current results will be saved.')) {
        localStorage.removeItem('vaccine_survey_draft');
        window.location.href = 'individual-assessment.html';
    }
}

// ============================================================================
// Data Contribution
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('contribute-data');
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log('User opted in to data contribution');
                // In production: send anonymized data to backend
                submitAnonymizedData();
            }
        });
    }
});

function submitAnonymizedData() {
    const anonymousData = {
        responses: assessmentData.responses,
        score: hesitancyScore,
        tier: hesitancyTier,
        timestamp: new Date().toISOString()
        // NO PII: no name, email, or contact info
    };

    console.log('Anonymized data for research:', anonymousData);

    // In production: send to backend
    // fetch('/api/v1/anonymous-contributions', {
    //     method: 'POST',
    //     body: JSON.stringify(anonymousData)
    // });
}

// ============================================================================
// Error Handling
// ============================================================================

function showError(message) {
    console.error(message);
    const container = document.querySelector('.results-header');
    if (container) {
        const error = document.createElement('div');
        error.className = 'error-banner';
        error.textContent = `⚠️ ${message}`;
        container.appendChild(error);
    }
}

// ============================================================================
// Utility: Close modals on escape key
// ============================================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAction();
    }
});

// Make functions available in console for testing
window.resultsDebug = {
    getScore: () => hesitancyScore,
    getTier: () => hesitancyTier,
    getAssessmentData: () => assessmentData,
    exportData: () => console.log(JSON.stringify(assessmentData, null, 2))
};
