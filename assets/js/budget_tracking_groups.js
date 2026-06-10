/* assets/js/budget_tracking_groups.js */
document.addEventListener('DOMContentLoaded', function() {

    const loadMasterForm = document.getElementById('load-master-form');
    const loadMasterBtn = document.getElementById('load-master-btn');

    if (loadMasterForm) {
        loadMasterForm.addEventListener('submit', function(e) {
            // Check if button is disabled (just in case)
            if (loadMasterBtn.disabled) {
                e.preventDefault();
                showFlashMessage('Master groups can only be loaded once per account.', 'error');
                return false;
            }

            // Optional: Show loading state
            loadMasterBtn.disabled = true;
            loadMasterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        });
    }

    // Handle case where user might try to resubmit
    const flashMessages = document.querySelectorAll('.alert');
    flashMessages.forEach(message => {
        if (message.textContent.includes('Master groups can only be loaded once')) {
            if (loadMasterBtn) {
                loadMasterBtn.disabled = true;
                loadMasterBtn.innerHTML = '<i class="fas fa-download"></i> Load Master Groups';
            }
        }
    });

    // Handle cancel button
    //TODO: Check why this is not working as expected
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('cancel button clicked');
            // Simple redirect to the index page
            window.location.href = '/customer/budget-tracking-groups';
        });
    }

    // Handle edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const groupId = this.getAttribute('data-id');
            fetchGroupData(groupId);
        });
    });

    // Handle delete buttons - only those not disabled
    const deleteButtons = document.querySelectorAll('.delete-btn:not(.disabled)');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const groupId = this.getAttribute('data-id');
            const groupName = this.getAttribute('data-name');

            if (confirm(`Are you sure you want to delete "${groupName}"?`)) {
                submitDeleteForm(groupId);
            }
        });
    });

    // Handle form reset to clear validation errors
    const form = document.getElementById('group-form');
    if (form) {
        form.addEventListener('reset', function() {
            clearValidationErrors();
        });
    }

    // Call attachFormListeners to set up form validation
    attachFormListeners();
});

function fetchGroupData(groupId) {
    fetch(`/customer/budget-tracking-groups/edit-form/${groupId}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.form) {
                document.getElementById('group-form-container').innerHTML = data.form;
                updateFormAction(groupId);
                // Re-attach event listeners to the new form
                attachFormListeners();

                // Update the section title
                const sectionTitle = document.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = 'Edit Group';
                }
            }
        })
        .catch(error => console.error('Error:', error));
}

function updateFormAction(groupId) {
    const form = document.getElementById('group-form');
    if (form) {
        form.action = `/customer/budget-tracking-groups/edit/${groupId}`;
    }
}

function submitDeleteForm(groupId) {
    // Create a form with the CSRF token
    const formData = new FormData();
    formData.append('_token', document.querySelector('meta[name="csrf-token"]').content);

    fetch(`/customer/budget-tracking-groups/delete/${groupId}`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                // If the response is not OK, try to parse it as JSON
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Show success message
                showFlashMessage(data.message, 'success');
                // Reload the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showFlashMessage(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showFlashMessage(error.message, 'error');
        });
}

// Update the showFlashMessage function to also auto-dismiss
function showFlashMessage(message, type) {
    // Create flash message element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> 
        ${message}
    `;

    // Add to flash messages container
    const flashContainer = document.querySelector('.flash-messages');
    if (flashContainer) {
        flashContainer.appendChild(alertDiv);

        // Set timeout to remove the message after 5 seconds
        setTimeout(() => {
            // Add fade-out effect
            alertDiv.style.transition = 'opacity 0.5s ease';
            alertDiv.style.opacity = '0';

            // Remove from DOM after fade completes
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 5000);
    }
}

function clearValidationErrors() {
    const errorElements = document.querySelectorAll('.invalid-feedback');
    errorElements.forEach(el => el.remove());

    const formControls = document.querySelectorAll('.form-control.is-invalid');
    formControls.forEach(el => el.classList.remove('is-invalid'));
}

function attachFormListeners() {
    const form = document.getElementById('group-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Basic client-side validation can be added here
            const nameInput = document.getElementById('budget_tracking_group_name');
            if (nameInput && !nameInput.value.trim()) {
                e.preventDefault();
                alert('Group name is required');
            }
        });
    }
}
