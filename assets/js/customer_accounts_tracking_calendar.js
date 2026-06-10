/*
 * Customer Accounts Tracking Calendar JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Month names array for conversion
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Function to update modal header with month and year
    function updateModalHeader(month, year) {
        const modalMonthYear = document.getElementById('modal-month-year');
        if (modalMonthYear) {
            const monthName = monthNames[parseInt(month) - 1] || 'Unknown';
            modalMonthYear.textContent = `${monthName} ${year}`;
        }
    }

    // Function to get current month and year
    function getCurrentMonthAndYear() {
        const activeTab = document.querySelector('.month-tab.active');
        const yearSelect = document.getElementById('year-select');

        const month = activeTab ? activeTab.dataset.month : (new Date().getMonth() + 1);
        const year = yearSelect ? yearSelect.value : new Date().getFullYear();

        return { month, year };
    }

    // Month tabs functionality
    const monthTabs = document.querySelectorAll('.month-tab');
    const monthPanes = document.querySelectorAll('.month-pane');

    monthTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const month = this.dataset.month;

            // Update active tab
            monthTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding pane
            monthPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.dataset.month === month) {
                    pane.classList.add('active');
                }
            });

            // Update monthly totals for the selected month
            if (typeof updateMonthlyTotals === 'function') {
                updateMonthlyTotals(month);
            }

            // Update modal header if modal is open
            const monthlyTotalsModal = document.getElementById('monthlyTotalsModal');
            if (monthlyTotalsModal && monthlyTotalsModal.style.display === 'block') {
                const { month: currentMonth, year: currentYear } = getCurrentMonthAndYear();
                updateModalHeader(currentMonth, currentYear);
            }
        });
    });

    // Year selector functionality
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            const year = this.value;

            // Update modal header if modal is open
            const monthlyTotalsModal = document.getElementById('monthlyTotalsModal');
            if (monthlyTotalsModal && monthlyTotalsModal.style.display === 'block') {
                const { month: currentMonth } = getCurrentMonthAndYear();
                updateModalHeader(currentMonth, year);
            }

            window.location.href = `${window.location.pathname}?year=${year}`;
        });
    }

    // Modal functionality
    const dayDetailsModal = document.getElementById('dayDetailsModal');
    const dayDetailsCloseBtn = dayDetailsModal ? dayDetailsModal.querySelector('.close') : null;
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');

    // Close day details modal
    if (dayDetailsCloseBtn) {
        dayDetailsCloseBtn.addEventListener('click', function() {
            dayDetailsModal.style.display = 'none';
        });
    }

    // Monthly totals modal functionality
    const monthlyTotalsModal = document.getElementById('monthlyTotalsModal');
    const monthlyTotalsCloseBtn = monthlyTotalsModal ? monthlyTotalsModal.querySelector('.close') : null;
    const monthlySummaryBtn = document.getElementById('monthly-summary-btn');

    // Close monthly totals modal
    if (monthlyTotalsCloseBtn) {
        monthlyTotalsCloseBtn.addEventListener('click', function() {
            monthlyTotalsModal.style.display = 'none';
        });
    }

    // Monthly summary button click handler
    if (monthlySummaryBtn) {
        monthlySummaryBtn.addEventListener('click', function() {
            if (monthlyTotalsModal) {
                monthlyTotalsModal.style.display = 'block';

                // Update with current month's data
                const { month, year } = getCurrentMonthAndYear();

                if (typeof updateMonthlyTotals === 'function') {
                    updateMonthlyTotals(month);
                }

                updateModalHeader(month, year);
            }
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (dayDetailsModal && event.target === dayDetailsModal) {
            dayDetailsModal.style.display = 'none';
        }
        if (monthlyTotalsModal && event.target === monthlyTotalsModal) {
            monthlyTotalsModal.style.display = 'none';
        }
    });

    // Day click handler
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const date = this.dataset.date;

            // Normalize date to PHP-friendly format (Y-m-d 00:00:00) with leading zeros
            const [year, month, dayNum] = date.split('-');

            // Use the Date constructor with individual components
            const dateObj = new Date(
                parseInt(year),
                parseInt(month) - 1, // months are 0-indexed
                parseInt(dayNum),
                12, 0, 0 // set to noon to avoid timezone issues
            );

            const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });


            // Pad month and day with leading zeros if needed
            const paddedMonth = month.padStart(2, '0');
            const paddedDay = dayNum.padStart(2, '0');

            const normalizedDate = `${year}-${paddedMonth}-${paddedDay}`;

            // Show loading state
            if (modalDate) modalDate.textContent = formattedDate;
            if (modalBody) modalBody.innerHTML = '<div class="loading">Loading details...</div>';
            if (dayDetailsModal) dayDetailsModal.style.display = 'block';

            // URL encode the date to handle spaces properly
            const encodedDate = encodeURIComponent(normalizedDate);

            // Fetch day details via AJAX with normalized date
            fetch(`/customer/accounts/tracking/calendar/day-details/${encodedDate}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('No data available.');
                    }
                    return response.text();
                })
                .then(html => {
                    if (modalBody) modalBody.innerHTML = html;
                })
                .catch(error => {
                    console.error('Error fetching day details:', error);
                    if (modalBody) modalBody.innerHTML = `<div class="error">Error loading details: ${error.message}</div>`;
                });
        });
    });

    // Monthly totals functionality
    if (monthlyTotalsModal) {
        const monthlyTotalsModalCard = monthlyTotalsModal.querySelector('.monthly-totals-card');
        if (monthlyTotalsModalCard) {
            // Get data from hidden elements
            const monthlyTotalsDataEl = document.getElementById('monthly-totals-data');
            const accountNamesEl = document.getElementById('account-names-data');

            const monthlyTotalsData = monthlyTotalsDataEl ? JSON.parse(monthlyTotalsDataEl.textContent) : {};
            const accountNames = accountNamesEl ? JSON.parse(accountNamesEl.textContent) : {};

            const incomeAmount = monthlyTotalsModalCard.querySelector('.totals-summary .income .amount');
            const expenseAmount = monthlyTotalsModalCard.querySelector('.totals-summary .expense .amount');
            const netAmount = monthlyTotalsModalCard.querySelector('.totals-summary .net .amount');
            const balancesContent = monthlyTotalsModalCard.querySelector('.balances-content');
            const scrollUpBtn = monthlyTotalsModalCard.querySelector('.scroll-up');
            const scrollDownBtn = monthlyTotalsModalCard.querySelector('.scroll-down');

            // Scroll functionality
            let scrollPosition = 0;
            const scrollStep = 30;

            // Update totals for a specific month
            window.updateMonthlyTotals = function(month) {
                const totals = monthlyTotalsData[month] || {
                    totalIncomes: 0,
                    totalExpenses: 0,
                    accountBalances: {}
                };

                // Convert all values to numbers to ensure they're numeric
                const numericTotals = {
                    totalIncomes: parseFloat(totals.totalIncomes) || 0,
                    totalExpenses: parseFloat(totals.totalExpenses) || 0,
                    accountBalances: {}
                };

                // Convert account balances to numbers
                Object.entries(totals.accountBalances).forEach(([accountId, balance]) => {
                    numericTotals.accountBalances[accountId] = parseFloat(balance) || 0;
                });

                // Update summary with balance classes
                if (incomeAmount) {
                    incomeAmount.textContent = `$${numericTotals.totalIncomes.toFixed(2)}`;
                    incomeAmount.className = 'amount ' + (numericTotals.totalIncomes >= 0 ? 'positive-balance' : 'negative-balance');
                }

                if (expenseAmount) {
                    expenseAmount.textContent = `$${numericTotals.totalExpenses.toFixed(2)}`;
                    expenseAmount.className = 'amount ' + (numericTotals.totalExpenses >= 0 ? 'negative-balance': 'positive-balance');
                }

                if (netAmount) {
                    const netValue = numericTotals.totalIncomes - numericTotals.totalExpenses;
                    netAmount.textContent = `$${netValue.toFixed(2)}`;
                    netAmount.className = 'amount ' + (netValue >= 0 ? 'positive-balance' : 'negative-balance');
                }

                // Update balances
                if (balancesContent) {
                    balancesContent.innerHTML = '';
                    Object.entries(numericTotals.accountBalances).forEach(([accountId, balance]) => {
                        const bClass = balance >= 0 ? 'positive-balance' : 'negative-balance';
                        const accountName = accountNames[accountId] || `Account ${accountId}`;
                        const balanceItem = document.createElement('div');
                        balanceItem.className = 'balance-item';
                        balanceItem.innerHTML = `
                            <span class="account-name">${accountName}</span>
                            <span class="account-balance ${bClass}">$${balance.toFixed(2)}</span>
                        `;
                        balancesContent.appendChild(balanceItem);
                    });
                }

                // Reset scroll position
                scrollPosition = 0;
                if (balancesContent) balancesContent.style.transform = 'translateY(0)';
            };

            if (scrollUpBtn && scrollDownBtn && balancesContent) {
                scrollUpBtn.addEventListener('click', () => {
                    scrollPosition = Math.max(0, scrollPosition - scrollStep);
                    balancesContent.style.transform = `translateY(-${scrollPosition}px)`;
                });

                scrollDownBtn.addEventListener('click', () => {
                    const maxScroll = Math.max(0, balancesContent.scrollHeight - balancesContent.parentElement.clientHeight);
                    scrollPosition = Math.min(maxScroll, scrollPosition + scrollStep);
                    balancesContent.style.transform = `translateY(-${scrollPosition}px)`;
                });
            }

            // Initialize with current month
            const { month: currentMonth, year: currentYear } = getCurrentMonthAndYear();

            // Only call if the function exists
            if (typeof updateMonthlyTotals === 'function') {
                updateMonthlyTotals(currentMonth);
            }

            // Initialize the modal header with current month and year
            updateModalHeader(currentMonth, currentYear);
        }
    }

    // Auto-expand current month tab
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthTab = document.querySelector(`.month-tab[data-month="${currentMonth}"]`);
    if (currentMonthTab && !currentMonthTab.classList.contains('active')) {
        currentMonthTab.click();
    } else if (currentMonthTab && currentMonthTab.classList.contains('active')) {
        // If current month is already active, still update the totals
        if (typeof updateMonthlyTotals === 'function') {
            updateMonthlyTotals(currentMonth);
        }
    }
});