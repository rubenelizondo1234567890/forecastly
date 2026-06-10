// assets/js/customer_net_balance_forecasting.js
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('periodSelect');
    const chartCanvas = document.getElementById('projectionChart');

    let projectionChart = null;

    function loadNetBalanceProjections() {
        const period = periodSelect.value;

        if (!period) {
            if (projectionChart) {
                projectionChart.destroy();
                projectionChart = null;
            }
            document.getElementById('summaryInfo').style.display = 'none';
            return;
        }

        fetch(`${window.NET_BALANCE_PROJECTIONS_URL}?period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderChart(data);
                    updateSummaryInfo(data);
                } else {
                    console.error('Error loading projections:', data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function renderChart(data) {
        const ctx = chartCanvas.getContext('2d');

        if (projectionChart) {
            projectionChart.destroy();
        }

        // Calculate appropriate Y-axis scaling
        const allValues = [...data.data.income, ...data.data.expense, ...data.data.net];
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);

        // Ensure we have a reasonable range for the Y-axis
        const range = maxValue - minValue;
        const padding = range * 0.15; // 10% padding

        // Calculate appropriate step size for grid lines
        const targetGridLines = 30;
        const rawStepSize = range / targetGridLines;

        // Find the appropriate step size for the scale
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStepSize)));
        let stepSize = Math.ceil(rawStepSize / magnitude) * magnitude;

        // Ensure stepSize is at least 100 for better visualization
        stepSize = Math.max(stepSize, 100);

        // Calculate min and max for the Y-axis
        let yMin = minValue - padding;
        let yMax = maxValue + padding;

        // Adjust min and max to be multiples of stepSize
        yMin = Math.floor(yMin / stepSize) * stepSize;
        yMax = Math.ceil(yMax / stepSize) * stepSize;

        // Generate ticks for the Y-axis
        const ticks = [];
        for (let i = yMin; i <= yMax; i += stepSize) {
            ticks.push(i);
        }

        projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.data.income,
                        borderColor: '#128370',
                        backgroundColor: 'rgba(18, 131, 112, 0.1)',
                        tension: 0.3,
                        fill: false,
                        pointBackgroundColor: '#128370',
                        pointBorderColor: '#fff',
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Expense',
                        data: data.data.expense,
                        borderColor: '#FF9E6D',
                        backgroundColor: 'rgba(255, 158, 109, 0.1)',
                        tension: 0.3,
                        fill: false,
                        pointBackgroundColor: '#FF9E6D',
                        pointBorderColor: '#fff',
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Net Balance',
                        data: data.data.net,
                        borderColor: '#5E60CE',
                        backgroundColor: 'rgba(94, 96, 206, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: '#5E60CE',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Net Balance ${periodSelect.options[periodSelect.selectedIndex].text} Projection`,
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const sign = value < 0 ? '-' : '';
                                return `${context.dataset.label}: ${sign}$${Math.abs(value).toLocaleString()}`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        min: yMin,
                        max: yMax,
                        ticks: {
                            stepSize: stepSize,
                            callback: function(value) {
                                if (value === 0) return '$0';
                                const sign = value < 0 ? '-' : '';
                                return sign + '$' + Math.abs(value).toLocaleString();
                            }
                        },
                        grid: {
                            color: function(context) {
                                return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                            },
                            lineWidth: function(context) {
                                return context.tick.value === 0 ? 2 : 1;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    function updateSummaryInfo(data) {
        // Get the latest values
        const lastIndex = data.data.income.length - 1;
        const income = data.data.income[lastIndex];
        const expense = data.data.expense[lastIndex];
        const net = data.data.net[lastIndex];

        // Format values with proper sign
        document.getElementById('totalIncome').textContent = '$' + income.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        document.getElementById('totalExpense').textContent = '$' + expense.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const netBalanceEl = document.getElementById('netBalance');
        netBalanceEl.textContent = (net < 0 ? '-$' : '$') + Math.abs(net).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Color the net balance based on positive or negative
        netBalanceEl.classList.remove('net-positive', 'net-negative');
        if (net >= 0) {
            netBalanceEl.classList.add('net-positive');
        } else {
            netBalanceEl.classList.add('net-negative');
        }

        // Show the summary section
        document.getElementById('summaryInfo').style.display = 'block';
    }

    periodSelect.addEventListener('change', loadNetBalanceProjections);
});