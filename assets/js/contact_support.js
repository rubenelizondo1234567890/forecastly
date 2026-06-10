/* assets/js/contact_support.js */
document.addEventListener('DOMContentLoaded', function() {
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.getElementById('char-count');

    if (descriptionTextarea && charCount) {
        // Update character count
        descriptionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;

            // Change color based on length
            if (length < 150) {
                charCount.style.color = 'var(--negative)';
            } else {
                charCount.style.color = 'var(--positive)';
            }
        });

        // Initialize character count
        charCount.textContent = descriptionTextarea.value.length;
    }

    // Form validation
    const form = document.querySelector('.contact-support-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const description = document.getElementById('description');
            const authorizeContact = document.getElementById('authorize_contact');

            if (description && description.value.length < 150) {
                e.preventDefault();
                alert('Please provide a detailed description of at least 150 characters.');
                description.focus();
                return false;
            }

            if (authorizeContact && !authorizeContact.checked) {
                e.preventDefault();
                alert('Please authorize us to contact you by checking the required checkbox.');
                authorizeContact.focus();
                return false;
            }
        });
    }
});