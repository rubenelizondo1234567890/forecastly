/* assets/js/career_capital.js */
(function() {
    // Run after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            // User is logged in – run all interactive features
            initCareerCalculator();
            initSkillROI();
            initStrengthsFinder();
            initMindsetMeter();
            initBurnoutChecker();
            initSideHustleCalc();
            initNegotiationSimulator();
            initLinkedInAnalyzer();
            initLaunchTracker();
            initNetworkingMeter();
            initMasteryScorecard();
            initAIOpportunityScore();
            initWebsiteReadiness();
            initCertROI();
        }
    });

    /**
     * Self‑assessment calculator for the three pillars of career capital.
     * Reads values from three sliders, displays them, and calculates the total.
     */
    function initCareerCalculator() {
        const skillSlider = document.getElementById('skillSlider');
        const networkSlider = document.getElementById('networkSlider');
        const reputationSlider = document.getElementById('reputationSlider');
        const skillValue = document.getElementById('skillValue');
        const networkValue = document.getElementById('networkValue');
        const reputationValue = document.getElementById('reputationValue');
        const calculateBtn = document.getElementById('calculateBtn');
        const totalScoreSpan = document.getElementById('totalScore');

        // If the required elements are not present on this page, exit silently
        if (!skillSlider || !networkSlider || !reputationSlider || !calculateBtn || !totalScoreSpan) {
            return;
        }

        // Update the displayed value next to each slider in real time
        function attachLiveUpdate(slider, displaySpan) {
            if (slider && displaySpan) {
                slider.addEventListener('input', function() {
                    displaySpan.textContent = slider.value;
                });
            }
        }
        attachLiveUpdate(skillSlider, skillValue);
        attachLiveUpdate(networkSlider, networkValue);
        attachLiveUpdate(reputationSlider, reputationValue);

        // Calculate total when button is clicked
        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const skill = parseInt(skillSlider.value) || 0;
            const network = parseInt(networkSlider.value) || 0;
            const reputation = parseInt(reputationSlider.value) || 0;
            const total = skill + network + reputation;

            totalScoreSpan.textContent = total;
        });

        // Optionally, trigger a calculation on page load to show an initial total
        // (the sliders have default values set in HTML)
        setTimeout(() => {
            calculateBtn.click();
        }, 100);
    }

    function initSkillROI() {
        const salesInterest = document.getElementById('salesInterest');
        const salesSkill = document.getElementById('salesSkill');
        const salesScore = document.getElementById('salesScore');
        const copyInterest = document.getElementById('copyInterest');
        const copySkill = document.getElementById('copySkill');
        const copyScore = document.getElementById('copyScore');
        const codeInterest = document.getElementById('codeInterest');
        const codeSkill = document.getElementById('codeSkill');
        const codeScore = document.getElementById('codeScore');
        const aiInterest = document.getElementById('aiInterest');
        const aiSkill = document.getElementById('aiSkill');
        const aiScore = document.getElementById('aiScore');
        const calculateBtn = document.getElementById('calculateROI');
        const recommendationDiv = document.getElementById('skillRecommendation');

        function updateLive(slider, span) {
            slider.addEventListener('input', () => { span.textContent = slider.value; });
        }
        updateLive(salesInterest, document.getElementById('salesInterestVal'));
        updateLive(salesSkill, document.getElementById('salesSkillVal'));
        updateLive(copyInterest, document.getElementById('copyInterestVal'));
        updateLive(copySkill, document.getElementById('copySkillVal'));
        updateLive(codeInterest, document.getElementById('codeInterestVal'));
        updateLive(codeSkill, document.getElementById('codeSkillVal'));
        updateLive(aiInterest, document.getElementById('aiInterestVal'));
        updateLive(aiSkill, document.getElementById('aiSkillVal'));

        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Calculate fit score = interest * skill (normalized to 0-100)
            const sFit = (parseInt(salesInterest.value) * parseInt(salesSkill.value)) / 10;
            const cFit = (parseInt(copyInterest.value) * parseInt(copySkill.value)) / 10;
            const codeFit = (parseInt(codeInterest.value) * parseInt(codeSkill.value)) / 10;
            const aiFit = (parseInt(aiInterest.value) * parseInt(aiSkill.value)) / 10;

            salesScore.textContent = Math.round(sFit);
            copyScore.textContent = Math.round(cFit);
            codeScore.textContent = Math.round(codeFit);
            aiScore.textContent = Math.round(aiFit);

            const fits = [
                { name: 'Sales', score: sFit },
                { name: 'Copywriting', score: cFit },
                { name: 'Coding', score: codeFit },
                { name: 'AI Prompting', score: aiFit }
            ];
            fits.sort((a, b) => b.score - a.score);
            const top = fits[0];
            if (top.score > 0) {
                recommendationDiv.innerHTML = `✨ <strong>Focus on ${top.name}</strong> – it best matches your interests and current skills.`;
            } else {
                recommendationDiv.innerHTML = `✨ Adjust the sliders to see which skill fits you best.`;
            }
        });
    }

    function initStrengthsFinder() {
        const sliders = {
            analytical: document.getElementById('analytical'),
            creative: document.getElementById('creative'),
            social: document.getElementById('social'),
            organizational: document.getElementById('organizational')
        };
        const values = {
            analytical: document.getElementById('analyticalVal'),
            creative: document.getElementById('creativeVal'),
            social: document.getElementById('socialVal'),
            organizational: document.getElementById('organizationalVal')
        };
        const calculateBtn = document.getElementById('strengthsCalculate');
        const resultDiv = document.getElementById('strengthsResult');

        // live update
        for (let key in sliders) {
            if (sliders[key] && values[key]) {
                sliders[key].addEventListener('input', (function(k) {
                    return function() {
                        values[k].textContent = sliders[k].value;
                    };
                })(key));
            }
        }

        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const scores = {};
            let max = -1;
            let top = '';
            for (let key in sliders) {
                if (sliders[key]) {
                    scores[key] = parseInt(sliders[key].value) || 0;
                    if (scores[key] > max) {
                        max = scores[key];
                        top = key;
                    }
                }
            }
            const strengthNames = {
                analytical: 'Analytical Thinking',
                creative: 'Creativity',
                social: 'Social Intelligence',
                organizational: 'Organizational Skills'
            };
            if (top) {
                resultDiv.innerHTML = `✨ <strong>Your top natural advantage appears to be <span style="color: var(--career-color);">${strengthNames[top]}</span>.</strong> Focus on developing skills that leverage this strength.`;
            } else {
                resultDiv.innerHTML = `✨ Adjust the sliders to discover your strongest area.`;
            }
        });
    }

    function initMindsetMeter() {
        const statements = [
            { id: 'q1', reverse: false },  // I believe I can learn new skills with effort.
            { id: 'q2', reverse: true },   // I avoid challenges where I might fail.
            { id: 'q3', reverse: false },  // Feedback helps me grow.
            { id: 'q4', reverse: true },   // I feel threatened by the success of others.
            { id: 'q5', reverse: false }   // I persist even when things are difficult.
        ];

        const sliders = {};
        const displays = {};
        statements.forEach(s => {
            const slider = document.getElementById(s.id);
            const display = document.getElementById(s.id + 'Val');
            if (slider && display) {
                sliders[s.id] = slider;
                displays[s.id] = display;
                slider.addEventListener('input', () => {
                    display.textContent = slider.value;
                });
            }
        });

        const calculateBtn = document.getElementById('mindsetCalculate');
        const resultDiv = document.getElementById('mindsetResult');

        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let total = 0;
            statements.forEach(s => {
                let val = parseInt(sliders[s.id]?.value) || 5;
                if (s.reverse) val = 10 - val;  // reverse score
                total += val;
            });
            const maxScore = statements.length * 10;
            const percentage = Math.round((total / maxScore) * 100);
            let interpretation = '';
            if (percentage >= 80) {
                interpretation = '🔥 Strong growth mindset! You embrace challenges and see effort as a path to mastery.';
            } else if (percentage >= 60) {
                interpretation = '🌱 Developing growth mindset – you have good tendencies but some fixed beliefs may hold you back.';
            } else {
                interpretation = '🪨 Predominantly fixed mindset – but don’t worry, mindsets can be changed with awareness and practice.';
            }
            resultDiv.innerHTML = `Your growth mindset score: <strong>${percentage}%</strong>. ${interpretation}`;
        });
    }

    function initBurnoutChecker() {
        // Sliders
        const sliders = {
            hours: document.getElementById('workHours'),
            sleep: document.getElementById('sleepHours'),
            breaks: document.getElementById('breaks'),
            stress: document.getElementById('stressLevel'),
            support: document.getElementById('supportSystem')
        };
        const displays = {
            hours: document.getElementById('workHoursVal'),
            sleep: document.getElementById('sleepHoursVal'),
            breaks: document.getElementById('breaksVal'),
            stress: document.getElementById('stressLevelVal'),
            support: document.getElementById('supportSystemVal')
        };
        const calculateBtn = document.getElementById('burnoutCalculate');
        const resultDiv = document.getElementById('burnoutResult');

        // Live updates
        for (let key in sliders) {
            if (sliders[key] && displays[key]) {
                sliders[key].addEventListener('input', (function(k) {
                    return function() {
                        displays[k].textContent = sliders[k].value;
                    };
                })(key));
            }
        }

        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Get values
            const hours = parseInt(sliders.hours.value) || 40;
            const sleep = parseInt(sliders.sleep.value) || 7;
            const breaks = parseInt(sliders.breaks.value) || 5;
            const stress = parseInt(sliders.stress.value) || 5;
            const support = parseInt(sliders.support.value) || 5;

            // Simple scoring algorithm (higher score = higher risk)
            let riskScore = 0;
            // Work hours: >45 adds risk
            if (hours > 45) riskScore += 2;
            else if (hours > 40) riskScore += 1;
            // Sleep: <7 adds risk
            if (sleep < 6) riskScore += 2;
            else if (sleep < 7) riskScore += 1;
            // Breaks: <5 adds risk
            if (breaks < 4) riskScore += 2;
            else if (breaks < 6) riskScore += 1;
            // Stress: >7 adds risk
            if (stress > 7) riskScore += 2;
            else if (stress > 5) riskScore += 1;
            // Support: <4 adds risk
            if (support < 4) riskScore += 2;
            else if (support < 6) riskScore += 1;

            let riskLevel = '';
            let advice = '';
            if (riskScore >= 7) {
                riskLevel = '🔥 High Burnout Risk';
                advice = 'You are showing multiple signs of burnout risk. Please consider reducing workload, prioritizing sleep, and seeking support.';
            } else if (riskScore >= 4) {
                riskLevel = '⚠️ Moderate Burnout Risk';
                advice = 'Some areas need attention. Focus on improving your lowest-scoring factors to prevent burnout.';
            } else {
                riskLevel = '✅ Low Burnout Risk';
                advice = 'You’re managing well! Keep maintaining healthy habits as you upskill.';
            }

            resultDiv.innerHTML = `<strong>${riskLevel}</strong><br>${advice}`;
        });
    }

    function initSideHustleCalc() {
        const hoursSlider = document.getElementById('hoursPerWeek');
        const rateSlider = document.getElementById('hourlyRate');
        const costsSlider = document.getElementById('startupCosts');
        const hoursVal = document.getElementById('hoursPerWeekVal');
        const rateVal = document.getElementById('hourlyRateVal');
        const costsVal = document.getElementById('startupCostsVal');
        const calcBtn = document.getElementById('sideHustleCalc');
        const resultDiv = document.getElementById('sideHustleResult');

        // Live updates
        if (hoursSlider && hoursVal) {
            hoursSlider.addEventListener('input', () => { hoursVal.textContent = hoursSlider.value; });
        }
        if (rateSlider && rateVal) {
            rateSlider.addEventListener('input', () => { rateVal.textContent = rateSlider.value; });
        }
        if (costsSlider && costsVal) {
            costsSlider.addEventListener('input', () => { costsVal.textContent = costsSlider.value; });
        }

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const hours = parseFloat(hoursSlider.value) || 0;
            const rate = parseFloat(rateSlider.value) || 0;
            const costs = parseFloat(costsSlider.value) || 0;

            const weeklyIncome = hours * rate;
            const monthlyIncome = weeklyIncome * 4.33; // average weeks per month
            const annualIncome = monthlyIncome * 12;
            const netMonthly = monthlyIncome - (costs / 12); // amortize startup costs over a year
            const netAnnual = annualIncome - costs;

            resultDiv.innerHTML = `
                    <p><strong>📊 Estimated Earnings (before tax)</strong></p>
                    <p>Weekly: $${weeklyIncome.toFixed(0)}<br>
                    Monthly: $${monthlyIncome.toFixed(0)}<br>
                    Yearly: $${annualIncome.toFixed(0)}</p>
                    <p><strong>After startup costs (amortized):</strong><br>
                    Net Monthly: $${netMonthly.toFixed(0)}<br>
                    Net Yearly: $${netAnnual.toFixed(0)}</p>
                    <p style="font-size:0.9rem; color:var(--gray-color);">*Startup costs spread over 12 months. Taxes not included.</p>
                `;
        });
    }

    function initNegotiationSimulator() {
        const currentSlider = document.getElementById('currentSalary');
        const raiseSlider = document.getElementById('targetRaise');
        const yearsSlider = document.getElementById('yearsExperience');
        const calcBtn = document.getElementById('negotiationSimulateBtn');
        const resultDiv = document.getElementById('negotiationResult');

        if (!currentSlider || !raiseSlider || !yearsSlider || !calcBtn || !resultDiv) {
            return;
        }

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const current = parseFloat(currentSlider.value) || 0;
            const raisePct = parseFloat(raiseSlider.value) || 0;
            const years = parseFloat(yearsSlider.value) || 0;

            const additionalPerYear = current * (raisePct / 100);
            const lifetimeGain = additionalPerYear * years;

            resultDiv.innerHTML = `
            <p class="result-label">Estimated lifetime gain</p>
            <div class="result-number">$${lifetimeGain.toLocaleString()}</div>
            <p class="result-sub">Based on $${additionalPerYear.toLocaleString()} extra per year for ${years} years.</p>
        `;
        });
    }

    function initLinkedInAnalyzer() {
        const completeness = document.getElementById('profileCompleteness');
        const experience = document.getElementById('experienceDetails');
        const recs = document.getElementById('recommendations');
        const network = document.getElementById('networkEngagement');
        const analyzeBtn = document.getElementById('linkedinAnalyzeBtn');
        const resultDiv = document.getElementById('linkedinResult');

        if (!completeness || !experience || !recs || !network || !analyzeBtn || !resultDiv) return;

        analyzeBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const c = parseInt(completeness.value) || 0;
            const ex = parseInt(experience.value) || 0;
            const r = parseInt(recs.value) || 0;
            const n = parseInt(network.value) || 0;

            const total = c + ex + r + n;
            const max = 400;
            const percentage = Math.round((total / max) * 100);

            let feedback = '';
            if (percentage >= 80) feedback = '🔥 Excellent! Your profile is highly attractive to recruiters. Keep up the engagement.';
            else if (percentage >= 60) feedback = '👍 Good profile. Focus on improving your lowest scores to stand out even more.';
            else if (percentage >= 40) feedback = '🛠️ Needs work. Prioritize the areas with the lowest scores – they make the biggest difference.';
            else feedback = '⚠️ Your profile needs significant improvement. Start with a professional photo and a keyword‑rich headline.';

            resultDiv.innerHTML = `
            <p class="result-label">Your profile strength score: ${percentage}%</p>
            <div class="result-number">${total}/400</div>
            <p class="result-sub">${feedback}</p>
        `;
        });
    }

    function initLaunchTracker() {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        const completedSpan = document.getElementById('completedCount');
        const totalSpan = document.getElementById('totalCount');
        const progressBar = document.getElementById('progressBar');
        const resetBtn = document.getElementById('resetChecklistBtn');

        if (!checkboxes.length || !completedSpan || !totalSpan || !progressBar || !resetBtn) return;

        const total = checkboxes.length;
        totalSpan.textContent = total;

        function updateProgress() {
            const checked = document.querySelectorAll('.task-checkbox:checked').length;
            const percent = (checked / total) * 100;
            completedSpan.textContent = checked;
            progressBar.style.width = percent + '%';

            // Optional: add a class to parent for styling
            checkboxes.forEach(cb => {
                const item = cb.closest('.checklist-item');
                if (item) {
                    if (cb.checked) {
                        item.classList.add('completed');
                    } else {
                        item.classList.remove('completed');
                    }
                }
            });
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateProgress);
        });

        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkboxes.forEach(cb => { cb.checked = false; });
            updateProgress();
        });

        // Initial update
        updateProgress();
    }

    function initNetworkingMeter() {
        const outreach = document.getElementById('outreachComfort');
        const questions = document.getElementById('questionSkill');
        const followup = document.getElementById('followUpSkill');
        const relationship = document.getElementById('relationshipSkill');
        const calcBtn = document.getElementById('networkingMeterBtn');
        const resultDiv = document.getElementById('networkingResult');

        if (!outreach || !questions || !followup || !relationship || !calcBtn || !resultDiv) return;

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const o = parseInt(outreach.value) || 0;
            const q = parseInt(questions.value) || 0;
            const f = parseInt(followup.value) || 0;
            const r = parseInt(relationship.value) || 0;

            const total = o + q + f + r;
            const max = 400;
            const percentage = Math.round((total / max) * 100);

            let feedback = '';
            if (percentage >= 80) feedback = '🔥 Networking pro! You’re comfortable across the board. Focus on mentoring others and expanding your reach.';
            else if (percentage >= 60) feedback = '👍 Solid foundation. Work on your lowest score to become more confident.';
            else if (percentage >= 40) feedback = '🌱 Getting there. Practice one skill at a time – start with outreach or follow‑up.';
            else feedback = '🛠️ Networking may feel intimidating. Begin with small steps: send one message this week.';

            resultDiv.innerHTML = `
            <p class="result-label">Your networking confidence: ${percentage}%</p>
            <div class="result-number">${total}/400</div>
            <p class="result-sub">${feedback}</p>
        `;
        });
    }

    function initMasteryScorecard() {
        const practice = document.getElementById('practiceHours');
        const feedback = document.getElementById('feedbackQuality');
        const project = document.getElementById('projectIntensity');
        const teaching = document.getElementById('teachingSharing');
        const calcBtn = document.getElementById('masteryScoreBtn');
        const resultDiv = document.getElementById('masteryResult');

        if (!practice || !feedback || !project || !teaching || !calcBtn || !resultDiv) return;

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const p = parseInt(practice.value) || 0;
            const f = parseInt(feedback.value) || 0;
            const pr = parseInt(project.value) || 0;
            const t = parseInt(teaching.value) || 0;

            // Weighted score: practice hours (max 40) * 2, others 0-100
            const practiceScore = Math.min(p, 40) * 2.5; // max 100
            const total = Math.min(practiceScore + f + pr + t, 400);
            const percentage = Math.round((total / 400) * 100);

            let feedbackText = '';
            if (percentage >= 80) feedbackText = '🔥 You’re on the path to mastery! Keep challenging yourself and sharing your knowledge.';
            else if (percentage >= 60) feedbackText = '👍 Strong foundation. Focus on increasing feedback quality and tackling harder projects.';
            else if (percentage >= 40) feedbackText = '🌱 Good start. Add more deliberate practice and seek feedback to accelerate.';
            else feedbackText = '🛠️ Early stage. Commit to regular practice and build your first real project.';

            resultDiv.innerHTML = `
            <p class="result-label">Your mastery score: ${percentage}%</p>
            <div class="result-number">${Math.round(total)}/400</div>
            <p class="result-sub">${feedbackText}</p>
        `;
        });
    }

    function initAIOpportunityScore() {
        const repetitive = document.getElementById('repetitiveTasks');
        const data = document.getElementById('dataProcessing');
        const content = document.getElementById('contentCreation');
        const research = document.getElementById('researchLoad');
        const calcBtn = document.getElementById('aiOpportunityBtn');
        const resultDiv = document.getElementById('aiOpportunityResult');

        if (!repetitive || !data || !content || !research || !calcBtn || !resultDiv) return;

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const r = parseInt(repetitive.value) || 0;
            const d = parseInt(data.value) || 0;
            const c = parseInt(content.value) || 0;
            const rs = parseInt(research.value) || 0;

            // Weighted score: each out of 100, average for overall opportunity
            const avg = (r + d + c + rs) / 4;
            const score = Math.round(avg);

            let feedback = '';
            let tools = [];

            if (r > 60) tools.push('Zapier, Make, or UI.Path for automation');
            if (d > 60) tools.push('Perplexity AI, Elicit, Julius AI for research & data');
            if (c > 60) tools.push('ChatGPT, Claude, Copilot, Midjourney for creation');
            if (rs > 60) tools.push('ChatGPT, Elicit, or custom GPTs for research synthesis');

            if (score >= 70) {
                feedback = '🔥 Huge opportunity! You could save 10+ hours/week. Start with: ' + (tools.length ? tools.slice(0,2).join(', ') : 'automation tools');
            } else if (score >= 50) {
                feedback = '👍 Solid potential. Focus on your highest area: ' + (tools.length ? tools[0] : 'try automating repetitive tasks');
            } else if (score >= 30) {
                feedback = '🌱 Moderate opportunity. Pick one area to pilot – perhaps ' + (tools.length ? tools[0] : 'content creation');
            } else {
                feedback = '🛠️ Your current work may have limited AI leverage, but you can still experiment with tools like ChatGPT for idea generation.';
            }

            resultDiv.innerHTML = `
            <p class="result-label">Your AI opportunity score: ${score}%</p>
            <div class="result-number">${Math.round(avg)}/100</div>
            <p class="result-sub">${feedback}</p>
        `;
        });
    }

    function initWebsiteReadiness() {
        const message = document.getElementById('messageClarity');
        const design = document.getElementById('designQuality');
        const content = document.getElementById('contentDepth');
        const promo = document.getElementById('promotionPlan');
        const calcBtn = document.getElementById('websiteReadinessBtn');
        const resultDiv = document.getElementById('websiteReadinessResult');

        if (!message || !design || !content || !promo || !calcBtn || !resultDiv) return;

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const m = parseInt(message.value) || 0;
            const d = parseInt(design.value) || 0;
            const c = parseInt(content.value) || 0;
            const p = parseInt(promo.value) || 0;

            const total = m + d + c + p;
            const max = 400;
            const percentage = Math.round((total / max) * 100);

            let feedback = '';
            if (percentage >= 80) {
                feedback = '🔥 You’re ready to launch! Focus on promotion and consistency.';
            } else if (percentage >= 60) {
                feedback = '👍 Good foundation. Prioritize improving your lowest score before launch.';
            } else if (percentage >= 40) {
                feedback = '🌱 Needs work. Start with message clarity and basic design – you can launch a simple site quickly.';
            } else {
                feedback = '🛠️ Early stage. Define your message and choose a platform – use the 7‑day plan above.';
            }

            resultDiv.innerHTML = `
            <p class="result-label">Your readiness score: ${percentage}%</p>
            <div class="result-number">${Math.round(total)}/400</div>
            <p class="result-sub">${feedback}</p>
        `;
        });
    }

    function initCertROI() {
        const certCost = document.getElementById('certCost');
        const certTime = document.getElementById('certTime');
        const certRaise = document.getElementById('certRaise');
        const expTime = document.getElementById('expTime');
        const expRaise = document.getElementById('expRaise');
        const calcBtn = document.getElementById('certROIBtn');
        const resultDiv = document.getElementById('certResult');

        if (!certCost || !certTime || !certRaise || !expTime || !expRaise || !calcBtn || !resultDiv) return;

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const cCost = parseFloat(certCost.value) || 0;
            const cMonths = parseFloat(certTime.value) || 1;
            const cRaise = parseFloat(certRaise.value) || 0;

            const eMonths = parseFloat(expTime.value) || 1;
            const eRaise = parseFloat(expRaise.value) || 0;

            // Simple ROI calculation: annual raise minus cost, divided by months invested (as proxy for effort)
            const certROI = (cRaise - cCost) / cMonths;
            const expROI = eRaise / eMonths; // experience usually has low direct cost

            let message = '';
            if (certROI > expROI && certROI > 0) {
                message = '📜 Certification path gives higher ROI in this scenario. Make sure the certification is recognised in your field.';
            } else if (expROI > certROI && expROI > 0) {
                message = '💼 Experience path gives higher ROI. Focus on building projects and a portfolio.';
            } else if (certROI <= 0 && expROI <= 0) {
                message = '⚠️ Neither path shows positive short‑term ROI. Consider re‑evaluating your numbers or exploring other options.';
            } else if (certROI === expROI) {
                message = '⚖️ Both paths have similar ROI. Choose based on your learning style and industry norms.';
            }

            resultDiv.innerHTML = `
            <p class="result-label">ROI Comparison</p>
            <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                <div><strong>Certification ROI:</strong> ${certROI.toFixed(0)}</div>
                <div><strong>Experience ROI:</strong> ${expROI.toFixed(0)}</div>
            </div>
            <p class="result-sub">${message}</p>
        `;
        });
    }

})();
