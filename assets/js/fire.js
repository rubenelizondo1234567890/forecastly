/* assets/js/fire.js */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // animate elements on scroll
        const animated = document.querySelectorAll('.animate');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });

        animated.forEach(el => observer.observe(el));
    });
})();
