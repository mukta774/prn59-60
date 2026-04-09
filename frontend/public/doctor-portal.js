/**
 * Doctor Portal - JavaScript Logic
 * Manages myth contributions, impact tracking, and doctor profiles
 */

// ============================================================================
// Global State
// ============================================================================

let doctorData = {
    name: 'Dr. Sarah Johnson',
    email: 'dr.sarah@medical.edu',
    credential: 'MD, Immunologist',
    institution: 'National Health Institute',
    bio: 'Immunologist with 15 years of experience',
    contributions: [],
    metrics: {
        totalContributions: 0,
        responseCount: 0,
        avgRating: 0,
        verificationStatus: 'verified',
        joinedDate: '2026-04',
        popularMyth: 'Side Effects'
    }
};

// Sample contributions data
const sampleContributions = [
    {
        id: 'M001',
        topic: 'Side Effects',
        myth: 'Vaccines cause severe permanent side effects',
        response: 'Most vaccine side effects are mild and temporary, resolving within 1-2 days. Serious side effects are extremely rare.',
        status: 'verified',
        helpCount: 234,
        rating: 4.8,
        date: '2026-04-05'
    },
    {
        id: 'M002',
        topic: 'Development Speed',
        myth: 'Vaccines were rushed through testing',
        response: 'Rapid development was due to funding and global cooperation, not skipped safety tests. All clinical trials were completed.',
        status: 'verified',
        helpCount: 189,
        rating: 4.9,
        date: '2026-04-03'
    },
    {
        id: 'M003',
        topic: 'Ingredients',
        myth: 'Vaccines contain dangerous chemicals',
        response: 'All vaccine ingredients are carefully tested and safe. The doses used are far below harmful levels.',
        status: 'active',
        helpCount: 156,
        rating: 4.7,
        date: '2026-04-01'
    }
];

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadDoctorData();
    initializeDashboard();
    setupEventListeners();
});

function loadDoctorData() {
    const savedData = localStorage.getItem('doctor_data');
    if (savedData) {
        doctorData = JSON.parse(savedData);
    } else {
        // Load sample data
        doctorData.contributions = [...sampleContributions];
        doctorData.metrics.totalContributions = sampleContributions.length;
        doctorData.metrics.responseCount = 579;
        doctorData.metrics.avgRating = 4.8;
        saveDoctorData();
    }

    // Update header
    document.getElementById('doctor-name').textContent = doctorData.name;
    document.getElementById('welcome-name').textContent = doctorData.name.split(' ')[1];
    document.getElementById('profile-name').textContent = doctorData.name;
    document.getElementById('profile-credential').textContent = doctorData.credential;
    document.getElementById('profile-institution').textContent = doctorData.institution;
}

function saveDoctorData() {
    localStorage.setItem('doctor_data', JSON.stringify(doctorData));
}

function initializeDashboard() {
    updateDashboardMetrics();
    displayRecentActivity();
    loadProfileData();
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-myths');
    if (searchInput) {
        searchInput.addEventListener('input', filterContributions);
    }
}

// ============================================================================
// Tab Management
// ============================================================================

function switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });

    // Remove active from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected tab
    const tabElement = document.getElementById(`${tab}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Mark sidebar item as active
    event.target.closest('.sidebar-item').classList.add('active');

    // Load content for specific tabs
    if (tab === 'contributions') {
        displayContributions();
    } else if (tab === 'submissions') {
        loadSubmissionForm();
    } else if (tab === 'impact') {
        updateImpactMetrics();
    }
}

// ============================================================================
// Dashboard
// ============================================================================

function updateDashboardMetrics() {
    document.getElementById('myths-contributed').textContent = doctorData.metrics.totalContributions;
    document.getElementById('responses-helped').textContent = doctorData.metrics.responseCount;
    document.getElementById('verification-rate').textContent = doctorData.metrics.verificationStatus === 'verified' ? '100%' : 'Pending';
}

function displayRecentActivity() {
    const container = document.getElementById('activity-list');
    const recentItems = doctorData.contributions.slice(0, 3);

    if (recentItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No activity yet. Start by submitting a myth!</p></div>';
        return;
    }

    container.innerHTML = recentItems.map(contribution => `
        <div class="activity-item">
            <strong>${contribution.topic}</strong> - ${contribution.helpCount} people helped
            <br><small>${contribution.date}</small>
        </div>
    `).join('');
}

// ============================================================================
// Contributions Tab
// ============================================================================

function displayContributions() {
    const container = document.getElementById('contributions-list');

    if (doctorData.contributions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No contributions yet. Start by submitting a myth!</p></div>';
        return;
    }

    container.innerHTML = doctorData.contributions.map(contribution => `
        <div class="contribution-card">
            <div class="contribution-header">
                <h3>${contribution.topic}</h3>
                <span class="contribution-status status-${contribution.status}">${contribution.status.toUpperCase()}</span>
            </div>
            <div class="contribution-body">
                <p><strong>Myth:</strong> "${contribution.myth}"</p>
                <p><strong>Response:</strong> ${contribution.response}</p>
            </div>
            <div class="contribution-footer">
                <div>
                    <strong>👥 ${contribution.helpCount}</strong> people helped
                    &nbsp; | &nbsp;
                    <strong>⭐ ${contribution.rating}</strong> rating
                </div>
                <div class="contribution-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editContribution('${contribution.id}')">Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteContribution('${contribution.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterContributions() {
    const searchTerm = document.getElementById('search-myths').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = doctorData.contributions.filter(contribution => {
        const matchesSearch = contribution.topic.toLowerCase().includes(searchTerm) ||
                             contribution.myth.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || contribution.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const container = document.getElementById('contributions-list');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No contributions found</p></div>';
        return;
    }

    container.innerHTML = filtered.map(contribution => `
        <div class="contribution-card">
            <div class="contribution-header">
                <h3>${contribution.topic}</h3>
                <span class="contribution-status status-${contribution.status}">${contribution.status.toUpperCase()}</span>
            </div>
            <div class="contribution-body">
                <p><strong>Myth:</strong> "${contribution.myth}"</p>
                <p><strong>Response:</strong> ${contribution.response}</p>
            </div>
            <div class="contribution-footer">
                <div>
                    <strong>👥 ${contribution.helpCount}</strong> people helped | <strong>⭐ ${contribution.rating}</strong> rating
                </div>
                <div class="contribution-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editContribution('${contribution.id}')">Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteContribution('${contribution.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editContribution(id) {
    alert(`Editing contribution: ${id}`);
}

function deleteContribution(id) {
    if (confirm('Are you sure you want to delete this contribution?')) {
        doctorData.contributions = doctorData.contributions.filter(c => c.id !== id);
        saveDoctorData();
        displayContributions();
        alert('✅ Contribution deleted');
    }
}

// ============================================================================
// Submission Tab
// ============================================================================

function loadSubmissionForm() {
    // Pre-fill doctor info if available
    document.getElementById('doctor-full-name').value = doctorData.name;
    document.getElementById('doctor-email').value = doctorData.email;
    document.getElementById('doctor-qualification').value = doctorData.credential;
    document.getElementById('doctor-institution').value = doctorData.institution;
}

function resetForm() {
    document.getElementById('myth-topic').value = '';
    document.getElementById('myth-statement').value = '';
    document.getElementById('myth-response').value = '';
    document.getElementById('myth-evidence').value = '';
}

function submitMyth() {
    const topic = document.getElementById('myth-topic').value;
    const myth = document.getElementById('myth-statement').value;
    const response = document.getElementById('myth-response').value;
    const evidence = document.getElementById('myth-evidence').value;
    const fullName = document.getElementById('doctor-full-name').value;
    const email = document.getElementById('doctor-email').value;
    const qualification = document.getElementById('doctor-qualification').value;
    const institution = document.getElementById('doctor-institution').value;

    // Validation
    if (!topic || !myth || !response || !fullName || !qualification || !institution) {
        alert('❌ Please fill all required fields');
        return;
    }

    const newContribution = {
        id: 'M' + Date.now(),
        topic,
        myth,
        response,
        evidence,
        doctor: {
            name: fullName,
            email,
            credential: qualification,
            institution
        },
        status: 'pending',
        helpCount: 0,
        rating: 0,
        date: new Date().toISOString().split('T')[0],
        verified: false
    };

    doctorData.contributions.push(newContribution);
    doctorData.metrics.totalContributions = doctorData.contributions.length;
    saveDoctorData();

    // Reset form
    resetForm();

    alert('✅ Myth submitted successfully!\n\nIt will be reviewed by our medical team within 48 hours.');
    switchTab('contributions');
}

// ============================================================================
// Impact Tab
// ============================================================================

function updateImpactMetrics() {
    const totalHelped = doctorData.contributions.reduce((sum, c) => sum + c.helpCount, 0);
    const avgRating = doctorData.contributions.length > 0
        ? (doctorData.contributions.reduce((sum, c) => sum + c.rating, 0) / doctorData.contributions.length).toFixed(1)
        : 0;

    document.getElementById('total-helped').textContent = totalHelped;
    document.getElementById('avg-rating').textContent = avgRating;
    document.getElementById('popular-myth').textContent = doctorData.metrics.popularMyth;
    document.getElementById('verification-status').textContent = 'Verified ✓';

    displayMyththRankings();
}

function displayMyththRankings() {
    const container = document.getElementById('myths-ranking');
    const sorted = [...doctorData.contributions].sort((a, b) => b.helpCount - a.helpCount);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No usage data yet</p></div>';
        return;
    }

    container.innerHTML = sorted.map((contribution, index) => `
        <div class="myth-ranking-item">
            <div class="rank">#${index + 1}</div>
            <div class="myth-ranking-info">
                <h4>${contribution.topic}</h4>
                <p>"${contribution.myth}"</p>
            </div>
            <div class="myth-ranking-stats">
                <div class="myth-stat">
                    <div class="myth-stat-value">${contribution.helpCount}</div>
                    <div class="myth-stat-label">Helped</div>
                </div>
                <div class="myth-stat">
                    <div class="myth-stat-value">${contribution.rating}</div>
                    <div class="myth-stat-label">Rating</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// Profile Tab
// ============================================================================

function loadProfileData() {
    document.getElementById('edit-name').value = doctorData.name;
    document.getElementById('edit-email').value = doctorData.email;
    document.getElementById('edit-specialization').value = doctorData.credential.split(',')[0];
    document.getElementById('edit-bio').value = doctorData.bio;

    document.getElementById('profile-contributions').textContent = doctorData.metrics.totalContributions;
    document.getElementById('profile-joined').textContent = doctorData.metrics.joinedDate;
    document.getElementById('profile-verified').textContent = '✓';
}

function updateProfile() {
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const specialization = document.getElementById('edit-specialization').value;
    const bio = document.getElementById('edit-bio').value;

    if (!name || !email) {
        alert('❌ Please fill required fields');
        return;
    }

    doctorData.name = name;
    doctorData.email = email;
    doctorData.bio = bio;

    saveDoctorData();

    // Update header
    document.getElementById('doctor-name').textContent = name;
    document.getElementById('profile-name').textContent = name;

    alert('✅ Profile updated successfully');
}

// ============================================================================
// Utility Functions
// ============================================================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('doctor_data');
        alert('Logged out successfully');
        window.location.href = 'index.html';
    }
}

// Debug functions
const doctorDebug = {
    addMythExample: () => {
        const newContribution = {
            id: 'M' + Date.now(),
            topic: 'Fertility Impact',
            myth: 'Vaccines cause infertility',
            response: 'There is no evidence that vaccines affect fertility. Millions of vaccinated women have had healthy pregnancies.',
            status: 'verified',
            helpCount: Math.floor(Math.random() * 300),
            rating: (Math.random() * 2 + 3).toFixed(1),
            date: new Date().toISOString().split('T')[0]
        };
        doctorData.contributions.push(newContribution);
        saveDoctorData();
        alert('Sample myth added');
    },
    getData: () => {
        console.log('Doctor Data:', doctorData);
        return doctorData;
    },
    clearData: () => {
        if (confirm('Clear all data?')) {
            doctorData.contributions = [];
            saveDoctorData();
            location.reload();
        }
    }
};
