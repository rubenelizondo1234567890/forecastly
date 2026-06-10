/* assets/js/recurring_incomes.js */

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    // Validate amount
    const amountInput = document.querySelector('input[name$="[amount]"]');
    if (amountInput && !validateAmount(amountInput)) {
        return false;
    }

    // Show loading modal
    showLoadingModal();

    // Get form data
    const form = document.getElementById('recurring-income-form');
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
                // Form was successful, now update interest for the account
                const accountId = data.accountId;

                if (accountId) {
                    return updateAccountInterest(accountId)
                        .then(() => {
                            // After updating interest, update revolving payments for this account
                            return updateRevolvingPayments(accountId);
                        })
                        .then(() => {
                            hideLoadingModal();
                            // Show success message and redirect
                            if (data.message) {
                                showFlashMessage(data.message, 'success');
                            }
                            setTimeout(() => {
                                window.location.href = '/customer/income/recurring/';
                            }, 1500);
                        })
                        .catch(error => {
                            console.error('Error updating account interest or revolving payments:', error);
                            // Still show success even if interest update fails
                            hideLoadingModal();
                            if (data.message) {
                                showFlashMessage(data.message + ' (Note: Interest recalculation may need manual refresh)', 'success');
                            }
                            setTimeout(() => {
                                window.location.href = '/customer/income/recurring/';
                            }, 1500);
                        });
                } else {
                    // Redirect normally if account ID not found
                    hideLoadingModal();
                    if (data.message) {
                        showFlashMessage(data.message, 'success');
                    }
                    setTimeout(() => {
                        window.location.href = '/customer/income/recurring/';
                    }, 1500);
                }
            } else {
                throw new Error(data.error || 'Form submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoadingModal();
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

// Function to update revolving payments for an account via AJAX
function updateRevolvingPayments(accountId) {
    return fetch(`/customer/revolving-payments/update-payments/${accountId}`, {
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

// Validate amount input
function validateAmount(input) {
    if (input.value <= 0) {
        alert('Amount must be greater than 0');
        input.value = '';
        input.focus();
        return false;
    }
    return true;
}

// Add this function to format currency inputs
function formatCurrency(input) {
    // Remove any non-digit characters except decimal point
    let value = input.value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const decimalCount = value.split('.').length - 1;
    if (decimalCount > 1) {
        value = value.substring(0, value.lastIndexOf('.'));
    }

    // Format to 2 decimal places
    if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
            value = parts.join('.');
        }
    }

    input.value = value;
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission
    const form = document.getElementById('recurring-income-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Add event listener for amount input
    const amountInput = document.querySelector('input[name$="[amount]"]');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            formatCurrency(this);
        });
        amountInput.addEventListener('change', function() {
            validateAmount(this);
        });
    }

    // Add confirmation for delete actions
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this recurring income?')) {
                e.preventDefault();
            }
        });
    });

    // Add CSS for flash messages animation if not already present
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
