/* assets/js/customer_recurring_savings.js */

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    // Ensure chosenAmount is properly set based on strategy
    const strategy = document.querySelector('.payment-strategy-select').value;
    const chosenAmountField = document.querySelector('[name="recurring_savings[chosenAmount]"]');
    const dayOfMonthField = document.querySelector('[name="recurring_savings[dayOfMonthToMakeSaving]"]');

    // Validate day of month
    if (dayOfMonthField && (!dayOfMonthField.value || dayOfMonthField.value < 1 || dayOfMonthField.value > 28)) {
        alert('Please select a valid day of month (1-28).');
        return false;
    }

    if (strategy === 'Min. Savings (2%)') {
        // Set chosenAmount to null for minimum savings strategy
        if (chosenAmountField) {
            chosenAmountField.value = '';
        }
    }

    // Validate fixed amount if strategy is Fixed Amount
    if (strategy === 'Fixed Amount' && chosenAmountField) {
        const amount = parseFloat(chosenAmountField.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive amount for Fixed Amount strategy.');
            return false;
        }
    }

    // Validate percentage if strategy is Min. Savings + percentage
    if (strategy === 'Min. Savings (2%) + given % of projected balance' && chosenAmountField) {
        const percentage = parseFloat(chosenAmountField.value);
        if (isNaN(percentage) || percentage <= 0) {
            alert('Please select a valid percentage for the additional saving.');
            return false;
        }
    }

    // Show loading modal
    showLoadingModal();

    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    // Get form data
    const form = document.getElementById('recurring-savings-form');
    const formData = new FormData(form);

    // Submit form via AJAX
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Form submission failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Form was successful, now update interest for both accounts
                const accountToWithdraw = document.querySelector('[name="recurring_savings[accountToWithdraw]"]');
                const accountToSave = document.querySelector('[name="recurring_savings[accountToSave]"]');

                // Use account IDs from response if available, otherwise from form
                const withdrawId = data.accountToWithdrawId || accountToWithdraw.value;
                const saveId = data.accountToSaveId || accountToSave.value;

                if (withdrawId && saveId) {
                    return updateBothAccountsInterest(withdrawId, saveId)
                        .then(() => {
                            hideLoadingModal();
                            // Show success message and redirect
                            if (data.message) {
                                showFlashMessage(data.message, 'success');
                            }
                            setTimeout(() => {
                                window.location.href = '/customer/recurring-savings/';
                            }, 1500);
                        })
                        .catch(error => {
                            console.error('Error updating account interest:', error);
                            // Still show success even if interest update fails
                            hideLoadingModal();
                            if (data.message) {
                                showFlashMessage(data.message + ' (Note: Interest recalculation may need manual refresh)', 'success');
                            }
                            setTimeout(() => {
                                window.location.href = '/customer/recurring-savings/';
                            }, 1500);
                        });
                } else {
                    // Redirect normally if account IDs not found
                    hideLoadingModal();
                    if (data.message) {
                        showFlashMessage(data.message, 'success');
                    }
                    setTimeout(() => {
                        window.location.href = '/customer/recurring-savings/';
                    }, 1500);
                }
            } else {
                throw new Error(data.error || 'Form submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoadingModal();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Show error message
            showFlashMessage(error.message || 'An error occurred while processing your request. Please try again.', 'error');
        });
}

// Function to update interest for an account via AJAX
function updateAccountInterest(accountId) {
    return fetch(`/customer/interest/update-account-interest/${accountId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': getCsrfToken()
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

// Function to update interest for both accounts
function updateBothAccountsInterest(accountToWithdrawId, accountToSaveId) {
    const promises = [];

    if (accountToWithdrawId) {
        promises.push(updateAccountInterest(accountToWithdrawId));
    }

    if (accountToSaveId) {
        promises.push(updateAccountInterest(accountToSaveId));
    }

    return Promise.all(promises);
}

// Get CSRF token from meta tag
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.querySelector('[name="csrf-token"]')?.getAttribute('content') ||
        '';
}

// Show flash message
function showFlashMessage(message, type = 'success') {
    // Create flash message element
    const flashMessage = document.createElement('div');
    flashMessage.className = `alert alert-${type} flash-message`;
    flashMessage.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;

    // Add styles if needed
    flashMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;

    // Add to page
    document.body.appendChild(flashMessage);

    // Remove after 5 seconds
    setTimeout(() => {
        flashMessage.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (flashMessage.parentNode) {
                flashMessage.parentNode.removeChild(flashMessage);
            }
        }, 300);
    }, 5000);
}

// Handle savings strategy changes
function handleStrategyChange() {
    const strategySelect = document.querySelector('.payment-strategy-select');
    const amountContainer = document.getElementById('chosen-amount-container');
    const amountHint = document.getElementById('chosen-amount-hint');
    const amountWrapper = document.getElementById('chosen-amount-field-wrapper');

    if (!strategySelect || !amountContainer) return;

    const strategy = strategySelect.value;

    switch(strategy) {
        case 'Min. Savings (2%)':
            amountContainer.style.display = 'none';
            break;

        case 'Min. Savings (2%) + given % of projected balance':
            amountContainer.style.display = 'block';
            if (amountHint) {
                amountHint.textContent = 'Select the additional percentage of the projected balance to add to the minimum saving';
            }

            // Update the field to be a dropdown
            updateFieldToDropdown(amountWrapper);
            break;

        case 'Fixed Amount':
            amountContainer.style.display = 'block';
            if (amountHint) {
                amountHint.textContent = 'Enter the fixed amount to save each month';
            }

            // Update the field to be a number input
            updateFieldToNumberInput(amountWrapper);
            break;

        default:
            amountContainer.style.display = 'none';
    }
}

// Update field to dropdown for percentage selection
function updateFieldToDropdown(wrapper) {
    if (!wrapper) return;

    // Check if already a dropdown
    const existingSelect = wrapper.querySelector('select');
    if (existingSelect) return;

    // Remove existing input
    const existingInput = wrapper.querySelector('input');
    if (existingInput) {
        existingInput.remove();
    }

    // Create dropdown
    const select = document.createElement('select');
    select.name = 'recurring_savings[chosenAmount]';
    select.className = 'form-control chosen-amount-field';
    select.required = true;

    // Add options
    const options = [
        { value: 1.0, text: '1%' },
        { value: 2.0, text: '2%' },
        { value: 3.0, text: '3%' },
        { value: 4.0, text: '4%' },
        { value: 5.0, text: '5%' },
        { value: 10.0, text: '10%' },
        { value: 15.0, text: '15%' },
        { value: 20.0, text: '20%' },
        { value: 25.0, text: '25%' },
        { value: 50.0, text: '50%' }
    ];

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select additional percentage...';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add percentage options
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });

    wrapper.appendChild(select);
}

// Update field to number input for fixed amount
function updateFieldToNumberInput(wrapper) {
    if (!wrapper) return;

    // Check if already a number input
    const existingInput = wrapper.querySelector('input[type="number"]');
    if (existingInput) return;

    // Remove existing select
    const existingSelect = wrapper.querySelector('select');
    if (existingSelect) {
        existingSelect.remove();
    }

    // Create number input
    const input = document.createElement('input');
    input.type = 'number';
    input.name = 'recurring_savings[chosenAmount]';
    input.className = 'form-control chosen-amount-field';
    input.required = true;
    input.step = '0.01';
    input.min = '0.01';
    input.placeholder = '0.00';

    wrapper.appendChild(input);
}

// Enhanced showLoadingModal function with error handling
function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (!modal) return;

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const estimatedTime = document.getElementById('estimatedTime');

    // Reset progress
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    if (estimatedTime) estimatedTime.textContent = '30 seconds';

    // Show modal
    modal.style.display = 'flex';

    // Animate progress bar over 30 seconds
    const duration = 30000;
    const interval = 100;
    const steps = duration / interval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min(100, (currentStep / steps) * 100);

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;

        const remainingSeconds = Math.max(0, Math.round((duration - (currentStep * interval)) / 1000));
        if (estimatedTime) estimatedTime.textContent = `${remainingSeconds} seconds`;

        if (currentStep >= steps) {
            clearInterval(progressInterval);
            if (estimatedTime) estimatedTime.textContent = 'Finalizing updates...';

            // If still processing after 35 seconds, show a message
            setTimeout(() => {
                if (modal.style.display !== 'none') {
                    if (estimatedTime) estimatedTime.textContent = 'Almost done...';
                }
            }, 5000);
        }
    }, interval);

    modal.dataset.intervalId = progressInterval;
}

// Function to hide loading modal
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.display = 'none';
        if (modal.dataset.intervalId) {
            clearInterval(modal.dataset.intervalId);
        }
    }
}

// Function to re-initialize form listeners after AJAX response
function initializeFormListeners() {
    const strategySelect = document.querySelector('.payment-strategy-select');
    if (strategySelect) {
        strategySelect.addEventListener('change', handleStrategyChange);
        handleStrategyChange(); // Initialize based on current value
    }

    // Re-attach form submission handler
    const form = document.getElementById('recurring-savings-form');
    if (form) {
        form.removeEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', handleFormSubmit);
    }

    // Re-attach delete button handlers
    attachDeleteButtonHandlers();
}

// Attach delete button handlers
function attachDeleteButtonHandlers() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', handleDeleteClick);
        button.addEventListener('click', handleDeleteClick);
    });
}

// Handle delete button clicks
function handleDeleteClick(e) {
    if (!confirm('Are you sure you want to delete this recurring saving?')) {
        e.preventDefault();
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission
    const form = document.getElementById('recurring-savings-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Handle strategy changes
    const strategySelect = document.querySelector('.payment-strategy-select');
    if (strategySelect) {
        strategySelect.addEventListener('change', handleStrategyChange);
        // Initialize on page load
        handleStrategyChange();

        // Also check if we need to show the field based on existing data
        const currentStrategy = strategySelect.value;
        if (currentStrategy && currentStrategy !== 'Min. Savings (2%)') {
            handleStrategyChange();
        }
    }

    // Add confirmation for delete actions
    attachDeleteButtonHandlers();

    // Add CSS for flash messages animation
    if (!document.querySelector('#flash-message-styles')) {
        const styles = document.createElement('style');
        styles.id = 'flash-message-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .flash-message {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }
});
