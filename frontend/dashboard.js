const API_BASE = 'http://localhost:3000';

let allSessions = [];
let charts = {};

// Initialize dashboard
async function init() {
    await loadData();
    setupEventListeners();
    createCharts();
}

// Load data from API
async function loadData() {
    try {
        const response = await fetch(`${API_BASE}/admin/sessions`);
        if (!response.ok) throw new Error('Failed to fetch data');

        allSessions = await response.json();
        updateStats();
        updateTable();
        updateCharts();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update statistics cards
function updateStats() {
    const total = allSessions.length;
    const submitted = allSessions.filter(s => s.status === 'submitted').length;
    const pending = allSessions.filter(s => s.status === 'pending').length;
    const passed = allSessions.filter(s => s.face_match_result === 'PASS').length;
    const failed = allSessions.filter(s => s.face_match_result === 'FAIL').length;

    const completedWithResults = submitted > 0 ? submitted : 1;
    const passRate = submitted > 0 ? ((passed / completedWithResults) * 100).toFixed(1) : 0;

    const scores = allSessions
        .filter(s => s.face_match_score !== null)
        .map(s => s.face_match_score);
    const avgScore = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : 0;

    document.getElementById('totalSessions').textContent = total;
    document.getElementById('completedSessions').textContent = submitted;
    document.getElementById('pendingSessions').textContent = pending;
    document.getElementById('passRate').textContent = `${passRate}%`;

    document.getElementById('totalTrend').textContent = 'All time';
    document.getElementById('completedPercent').textContent = `${((submitted / (total || 1)) * 100).toFixed(0)}% of total`;
    document.getElementById('pendingPercent').textContent = `${((pending / (total || 1)) * 100).toFixed(0)}% of total`;
    document.getElementById('avgScore').textContent = `Avg: ${avgScore}`;
}

// Update sessions table
function updateTable() {
    const tbody = document.getElementById('sessionsTableBody');

    if (allSessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No sessions found</td></tr>';
        return;
    }

    tbody.innerHTML = allSessions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(session => `
            <tr>
                <td><code>${session.id.substring(0, 8)}...</code></td>
                <td><span class="status-badge ${session.status}">${session.status}</span></td>
                <td>${session.face_match_result
                ? `<span class="result-badge ${session.face_match_result.toLowerCase()}">${session.face_match_result}</span>`
                : '<span style="color: var(--text-muted);">-</span>'}</td>
                <td>${session.face_match_score !== null
                ? `<strong>${session.face_match_score.toFixed(2)}</strong>`
                : '<span style="color: var(--text-muted);">-</span>'}</td>
                <td>${formatDate(session.created_at)}</td>
                <td>${session.submitted_at ? formatDate(session.submitted_at) : '<span style="color: var(--text-muted);">-</span>'}</td>
                <td><button class="btn-view" onclick="viewSession('${session.id}')">View</button></td>
            </tr>
        `).join('');
}

// Create all charts
function createCharts() {
    createStatusChart();
    createResultChart();
    createScoreDistributionChart();
    createTimelineChart();
}

// Update all charts
function updateCharts() {
    Object.values(charts).forEach(chart => chart.destroy());
    createCharts();
}

// Status Distribution Chart
function createStatusChart() {
    const submitted = allSessions.filter(s => s.status === 'submitted').length;
    const pending = allSessions.filter(s => s.status === 'pending').length;

    const ctx = document.getElementById('statusChart').getContext('2d');
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Submitted', 'Pending'],
            datasets: [{
                data: [submitted, pending],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: { size: 12, family: 'Inter' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            }
        }
    });
}

// Face Match Results Chart
function createResultChart() {
    const passed = allSessions.filter(s => s.face_match_result === 'PASS').length;
    const failed = allSessions.filter(s => s.face_match_result === 'FAIL').length;
    const noResult = allSessions.filter(s => !s.face_match_result).length;

    const ctx = document.getElementById('resultChart').getContext('2d');
    charts.result = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pass', 'Fail', 'No Result'],
            datasets: [{
                data: [passed, failed, noResult],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(148, 163, 184, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(148, 163, 184, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: { size: 12, family: 'Inter' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

// Score Distribution Chart
function createScoreDistributionChart() {
    const scores = allSessions
        .filter(s => s.face_match_score !== null)
        .map(s => s.face_match_score);

    // Create bins for histogram
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const binCounts = new Array(bins.length - 1).fill(0);
    const binLabels = bins.slice(0, -1).map((bin, i) => `${bin.toFixed(1)} - ${bins[i + 1].toFixed(1)}`);

    scores.forEach(score => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (score >= bins[i] && score <= bins[i + 1]) {
                binCounts[i]++;
                break;
            }
        }
    });

    const ctx = document.getElementById('scoreDistChart').getContext('2d');
    charts.scoreDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Number of Sessions',
                data: binCounts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Timeline Chart
function createTimelineChart() {
    // Group sessions by date
    const dateGroups = {};
    allSessions.forEach(session => {
        const date = new Date(session.created_at).toLocaleDateString();
        dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const counts = sortedDates.map(date => dateGroups[date]);

    const ctx = document.getElementById('timelineChart').getContext('2d');
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Sessions Created',
                data: counts,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// View session details
async function viewSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE}/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session');

        const session = await response.json();
        showSessionModal(session);
    } catch (error) {
        console.error('Error loading session:', error);
        alert('Failed to load session details');
    }
}

// Show session modal
function showSessionModal(session) {
    const modal = document.getElementById('sessionModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="session-detail">
            <div class="detail-row">
                <div class="detail-label">Session ID</div>
                <div class="detail-value"><code>${session.id}</code></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="status-badge ${session.status}">${session.status}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Face Match Result</div>
                <div class="detail-value">${session.face_match_result
            ? `<span class="result-badge ${session.face_match_result.toLowerCase()}">${session.face_match_result}</span>`
            : '<span style="color: var(--text-muted);">Not available</span>'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Match Score</div>
                <div class="detail-value">${session.face_match_score !== null
            ? `<strong>${session.face_match_score.toFixed(2)}</strong> (${(session.face_match_score * 100).toFixed(0)}%)`
            : '<span style="color: var(--text-muted);">Not available</span>'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Created At</div>
                <div class="detail-value">${formatDate(session.created_at)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Submitted At</div>
                <div class="detail-value">${session.submitted_at ? formatDate(session.submitted_at) : '<span style="color: var(--text-muted);">Not submitted</span>'}</div>
            </div>
            
            ${session.id_front || session.id_back || session.selfie ? `
                <div style="margin-top: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">Captured Images</h3>
                    <div class="images-grid">
                        ${session.id_front ? `
                            <div class="image-preview">
                                <div class="image-label">ID Front</div>
                                <img src="${session.id_front}" alt="ID Front">
                            </div>
                        ` : ''}
                        ${session.id_back ? `
                            <div class="image-preview">
                                <div class="image-label">ID Back</div>
                                <img src="${session.id_back}" alt="ID Back">
                            </div>
                        ` : ''}
                        ${session.selfie ? `
                            <div class="image-preview">
                                <div class="image-label">Selfie</div>
                                <img src="${session.selfie}" alt="Selfie">
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    modal.classList.add('active');
}

// Export to CSV
function exportToCSV() {
    const headers = ['Session ID', 'Status', 'Result', 'Score', 'Created At', 'Submitted At'];
    const rows = allSessions.map(s => [
        s.id,
        s.status,
        s.face_match_result || '',
        s.face_match_score !== null ? s.face_match_score : '',
        s.created_at,
        s.submitted_at || ''
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        const btn = document.getElementById('refreshBtn');
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
        await loadData();
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    });

    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('sessionModal').classList.remove('active');
    });

    document.getElementById('sessionModal').addEventListener('click', (e) => {
        if (e.target.id === 'sessionModal') {
            document.getElementById('sessionModal').classList.remove('active');
        }
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    console.error(message);
    // Could add a toast notification here
}

// Initialize on load
init();
