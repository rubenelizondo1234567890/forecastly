// assets/js/waitlist.js
document.addEventListener('DOMContentLoaded', function() {
    // Form validation and enhancement
    const waitlistForm = document.querySelector('.waitlist-form');

    if (waitlistForm) {
        // Add real-time validation
        const inputs = waitlistForm.querySelectorAll('.form-control');

        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });

        // Form submission enhancement
        waitlistForm.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
                highlightErrors();
            }
        });
    }

    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;

        clearFieldError(field);

        switch (fieldName) {
            case 'wait_list[fullName]':
                if (value.length < 2) {
                    showFieldError(field, 'Please enter your full name (at least 2 characters)');
                    return false;
                }
                break;

            case 'wait_list[email]':
                if (!isValidEmail(value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
        }

        return true;
    }

    function validateForm() {
        let isValid = true;
        const inputs = waitlistForm.querySelectorAll('.form-control[required]');

        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    function showFieldError(field, message) {
        field.style.borderColor = 'var(--negative)';

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = 'var(--negative)';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '5px';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        field.parentNode.appendChild(errorElement);
    }

    function clearFieldError(field) {
        field.style.borderColor = '';

        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    function highlightErrors() {
        const firstErrorField = waitlistForm.querySelector('.field-error');
        if (firstErrorField) {
            const field = firstErrorField.parentNode.querySelector('.form-control');
            if (field) {
                field.focus();
            }
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Add loading state to submit button
    const submitButton = waitlistForm?.querySelector('button[type="submit"]');
    if (submitButton) {
        waitlistForm.addEventListener('submit', function() {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining Waitlist...';
        });
    }

    // Animate stats counter (for demonstration)
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        if (stat.textContent.includes('+')) {
            animateValue(stat, 0, parseInt(stat.textContent), 2000);
        }
    });

    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + '+';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});