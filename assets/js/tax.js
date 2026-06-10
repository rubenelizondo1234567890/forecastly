/* assets/js/tax.js */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            initTaxBasicsTool();
            initTaxAdvantageTool();
            initCapitalGainsTool();
            initDividendTaxTool();
            initLossHarvestingTool();
            initWashSaleTool();
            initAssetLocationTool();
            initRebalancingTaxTool();
            initHarvestWorkflow();
            initContributionPrioritizer();
            initYearEndChecklist();
            initTaxDecisionTool();
            initRetirementWithdrawalTool();
            initSideHustleTool();
            initStepUpBasisTool();
            initTaxManagedTool();
        }
    });

    function initTaxBasicsTool() {
        const calcBtn = document.getElementById('calculateTaxImpact');
        if (!calcBtn) return;

        // Update displayed income value when slider changes
        const incomeSlider = document.getElementById('taxableIncome');
        const incomeValSpan = document.getElementById('incomeVal');
        if (incomeSlider && incomeValSpan) {
            incomeSlider.addEventListener('input', function() {
                incomeValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        // 2024 Federal Tax Brackets (simplified)
        const brackets = {
            single: [
                { upTo: 11600, rate: 0.10 },
                { upTo: 47150, rate: 0.12 },
                { upTo: 100525, rate: 0.22 },
                { upTo: 191950, rate: 0.24 },
                { upTo: 243725, rate: 0.32 },
                { upTo: 609350, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ],
            married: [
                { upTo: 23200, rate: 0.10 },
                { upTo: 94300, rate: 0.12 },
                { upTo: 201050, rate: 0.22 },
                { upTo: 383900, rate: 0.24 },
                { upTo: 487450, rate: 0.32 },
                { upTo: 731200, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ]
        };

        // Long‑term capital gains brackets (2024)
        const ltcgBrackets = {
            single: [
                { upTo: 47025, rate: 0.00 },
                { upTo: 518900, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ],
            married: [
                { upTo: 94050, rate: 0.00 },
                { upTo: 583750, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ]
        };

        function getMarginalRate(income, bracketsArray) {
            for (let bracket of bracketsArray) {
                if (income <= bracket.upTo) {
                    return bracket.rate;
                }
            }
            return bracketsArray[bracketsArray.length - 1].rate;
        }

        function calculateTax(income, bracketsArray) {
            let tax = 0;
            let prevLimit = 0;
            for (let bracket of bracketsArray) {
                if (income > prevLimit) {
                    const taxable = Math.min(income, bracket.upTo) - prevLimit;
                    tax += taxable * bracket.rate;
                    prevLimit = bracket.upTo;
                } else break;
            }
            return tax;
        }

        calcBtn.addEventListener('click', function() {
            // Get inputs
            const filingStatus = document.getElementById('filingStatus').value;
            const income = parseFloat(document.getElementById('taxableIncome').value);
            const gainType = document.getElementById('gainType').value;

            if (isNaN(income) || income < 0) {
                document.getElementById('taxToolResult').innerHTML = '<span style="color:red;">Please enter a valid income.</span>';
                return;
            }

            // Determine marginal ordinary rate
            const ordinaryBrackets = brackets[filingStatus];
            const marginalOrdinaryRate = getMarginalRate(income, ordinaryBrackets);
            const effectiveTax = calculateTax(income, ordinaryBrackets);
            const effectiveRate = (effectiveTax / income) * 100;

            // Tax on $1,000 gain
            let gainTax = 0;
            let gainRate = 0;
            if (gainType === 'short') {
                gainRate = marginalOrdinaryRate;
                gainTax = 1000 * marginalOrdinaryRate;
            } else {
                // Long‑term: find applicable rate
                const ltcgBracket = ltcgBrackets[filingStatus];
                gainRate = getMarginalRate(income, ltcgBracket);
                gainTax = 1000 * gainRate;
            }

            // Format numbers
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('taxToolResult');
            resultDiv.innerHTML = `
                <p><strong>Your tax snapshot</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div style="flex:1; min-width:200px; background: #eef2f5; padding:15px; border-radius:12px;">
                        <h4 style="color:var(--tax-smart-color);">📊 Marginal Ordinary Rate</h4>
                        <p style="font-size:1.8rem;">${(marginalOrdinaryRate * 100).toFixed(1)}%</p>
                        <p>Tax on your next dollar of ordinary income.</p>
                    </div>
                    <div style="flex:1; min-width:200px; background: #eef2f5; padding:15px; border-radius:12px;">
                        <h4 style="color:var(--tax-smart-color);">💰 Effective Tax Rate</h4>
                        <p style="font-size:1.8rem;">${effectiveRate.toFixed(1)}%</p>
                        <p>Your total tax divided by income.</p>
                    </div>
                </div>
                <div style="margin-top:20px; padding:15px; background:#eef2f5; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">💸 Tax on $1,000 ${gainType === 'short' ? 'Short‑Term' : 'Long‑Term'} Gain</h4>
                    <p style="font-size:1.5rem;">${formatMoney(gainTax)}</p>
                    <p>This gain would be taxed at <strong>${(gainRate * 100).toFixed(1)}%</strong>.</p>
                </div>
                <p class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
                    <i class="fas fa-lightbulb"></i> Remember: your marginal rate determines the tax on additional income or short‑term gains. Holding assets over a year can significantly lower the tax on profits.
                </p>
            `;
        });
    }

    function initTaxAdvantageTool() {
        const calcBtn = document.getElementById('calcAccountImpact');
        if (!calcBtn) return;

        // Update displayed values when sliders change
        const contributionSlider = document.getElementById('contributionAmount');
        const contributionValSpan = document.getElementById('contributionVal');
        if (contributionSlider && contributionValSpan) {
            contributionSlider.addEventListener('input', function() {
                contributionValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const taxRateSlider = document.getElementById('marginalTaxRate');
        const taxRateValSpan = document.getElementById('taxRateVal');
        if (taxRateSlider && taxRateValSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateValSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const accountType = document.getElementById('accountType').value;
            const contribution = parseFloat(document.getElementById('contributionAmount').value);
            const taxRate = parseFloat(document.getElementById('marginalTaxRate').value) / 100;

            if (isNaN(contribution) || contribution < 0) {
                document.getElementById('accountToolResult').innerHTML = '<span style="color:red;">Please enter a valid contribution amount.</span>';
                return;
            }

            let resultHtml = '';
            let taxSavingsNow = 0;
            let futureTax = 0;
            let note = '';

            if (accountType === 'trad401k') {
                taxSavingsNow = contribution * taxRate;
                futureTax = contribution * taxRate; // simplified: assumes same tax rate in retirement
                resultHtml = `
                <p><strong>Traditional 401(k) / IRA</strong></p>
                <p>💵 <strong>Tax savings this year:</strong> $${taxSavingsNow.toFixed(2)}</p>
                <p>📉 Withdrawals in retirement are taxed as ordinary income. If your tax rate remains ${(taxRate*100).toFixed(0)}%, you'll pay $${futureTax.toFixed(2)} in taxes on this contribution (plus growth).</p>
                <p class="pro-tip">Consider this if you expect to be in a lower tax bracket in retirement.</p>
            `;
            } else if (accountType === 'roth') {
                taxSavingsNow = 0;
                resultHtml = `
                <p><strong>Roth IRA / 401(k)</strong></p>
                <p>💵 <strong>Tax savings this year:</strong> $0 (contributions are after‑tax)</p>
                <p>✅ Qualified withdrawals in retirement are <strong>100% tax‑free</strong>, including all growth.</p>
                <p class="pro-tip">Ideal if you expect to be in a higher tax bracket later.</p>
            `;
            } else if (accountType === 'hsa') {
                taxSavingsNow = contribution * taxRate;
                resultHtml = `
                <p><strong>Health Savings Account (HSA)</strong></p>
                <p>💵 <strong>Tax savings this year:</strong> $${taxSavingsNow.toFixed(2)}</p>
                <p>🔄 <strong>Triple tax advantage:</strong> Contributions are deductible, growth is tax‑free, and withdrawals for qualified medical expenses are tax‑free.</p>
                <p>🏦 If used for non‑medical expenses after age 65, withdrawals are taxed like a Traditional IRA (no penalty).</p>
                <p class="pro-tip">The most tax‑efficient account available if you're eligible.</p>
            `;
            }

            document.getElementById('accountToolResult').innerHTML = resultHtml;
        });
    }

    function initCapitalGainsTool() {
        const calcBtn = document.getElementById('calcCapitalGains');
        if (!calcBtn) return;

        // Update displayed values
        const incomeSlider = document.getElementById('gainIncome');
        const incomeValSpan = document.getElementById('gainIncomeVal');
        if (incomeSlider && incomeValSpan) {
            incomeSlider.addEventListener('input', function() {
                incomeValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const gainSlider = document.getElementById('gainAmount');
        const gainValSpan = document.getElementById('gainAmountVal');
        if (gainSlider && gainValSpan) {
            gainSlider.addEventListener('input', function() {
                gainValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        // Tax brackets (2024)
        const ordinaryBrackets = {
            single: [
                { upTo: 11600, rate: 0.10 },
                { upTo: 47150, rate: 0.12 },
                { upTo: 100525, rate: 0.22 },
                { upTo: 191950, rate: 0.24 },
                { upTo: 243725, rate: 0.32 },
                { upTo: 609350, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ],
            married: [
                { upTo: 23200, rate: 0.10 },
                { upTo: 94300, rate: 0.12 },
                { upTo: 201050, rate: 0.22 },
                { upTo: 383900, rate: 0.24 },
                { upTo: 487450, rate: 0.32 },
                { upTo: 731200, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ]
        };

        const ltcgBrackets = {
            single: [
                { upTo: 47025, rate: 0.00 },
                { upTo: 518900, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ],
            married: [
                { upTo: 94050, rate: 0.00 },
                { upTo: 583750, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ]
        };

        function getMarginalRate(income, bracketsArray) {
            for (let bracket of bracketsArray) {
                if (income <= bracket.upTo) {
                    return bracket.rate;
                }
            }
            return bracketsArray[bracketsArray.length - 1].rate;
        }

        calcBtn.addEventListener('click', function() {
            const filingStatus = document.getElementById('gainFilingStatus').value;
            const income = parseFloat(document.getElementById('gainIncome').value);
            const gain = parseFloat(document.getElementById('gainAmount').value);

            if (isNaN(income) || isNaN(gain) || gain < 0) {
                document.getElementById('capitalGainsResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Short‑term tax (ordinary rate)
            const ordinaryRate = getMarginalRate(income, ordinaryBrackets[filingStatus]);
            const shortTax = gain * ordinaryRate;

            // Long‑term tax
            const ltcgRate = getMarginalRate(income, ltcgBrackets[filingStatus]);
            const longTax = gain * ltcgRate;

            const savings = shortTax - longTax;
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('capitalGainsResult');
            resultDiv.innerHTML = `
            <p><strong>Tax on a $${gain.toLocaleString()} capital gain:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📉 Short‑Term (≤1 year)</h4>
                    <p style="font-size:1.8rem;">${formatMoney(shortTax)}</p>
                    <p>Taxed at your ordinary rate: ${(ordinaryRate * 100).toFixed(1)}%</p>
                </div>
                <div style="flex:1; background: #eef2f5; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📈 Long‑Term (>1 year)</h4>
                    <p style="font-size:1.8rem;">${formatMoney(longTax)}</p>
                    <p>Taxed at preferential rate: ${(ltcgRate * 100).toFixed(1)}%</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #d4edda; border-radius:12px;">
                <h4 style="color:#155724;">💰 Potential Savings: ${formatMoney(savings)}</h4>
                <p>By holding the asset for more than one year, you could save ${formatMoney(savings)} in federal taxes.</p>
            </div>
            <p class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
                <i class="fas fa-lightbulb"></i> This example assumes the gain does not push you into a higher tax bracket. Real‑world tax planning may involve managing brackets.
            </p>
        `;
        });
    }

    function initDividendTaxTool() {
        const calcBtn = document.getElementById('calcDividendTax');
        if (!calcBtn) return;

        // Update displayed values
        const incomeSlider = document.getElementById('divIncome');
        const incomeValSpan = document.getElementById('divIncomeVal');
        if (incomeSlider && incomeValSpan) {
            incomeSlider.addEventListener('input', function() {
                incomeValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const divSlider = document.getElementById('divAmount');
        const divValSpan = document.getElementById('divAmountVal');
        if (divSlider && divValSpan) {
            divSlider.addEventListener('input', function() {
                divValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        // Tax brackets (2024)
        const ordinaryBrackets = {
            single: [
                { upTo: 11600, rate: 0.10 },
                { upTo: 47150, rate: 0.12 },
                { upTo: 100525, rate: 0.22 },
                { upTo: 191950, rate: 0.24 },
                { upTo: 243725, rate: 0.32 },
                { upTo: 609350, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ],
            married: [
                { upTo: 23200, rate: 0.10 },
                { upTo: 94300, rate: 0.12 },
                { upTo: 201050, rate: 0.22 },
                { upTo: 383900, rate: 0.24 },
                { upTo: 487450, rate: 0.32 },
                { upTo: 731200, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ]
        };

        const ltcgBrackets = {
            single: [
                { upTo: 47025, rate: 0.00 },
                { upTo: 518900, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ],
            married: [
                { upTo: 94050, rate: 0.00 },
                { upTo: 583750, rate: 0.15 },
                { upTo: Infinity, rate: 0.20 }
            ]
        };

        function getMarginalRate(income, bracketsArray) {
            for (let bracket of bracketsArray) {
                if (income <= bracket.upTo) {
                    return bracket.rate;
                }
            }
            return bracketsArray[bracketsArray.length - 1].rate;
        }

        calcBtn.addEventListener('click', function() {
            const filingStatus = document.getElementById('divFilingStatus').value;
            const income = parseFloat(document.getElementById('divIncome').value);
            const dividend = parseFloat(document.getElementById('divAmount').value);

            if (isNaN(income) || isNaN(dividend) || dividend < 0) {
                document.getElementById('dividendResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Tax on ordinary dividends
            const ordinaryRate = getMarginalRate(income, ordinaryBrackets[filingStatus]);
            const ordinaryTax = dividend * ordinaryRate;

            // Tax on qualified dividends (long‑term rates)
            const qualifiedRate = getMarginalRate(income, ltcgBrackets[filingStatus]);
            const qualifiedTax = dividend * qualifiedRate;

            const savings = ordinaryTax - qualifiedTax;
            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('dividendResult');
            resultDiv.innerHTML = `
            <p><strong>Tax on $${dividend.toLocaleString()} of dividend income:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📉 Ordinary Dividends</h4>
                    <p style="font-size:1.8rem;">${formatMoney(ordinaryTax)}</p>
                    <p>Taxed at ordinary rate: ${(ordinaryRate * 100).toFixed(1)}%</p>
                </div>
                <div style="flex:1; background: #eef2f5; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📈 Qualified Dividends</h4>
                    <p style="font-size:1.8rem;">${formatMoney(qualifiedTax)}</p>
                    <p>Taxed at long‑term rate: ${(qualifiedRate * 100).toFixed(1)}%</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #d4edda; border-radius:12px;">
                <h4 style="color:#155724;">💰 Potential Savings: ${formatMoney(savings)}</h4>
                <p>If your dividends are qualified, you could save ${formatMoney(savings)} in federal taxes.</p>
            </div>
            <p class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
                <i class="fas fa-lightbulb"></i> This example assumes the dividend income does not push you into a higher tax bracket. Real‑world tax planning may involve managing brackets.
            </p>
        `;
        });
    }

    function initLossHarvestingTool() {
        const calcBtn = document.getElementById('calcLossHarvesting');
        if (!calcBtn) return;

        // Update displayed values
        const gainsSlider = document.getElementById('realizedGains');
        const gainsValSpan = document.getElementById('gainsVal');
        if (gainsSlider && gainsValSpan) {
            gainsSlider.addEventListener('input', function() {
                gainsValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const lossesSlider = document.getElementById('realizedLosses');
        const lossesValSpan = document.getElementById('lossesVal');
        if (lossesSlider && lossesValSpan) {
            lossesSlider.addEventListener('input', function() {
                lossesValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const taxRateSlider = document.getElementById('taxRateHarvest');
        const taxRateValSpan = document.getElementById('taxRateHarvestVal');
        if (taxRateSlider && taxRateValSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateValSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const gains = parseFloat(document.getElementById('realizedGains').value);
            const losses = parseFloat(document.getElementById('realizedLosses').value);
            const taxRate = parseFloat(document.getElementById('taxRateHarvest').value) / 100;

            if (isNaN(gains) || isNaN(losses)) {
                document.getElementById('harvestingResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            let netGain = gains - losses;
            let savings = 0;

            if (netGain > 0) {
                // Gains after offset
                savings = losses * taxRate;
            } else {
                // Losses exceed gains: offset all gains, then up to $3,000 of ordinary income
                const ordinaryOffset = Math.min(Math.abs(netGain), 3000);
                const ordinarySavings = ordinaryOffset * taxRate;
                const gainOffsetSavings = gains * taxRate;
                savings = gainOffsetSavings + ordinarySavings;
            }

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('harvestingResult');
            resultDiv.innerHTML = `
            <p><strong>Your tax‑loss harvesting summary:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📉 Realized Gains</h4>
                    <p style="font-size:1.5rem;">${formatMoney(gains)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📈 Realized Losses</h4>
                    <p style="font-size:1.5rem;">${formatMoney(losses)}</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #d4edda; border-radius:12px;">
                <h4 style="color:#155724;">💰 Estimated Tax Savings: ${formatMoney(savings)}</h4>
                <p>Based on your ${(taxRate*100).toFixed(0)}% marginal tax rate. Losses offset gains first; any excess can offset up to $3,000 of ordinary income.</p>
                <p>Unused losses can be carried forward to future years.</p>
            </div>
            <p class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
                <i class="fas fa-lightbulb"></i> This is a simplified estimate. Real savings depend on the order of gain types (short‑term vs. long‑term) and your specific tax situation.
            </p>
        `;
        });
    }

    function initWashSaleTool() {
        const checkBtn = document.getElementById('checkWashSale');
        if (!checkBtn) return;

        checkBtn.addEventListener('click', function() {
            const saleDateStr = document.getElementById('saleDate').value;
            const repurchaseDateStr = document.getElementById('repurchaseDate').value;

            if (!saleDateStr || !repurchaseDateStr) {
                document.getElementById('washSaleResult').innerHTML = '<span style="color:red;">Please select both dates.</span>';
                return;
            }

            const saleDate = new Date(saleDateStr);
            const repurchaseDate = new Date(repurchaseDateStr);

            // Calculate difference in days
            const diffDays = Math.round((repurchaseDate - saleDate) / (1000 * 60 * 60 * 24));

            // Wash sale if repurchase is within 30 days before OR after sale
            const isWashSale = Math.abs(diffDays) <= 30;

            const formatDate = (date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            const resultDiv = document.getElementById('washSaleResult');
            if (isWashSale) {
                resultDiv.innerHTML = `
                <div style="background: #f8d7da; padding:15px; border-radius:12px; color:#721c24;">
                    <h4 style="color:#721c24;">⚠️ Wash Sale Detected!</h4>
                    <p>You sold on <strong>${formatDate(saleDate)}</strong> and repurchased on <strong>${formatDate(repurchaseDate)}</strong>.</p>
                    <p>The repurchase occurred <strong>${Math.abs(diffDays)} days</strong> ${diffDays > 0 ? 'after' : 'before'} the sale.</p>
                    <p>Because the repurchase is within the 61‑day window (30 days before or after), the loss from the sale is <strong>disallowed</strong> for tax purposes this year. The disallowed loss is added to the cost basis of the new shares.</p>
                    <p><strong>To avoid this:</strong> Wait at least 31 days before repurchasing, or buy a different security that is not "substantially identical".</p>
                </div>
            `;
            } else {
                resultDiv.innerHTML = `
                <div style="background: #d4edda; padding:15px; border-radius:12px; color:#155724;">
                    <h4 style="color:#155724;">✅ No Wash Sale</h4>
                    <p>You sold on <strong>${formatDate(saleDate)}</strong> and repurchased on <strong>${formatDate(repurchaseDate)}</strong>.</p>
                    <p>The repurchase occurred <strong>${Math.abs(diffDays)} days</strong> ${diffDays > 0 ? 'after' : 'before'} the sale.</p>
                    <p>Because the repurchase is <strong>outside</strong> the 61‑day window, the loss is allowed. You can deduct it on your taxes (subject to other rules).</p>
                    <p><strong>Tip:</strong> Always track purchase dates carefully, especially around year‑end.</p>
                </div>
            `;
            }
        });
    }

    function initAssetLocationTool() {
        const calcBtn = document.getElementById('calcAssetLocation');
        if (!calcBtn) return;

        // Update displayed values
        const amountSlider = document.getElementById('amountLoc');
        const amountValSpan = document.getElementById('amountLocVal');
        if (amountSlider && amountValSpan) {
            amountSlider.addEventListener('input', function() {
                amountValSpan.textContent = parseInt(this.value).toLocaleString();
            });
        }

        const taxRateSlider = document.getElementById('taxRateLoc');
        const taxRateValSpan = document.getElementById('taxRateLocVal');
        if (taxRateSlider && taxRateValSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateValSpan.textContent = this.value;
            });
        }

        // Asset characteristics (simplified annual tax cost as percentage of investment)
        const assetData = {
            bonds: { yield: 0.05, isTaxExempt: false, isOrdinaryIncome: true }, // 5% yield, taxable as ordinary
            highDividend: { yield: 0.04, isTaxExempt: false, isQualified: true }, // 4% yield, qualified dividends
            growth: { yield: 0.01, isTaxExempt: false, isQualified: true }, // 1% yield, mostly qualified
            reit: { yield: 0.06, isTaxExempt: false, isOrdinaryIncome: true }, // 6% yield, ordinary (REIT dividends)
            muni: { yield: 0.03, isTaxExempt: true, isOrdinaryIncome: false } // 3% yield, tax‑exempt
        };

        calcBtn.addEventListener('click', function() {
            const asset = document.getElementById('assetType').value;
            const account = document.getElementById('accountTypeLoc').value;
            const amount = parseFloat(document.getElementById('amountLoc').value);
            const taxRate = parseFloat(document.getElementById('taxRateLoc').value) / 100;

            if (isNaN(amount) || amount <= 0) {
                document.getElementById('assetLocationResult').innerHTML = '<span style="color:red;">Please enter a valid amount.</span>';
                return;
            }

            const data = assetData[asset];
            const annualIncome = amount * data.yield;
            let taxCost = 0;

            // Calculate tax based on account type and asset type
            if (account === 'taxable') {
                if (data.isTaxExempt) {
                    taxCost = 0; // municipal bonds are tax‑exempt
                } else if (data.isQualified) {
                    // Qualified dividends taxed at long‑term capital gains rate (simplified: use 15% for average)
                    taxCost = annualIncome * 0.15;
                } else if (data.isOrdinaryIncome) {
                    taxCost = annualIncome * taxRate;
                }
            } else if (account === 'taxDeferred') {
                // Tax‑deferred: no current tax, but future withdrawals taxed as ordinary income
                // We'll show the deferred tax as a potential future cost
                taxCost = annualIncome * taxRate; // deferred, but shown for comparison
            } else if (account === 'roth') {
                // Roth: no tax ever
                taxCost = 0;
            }

            const afterTaxIncome = annualIncome - taxCost;
            const taxDragPercent = (taxCost / amount) * 100;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('assetLocationResult');
            resultDiv.innerHTML = `
            <p><strong>Annual Tax Impact for ${data.isTaxExempt ? 'Municipal Bonds' : assetData[asset].yield * 100 + '% yielding ' + asset.replace(/([A-Z])/g, ' $1').trim()}</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">💰 Annual Income</h4>
                    <p style="font-size:1.5rem;">${formatMoney(annualIncome)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📉 Tax Cost (Current Year)</h4>
                    <p style="font-size:1.5rem;">${formatMoney(taxCost)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">✅ After‑Tax Income</h4>
                    <p style="font-size:1.5rem;">${formatMoney(afterTaxIncome)}</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #eef2f5; border-radius:12px;">
                <p><strong>Tax Drag:</strong> ${taxDragPercent.toFixed(2)}% of your investment is lost to taxes each year.</p>
                <p>${account === 'taxable' ? 'This asset is currently in a taxable account.' : ''}
                ${account === 'taxDeferred' ? 'In a tax‑deferred account, you avoid current taxes, but withdrawals will be taxed as ordinary income in retirement.' : ''}
                ${account === 'roth' ? 'In a Roth account, you pay no taxes on this income or growth – ideal for high‑growth assets.' : ''}</p>
            </div>
            <div class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
                <i class="fas fa-lightbulb"></i> Based on your inputs, the optimal placement would be:
                <strong>${account === 'taxable' && data.isTaxExempt ? 'This asset is already tax‑efficient in a taxable account.' :
                (account === 'taxable' && (data.isOrdinaryIncome || !data.isQualified) ? 'Consider moving this asset to a tax‑deferred or Roth account to avoid current taxes.' :
                    (account === 'taxDeferred' && data.isQualified ? 'Qualified dividends lose their preferential rate in tax‑deferred accounts; consider holding them in taxable instead.' :
                        (account === 'roth' ? 'This is an excellent location for growth assets.' : 'Review your overall strategy.')))}
                </strong>
            </div>
        `;
        });
    }

    function initRebalancingTaxTool() {
        const calcBtn = document.getElementById('calcRebalancingTax');
        if (!calcBtn) return;

        // Update rate displays
        const shortRateSlider = document.getElementById('shortTermRate');
        const shortRateSpan = document.getElementById('shortRateVal');
        if (shortRateSlider && shortRateSpan) {
            shortRateSlider.addEventListener('input', function() {
                shortRateSpan.textContent = this.value;
            });
        }

        const longRateSlider = document.getElementById('longTermRate');
        const longRateSpan = document.getElementById('longRateVal');
        if (longRateSlider && longRateSpan) {
            longRateSlider.addEventListener('input', function() {
                longRateSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            // Get portfolio values
            const aVal = parseFloat(document.getElementById('assetAVal').value);
            const aBasis = parseFloat(document.getElementById('assetABasis').value);
            const aTarget = parseFloat(document.getElementById('assetATarget').value);

            const bVal = parseFloat(document.getElementById('assetBVal').value);
            const bBasis = parseFloat(document.getElementById('assetBBasis').value);
            const bTarget = parseFloat(document.getElementById('assetBTarget').value);

            const shortRate = parseFloat(document.getElementById('shortTermRate').value) / 100;
            const longRate = parseFloat(document.getElementById('longTermRate').value) / 100;

            if (isNaN(aVal) || isNaN(aBasis) || isNaN(aTarget) || isNaN(bVal) || isNaN(bBasis) || isNaN(bTarget)) {
                document.getElementById('rebalancingResult').innerHTML = '<span style="color:red;">Please fill in all fields.</span>';
                return;
            }

            const total = aVal + bVal;
            const aCurrentPct = (aVal / total) * 100;
            const bCurrentPct = (bVal / total) * 100;

            // Determine needed adjustments to reach targets
            const targetTotalPct = aTarget + bTarget;
            if (Math.abs(targetTotalPct - 100) > 0.01) {
                document.getElementById('rebalancingResult').innerHTML = '<span style="color:red;">Target percentages must add up to 100%.</span>';
                return;
            }

            const targetAVal = (aTarget / 100) * total;
            const targetBVal = (bTarget / 100) * total;

            let sellA = 0, sellB = 0;
            if (aVal > targetAVal) sellA = aVal - targetAVal;
            if (bVal > targetBVal) sellB = bVal - targetBVal;

            // For simplicity, assume we sell the overweight asset(s) and use proceeds to buy the underweight.
            // Tax calculation: only assets sold generate gains.
            let totalGain = 0;
            let totalTax = 0;

            // Function to compute gain and tax for a given asset
            function computeTax(valueSold, costBasis, totalValue, shortRate, longRate) {
                if (valueSold <= 0) return { gain: 0, tax: 0 };
                // Pro‑rata cost basis: assume the shares sold have the same average cost basis as the whole position
                const gainPerDollar = (totalValue - costBasis) / totalValue;
                const gain = valueSold * gainPerDollar;
                // For simplicity, assume all gains are long‑term (you can modify for more realism)
                const tax = gain * longRate;
                return { gain, tax };
            }

            if (sellA > 0) {
                const { gain, tax } = computeTax(sellA, aBasis, aVal, shortRate, longRate);
                totalGain += gain;
                totalTax += tax;
            }
            if (sellB > 0) {
                const { gain, tax } = computeTax(sellB, bBasis, bVal, shortRate, longRate);
                totalGain += gain;
                totalTax += tax;
            }

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('rebalancingResult');
            resultDiv.innerHTML = `
            <p><strong>Rebalancing Summary</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📊 Current Allocation</h4>
                    <p>Asset A: ${aCurrentPct.toFixed(1)}%<br>Asset B: ${bCurrentPct.toFixed(1)}%</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">🎯 Target Allocation</h4>
                    <p>Asset A: ${aTarget}%<br>Asset B: ${bTarget}%</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">💰 Actions Needed</h4>
                    <p>${sellA > 0 ? `Sell ${formatMoney(sellA)} of Asset A` : ''}${sellB > 0 ? `Sell ${formatMoney(sellB)} of Asset B` : ''}</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #eef2f5; border-radius:12px;">
                <p><strong>Tax Impact:</strong> Total realized gain: ${formatMoney(totalGain)}<br>
                Estimated tax liability: ${formatMoney(totalTax)}</p>
                <p>💡 <strong>Tax‑Saving Tip:</strong> To avoid this tax, consider rebalancing inside a tax‑advantaged account or directing new contributions to the underweight asset instead of selling.</p>
            </div>
        `;
        });
    }

    function initHarvestWorkflow() {
        const simulateBtn = document.getElementById('simulateHarvest');
        if (!simulateBtn) return;

        simulateBtn.addEventListener('click', function() {
            const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
            const currentPrice = parseFloat(document.getElementById('currentPrice').value);
            const shares = parseInt(document.getElementById('shares').value);
            const replacement = document.getElementById('replacementStrategy').value;
            const saleDate = document.getElementById('saleDateWorkflow').value;
            const repurchaseDate = document.getElementById('repurchaseDateWorkflow').value;

            if (isNaN(purchasePrice) || isNaN(currentPrice) || isNaN(shares) || !saleDate) {
                document.getElementById('harvestWorkflowResult').innerHTML = '<span style="color:red;">Please fill in all required fields.</span>';
                return;
            }

            const totalLoss = (purchasePrice - currentPrice) * shares;
            const lossPerShare = purchasePrice - currentPrice;

            // Wash sale check
            let washSale = false;
            if (repurchaseDate) {
                const sale = new Date(saleDate);
                const repurchase = new Date(repurchaseDate);
                const diffDays = Math.round((repurchase - sale) / (1000 * 60 * 60 * 24));
                if (Math.abs(diffDays) <= 30) {
                    washSale = true;
                }
            }

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            let resultHtml = `
            <p><strong>Harvesting Summary</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">📉 Loss per share</h4>
                    <p style="font-size:1.5rem;">${formatMoney(lossPerShare)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4 style="color:var(--tax-smart-color);">💰 Total realized loss</h4>
                    <p style="font-size:1.5rem;">${formatMoney(totalLoss)}</p>
                </div>
            </div>
        `;

            if (totalLoss <= 0) {
                resultHtml += `<div style="background: #f8d7da; padding:15px; border-radius:12px; color:#721c24;">
                ⚠️ You don't have a loss! Tax‑loss harvesting only works when the current price is below your purchase price.
            </div>`;
            } else if (washSale) {
                resultHtml += `<div style="background: #f8d7da; padding:15px; border-radius:12px; color:#721c24;">
                <strong>⚠️ Wash Sale Detected!</strong> You repurchased the same security within 30 days. The loss is disallowed for tax purposes this year.
                To fix this, wait at least 31 days before buying back, or choose a different replacement.
            </div>`;
            } else {
                // Valid harvest
                resultHtml += `<div style="background: #d4edda; padding:15px; border-radius:12px; color:#155724;">
                <strong>✅ Valid Tax‑Loss Harvest</strong><br>
                You can use this ${formatMoney(totalLoss)} loss to offset capital gains or up to $3,000 of ordinary income this year.
            </div>`;

                if (replacement === 'similar') {
                    resultHtml += `<div style="margin-top:15px; background: #eef2f5; padding:15px; border-radius:12px;">
                    <strong>💡 Replacement Recommendation:</strong> You chose to buy a similar but not identical ETF.
                    Good choice – this maintains market exposure while avoiding a wash sale.
                </div>`;
                } else if (replacement === 'wait') {
                    resultHtml += `<div style="margin-top:15px; background: #fff3cd; padding:15px; border-radius:12px;">
                    <strong>⚠️ Caution:</strong> Waiting 31 days means you'll be out of the market during that period.
                    Consider a similar but not identical alternative to stay invested.
                </div>`;
                } else if (replacement === 'different') {
                    resultHtml += `<div style="margin-top:15px; background: #eef2f5; padding:15px; border-radius:12px;">
                    <strong>💡 Replacement Recommendation:</strong> Buying a different stock in the same sector keeps you invested,
                    but ensure it's not "substantially identical" to avoid a wash sale.
                </div>`;
                }
            }

            resultHtml += `<div style="margin-top:15px; font-size:0.9rem; color:#666;">
            <i class="fas fa-file-invoice"></i> Remember to document the sale and keep records. Your broker will report the loss on Form 1099‑B.
        </div>`;

            document.getElementById('harvestWorkflowResult').innerHTML = resultHtml;
        });
    }

    function initContributionPrioritizer() {
        const calcBtn = document.getElementById('calcPriority');
        if (!calcBtn) return;

        // Update displayed tax rate
        const taxRateSlider = document.getElementById('taxRatePrioritizer');
        const taxRateSpan = document.getElementById('taxRatePrioritizerVal');
        if (taxRateSlider && taxRateSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const matchPercent = parseFloat(document.getElementById('matchPercent').value);
            const matchLimit = parseFloat(document.getElementById('matchLimit').value);
            const taxRate = parseFloat(document.getElementById('taxRatePrioritizer').value) / 100;
            const futureTax = document.getElementById('futureTaxOutlook').value;
            const hasHdhp = document.getElementById('hasHdhp').value;

            if (isNaN(matchPercent) || isNaN(matchLimit)) {
                document.getElementById('priorityResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Build prioritized list
            let order = [];
            let explanations = [];

            // 1. Employer match (free money)
            if (matchPercent > 0 && matchLimit > 0) {
                order.push("1. Contribute enough to 401(k) to get the full employer match");
                explanations.push("This is free money – always take it. The immediate return is 100% (or more) instantly.");
            }

            // 2. HSA if available
            if (hasHdhp === 'yes') {
                order.push("2. Max out your Health Savings Account (HSA)");
                explanations.push("HSA offers triple tax advantage: deductible contributions, tax‑free growth, and tax‑free withdrawals for medical expenses. It's the most tax‑efficient account available.");
            }

            // 3. Roth IRA if future tax rate is higher or same
            if (futureTax === 'higher') {
                order.push("3. Max out Roth IRA");
                explanations.push("You expect higher taxes in retirement, so Roth's tax‑free withdrawals are especially valuable.");
            } else if (futureTax === 'same') {
                order.push("3. Consider Roth IRA (or Traditional IRA based on your situation)");
                explanations.push("With similar tax rates, Roth gives flexibility and tax‑free growth. Traditional offers a deduction now – compare which fits your goals.");
            } else {
                order.push("3. Consider Traditional IRA (or Roth if you prefer)");
                explanations.push("Lower expected future taxes make Traditional's up‑front deduction attractive.");
            }

            // 4. Additional 401(k) contributions
            order.push("4. Increase 401(k) contributions beyond the match");
            explanations.push("Tax‑deferred growth and higher contribution limits ($23,000 for 2024) make this a great next step.");

            // 5. Taxable brokerage
            order.push("5. Taxable brokerage account");
            explanations.push("After maxing tax‑advantaged options, use a taxable account for additional savings.");

            const resultDiv = document.getElementById('priorityResult');
            let html = '<p><strong>Your Personalized Contribution Priority Order:</strong></p><ol style="margin: 15px 0;">';
            for (let i = 0; i < order.length; i++) {
                html += `<li style="margin-bottom: 10px;"><strong>${order[i]}</strong><br><span style="color: #666; font-size: 0.9rem;">${explanations[i]}</span></li>`;
            }
            html += `</ol><div class="pro-tip" style="margin-top:15px; font-size:0.9rem;">
            <i class="fas fa-lightbulb"></i> This order assumes you have an emergency fund and no high‑interest debt. Always pay off credit cards and high‑rate loans before investing.
        </div>`;
            resultDiv.innerHTML = html;
        });
    }

    function initYearEndChecklist() {
        const checkboxes = document.querySelectorAll('.checklist-input');
        const amountFields = document.querySelectorAll('.checklist-amount');
        const taxRateSlider = document.getElementById('taxRateChecklist');
        const taxRateSpan = document.getElementById('taxRateChecklistVal');
        const totalSavingsSpan = document.getElementById('totalSavings');

        // Helper to update savings for a single item
        function updateItemSavings(item) {
            const checkbox = item.querySelector('.checklist-input');
            const amountInput = item.querySelector('.checklist-amount');
            const savingsSpan = item.querySelector('.checklist-savings');
            const taxRate = parseFloat(taxRateSlider.value) / 100;

            if (checkbox.checked && amountInput && savingsSpan) {
                const amount = parseFloat(amountInput.value) || 0;
                let savings = 0;
                const itemType = item.dataset.item;

                // Different tax treatments for different items
                if (itemType === 'losses') {
                    // Losses offset ordinary income up to $3,000
                    savings = Math.min(amount, 3000) * taxRate;
                } else if (itemType === 'retirement' || itemType === 'hsa' || itemType === 'charity' || itemType === 'bunch') {
                    // These reduce taxable income
                    savings = amount * taxRate;
                } else if (itemType === 'roth') {
                    // Roth conversion increases current tax; we show it as a cost, not savings
                    savings = -amount * taxRate;
                    savingsSpan.style.color = '#dc3545';
                }

                savingsSpan.textContent = `$${savings.toFixed(2)}`;
                if (itemType === 'roth') {
                    savingsSpan.style.color = '#dc3545';
                    savingsSpan.title = 'This increases your tax bill now but may save taxes later.';
                } else {
                    savingsSpan.style.color = 'var(--tax-smart-color)';
                }
                return savings;
            } else {
                if (savingsSpan) savingsSpan.textContent = '$0';
                return 0;
            }
        }

        // Function to update total savings
        function updateTotalSavings() {
            let total = 0;
            document.querySelectorAll('.checklist-item').forEach(item => {
                const checkbox = item.querySelector('.checklist-input');
                if (checkbox.checked) {
                    const savings = updateItemSavings(item);
                    if (!isNaN(savings)) total += savings;
                } else {
                    // Reset savings display to $0
                    const savingsSpan = item.querySelector('.checklist-savings');
                    if (savingsSpan) savingsSpan.textContent = '$0';
                }
            });
            totalSavingsSpan.textContent = `$${total.toFixed(2)}`;
        }

        // Enable/disable amount fields based on checkbox state
        function toggleAmountField(checkbox, amountField) {
            if (checkbox.checked) {
                amountField.disabled = false;
                amountField.style.opacity = '1';
            } else {
                amountField.disabled = true;
                amountField.style.opacity = '0.6';
            }
            updateTotalSavings();
        }

        // Event listeners for checkboxes
        checkboxes.forEach(checkbox => {
            const item = checkbox.closest('.checklist-item');
            const amountField = item.querySelector('.checklist-amount');
            if (amountField) {
                // Initial state
                toggleAmountField(checkbox, amountField);
                checkbox.addEventListener('change', () => toggleAmountField(checkbox, amountField));
                amountField.addEventListener('input', () => updateTotalSavings());
            } else {
                checkbox.addEventListener('change', () => updateTotalSavings());
            }
        });

        // Tax rate slider
        if (taxRateSlider && taxRateSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateSpan.textContent = this.value;
                updateTotalSavings();
            });
        }

        // Initial update
        updateTotalSavings();
    }

    function initTaxDecisionTool() {
        const recommendBtn = document.getElementById('getRecommendation');
        if (!recommendBtn) return;

        recommendBtn.addEventListener('click', function() {
            const incomeSource = document.getElementById('incomeSource').value;
            const homeOwner = document.getElementById('homeOwner').value;
            const hasRental = document.getElementById('hasRental').checked;
            const hasCrypto = document.getElementById('hasCrypto').checked;
            const hasOptions = document.getElementById('hasOptions').checked;
            const hasForeign = document.getElementById('hasForeign').checked;
            const hasKiddie = document.getElementById('hasKiddie').checked;
            const comfortLevel = document.getElementById('comfortLevel').value;
            const lifeChanges = document.getElementById('lifeChanges').value;

            let complexityScore = 0;
            let reasons = [];

            // Income source complexity
            if (incomeSource === 'selfEmployed') {
                complexityScore += 2;
                reasons.push('Self‑employment income requires Schedule C and estimated tax calculations.');
            } else if (incomeSource === 'business') {
                complexityScore += 3;
                reasons.push('Business ownership (especially with entity structure) significantly increases complexity.');
            } else if (incomeSource === 'multipleW2') {
                complexityScore += 1;
                reasons.push('Multiple W‑2 jobs can complicate withholding and state returns.');
            } else if (incomeSource === 'investments') {
                complexityScore += 2;
                reasons.push('Investment income may involve capital gains, dividends, and complex forms.');
            }

            // Home ownership
            if (homeOwner === 'mortgage') {
                complexityScore += 1;
                reasons.push('Mortgage interest deduction may require itemizing.');
            }

            // Special items
            if (hasRental) {
                complexityScore += 2;
                reasons.push('Rental property requires depreciation, expense tracking, and possibly passive activity rules.');
            }
            if (hasCrypto) {
                complexityScore += 2;
                reasons.push('Cryptocurrency transactions require detailed tracking and may involve capital gains.');
            }
            if (hasOptions) {
                complexityScore += 2;
                reasons.push('Stock options or RSUs have complex tax treatment.');
            }
            if (hasForeign) {
                complexityScore += 2;
                reasons.push('Foreign accounts/income require FBAR and Form 8938 filings.');
            }
            if (hasKiddie) {
                complexityScore += 1;
                reasons.push('Kiddie tax rules for dependents add complexity.');
            }

            // Life changes
            if (lifeChanges === 'yes') {
                complexityScore += 1;
                reasons.push('Major life changes may affect filing status and deductions.');
            }

            // Comfort level
            let comfortAdjustment = 0;
            if (comfortLevel === 'low') comfortAdjustment = 2;
            else if (comfortLevel === 'medium') comfortAdjustment = 1;
            else comfortAdjustment = 0;

            const finalScore = complexityScore + comfortAdjustment;

            let recommendation = '';
            let explanation = '';

            if (finalScore <= 2) {
                recommendation = '✅ Tax Software is Likely Enough';
                explanation = 'Your tax situation appears relatively simple. Tax software should handle your return efficiently and cost‑effectively.';
            } else if (finalScore <= 5) {
                recommendation = '🤔 Consider Hybrid Approach or Professional Review';
                explanation = 'Your situation has moderate complexity. You could use tax software with a review option, or consult a professional for one‑time advice.';
            } else {
                recommendation = '👔 Hire a Tax Professional (CPA or EA)';
                explanation = 'Your tax situation is complex. A professional can help maximize deductions, avoid costly errors, and provide peace of mind.';
            }

            const resultDiv = document.getElementById('recommendationResult');
            resultDiv.innerHTML = `
            <div style="background: ${finalScore <= 2 ? '#d4edda' : (finalScore <= 5 ? '#fff3cd' : '#f8d7da')}; padding:15px; border-radius:12px;">
                <h4 style="margin-bottom: 10px; color:${finalScore <= 2 ? '#155724' : (finalScore <= 5 ? '#856404' : '#721c24')};">${recommendation}</h4>
                <p>${explanation}</p>
                ${reasons.length > 0 ? `<p><strong>Factors considered:</strong> ${reasons.join(' ')}</p>` : ''}
                <p style="margin-top:10px;"><strong>Score:</strong> ${finalScore}/10 (higher = more complex)</p>
                <p class="pro-tip" style="margin-top:10px;"><i class="fas fa-info-circle"></i> This is a general guideline. For a definitive answer, schedule a consultation.</p>
            </div>
        `;
        });
    }

    function initRetirementWithdrawalTool() {
        const calcBtn = document.getElementById('optimizeWithdrawals');
        if (!calcBtn) return;

        const taxRateSlider = document.getElementById('taxRateWithdrawal');
        const taxRateSpan = document.getElementById('taxRateWithdrawalVal');
        const ltcgRateSlider = document.getElementById('ltcgRateWithdrawal');
        const ltcgRateSpan = document.getElementById('ltcgRateVal');

        if (taxRateSlider && taxRateSpan) {
            taxRateSlider.addEventListener('input', function() {
                taxRateSpan.textContent = this.value;
            });
        }
        if (ltcgRateSlider && ltcgRateSpan) {
            ltcgRateSlider.addEventListener('input', function() {
                ltcgRateSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const taxable = parseFloat(document.getElementById('taxableBalance').value) || 0;
            const deferred = parseFloat(document.getElementById('deferredBalance').value) || 0;
            const roth = parseFloat(document.getElementById('rothBalance').value) || 0;
            const spending = parseFloat(document.getElementById('annualSpending').value) || 0;
            const ordinaryRate = parseFloat(document.getElementById('taxRateWithdrawal').value) / 100;
            const ltcgRate = parseFloat(document.getElementById('ltcgRateWithdrawal').value) / 100;

            if (spending <= 0) {
                document.getElementById('withdrawalResult').innerHTML = '<span style="color:red;">Please enter a positive annual spending amount.</span>';
                return;
            }

            // Simple optimization: use taxable first (assuming we only pay capital gains on the gain portion)
            // For simplicity, we assume taxable account has 50% gains (adjustable in real life)
            const taxableGainRatio = 0.5; // assumption: half the taxable balance is gains
            let remaining = spending;
            let tax = 0;
            let fromTaxable = 0, fromDeferred = 0, fromRoth = 0;

            // Step 1: Use taxable account (only gains are taxed)
            if (taxable > 0 && remaining > 0) {
                const taxableUse = Math.min(taxable, remaining);
                fromTaxable = taxableUse;
                remaining -= taxableUse;
                // Tax on gains portion of taxable withdrawal
                const gains = taxableUse * taxableGainRatio;
                tax += gains * ltcgRate;
            }

            // Step 2: Use tax-deferred (all is ordinary income)
            if (deferred > 0 && remaining > 0) {
                const deferredUse = Math.min(deferred, remaining);
                fromDeferred = deferredUse;
                remaining -= deferredUse;
                tax += deferredUse * ordinaryRate;
            }

            // Step 3: Use Roth (tax-free)
            if (roth > 0 && remaining > 0) {
                fromRoth = Math.min(roth, remaining);
                remaining -= fromRoth;
            }

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('withdrawalResult');
            if (remaining > 0) {
                resultDiv.innerHTML = `
                <div style="background: #f8d7da; padding:15px; border-radius:12px; color:#721c24;">
                    <strong>⚠️ Insufficient Funds</strong><br>
                    Your total balance (${formatMoney(taxable + deferred + roth)}) is less than your desired spending (${formatMoney(spending)}).<br>
                    Please reduce spending or consider other sources.
                </div>
            `;
            } else {
                resultDiv.innerHTML = `
                <p><strong>Optimal Withdrawal Order (Taxable → Tax‑Deferred → Roth)</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0;">
                    <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                        <h4>📉 Taxable Account</h4>
                        <p style="font-size:1.5rem;">${formatMoney(fromTaxable)}</p>
                        <small>Tax on gains: ${formatMoney(fromTaxable * taxableGainRatio * ltcgRate)}</small>
                    </div>
                    <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                        <h4>🏦 Tax‑Deferred</h4>
                        <p style="font-size:1.5rem;">${formatMoney(fromDeferred)}</p>
                        <small>Tax at ${(ordinaryRate*100).toFixed(0)}%: ${formatMoney(fromDeferred * ordinaryRate)}</small>
                    </div>
                    <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                        <h4>💰 Roth (Tax‑Free)</h4>
                        <p style="font-size:1.5rem;">${formatMoney(fromRoth)}</p>
                        <small>No tax</small>
                    </div>
                </div>
                <div style="margin-top:15px; padding:15px; background: #eef2f5; border-radius:12px;">
                    <p><strong>Total Estimated Tax:</strong> ${formatMoney(tax)}</p>
                    <p><strong>After‑Tax Spending:</strong> ${formatMoney(spending - tax)}</p>
                    <p><strong>Remaining Balances:</strong><br>
                    Taxable: ${formatMoney(taxable - fromTaxable)}<br>
                    Tax‑Deferred: ${formatMoney(deferred - fromDeferred)}<br>
                    Roth: ${formatMoney(roth - fromRoth)}</p>
                    <p class="pro-tip" style="margin-top:10px;"><i class="fas fa-lightbulb"></i> This strategy minimizes taxes by using taxable first (only gains are taxed), then tax‑deferred (ordinary income), and Roth last (tax‑free). In reality, consider RMDs and Social Security interactions.</p>
                </div>
            `;
            }
        });
    }

    function initSideHustleTool() {
        const calcBtn = document.getElementById('calcSideHustleTax');
        if (!calcBtn) return;

        const marginalSlider = document.getElementById('marginalRateSide');
        const marginalSpan = document.getElementById('marginalRateSideVal');
        if (marginalSlider && marginalSpan) {
            marginalSlider.addEventListener('input', function() {
                marginalSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const gross = parseFloat(document.getElementById('grossIncome').value) || 0;
            const expenses = parseFloat(document.getElementById('expenses').value) || 0;
            const marginalRate = parseFloat(document.getElementById('marginalRateSide').value) / 100;
            const retirementPlan = document.getElementById('retirementPlan').value;
            let customContribution = parseFloat(document.getElementById('customContribution').value) || 0;

            if (gross <= 0) {
                document.getElementById('sideHustleResult').innerHTML = '<span style="color:red;">Please enter a positive gross income.</span>';
                return;
            }

            // Net profit before retirement
            let netProfit = gross - expenses;
            if (netProfit < 0) netProfit = 0;

            // Determine max contribution based on plan
            let maxContribution = 0;
            if (retirementPlan === 'sep') {
                maxContribution = netProfit * 0.25; // SEP IRA up to 25% of net earnings
            } else if (retirementPlan === 'solo401k') {
                // Simplified: $23,000 employee + 25% of net profit as employer, max $66,000
                const employeeLimit = 23000;
                const employerContribution = netProfit * 0.25;
                maxContribution = Math.min(employeeLimit + employerContribution, 66000);
            }
            if (customContribution > maxContribution) customContribution = maxContribution;

            // Net profit after retirement contribution
            const netAfterRetirement = netProfit - customContribution;
            if (netAfterRetirement < 0) {
                document.getElementById('sideHustleResult').innerHTML = '<span style="color:red;">Retirement contribution exceeds net profit. Please adjust.</span>';
                return;
            }

            // Self-employment tax (15.3% on 92.35% of net profit after retirement)
            const seTaxable = netAfterRetirement * 0.9235;
            const seTax = seTaxable * 0.153;
            // Deduct half of SE tax from income for income tax
            const incomeTaxable = netAfterRetirement - (seTax / 2);
            const incomeTax = incomeTaxable > 0 ? incomeTaxable * marginalRate : 0;
            const totalTax = seTax + incomeTax;

            const afterTaxIncome = netAfterRetirement - totalTax;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('sideHustleResult');
            resultDiv.innerHTML = `
            <p><strong>Side Hustle Tax Summary</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>💰 Gross Income</h4>
                    <p>${formatMoney(gross)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>📉 Deductible Expenses</h4>
                    <p>${formatMoney(expenses)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>📈 Net Profit</h4>
                    <p>${formatMoney(netProfit)}</p>
                </div>
            </div>
            <div style="margin-bottom:15px; background: #eef2f5; padding:15px; border-radius:12px;">
                <h4>📊 Tax Breakdown</h4>
                <p>Self‑Employment Tax: ${formatMoney(seTax)}<br>
                Income Tax (${(marginalRate*100).toFixed(0)}% bracket): ${formatMoney(incomeTax)}<br>
                <strong>Total Tax: ${formatMoney(totalTax)}</strong></p>
                <p>After‑Tax Side Hustle Income: ${formatMoney(afterTaxIncome)}</p>
            </div>
            ${customContribution > 0 ? `<div class="pro-tip" style="margin-top:10px;">
                <i class="fas fa-piggy-bank"></i> You contributed ${formatMoney(customContribution)} to a ${retirementPlan === 'sep' ? 'SEP IRA' : 'Solo 401(k)'}, saving ${formatMoney(customContribution * marginalRate)} in income tax today.
            </div>` : ''}
            <p class="pro-tip" style="margin-top:10px;"><i class="fas fa-lightbulb"></i> Remember to track all expenses, consider home office deduction, and consult a professional for accurate filing.</p>
        `;
        });
    }

    function initStepUpBasisTool() {
        const calcBtn = document.getElementById('calcStepUpBasis');
        if (!calcBtn) return;

        const ltcgSlider = document.getElementById('ltcgRateEstate');
        const ltcgSpan = document.getElementById('ltcgRateEstateVal');
        if (ltcgSlider && ltcgSpan) {
            ltcgSlider.addEventListener('input', function() {
                ltcgSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function() {
            const cost = parseFloat(document.getElementById('originalCost').value) || 0;
            const value = parseFloat(document.getElementById('currentValue').value) || 0;
            const ltcgRate = parseFloat(document.getElementById('ltcgRateEstate').value) / 100;

            if (value <= cost) {
                document.getElementById('stepUpResult').innerHTML = '<span style="color:red;">The asset has not appreciated. No capital gains tax would be due.</span>';
                return;
            }

            const appreciation = value - cost;
            const taxIfSold = appreciation * ltcgRate;

            // After step‑up, basis becomes current value, so no tax on appreciation
            const taxIfInherited = 0;
            const taxSaved = taxIfSold - taxIfInherited;

            const formatMoney = (num) => '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

            const resultDiv = document.getElementById('stepUpResult');
            resultDiv.innerHTML = `
            <div style="background: #d4edda; padding:15px; border-radius:12px;">
                <h4 style="color:#155724;">💰 Tax Savings with Step‑Up in Basis</h4>
                <p><strong>Appreciation:</strong> ${formatMoney(appreciation)}</p>
                <p><strong>Tax if sold before death:</strong> ${formatMoney(taxIfSold)} (${(ltcgRate*100).toFixed(0)}% rate)</p>
                <p><strong>Tax if inherited (step‑up):</strong> ${formatMoney(taxIfInherited)}</p>
                <p><strong>Tax savings for heirs:</strong> ${formatMoney(taxSaved)}</p>
                <p class="pro-tip" style="margin-top:10px;"><i class="fas fa-lightbulb"></i> The step‑up in basis eliminates capital gains tax on all appreciation that occurred during the original owner's lifetime. This is one of the most valuable tax benefits in estate planning.</p>
            </div>
        `;
        });
    }

    function initTaxManagedTool() {
        const calcBtn = document.getElementById('compareTaxManaged');
        if (!calcBtn) return;

        const federalSlider = document.getElementById('taxRateMuni');
        const federalSpan = document.getElementById('taxRateMuniVal');
        const stateSlider = document.getElementById('stateTaxRate');
        const stateSpan = document.getElementById('stateTaxRateVal');

        if (federalSlider && federalSpan) {
            federalSlider.addEventListener('input', () => {
                federalSpan.textContent = federalSlider.value;
            });
        }
        if (stateSlider && stateSpan) {
            stateSlider.addEventListener('input', () => {
                stateSpan.textContent = stateSlider.value;
            });
        }

        calcBtn.addEventListener('click', () => {
            const fedRate = parseFloat(document.getElementById('taxRateMuni').value) / 100;
            const stateRate = parseFloat(document.getElementById('stateTaxRate').value) / 100;
            const taxableYield = parseFloat(document.getElementById('taxableYield').value) / 100;
            const muniYield = parseFloat(document.getElementById('muniYield').value) / 100;
            const managedReturn = parseFloat(document.getElementById('managedReturn').value) / 100;
            const taxDrag = parseFloat(document.getElementById('taxDrag').value) / 100;

            // After‑tax yields
            const taxableAfterTax = taxableYield * (1 - fedRate);
            const muniAfterTax = muniYield * (1 - stateRate); // assumes muni exempt from federal, but state may still tax if not in-state
            const managedAfterTax = managedReturn * (1 - taxDrag); // tax drag is the effective tax on returns

            const taxEquivYield = muniYield / (1 - fedRate);

            const formatPercent = (num) => (num * 100).toFixed(2) + '%';
            const formatMoney = (num) => (num * 100).toFixed(2) + '%';

            const resultDiv = document.getElementById('taxManagedResult');
            resultDiv.innerHTML = `
            <p><strong>After‑Tax Comparison (for a taxable account)</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0;">
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>📈 Taxable Bond Fund</h4>
                    <p>Yield: ${formatPercent(taxableYield)}<br>After‑tax: ${formatPercent(taxableAfterTax)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>🏛️ Municipal Bond Fund</h4>
                    <p>Yield: ${formatPercent(muniYield)}<br>After‑tax: ${formatPercent(muniAfterTax)}<br>Tax‑Equivalent Yield: ${formatPercent(taxEquivYield)}</p>
                </div>
                <div style="flex:1; background: #f0f0f0; padding:15px; border-radius:12px;">
                    <h4>📊 Tax‑Managed Stock Fund</h4>
                    <p>Expected Return: ${formatPercent(managedReturn)}<br>Tax Drag: ${formatPercent(taxDrag)}<br>After‑tax: ${formatPercent(managedAfterTax)}</p>
                </div>
            </div>
            <div style="margin-top:15px; padding:15px; background: #eef2f5; border-radius:12px;">
                ${taxableAfterTax > muniAfterTax ?
                '<p>💡 <strong>Taxable bonds offer higher after‑tax yield</strong> given your tax rates.</p>' :
                '<p>💡 <strong>Municipal bonds offer higher after‑tax yield</strong> given your tax rates – consider them for the bond portion of your taxable account.</p>'}
                ${managedAfterTax > (taxableAfterTax || muniAfterTax) ?
                '<p>📈 <strong>Tax‑managed stock funds may be worthwhile</strong> if their tax drag is lower than the tax on ordinary income.</p>' :
                '<p>⚠️ Tax‑managed stock funds may not outperform after taxes in this scenario; consider their potential for long‑term growth.</p>'}
                <p class="pro-tip" style="margin-top:10px;">These calculations are simplified. Real returns depend on investment choices, holding periods, and state‑specific rules for munis.</p>
            </div>
        `;
        });
    }

})();
