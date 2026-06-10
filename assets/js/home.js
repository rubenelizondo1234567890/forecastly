/* assets/js/home.js */

// Mobile user bar toggle
function initMobileUserBar() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // prevent immediate closing by document click
        const userBar = this.closest('.user-bar');
        if (userBar) {
            userBar.classList.toggle('expanded');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', function(event) {
        const userBar = document.querySelector('.user-bar');
        if (!userBar || !userBar.classList.contains('expanded')) return;
        if (!userBar.contains(event.target)) {
            userBar.classList.remove('expanded');
        }
    });
}


// --------------------------------------------------------------
// Login modal setup for non-logged-in users
// --------------------------------------------------------------
function initLoginModalForInteractive() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');

    function showLoginModal(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.style.display = 'flex';
    }

    // Hide modal when clicking close or overlay
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (overlay) {
        overlay.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    // Interactive elements that should trigger the modal
    const interactiveSelectors = [
        '#income', '#calculateBtn',
        '#monthlyExpenses', '#monthsSlider', '#stabilityFactor',
        '.cat-input',
        '#avalancheBtn', '#snowballBtn',
        '.factor-card',
        '.stage-btn',
        '.checklist-item',
        '.quiz-option',
        '#quiz-submit',
        '#templateDemo',
        '.btn:first-child',
        '.btn-outline'
    ];

    // Global click handler – show modal if click is on an interactive element AND outside the modal
    document.addEventListener('click', function(e) {
        // Ignore clicks inside the modal
        if (e.target.closest('#login-modal')) return;

        for (let selector of interactiveSelectors) {
            if (e.target.closest(selector)) {
                showLoginModal(e);
                break;
            }
        }
    });

    // Intercept focus on inputs/selects to prevent typing
    document.querySelectorAll(interactiveSelectors.join(',')).forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
            el.addEventListener('focus', function(e) {
                if (e.target.closest('#login-modal')) return;
                e.preventDefault();
                this.blur();
                showLoginModal(e);
            });
        }
    });

    // Add visual hint (optional)
    document.querySelectorAll(interactiveSelectors.join(',')).forEach(el => {
        el.style.cursor = 'pointer';
        el.setAttribute('title', 'Please log in to use this feature');
    });
}

// --------------------------------------------------------------
// 6. QUIZZES (generic handler for multiple choice)
// --------------------------------------------------------------
function initQuizzes() {
    const quizContainers = document.querySelectorAll('.quiz-container');
    if (!quizContainers.length) return;

    // Get modals and their close elements
    const retakeModal = document.getElementById('quiz-retake-modal');
    const successModal = document.getElementById('quiz-success-modal');
    if (!retakeModal || !successModal) return;

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    function showModal(modal) {
        modal.style.display = 'flex';
    }

    // Attach close events to both modals
    [retakeModal, successModal].forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        closeBtn.addEventListener('click', () => hideModal(modal));
        overlay.addEventListener('click', () => hideModal(modal));

        // Also close via the optional close button in success modal
        const closeButton = modal.querySelector('.modal-close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', () => hideModal(modal));
        }
    });

    quizContainers.forEach(container => {
        const questionGroups = container.querySelectorAll('.quiz-options');
        const submitBtn = container.querySelector('#quiz-submit');
        const resultDiv = container.querySelector('.quiz-result');
        const pageId = container.dataset.pageId;

        let answers = [];

        function resetQuiz() {
            container.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('chosen');
                opt.style.pointerEvents = 'auto';
            });
            questionGroups.forEach(group => group.classList.remove('answered'));
            answers = [];
            resultDiv.innerHTML = '';
            submitBtn.disabled = false;
        }

        // Retry button resets the quiz
        document.getElementById('quiz-retry').addEventListener('click', function() {
            resetQuiz();
            hideModal(retakeModal);
        });

        // Set up click listeners for each question
        questionGroups.forEach((group, qIndex) => {
            const options = group.querySelectorAll('.quiz-option');

            options.forEach(option => {
                option.addEventListener('click', function() {
                    if (group.classList.contains('answered')) return;

                    // Remove 'chosen' from siblings, add to this one
                    options.forEach(opt => opt.classList.remove('chosen'));
                    this.classList.add('chosen');

                    // Store answer
                    const isCorrect = this.dataset.answer === 'correct';
                    answers[qIndex] = {
                        chosen: this,
                        isCorrect: isCorrect
                    };

                    // Disable further clicks in this group
                    options.forEach(opt => opt.style.pointerEvents = 'none');
                    group.classList.add('answered');
                });
            });
        });

        // Submit button logic
        submitBtn.addEventListener('click', function() {
            const answeredCount = answers.filter(a => a !== undefined).length;
            if (answeredCount < questionGroups.length) {
                alert('Please answer all questions before submitting.');
                return;
            }

            const correctCount = answers.filter(a => a.isCorrect).length;
            const total = questionGroups.length;
            const scorePercentage = Math.round((correctCount / total) * 100);

            // Display result locally
            resultDiv.innerHTML = `<span class="quiz-result">You scored ${correctCount} out of ${total} (${scorePercentage}%).</span>`;

            if (correctCount < 3) {
                // Show retake modal for failing score
                showModal(retakeModal);
                return;
            }

            // --- Passing score: show success modal and submit ---
            showModal(successModal);

            // Prepare AJAX request
            const csrfToken = document.querySelector('meta[name="csrf-token-quiz"]').getAttribute('content');

            fetch('/customer/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    pageId: pageId,
                    score: scorePercentage,
                    total: total
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML += '<br/><span class="quiz-result">✅ Score saved successfully!</span>';
                        submitBtn.disabled = true;
                    } else {
                        resultDiv.innerHTML += '<br/><span class="quiz-result">❌ Error saving score. Please try again.</span>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultDiv.innerHTML += '<br/><span class="quiz-result">❌ Error saving score. Please try again.</span>';
                });
        });
    });
}

// --------------------------------------------------------------
// 1. SCROLL ANIMATIONS
// --------------------------------------------------------------
function initScrollAnimations() {
    const animated = document.querySelectorAll('.animate');
    if (animated.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 }); // slightly lower threshold for better experience

    animated.forEach(el => observer.observe(el));
}

// --------------------------------------------------------------
// 2. TABLE OF CONTENTS SMOOTH SCROLL
// --------------------------------------------------------------
function initTocSmoothScroll() {
    document.querySelectorAll('.toc-grid a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

// Scroll animations
document.addEventListener('DOMContentLoaded', function() {
    initMobileUserBar();
    initScrollAnimations();
    initTocSmoothScroll();

    // Add click tracking for analytics
    const cardButtons = document.querySelectorAll('.card-button');
    cardButtons.forEach(button => {
    button.addEventListener('click', function(e) {
    console.log(`Roadmap clicked: ${this.closest('.roadmap-card').querySelector('.card-title').textContent}`);
});
});

    // Update journey stats with animation
    const statNumbers = document.querySelectorAll('.stat-number');
    const observerStats = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
    if (entry.isIntersecting) {
    const stat = entry.target;
    const targetNumber = parseInt(stat.textContent.replace(/,/g, ''));
    let currentNumber = 0;
    const increment = targetNumber / 50;
    const timer = setInterval(() => {
    currentNumber += increment;
    if (currentNumber >= targetNumber) {
    currentNumber = targetNumber;
    clearInterval(timer);
}
    stat.textContent = Math.floor(currentNumber).toLocaleString();
}, 30);

    observerStats.unobserve(stat);
}
});
}, { threshold: 0.5 });

    statNumbers.forEach(stat => {
    observerStats.observe(stat);
});


    // Check login status
    console.log('userLoggedIn:', window.userLoggedIn);
    if (window.userLoggedIn) {
        initQuizzes();
    } else {
        // User is NOT logged in – disable interactive elements and show modal
        initLoginModalForInteractive();
    }

});
