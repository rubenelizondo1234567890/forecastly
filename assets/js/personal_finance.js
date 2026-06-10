/* assets/js/personal_finance.js */

(function() {
    // Run after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            // User is logged in – run all interactive features
            initBudgetCalculator();
            initEmergencyFund101();
            initEmergencyFundDeepDive();
            initZeroBasedBudget();
            initDebtMethodButtons();
            initCreditFactorExplorer();
            initInsuranceStageSelector();
            initIdentityChecklist();
            initTemplateDemo();
            initDownloadButtons();
            initSelfCheckQuizzes();
        }
    });

    function initSelfCheckQuizzes() {
        // Select all quiz containers
        const quizContainers = document.querySelectorAll('.quiz-container');
        if (!quizContainers.length) return;

        quizContainers.forEach(container => {
            // Skip containers that have a submit button (they are handled separately)
            if (container.querySelector('#quiz-submit')) return;

            const feedbackEl = container.querySelector('.quiz-feedback');
            const questionGroups = container.querySelectorAll('.quiz-options');

            questionGroups.forEach(group => {
                const options = group.querySelectorAll('.quiz-option');

                options.forEach(option => {
                    option.addEventListener('click', function(e) {
                        // Remove any previous state from options in this group
                        options.forEach(opt => {
                            opt.classList.remove('chosen', 'correct', 'incorrect');
                        });

                        // Mark the clicked option as chosen
                        this.classList.add('chosen');

                        const isCorrect = this.dataset.answer === 'correct';

                        if (isCorrect) {
                            this.classList.add('correct');
                            if (feedbackEl) {
                                feedbackEl.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Correct!';
                            }
                        } else {
                            this.classList.add('incorrect');
                            // Find the correct answer in the same group
                            const correctOption = Array.from(options).find(opt => opt.dataset.answer === 'correct');
                            const correctText = correctOption ? correctOption.textContent.trim() : 'unknown';
                            if (feedbackEl) {
                                feedbackEl.innerHTML = `<i class="fas fa-times-circle"></i> ❌ Incorrect. The correct answer is: <strong>${correctText}</strong>`;
                            }
                        }
                    });
                });
            });
        });
    }

    // --------------------------------------------------------------
    // 3. CALCULATORS
    // --------------------------------------------------------------

    // 50/30/20 rule calculator
    function initBudgetCalculator() {
        const incomeInput = document.getElementById('income');
        const calculateBtn = document.getElementById('calculateBtn');
        const needsSpan = document.getElementById('needsAmount');
        const wantsSpan = document.getElementById('wantsAmount');
        const savingsSpan = document.getElementById('savingsAmount');

        if (!incomeInput || !needsSpan) return; // not on this page

        function updateCalculator() {
            let rawValue = incomeInput.value.trim();
            let income = parseFloat(rawValue);
            if (isNaN(income) || income < 0) income = 0;

            const needs = income * 0.5;
            const wants = income * 0.3;
            const savings = income * 0.2;

            needsSpan.textContent = '$' + needs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            wantsSpan.textContent = '$' + wants.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            savingsSpan.textContent = '$' + savings.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        // initial calculation
        updateCalculator();

        if (calculateBtn) {
            calculateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                updateCalculator();
            });
        }

        incomeInput.addEventListener('input', updateCalculator);
    }

    // Emergency Fund 101 calculator (slider + monthly expenses)
    function initEmergencyFund101() {
        const monthlyInput = document.getElementById('monthlyExpenses');
        const monthsSlider = document.getElementById('monthsSlider');
        const monthsDisplay = document.getElementById('monthsDisplay');
        const targetSpan = document.getElementById('targetAmount');

        if (!monthlyInput || !monthsSlider || !targetSpan) return;

        function updateTarget() {
            let monthly = parseFloat(monthlyInput.value);
            if (isNaN(monthly) || monthly < 0) monthly = 0;
            let months = parseFloat(monthsSlider.value);
            if (monthsDisplay) monthsDisplay.textContent = months.toFixed(1);
            const total = monthly * months;
            targetSpan.textContent = '$' + total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        monthlyInput.addEventListener('input', updateTarget);
        monthsSlider.addEventListener('input', updateTarget);
        updateTarget();
    }

    // Emergency Fund Deep Dive calculator
    function initEmergencyFundDeepDive() {
        const monthlyInput = document.getElementById('monthlyExpenses');
        const stabilitySelect = document.getElementById('stabilityFactor');
        const targetSpan = document.getElementById('targetAmount');
        const monthsBadge = document.getElementById('monthsBadge');

        if (!monthlyInput || !stabilitySelect || !targetSpan) return;

        function updateCalculator() {
            let monthly = parseFloat(monthlyInput.value) || 0;
            let months = parseInt(stabilitySelect.value) || 4;
            let total = monthly * months;
            targetSpan.textContent = '$' + total.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0});
            if (monthsBadge) monthsBadge.textContent = months + ' months of expenses';
        }

        monthlyInput.addEventListener('input', updateCalculator);
        stabilitySelect.addEventListener('change', updateCalculator);
        updateCalculator();
    }

    // Zero‑Based Budgeting tool
    function initZeroBasedBudget() {
        const incomeInput = document.getElementById('income');
        const categoriesContainer = document.getElementById('categories');
        const totalAllocatedSpan = document.getElementById('totalAllocated');
        const remainingSpan = document.getElementById('remaining');
        const statusDiv = document.getElementById('statusMessage');

        if (!categoriesContainer) return; // not on zero‑based page

        // Define categories with icons and default percentages
        const categoryDefs = [
            { name: 'Housing (rent/mortgage)', icon: 'home', defaultPct: 0.25 },
            { name: 'Utilities & bills', icon: 'bolt', defaultPct: 0.08 },
            { name: 'Groceries', icon: 'shopping-basket', defaultPct: 0.1 },
            { name: 'Transportation', icon: 'car', defaultPct: 0.07 },
            { name: 'Insurance', icon: 'shield-alt', defaultPct: 0.05 },
            { name: 'Debt payments', icon: 'credit-card', defaultPct: 0.1 },
            { name: 'Savings & investing', icon: 'piggy-bank', defaultPct: 0.15 },
            { name: 'Dining out / fun', icon: 'utensils', defaultPct: 0.1 },
            { name: 'Shopping / personal', icon: 'tshirt', defaultPct: 0.05 },
            { name: 'Misc / other', icon: 'ellipsis-h', defaultPct: 0.05 }
        ];

        function createCategoryInputs() {
            let html = '';
            categoryDefs.forEach((def, idx) => {
                const id = `cat_${idx}`;
                html += `
                    <div class="category-card">
                        <h3><i class="fas fa-${def.icon}"></i> ${def.name}</h3>
                        <input type="number" id="${id}" class="cat-input" value="0" step="10" min="0">
                    </div>
                `;
            });
            categoriesContainer.innerHTML = html;
        }
        createCategoryInputs();

        function getIncome() {
            let val = parseFloat(incomeInput.value);
            return isNaN(val) || val < 0 ? 0 : val;
        }

        function setDefaultAllocations() {
            const income = getIncome();
            const catInputs = document.querySelectorAll('.cat-input');
            catInputs.forEach((input, idx) => {
                const def = categoryDefs[idx];
                let val = income * (def.defaultPct);
                input.value = Math.round(val);
            });
            updateBudget();
        }

        function updateBudget() {
            const income = getIncome();
            const catInputs = document.querySelectorAll('.cat-input');
            let total = 0;
            catInputs.forEach(input => {
                let val = parseFloat(input.value);
                if (isNaN(val) || val < 0) val = 0;
                total += val;
            });
            const remaining = income - total;

            if (totalAllocatedSpan) totalAllocatedSpan.textContent = '$' + total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            if (remainingSpan) remainingSpan.textContent = '$' + remaining.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            if (!statusDiv) return;
            if (Math.abs(remaining) < 0.01) {
                statusDiv.textContent = '✅ Perfect! Every dollar has a job.';
                statusDiv.className = 'status-message status-ok';
            } else if (remaining > 0) {
                statusDiv.textContent = `⚠️ You still have $${remaining.toFixed(0)} unassigned. Give it a job (add to savings or debt).`;
                statusDiv.className = 'status-message status-warning';
            } else {
                statusDiv.textContent = `❌ You're overspent by $${Math.abs(remaining).toFixed(0)}. Reduce some categories.`;
                statusDiv.className = 'status-message status-warning';
            }
        }

        // event listeners
        if (incomeInput) {
            incomeInput.addEventListener('input', setDefaultAllocations);
        }

        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('cat-input')) {
                updateBudget();
            }
        });

        setDefaultAllocations();
    }

    // Debt avalanche/snowball interactive buttons
    function initDebtMethodButtons() {
        const avalancheBtn = document.getElementById('avalancheBtn');
        const snowballBtn = document.getElementById('snowballBtn');
        const orderResult = document.getElementById('orderResult');

        if (!avalancheBtn || !snowballBtn || !orderResult) return;

        const debts = [
            { name: 'Credit card A', balance: 2500, rate: 22 },
            { name: 'Credit card B', balance: 4000, rate: 18 },
            { name: 'Student loan', balance: 10000, rate: 5 }
        ];

        function showOrder(method) {
            let sorted = [];
            if (method === 'avalanche') {
                sorted = [...debts].sort((a, b) => b.rate - a.rate);
            } else {
                sorted = [...debts].sort((a, b) => a.balance - b.balance);
            }

            let html = `<p><strong>${method === 'avalanche' ? '❄️ Avalanche' : '⛄ Snowball'} payoff order:</strong></p><div class="order-list">`;
            sorted.forEach((debt, index) => {
                html += `<div class="order-item"><strong>${index+1}.</strong> ${debt.name} ($${debt.balance} @ ${debt.rate}%)</div>`;
            });
            html += `</div><p style="margin-top:15px;">${method === 'avalanche' ? 'Target highest rate first — saves interest.' : 'Target smallest balance first — quick wins.'}</p>`;
            orderResult.innerHTML = html;
        }

        avalancheBtn.addEventListener('click', function() {
            avalancheBtn.classList.add('active');
            snowballBtn.classList.remove('active');
            showOrder('avalanche');
        });

        snowballBtn.addEventListener('click', function() {
            snowballBtn.classList.add('active');
            avalancheBtn.classList.remove('active');
            showOrder('snowball');
        });
    }

    // --------------------------------------------------------------
    // 4. INTERACTIVE FACTOR EXPLORERS
    // --------------------------------------------------------------

    // Credit score factor explorer
    function initCreditFactorExplorer() {
        const factorCards = document.querySelectorAll('.factor-card');
        const descPanel = document.getElementById('factorDescPanel');

        if (factorCards.length === 0 || !descPanel) return;

        factorCards.forEach(card => {
            card.addEventListener('click', function() {
                factorCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const descText = this.dataset.desc;
                const factorName = this.querySelector('.factor-name')?.innerText || '';
                const percent = this.querySelector('.factor-percent')?.innerText || '';
                descPanel.innerHTML = `<p><strong style="color:#ff6b35;">${percent} ${factorName}</strong> — ${descText}</p>`;
            });
        });
    }

    // Insurance life stage selector
    function initInsuranceStageSelector() {
        const stageBtns = document.querySelectorAll('.stage-btn');
        const recBox = document.getElementById('stageRecommendation');

        if (stageBtns.length === 0 || !recBox) return;

        const stageData = {
            young: {
                title: '🌟 Starting out (18–30)',
                essentials: [
                    'Health insurance (marketplace or parents plan till 26)',
                    'Renters insurance (protects your stuff, super cheap)',
                    'Auto insurance (if you drive — liability at adequate limits)',
                    'Disability insurance (if you have income, check if employer offers)'
                ],
                consider: ['Small term life policy only if someone depends on you (e.g., co-signed loan).']
            },
            family: {
                title: '🏡 Family & homeowners',
                essentials: [
                    'Health insurance (family plan)',
                    'Homeowners or renters insurance (replacement cost recommended)',
                    'Auto insurance (higher liability limits, umbrella policy if net worth >$1M)',
                    'Term life insurance (10–20x your income for dependents)',
                    'Disability insurance (non‑negotiable to protect family income)'
                ],
                consider: ['Umbrella insurance for extra liability protection.']
            },
            retire: {
                title: '🧓 Approaching retirement',
                essentials: [
                    'Medicare / health insurance (don’t let coverage lapse)',
                    'Home / auto insurance (review discounts, maybe lower mileage)',
                    'Long‑term care insurance? (optional, depends on assets)',
                    'Life insurance usually not needed unless estate planning or dependents'
                ],
                consider: ['Medigap or Medicare Advantage, review all policies annually.']
            }
        };

        function updateStage(stage) {
            const data = stageData[stage];
            let html = `<h3 style="margin-top: 0;">${data.title}</h3><p><strong>✅ Essentials:</strong></p><div class="rec-list">`;
            data.essentials.forEach(item => {
                html += `<div class="rec-tag"><i class="fas fa-check-circle"></i> ${item}</div>`;
            });
            if (data.consider && data.consider.length) {
                html += `<p style="margin:20px 0 10px; width:100%;"><strong>🤔 Consider adding:</strong></p>`;
                data.consider.forEach(item => {
                    html += `<div class="rec-tag"><i class="fas fa-question-circle"></i> ${item}</div>`;
                });
            }
            html += `</div>`;
            recBox.innerHTML = html;
        }

        stageBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                stageBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const stage = this.dataset.stage;
                updateStage(stage);
            });
        });

        // default to 'young' if present
        if (stageBtns.length) {
            const defaultBtn = document.querySelector('.stage-btn[data-stage="young"]');
            if (defaultBtn) {
                defaultBtn.classList.add('active');
                updateStage('young');
            } else {
                // fallback to first button
                stageBtns[0].classList.add('active');
                updateStage(stageBtns[0].dataset.stage);
            }
        }
    }

    // --------------------------------------------------------------
    // 5. INTERACTIVE CHECKLIST (identity protection)
    // --------------------------------------------------------------
    function initIdentityChecklist() {
        const checklistItems = document.querySelectorAll('.checklist-item');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (checklistItems.length === 0) return;

        function updateProgress() {
            const total = checklistItems.length;
            let checked = 0;
            checklistItems.forEach(item => {
                if (item.classList.contains('checked')) checked++;
            });
            const percent = (checked / total) * 100;
            if (progressFill) progressFill.style.width = percent + '%';
            if (progressText) progressText.innerText = `${checked}/${total} completed — ${checked === total ? '🎉 You are a security superstar!' : 'keep going!'}`;
        }

        checklistItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('checked');
                this.dataset.checked = this.classList.contains('checked') ? 'true' : 'false';
                updateProgress();
            });
        });

        updateProgress();
    }

    // --------------------------------------------------------------
    // 8. ADDITIONAL INTERACTIVE ELEMENTS
    // --------------------------------------------------------------

    // Template demo click (Creating a Personal Financial Statement)
    function initTemplateDemo() {
        const templateDemo = document.getElementById('templateDemo');
        if (templateDemo) {
            templateDemo.addEventListener('click', (e) => {
                e.preventDefault();
                alert('📄 Template demo: You’d receive a link to a Google Sheet with pre-filled formulas. (Full version available after launch.)');
            });
        }
    }


    // Download worksheet buttons
    function initDownloadButtons() {
        const downloadBtns = document.querySelectorAll('.worksheet-box .btn-outline, .template-demo .btn-outline');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('📄 Worksheet download would start here. (Interactive demo)');
            });
        });
    }

})();
