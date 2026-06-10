/* assets/js/customer_account_settings.js */
// Modal functionality
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const toggleSubscriptionBtn = document.getElementById('toggle-subscription');
    const subscriptionInfo = document.getElementById('subscription-info');

    if (toggleSubscriptionBtn && subscriptionInfo) {
        toggleSubscriptionBtn.addEventListener('click', function() {
            subscriptionInfo.classList.toggle('hidden');
            const icon = this.querySelector('i');
            if (subscriptionInfo.classList.contains('hidden')) {
                icon.className = 'fas fa-chevron-down';
                this.innerHTML = '<i class="fas fa-chevron-down"></i> Show Subscription Details';
            } else {
                icon.className = 'fas fa-chevron-up';
                this.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Subscription Details';
            }
        });
    }
    // Edit customer modal
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const customerId = this.getAttribute('data-customer-id');
            const editUrl = this.getAttribute('data-edit-url').replace('CUSTOMER_ID', customerId);

            fetch(editUrl)
                .then(response => response.text())
                .then(html => {
                    document.getElementById('edit-customer-modal').innerHTML = html;
                    openModal('edit-customer-modal');
                });
        });
    });

    // New customer modal
    const addCustomerBtn = document.getElementById('add-customer-btn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            const newUrl = this.getAttribute('data-new-url');

            fetch(newUrl)
                .then(response => response.text())
                .then(html => {
                    document.getElementById('new-customer-modal').innerHTML = html;
                    openModal('new-customer-modal');
                });
        });
    }

    // Reset account modal
    const resetAccountBtn = document.getElementById('reset-account-btn');
    const resetAccountModal = document.getElementById('reset-account-modal');

    if (resetAccountBtn && resetAccountModal) {
        resetAccountBtn.addEventListener('click', function() {
            openModal('reset-account-modal');
        });

        // Close buttons
        const closeButtons = resetAccountModal.querySelectorAll('.close, #cancel-reset');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                closeModal('reset-account-modal');
            });
        });

        // Confirm reset
        const confirmResetBtn = document.getElementById('confirm-reset');
        if (confirmResetBtn) {
            confirmResetBtn.addEventListener('click', function() {
                const resetUrl = this.getAttribute('data-reset-url');

                fetch(resetUrl, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Account reset successfully. The page will now refresh.');
                            window.location.reload();
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while resetting the account.');
                    });
            });
        }
    }

    // Toggle journey details
    document.querySelectorAll('.journey-header').forEach(header => {
        header.addEventListener('click', function() {
            const journeyId = this.dataset.journeyId;
            const details = document.getElementById('journey-details-' + journeyId);
            const isHidden = details.style.display === 'none';
            details.style.display = isHidden ? 'block' : 'none';
            this.classList.toggle('active', isHidden);
        });
    });
});
