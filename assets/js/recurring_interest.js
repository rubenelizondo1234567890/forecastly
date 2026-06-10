/* assets/js/recurring_interest.js */

// Handle form submission for edit
function handleFormSubmit(e) {
    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    // Allow the form to submit normally
    return true;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission for edit page
    const form = document.getElementById('recurring-interest-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Add hover effects for edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        button.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });

    console.log('Recurring interest management loaded - edit mode only');
});
