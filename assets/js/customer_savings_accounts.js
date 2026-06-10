/* assets/js/customer_savings_accounts.js */

// Define global functions immediately
function toggleInterestRateByAccountType(select) {
    const interestRateGroup = document.getElementById('interest-rate-group');
    const interestRateInput = document.querySelector('input[name$="[annualInterestRate]"]');

    if (select.value) {
        // Show interest rate field if an account type is selected
        interestRateGroup.style.display = 'block';
    } else {
        // Hide and reset interest rate field if no account type is selected
        interestRateGroup.style.display = 'none';
        if (interestRateInput) {
            interestRateInput.value = '';
        }
    }
}

window.toggleMaxLimit = function(checkbox) {
    const maxLimitGroup = document.getElementById('max-limit-group');
    const maxLimitInput = document.querySelector('input[name$="[maxLimit]"]');

    if (checkbox.checked) {
        maxLimitGroup.style.display = 'block';
    } else {
        maxLimitGroup.style.display = 'none';
        // Reset the max limit value when hiding the field
        if (maxLimitInput) {
            maxLimitInput.value = '';
        }
    }
}

// Reconciliation modal functionality
window.openReconcileModal = function(accountId, projectedBalance) {
    const modal = document.getElementById('reconcileModal');
    const accountIdInput = document.getElementById('reconcileAccountId');
    const projectedBalanceInput = document.getElementById('projectedBalance');
    const realBalanceInput = document.getElementById('realBalance');
    const dateInput = document.getElementById('reconciliationDate');

    // Set values
    accountIdInput.value = accountId;
    projectedBalanceInput.value = parseFloat(projectedBalance).toFixed(2);
    realBalanceInput.value = '';

    // Set today's date as default
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    // Show modal
    modal.style.display = 'block';
}

window.closeReconcileModal = function() {
    const modal = document.getElementById('reconcileModal');
    modal.style.display = 'none';
}

window.handleReconcileSubmit = function(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('reconcileForm'));

    // Show loading state
    const submitBtn = document.querySelector('#reconcileForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    // Send AJAX request
    fetch('reconcile', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                alert('Account reconciled successfully!');
                // Close modal
                window.closeReconcileModal();
                // Reload page to see updated balances
                location.reload();
            } else {
                alert('Error: ' + data.error);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            alert('An error occurred: ' + error);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Use event delegation for better performance
document.addEventListener('DOMContentLoaded', function() {
    // Initialize toggle states on page load
    const maxLimitCheckbox = document.querySelector('input[data-toggle="max-limit"]');

    const accountTypeSelect = document.querySelector('select[name$="[accountType]"]');
    if (accountTypeSelect) {
        // Trigger the function to set initial state
        toggleInterestRateByAccountType(accountTypeSelect);

        // Add change event listener
        accountTypeSelect.addEventListener('change', function() {
            toggleInterestRateByAccountType(this);
        });

        // If editing an existing account with accountType set, show interest rate field
        if (accountTypeSelect.value) {
            const interestRateGroup = document.getElementById('interest-rate-group');
            interestRateGroup.style.display = 'block';
        }
    }

    if (maxLimitCheckbox) {
        window.toggleMaxLimit(maxLimitCheckbox);
    }

    // Add event listeners for edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.getAttribute('data-id');
            // Redirect to edit page
            window.location.href = `/customer/savings-account/${accountId}/edit`;
        });
    });

    // Event delegation for checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.matches('input[data-toggle="interest-rate"]')) {
            window.toggleInterestRate(e.target);
        }
        if (e.target.matches('input[data-toggle="max-limit"]')) {
            window.toggleMaxLimit(e.target);
        }
    });

    // Reconciliation functionality
    const reconcileButtons = document.querySelectorAll('.reconcile-btn');
    reconcileButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.getAttribute('data-id');
            const projectedBalance = this.getAttribute('data-projected');
            window.openReconcileModal(accountId, projectedBalance);
        });
    });

    // Close modal when clicking on X
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', window.closeReconcileModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('reconcileModal');
        if (e.target === modal) {
            window.closeReconcileModal();
        }
    });

    // Close modal with cancel button
    const cancelBtn = document.getElementById('cancelReconcile');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', window.closeReconcileModal);
    }

    // Handle form submission
    const reconcileForm = document.getElementById('reconcileForm');
    if (reconcileForm) {
        reconcileForm.addEventListener('submit', window.handleReconcileSubmit);
    }
});

// Add this function to validate the projected balance input
window.validateProjectedBalance = function(input) {
    if (input.value < 0) {
        alert('Projected balance cannot be negative');
        input.value = '';
        input.focus();
    }
}

// Add event listener for the projected balance input
document.addEventListener('DOMContentLoaded', function() {
    const projectedBalanceInput = document.querySelector('input[name$="[projectedBalance]"]');
    if (projectedBalanceInput && !projectedBalanceInput.readOnly) {
        projectedBalanceInput.addEventListener('change', function() {
            window.validateProjectedBalance(this);
        });
    }
});

// Transaction History Modal Functions
window.openTransactionHistoryModal = function(accountId, accountName) {
    const modal = document.getElementById('transactionHistoryModal');
    const accountNameElement = document.getElementById('modal-account-name');

    // Set account name
    accountNameElement.textContent = accountName;

    // Set current month/year
    const currentDate = new Date();
    document.getElementById('transaction-month').value = currentDate.getMonth() + 1;
    document.getElementById('transaction-year').value = currentDate.getFullYear();

    // Show modal
    modal.style.display = 'block';

    // Load transactions for current month
    loadTransactions(accountId, currentDate.getMonth() + 1, currentDate.getFullYear());
}

window.closeTransactionHistoryModal = function() {
    const modal = document.getElementById('transactionHistoryModal');
    modal.style.display = 'none';
}

window.loadTransactions = function(accountId, month, year) {
    const transactionsList = document.getElementById('transactions-list');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpensesElement = document.getElementById('total-expenses');
    const netChangeElement = document.getElementById('net-change');

    // Show loading state
    transactionsList.innerHTML = `
        <div class="loading-transactions">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading transactions...</p>
        </div>
    `;

    // Enable/disable next month button based on current date
    const currentDate = new Date();
    const nextMonthBtn = document.querySelector('.next-month');
    if (year >= currentDate.getFullYear() && month >= currentDate.getMonth() + 1) {
        nextMonthBtn.disabled = true;
    } else {
        nextMonthBtn.disabled = false;
    }

    // Send AJAX request to fetch transactions
    fetch(`/customer/savings-account/${accountId}/transactions?month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.transactions && data.transactions.length > 0) {
                let totalIncome = 0;
                let totalExpenses = 0;

                // Build transactions list
                transactionsList.innerHTML = '';
                data.transactions.forEach(transaction => {
                    const transactionDate = new Date(transaction.date);
                    const formattedDate = transactionDate.toLocaleDateString();
                    const isIncome = transaction.amount >= 0;

                    if (isIncome) {
                        totalIncome += parseFloat(transaction.amount);
                    } else {
                        totalExpenses += Math.abs(parseFloat(transaction.amount));
                    }

                    const transactionElement = document.createElement('div');
                    transactionElement.className = 'transaction-item';
                    transactionElement.innerHTML = `
                    <div class="transaction-details">
                        <div class="transaction-name">${transaction.name}</div>
                        <div class="transaction-description">${transaction.description || ''}</div>
                        <div class="transaction-date">${formattedDate}</div>
                    </div>
                    <div class="transaction-amount ${isIncome ? 'transaction-income' : 'transaction-expense'}">
                        ${isIncome ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                `;

                    transactionsList.appendChild(transactionElement);
                });

                // Update summary
                const netChange = totalIncome - totalExpenses;
                totalIncomeElement.textContent = `$${totalIncome.toFixed(2)}`;
                totalExpensesElement.textContent = `$${totalExpenses.toFixed(2)}`;
                netChangeElement.textContent = `$${netChange.toFixed(2)}`;
                netChangeElement.className = netChange >= 0 ? 'positive-balance' : 'negative-balance';
            } else {
                transactionsList.innerHTML = `
                <div class="empty-transactions">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
            `;

                // Reset summary
                totalIncomeElement.textContent = '$0.00';
                totalExpensesElement.textContent = '$0.00';
                netChangeElement.textContent = '$0.00';
                netChangeElement.className = '';
            }
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            transactionsList.innerHTML = `
            <div class="empty-transactions">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading transactions. Please try again.</p>
                <small>${error.message}</small>
            </div>
        `;
        });
}

// Add event listeners for the transaction history functionality
document.addEventListener('DOMContentLoaded', function() {
    // Transaction history buttons
    const transactionButtons = document.querySelectorAll('.transactions-btn');
    transactionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.getAttribute('data-id');
            const accountName = this.getAttribute('data-name');
            window.openTransactionHistoryModal(accountId, accountName);
        });
    });

    // Close transaction modal when clicking on X
    const transactionCloseBtn = document.querySelector('#transactionHistoryModal .close');
    if (transactionCloseBtn) {
        transactionCloseBtn.addEventListener('click', window.closeTransactionHistoryModal);
    }

    // Close transaction modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('transactionHistoryModal');
        if (e.target === modal) {
            window.closeTransactionHistoryModal();
        }
    });

    // Month/year change handlers
    const monthSelect = document.getElementById('transaction-month');
    const yearSelect = document.getElementById('transaction-year');

    if (monthSelect && yearSelect) {
        const handleDateChange = function() {
            const accountId = document.querySelector('.transactions-btn.active')?.getAttribute('data-id');
            if (accountId) {
                const month = monthSelect.value;
                const year = yearSelect.value;
                loadTransactions(accountId, month, year);
            }
        };

        monthSelect.addEventListener('change', handleDateChange);
        yearSelect.addEventListener('change', handleDateChange);
    }

    // Previous/next month buttons
    const prevMonthBtn = document.querySelector('.prev-month');
    const nextMonthBtn = document.querySelector('.next-month');

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            let month = parseInt(monthSelect.value);
            let year = parseInt(yearSelect.value);

            month--;
            if (month < 1) {
                month = 12;
                year--;
            }

            monthSelect.value = month;
            yearSelect.value = year;

            const accountId = document.querySelector('.transactions-btn.active')?.getAttribute('data-id');
            if (accountId) {
                loadTransactions(accountId, month, year);
            }
        });

        nextMonthBtn.addEventListener('click', function() {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;

            let month = parseInt(monthSelect.value);
            let year = parseInt(yearSelect.value);

            // Don't go beyond current month
            if (year >= currentYear && month >= currentMonth) {
                return;
            }

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }

            monthSelect.value = month;
            yearSelect.value = year;

            const accountId = document.querySelector('.transactions-btn.active')?.getAttribute('data-id');
            if (accountId) {
                loadTransactions(accountId, month, year);
            }
        });
    }

    // Scroll buttons for transaction list
    const scrollUpBtn = document.querySelector('.scroll-up');
    const scrollDownBtn = document.querySelector('.scroll-down');
    const transactionsList = document.getElementById('transactions-list');

    if (scrollUpBtn && scrollDownBtn && transactionsList) {
        scrollUpBtn.addEventListener('click', function() {
            transactionsList.scrollBy({ top: -100, behavior: 'smooth' });
        });

        scrollDownBtn.addEventListener('click', function() {
            transactionsList.scrollBy({ top: 100, behavior: 'smooth' });
        });
    }

    // Track which account button was clicked
    document.addEventListener('click', function(e) {
        if (e.target.closest('.transactions-btn')) {
            const buttons = document.querySelectorAll('.transactions-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            e.target.closest('.transactions-btn').classList.add('active');
        }
    });
});
