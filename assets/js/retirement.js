/* assets/js/retirement.js */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            initRetirementBasicsCalculator();
            initCompoundCalculator();
            initAccountSelector();
            initFourPercentRuleCalculator();
            initInflationCalculator();
            initLongevityCalculator();
            initSequenceRiskSimulator();
            initHealthcareProjector();
            initFeeCalculator();
            initAutomationSimulator();
            initGlidePathVisualizer();
            initMatchCalculator();
            initWithdrawalOptimizer();
            initSocialSecurityCalculator();
            initRMDCalculator();
            initEstateSimulator();
        }
    });

    function initRetirementBasicsCalculator() {
        const calcBtn = document.getElementById('calculateRetirementBasics');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const currentAgeSlider = document.getElementById('currentAge');
        const retireAgeSlider = document.getElementById('retireAge');
        const currentAgeVal = document.getElementById('currentAgeVal');
        const retireAgeVal = document.getElementById('retireAgeVal');

        if (currentAgeSlider && currentAgeVal) {
            currentAgeSlider.addEventListener('input', function() {
                currentAgeVal.textContent = this.value;
            });
        }
        if (retireAgeSlider && retireAgeVal) {
            retireAgeSlider.addEventListener('input', function() {
                retireAgeVal.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function(e) {
            // Get values
            const currentAge = parseInt(document.getElementById('currentAge').value);
            const retireAge = parseInt(document.getElementById('retireAge').value);
            const targetNest = parseFloat(document.getElementById('targetNest').value);
            const annualReturn = parseFloat(document.getElementById('returnPct').value) / 100;

            // Basic validation
            if (isNaN(currentAge) || isNaN(retireAge) || isNaN(targetNest) || isNaN(annualReturn) ||
                currentAge <= 0 || retireAge <= currentAge || targetNest <= 0 || annualReturn < 0) {
                document.getElementById('retirementBasicsResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers and ensure retirement age > current age.</span>';
                return;
            }

            const years = retireAge - currentAge;
            const monthlyRate = annualReturn / 12;
            const months = years * 12;

            // Solve for monthly payment needed to reach targetNest (future value of an annuity)
            // Formula: FV = P * [((1+r)^n - 1) / r]  =>  P = FV / [((1+r)^n - 1) / r]
            let monthlyPayment;
            if (annualReturn === 0) {
                monthlyPayment = targetNest / months;
            } else {
                const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
                monthlyPayment = targetNest / factor;
            }

            // Also compute what it would take if you had started 10 years earlier (if possible)
            let earlyComparison = '';
            if (currentAge - 10 >= 18) {
                const earlyYears = years + 10;
                const earlyMonths = earlyYears * 12;
                let earlyPayment;
                if (annualReturn === 0) {
                    earlyPayment = targetNest / earlyMonths;
                } else {
                    const earlyFactor = (Math.pow(1 + monthlyRate, earlyMonths) - 1) / monthlyRate;
                    earlyPayment = targetNest / earlyFactor;
                }
                const savingsPerMonth = monthlyPayment - earlyPayment;
                earlyComparison = `<p><strong>If you had started at age ${currentAge - 10}:</strong> you would need only $${earlyPayment.toFixed(2)} per month – saving you $${savingsPerMonth.toFixed(2)} each month!</p>`;
            }

            const resultDiv = document.getElementById('retirementBasicsResult');
            resultDiv.innerHTML = `
                <p><strong>To reach $${targetNest.toLocaleString()} by age ${retireAge}, starting at age ${currentAge}:</strong></p>
                <p style="font-size: 1.4rem; color: var(--retirement-color);">$${monthlyPayment.toFixed(2)} per month</p>
                <p>That's a total of $${(monthlyPayment * months).toFixed(2)} in contributions over ${years} years.</p>
                ${earlyComparison}
                <p><small>Assumes ${annualReturn*100}% annual return compounded monthly. Does not include taxes or inflation.</small></p>
            `;
        });
    }

    function initCompoundCalculator() {
        const calcBtn = document.getElementById('calculateCompound');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            // Get values
            const initial = parseFloat(document.getElementById('initialAmount').value) || 0;
            const monthly = parseFloat(document.getElementById('monthlyContribution').value) || 0;
            const annualRate = parseFloat(document.getElementById('annualReturn').value) / 100;
            const years = parseInt(document.getElementById('years').value) || 0;

            // Basic validation
            if (initial < 0 || monthly < 0 || annualRate < 0 || years <= 0) {
                document.getElementById('compoundResult').innerHTML = '<span style="color:red;">Please enter positive numbers and years > 0.</span>';
                document.getElementById('lateStartComparison').style.display = 'none';
                return;
            }

            const monthlyRate = annualRate / 12;
            const months = years * 12;

            // Future value formula with monthly contributions (end of period)
            let futureValue;
            if (annualRate === 0) {
                futureValue = initial + monthly * months;
            } else {
                // FV = PV*(1+r)^n + PMT * [((1+r)^n - 1) / r]
                const fvPrincipal = initial * Math.pow(1 + monthlyRate, months);
                const fvAnnuity = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
                futureValue = fvPrincipal + fvAnnuity;
            }

            const totalContributions = initial + monthly * months;
            const interestEarned = futureValue - totalContributions;

            // Display main result
            const resultDiv = document.getElementById('compoundResult');
            resultDiv.innerHTML = `
            <p><strong>Future value after ${years} years:</strong></p>
            <p style="font-size: 2rem; color: var(--retirement-color);">$${futureValue.toFixed(2)}</p>
            <p>Total contributions: $${totalContributions.toFixed(2)}<br>
            Interest earned: $${interestEarned.toFixed(2)}</p>
        `;

            // Comparison: start 5 years later
            const lateYears = Math.max(0, years - 5);
            if (lateYears > 0) {
                const lateMonths = lateYears * 12;
                let lateValue;
                if (annualRate === 0) {
                    lateValue = initial + monthly * lateMonths;
                } else {
                    const fvPrincipalLate = initial * Math.pow(1 + monthlyRate, lateMonths);
                    const fvAnnuityLate = monthly * ((Math.pow(1 + monthlyRate, lateMonths) - 1) / monthlyRate);
                    lateValue = fvPrincipalLate + fvAnnuityLate;
                }
                const lostGrowth = futureValue - lateValue;
                document.getElementById('lateStartComparison').innerHTML = `
                <p><i class="fas fa-exclamation-triangle"></i> <strong>If you wait 5 years</strong> (${lateYears} years total), you’d have only <strong>$${lateValue.toFixed(2)}</strong> – that’s <strong>$${lostGrowth.toFixed(2)} less</strong>!</p>
            `;
                document.getElementById('lateStartComparison').style.display = 'block';
            } else {
                document.getElementById('lateStartComparison').style.display = 'none';
            }
        });
    }

    function initAccountSelector() {
        const btn = document.getElementById('getRecommendation');
        if (!btn) return;

        btn.addEventListener('click', function() {
            // Gather inputs
            const matchOption = document.getElementById('hasMatch').value;
            const taxBracket = parseInt(document.getElementById('taxBracket').value);
            const futureTax = document.getElementById('futureTax').value;
            const age = parseInt(document.getElementById('age').value);
            const income = parseInt(document.getElementById('income').value);

            // Basic validation
            if (isNaN(age) || age < 18 || age > 75 || isNaN(income) || income < 0) {
                document.getElementById('recommendationResult').innerHTML = '<span style="color:red;">Please enter valid age and income.</span>';
                return;
            }

            // Start building recommendation text
            let recommendation = '';
            let reasoning = [];
            let order = [];

            // Rule 1: Always get the full employer match first
            if (matchOption === 'yes-not-enough') {
                order.push('Increase your 401(k) contribution to get the full employer match – it’s an immediate 100% return.');
                reasoning.push('You are leaving free money on the table.');
            } else if (matchOption === 'yes') {
                order.push('You are already getting the full match – great job!');
            }

            // Rule 2: Consider Roth vs Traditional based on tax expectations
            if (futureTax === 'higher') {
                order.push('Roth IRA or Roth 401(k) may be better because you expect higher taxes later.');
                reasoning.push('Paying taxes now at a lower rate locks in tax‑free growth.');
            } else if (futureTax === 'lower') {
                order.push('Traditional (pre‑tax) accounts may be better if you expect lower taxes in retirement.');
                reasoning.push('You get a deduction now and pay later at a lower rate.');
            } else {
                order.push('Traditional and Roth are roughly equal from a tax‑rate perspective. Diversification is good!');
            }

            // Rule 3: Check Roth IRA income limits (simplified 2024 single filer)
            const rothPhaseOutStart = 146000; // 2024 single
            const rothPhaseOutEnd = 161000;
            let rothEligible = true;
            let rothNote = '';
            if (income > rothPhaseOutEnd) {
                rothEligible = false;
                rothNote = 'Your income exceeds the Roth IRA direct contribution limit. You may consider a Backdoor Roth IRA.';
            } else if (income > rothPhaseOutStart) {
                rothNote = `Your income is in the phase‑out range for Roth IRA ($${rothPhaseOutStart.toLocaleString()}–$${rothPhaseOutEnd.toLocaleString()}). You can contribute a reduced amount or use a Backdoor Roth.`;
            }

            // Rule 4: If no employer plan or after match, prioritize IRA
            if (matchOption === 'no') {
                order.push('Consider opening an IRA (Roth or Traditional) before additional 401(k) contributions for more investment choices and lower fees.');
            } else {
                order.push('After getting the full match, consider contributing to an IRA (Roth if eligible) before adding more to your 401(k).');
            }

            // If Roth not eligible, note Traditional IRA may be deductible depending on income & workplace plan
            if (!rothEligible && matchOption !== 'no') {
                order.push('Since you have a workplace plan and high income, your Traditional IRA contributions may not be deductible. A Backdoor Roth IRA could be a workaround.');
            }

            // Assemble output
            let html = '<p><strong>Your personalized account priority:</strong></p><ol>';
            order.forEach(item => html += `<li>${item}</li>`);
            html += '</ol>';

            if (rothNote) {
                html += `<p><i class="fas fa-info-circle"></i> ${rothNote}</p>`;
            }

            // Add a rough tax savings estimate (just for engagement)
            const annualContribution = 6000; // assume max IRA or 401k contribution for illustration
            let taxSavings = 0;
            if (futureTax === 'higher' && rothEligible) {
                // Roth doesn't give immediate savings, but we can show long-term benefit
                html += `<p><i class="fas fa-chart-line"></i> If you contribute $6,000 to a Roth IRA annually for 30 years at 7%, you could have approximately $566,000 tax‑free in retirement (vs. ~$425,000 after taxes in a traditional account if you pay 25% later).</p>`;
            } else if (futureTax === 'lower' || futureTax === 'same') {
                taxSavings = annualContribution * (taxBracket / 100);
                html += `<p><i class="fas fa-coins"></i> By contributing $6,000 to a traditional 401(k) or IRA, you could reduce your taxes by roughly $${taxSavings.toFixed(0)} this year (assuming ${taxBracket}% bracket).</p>`;
            }

            document.getElementById('recommendationResult').innerHTML = html;
        });
    }

    function initFourPercentRuleCalculator() {
        const calcBtn = document.getElementById('calculateFourPercent');
        if (!calcBtn) return;

        // Update displayed withdrawal rate value
        const rateSlider = document.getElementById('withdrawalRate');
        const rateVal = document.getElementById('withdrawalRateVal');
        if (rateSlider && rateVal) {
            rateSlider.addEventListener('input', function() {
                rateVal.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const spending = parseFloat(document.getElementById('annualSpending').value);
            const rate = parseFloat(document.getElementById('withdrawalRate').value) / 100;

            if (isNaN(spending) || spending <= 0 || isNaN(rate) || rate <= 0) {
                document.getElementById('fourPercentResult').innerHTML = '<span style="color:red;">Please enter a positive spending amount and a valid withdrawal rate.</span>';
                document.getElementById('withdrawalComparison').style.display = 'none';
                return;
            }

            const nestEgg = spending / rate;
            const formattedNestEgg = nestEgg.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); // add commas

            // Also calculate what a 3% and 5% rate would require for comparison
            const nestEgg3 = spending / 0.03;
            const nestEgg5 = spending / 0.05;
            const formatted3 = nestEgg3.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            const formatted5 = nestEgg5.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('fourPercentResult');
            resultDiv.innerHTML = `
            <p><strong>At a ${(rate*100).toFixed(1)}% withdrawal rate:</strong></p>
            <p style="font-size: 2rem; color: var(--retirement-color);">$${formattedNestEgg}</p>
            <p>That means you need <strong>$${formattedNestEgg}</strong> saved to safely withdraw $${spending.toLocaleString()} per year.</p>
        `;

            const comparisonDiv = document.getElementById('withdrawalComparison');
            comparisonDiv.innerHTML = `
            <p><i class="fas fa-chart-line"></i> <strong>How changing the rate affects your target:</strong></p>
            <ul style="margin-left:20px;">
                <li>3% withdrawal → $${formatted3}</li>
                <li>5% withdrawal → $${formatted5}</li>
            </ul>
            <p>A lower rate offers more safety, especially if you retire early or expect lower market returns.</p>
        `;
            comparisonDiv.style.display = 'block';
        });
    }

    function initInflationCalculator() {
        const calcBtn = document.getElementById('calculateInflation');
        if (!calcBtn) return;

        // Update displayed inflation rate value
        const rateSlider = document.getElementById('inflationRate');
        const rateVal = document.getElementById('inflationRateVal');
        if (rateSlider && rateVal) {
            rateSlider.addEventListener('input', function() {
                rateVal.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const present = parseFloat(document.getElementById('presentAmount').value);
            const years = parseInt(document.getElementById('futureYears').value);
            const rate = parseFloat(document.getElementById('inflationRate').value) / 100;

            if (isNaN(present) || present <= 0 || isNaN(years) || years <= 0 || isNaN(rate) || rate < 0) {
                document.getElementById('inflationResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                document.getElementById('inflationComparison').style.display = 'none';
                return;
            }

            // Future purchasing power = present / (1 + rate)^years
            const futurePower = present / Math.pow(1 + rate, years);
            const formattedFuture = futurePower.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            // Also calculate what you'd need in the future to have same purchasing power
            const neededFuture = present * Math.pow(1 + rate, years);
            const formattedNeeded = neededFuture.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('inflationResult');
            resultDiv.innerHTML = `
            <p><strong>At ${(rate*100).toFixed(1)}% annual inflation:</strong></p>
            <p style="font-size: 2rem; color: var(--retirement-color);">$${formattedFuture}</p>
            <p>$${present.toLocaleString()} today will have the same purchasing power as <strong>$${formattedFuture}</strong> in ${years} years.</p>
        `;

            const comparisonDiv = document.getElementById('inflationComparison');
            comparisonDiv.innerHTML = `
            <p><i class="fas fa-chart-line"></i> <strong>To maintain today's purchasing power in ${years} years:</strong></p>
            <p>You would need <strong>$${formattedNeeded}</strong> in the future.</p>
            <p>That's an increase of $${(neededFuture - present).toFixed(2)}!</p>
        `;
            comparisonDiv.style.display = 'block';
        });
    }

    function initLongevityCalculator() {
        const calcBtn = document.getElementById('calculateLongevity');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function() {
            const age = parseInt(document.getElementById('currentAgeLong').value);
            const gender = document.getElementById('gender').value;
            const spending = parseFloat(document.getElementById('annualSpendingLong').value);
            const annualReturn = parseFloat(document.getElementById('returnLong').value) / 100;

            if (isNaN(age) || age < 18 || age > 90 || isNaN(spending) || spending <= 0 || isNaN(annualReturn) || annualReturn < 0) {
                document.getElementById('longevityResult').innerHTML = '<span style="color:red;">Please enter valid numbers (age 18‑90, positive spending, non‑negative return).</span>';
                return;
            }

            // Simplified life expectancy based on Social Security tables (approximate)
            // For demo: female life expectancy ~85, male ~82 at birth; adjust for current age.
            let lifeExpectancy;
            if (gender === 'female') {
                lifeExpectancy = 85 + (65 - age) * 0.2; // rough adjustment: younger than 65 add a bit
            } else {
                lifeExpectancy = 82 + (65 - age) * 0.15;
            }
            lifeExpectancy = Math.max(age + 10, Math.min(age + 40, lifeExpectancy)); // clamp to reasonable range

            const yearsInRetirement = lifeExpectancy - age;
            if (yearsInRetirement <= 0) {
                document.getElementById('longevityResult').innerHTML = '<span style="color:red;">Life expectancy is less than your current age? Please check inputs.</span>';
                return;
            }

            // Calculate nest egg needed using annuity formula (assuming withdrawals at end of year)
            // Present value of a stream of $spending for yearsInRetirement, discounted at annualReturn
            let nestEgg;
            if (annualReturn === 0) {
                nestEgg = spending * yearsInRetirement;
            } else {
                nestEgg = spending * (1 - Math.pow(1 + annualReturn, -yearsInRetirement)) / annualReturn;
            }

            // Also calculate for a longer horizon (95th percentile) – add 8 years to life expectancy
            const longYears = yearsInRetirement + 8;
            let nestEggLong;
            if (annualReturn === 0) {
                nestEggLong = spending * longYears;
            } else {
                nestEggLong = spending * (1 - Math.pow(1 + annualReturn, -longYears)) / annualReturn;
            }

            const formattedNestEgg = nestEgg.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            const formattedLong = nestEggLong.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('longevityResult');
            resultDiv.innerHTML = `
            <p><strong>Based on your inputs:</strong></p>
            <p>Estimated life expectancy: <strong>${lifeExpectancy.toFixed(0)} years</strong> (you may live to age ${lifeExpectancy.toFixed(0)}).</p>
            <p>If you retire now at age ${age}, you could need funding for <strong>${yearsInRetirement} years</strong>.</p>
            <p style="font-size: 1.5rem; color: var(--retirement-color);">Nest egg needed: $${formattedNestEgg}</p>
            <p>To be safer (95th percentile, living to age ${(age + longYears).toFixed(0)}), you might need <strong>$${formattedLong}</strong>.</p>
            <p><small>This assumes you want to spend $${spending.toLocaleString()} per year (in today's dollars, adjusted for inflation) and earn ${annualReturn*100}% on your portfolio. Actual results vary.</small></p>
        `;
        });
    }

    function initSequenceRiskSimulator() {
        const simBtn = document.getElementById('simulateSequence');
        if (!simBtn) return;

        simBtn.addEventListener('click', function() {
            const startPortfolio = parseFloat(document.getElementById('startPortfolio').value);
            const withdrawal = parseFloat(document.getElementById('annualWithdrawal').value);

            if (isNaN(startPortfolio) || startPortfolio <= 0 || isNaN(withdrawal) || withdrawal < 0) {
                document.getElementById('sequenceResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Define two sequences with same average return (approx 5% over 10 years)
            // Sequence A (bad early): Year1: -20%, Year2-10: +7% (average ~5%)
            // Sequence B (good early): Year1-9: +7%, Year10: -20%
            const years = 10;
            let portfolioA = startPortfolio;
            let portfolioB = startPortfolio;

            // Store year-by-year for explanation
            let historyA = [];
            let historyB = [];

            // Simulate Sequence A
            for (let year = 1; year <= years; year++) {
                let returnRate = (year === 1) ? -0.20 : 0.07;
                portfolioA = portfolioA * (1 + returnRate) - withdrawal;
                if (portfolioA < 0) portfolioA = 0; // no negative
                historyA.push({ year, return: returnRate * 100, value: portfolioA });
            }

            // Simulate Sequence B
            for (let year = 1; year <= years; year++) {
                let returnRate = (year === 10) ? -0.20 : 0.07;
                portfolioB = portfolioB * (1 + returnRate) - withdrawal;
                if (portfolioB < 0) portfolioB = 0;
                historyB.push({ year, return: returnRate * 100, value: portfolioB });
            }

            // Format numbers
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            // Build result HTML
            let html = `
            <p><strong>After 10 years of withdrawals:</strong></p>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px; padding:10px; background:#f0eefb; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">📉 Bad Sequence (crash early)</h4>
                    <p>Year1: -20%, Years2‑10: +7%</p>
                    <p style="font-size:1.5rem;">${formatMoney(portfolioA)}</p>
                    <p>Total withdrawals: ${formatMoney(withdrawal * years)}</p>
                </div>
                <div style="flex:1; min-width:200px; padding:10px; background:#e6f7e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">📈 Good Sequence (crash late)</h4>
                    <p>Years1‑9: +7%, Year10: -20%</p>
                    <p style="font-size:1.5rem;">${formatMoney(portfolioB)}</p>
                    <p>Total withdrawals: ${formatMoney(withdrawal * years)}</p>
                </div>
            </div>
        `;

            // Add warning if one is depleted
            if (portfolioA === 0) {
                html += '<p style="color:red; margin-top:10px;">⚠️ The bad sequence portfolio was depleted before 10 years.</p>';
            }
            if (portfolioB === 0) {
                html += '<p style="color:red; margin-top:10px;">⚠️ The good sequence portfolio was depleted.</p>';
            }

            document.getElementById('sequenceResult').innerHTML = html;
        });
    }

    function initHealthcareProjector() {
        const calcBtn = document.getElementById('projectHealthcare');
        if (!calcBtn) return;

        // Show/hide LTC options based on checkbox
        const ltcCheck = document.getElementById('ltcCoverage');
        const ltcOptions = document.getElementById('ltcOptions');
        if (ltcCheck && ltcOptions) {
            ltcCheck.addEventListener('change', function() {
                ltcOptions.style.display = this.checked ? 'block' : 'none';
            });
        }

        // Update inflation display
        const inflSlider = document.getElementById('hcInflation');
        const inflVal = document.getElementById('hcInflationVal');
        if (inflSlider && inflVal) {
            inflSlider.addEventListener('input', function() {
                inflVal.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            // Gather inputs
            const currentAge = parseInt(document.getElementById('currentAgeHC').value);
            const retireAge = parseInt(document.getElementById('retireAgeHC').value);
            const lifeExp = parseInt(document.getElementById('lifeExpHC').value);
            const currentCost = parseFloat(document.getElementById('currentCostHC').value);
            const inflation = parseFloat(document.getElementById('hcInflation').value) / 100;

            if (isNaN(currentAge) || isNaN(retireAge) || isNaN(lifeExp) || isNaN(currentCost) || isNaN(inflation) ||
                currentAge <= 0 || retireAge <= currentAge || lifeExp <= retireAge || currentCost < 0 || inflation < 0) {
                document.getElementById('healthcareResult').innerHTML = '<span style="color:red;">Please enter valid numbers: retirement age > current age, life expectancy > retirement age.</span>';
                return;
            }

            // Years in retirement
            const years = lifeExp - retireAge;
            let totalCost = 0;
            let yearByYear = [];

            // Project costs from retirement age to life expectancy
            for (let year = 0; year < years; year++) {
                let costThisYear = currentCost * Math.pow(1 + inflation, (retireAge - currentAge) + year);
                totalCost += costThisYear;
                yearByYear.push({ age: retireAge + year, cost: costThisYear });
            }

            // LTC calculation if checked
            let ltcSavings = 0;
            if (ltcCheck.checked) {
                const dailyBenefit = parseFloat(document.getElementById('ltcDaily').value) || 0;
                const coverageYears = parseFloat(document.getElementById('ltcYears').value) || 0;
                // Assume a 3‑year nursing home stay at some point – simplified: 3 years of full daily benefit
                if (dailyBenefit > 0 && coverageYears > 0) {
                    ltcSavings = dailyBenefit * 365 * coverageYears;
                    // But we should only apply if total cost > ltcSavings, else cap at total cost (simplified)
                    ltcSavings = Math.min(ltcSavings, totalCost * 0.6); // Rough estimate: LTC might cover a portion
                }
            }

            const totalWithLTC = totalCost - ltcSavings;

            // Formatting
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            // Build result
            let html = `
            <p><strong>Projected healthcare costs from age ${retireAge} to ${lifeExp} (${years} years):</strong></p>
            <p style="font-size: 2rem; color: var(--retirement-color);">${formatMoney(totalCost)}</p>
            <p>This assumes your current annual cost of ${formatMoney(currentCost)} grows at ${inflation*100}% per year until retirement, then continues.</p>
        `;

            if (ltcCheck.checked) {
                html += `
                <p>With LTC insurance covering approximately ${formatMoney(ltcSavings)} of potential long‑term care costs, your out‑of‑pocket total could be <strong>${formatMoney(totalWithLTC)}</strong>.</p>
            `;
            }

            // Add a sample year breakdown
            html += `<p><small>Sample year: at age ${retireAge}, annual cost ≈ ${formatMoney(yearByYear[0]?.cost || 0)}.</small></p>`;

            document.getElementById('healthcareResult').innerHTML = html;
        });
    }

    function initFeeCalculator() {
        const calcBtn = document.getElementById('calculateFees');
        if (!calcBtn) return;

        // Update displayed fee values
        const lowSlider = document.getElementById('lowFee');
        const lowVal = document.getElementById('lowFeeVal');
        if (lowSlider && lowVal) {
            lowSlider.addEventListener('input', function() {
                lowVal.textContent = this.value + '%';
            });
        }
        const highSlider = document.getElementById('highFee');
        const highVal = document.getElementById('highFeeVal');
        if (highSlider && highVal) {
            highSlider.addEventListener('input', function() {
                highVal.textContent = this.value + '%';
            });
        }

        calcBtn.addEventListener('click', function() {
            const initial = parseFloat(document.getElementById('initialFee').value) || 0;
            const monthly = parseFloat(document.getElementById('monthlyFee').value) || 0;
            const years = parseInt(document.getElementById('yearsFee').value) || 0;
            const grossReturn = parseFloat(document.getElementById('grossReturn').value) / 100 || 0;
            const lowFee = parseFloat(document.getElementById('lowFee').value) / 100 || 0;
            const highFee = parseFloat(document.getElementById('highFee').value) / 100 || 0;

            if (years <= 0 || grossReturn < 0 || lowFee < 0 || highFee < 0) {
                document.getElementById('feeResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const months = years * 12;
            const monthlyRateLow = (grossReturn - lowFee) / 12;
            const monthlyRateHigh = (grossReturn - highFee) / 12;

            // Future value with monthly contributions (end of period)
            let futureLow, futureHigh;
            if (monthlyRateLow <= -1) {
                futureLow = 0;
            } else {
                futureLow = initial * Math.pow(1 + monthlyRateLow, months) +
                    monthly * ((Math.pow(1 + monthlyRateLow, months) - 1) / monthlyRateLow);
            }
            if (monthlyRateHigh <= -1) {
                futureHigh = 0;
            } else {
                futureHigh = initial * Math.pow(1 + monthlyRateHigh, months) +
                    monthly * ((Math.pow(1 + monthlyRateHigh, months) - 1) / monthlyRateHigh);
            }

            const totalContributions = initial + monthly * months;
            const difference = futureLow - futureHigh;
            const percentLost = (difference / futureLow) * 100;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('feeResult').innerHTML = `
            <p><strong>After ${years} years:</strong></p>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px; padding:10px; background:#e6f7e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">Low fee (${(lowFee*100).toFixed(2)}%)</h4>
                    <p style="font-size:1.5rem;">${formatMoney(futureLow)}</p>
                </div>
                <div style="flex:1; min-width:200px; padding:10px; background:#ffe6e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">High fee (${(highFee*100).toFixed(2)}%)</h4>
                    <p style="font-size:1.5rem;">${formatMoney(futureHigh)}</p>
                </div>
            </div>
            <p style="margin-top:10px;">You could lose <strong>${formatMoney(difference)}</strong> (${percentLost.toFixed(1)}% of your potential) to higher fees.</p>
            <p><small>Total contributions: ${formatMoney(totalContributions)}</small></p>
        `;
        });
    }

    function initAutomationSimulator() {
        const simBtn = document.getElementById('simulateAutomation');
        if (!simBtn) return;

        // Update missed months display
        const missedSlider = document.getElementById('missedMonths');
        const missedVal = document.getElementById('missedVal');
        if (missedSlider && missedVal) {
            missedSlider.addEventListener('input', function() {
                missedVal.textContent = this.value;
            });
        }

        simBtn.addEventListener('click', function() {
            const monthly = parseFloat(document.getElementById('monthlyAuto').value) || 0;
            const years = parseInt(document.getElementById('yearsAuto').value) || 0;
            const annualReturn = parseFloat(document.getElementById('returnAuto').value) / 100 || 0;
            const missedPerYear = parseInt(document.getElementById('missedMonths').value) || 0;

            if (monthly <= 0 || years <= 0 || annualReturn < 0) {
                document.getElementById('automationResult').innerHTML = '<span style="color:red;">Please enter positive values.</span>';
                return;
            }

            const months = years * 12;
            const monthlyRate = annualReturn / 12;

            // Scenario 1: Full automation – contribute every month
            let autoFuture;
            if (annualReturn === 0) {
                autoFuture = monthly * months;
            } else {
                autoFuture = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            }

            // Scenario 2: Trying to time – miss X months per year
            const monthsInvested = months - (missedPerYear * years);
            if (monthsInvested < 0) {
                document.getElementById('automationResult').innerHTML = '<span style="color:red;">Too many missed months – you invest nothing.</span>';
                return;
            }

            // To simulate irregular investing, we approximate by investing monthly but with fewer total contributions.
            // A more accurate model would skip months, but the difference is small enough for illustration.
            let timingFuture;
            if (annualReturn === 0) {
                timingFuture = monthly * monthsInvested;
            } else {
                timingFuture = monthly * ((Math.pow(1 + monthlyRate, monthsInvested) - 1) / monthlyRate);
            }

            const totalContributionsAuto = monthly * months;
            const totalContributionsTiming = monthly * monthsInvested;
            const difference = autoFuture - timingFuture;
            const percentLost = (difference / autoFuture) * 100;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('automationResult').innerHTML = `
            <p><strong>After ${years} years:</strong></p>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px; padding:10px; background:#e6f7e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">✅ Full Automation</h4>
                    <p style="font-size:1.5rem;">${formatMoney(autoFuture)}</p>
                    <p>Total contributions: ${formatMoney(totalContributionsAuto)}</p>
                </div>
                <div style="flex:1; min-width:200px; padding:10px; background:#ffe6e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">⏱️ Trying to Time (miss ${missedPerYear} mo/yr)</h4>
                    <p style="font-size:1.5rem;">${formatMoney(timingFuture)}</p>
                    <p>Total contributions: ${formatMoney(totalContributionsTiming)}</p>
                </div>
            </div>
            <p style="margin-top:10px;">By trying to time the market, you could lose <strong>${formatMoney(difference)}</strong> (${percentLost.toFixed(1)}% of your potential).</p>
            <p><small>Assumes ${annualReturn*100}% annual return compounded monthly. Missing months means you invest less total, but also miss growth on that money.</small></p>
        `;
        });
    }

    function initGlidePathVisualizer() {
        const slider = document.getElementById('yearsToRetire');
        if (!slider) return;

        const yearsSpan = document.getElementById('yearsToRetireVal');
        const stockSpan = document.getElementById('stockPct');
        const bondSpan = document.getElementById('bondPct');
        const stockBar = document.getElementById('stockBar');
        const bondBar = document.getElementById('bondBar');

        function updateGlidePath() {
            const years = parseInt(slider.value);
            yearsSpan.textContent = years;

            // Simplified glide path formula: at 40 years -> 90% stocks; at 0 years -> 50% stocks
            // Linear interpolation: stock% = 90 - (40 - years) * (40/40?) Actually:
            // Range: 40 years -> 90%, 0 years -> 50%. Slope = (50-90)/(0-40) = (-40)/(-40)=1% per year.
            let stockPct = 90 - (40 - years); // because at years=40: 90 - 0 = 90; at years=0: 90 - 40 = 50
            // Clamp to reasonable bounds
            stockPct = Math.min(95, Math.max(30, stockPct));
            const bondPct = 100 - stockPct;

            stockSpan.textContent = stockPct;
            bondSpan.textContent = bondPct;
            stockBar.style.width = stockPct + '%';
            bondBar.style.width = bondPct + '%';
        }

        slider.addEventListener('input', updateGlidePath);
        updateGlidePath(); // initial
    }

    function initMatchCalculator() {
        const calcBtn = document.getElementById('calculateMatch');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function() {
            const salary = parseFloat(document.getElementById('salaryMatch').value) || 0;
            const matchType = document.getElementById('matchType').value;
            const currentPct = parseFloat(document.getElementById('currentContribution').value) || 0;
            const years = parseInt(document.getElementById('yearsMatch').value) || 0;
            const annualReturn = parseFloat(document.getElementById('returnMatch').value) / 100 || 0;

            if (salary <= 0 || currentPct < 0 || years <= 0 || annualReturn < 0) {
                document.getElementById('matchResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Parse match type: format "matchPct_maxPct"
            const [matchPercentStr, maxPercentStr] = matchType.split('_');
            const matchPercent = parseFloat(matchPercentStr); // e.g., 0.5 for 50%
            const maxPercent = parseFloat(maxPercentStr); // e.g., 6 for 6% of salary

            // Calculate maximum eligible salary for match
            const maxMatchableSalary = salary; // match applies to salary, up to maxPercent
            const maxEmployerContribution = salary * (maxPercent / 100) * matchPercent;

            // Your current contribution percentage (as decimal of salary)
            const yourContributionPct = currentPct / 100;
            const yourContributionDollars = salary * yourContributionPct;

            // Employer match based on your contribution (capped at maxPercent)
            const effectivePercent = Math.min(yourContributionPct, maxPercent / 100);
            const employerMatch = salary * effectivePercent * matchPercent;

            const missedMatch = Math.max(0, maxEmployerContribution - employerMatch);

            if (missedMatch === 0) {
                document.getElementById('matchResult').innerHTML = `
                <p style="color: green;"><i class="fas fa-check-circle"></i> Great job! You're getting the full employer match of $${maxEmployerContribution.toFixed(2)} per year.</p>
            `;
                return;
            }

            // Future value of missed match if invested annually
            let futureValueMissed;
            if (annualReturn === 0) {
                futureValueMissed = missedMatch * years;
            } else {
                // Assume missed match is an annual amount you could have invested at year end
                futureValueMissed = missedMatch * ((Math.pow(1 + annualReturn, years) - 1) / annualReturn);
            }

            const totalMissed = missedMatch * years;
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('matchResult').innerHTML = `
            <p><strong>You're leaving free money on the table!</strong></p>
            <p>Maximum possible employer match: ${formatMoney(maxEmployerContribution)} per year.</p>
            <p>With your current ${currentPct}% contribution, you're getting only ${formatMoney(employerMatch)} per year.</p>
            <p style="font-size: 1.5rem; color: var(--retirement-color);">Missed match per year: ${formatMoney(missedMatch)}</p>
            <p>Over ${years} years, that adds up to <strong>${formatMoney(totalMissed)}</strong> in missed contributions.</p>
            <p>If invested at ${annualReturn*100}% annual return, the future value of those missed matches could have been <strong>${formatMoney(futureValueMissed)}</strong>.</p>
            <p><small>This assumes you invest the missed match annually at year-end. Actual results vary.</small></p>
        `;
        });
    }

    function initWithdrawalOptimizer() {
        const compareBtn = document.getElementById('compareWithdrawals');
        if (!compareBtn) return;

        // Update tax bracket display
        const taxSlider = document.getElementById('taxBracketWithdraw');
        const taxSpan = document.getElementById('taxBracketVal');
        if (taxSlider && taxSpan) {
            taxSlider.addEventListener('input', () => {
                taxSpan.textContent = taxSlider.value;
            });
        }
        const ltcgSlider = document.getElementById('ltcgRate');
        const ltcgSpan = document.getElementById('ltcgVal');
        if (ltcgSlider && ltcgSpan) {
            ltcgSlider.addEventListener('input', () => {
                ltcgSpan.textContent = ltcgSlider.value;
            });
        }

        compareBtn.addEventListener('click', function() {
            const balTrad = parseFloat(document.getElementById('balanceTraditional').value) || 0;
            const balRoth = parseFloat(document.getElementById('balanceRoth').value) || 0;
            const balTax = parseFloat(document.getElementById('balanceTaxable').value) || 0;
            const spend = parseFloat(document.getElementById('spendingWithdraw').value) || 0;
            const years = parseInt(document.getElementById('yearsWithdraw').value) || 1;
            const taxRate = parseFloat(document.getElementById('taxBracketWithdraw').value) / 100 || 0;
            const ltcgRate = parseFloat(document.getElementById('ltcgRate').value) / 100 || 0;

            if (balTrad < 0 || balRoth < 0 || balTax < 0 || spend <= 0 || years <= 0) {
                document.getElementById('withdrawalResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Simulate two strategies over 'years' (simplified: no growth, just withdrawal order)
            // Strategy A: taxable first, then traditional, then Roth
            let remainingTrad = balTrad;
            let remainingRoth = balRoth;
            let remainingTax = balTax;
            let taxesA = 0;

            for (let y = 0; y < years; y++) {
                let needed = spend;
                // Take from taxable first
                if (remainingTax > 0) {
                    const fromTax = Math.min(needed, remainingTax);
                    // Assume half of taxable withdrawal is gains (for simplicity)
                    const gainPortion = fromTax * 0.5;
                    taxesA += gainPortion * ltcgRate;
                    remainingTax -= fromTax;
                    needed -= fromTax;
                }
                // Then from traditional
                if (needed > 0 && remainingTrad > 0) {
                    const fromTrad = Math.min(needed, remainingTrad);
                    taxesA += fromTrad * taxRate;
                    remainingTrad -= fromTrad;
                    needed -= fromTrad;
                }
                // Finally from Roth
                if (needed > 0 && remainingRoth > 0) {
                    const fromRoth = Math.min(needed, remainingRoth);
                    // Roth withdrawals are tax-free
                    remainingRoth -= fromRoth;
                    needed -= fromRoth;
                }
                if (needed > 0) break; // out of money
            }

            // Strategy B: traditional first, then taxable, then Roth (a suboptimal order)
            let remTradB = balTrad;
            let remRothB = balRoth;
            let remTaxB = balTax;
            let taxesB = 0;

            for (let y = 0; y < years; y++) {
                let needed = spend;
                // Take from traditional first
                if (remTradB > 0) {
                    const fromTrad = Math.min(needed, remTradB);
                    taxesB += fromTrad * taxRate;
                    remTradB -= fromTrad;
                    needed -= fromTrad;
                }
                // Then from taxable
                if (needed > 0 && remTaxB > 0) {
                    const fromTax = Math.min(needed, remTaxB);
                    const gainPortion = fromTax * 0.5;
                    taxesB += gainPortion * ltcgRate;
                    remTaxB -= fromTax;
                    needed -= fromTax;
                }
                // Then from Roth
                if (needed > 0 && remRothB > 0) {
                    const fromRoth = Math.min(needed, remRothB);
                    remRothB -= fromRoth;
                    needed -= fromRoth;
                }
                if (needed > 0) break;
            }

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('withdrawalResult');
            resultDiv.innerHTML = `
            <p><strong>Over ${years} years of spending ${formatMoney(spend)} per year:</strong></p>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px; padding:10px; background:#e6f7e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">✅ Tax‑Smart Order</h4>
                    <p>Taxes paid: ${formatMoney(taxesA)}</p>
                    <p>Remaining: Taxable ${formatMoney(remainingTax)} / Trad ${formatMoney(remainingTrad)} / Roth ${formatMoney(remainingRoth)}</p>
                </div>
                <div style="flex:1; min-width:200px; padding:10px; background:#ffe6e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">⚠️ Less Efficient Order</h4>
                    <p>Taxes paid: ${formatMoney(taxesB)}</p>
                    <p>Remaining: Taxable ${formatMoney(remTaxB)} / Trad ${formatMoney(remTradB)} / Roth ${formatMoney(remRothB)}</p>
                </div>
            </div>
            <p style="margin-top:10px;">The tax‑smart order saves you <strong>${formatMoney(Math.abs(taxesB - taxesA))}</strong> in taxes (assuming constant tax rates).</p>
            <p><small>This simplified model assumes no investment growth, constant tax brackets, and that 50% of taxable withdrawals are gains. Actual results vary.</small></p>
        `;
        });
    }

    function initSocialSecurityCalculator() {
        const calcBtn = document.getElementById('compareSS');
        if (!calcBtn) return;

        // Update displayed ages
        const age1Slider = document.getElementById('claimAge1');
        const age2Slider = document.getElementById('claimAge2');
        const age1Span = document.getElementById('age1Val');
        const age2Span = document.getElementById('age2Val');
        if (age1Slider && age1Span) {
            age1Slider.addEventListener('input', () => {
                age1Span.textContent = age1Slider.value;
            });
        }
        if (age2Slider && age2Span) {
            age2Slider.addEventListener('input', () => {
                age2Span.textContent = age2Slider.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const fraBenefit = parseFloat(document.getElementById('fraBenefit').value) || 0;
            const fra = parseInt(document.getElementById('fraAge').value);
            const age1 = parseInt(document.getElementById('claimAge1').value);
            const age2 = parseInt(document.getElementById('claimAge2').value);

            if (fraBenefit <= 0 || fra < 62 || age1 < 62 || age1 > 70 || age2 < 62 || age2 > 70) {
                document.getElementById('ssResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers and claiming ages between 62 and 70.</span>';
                return;
            }

            // Calculate benefit at each claiming age
            const benefitAtAge = (claimAge) => {
                if (claimAge < fra) {
                    // Reduction: 5/9 of 1% per month for first 36 months, plus 5/12 of 1% for additional months
                    const monthsEarly = (fra - claimAge) * 12;
                    if (monthsEarly <= 36) {
                        return fraBenefit * (1 - (5/900) * monthsEarly);
                    } else {
                        return fraBenefit * (1 - (5/900)*36 - (5/1200)*(monthsEarly-36));
                    }
                } else if (claimAge > fra) {
                    // Delayed retirement credits: 8% per year (2/3 of 1% per month)
                    const monthsLate = (claimAge - fra) * 12;
                    return fraBenefit * (1 + (8/100/12) * monthsLate);
                } else {
                    return fraBenefit;
                }
            };

            const benefit1 = benefitAtAge(age1);
            const benefit2 = benefitAtAge(age2);

            // Calculate cumulative benefits up to age 100 (or until crossover)
            const cumulative1 = [];
            const cumulative2 = [];
            let crossoverAge = null;
            for (let age = age1; age <= 100; age++) {
                const yearsFromStart1 = age - age1 + 1;
                const yearsFromStart2 = age - age2 + 1;
                const cum1 = benefit1 * (yearsFromStart1 > 0 ? yearsFromStart1 : 0);
                const cum2 = benefit2 * (yearsFromStart2 > 0 ? yearsFromStart2 : 0);
                cumulative1.push({age, cum: cum1});
                cumulative2.push({age, cum: cum2});
                if (crossoverAge === null && age >= age2 && cum2 > cum1) {
                    crossoverAge = age;
                }
            }

            // Find the age where cumulative2 exceeds cumulative1
            const breakEven = crossoverAge ? crossoverAge : 'After 100';

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('ssResult').innerHTML = `
            <p><strong>Claiming at age ${age1}:</strong> monthly benefit ${formatMoney(benefit1)}</p>
            <p><strong>Claiming at age ${age2}:</strong> monthly benefit ${formatMoney(benefit2)}</p>
            <p style="font-size:1.3rem;">Break‑even age: <strong>${breakEven}</strong></p>
            <p>If you live past age ${breakEven}, claiming at ${age2} yields higher total benefits.</p>
            <p><small>Calculations are estimates based on simplified reduction/delay formulas. Actual Social Security formulas are more precise.</small></p>
        `;
        });
    }

    function initRMDCalculator() {
        const calcBtn = document.getElementById('calculateRMD');
        if (!calcBtn) return;

        // IRS Uniform Lifetime Table factors (simplified, for ages 72-95)
        // Source: IRS Publication 590-B (2023). We'll use a simplified array.
        const rmdFactors = {
            72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7,
            77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4,
            82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
            87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5,
            92: 10.8, 93: 10.1, 94: 9.5,  95: 8.9
        };

        calcBtn.addEventListener('click', function() {
            const age = parseInt(document.getElementById('rmdAge').value);
            const balance = parseFloat(document.getElementById('rmdBalance').value);
            const taxRate = parseFloat(document.getElementById('rmdTaxRate').value) / 100 || 0;

            if (isNaN(age) || age < 72 || age > 95 || isNaN(balance) || balance < 0 || isNaN(taxRate)) {
                document.getElementById('rmdResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const factor = rmdFactors[age];
            if (!factor) {
                document.getElementById('rmdResult').innerHTML = '<span style="color:red;">Age factor not available (use 72-95).</span>';
                return;
            }

            const rmd = balance / factor;
            const taxDue = rmd * taxRate;
            const afterTax = rmd - taxDue;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('rmdResult').innerHTML = `
            <p><strong>At age ${age}, with balance ${formatMoney(balance)}:</strong></p>
            <p style="font-size: 1.5rem; color: var(--retirement-color);">RMD = ${formatMoney(rmd)}</p>
            <p>Life expectancy factor: ${factor}</p>
            <p>Estimated tax at ${(taxRate*100).toFixed(0)}%: ${formatMoney(taxDue)}</p>
            <p>After‑tax amount: ${formatMoney(afterTax)}</p>
            <p><small>This is a simplified estimate. Actual RMD may vary based on precise factor tables and account types.</small></p>
        `;
        });
    }

    function initEstateSimulator() {
        const simBtn = document.getElementById('simulateEstate');
        if (!simBtn) return;

        // Update probate cost display
        const probateSlider = document.getElementById('probateCost');
        const probateSpan = document.getElementById('probateCostVal');
        if (probateSlider && probateSpan) {
            probateSlider.addEventListener('input', () => {
                probateSpan.textContent = probateSlider.value;
            });
        }

        simBtn.addEventListener('click', function() {
            const assetsBeneficiary = parseFloat(document.getElementById('assetsBeneficiary').value) || 0;
            const assetsNoBeneficiary = parseFloat(document.getElementById('assetsNoBeneficiary').value) || 0;
            const probatePercent = parseFloat(document.getElementById('probateCost').value) / 100 || 0;
            const numBeneficiaries = parseInt(document.getElementById('numBeneficiaries').value) || 1;

            if (assetsBeneficiary < 0 || assetsNoBeneficiary < 0 || probatePercent < 0 || numBeneficiaries < 1) {
                document.getElementById('estateResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Assets with beneficiaries pass directly, no probate cost
            const toHeirsDirect = assetsBeneficiary;
            // Assets without beneficiaries go through probate, incurring costs
            const probateCosts = assetsNoBeneficiary * probatePercent;
            const afterProbate = assetsNoBeneficiary - probateCosts;

            // Assume equal distribution among beneficiaries (simplified)
            const perBeneficiaryDirect = numBeneficiaries > 0 ? (toHeirsDirect / numBeneficiaries) : 0;
            const perBeneficiaryProbate = numBeneficiaries > 0 ? (afterProbate / numBeneficiaries) : 0;

            const totalToHeirs = toHeirsDirect + afterProbate;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            document.getElementById('estateResult').innerHTML = `
            <p><strong>Distribution summary:</strong></p>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px; padding:10px; background:#e6f7e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">✅ With Beneficiaries</h4>
                    <p>Amount: ${formatMoney(assetsBeneficiary)}</p>
                    <p>Passes directly to heirs (no probate)</p>
                </div>
                <div style="flex:1; min-width:200px; padding:10px; background:#ffe6e6; border-radius:12px;">
                    <h4 style="color:var(--retirement-color);">⚠️ Without Beneficiaries</h4>
                    <p>Amount: ${formatMoney(assetsNoBeneficiary)}</p>
                    <p>Probate costs: ${formatMoney(probateCosts)}</p>
                    <p>To heirs after probate: ${formatMoney(afterProbate)}</p>
                </div>
            </div>
            <p style="margin-top:10px;">Total to heirs: ${formatMoney(totalToHeirs)}</p>
            <p>If you have ${numBeneficiaries} beneficiaries, each could receive approximately:</p>
            <ul style="margin-left:20px;">
                <li>From beneficiary‑designated assets: ${formatMoney(perBeneficiaryDirect)}</li>
                <li>From probate assets: ${formatMoney(perBeneficiaryProbate)}</li>
            </ul>
            <p><small>This is a simplified illustration. Actual probate costs and distribution depend on state laws, specific assets, and legal fees.</small></p>
        `;
        });
    }

})();
