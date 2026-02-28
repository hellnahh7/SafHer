// --- app.js ---
// Main application logic, API calls, and DOM manipulation

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map and Chart
    initMap();
    initChart();

    // 2. Fetch Initial Areas & Populate Selects
    fetchInitialData();

    // 3. Event Listeners
    setupEventListeners();
});

let allEmergencyLocations = [];

async function fetchInitialData() {
    try {
        const response = await fetch('/api/areas');
        const data = await response.json();

        populateDropdown('from-select', data.areas);
        populateDropdown('to-select', data.areas);

        allEmergencyLocations = data.emergency_locations;
        loadEmergencyMarkers(allEmergencyLocations); // From map.js

    } catch (error) {
        console.error("Failed to fetch initial data:", error);
    }
}

function populateDropdown(selectId, areas) {
    const select = document.getElementById(selectId);
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.name;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Theme Toggle
    const themeToggle = document.getElementById('day-night-toggle');
    themeToggle.addEventListener('change', (e) => toggleTheme(e.target.checked));

    // Route Form Submission
    const routeForm = document.getElementById('route-form');
    routeForm.addEventListener('submit', handleRouteSubmit);

    // SOS Tool
    document.getElementById('sos-btn').addEventListener('click', activateSOS);
    document.getElementById('cancel-sos').addEventListener('click', deactivateSOS);

    // Quick Navs
    document.getElementById('nav-police-btn').addEventListener('click', () => quickNav('police'));
    document.getElementById('nav-hospital-btn').addEventListener('click', () => quickNav('hospital'));
}

function toggleTheme(isNight) {
    const body = document.body;
    const warning = document.getElementById('night-warning');
    const toggleLabel = document.querySelector('.toggle-label');

    if (isNight) {
        body.classList.remove('theme-day');
        body.classList.add('theme-night');
        warning.style.display = 'block';
        toggleLabel.textContent = 'Night Mode';
    } else {
        body.classList.remove('theme-night');
        body.classList.add('theme-day');
        warning.style.display = 'none';
        toggleLabel.textContent = 'Day Mode';
    }

    // Ensure chart updates colors if visible
    if (safetyChartInstance) updateChart(safetyChartInstance.data.datasets[0].data, true); // True flag just to force update
}

async function handleRouteSubmit(e) {
    e.preventDefault();

    const fromVal = document.getElementById('from-select').value;
    const toVal = document.getElementById('to-select').value;

    if (!fromVal || !toVal) {
        alert("Please select both starting and destination locations.");
        return;
    }

    if (fromVal === toVal) {
        alert("Starting location and destination cannot be the same.");
        return;
    }

    const isNight = document.getElementById('day-night-toggle').checked;

    // UI Loading state
    const btnText = document.querySelector('.btn-text');
    const spinner = document.getElementById('btn-spinner');

    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: fromVal,
                to: toVal,
                is_night: isNight
            })
        });

        const data = await response.json();

        if (response.ok) {
            updateDashboard(data);
        } else {
            console.error("API Error", data.error);
        }
    } catch (error) {
        console.error("Submission failed", error);
    } finally {
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

function updateDashboard(routeData) {
    // 1. Show results container
    document.getElementById('results').style.display = 'block';

    // 2. Update Badge & Recommendation
    const badge = document.getElementById('safety-badge');
    badge.textContent = `${routeData.safety_info.badge} (${routeData.risk_score})`;
    badge.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(`--${routeData.safety_info.color}`);
    badge.style.color = (routeData.safety_info.color === "yellow") ? "#000" : "#FFF";

    document.getElementById('est-time').textContent = routeData.estimated_time;
    document.getElementById('recommendation-text').textContent = routeData.safety_info.action;

    // 3. Update Insight Cards
    document.getElementById('crowd-val').textContent = `${routeData.factors.crowd}/10`;
    document.getElementById('lighting-val').textContent = `${routeData.factors.lighting}/10`;
    document.getElementById('incident-val').textContent = routeData.factors.incidents;

    // 4. Update Chart (from chart.js)
    updateChart(routeData.factors);

    // 5. Update Map (from map.js)
    let hexColor;
    if (routeData.safety_info.color === 'green') hexColor = '#2ECC71';
    else if (routeData.safety_info.color === 'yellow') hexColor = '#F1C40F';
    else hexColor = '#E74C3C';

    drawRoute(routeData.coordinates, hexColor);
}

// SOS Logic
let sosTimer;
function activateSOS() {
    const modal = document.getElementById('sos-modal');
    modal.style.display = 'flex';

    // Simulate finding nearest help
    quickNav('police');

    sosTimer = setTimeout(() => {
        deactivateSOS();
        alert("SOS Alert Sent! Nearby emergency services have been notified of your location.");
    }, 3000);
}

function deactivateSOS() {
    clearTimeout(sosTimer);
    document.getElementById('sos-modal').style.display = 'none';
}

function quickNav(type) {
    // Simulate finding nearest. Filter by type and pick first for demo.
    const targets = allEmergencyLocations.filter(loc => loc.type === type);
    if (targets.length > 0) {
        const dest = targets[0];
        // Open map popup for nearest and draw route
        safherMap.setView(dest.coordinates, 15);
        drawRoute(dest.coordinates, '#E74C3C'); // Red route for emergency
    }
}
