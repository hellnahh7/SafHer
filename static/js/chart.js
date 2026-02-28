// --- chart.js ---
// Handles Chart.js initialization and updates for Safety Insights

let safetyChartInstance = null;

function initChart() {
    const ctx = document.getElementById('safety-chart').getContext('2d');

    // Default empty chart
    safetyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Crowd Level', 'Lighting', 'Incidents * -1'],
            datasets: [{
                label: 'Safety Factors (10 = Best)',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.6)',  // Green
                    'rgba(241, 196, 15, 0.6)',  // Yellow
                    'rgba(231, 76, 60, 0.6)'    // Red
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateChart(factors) {
    // Math logic for visualization:
    // Crowd and lighting: higher is safer (0-10)
    // Incidents: lower is safer, so we visualize 10 - incident_count for uniformity

    const vizIncidents = Math.max(0, 10 - (factors.incidents * 1.5));

    safetyChartInstance.data.datasets[0].data = [
        factors.crowd,
        factors.lighting,
        vizIncidents
    ];

    // Update theme specific grids if night mode active (using CSS variable check or just global hack)
    const isNight = document.body.classList.contains('theme-night');
    const gridColor = isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const textColor = isNight ? '#AAAAAA' : '#666666';

    safetyChartInstance.options.scales.y.grid.color = gridColor;
    safetyChartInstance.options.scales.x.ticks.color = textColor;
    safetyChartInstance.options.scales.y.ticks.color = textColor;

    safetyChartInstance.update();
}
