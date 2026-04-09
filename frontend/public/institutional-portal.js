/**
 * Institutional Portal - JavaScript Logic
 * Manages groups, assessments, and organizational dashboards
 */

// ============================================================================
// Global State
// ============================================================================

let currentTab = 'dashboard';
let organizationData = {
    name: 'School of Science',
    type: 'school',
    email: 'admin@school.edu',
    groups: [],
    assessments: [],
    metrics: {
        totalAssessments: 0,
        avgHesitancy: 0,
        completionRate: 0,
        distribution: { confident: 35, mild: 28, moderate: 22, strong: 15 }
    }
};

// Sample assessment data
const sampleAssessments = [
    { id: 'A001', group: 'Class A', score: 28, tier: 'mild', date: '2026-04-07', status: 'Complete' },
    { id: 'A002', group: 'Class B', score: 45, tier: 'moderate', date: '2026-04-06', status: 'Complete' },
    { id: 'A003', group: 'Class C', score: 72, tier: 'strong', date: '2026-04-05', status: 'Complete' }
];

// Sample groups data
const sampleGroups = [
    { id: 'G001', name: 'Science Department', desc: 'Faculty and students', size: 150, assessments: 45, avgScore: 35 },
    { id: 'G002', name: 'Medical Wing', desc: 'Medical staff', size: 200, assessments: 82, avgScore: 28 }
];

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadOrganizationData();
    initializeDashboard();
    setupEventListeners();
});

function loadOrganizationData() {
    const savedData = localStorage.getItem('institutional_data');
    if (savedData) {
        organizationData = JSON.parse(savedData);
    } else {
        // Load sample data
        organizationData.groups = [...sampleGroups];
        organizationData.assessments = [...sampleAssessments];
        organizationData.metrics.totalAssessments = sampleAssessments.length;
        organizationData.metrics.avgHesitancy = 48;
        saveOrganizationData();
    }

    // Update header
    document.getElementById('org-name').textContent = organizationData.name;
}

function saveOrganizationData() {
    localStorage.setItem('institutional_data', JSON.stringify(organizationData));
}

function initializeDashboard() {
    updateMetrics();
    displayRecentAssessments();
    populateGroupFilters();
    displayGroups();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-assessments');
    if (searchInput) {
        searchInput.addEventListener('input', filterAssessments);
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

    // Hide all sidebar items as active
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

    currentTab = tab;

    // Load content for specific tabs
    if (tab === 'assessments') {
        displayAssessments();
    } else if (tab === 'groups') {
        displayGroups();
    }
}

// ============================================================================
// Dashboard Functions
// ============================================================================

function updateMetrics() {
    const totalAssessments = organizationData.assessments.length;
    const avgHesitancy = organizationData.metrics.avgHesitancy;
    const activeGroups = organizationData.groups.length;
    const completionRate = totalAssessments > 0 ? 90 : 0;

    document.getElementById('total-assessments').textContent = totalAssessments;
    document.getElementById('avg-hesitancy').textContent = avgHesitancy;
    document.getElementById('active-groups').textContent = activeGroups;
    document.getElementById('completion-rate').textContent = Math.round(completionRate) + '%';

    // Update distribution chart
    const dist = organizationData.metrics.distribution;
    document.getElementById('bar-confident').textContent = dist.confident + '%';
    document.getElementById('bar-mild').textContent = dist.mild + '%';
    document.getElementById('bar-moderate').textContent = dist.moderate + '%';
    document.getElementById('bar-strong').textContent = dist.strong + '%';
}

function displayRecentAssessments() {
    const container = document.getElementById('recent-assessments');
    const recentItems = organizationData.assessments.slice(0, 5);

    if (recentItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No assessments yet. Start by creating a group!</p></div>';
        return;
    }

    container.innerHTML = recentItems.map(assessment => `
        <div class="assessment-item">
            <div class="assessment-info">
                <h4>${assessment.group} (${assessment.id})</h4>
                <p>Score: ${assessment.score} | ${assessment.date}</p>
            </div>
            <span class="assessment-badge badge-${assessment.tier}">${assessment.tier}</span>
        </div>
    `).join('');
}

// ============================================================================
// Assessments Tab
// ============================================================================

function displayAssessments() {
    const tbody = document.getElementById('assessments-tbody');

    if (organizationData.assessments.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="empty-state">No assessments found</td></tr>';
        return;
    }

    tbody.innerHTML = organizationData.assessments.map(assessment => `
        <tr>
            <td><strong>${assessment.id}</strong></td>
            <td>${assessment.group}</td>
            <td><strong>${assessment.score}</strong></td>
            <td><span class="assessment-badge badge-${assessment.tier}">${assessment.tier}</span></td>
            <td>${assessment.date}</td>
            <td><span style="color: #10b981; font-weight: 600;">✓ ${assessment.status}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewAssessment('${assessment.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

function filterAssessments() {
    const searchTerm = document.getElementById('search-assessments').value.toLowerCase();
    const tierFilter = document.getElementById('filter-tier').value;
    const groupFilter = document.getElementById('filter-group').value;

    const filtered = organizationData.assessments.filter(assessment => {
        const matchesSearch = assessment.id.toLowerCase().includes(searchTerm) ||
                             assessment.group.toLowerCase().includes(searchTerm);
        const matchesTier = !tierFilter || assessment.tier === tierFilter;
        const matchesGroup = !groupFilter || assessment.group === groupFilter;

        return matchesSearch && matchesTier && matchesGroup;
    });

    const tbody = document.getElementById('assessments-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No assessments found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(assessment => `
        <tr>
            <td><strong>${assessment.id}</strong></td>
            <td>${assessment.group}</td>
            <td><strong>${assessment.score}</strong></td>
            <td><span class="assessment-badge badge-${assessment.tier}">${assessment.tier}</span></td>
            <td>${assessment.date}</td>
            <td><span style="color: #10b981; font-weight: 600;">✓ ${assessment.status}</span></td>
            <td><button class="btn btn-sm btn-secondary" onclick="viewAssessment('${assessment.id}')">View</button></td>
        </tr>
    `).join('');
}

function populateGroupFilters() {
    const groupSelect = document.getElementById('filter-group');
    organizationData.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.name;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}

function viewAssessment(id) {
    alert(`Viewing assessment: ${id}`);
}

function exportAssessments() {
    const csvContent = 'data:text/csv;charset=utf-8,' +
        'ID,Group,Score,Tier,Date,Status\n' +
        organizationData.assessments.map(a =>
            `${a.id},${a.group},${a.score},${a.tier},${a.date},${a.status}`
        ).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `assessments_export_${new Date().getTime()}.csv`);
    link.click();

    alert('✅ Assessments exported successfully');
}

// ============================================================================
// Groups Tab
// ============================================================================

function displayGroups() {
    const container = document.getElementById('groups-grid');

    if (organizationData.groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p>No groups created yet.</p>
                <button class="btn btn-primary btn-lg" onclick="openCreateGroupModal()">Create First Group</button>
            </div>
        `;
        return;
    }

    container.innerHTML = organizationData.groups.map(group => `
        <div class="group-card">
            <h3>${group.name}</h3>
            <p>${group.desc}</p>
            <div class="group-stats">
                <div class="group-stat">
                    <div class="value">${group.size}</div>
                    <div class="label">Members</div>
                </div>
                <div class="group-stat">
                    <div class="value">${group.assessments}</div>
                    <div class="label">Assessments</div>
                </div>
                <div class="group-stat">
                    <div class="value">${group.avgScore}</div>
                    <div class="label">Avg Score</div>
                </div>
            </div>
            <div class="group-actions">
                <button class="btn btn-secondary btn-sm" onclick="editGroup('${group.id}')">Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="deleteGroup('${group.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openCreateGroupModal() {
    document.getElementById('create-group-modal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function createGroup() {
    const name = document.getElementById('group-name-input').value;
    const description = document.getElementById('group-description-input').value;
    const size = parseInt(document.getElementById('group-size-input').value) || 0;
    const manager = document.getElementById('group-manager-input').value;

    if (!name || !description || !size) {
        alert('Please fill all fields');
        return;
    }

    const newGroup = {
        id: 'G' + Date.now(),
        name,
        desc: description,
        size,
        manager,
        assessments: 0,
        avgScore: 0
    };

    organizationData.groups.push(newGroup);
    saveOrganizationData();

    // Clear form
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-description-input').value = '';
    document.getElementById('group-size-input').value = '';
    document.getElementById('group-manager-input').value = '';

    closeModal('create-group-modal');
    displayGroups();
    updateMetrics();

    alert('✅ Group created successfully');
}

function editGroup(groupId) {
    alert(`Editing group: ${groupId}`);
}

function deleteGroup(groupId) {
    if (confirm('Are you sure you want to delete this group?')) {
        organizationData.groups = organizationData.groups.filter(g => g.id !== groupId);
        saveOrganizationData();
        displayGroups();
        alert('✅ Group deleted');
    }
}

// ============================================================================
// Reports Tab
// ============================================================================

function generateReport(type) {
    const reportNames = {
        summary: 'Summary Report',
        group: 'Group Performance Report',
        trends: 'Trend Analysis Report',
        risk: 'Risk Assessment Report'
    };

    alert(`📊 Generating ${reportNames[type]}...\n\nThis will open a detailed PDF report.`);
}

// ============================================================================
// Settings Tab
// ============================================================================

function saveSettings() {
    const orgName = document.getElementById('org-name-input').value;
    const orgType = document.getElementById('org-type-input').value;
    const contactEmail = document.getElementById('contact-email-input').value;

    if (!orgName || !contactEmail) {
        alert('Please fill all required fields');
        return;
    }

    organizationData.name = orgName;
    organizationData.type = orgType;
    organizationData.email = contactEmail;

    saveOrganizationData();
    document.getElementById('org-name').textContent = orgName;

    alert('✅ Settings saved successfully');
}

// ============================================================================
// Utility Functions
// ============================================================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('institutional_data');
        alert('Logged out successfully');
        window.location.href = 'index.html';
    }
}

// Handle modal close on outside click
document.addEventListener('click', (event) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Debug functions
const institutionalDebug = {
    addAssessment: () => {
        const newAssessment = {
            id: 'A' + Date.now(),
            group: 'Demo Group',
            score: Math.floor(Math.random() * 100),
            tier: ['confident', 'mild', 'moderate', 'strong'][Math.floor(Math.random() * 4)],
            date: new Date().toISOString().split('T')[0],
            status: 'Complete'
        };
        organizationData.assessments.push(newAssessment);
        saveOrganizationData();
        alert('Sample assessment added');
    },
    getData: () => {
        console.log('Institutional Data:', organizationData);
        return organizationData;
    },
    clearData: () => {
        if (confirm('Clear all data?')) {
            organizationData.groups = [];
            organizationData.assessments = [];
            saveOrganizationData();
            location.reload();
        }
    }
};
