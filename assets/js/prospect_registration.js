// assets/js/prospect_registration.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration JS loaded');

    const accountForm = document.getElementById('accountForm');
    const customerForm = document.getElementById('customerForm');
    const successMessage = document.getElementById('successMessage');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const submitBtn = document.getElementById('submitBtn');
    const planCards = document.querySelectorAll('.plan-card');
    const subscriptionPlanInput = document.getElementById('account_subscriptionPlan');
    const accountIdInput = document.getElementById('account_id');

    // Check if required elements exist
    if (!accountForm || !customerForm || !successMessage || !nextBtn) {
        console.error('Required form elements not found');
        return;
    }

    // Check for flash errors – if any, show customer form directly
    const flashErrors = document.querySelectorAll('.alert-error');
    const hasEmailError = Array.from(flashErrors).some(alert =>
        alert.textContent.toLowerCase().includes('email') ||
        alert.textContent.toLowerCase().includes('username')
    );

    if (hasEmailError) {
        accountForm.style.display = 'none';
        customerForm.style.display = 'block';
        if (backBtn) backBtn.style.display = 'inline-block';
        if (submitBtn) submitBtn.style.display = 'inline-block';
        updateProgress(2);
        setTimeout(() => {
            const firstError = document.querySelector('.alert-error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        accountForm.style.display = 'block';
        customerForm.style.display = 'none';
        successMessage.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        updateProgress(1);
    }

    // Set initial plan from URL parameter or default to 'standard'
    const urlParams = new URLSearchParams(window.location.search);
    let initialPlan = urlParams.get('plan') || 'standard';

    // Validate the plan – only standard and premium allowed
    const validPlans = ['standard', 'premium'];
    if (!validPlans.includes(initialPlan)) {
        initialPlan = 'standard';
    }

    if (subscriptionPlanInput) {
        subscriptionPlanInput.value = initialPlan;
    }
    highlightSelectedPlan(initialPlan);

    // Plan selection
    planCards.forEach(card => {
        card.addEventListener('click', () => {
            const plan = card.getAttribute('data-plan');
            if (subscriptionPlanInput) {
                subscriptionPlanInput.value = plan;
            }
            highlightSelectedPlan(plan);
        });
    });

    // Form navigation (next, back) – unchanged
    if (nextBtn) {
        nextBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const accountName = document.getElementById('account_accountName');
            if (!accountName || !accountName.value || !subscriptionPlanInput || !subscriptionPlanInput.value) {
                alert('Please fill all account details');
                return;
            }

            try {
                const response = await fetch('/create-account-ajax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountName: accountName.value,
                        subscriptionPlan: subscriptionPlanInput.value
                    })
                });

                const data = await response.json();

                if (data.success) {
                    if (accountIdInput) accountIdInput.value = data.accountId;

                    accountForm.style.display = 'none';
                    customerForm.style.display = 'block';
                    if (backBtn) backBtn.style.display = 'inline-block';
                    if (submitBtn) submitBtn.style.display = 'inline-block';
                    updateProgress(2);
                } else {
                    alert('Error creating account: ' + data.message);
                }
            } catch (error) {
                alert('Error creating account. Please try again.');
                console.error('Account creation error:', error);
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            customerForm.style.display = 'none';
            accountForm.style.display = 'block';
            backBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
            updateProgress(1);
        });
    }

    // Form submission
    const combinedForm = document.getElementById('combinedForm');
    if (combinedForm) {
        combinedForm.addEventListener('submit', function(e) {
            const password1 = document.getElementById('customer_plainPassword_first');
            const password2 = document.getElementById('customer_plainPassword_second');

            if (password1 && password2 && password1.value !== password2.value) {
                e.preventDefault();
                alert('Passwords do not match. Please check and try again.');
                return false;
            }

            const termsAgreed = document.getElementById('customer_agreeTerms');
            if (termsAgreed && !termsAgreed.checked) {
                e.preventDefault();
                alert('You must agree to the Terms of Service and Privacy Policy.');
                return false;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
        });
    }

    function highlightSelectedPlan(plan) {
        planCards.forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-plan') === plan) {
                card.classList.add('selected');
            }
        });
    }

    function updateProgress(step) {
        const progressSteps = document.querySelectorAll('.progress-step');
        progressSteps.forEach((stepEl, index) => {
            const number = stepEl.querySelector('.step-number');
            const label = stepEl.querySelector('.step-label');

            if (number && label) {
                if (index + 1 === step) {
                    number.classList.add('active');
                    label.classList.add('active');
                } else if (index + 1 < step) {
                    number.classList.add('completed');
                    label.classList.add('completed');
                } else {
                    number.classList.remove('active', 'completed');
                    label.classList.remove('active', 'completed');
                }
            }
        });
    }
});
