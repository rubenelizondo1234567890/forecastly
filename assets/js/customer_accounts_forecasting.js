// assets/js/customer_forecasting.js
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', function() {
    const accountSelect = document.getElementById('accountSelect');
    const periodSelect = document.getElementById('periodSelect');
    const chartCanvas = document.getElementById('projectionChart');
    const currentBalanceEl = document.getElementById('currentBalance');
    const accountNameEl = document.getElementById('accountName');

    let projectionChart = null;

    function loadAccountProjections() {
        const accountId = accountSelect.value;
        const period = periodSelect.value;

        if (!accountId || !period) {
            if (projectionChart) {
                projectionChart.destroy();
                projectionChart = null;
            }
            return;
        }

        // Use the global variable set in the Twig template
        fetch(`${window.ACCOUNT_PROJECTIONS_URL}?account_id=${accountId}&period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderChart(data, period);
                    updateAccountInfo(data.account);
                } else {
                    console.error('Error loading projections:', data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function renderChart(data, period) {
        const ctx = chartCanvas.getContext('2d');

        if (projectionChart) {
            projectionChart.destroy();
        }

        const account = data.account;
        const hasMaxLimit = account.hasMaxLimit && account.maxLimit > 0;
        const maxLimit = hasMaxLimit ? parseFloat(account.maxLimit) : null;

        // Find the first index where balance <= 0 and first index where balance >= maxLimit
        let firstNegativeIndex = -1;
        let firstMaxLimitIndex = -1;

        for (let i = 0; i < data.data.length; i++) {
            if (data.data[i] <= 0 && firstNegativeIndex === -1) {
                firstNegativeIndex = i;
            }
            if (hasMaxLimit && data.data[i] >= maxLimit && firstMaxLimitIndex === -1) {
                firstMaxLimitIndex = i;
            }
        }

        // Determine which condition occurs first and is relevant
        const hasNegativeCondition = firstNegativeIndex !== -1;
        const hasMaxLimitCondition = firstMaxLimitIndex !== -1;

        let firstConditionIndex = -1;
        let conditionType = null;

        if (hasNegativeCondition && hasMaxLimitCondition) {
            if (firstNegativeIndex <= firstMaxLimitIndex) {
                firstConditionIndex = firstNegativeIndex;
                conditionType = 'negative';
            } else {
                firstConditionIndex = firstMaxLimitIndex;
                conditionType = 'maxLimit';
            }
        } else if (hasNegativeCondition) {
            firstConditionIndex = firstNegativeIndex;
            conditionType = 'negative';
        } else if (hasMaxLimitCondition) {
            firstConditionIndex = firstMaxLimitIndex;
            conditionType = 'maxLimit';
        }

        // Create datasets for continuous line with segment coloring
        const datasets = [];

        if (firstConditionIndex === -1) {
            // All normal - single dataset
            datasets.push({
                label: account.name + ' Projection',
                data: data.data,
                borderColor: '#5E60CE',
                backgroundColor: 'rgba(94, 96, 206, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#5E60CE',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            });
        } else {
            // Single dataset with segment coloring for continuous line
            datasets.push({
                label: account.name + ' Projection',
                data: data.data,
                backgroundColor: conditionType === 'negative' ? 'rgba(255, 99, 132, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: function(context) {
                    const index = context.dataIndex;
                    return index >= firstConditionIndex ?
                        (conditionType === 'negative' ? '#ff6384' : '#ffa500') : '#5E60CE';
                },
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                segment: {
                    borderColor: function(context) {
                        // Change color at the segment where we cross into the condition territory
                        if (context.p0DataIndex >= firstConditionIndex ||
                            context.p1DataIndex >= firstConditionIndex) {
                            return conditionType === 'negative' ? '#ff6384' : '#ffa500';
                        }
                        return '#5E60CE';
                    }
                }
            });

            // Add a separate dataset just for the normal fill area
            datasets.push({
                label: 'Normal Projection Area',
                data: data.data.map((value, index) => index < firstConditionIndex ? value : null),
                backgroundColor: 'rgba(94, 96, 206, 0.1)',
                borderColor: 'transparent',
                tension: 0.3,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 0
            });
        }

        projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${account.name} ${periodSelect.options[periodSelect.selectedIndex].text} Projection`,
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label && !label.includes('Area')) { // Skip area-only datasets in tooltip
                                    label += ': ';
                                }
                                if (context.parsed.y !== null && !context.dataset.label.includes('Area')) {
                                    label += '$' + context.parsed.y.toLocaleString();

                                    // Add accuracy note for condition periods
                                    if (firstConditionIndex !== -1 && context.dataIndex >= firstConditionIndex) {
                                        if (conditionType === 'negative') {
                                            label += ' (Low Balance - Reduced Accuracy)';
                                        } else if (conditionType === 'maxLimit') {
                                            label += ' (Max Limit Reached - Reduced Accuracy)';
                                        }
                                    }
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        display: false, // Hide legend since we have one continuous line
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: period == 1 ? 12 : 20,
                            autoSkip: true,
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 0, 0, 0.5)';
                                }
                                // Add a grid line for max limit if applicable
                                if (hasMaxLimit && context.tick.value === maxLimit) {
                                    return 'rgba(255, 165, 0, 0.5)';
                                }
                                return 'rgba(0, 0, 0, 0.1)';
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });

        // Add warning message if balance goes negative or reaches max limit
        if (firstConditionIndex !== -1) {
            showConditionWarning(conditionType, hasMaxLimit ? maxLimit : null);
        } else {
            hideConditionWarning();
        }
    }

    function showConditionWarning(conditionType, maxLimit) {
        // Remove existing warning if any
        hideConditionWarning();

        // Create warning element
        const warningEl = document.createElement('div');
        warningEl.className = 'alert alert-warning';

        let warningMessage = '';
        if (conditionType === 'negative') {
            warningMessage = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Note:</strong> The red portion of the projection indicates periods where the account balance is low or negative.
                Forecast accuracy may be reduced as the account may not have sufficient funds for planned expenses.
            `;
        } else if (conditionType === 'maxLimit') {
            warningMessage = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Note:</strong> The orange portion of the projection indicates periods where the account balance has reached its maximum limit of $${maxLimit.toLocaleString()}.
                Forecast accuracy may be reduced as the account cannot consume more transactions.
            `;
        }

        warningEl.innerHTML = warningMessage;

        // Insert after the chart container
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.parentNode.insertBefore(warningEl, chartContainer.nextSibling);
    }

    function hideConditionWarning() {
        const existingWarning = document.querySelector('.alert-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
    }

    function updateAccountInfo(account) {
        accountNameEl.textContent = account.name;
        currentBalanceEl.textContent = '$' + parseFloat(account.currentBalance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Show account info section when we have data
        document.getElementById('accountInfo').style.display = 'block';
    }

    accountSelect.addEventListener('change', loadAccountProjections);
    periodSelect.addEventListener('change', loadAccountProjections);
});
