/* assets/js/promo_landing.js */

<!-- scroll animation JS -->
    document.addEventListener('DOMContentLoaded', function() {
    const animated = document.querySelectorAll('.animate');
    const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
    animated.forEach(el => observer.observe(el));
});
