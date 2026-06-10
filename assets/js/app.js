/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */
document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar groups with accordion effect
    const groupHeaders = document.querySelectorAll('.group-header');

    groupHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Find the parent menu-group of the clicked header
            const currentGroup = this.parentElement;

            // Close all other groups
            groupHeaders.forEach(otherHeader => {
                const otherGroup = otherHeader.parentElement;
                if (otherGroup !== currentGroup && otherGroup.classList.contains('active')) {
                    otherGroup.classList.remove('active');
                }
            });

            // Toggle the current group
            currentGroup.classList.toggle('active');
        });
    });

    // Automatically expand group if a child is active
    const activeSubmenuItem = document.querySelector('.submenu li a.active');
    if (activeSubmenuItem) {
        const parentGroup = activeSubmenuItem.closest('.menu-group');
        if (parentGroup) {
            parentGroup.classList.add('active');
        }
    }

    // Setup auto-dismiss for existing flash messages
    setupAutoDismissFlashMessages();

    // Add this function to handle auto-dismissing flash messages
    function setupAutoDismissFlashMessages() {
        const flashMessages = document.querySelectorAll('.alert');

        flashMessages.forEach(message => {
            // Set timeout to remove the message after 5 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    // Add fade-out effect
                    message.style.transition = 'opacity 0.5s ease';
                    message.style.opacity = '0';

                    // Remove from DOM after fade completes
                    setTimeout(() => {
                        message.remove();
                    }, 500);
                }
            }, 5000);
        });
    }
});