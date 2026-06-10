/* assets/js/real_state.js */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            initAffordabilityCalculator();
            initRentVsBuyCalculator();
            initPropertyEvaluator();
            initReitSimulator();
            initMarketCycleSimulator();
            initHiddenCostsCalculator();
            initVacancySimulator();
            initLiabilitySimulator();
            initDownPaymentCalculator();
            initMortgageCalculator();
            initAssistanceFinder();
            initRentalAnalysisTool();
            initHouseHackCalculator();
            initBrrrrCalculator();
            initSyndicationCalculator();
            initPortfolioSimulator();
        }
    });

    function initAffordabilityCalculator() {
        const calcBtn = document.getElementById('calculateAffordability');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const incomeSlider = document.getElementById('annualIncome');
        const downSlider = document.getElementById('downpayment');
        const debtsSlider = document.getElementById('monthlyDebts');
        const rateSlider = document.getElementById('interestRate');
        const incomeVal = document.getElementById('incomeVal');
        const downVal = document.getElementById('downpaymentVal');
        const debtsVal = document.getElementById('debtsVal');
        const rateVal = document.getElementById('rateVal');

        if (incomeSlider && incomeVal) {
            incomeSlider.addEventListener('input', function() {
                incomeVal.textContent = this.value;
            });
        }
        if (downSlider && downVal) {
            downSlider.addEventListener('input', function() {
                downVal.textContent = this.value;
            });
        }
        if (debtsSlider && debtsVal) {
            debtsSlider.addEventListener('input', function() {
                debtsVal.textContent = this.value;
            });
        }
        if (rateSlider && rateVal) {
            rateSlider.addEventListener('input', function() {
                rateVal.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function(e) {
            // Get values
            const annualIncome = parseFloat(document.getElementById('annualIncome').value);
            const downPayment = parseFloat(document.getElementById('downpayment').value);
            const monthlyDebts = parseFloat(document.getElementById('monthlyDebts').value);
            const annualRate = parseFloat(document.getElementById('interestRate').value) / 100;
            const loanTerm = parseInt(document.getElementById('loanTerm').value);

            // Basic validation
            if (isNaN(annualIncome) || annualIncome <= 0 ||
                isNaN(downPayment) || downPayment < 0 ||
                isNaN(monthlyDebts) || monthlyDebts < 0 ||
                isNaN(annualRate) || annualRate < 0 ||
                isNaN(loanTerm) || loanTerm <= 0) {
                document.getElementById('affordabilityResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const monthlyIncome = annualIncome / 12;
            // 28/36 rule: housing expense ≤ 28% income, total debt ≤ 36% income
            const maxHousingPayment = Math.min(
                monthlyIncome * 0.28,
                monthlyIncome * 0.36 - monthlyDebts
            );

            if (maxHousingPayment <= 0) {
                document.getElementById('affordabilityResult').innerHTML = '<span style="color:red;">Your debt level is too high relative to income – consider paying down debts first.</span>';
                return;
            }

            // Estimate property tax & insurance as 1.25% of home price annually (0.10417% monthly)
            const taxInsRateMonthly = 0.0125 / 12; // 1.25% / 12

            // Monthly mortgage rate
            const monthlyRate = annualRate / 12;
            const months = loanTerm * 12;

            // Mortgage payment factor M = (r*(1+r)^n) / ((1+r)^n - 1)  (principal+interest only)
            let mortgageFactor;
            if (annualRate === 0) {
                mortgageFactor = 1 / months; // simple linear
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                mortgageFactor = (monthlyRate * factor) / (factor - 1);
            }

            // We need to solve for home price P:
            // maxHousingPayment = P * taxInsRateMonthly + (P - downPayment) * mortgageFactor
            // => P * (taxInsRateMonthly + mortgageFactor) = maxHousingPayment + downPayment * mortgageFactor
            // => P = (maxHousingPayment + downPayment * mortgageFactor) / (taxInsRateMonthly + mortgageFactor)

            const denominator = taxInsRateMonthly + mortgageFactor;
            if (denominator <= 0) {
                document.getElementById('affordabilityResult').innerHTML = '<span style="color:red;">Calculation error – please adjust inputs.</span>';
                return;
            }

            const maxHomePrice = (maxHousingPayment + downPayment * mortgageFactor) / denominator;
            if (maxHomePrice < 0) {
                document.getElementById('affordabilityResult').innerHTML = '<span style="color:red;">Negative home price – down payment may be too large? Try lower values.</span>';
                return;
            }

            // Compute actual monthly PITI using the solved price
            const loanAmount = Math.max(0, maxHomePrice - downPayment);
            let monthlyPI;
            if (annualRate === 0 || loanAmount <= 0) {
                monthlyPI = loanAmount / months;
            } else {
                monthlyPI = loanAmount * mortgageFactor;
            }
            const monthlyTaxIns = maxHomePrice * taxInsRateMonthly;
            const totalPayment = monthlyPI + monthlyTaxIns;

            // Format numbers
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('affordabilityResult');
            resultDiv.innerHTML = `
                <p><strong>Based on your inputs, you could afford a home up to:</strong></p>
                <p style="font-size: 2rem; color: var(--real-estate-color);">${formatMoney(maxHomePrice)}</p>
                <p>With a down payment of ${formatMoney(downPayment)} (${((downPayment/maxHomePrice)*100).toFixed(1)}%), your loan would be ${formatMoney(loanAmount)}.</p>
                <p>Estimated monthly PITI (Principal, Interest, Taxes, Insurance): <strong>${formatMoney(totalPayment)}</strong></p>
                <p><small>Principal & interest: ${formatMoney(monthlyPI)} | Taxes & insurance: ${formatMoney(monthlyTaxIns)}</small></p>
                <p><small>Assumes ${annualRate*100}% interest, ${loanTerm}-year term, and 1.25% annual taxes/insurance. Actual amounts vary.</small></p>
            `;
        });
    }

    function initRentVsBuyCalculator() {
        const calcBtn = document.getElementById('calcRentVsBuy');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const homePriceInput = document.getElementById('homePrice');
        const downPercentInput = document.getElementById('downPercent');
        const mortgageRateInput = document.getElementById('mortgageRate');
        const propTaxInput = document.getElementById('propTax');
        const maintenanceInput = document.getElementById('maintenance');
        const appreciationInput = document.getElementById('appreciation');
        const monthlyRentInput = document.getElementById('monthlyRent');
        const rentGrowthInput = document.getElementById('rentGrowth');
        const invReturnInput = document.getElementById('invReturn');
        const yearsInput = document.getElementById('years');

        const homePriceVal = document.getElementById('homePriceVal');
        const downPercentVal = document.getElementById('downPercentVal');
        const mortgageRateVal = document.getElementById('mortgageRateVal');
        const propTaxVal = document.getElementById('propTaxVal');
        const maintenanceVal = document.getElementById('maintenanceVal');
        const appreciationVal = document.getElementById('appreciationVal');
        const rentVal = document.getElementById('rentVal');
        const rentGrowthVal = document.getElementById('rentGrowthVal');
        const invReturnVal = document.getElementById('invReturnVal');
        const yearsVal = document.getElementById('yearsVal');

        if (homePriceInput && homePriceVal) {
            homePriceInput.addEventListener('input', () => homePriceVal.textContent = homePriceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (mortgageRateInput && mortgageRateVal) {
            mortgageRateInput.addEventListener('input', () => mortgageRateVal.textContent = mortgageRateInput.value);
        }
        if (propTaxInput && propTaxVal) {
            propTaxInput.addEventListener('input', () => propTaxVal.textContent = propTaxInput.value);
        }
        if (maintenanceInput && maintenanceVal) {
            maintenanceInput.addEventListener('input', () => maintenanceVal.textContent = maintenanceInput.value);
        }
        if (appreciationInput && appreciationVal) {
            appreciationInput.addEventListener('input', () => appreciationVal.textContent = appreciationInput.value);
        }
        if (monthlyRentInput && rentVal) {
            monthlyRentInput.addEventListener('input', () => rentVal.textContent = monthlyRentInput.value);
        }
        if (rentGrowthInput && rentGrowthVal) {
            rentGrowthInput.addEventListener('input', () => rentGrowthVal.textContent = rentGrowthInput.value);
        }
        if (invReturnInput && invReturnVal) {
            invReturnInput.addEventListener('input', () => invReturnVal.textContent = invReturnInput.value);
        }
        if (yearsInput && yearsVal) {
            yearsInput.addEventListener('input', () => yearsVal.textContent = yearsInput.value);
        }

        calcBtn.addEventListener('click', function() {
            // Gather values
            const homePrice = parseFloat(document.getElementById('homePrice').value);
            const downPercent = parseFloat(document.getElementById('downPercent').value) / 100;
            const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
            const propTax = parseFloat(document.getElementById('propTax').value) / 100;
            const maintenance = parseFloat(document.getElementById('maintenance').value) / 100;
            const appreciation = parseFloat(document.getElementById('appreciation').value) / 100;
            const monthlyRent = parseFloat(document.getElementById('monthlyRent').value);
            const rentGrowth = parseFloat(document.getElementById('rentGrowth').value) / 100;
            const invReturn = parseFloat(document.getElementById('invReturn').value) / 100;
            const years = parseFloat(document.getElementById('years').value);

            // Validation
            if ([homePrice, downPercent, mortgageRate, propTax, maintenance, appreciation, monthlyRent, rentGrowth, invReturn, years].some(isNaN)) {
                document.getElementById('rentVsBuyResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Assumptions
            const closingCostRate = 0.03;          // 3% of home price when buying
            const sellCostRate = 0.06;              // 6% realtor fees when selling
            const downPayment = homePrice * downPercent;
            const loanAmount = homePrice - downPayment;
            const monthlyRate = mortgageRate / 12;
            const months = years * 12;

            // Monthly mortgage payment (principal + interest)
            let monthlyPI;
            if (mortgageRate === 0) {
                monthlyPI = loanAmount / months;
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
            }

            // Monthly property tax & maintenance
            const monthlyTax = homePrice * (propTax / 12);
            const monthlyMaint = homePrice * (maintenance / 12);
            const totalMonthlyPITI = monthlyPI + monthlyTax + monthlyMaint;

            // Renting: initial investment (down payment + closing costs) is available for investing
            const initialInvest = downPayment + homePrice * closingCostRate;  // money not used if renting

            // Simulate year by year
            let buyNetWorth = homePrice; // start with home value (but we'll track home value and mortgage balance separately)
            let mortgageBalance = loanAmount;
            let homeValue = homePrice;
            let rentNetWorth = initialInvest; // invest the upfront money

            // For renting: monthly rent starts at monthlyRent, increases annually by rentGrowth
            // For buying: monthly PITI is fixed? Actually property tax & maintenance increase with home value; we'll simplify: PITI fixed except taxes & maint adjust with appreciation? For simplicity, we'll keep PITI fixed in nominal terms, but taxes/maint adjust with appreciation? That's complex. We'll keep fixed PITI for simplicity, and home value appreciates.
            // We'll also assume renter invests the monthly difference (if rent < PITI, negative means they withdraw from investment)

            let annualRent = monthlyRent * 12;
            const annualPITI = totalMonthlyPITI * 12;

            for (let year = 1; year <= years; year++) {
                // Update home value
                homeValue *= (1 + appreciation);

                // Mortgage balance after year's payments (simplified: we'll just reduce by principal portion; need amortization)
                // We'll compute remaining balance after 'year' years using standard formula
                if (mortgageRate > 0) {
                    const remainingMonths = months - year * 12;
                    if (remainingMonths > 0) {
                        const factor = Math.pow(1 + monthlyRate, remainingMonths);
                        mortgageBalance = monthlyPI * (1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate;
                    } else {
                        mortgageBalance = 0;
                    }
                } else {
                    mortgageBalance = Math.max(0, loanAmount - (loanAmount / months) * year * 12);
                }

                // For renting: pay rent, invest the difference (or withdraw if rent > PITI)
                // Actually, we need to compare net cash flows. Simpler: compute net worth at end.
                // Let's compute net worth after 'years' directly using future value formulas.

                // But to keep it simple, we'll do iterative year-by-year with investment growth on the difference.

                // However, the difference in monthly cash flow is not constant because rent grows.
                // We'll do annual simulation: at start of year, we have investment balance for renter.
                // During the year, renter pays annual rent (or monthly, but we'll approximate annual).
                // The buyer pays annual PITI (fixed). So annual cash flow difference = annualRent - annualPITI.
                // If positive, renter has extra cash to invest at year end; if negative, renter must withdraw from investment.
            }

            // Instead of complex iterative simulation, we'll use a simplified future value approach for demonstration.
            // This is an interactive tool, so we can provide a rough estimate.

            // We'll compute future home value, remaining mortgage, and equity.
            const futureHomeValue = homePrice * Math.pow(1 + appreciation, years);
            // Remaining mortgage balance after 'years' (using standard amortization)
            let remainingBalance;
            if (mortgageRate === 0) {
                remainingBalance = Math.max(0, loanAmount - (loanAmount / months) * months);
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                remainingBalance = loanAmount * (factor - Math.pow(1 + monthlyRate, years * 12)) / (factor - 1);
            }
            const homeEquity = futureHomeValue - remainingBalance - (futureHomeValue * sellCostRate); // subtract selling costs

            // For renter: initial investment grows at invReturn, plus they save the difference between rent and PITI? But rent changes.
            // To keep simple, we'll compute the future value of the initial investment plus the cumulative cash flow difference.
            // We'll approximate by assuming the renter invests the initial amount and also annually invests the difference (rent - PITI) but rent grows.
            // This is getting too complex for a quick tool. Let's simplify to a well-known online calculator style: we'll just compare total cost over the period, ignoring investment returns on the difference, but that's not accurate.

            // Given the complexity, I'll implement a simplified version that computes net worth after X years:
            // - Buyer: home equity (home value - mortgage balance - selling costs)
            // - Renter: initial investment (down payment + closing costs) grows at investment return, plus they invest the monthly difference (if rent < PITI, they save; if rent > PITI, they need extra). We'll approximate by using average annual rent over the period.

            // Let's compute average annual rent over the period (geometric average):
            const avgAnnualRent = monthlyRent * 12 * (Math.pow(1 + rentGrowth, years) - 1) / (rentGrowth * years); // if rentGrowth=0, it's just monthlyRent*12
            const annualDiff = avgAnnualRent - annualPITI;
            const futureValueOfDiff = annualDiff * (Math.pow(1 + invReturn, years) - 1) / invReturn; // annuity future value

            const renterNetWorth = initialInvest * Math.pow(1 + invReturn, years) + futureValueOfDiff;
            const buyerNetWorth = homeEquity;

            // Format
            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('rentVsBuyResult');
            resultDiv.innerHTML = `
            <p><strong>After ${years} years:</strong></p>
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex:1; background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">🏠 Buyer Net Worth</h4>
                    <p style="font-size: 1.8rem; color: #2e7d32;">${formatMoney(buyerNetWorth)}</p>
                    <small>Home value: ${formatMoney(futureHomeValue)}<br>Minus mortgage & selling costs</small>
                </div>
                <div style="flex:1; background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📦 Renter Net Worth</h4>
                    <p style="font-size: 1.8rem; color: #bf360c;">${formatMoney(renterNetWorth)}</p>
                    <small>Invested savings + growth</small>
                </div>
            </div>
            <p style="margin-top:15px;">${buyerNetWorth > renterNetWorth ? '✅ Buying builds more wealth in this scenario.' : '✅ Renting leaves you with more money to invest.'}</p>
            <p><small>*This is a simplified estimate. Real results depend on many factors. Consult a financial advisor.</small></p>
        `;
        });
    }

    function initPropertyEvaluator() {
        const analyzeBtn = document.getElementById('analyzeProperty');
        if (!analyzeBtn) return;

        // Update displayed values for sliders
        const priceInput = document.getElementById('purchasePrice');
        const downPercentInput = document.getElementById('downPercent2');
        const rateInput = document.getElementById('interestRate2');
        const rentInput = document.getElementById('monthlyRent2');
        const taxInput = document.getElementById('propTax2');
        const insuranceInput = document.getElementById('insurance2');
        const maintInput = document.getElementById('maintenance2');
        const vacancyInput = document.getElementById('vacancy2');
        const otherInput = document.getElementById('other2');
        const loanTermSelect = document.getElementById('loanTerm2');

        const priceVal = document.getElementById('priceVal');
        const downPercentVal = document.getElementById('downPercentVal2');
        const rateVal = document.getElementById('rateVal2');
        const rentVal = document.getElementById('rentVal2');
        const taxVal = document.getElementById('taxVal2');
        const insVal = document.getElementById('insVal2');
        const maintVal = document.getElementById('maintVal2');
        const vacancyVal = document.getElementById('vacancyVal2');
        const otherVal = document.getElementById('otherVal2');

        if (priceInput && priceVal) {
            priceInput.addEventListener('input', () => priceVal.textContent = priceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (rateInput && rateVal) {
            rateInput.addEventListener('input', () => rateVal.textContent = rateInput.value);
        }
        if (rentInput && rentVal) {
            rentInput.addEventListener('input', () => rentVal.textContent = rentInput.value);
        }
        if (taxInput && taxVal) {
            taxInput.addEventListener('input', () => taxVal.textContent = taxInput.value);
        }
        if (insuranceInput && insVal) {
            insuranceInput.addEventListener('input', () => insVal.textContent = insuranceInput.value);
        }
        if (maintInput && maintVal) {
            maintInput.addEventListener('input', () => maintVal.textContent = maintInput.value);
        }
        if (vacancyInput && vacancyVal) {
            vacancyInput.addEventListener('input', () => vacancyVal.textContent = vacancyInput.value);
        }
        if (otherInput && otherVal) {
            otherInput.addEventListener('input', () => otherVal.textContent = otherInput.value);
        }

        analyzeBtn.addEventListener('click', function() {
            // Get values
            const price = parseFloat(priceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const rate = parseFloat(rateInput.value) / 100;
            const loanTerm = parseInt(loanTermSelect.value);
            const monthlyRent = parseFloat(rentInput.value);
            const propTax = parseFloat(taxInput.value) / 100; // percent of price per year
            const insuranceYear = parseFloat(insuranceInput.value);
            const maintPercent = parseFloat(maintInput.value) / 100; // percent of price per year
            const vacancyPercent = parseFloat(vacancyInput.value) / 100;
            const otherMonthly = parseFloat(otherInput.value);

            // Validation
            if ([price, downPercent, rate, loanTerm, monthlyRent, propTax, insuranceYear, maintPercent, vacancyPercent, otherMonthly].some(isNaN)) {
                document.getElementById('propertyResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Calculations
            const downPayment = price * downPercent;
            const loanAmount = price - downPayment;
            const monthlyRate = rate / 12;
            const months = loanTerm * 12;

            // Monthly mortgage payment (principal + interest)
            let monthlyPI;
            if (rate === 0) {
                monthlyPI = loanAmount / months;
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
            }

            // Annual expenses
            const annualTax = price * propTax;
            const annualInsurance = insuranceYear;
            const annualMaint = price * maintPercent;
            const annualOther = otherMonthly * 12;
            const vacancyLoss = monthlyRent * 12 * vacancyPercent;

            // Net Operating Income (NOI)
            const annualRent = monthlyRent * 12;
            const totalExpenses = annualTax + annualInsurance + annualMaint + annualOther + vacancyLoss;
            const noi = annualRent - totalExpenses;

            // Cash flow
            const annualMortgage = monthlyPI * 12;
            const annualCashFlow = noi - annualMortgage;
            const monthlyCashFlow = annualCashFlow / 12;

            // ROI (cash-on-cash)
            const totalCashInvested = downPayment; // assuming no closing costs for simplicity
            const roi = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

            // Cap rate
            const capRate = price > 0 ? (noi / price) * 100 : 0;

            // Format
            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('propertyResult');
            resultDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📈 Cap Rate</h4>
                    <p style="font-size: 2rem; color: #2e7d32;">${formatPercent(capRate)}</p>
                    <small>NOI / Price</small>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💵 Monthly Cash Flow</h4>
                    <p style="font-size: 2rem; color: #bf360c;">${formatMoney(monthlyCashFlow)}</p>
                    <small>${monthlyCashFlow >= 0 ? 'Positive' : 'Negative'}</small>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 ROI (Cash‑on‑Cash)</h4>
                    <p style="font-size: 2rem; color: #0d47a1;">${formatPercent(roi)}</p>
                    <small>Annual cash flow / Down payment</small>
                </div>
            </div>
            <p style="margin-top:15px;"><strong>NOI (Net Operating Income):</strong> ${formatMoney(noi)} per year</p>
            <p><small>*Assumes ${formatMoney(downPayment)} down payment, ${rate*100}% interest, ${loanTerm}-year term. Expenses include taxes, insurance, maintenance, vacancy, and other costs.</small></p>
        `;
        });
    }

    function initReitSimulator() {
        const simulateBtn = document.getElementById('simulateReit');
        if (!simulateBtn) return;

        // Update displayed values for sliders
        const investInput = document.getElementById('investAmount');
        const yearsInput = document.getElementById('yearsReit');
        const investVal = document.getElementById('investAmountVal');
        const yearsVal = document.getElementById('yearsValReit');

        if (investInput && investVal) {
            investInput.addEventListener('input', () => investVal.textContent = investInput.value);
        }
        if (yearsInput && yearsVal) {
            yearsInput.addEventListener('input', () => yearsVal.textContent = yearsInput.value);
        }

        simulateBtn.addEventListener('click', function() {
            const investment = parseFloat(investInput.value);
            const years = parseFloat(yearsInput.value);
            const reitType = document.getElementById('reitType').value;

            // Default assumptions based on type
            let yieldRate, growthRate;
            switch (reitType) {
                case 'equity':
                    yieldRate = 0.04;   // 4% dividend yield
                    growthRate = 0.03;   // 3% annual growth in share price/FFO
                    break;
                case 'mortgage':
                    yieldRate = 0.08;    // 8% yield
                    growthRate = 0.0;     // minimal growth
                    break;
                case 'hybrid':
                    yieldRate = 0.06;     // 6% yield
                    growthRate = 0.02;    // 2% growth
                    break;
                case 'etf':
                    yieldRate = 0.045;    // 4.5% yield
                    growthRate = 0.025;   // 2.5% growth
                    break;
                default:
                    yieldRate = 0.04;
                    growthRate = 0.03;
            }

            // Simple simulation: dividends reinvested at yieldRate, growthRate applied to principal
            // Future value with reinvested dividends
            let totalValue = investment;
            let totalDividends = 0;
            for (let y = 1; y <= years; y++) {
                const dividends = totalValue * yieldRate;
                totalDividends += dividends;
                totalValue = totalValue * (1 + growthRate) + dividends; // reinvest dividends
            }

            const finalValue = totalValue;
            const totalReturn = finalValue - investment;
            const annualizedReturn = (Math.pow(finalValue / investment, 1 / years) - 1) * 100;

            // Format
            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('reitResult');
            resultDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📈 Final Value</h4>
                    <p style="font-size: 1.8rem; color: #2e7d32;">${formatMoney(finalValue)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💵 Total Dividends</h4>
                    <p style="font-size: 1.8rem; color: #bf360c;">${formatMoney(totalDividends)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Annualized Return</h4>
                    <p style="font-size: 1.8rem; color: #0d47a1;">${formatPercent(annualizedReturn)}</p>
                </div>
            </div>
            <p style="margin-top:15px;"><strong>Assumptions:</strong> Dividend yield ${formatPercent(yieldRate*100)}, annual growth ${formatPercent(growthRate*100)}. Dividends reinvested. This is a simplified projection; actual results vary.</p>
        `;
        });
    }

    function initMarketCycleSimulator() {
        const simulateBtn = document.getElementById('simulateCycle');
        if (!simulateBtn) return;

        // Update displayed values for sliders
        const purchaseYearInput = document.getElementById('purchaseYear');
        const initialValueInput = document.getElementById('initialValue');
        const purchaseYearVal = document.getElementById('purchaseYearVal');
        const initialValueVal = document.getElementById('initialValueVal');

        if (purchaseYearInput && purchaseYearVal) {
            purchaseYearInput.addEventListener('input', () => purchaseYearVal.textContent = purchaseYearInput.value);
        }
        if (initialValueInput && initialValueVal) {
            initialValueInput.addEventListener('input', () => initialValueVal.textContent = initialValueInput.value);
        }

        simulateBtn.addEventListener('click', function() {
            const purchaseYear = parseInt(purchaseYearInput.value); // 0-17
            const initialValue = parseFloat(initialValueInput.value);
            const cycleLength = 18; // years from trough to trough
            const projectionYears = 20;

            // Simple sine wave model: price multiplier = 1 + amplitude * sin(2π * (year - purchaseYear)/cycleLength + phaseOffset)
            // We'll set amplitude to 0.3 (30% swing) and phase such that trough at year 0, peak at year 9.
            // Multiplier = 1 + 0.3 * sin(2π * (year - purchaseYear)/18 - π/2) because sin(0 - π/2) = -1 at year 0 (trough)
            // Actually we want purchaseYear 0 = trough, 9 = peak. So we define: multiplier(t) = 1 + 0.3 * sin(2π * (t - 9)/18) because sin(0)=0 at peak? Let's simplify: we'll just compute a simple cyclic function.

            // Let's define: multiplier = 1 + 0.3 * Math.sin(2 * Math.PI * (year - purchaseYear) / cycleLength);
            // This will give multiplier=1 at purchaseYear, then oscillates. But we want to show the effect of buying at different points.

            // We'll compute the value at each year and find min, max, and final value.
            let values = [];
            for (let year = 0; year <= projectionYears; year++) {
                // phase based on purchaseYear: we want the cycle to be independent of purchaseYear for the market, but the purchase point determines starting multiplier.
                // Actually the market cycle is independent of when you buy. So we fix a global cycle starting at year 0 with trough.
                // Then the purchase year is an offset into that cycle.
                // const cyclePosition = (year) % cycleLength; // repeats every 18 years
                // // We'll define a sine wave that peaks at cyclePosition=9 and trough at 0 and 18.
                // const multiplier = 1 + 0.3 * Math.sin(2 * Math.PI * (cyclePosition - 4.5) / cycleLength); // shift to make trough at 0 and 18? Actually sin(0)=0 at trough? Let's adjust.

                // Better: use cosine so that at cyclePosition=0, multiplier = 1 - amplitude (trough)
                // multiplier = 1 + amplitude * cos(2π * cyclePosition/cycleLength) but cos(0)=1 so peak at 0? That's opposite. We want trough at 0, peak at 9. So use sin with shift:
                // multiplier = 1 + amplitude * sin(2π * (cyclePosition - 4.5)/cycleLength) because sin(-π/2) = -1 at 0, sin(π/2)=1 at 9.
                const amplitude = 0.3;
                const rad = 2 * Math.PI * (cyclePosition - 4.5) / cycleLength;
                const multiplier = 1 + amplitude * Math.sin(rad);
                values.push(initialValue * multiplier);
            }

            const finalValue = values[projectionYears];
            const peakValue = Math.max(...values);
            const troughValue = Math.min(...values);
            const peakYear = values.indexOf(peakValue);
            const troughYear = values.indexOf(troughValue);

            // Format
            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('cycleResult');
            resultDiv.innerHTML = `
            <p><strong>If you bought at year ${purchaseYear} in the cycle (0 = trough, 9 = peak):</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📈 Value after ${projectionYears} years</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(finalValue)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Peak value (year ${peakYear})</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(peakValue)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📉 Trough value (year ${troughYear})</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(troughValue)}</p>
                </div>
            </div>
            <p style="margin-top:15px;"><strong>What this means:</strong> Buying closer to a trough (year 0 or 17) gives more upside. Buying near the peak (year 9) may lead to years of negative returns. This is a simplified model – actual cycles vary.</p>
        `;
        });
    }

    function initHiddenCostsCalculator() {
        const calcBtn = document.getElementById('calcHiddenCosts');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const homePriceInput = document.getElementById('homePriceHidden');
        const downPercentInput = document.getElementById('downPercentHidden');
        const taxRateInput = document.getElementById('taxRateHidden');
        const insuranceInput = document.getElementById('insuranceHidden');
        const maintInput = document.getElementById('maintHidden');
        const yearsInput = document.getElementById('yearsHidden');

        const homePriceVal = document.getElementById('homePriceValHidden');
        const downPercentVal = document.getElementById('downPercentValHidden');
        const taxRateVal = document.getElementById('taxRateValHidden');
        const insuranceVal = document.getElementById('insuranceValHidden');
        const maintVal = document.getElementById('maintValHidden');
        const yearsVal = document.getElementById('yearsValHidden');

        if (homePriceInput && homePriceVal) {
            homePriceInput.addEventListener('input', () => homePriceVal.textContent = homePriceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (taxRateInput && taxRateVal) {
            taxRateInput.addEventListener('input', () => taxRateVal.textContent = taxRateInput.value);
        }
        if (insuranceInput && insuranceVal) {
            insuranceInput.addEventListener('input', () => insuranceVal.textContent = insuranceInput.value);
        }
        if (maintInput && maintVal) {
            maintInput.addEventListener('input', () => maintVal.textContent = maintInput.value);
        }
        if (yearsInput && yearsVal) {
            yearsInput.addEventListener('input', () => yearsVal.textContent = yearsInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const homePrice = parseFloat(homePriceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const taxRate = parseFloat(taxRateInput.value) / 100;
            const annualInsurance = parseFloat(insuranceInput.value);
            const maintPercent = parseFloat(maintInput.value) / 100;
            const years = parseFloat(yearsInput.value);

            if ([homePrice, downPercent, taxRate, annualInsurance, maintPercent, years].some(isNaN)) {
                document.getElementById('hiddenCostsResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const downPayment = homePrice * downPercent;
            const annualTax = homePrice * taxRate;
            const annualMaint = homePrice * maintPercent;
            const annualHidden = annualTax + annualInsurance + annualMaint;
            const monthlyHidden = annualHidden / 12;
            const totalOverYears = annualHidden * years;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('hiddenCostsResult');
            resultDiv.innerHTML = `
            <p><strong>Based on a home price of ${formatMoney(homePrice)} with ${downPercent*100}% down:</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📆 Monthly Hidden</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(monthlyHidden)}</p>
                    <small>Tax + Ins + Maint</small>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📅 Annual Hidden</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(annualHidden)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">⏳ Total Over ${years} Years</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(totalOverYears)}</p>
                </div>
            </div>
            <p style="margin-top:15px;"><strong>Breakdown:</strong> Property tax: ${formatMoney(annualTax)}/year, Insurance: ${formatMoney(annualInsurance)}/year, Maintenance: ${formatMoney(annualMaint)}/year.</p>
            <p><small>This does not include mortgage principal & interest, utilities, or HOA fees. Actual costs vary.</small></p>
        `;
        });
    }

    function initVacancySimulator() {
        const calcBtn = document.getElementById('calcVacancyImpact');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const rentInput = document.getElementById('monthlyRentVacancy');
        const opCostsInput = document.getElementById('monthlyOpCosts');
        const vacancyRateInput = document.getElementById('vacancyRate');
        const turnoverInput = document.getElementById('turnoverCosts');

        const rentVal = document.getElementById('rentValVacancy');
        const opCostsVal = document.getElementById('opCostsVal');
        const vacancyRateVal = document.getElementById('vacancyRateVal');
        const turnoverVal = document.getElementById('turnoverVal');

        if (rentInput && rentVal) {
            rentInput.addEventListener('input', () => rentVal.textContent = rentInput.value);
        }
        if (opCostsInput && opCostsVal) {
            opCostsInput.addEventListener('input', () => opCostsVal.textContent = opCostsInput.value);
        }
        if (vacancyRateInput && vacancyRateVal) {
            vacancyRateInput.addEventListener('input', () => vacancyRateVal.textContent = vacancyRateInput.value);
        }
        if (turnoverInput && turnoverVal) {
            turnoverInput.addEventListener('input', () => turnoverVal.textContent = turnoverInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const monthlyRent = parseFloat(rentInput.value);
            const monthlyOpCosts = parseFloat(opCostsInput.value);
            const vacancyRate = parseFloat(vacancyRateInput.value) / 100;
            const turnoverCosts = parseFloat(turnoverInput.value);

            if ([monthlyRent, monthlyOpCosts, vacancyRate, turnoverCosts].some(isNaN)) {
                document.getElementById('vacancyResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Annual calculations
            const potentialAnnualRent = monthlyRent * 12;
            const vacancyLoss = potentialAnnualRent * vacancyRate;
            // Assume each vacancy event incurs turnover costs. We'll estimate number of turnovers per year = vacancyRate (if 5% vacancy, maybe 0.5 turnovers? Actually vacancy rate is % of time vacant, not number of turnovers. To simplify, we'll just show annual loss and suggest reserve.
            // We'll calculate total annual loss = vacancyLoss + (turnoverCosts * estimated turnovers). But turnovers are not directly tied to vacancy rate without average turnover frequency. Let's assume one turnover per year at that vacancy rate? That's not accurate. Better to just show vacancy loss and separate turnover costs.
            // We'll provide a simpler output: annual vacancy loss, plus a recommended reserve (3 months of operating costs + one turnover).

            const annualVacancyLoss = vacancyLoss;
            const recommendedReserve = (monthlyOpCosts * 3) + turnoverCosts; // 3 months operating + one turnover

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('vacancyResult');
            resultDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📉 Annual Vacancy Loss</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(annualVacancyLoss)}</p>
                    <small>Lost rent at ${vacancyRate*100}% vacancy</small>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💵 Monthly Op Costs</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(monthlyOpCosts)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">🛡️ Recommended Reserve</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(recommendedReserve)}</p>
                    <small>3 months costs + turnover</small>
                </div>
            </div>
            <p style="margin-top:15px;"><strong>Turnover costs:</strong> ${formatMoney(turnoverCosts)} per turnover. A healthy reserve helps you sleep through vacancies.</p>
            <p><small>This is a simplified estimate. Your actual reserve needs depend on your market and risk tolerance.</small></p>
        `;
        });
    }

    function initLiabilitySimulator() {
        const simulateBtn = document.getElementById('simulateLiability');
        if (!simulateBtn) return;

        // Update displayed values for sliders
        const personalInput = document.getElementById('personalAssets');
        const propertyInput = document.getElementById('propertyValue');
        const claimInput = document.getElementById('claimAmount');
        const insuranceInput = document.getElementById('insuranceCoverage');
        const umbrellaInput = document.getElementById('umbrellaCoverage');

        const personalVal = document.getElementById('personalAssetsVal');
        const propertyVal = document.getElementById('propertyValLegal');
        const claimVal = document.getElementById('claimVal');
        const insuranceVal = document.getElementById('insuranceValLegal');
        const umbrellaVal = document.getElementById('umbrellaVal');

        if (personalInput && personalVal) {
            personalInput.addEventListener('input', () => personalVal.textContent = personalInput.value);
        }
        if (propertyInput && propertyVal) {
            propertyInput.addEventListener('input', () => propertyVal.textContent = propertyInput.value);
        }
        if (claimInput && claimVal) {
            claimInput.addEventListener('input', () => claimVal.textContent = claimInput.value);
        }
        if (insuranceInput && insuranceVal) {
            insuranceInput.addEventListener('input', () => insuranceVal.textContent = insuranceInput.value);
        }
        if (umbrellaInput && umbrellaVal) {
            umbrellaInput.addEventListener('input', () => umbrellaVal.textContent = umbrellaInput.value);
        }

        simulateBtn.addEventListener('click', function() {
            const personalAssets = parseFloat(personalInput.value);
            const propertyValue = parseFloat(propertyInput.value);
            const claimAmount = parseFloat(claimInput.value);
            const insuranceCoverage = parseFloat(insuranceInput.value);
            const umbrellaCoverage = parseFloat(umbrellaInput.value);
            const hasLLC = document.getElementById('hasLLC').value;

            if ([personalAssets, propertyValue, claimAmount, insuranceCoverage, umbrellaCoverage].some(isNaN)) {
                document.getElementById('liabilityResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Calculate total insurance coverage (umbrella usually adds on top)
            const totalInsurance = insuranceCoverage + umbrellaCoverage;
            let unprotectedAmount = Math.max(0, claimAmount - totalInsurance);

            let assetsAtRisk = 0;
            let protectedByLLC = false;

            if (hasLLC === 'yes') {
                // With LLC, only the property value is at risk (assuming it's inside the LLC)
                assetsAtRisk = Math.min(propertyValue, unprotectedAmount);
                protectedByLLC = true;
            } else {
                // Without LLC, personal assets are at risk
                assetsAtRisk = Math.min(personalAssets + propertyValue, unprotectedAmount);
            }

            // If claim is fully covered, assetsAtRisk = 0
            if (claimAmount <= totalInsurance) {
                assetsAtRisk = 0;
            }

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('liabilityResult');
            resultDiv.innerHTML = `
            <p><strong>Lawsuit claim: ${formatMoney(claimAmount)}</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: ${assetsAtRisk > 0 ? '#ffebee' : '#e6f7e6'}; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">⚠️ Assets at Risk</h4>
                    <p style="font-size: 1.6rem; color: ${assetsAtRisk > 0 ? '#c62828' : '#2e7d32'};">${formatMoney(assetsAtRisk)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">🛡️ Insurance Coverage</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(totalInsurance)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">⚖️ Remaining Exposure</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(unprotectedAmount)}</p>
                </div>
            </div>
            <p style="margin-top:15px;">
                ${hasLLC === 'yes'
                ? '<strong>✅ With an LLC, your personal assets are protected. Only the property itself is at risk.</strong>'
                : '<strong>❌ Without an LLC, your personal assets are exposed.</strong>'}
                ${assetsAtRisk === 0
                ? '<br>🎉 Your insurance fully covers the claim!'
                : '<br>Consider increasing umbrella coverage or adding an LLC to protect more assets.'}
            </p>
            <p><small>This is a simplified simulation. Actual legal outcomes depend on many factors. Consult an attorney.</small></p>
        `;
        });
    }

    function initDownPaymentCalculator() {
        const calcBtn = document.getElementById('calcDownPayment');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const targetPriceInput = document.getElementById('targetPrice');
        const downPercentInput = document.getElementById('downPercentDP');
        const currentSavingsInput = document.getElementById('currentSavings');
        const monthlySavingsInput = document.getElementById('monthlySavings');
        const returnInput = document.getElementById('annualReturn');

        const targetPriceVal = document.getElementById('targetPriceVal');
        const downPercentVal = document.getElementById('downPercentValDP');
        const currentSavingsVal = document.getElementById('currentSavingsVal');
        const monthlySavingsVal = document.getElementById('monthlySavingsVal');
        const returnVal = document.getElementById('returnVal');

        if (targetPriceInput && targetPriceVal) {
            targetPriceInput.addEventListener('input', () => targetPriceVal.textContent = targetPriceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (currentSavingsInput && currentSavingsVal) {
            currentSavingsInput.addEventListener('input', () => currentSavingsVal.textContent = currentSavingsInput.value);
        }
        if (monthlySavingsInput && monthlySavingsVal) {
            monthlySavingsInput.addEventListener('input', () => monthlySavingsVal.textContent = monthlySavingsInput.value);
        }
        if (returnInput && returnVal) {
            returnInput.addEventListener('input', () => returnVal.textContent = returnInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const targetPrice = parseFloat(targetPriceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const currentSavings = parseFloat(currentSavingsInput.value);
            const monthlySavings = parseFloat(monthlySavingsInput.value);
            const annualReturn = parseFloat(returnInput.value) / 100;

            if ([targetPrice, downPercent, currentSavings, monthlySavings, annualReturn].some(isNaN)) {
                document.getElementById('downPaymentResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const downPaymentNeeded = targetPrice * downPercent;
            let savings = currentSavings;
            const monthlyRate = annualReturn / 12;
            let months = 0;
            const maxMonths = 600; // 50 years, to avoid infinite loop

            if (savings >= downPaymentNeeded) {
                months = 0;
            } else {
                while (savings < downPaymentNeeded && months < maxMonths) {
                    savings = savings * (1 + monthlyRate) + monthlySavings;
                    months++;
                }
            }

            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('downPaymentResult');
            if (months >= maxMonths) {
                resultDiv.innerHTML = `<p style="color:red;">With these settings, it would take more than 50 years to reach your goal. Consider increasing monthly savings or lowering your target.</p>`;
            } else {
                resultDiv.innerHTML = `
                <p><strong>You need a down payment of ${formatMoney(downPaymentNeeded)}.</strong></p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                    <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                        <h4 style="margin:0 0 5px;">⏳ Time to Goal</h4>
                        <p style="font-size: 1.6rem; color: #2e7d32;">${years} yr ${remainingMonths} mo</p>
                    </div>
                    <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                        <h4 style="margin:0 0 5px;">💰 Total Saved (with interest)</h4>
                        <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(savings)}</p>
                    </div>
                </div>
                <p style="margin-top:15px;">Assumes ${annualReturn*100}% annual return compounded monthly. Actual results may vary.</p>
            `;
            }
        });
    }

    function initMortgageCalculator() {
        const calcBtn = document.getElementById('calcMortgage');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const homePriceInput = document.getElementById('homePriceMort');
        const downPercentInput = document.getElementById('downPercentMort');
        const rateInput = document.getElementById('rateMort');

        const homePriceVal = document.getElementById('homePriceValMort');
        const downPercentVal = document.getElementById('downPercentValMort');
        const rateVal = document.getElementById('rateValMort');

        if (homePriceInput && homePriceVal) {
            homePriceInput.addEventListener('input', () => homePriceVal.textContent = homePriceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (rateInput && rateVal) {
            rateInput.addEventListener('input', () => rateVal.textContent = rateInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const homePrice = parseFloat(homePriceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const rate = parseFloat(rateInput.value) / 100;
            const term = parseInt(document.getElementById('termMort').value);
            const loanType = document.getElementById('loanTypeMort').value;

            if ([homePrice, downPercent, rate, term].some(isNaN)) {
                document.getElementById('mortgageResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const downPayment = homePrice * downPercent;
            const loanAmount = homePrice - downPayment;
            const monthlyRate = rate / 12;
            const months = term * 12;

            let monthlyPI;
            if (rate === 0) {
                monthlyPI = loanAmount / months;
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
            }

            // Rough estimates for mortgage insurance/fees per loan type
            let monthlyMI = 0;
            let upfrontFee = 0;
            let loanTypeName = '';

            switch (loanType) {
                case 'conventional':
                    loanTypeName = 'Conventional';
                    if (downPercent < 0.2) {
                        // PMI roughly 0.5% of loan amount annually
                        monthlyMI = loanAmount * 0.005 / 12;
                    }
                    break;
                case 'fha':
                    loanTypeName = 'FHA';
                    // Upfront MIP 1.75% of loan amount, annual MIP 0.55% (typical)
                    upfrontFee = loanAmount * 0.0175;
                    monthlyMI = loanAmount * 0.0055 / 12;
                    break;
                case 'va':
                    loanTypeName = 'VA';
                    // Funding fee varies, 2.3% for first-time with 0% down, but we'll simplify
                    upfrontFee = loanAmount * 0.023;
                    // No monthly MI
                    break;
                case 'usda':
                    loanTypeName = 'USDA';
                    // Upfront guarantee fee 1% of loan amount, annual fee 0.35%
                    upfrontFee = loanAmount * 0.01;
                    monthlyMI = loanAmount * 0.0035 / 12;
                    break;
            }

            const totalMonthly = monthlyPI + monthlyMI;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('mortgageResult');
            resultDiv.innerHTML = `
            <p><strong>${loanTypeName} Loan</strong> – Home price: ${formatMoney(homePrice)}, Down: ${downPercent*100}% (${formatMoney(downPayment)})</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📆 Monthly P&I</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(monthlyPI)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">➕ Monthly MI/Fee</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(monthlyMI)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💰 Total Monthly</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(totalMonthly)}</p>
                </div>
            </div>
            ${upfrontFee > 0 ? `<p><strong>Upfront fee (rolled into loan or paid at closing):</strong> ${formatMoney(upfrontFee)}</p>` : ''}
            <p><small>Estimates only. Does not include property tax, homeowners insurance, or HOA. Actual costs vary by lender and location.</small></p>
        `;
        });
    }

    function initAssistanceFinder() {
        const findBtn = document.getElementById('findAssistance');
        if (!findBtn) return;

        // Update displayed values for sliders
        const incomeInput = document.getElementById('incomeAssist');
        const creditInput = document.getElementById('creditAssist');
        const incomeVal = document.getElementById('incomeValAssist');
        const creditVal = document.getElementById('creditValAssist');

        if (incomeInput && incomeVal) {
            incomeInput.addEventListener('input', () => incomeVal.textContent = incomeInput.value);
        }
        if (creditInput && creditVal) {
            creditInput.addEventListener('input', () => creditVal.textContent = creditInput.value);
        }

        findBtn.addEventListener('click', function() {
            const state = document.getElementById('stateSelect').value;
            const income = parseFloat(incomeInput.value);
            const credit = parseFloat(creditInput.value);
            const military = document.getElementById('militaryAssist').value;
            const location = document.getElementById('locationAssist').value;

            if ([income, credit].some(isNaN)) {
                document.getElementById('assistanceResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Simulated eligibility logic
            let programs = [];

            // FHA
            if (credit >= 500) {
                programs.push({
                    name: 'FHA Loan',
                    details: `3.5% down payment. Credit score ${credit >= 580 ? 'meets 580 requirement' : 'needs 580 (you have ' + credit + ')'}. Mortgage insurance required.`,
                    eligible: credit >= 580,
                    benefit: 'Low down payment'
                });
            }

            // Conventional
            if (credit >= 620) {
                programs.push({
                    name: 'Conventional 97',
                    details: '3% down for first‑time buyers. PMI if less than 20% down.',
                    eligible: true,
                    benefit: 'Low down payment, no upfront mortgage insurance'
                });
            } else if (credit >= 580) {
                programs.push({
                    name: 'Conventional Loan',
                    details: 'Typically 5% down minimum with 620+ credit. Your credit may require a higher down payment.',
                    eligible: false,
                    benefit: 'May be possible with larger down payment'
                });
            }

            // VA
            if (military === 'yes') {
                programs.push({
                    name: 'VA Loan',
                    details: '0% down, no PMI, competitive rates. Funding fee applies (can be rolled into loan).',
                    eligible: true,
                    benefit: 'Zero down, no monthly mortgage insurance'
                });
            }

            // USDA
            if (location === 'rural' && income <= 110650) { // approximate limit for 1-4 person household
                programs.push({
                    name: 'USDA Loan',
                    details: '0% down, guarantee fee instead of PMI. Income limits apply.',
                    eligible: credit >= 640,
                    benefit: 'Zero down in eligible rural areas'
                });
            } else if (location === 'rural') {
                programs.push({
                    name: 'USDA Loan',
                    details: '0% down, but your income may exceed limits for your area.',
                    eligible: false,
                    benefit: 'Check local income limits'
                });
            }

            // Generic state DPA (simulated)
            if (income <= 100000) { // rough median
                programs.push({
                    name: 'State Down Payment Assistance',
                    details: `Many states offer grants or low‑interest loans. Based on your income, you may qualify for up to $10,000 in assistance.`,
                    eligible: true,
                    benefit: 'Up to $10,000 grant or 0% deferred loan'
                });
            } else {
                programs.push({
                    name: 'State Down Payment Assistance',
                    details: `Your income may be above typical limits, but some programs have no income caps. Check with your state housing authority.`,
                    eligible: false,
                    benefit: 'Possibly none, but verify'
                });
            }

            // Format results
            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            let html = '<p><strong>Based on your inputs, here are programs you might consider:</strong></p>';
            programs.forEach(p => {
                const color = p.eligible ? '#e6f7e6' : '#ffebee';
                const icon = p.eligible ? '✅' : '⚠️';
                html += `
                <div style="background: ${color}; padding: 12px; margin: 10px 0; border-radius: 8px;">
                    <h4 style="margin:0 0 5px;">${icon} ${p.name}</h4>
                    <p style="margin:0 0 3px;">${p.details}</p>
                    <p><strong>Potential benefit:</strong> ${p.benefit}</p>
                </div>
            `;
            });
            html += `<p><small>This is a simulation. Actual program availability, terms, and eligibility vary. Always consult a lender or housing counselor.</small></p>`;

            document.getElementById('assistanceResult').innerHTML = html;
        });
    }

    function initRentalAnalysisTool() {
        const analyzeBtn = document.getElementById('analyzeRental');
        if (!analyzeBtn) return;

        // Update displayed values for sliders
        const priceInput = document.getElementById('priceAnalysis');
        const downPercentInput = document.getElementById('downPercentAnalysis');
        const rateInput = document.getElementById('rateAnalysis');
        const rentInput = document.getElementById('rentAnalysis');
        const vacancyInput = document.getElementById('vacancyAnalysis');
        const taxInput = document.getElementById('taxAnalysis');
        const insuranceInput = document.getElementById('insuranceAnalysis');
        const maintInput = document.getElementById('maintAnalysis');
        const pmInput = document.getElementById('pmAnalysis');
        const otherInput = document.getElementById('otherAnalysis');
        const termSelect = document.getElementById('termAnalysis');

        const priceVal = document.getElementById('priceValAnalysis');
        const downPercentVal = document.getElementById('downPercentValAnalysis');
        const rateVal = document.getElementById('rateValAnalysis');
        const rentVal = document.getElementById('rentValAnalysis');
        const vacancyVal = document.getElementById('vacancyValAnalysis');
        const taxVal = document.getElementById('taxValAnalysis');
        const insVal = document.getElementById('insValAnalysis');
        const maintVal = document.getElementById('maintValAnalysis');
        const pmVal = document.getElementById('pmValAnalysis');
        const otherVal = document.getElementById('otherValAnalysis');

        if (priceInput && priceVal) {
            priceInput.addEventListener('input', () => priceVal.textContent = priceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (rateInput && rateVal) {
            rateInput.addEventListener('input', () => rateVal.textContent = rateInput.value);
        }
        if (rentInput && rentVal) {
            rentInput.addEventListener('input', () => rentVal.textContent = rentInput.value);
        }
        if (vacancyInput && vacancyVal) {
            vacancyInput.addEventListener('input', () => vacancyVal.textContent = vacancyInput.value);
        }
        if (taxInput && taxVal) {
            taxInput.addEventListener('input', () => taxVal.textContent = taxInput.value);
        }
        if (insuranceInput && insVal) {
            insuranceInput.addEventListener('input', () => insVal.textContent = insuranceInput.value);
        }
        if (maintInput && maintVal) {
            maintInput.addEventListener('input', () => maintVal.textContent = maintInput.value);
        }
        if (pmInput && pmVal) {
            pmInput.addEventListener('input', () => pmVal.textContent = pmInput.value);
        }
        if (otherInput && otherVal) {
            otherInput.addEventListener('input', () => otherVal.textContent = otherInput.value);
        }

        analyzeBtn.addEventListener('click', function() {
            const price = parseFloat(priceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const rate = parseFloat(rateInput.value) / 100;
            const term = parseInt(termSelect.value);
            const monthlyRent = parseFloat(rentInput.value);
            const vacancyRate = parseFloat(vacancyInput.value) / 100;
            const taxRate = parseFloat(taxInput.value) / 100;
            const annualInsurance = parseFloat(insuranceInput.value);
            const maintRate = parseFloat(maintInput.value) / 100;
            const pmRate = parseFloat(pmInput.value) / 100;
            const otherMonthly = parseFloat(otherInput.value);

            if ([price, downPercent, rate, term, monthlyRent, vacancyRate, taxRate, annualInsurance, maintRate, pmRate, otherMonthly].some(isNaN)) {
                document.getElementById('analysisResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const downPayment = price * downPercent;
            const loanAmount = price - downPayment;
            const monthlyRate = rate / 12;
            const months = term * 12;

            // Monthly mortgage payment (principal + interest)
            let monthlyPI;
            if (rate === 0) {
                monthlyPI = loanAmount / months;
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
            }

            // Annual figures
            const annualRent = monthlyRent * 12;
            const vacancyLoss = annualRent * vacancyRate;
            const effectiveGrossIncome = annualRent - vacancyLoss;

            const annualTax = price * taxRate;
            const annualMaint = price * maintRate;
            const annualPM = effectiveGrossIncome * pmRate; // property management on effective income
            const annualOther = otherMonthly * 12;

            const totalOperatingExpenses = annualTax + annualInsurance + annualMaint + annualPM + annualOther;
            const noi = effectiveGrossIncome - totalOperatingExpenses;

            const annualMortgage = monthlyPI * 12;
            const annualCashFlow = noi - annualMortgage;
            const monthlyCashFlow = annualCashFlow / 12;

            const capRate = price > 0 ? (noi / price) * 100 : 0;
            const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('analysisResult');
            resultDiv.innerHTML = `
            <p><strong>Rental Property Analysis</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📈 Cap Rate</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatPercent(capRate)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💵 Monthly Cash Flow</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(monthlyCashFlow)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Cash‑on‑Cash ROI</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatPercent(cashOnCash)}</p>
                </div>
            </div>
            <p><strong>NOI:</strong> ${formatMoney(noi)}/year | <strong>Debt Service:</strong> ${formatMoney(annualMortgage)}/year</p>
            <p><small>Assumes ${downPercent*100}% down, ${rate*100}% interest, ${term}-year term. Expenses include taxes (${taxRate*100}%), insurance, maintenance (${maintRate*100}%), property management (${pmRate*100}%), vacancy (${vacancyRate*100}%), and other costs.</small></p>
        `;
        });
    }

    function initHouseHackCalculator() {
        const calcBtn = document.getElementById('calcHouseHack');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const priceInput = document.getElementById('priceHH');
        const downPercentInput = document.getElementById('downPercentHH');
        const rateInput = document.getElementById('rateHH');
        const rentInput = document.getElementById('rentHH');
        const currentRentInput = document.getElementById('currentRentHH');
        const expensesInput = document.getElementById('expensesHH');

        const priceVal = document.getElementById('priceValHH');
        const downPercentVal = document.getElementById('downPercentValHH');
        const rateVal = document.getElementById('rateValHH');
        const rentVal = document.getElementById('rentValHH');
        const currentRentVal = document.getElementById('currentRentValHH');
        const expensesVal = document.getElementById('expensesValHH');

        if (priceInput && priceVal) {
            priceInput.addEventListener('input', () => priceVal.textContent = priceInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (rateInput && rateVal) {
            rateInput.addEventListener('input', () => rateVal.textContent = rateInput.value);
        }
        if (rentInput && rentVal) {
            rentInput.addEventListener('input', () => rentVal.textContent = rentInput.value);
        }
        if (currentRentInput && currentRentVal) {
            currentRentInput.addEventListener('input', () => currentRentVal.textContent = currentRentInput.value);
        }
        if (expensesInput && expensesVal) {
            expensesInput.addEventListener('input', () => expensesVal.textContent = expensesInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const price = parseFloat(priceInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const rate = parseFloat(rateInput.value) / 100;
            const term = parseInt(document.getElementById('termHH').value);
            const rentalIncome = parseFloat(rentInput.value);
            const currentRent = parseFloat(currentRentInput.value);
            const otherExpenses = parseFloat(expensesInput.value);

            if ([price, downPercent, rate, term, rentalIncome, currentRent, otherExpenses].some(isNaN)) {
                document.getElementById('houseHackResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const downPayment = price * downPercent;
            const loanAmount = price - downPayment;
            const monthlyRate = rate / 12;
            const months = term * 12;

            let monthlyPI;
            if (rate === 0) {
                monthlyPI = loanAmount / months;
            } else {
                const factor = Math.pow(1 + monthlyRate, months);
                monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
            }

            const totalMonthlyHousingCost = monthlyPI + otherExpenses;
            const netCostAfterRent = totalMonthlyHousingCost - rentalIncome;
            const monthlySavings = currentRent - netCostAfterRent;
            const annualSavings = monthlySavings * 12;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            const resultDiv = document.getElementById('houseHackResult');
            resultDiv.innerHTML = `
            <p><strong>Monthly mortgage payment (P&I):</strong> ${formatMoney(monthlyPI)}</p>
            <p><strong>Other expenses (tax/ins/maintenance):</strong> ${formatMoney(otherExpenses)}</p>
            <p><strong>Total monthly housing cost:</strong> ${formatMoney(totalMonthlyHousingCost)}</p>
            <p><strong>Rental income from other units:</strong> ${formatMoney(rentalIncome)}</p>
            <div style="background: #e6f7e6; padding: 15px; border-radius: 12px; margin: 15px 0;">
                <h4 style="margin:0 0 5px;">🏠 Your net housing cost after rent</h4>
                <p style="font-size: 2rem; color: #2e7d32;">${formatMoney(netCostAfterRent)}/month</p>
            </div>
            <div style="background: ${monthlySavings >= 0 ? '#e6f7e6' : '#ffebee'}; padding: 15px; border-radius: 12px;">
                <h4 style="margin:0 0 5px;">💰 Compared to your current rent of ${formatMoney(currentRent)}/month</h4>
                <p style="font-size: 2rem; color: ${monthlySavings >= 0 ? '#2e7d32' : '#c62828'};">${monthlySavings >= 0 ? 'You save ' : 'You pay '} ${formatMoney(Math.abs(monthlySavings))}/month</p>
                <p>${annualSavings >= 0 ? 'Annual savings: ' + formatMoney(annualSavings) : 'Annual additional cost: ' + formatMoney(-annualSavings)}</p>
            </div>
            <p><small>This is a simplified estimate. Does not include vacancy, repairs, property management, or changes in rent. Always budget a cushion.</small></p>
        `;
        });
    }

    function initBrrrrCalculator() {
        const calcBtn = document.getElementById('calcBrrrr');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const purchaseInput = document.getElementById('purchasePrice');
        const rehabInput = document.getElementById('rehabCosts');
        const arvInput = document.getElementById('arv');
        const downInput = document.getElementById('downBrrrr');
        const purchaseRateInput = document.getElementById('purchaseRate');
        const ltvInput = document.getElementById('ltv');
        const refiRateInput = document.getElementById('refiRate');
        const rentInput = document.getElementById('rentBrrrr');
        const opExInput = document.getElementById('opExPercent');
        const closingInput = document.getElementById('closingPercent');

        const purchaseVal = document.getElementById('purchaseVal');
        const rehabVal = document.getElementById('rehabVal');
        const arvVal = document.getElementById('arvVal');
        const downVal = document.getElementById('downValBrrrr');
        const purchaseRateVal = document.getElementById('purchaseRateVal');
        const ltvVal = document.getElementById('ltvVal');
        const refiRateVal = document.getElementById('refiRateVal');
        const rentVal = document.getElementById('rentValBrrrr');
        const opExVal = document.getElementById('opExVal');
        const closingVal = document.getElementById('closingVal');

        if (purchaseInput && purchaseVal) {
            purchaseInput.addEventListener('input', () => purchaseVal.textContent = purchaseInput.value);
        }
        if (rehabInput && rehabVal) {
            rehabInput.addEventListener('input', () => rehabVal.textContent = rehabInput.value);
        }
        if (arvInput && arvVal) {
            arvInput.addEventListener('input', () => arvVal.textContent = arvInput.value);
        }
        if (downInput && downVal) {
            downInput.addEventListener('input', () => downVal.textContent = downInput.value);
        }
        if (purchaseRateInput && purchaseRateVal) {
            purchaseRateInput.addEventListener('input', () => purchaseRateVal.textContent = purchaseRateInput.value);
        }
        if (ltvInput && ltvVal) {
            ltvInput.addEventListener('input', () => ltvVal.textContent = ltvInput.value);
        }
        if (refiRateInput && refiRateVal) {
            refiRateInput.addEventListener('input', () => refiRateVal.textContent = refiRateInput.value);
        }
        if (rentInput && rentVal) {
            rentInput.addEventListener('input', () => rentVal.textContent = rentInput.value);
        }
        if (opExInput && opExVal) {
            opExInput.addEventListener('input', () => opExVal.textContent = opExInput.value);
        }
        if (closingInput && closingVal) {
            closingInput.addEventListener('input', () => closingVal.textContent = closingInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const purchasePrice = parseFloat(purchaseInput.value);
            const rehabCosts = parseFloat(rehabInput.value);
            const arv = parseFloat(arvInput.value);
            const downPercent = parseFloat(downInput.value) / 100;
            const purchaseRate = parseFloat(purchaseRateInput.value) / 100;
            const ltvPercent = parseFloat(ltvInput.value) / 100;
            const refiRate = parseFloat(refiRateInput.value) / 100;
            const refiTerm = parseInt(document.getElementById('refiTerm').value);
            const monthlyRent = parseFloat(rentInput.value);
            const opExPercent = parseFloat(opExInput.value) / 100;
            const closingPercent = parseFloat(closingInput.value) / 100;

            if ([purchasePrice, rehabCosts, arv, downPercent, purchaseRate, ltvPercent, refiRate, refiTerm, monthlyRent, opExPercent, closingPercent].some(isNaN)) {
                document.getElementById('brrrrResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Purchase loan
            const purchaseLoanAmount = purchasePrice * (1 - downPercent);
            const purchaseDown = purchasePrice * downPercent;
            const purchaseClosing = purchasePrice * closingPercent;

            // Total cash invested initially
            const totalCashInvested = purchaseDown + rehabCosts + purchaseClosing;

            // After rehab, we refinance based on ARV
            const refiLoanAmount = arv * ltvPercent;
            // Assume we pay off the original purchase loan with the refi proceeds
            const cashOut = refiLoanAmount - purchaseLoanAmount;

            // Cash returned to investor (after paying off rehab costs? Actually we already spent rehab, but we get cash out)
            // Net cash remaining in deal = totalCashInvested - cashOut
            const cashLeftInDeal = totalCashInvested - cashOut;

            // New monthly mortgage on refi loan
            const monthlyRefiRate = refiRate / 12;
            const refiMonths = refiTerm * 12;
            let monthlyPI;
            if (refiRate === 0) {
                monthlyPI = refiLoanAmount / refiMonths;
            } else {
                const factor = Math.pow(1 + monthlyRefiRate, refiMonths);
                monthlyPI = refiLoanAmount * (monthlyRefiRate * factor) / (factor - 1);
            }

            // Operating income
            const annualRent = monthlyRent * 12;
            const operatingExpenses = annualRent * opExPercent;
            const noi = annualRent - operatingExpenses;
            const annualMortgage = monthlyPI * 12;
            const annualCashFlow = noi - annualMortgage;
            const monthlyCashFlow = annualCashFlow / 12;

            // Cash-on-cash return based on cash left in deal (if any)
            const cocReturn = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : Infinity;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('brrrrResult');
            let cashMessage = '';
            if (cashLeftInDeal <= 0) {
                cashMessage = '🎉 You got all your money out (and maybe more)! You own the property with $0 left in the deal.';
            } else {
                cashMessage = `You still have ${formatMoney(cashLeftInDeal)} left in the deal.`;
            }

            resultDiv.innerHTML = `
            <p><strong>BRRRR Deal Analysis</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💰 Cash Invested</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(totalCashInvested)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💵 Cash Out at Refi</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(cashOut)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Cash Left in Deal</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(cashLeftInDeal)}</p>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <p><strong>After refinance:</strong> New loan ${formatMoney(refiLoanAmount)} at ${refiRate*100}% for ${refiTerm} years.</p>
                <p><strong>Monthly cash flow:</strong> ${formatMoney(monthlyCashFlow)}</p>
                <p><strong>Cash‑on‑cash return:</strong> ${cashLeftInDeal > 0 ? formatPercent(cocReturn) : 'Infinite (no money left in)'}</p>
                <p>${cashMessage}</p>
            </div>
            <p><small>Assumes you can refinance at ARV and LTV shown. Does not include holding costs during rehab, vacancy, or unexpected expenses. Always verify with a lender.</small></p>
        `;
        });
    }

    function initSyndicationCalculator() {
        const calcBtn = document.getElementById('calcSyndication');
        if (!calcBtn) return;

        // Update displayed values for sliders
        const investmentInput = document.getElementById('investment');
        const holdInput = document.getElementById('holdYears');
        const prefInput = document.getElementById('prefReturn');
        const splitInput = document.getElementById('lpSplit');
        const cashflowInput = document.getElementById('annualCashflowPct');
        const apprecInput = document.getElementById('appreciationPct');

        const investmentVal = document.getElementById('investmentVal');
        const holdVal = document.getElementById('holdVal');
        const prefVal = document.getElementById('prefVal');
        const splitVal = document.getElementById('splitVal');
        const cashflowVal = document.getElementById('cashflowVal');
        const apprecVal = document.getElementById('apprecVal');

        if (investmentInput && investmentVal) {
            investmentInput.addEventListener('input', () => investmentVal.textContent = investmentInput.value);
        }
        if (holdInput && holdVal) {
            holdInput.addEventListener('input', () => holdVal.textContent = holdInput.value);
        }
        if (prefInput && prefVal) {
            prefInput.addEventListener('input', () => prefVal.textContent = prefInput.value);
        }
        if (splitInput && splitVal) {
            splitInput.addEventListener('input', () => splitVal.textContent = splitInput.value);
        }
        if (cashflowInput && cashflowVal) {
            cashflowInput.addEventListener('input', () => cashflowVal.textContent = cashflowInput.value);
        }
        if (apprecInput && apprecVal) {
            apprecInput.addEventListener('input', () => apprecVal.textContent = apprecInput.value);
        }

        calcBtn.addEventListener('click', function() {
            const investment = parseFloat(investmentInput.value);
            const years = parseFloat(holdInput.value);
            const prefReturn = parseFloat(prefInput.value) / 100;
            const lpSplit = parseFloat(splitInput.value) / 100;
            const annualCashflowPct = parseFloat(cashflowInput.value) / 100;
            const appreciationPct = parseFloat(apprecInput.value) / 100;

            if ([investment, years, prefReturn, lpSplit, annualCashflowPct, appreciationPct].some(isNaN)) {
                document.getElementById('syndicationResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Simplified model: assume cash flow paid annually, and sale proceeds at end.
            // Calculate annual cash flow
            const annualCashFlow = investment * annualCashflowPct;
            let totalCashFlow = 0;
            let cumulativePrefPaid = 0;

            // Simulate each year
            for (let y = 1; y <= years; y++) {
                // Preferred return due this year
                const prefDue = investment * prefReturn;
                // If cash flow covers pref, LP gets full pref, remainder goes to split
                if (annualCashFlow >= prefDue) {
                    const excess = annualCashFlow - prefDue;
                    totalCashFlow += prefDue + excess * lpSplit;
                    cumulativePrefPaid += prefDue;
                } else {
                    // Cash flow less than pref – LP gets all cash flow, and unpaid pref accumulates (if cumulative)
                    // We'll assume cumulative for simplicity (common in many deals)
                    totalCashFlow += annualCashFlow;
                    // Not adding to cumulativePrefPaid because not fully paid? We'll track separately.
                    // For simplicity, we'll just note that pref is not fully paid.
                }
            }

            // Sale proceeds: appreciation on investment (assuming property value grows by appreciationPct overall)
            // But in reality, it's based on property value, not just investment. We'll approximate:
            // LP gets their capital back first, then pref unpaid (if cumulative), then split.
            // Let's simplify: total return at sale = investment * (1 + appreciationPct)
            const saleProceedsBeforeSplit = investment * (1 + appreciationPct);
            // First, return capital
            let remaining = saleProceedsBeforeSplit - investment;
            // Then pay any unpaid preferred return? We'll ignore for simplicity.
            // Then split remaining according to lpSplit
            const lpShareOfProfit = remaining * lpSplit;
            const totalAtSale = investment + lpShareOfProfit;

            // Total cash received
            const totalReturn = totalCashFlow + totalAtSale;
            const profit = totalReturn - investment;
            const equityMultiple = totalReturn / investment;

            // Approximate IRR using simple average? Better to just show equity multiple.
            // We'll also calculate simple annualized return (CAGR)
            const cagr = (Math.pow(totalReturn / investment, 1 / years) - 1) * 100;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('syndicationResult');
            resultDiv.innerHTML = `
            <p><strong>Estimated returns on $${investment.toLocaleString()} over ${years} years:</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📈 Total Return</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${formatMoney(totalReturn)}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💰 Profit</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(profit)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Equity Multiple</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${equityMultiple.toFixed(2)}x</p>
                </div>
            </div>
            <p><strong>Annualized return (CAGR):</strong> ${formatPercent(cagr)}</p>
            <p><small>Assumes ${formatPercent(annualCashflowPct*100)} annual cash flow, ${formatPercent(prefReturn*100)} pref, ${lpSplit*100}% LP split after pref, and ${formatPercent(appreciationPct*100)} total appreciation. This is a simplified estimate. Actual results depend on many factors.</small></p>
        `;
        });
    }

    function initPortfolioSimulator() {
        const simulateBtn = document.getElementById('simulatePortfolio');
        if (!simulateBtn) return;

        // Update displayed values for sliders
        const startCapitalInput = document.getElementById('startCapital');
        const annualSavingsInput = document.getElementById('annualSavings');
        const downPercentInput = document.getElementById('downPercentScale');
        const avgPriceInput = document.getElementById('avgPrice');
        const cocInput = document.getElementById('cocReturn');
        const apprecInput = document.getElementById('apprecRate');
        const yearsInput = document.getElementById('yearsScale');

        const startCapitalVal = document.getElementById('startCapitalVal');
        const annualSavingsVal = document.getElementById('annualSavingsVal');
        const downPercentVal = document.getElementById('downPercentValScale');
        const avgPriceVal = document.getElementById('avgPriceVal');
        const cocVal = document.getElementById('cocVal');
        const apprecVal = document.getElementById('apprecValScale');
        const yearsVal = document.getElementById('yearsValScale');

        if (startCapitalInput && startCapitalVal) {
            startCapitalInput.addEventListener('input', () => startCapitalVal.textContent = startCapitalInput.value);
        }
        if (annualSavingsInput && annualSavingsVal) {
            annualSavingsInput.addEventListener('input', () => annualSavingsVal.textContent = annualSavingsInput.value);
        }
        if (downPercentInput && downPercentVal) {
            downPercentInput.addEventListener('input', () => downPercentVal.textContent = downPercentInput.value);
        }
        if (avgPriceInput && avgPriceVal) {
            avgPriceInput.addEventListener('input', () => avgPriceVal.textContent = avgPriceInput.value);
        }
        if (cocInput && cocVal) {
            cocInput.addEventListener('input', () => cocVal.textContent = cocInput.value);
        }
        if (apprecInput && apprecVal) {
            apprecInput.addEventListener('input', () => apprecVal.textContent = apprecInput.value);
        }
        if (yearsInput && yearsVal) {
            yearsInput.addEventListener('input', () => yearsVal.textContent = yearsInput.value);
        }

        simulateBtn.addEventListener('click', function() {
            const startCapital = parseFloat(startCapitalInput.value);
            const annualSavings = parseFloat(annualSavingsInput.value);
            const downPercent = parseFloat(downPercentInput.value) / 100;
            const avgPrice = parseFloat(avgPriceInput.value);
            const cocReturn = parseFloat(cocInput.value) / 100;
            const apprecRate = parseFloat(apprecInput.value) / 100;
            const years = parseFloat(yearsInput.value);

            if ([startCapital, annualSavings, downPercent, avgPrice, cocReturn, apprecRate, years].some(isNaN)) {
                document.getElementById('portfolioResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Initialize variables
            let capital = startCapital;
            let totalEquity = 0;
            let totalProperties = 0;
            let totalPortfolioValue = 0;
            let totalDebt = 0;

            // We'll simulate year by year: each year, we can buy as many properties as capital allows (down payment)
            // Then properties generate cash flow (cocReturn on down payment) and appreciate.
            // For simplicity, we assume each property costs avgPrice, down payment = avgPrice * downPercent.
            // We'll track portfolio value, equity, and cash flow.

            const downPaymentPerProperty = avgPrice * downPercent;

            for (let year = 1; year <= years; year++) {
                // Buy properties with available capital at start of year
                if (capital >= downPaymentPerProperty) {
                    const propertiesBought = Math.floor(capital / downPaymentPerProperty);
                    totalProperties += propertiesBought;
                    const purchaseAmount = propertiesBought * avgPrice;
                    const debtAdded = purchaseAmount * (1 - downPercent);
                    totalDebt += debtAdded;
                    capital -= propertiesBought * downPaymentPerProperty;
                }

                // Add annual savings
                capital += annualSavings;

                // Calculate portfolio value and appreciation
                totalPortfolioValue = totalProperties * avgPrice * (1 + apprecRate * year); // simplified: we compound over the years? Actually each property appreciates from its purchase year.
                // To keep it simpler, we'll just assume all properties bought so far appreciate at apprecRate per year for the remaining years.
                // Better: track per-property value, but that's complex. We'll approximate that the average holding period is half the total years? Let's do a simpler approach:
                // We'll recompute portfolio value each year by applying appreciation to existing properties.
                // But we don't have a list. Instead, we'll use a formula:
                // At year y, total portfolio value = sum of properties bought at different times with appreciation.
                // We can approximate by assuming all properties appreciate at apprecRate per year, and we'll calculate cumulative.
                // We'll do a loop over years to accumulate properly.
            }

            // More accurate: simulate year by year with tracking arrays
            // Reset variables for proper simulation
            let propertyCount = 0;
            let propertyValues = []; // value of each property (initial purchase price)
            let propertyDebt = []; // remaining debt? we'll assume fixed-rate mortgages, but for simplicity, we'll keep debt constant (no amortization)
            let capitalSim = startCapital;
            let portfolioValueSim = 0;
            let totalDebtSim = 0;
            let totalEquitySim = 0;
            let annualCashFlowSim = 0;

            for (let y = 1; y <= years; y++) {
                // Buy properties at start of year with available capital
                if (capitalSim >= downPaymentPerProperty) {
                    const canBuy = Math.floor(capitalSim / downPaymentPerProperty);
                    for (let i = 0; i < canBuy; i++) {
                        propertyCount++;
                        propertyValues.push(avgPrice);
                        propertyDebt.push(avgPrice * (1 - downPercent));
                        capitalSim -= downPaymentPerProperty;
                    }
                }

                // Add annual savings
                capitalSim += annualSavings;

                // Appreciate all properties
                for (let i = 0; i < propertyValues.length; i++) {
                    propertyValues[i] *= (1 + apprecRate);
                }

                // Calculate cash flow from all properties (based on down payment * cocReturn)
                // Cash flow is on the equity invested? Typically cash-on-cash is on the cash invested (down payment). So total cash flow = sum of down payments * cocReturn.
                // We'll assume each property generates annual cash flow = downPaymentPerProperty * cocReturn.
                const annualCashFlowThisYear = propertyCount * (downPaymentPerProperty * cocReturn);
                capitalSim += annualCashFlowThisYear; // reinvest cash flow
                annualCashFlowSim += annualCashFlowThisYear;

                // Recalculate totals
                portfolioValueSim = propertyValues.reduce((a, b) => a + b, 0);
                totalDebtSim = propertyDebt.reduce((a, b) => a + b, 0);
                totalEquitySim = portfolioValueSim - totalDebtSim;
            }

            const finalProperties = propertyCount;
            const finalPortfolioValue = portfolioValueSim;
            const finalEquity = totalEquitySim;
            const finalCapital = capitalSim;
            const totalCashFlow = annualCashFlowSim;

            const formatMoney = (num) => '$' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formatPercent = (num) => num.toFixed(2) + '%';

            const resultDiv = document.getElementById('portfolioResult');
            resultDiv.innerHTML = `
            <p><strong>After ${years} years:</strong></p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 15px;">
                <div style="background: #e6f7e6; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">🏘️ Properties Owned</h4>
                    <p style="font-size: 1.6rem; color: #2e7d32;">${finalProperties}</p>
                </div>
                <div style="background: #fff3e0; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">💰 Portfolio Value</h4>
                    <p style="font-size: 1.6rem; color: #bf360c;">${formatMoney(finalPortfolioValue)}</p>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 12px;">
                    <h4 style="margin:0 0 5px;">📊 Total Equity</h4>
                    <p style="font-size: 1.6rem; color: #0d47a1;">${formatMoney(finalEquity)}</p>
                </div>
            </div>
            <p><strong>Remaining liquid capital:</strong> ${formatMoney(finalCapital)}</p>
            <p><strong>Total cumulative cash flow reinvested:</strong> ${formatMoney(totalCashFlow)}</p>
            <p><small>Assumes ${downPercent*100}% down, ${cocReturn*100}% cash-on-cash return, ${apprecRate*100}% annual appreciation. This is a simplified projection. Actual results vary.</small></p>
        `;
        });
    }

})();
