/* assets/js/customer_dashboard.js */
// Simple JavaScript for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Removed the click event listener that was preventing navigation

    // Simulate chart loading
    const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
    chartPlaceholders.forEach(chart => {
        chart.innerHTML = '<div style="text-align:center;"><i class="fas fa-chart-bar" style="font-size:48px;margin-bottom:15px;color:#56CFE1;"></i><p>Interactive Chart Loading...</p></div>';
    });
});