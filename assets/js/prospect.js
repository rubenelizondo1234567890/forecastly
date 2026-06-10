/* Javascript for the Prospect pages */

//Customer created success page
document.addEventListener('DOMContentLoaded', function() {
    // Testimonials carousel controls
    const track = document.querySelector('.testimonials-track');
    const pauseBtn = document.getElementById('pause-btn');
    const playBtn = document.getElementById('play-btn');

    if (pauseBtn && playBtn && track) {
        // Pause animation
        pauseBtn.addEventListener('click', function() {
            track.style.animationPlayState = 'paused';
        });

        // Play animation
        playBtn.addEventListener('click', function() {
            track.style.animationPlayState = 'running';
        });

        // Pause on hover and resume when not hovering
        const container = document.querySelector('.testimonials-container');
        container.addEventListener('mouseenter', function() {
            track.style.animationPlayState = 'paused';
        });

        container.addEventListener('mouseleave', function() {
            track.style.animationPlayState = 'running';
        });
    }

    // Handle resend email functionality for success page
    const resendEmailButtonSuccess = document.getElementById('resendEmail');
    if (resendEmailButtonSuccess && typeof customerId !== 'undefined') {
        setupResendEmailHandler(resendEmailButtonSuccess, customerId);
    }

    // Handle resend email functionality for expired token page
    const resendEmailButtonExpired = document.getElementById('resendEmail');
    const resendStatus = document.getElementById('resendStatus');

    if (resendEmailButtonExpired && typeof customerId !== 'undefined' && resendStatus) {
        setupResendEmailHandler(resendEmailButtonExpired, customerId, resendStatus);
    }
});

/**
 * Setup resend email handler with proper UI feedback
 */
function setupResendEmailHandler(button, customerId, statusElement = null) {
    button.addEventListener('click', function(e) {
        e.preventDefault();

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        button.disabled = true;

        // Send AJAX request to resend activation email
        fetch(`/resend-activation-email/${customerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Activation email sent successfully! Please check your inbox.', 'success', statusElement);

                    // Disable button for 60 seconds to prevent spam
                    let countdown = 60;
                    const countdownInterval = setInterval(() => {
                        button.innerHTML = `Resend available in ${countdown}s`;
                        if (countdown <= 0) {
                            clearInterval(countdownInterval);
                            button.innerHTML = originalText;
                            button.disabled = false;
                        }
                        countdown--;
                    }, 1000);

                } else {
                    showStatusMessage('Error sending email: ' + data.message, 'error', statusElement);
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            })
            .catch(error => {
                showStatusMessage('Error sending email. Please try again.', 'error', statusElement);
                button.innerHTML = originalText;
                button.disabled = false;
                console.error('Resend email error:', error);
            });
    });
}

/**
 * Show status message with proper styling
 */
function showStatusMessage(message, type, statusElement = null) {
    if (!statusElement) {
        // If no specific status element, use alert
        alert(message);
        return;
    }

    // Clear previous messages
    statusElement.innerHTML = '';

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;

    statusElement.appendChild(messageDiv);
    statusElement.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                    if (statusElement.children.length === 0) {
                        statusElement.style.display = 'none';
                    }
                }
            }, 500);
        }, 5000);
    }
}