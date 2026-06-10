/* assets/js/stock.js */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            // User is logged in – initialize all interactive features
            initStockCalculator();
            initMarketCapExplorer();
            initGrowthCalculator();
            initDividendSimulator();
            initRiskQuestionnaire();
            initDiversificationSimulator();
            initVolatilitySimulator();
            initAssetAllocationSimulator();
            initBrokerageSelector();
            initOrderSimulator();
            initDCACalculator();
            initStockResearch();
            initFinancialAnalyzer();
            initValuationCalculator();
            initDividendProjector();
            initStrategyComparator();
        }
    });

    function initStockCalculator() {
        const calcBtn = document.getElementById('calculateStockProfit');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            // Get values
            const shares = parseFloat(document.getElementById('shares').value);
            const buyPrice = parseFloat(document.getElementById('buyPrice').value);
            const currentPrice = parseFloat(document.getElementById('currentPrice').value);

            // Validation
            if (isNaN(shares) || isNaN(buyPrice) || isNaN(currentPrice) || shares <= 0 || buyPrice <= 0 || currentPrice <= 0) {
                document.getElementById('stockResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const totalCost = shares * buyPrice;
            const currentValue = shares * currentPrice;
            const profit = currentValue - totalCost;
            const percentReturn = (profit / totalCost) * 100;

            const resultDiv = document.getElementById('stockResult');
            resultDiv.innerHTML = `
                <p><strong>Total Invested:</strong> $${totalCost.toFixed(2)}</p>
                <p><strong>Current Value:</strong> $${currentValue.toFixed(2)}</p>
                <p><strong>Profit/Loss:</strong> <span style="color:${profit >= 0 ? 'green' : 'red'};">$${profit.toFixed(2)}</span></p>
                <p><strong>Return:</strong> <span style="color:${profit >= 0 ? 'green' : 'red'};">${percentReturn.toFixed(2)}%</span></p>
            `;
        });
    }

    function initMarketCapExplorer() {
        const calcBtn = document.getElementById('calcMarketCap');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const price = parseFloat(document.getElementById('mcPrice').value);
            const sharesMillions = parseFloat(document.getElementById('mcShares').value);

            if (isNaN(price) || isNaN(sharesMillions) || price <= 0 || sharesMillions <= 0) {
                document.getElementById('marketCapResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Convert shares from millions to actual number
            const shares = sharesMillions * 1e6;
            const marketCap = price * shares;  // in dollars

            let category = '';
            if (marketCap >= 10e9) {
                category = 'Large‑cap (≥ $10B)';
            } else if (marketCap >= 2e9) {
                category = 'Mid‑cap ($2B – $10B)';
            } else if (marketCap >= 300e6) {
                category = 'Small‑cap ($300M – $2B)';
            } else {
                category = 'Micro‑cap (< $300M)';
            }

            // Format for display
            const marketCapBillions = (marketCap / 1e9).toFixed(2);
            const marketCapMillions = (marketCap / 1e6).toFixed(2);

            const resultDiv = document.getElementById('marketCapResult');
            resultDiv.innerHTML = `
                <p><strong>Market Cap:</strong> $${marketCapBillions} billion ($${marketCapMillions} million)</p>
                <p><strong>Category:</strong> ${category}</p>
            `;
        });
    }

    function initGrowthCalculator() {
        const calcBtn = document.getElementById('calculateGrowth');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const initial = parseFloat(document.getElementById('initialAmount').value);
            const annual = parseFloat(document.getElementById('annualContribution').value);
            const years = parseInt(document.getElementById('years').value);
            const rate = parseFloat(document.getElementById('returnRate').value) / 100;

            if (isNaN(initial) || isNaN(annual) || isNaN(years) || isNaN(rate) ||
                initial < 0 || annual < 0 || years <= 0 || rate < 0) {
                document.getElementById('growthResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Future value of initial investment
            const fvInitial = initial * Math.pow(1 + rate, years);

            // Future value of annual contributions (ordinary annuity)
            let fvContributions = 0;
            if (rate === 0) {
                fvContributions = annual * years;
            } else {
                fvContributions = annual * ((Math.pow(1 + rate, years) - 1) / rate);
            }

            const total = fvInitial + fvContributions;
            const totalInvested = initial + annual * years;
            const gain = total - totalInvested;

            const resultDiv = document.getElementById('growthResult');
            resultDiv.innerHTML = `
                <p><strong>Future Value:</strong> $${total.toFixed(2)}</p>
                <p><strong>Total Invested:</strong> $${totalInvested.toFixed(2)}</p>
                <p><strong>Total Gain:</strong> $${gain.toFixed(2)}</p>
                <p><small>This projection assumes a constant annual return. Actual results will vary.</small></p>
            `;
        });
    }

    function initDividendSimulator() {
        const calcBtn = document.getElementById('calculateDividend');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const shares = parseFloat(document.getElementById('divShares').value);
            const price = parseFloat(document.getElementById('divPrice').value);
            const yieldPercent = parseFloat(document.getElementById('divYield').value);
            const years = parseInt(document.getElementById('divYears').value);
            const reinvest = document.getElementById('reinvestCheck').checked;

            if (isNaN(shares) || isNaN(price) || isNaN(yieldPercent) || isNaN(years) ||
                shares <= 0 || price <= 0 || yieldPercent < 0 || years <= 0) {
                document.getElementById('dividendResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const annualDividendPerShare = price * (yieldPercent / 100);
            let annualIncome = shares * annualDividendPerShare;

            let totalIncome = 0;
            let futureShares = shares;
            let futurePrice = price; // assume price constant for simplicity

            if (reinvest) {
                // Simple DRIP simulation: each year, dividends buy more shares at current price
                for (let y = 1; y <= years; y++) {
                    const incomeThisYear = futureShares * annualDividendPerShare;
                    totalIncome += incomeThisYear;
                    // reinvest: add shares
                    futureShares += incomeThisYear / futurePrice;
                }
                const finalValue = futureShares * futurePrice;
                const resultDiv = document.getElementById('dividendResult');
                resultDiv.innerHTML = `
                    <p><strong>Annual dividend per share:</strong> $${annualDividendPerShare.toFixed(2)}</p>
                    <p><strong>Starting annual income:</strong> $${annualIncome.toFixed(2)}</p>
                    <p><strong>After ${years} years with DRIP:</strong></p>
                    <ul style="margin-left:20px;">
                        <li>Total dividend income received: $${totalIncome.toFixed(2)}</li>
                        <li>Final number of shares: ${futureShares.toFixed(2)}</li>
                        <li>Estimated portfolio value: $${finalValue.toFixed(2)}</li>
                    </ul>
                `;
            } else {
                // No reinvestment: income is constant each year
                totalIncome = annualIncome * years;
                const resultDiv = document.getElementById('dividendResult');
                resultDiv.innerHTML = `
                    <p><strong>Annual dividend per share:</strong> $${annualDividendPerShare.toFixed(2)}</p>
                    <p><strong>Annual income:</strong> $${annualIncome.toFixed(2)}</p>
                    <p><strong>Total dividend income over ${years} years:</strong> $${totalIncome.toFixed(2)}</p>
                    <p><em>(Share count and price unchanged)</em></p>
                `;
            }
        });
    }

    function initRiskQuestionnaire() {
        const calcBtn = document.getElementById('calculateRiskScore');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            // Get values from radio buttons
            const q1 = document.querySelector('input[name="q1"]:checked');
            const q2 = document.querySelector('input[name="q2"]:checked');
            const q3 = document.querySelector('input[name="q3"]:checked');
            const q4 = document.querySelector('input[name="q4"]:checked');
            const q5 = document.querySelector('input[name="q5"]:checked');

            if (!q1 || !q2 || !q3 || !q4 || !q5) {
                document.getElementById('riskResult').innerHTML = '<span style="color:red;">Please answer all questions.</span>';
                return;
            }

            // Calculate total score (each value is 1-4)
            const total = parseInt(q1.value) + parseInt(q2.value) + parseInt(q3.value) + parseInt(q4.value) + parseInt(q5.value);
            const maxScore = 20;
            const percentage = (total / maxScore) * 100;

            // Determine risk profile
            let profile = '';
            let allocation = '';

            if (total <= 7) {
                profile = 'Conservative';
                allocation = '20% stocks, 50% bonds, 30% cash/short-term';
            } else if (total <= 11) {
                profile = 'Moderate Conservative';
                allocation = '40% stocks, 40% bonds, 20% cash';
            } else if (total <= 15) {
                profile = 'Moderate';
                allocation = '60% stocks, 30% bonds, 10% cash';
            } else if (total <= 18) {
                profile = 'Moderate Aggressive';
                allocation = '75% stocks, 20% bonds, 5% cash';
            } else {
                profile = 'Aggressive';
                allocation = '90% stocks, 10% bonds';
            }

            const resultDiv = document.getElementById('riskResult');
            resultDiv.innerHTML = `
                <p><strong>Your score:</strong> ${total} out of ${maxScore} (${Math.round(percentage)}%)</p>
                <p><strong>Risk profile:</strong> ${profile}</p>
                <p><strong>Suggested asset allocation:</strong> ${allocation}</p>
                <p><small>This is a simplified guideline. Adjust based on your specific goals and situation.</small></p>
            `;
        });
    }

    function initDiversificationSimulator() {
        const calcBtn = document.getElementById('calculateDiversification');
        if (!calcBtn) return;

        // Update weight display when slider moves
        const weightSlider = document.getElementById('weightA');
        const weightSpan = document.getElementById('weightAValue');
        if (weightSlider && weightSpan) {
            weightSlider.addEventListener('input', function() {
                weightSpan.textContent = this.value;
            });
        }

        calcBtn.addEventListener('click', function(e) {
            // Get inputs
            const retA = parseFloat(document.getElementById('returnA').value);
            const riskA = parseFloat(document.getElementById('riskA').value);
            const retB = parseFloat(document.getElementById('returnB').value);
            const riskB = parseFloat(document.getElementById('riskB').value);
            const weightA = parseFloat(document.getElementById('weightA').value) / 100;
            const corr = parseFloat(document.getElementById('correlation').value);

            // Validate
            if (isNaN(retA) || isNaN(riskA) || isNaN(retB) || isNaN(riskB) || isNaN(weightA) || isNaN(corr) ||
                retA < 0 || riskA < 0 || retB < 0 || riskB < 0 || corr < -1 || corr > 1) {
                document.getElementById('diversificationResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            const weightB = 1 - weightA;

            // Portfolio expected return
            const portRet = (weightA * retA + weightB * retB).toFixed(2);

            // Portfolio variance and standard deviation
            const variance = (weightA**2 * riskA**2) + (weightB**2 * riskB**2) + 2 * weightA * weightB * riskA * riskB * corr;
            const portRisk = Math.sqrt(variance).toFixed(2);

            // Risk reduction compared to weighted average risk (if perfectly correlated)
            const weightedAvgRisk = (weightA * riskA + weightB * riskB).toFixed(2);
            const reduction = (weightedAvgRisk - portRisk).toFixed(2);

            const resultDiv = document.getElementById('diversificationResult');
            resultDiv.innerHTML = `
                <p><strong>Portfolio expected return:</strong> ${portRet}%</p>
                <p><strong>Portfolio risk (std dev):</strong> ${portRisk}%</p>
                <p><strong>Weighted average risk (if correlation = +1):</strong> ${weightedAvgRisk}%</p>
                <p><strong>Risk reduction due to diversification:</strong> ${reduction}%</p>
                <p><small>Lower correlation leads to greater risk reduction.</small></p>
            `;
        });
    }

    function initVolatilitySimulator() {
        const calcBtn = document.getElementById('calculateRecovery');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const currentValue = parseFloat(document.getElementById('currentValue').value);
            const dropPercent = parseFloat(document.getElementById('dropPercent').value);
            const futureReturn = parseFloat(document.getElementById('futureReturn').value) / 100;

            if (isNaN(currentValue) || isNaN(dropPercent) || isNaN(futureReturn) ||
                currentValue <= 0 || dropPercent <= 0 || dropPercent > 100 || futureReturn <= 0) {
                document.getElementById('recoveryResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const dropMultiplier = 1 - (dropPercent / 100);
            const afterDrop = currentValue * dropMultiplier;

            // Years to recover to original value using future return
            // We need to solve: afterDrop * (1 + futureReturn)^t = currentValue
            // => (1 + futureReturn)^t = currentValue / afterDrop = 1 / dropMultiplier
            // => t = log(1/dropMultiplier) / log(1 + futureReturn)
            const targetRatio = 1 / dropMultiplier; // e.g., if drop 30%, dropMultiplier=0.7, targetRatio≈1.4286
            const yearsToRecover = Math.log(targetRatio) / Math.log(1 + futureReturn);

            // Also calculate value after 5 and 10 years
            const value5y = afterDrop * Math.pow(1 + futureReturn, 5);
            const value10y = afterDrop * Math.pow(1 + futureReturn, 10);

            const resultDiv = document.getElementById('recoveryResult');
            resultDiv.innerHTML = `
                <p><strong>Portfolio value after ${dropPercent}% drop:</strong> $${afterDrop.toFixed(2)}</p>
                <p><strong>Years to recover to $${currentValue.toFixed(2)}:</strong> ${yearsToRecover.toFixed(1)} years</p>
                <p><strong>Value after 5 years:</strong> $${value5y.toFixed(2)}</p>
                <p><strong>Value after 10 years:</strong> $${value10y.toFixed(2)}</p>
                <p><small>Assumes constant ${futureReturn*100}% annual return after the drop. Actual returns vary.</small></p>
            `;
        });
    }

    function initAssetAllocationSimulator() {
        const calcBtn = document.getElementById('calculateAllocation');
        if (!calcBtn) return;

        // Sliders and displays
        const stockSlider = document.getElementById('stockPct');
        const bondSlider = document.getElementById('bondPct');
        const cashSlider = document.getElementById('cashPct');
        const stockSpan = document.getElementById('stockPctValue');
        const bondSpan = document.getElementById('bondPctValue');
        const cashSpan = document.getElementById('cashPctValue');

        // Ensure sliders sum to 100% by adjusting others
        function adjustSliders(changed) {
            let stock = parseInt(stockSlider.value);
            let bond = parseInt(bondSlider.value);
            let cash = parseInt(cashSlider.value);
            const total = stock + bond + cash;

            if (total !== 100) {
                if (changed === 'stock') {
                    // Adjust bond and cash proportionally
                    const remaining = 100 - stock;
                    if (bond + cash > 0) {
                        const ratio = bond / (bond + cash);
                        bond = Math.round(remaining * ratio);
                        cash = remaining - bond;
                    } else {
                        bond = remaining;
                        cash = 0;
                    }
                } else if (changed === 'bond') {
                    const remaining = 100 - bond;
                    const ratio = stock / (stock + cash);
                    stock = Math.round(remaining * ratio);
                    cash = remaining - stock;
                } else if (changed === 'cash') {
                    const remaining = 100 - cash;
                    const ratio = stock / (stock + bond);
                    stock = Math.round(remaining * ratio);
                    bond = remaining - stock;
                }
                // Ensure no negatives
                stock = Math.max(0, Math.min(100, stock));
                bond = Math.max(0, Math.min(100, bond));
                cash = Math.max(0, Math.min(100, cash));
                // Re-adjust if rounding causes sum off by 1
                let newTotal = stock + bond + cash;
                if (newTotal !== 100) {
                    if (stock > 0 && newTotal > 100) stock--;
                    else if (bond > 0 && newTotal > 100) bond--;
                    else if (cash > 0 && newTotal > 100) cash--;
                    else if (stock < 100 && newTotal < 100) stock++;
                    else if (bond < 100 && newTotal < 100) bond++;
                    else if (cash < 100 && newTotal < 100) cash++;
                }
                stockSlider.value = stock;
                bondSlider.value = bond;
                cashSlider.value = cash;
            }
            stockSpan.textContent = stockSlider.value;
            bondSpan.textContent = bondSlider.value;
            cashSpan.textContent = cashSlider.value;
        }

        stockSlider.addEventListener('input', function() {
            adjustSliders('stock');
        });
        bondSlider.addEventListener('input', function() {
            adjustSliders('bond');
        });
        cashSlider.addEventListener('input', function() {
            adjustSliders('cash');
        });

        calcBtn.addEventListener('click', function(e) {
            const stock = parseFloat(stockSlider.value) / 100;
            const bond = parseFloat(bondSlider.value) / 100;
            const cash = parseFloat(cashSlider.value) / 100;

            // Assumptions (can be made adjustable later)
            const retStock = 0.08;
            const riskStock = 0.15;
            const retBond = 0.04;
            const riskBond = 0.05;
            const retCash = 0.02;
            const riskCash = 0.005;

            // Correlations
            const corrStockBond = 0.2;
            const corrStockCash = 0.0;
            const corrBondCash = 0.1;

            // Portfolio return
            const portRet = (stock * retStock + bond * retBond + cash * retCash) * 100;

            // Portfolio variance: w1^2 σ1^2 + w2^2 σ2^2 + w3^2 σ3^2 + 2 w1 w2 σ1 σ2 ρ12 + 2 w1 w3 σ1 σ3 ρ13 + 2 w2 w3 σ2 σ3 ρ23
            const variance =
                (stock**2 * riskStock**2) +
                (bond**2 * riskBond**2) +
                (cash**2 * riskCash**2) +
                2 * stock * bond * riskStock * riskBond * corrStockBond +
                2 * stock * cash * riskStock * riskCash * corrStockCash +
                2 * bond * cash * riskBond * riskCash * corrBondCash;

            const portRisk = Math.sqrt(variance) * 100;

            const resultDiv = document.getElementById('allocationResult');
            resultDiv.innerHTML = `
                <p><strong>Expected annual return:</strong> ${portRet.toFixed(2)}%</p>
                <p><strong>Portfolio risk (std dev):</strong> ${portRisk.toFixed(2)}%</p>
                <p><strong>Allocation:</strong> Stocks ${(stock*100).toFixed(0)}% | Bonds ${(bond*100).toFixed(0)}% | Cash ${(cash*100).toFixed(0)}%</p>
                <p><small>These are hypothetical estimates based on historical averages. Actual results vary.</small></p>
            `;
        });

        // Initialize display
        adjustSliders('stock');
    }

    function initBrokerageSelector() {
        const recommendBtn = document.getElementById('recommendBrokerage');
        if (!recommendBtn) return;

        recommendBtn.addEventListener('click', function(e) {
            const goal = document.querySelector('input[name="goal"]:checked');
            const tax = document.querySelector('input[name="tax"]:checked');
            const amount = document.querySelector('input[name="amount"]:checked');
            const investType = document.querySelector('input[name="investType"]:checked');

            if (!goal || !tax || !amount || !investType) {
                document.getElementById('brokerageResult').innerHTML = '<span style="color:red;">Please answer all questions.</span>';
                return;
            }

            let accountType = '';
            let brokerFeatures = [];

            // Determine account type based on goal and tax
            if (goal.value === 'retirement') {
                if (tax.value === 'high') {
                    accountType = 'Traditional IRA (tax deduction now)';
                } else if (tax.value === 'low') {
                    accountType = 'Roth IRA (tax‑free growth)';
                } else {
                    accountType = 'Traditional or Roth IRA – depends on your tax situation';
                }
                brokerFeatures.push('Look for no‑fee IRAs, low-cost index funds, and automatic investment options.');
            } else if (goal.value === 'general') {
                accountType = 'Taxable brokerage account';
                brokerFeatures.push('Seek $0 commissions, fractional shares, and a user-friendly mobile app.');
            } else if (goal.value === 'short') {
                accountType = 'Taxable brokerage account (or high‑yield savings if <2 years)';
                brokerFeatures.push('For short-term, consider conservative investments like bond ETFs. Choose a broker with no trading fees.');
            } else if (goal.value === 'education') {
                accountType = '529 plan or UGMA/UTMA custodial account';
                brokerFeatures.push('Some brokers offer 529 plans. For UGMA, look for low fees and easy custodial management.');
            }

            // Additional features based on amount and investType
            if (amount.value === 'small' && !brokerFeatures.some(f => f.includes('fractional'))) {
                brokerFeatures.push('Fractional shares are essential for small amounts.');
            }
            if (investType.value === 'funds') {
                brokerFeatures.push('Check for no-transaction-fee mutual funds.');
            } else if (investType.value === 'options') {
                brokerFeatures.push('Ensure the broker offers options trading and has good tools (e.g., thinkorswim).');
            }

            // General recommendations
            if (amount.value === 'small' || amount.value === 'medium') {
                brokerFeatures.push('Look for $0 minimum opening deposit.');
            }

            const resultDiv = document.getElementById('brokerageResult');
            resultDiv.innerHTML = `
                <p><strong>Recommended account type:</strong> ${accountType}</p>
                <p><strong>What to look for in a broker:</strong></p>
                <ul style="margin-left:20px;">
                    ${brokerFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <p><small>Always compare current offerings – promotions and features change frequently.</small></p>
            `;
        });
    }

    function initOrderSimulator() {
        const simulateBtn = document.getElementById('simulateOrder');
        if (!simulateBtn) return;

        simulateBtn.addEventListener('click', function(e) {
            const currentPrice = parseFloat(document.getElementById('currentStockPrice').value);
            const orderType = document.getElementById('orderTypeSelect').value;
            const limitPrice = parseFloat(document.getElementById('limitPrice').value);
            const stopPrice = parseFloat(document.getElementById('stopPrice').value);

            if (isNaN(currentPrice) || currentPrice <= 0) {
                document.getElementById('orderResult').innerHTML = '<span style="color:red;">Please enter a valid current price.</span>';
                return;
            }

            let result = '';
            let explanation = '';

            // Simulate a simple price movement: assume price can go up or down by 5%
            const possibleLow = currentPrice * 0.95;
            const possibleHigh = currentPrice * 1.05;

            if (orderType === 'market') {
                // Market order executes immediately at current price
                result = `✅ Market order would execute immediately at approximately $${currentPrice.toFixed(2)} (may vary slightly).`;
                explanation = 'Market orders prioritize speed over price.';
            } else if (orderType === 'limit') {
                if (isNaN(limitPrice) || limitPrice <= 0) {
                    result = '<span style="color:red;">Please enter a valid limit price.</span>';
                } else if (limitPrice >= currentPrice) {
                    // Buy limit: you want to buy below current? Actually a buy limit is placed below current to get a discount.
                    // For simplicity, we check if limit price is <= possibleLow? We'll say if limit price is below current, it might execute if price drops.
                    if (limitPrice <= possibleLow) {
                        result = `✅ Limit order would likely execute if price drops to $${limitPrice.toFixed(2)} (within today's range).`;
                    } else {
                        result = `❌ Limit order at $${limitPrice.toFixed(2)} is above current price; it would execute immediately (like a market order) if you're buying. For a buy limit, you usually set it below current.`;
                    }
                } else {
                    // limitPrice < currentPrice
                    if (possibleLow <= limitPrice) {
                        result = `✅ Limit order could execute if price drops to $${limitPrice.toFixed(2)}.`;
                    } else {
                        result = `❌ Limit order at $${limitPrice.toFixed(2)} may not execute today if the lowest price is $${possibleLow.toFixed(2)}.`;
                    }
                }
                explanation = 'Limit orders give price control but may not execute.';
            } else if (orderType === 'stop') {
                if (isNaN(stopPrice) || stopPrice <= 0) {
                    result = '<span style="color:red;">Please enter a valid stop price.</span>';
                } else if (stopPrice >= currentPrice) {
                    // Stop-loss sell: you set stop below current to limit loss. If stop above current, it's a sell if price rises (like a trailing stop).
                    if (possibleHigh >= stopPrice) {
                        result = `✅ Stop order would trigger if price rises to $${stopPrice.toFixed(2)}.`;
                    } else {
                        result = `❌ Stop order at $${stopPrice.toFixed(2)} may not trigger today if the highest price is $${possibleHigh.toFixed(2)}.`;
                    }
                } else {
                    // stopPrice < currentPrice (typical stop-loss)
                    if (possibleLow <= stopPrice) {
                        result = `✅ Stop order would trigger if price falls to $${stopPrice.toFixed(2)}.`;
                    } else {
                        result = `❌ Stop order at $${stopPrice.toFixed(2)} may not trigger today if the lowest price is $${possibleLow.toFixed(2)}.`;
                    }
                }
                explanation = 'Stop orders become market orders when triggered.';
            }

            document.getElementById('orderResult').innerHTML = `
                <p><strong>Simulation result:</strong> ${result}</p>
                <p><em>${explanation}</em></p>
                <p><small>Assumes price stays within ±5% of current price. Actual market movements vary.</small></p>
            `;
        });
    }

    function initDCACalculator() {
        const calcBtn = document.getElementById('calculateDCA');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const monthly = parseFloat(document.getElementById('monthlyAmount').value);
            const years = parseInt(document.getElementById('dcaYears').value);
            const annualReturn = parseFloat(document.getElementById('dcaReturn').value) / 100;

            if (isNaN(monthly) || isNaN(years) || isNaN(annualReturn) || monthly <= 0 || years <= 0 || annualReturn < 0) {
                document.getElementById('dcaResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const months = years * 12;
            const monthlyRate = annualReturn / 12;

            // Future value of a series (end of period)
            let futureValue;
            if (monthlyRate === 0) {
                futureValue = monthly * months;
            } else {
                futureValue = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            }

            const totalInvested = monthly * months;
            const gain = futureValue - totalInvested;

            const resultDiv = document.getElementById('dcaResult');
            resultDiv.innerHTML = `
                <p><strong>Total invested:</strong> $${totalInvested.toFixed(2)}</p>
                <p><strong>Future value after ${years} years:</strong> $${futureValue.toFixed(2)}</p>
                <p><strong>Total gain:</strong> $${gain.toFixed(2)}</p>
                <p><small>Assumes monthly contributions at the end of each month and constant ${annualReturn*100}% annual return.</small></p>
            `;
        });
    }

    function initStockResearch() {
        const analyzeBtn = document.getElementById('analyzeStock');
        if (!analyzeBtn) return;

        analyzeBtn.addEventListener('click', function(e) {
            const pe = parseFloat(document.getElementById('peRatio').value);
            const epsGrowth = parseFloat(document.getElementById('epsGrowth').value);
            const debtEquity = parseFloat(document.getElementById('debtEquity').value);
            const divYield = parseFloat(document.getElementById('divYieldMetric').value);

            if (isNaN(pe) || isNaN(epsGrowth) || isNaN(debtEquity) || isNaN(divYield) ||
                pe < 0 || epsGrowth < -50 || debtEquity < 0 || divYield < 0) {
                document.getElementById('stockResearchResult').innerHTML = '<span style="color:red;">Please enter valid numbers.</span>';
                return;
            }

            // Simple scoring system (educational only)
            let score = 0;
            let reasons = [];

            // P/E: lower is better, but depends on industry. Here: <15 good, 15-25 neutral, >25 expensive
            if (pe < 15) {
                score += 2;
                reasons.push("P/E is below 15 – potentially undervalued.");
            } else if (pe <= 25) {
                score += 1;
                reasons.push("P/E is in the moderate range.");
            } else {
                score += 0;
                reasons.push("P/E is above 25 – may be overvalued.");
            }

            // EPS Growth: higher is better
            if (epsGrowth > 15) {
                score += 2;
                reasons.push("EPS growth is strong (>15%).");
            } else if (epsGrowth > 5) {
                score += 1;
                reasons.push("EPS growth is positive but moderate.");
            } else if (epsGrowth > 0) {
                score += 0;
                reasons.push("EPS growth is weak (0-5%).");
            } else {
                score -= 1;
                reasons.push("EPS growth is negative – a red flag.");
            }

            // Debt-to-Equity: lower is better
            if (debtEquity < 0.3) {
                score += 2;
                reasons.push("Debt-to-equity is low – strong balance sheet.");
            } else if (debtEquity < 1) {
                score += 1;
                reasons.push("Debt-to-equity is moderate.");
            } else if (debtEquity < 2) {
                score += 0;
                reasons.push("Debt-to-equity is on the higher side.");
            } else {
                score -= 1;
                reasons.push("Debt-to-equity is high – risky.");
            }

            // Dividend Yield: positive but not too high (could be a trap)
            if (divYield > 0 && divYield < 6) {
                score += 1;
                reasons.push("Dividend yield is in a healthy range.");
            } else if (divYield >= 6) {
                score += 0;
                reasons.push("Dividend yield is very high – check sustainability.");
            } else {
                // no dividend
                reasons.push("No dividend – not a problem for growth stocks.");
            }

            // Determine signal
            let signal = '';
            let color = '';
            if (score >= 6) {
                signal = 'BUY';
                color = 'green';
            } else if (score >= 4) {
                signal = 'HOLD / CONSIDER';
                color = 'orange';
            } else {
                signal = 'AVOID / RESEARCH MORE';
                color = 'red';
            }

            const resultDiv = document.getElementById('stockResearchResult');
            resultDiv.innerHTML = `
                <p><strong style="color:${color};">Signal: ${signal}</strong> (score: ${score}/8)</p>
                <ul style="margin-left:20px;">
                    ${reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
                <p><small>This is a simplified educational tool. Always conduct your own thorough research.</small></p>
            `;
        });
    }

    function initFinancialAnalyzer() {
        const analyzeBtn = document.getElementById('analyzeFinancials');
        if (!analyzeBtn) return;

        analyzeBtn.addEventListener('click', function(e) {
            const revenue = parseFloat(document.getElementById('revenue').value);
            const netIncome = parseFloat(document.getElementById('netIncome').value);
            const assets = parseFloat(document.getElementById('totalAssets').value);
            const liabilities = parseFloat(document.getElementById('totalLiabilities').value);
            const opCashFlow = parseFloat(document.getElementById('opCashFlow').value);

            if (isNaN(revenue) || isNaN(netIncome) || isNaN(assets) || isNaN(liabilities) || isNaN(opCashFlow) ||
                revenue <= 0 || assets <= 0) {
                document.getElementById('financialResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers for revenue and assets (others can be zero or negative).</span>';
                return;
            }

            // Calculate ratios
            const profitMargin = netIncome / revenue * 100;
            const roa = netIncome / assets * 100;
            const debtToAssets = liabilities / assets * 100;
            const cashFlowToRevenue = opCashFlow / revenue * 100;

            // Scoring logic (educational)
            let score = 0;
            let comments = [];

            // Profit margin
            if (profitMargin > 15) {
                score += 2;
                comments.push(`✅ Profit margin: ${profitMargin.toFixed(1)}% – strong.`);
            } else if (profitMargin > 5) {
                score += 1;
                comments.push(`👍 Profit margin: ${profitMargin.toFixed(1)}% – acceptable.`);
            } else if (profitMargin > 0) {
                score += 0;
                comments.push(`⚠️ Profit margin: ${profitMargin.toFixed(1)}% – low.`);
            } else {
                score -= 1;
                comments.push(`❌ Profit margin: ${profitMargin.toFixed(1)}% – negative (loss).`);
            }

            // ROA
            if (roa > 10) {
                score += 2;
                comments.push(`✅ ROA: ${roa.toFixed(1)}% – excellent asset efficiency.`);
            } else if (roa > 5) {
                score += 1;
                comments.push(`👍 ROA: ${roa.toFixed(1)}% – good.`);
            } else if (roa > 0) {
                score += 0;
                comments.push(`⚠️ ROA: ${roa.toFixed(1)}% – below average.`);
            } else {
                score -= 1;
                comments.push(`❌ ROA: ${roa.toFixed(1)}% – negative.`);
            }

            // Debt-to-Assets
            if (debtToAssets < 30) {
                score += 2;
                comments.push(`✅ Debt-to-assets: ${debtToAssets.toFixed(1)}% – low debt.`);
            } else if (debtToAssets < 60) {
                score += 1;
                comments.push(`👍 Debt-to-assets: ${debtToAssets.toFixed(1)}% – moderate.`);
            } else if (debtToAssets < 80) {
                score += 0;
                comments.push(`⚠️ Debt-to-assets: ${debtToAssets.toFixed(1)}% – high.`);
            } else {
                score -= 1;
                comments.push(`❌ Debt-to-assets: ${debtToAssets.toFixed(1)}% – very high risk.`);
            }

            // Cash Flow to Revenue
            if (cashFlowToRevenue > 15) {
                score += 2;
                comments.push(`✅ Operating cash flow / revenue: ${cashFlowToRevenue.toFixed(1)}% – strong cash conversion.`);
            } else if (cashFlowToRevenue > 5) {
                score += 1;
                comments.push(`👍 Operating cash flow / revenue: ${cashFlowToRevenue.toFixed(1)}% – healthy.`);
            } else if (cashFlowToRevenue > 0) {
                score += 0;
                comments.push(`⚠️ Operating cash flow / revenue: ${cashFlowToRevenue.toFixed(1)}% – weak cash generation.`);
            } else {
                score -= 1;
                comments.push(`❌ Operating cash flow / revenue: ${cashFlowToRevenue.toFixed(1)}% – negative cash flow.`);
            }

            // Overall rating
            let rating = '';
            let color = '';
            if (score >= 7) {
                rating = 'Strong';
                color = 'green';
            } else if (score >= 4) {
                rating = 'Average';
                color = 'orange';
            } else {
                rating = 'Weak / Caution';
                color = 'red';
            }

            const resultDiv = document.getElementById('financialResult');
            resultDiv.innerHTML = `
                <p><strong style="color:${color};">Overall Rating: ${rating}</strong> (score: ${score}/8)</p>
                <ul style="margin-left:20px;">
                    ${comments.map(c => `<li>${c}</li>`).join('')}
                </ul>
                <p><small>This is a simplified educational analysis. Compare with industry benchmarks.</small></p>
            `;
        });
    }

    function initValuationCalculator() {
        const calcBtn = document.getElementById('calculateValuation');
        if (!calcBtn) return;

        calcBtn.addEventListener('click', function(e) {
            const price = parseFloat(document.getElementById('valPrice').value);
            const eps = parseFloat(document.getElementById('valEps').value);
            const growth = parseFloat(document.getElementById('valGrowth').value);

            if (isNaN(price) || isNaN(eps) || isNaN(growth) || price <= 0 || eps <= 0 || growth < 0) {
                document.getElementById('valuationResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers (growth can be zero).</span>';
                return;
            }

            const pe = price / eps;
            const peg = pe / growth; // growth in % (e.g., 15 not 0.15)

            // Fair value based on simplified model: fair P/E = growth rate, so fair price = eps * growth
            const fairPrice = eps * growth;
            const discount = ((fairPrice - price) / price) * 100;

            let verdict = '';
            let color = '';
            if (peg < 1) {
                verdict = 'Undervalued (PEG < 1)';
                color = 'green';
            } else if (peg < 1.5) {
                verdict = 'Fairly valued (PEG 1–1.5)';
                color = 'orange';
            } else {
                verdict = 'Overvalued (PEG > 1.5)';
                color = 'red';
            }

            // Additional signal from fair price comparison
            let fairComment = '';
            if (fairPrice > price) {
                fairComment = `✅ Fair price ($${fairPrice.toFixed(2)}) is above current price – potential bargain.`;
            } else if (fairPrice < price) {
                fairComment = `⚠️ Fair price ($${fairPrice.toFixed(2)}) is below current price – stock may be expensive.`;
            } else {
                fairComment = `Fair price equals current price.`;
            }

            const resultDiv = document.getElementById('valuationResult');
            resultDiv.innerHTML = `
                <p><strong>P/E:</strong> ${pe.toFixed(2)}</p>
                <p><strong>PEG:</strong> ${peg.toFixed(2)}</p>
                <p><strong style="color:${color};">Verdict: ${verdict}</strong></p>
                <p><strong>Simplified fair value estimate:</strong> $${fairPrice.toFixed(2)}</p>
                <p>${fairComment}</p>
                <p><small>This is a simplified model. Real valuation requires deeper analysis.</small></p>
            `;
        });
    }

    function initDividendProjector() {
        const projectBtn = document.getElementById('projectDividendIncome');
        if (!projectBtn) return;

        projectBtn.addEventListener('click', function(e) {
            const initial = parseFloat(document.getElementById('divInitial').value);
            const yieldPct = parseFloat(document.getElementById('divAvgYield').value);
            const growthPct = parseFloat(document.getElementById('divGrowth').value);
            const years = parseInt(document.getElementById('divYearsProject').value);
            const reinvest = document.getElementById('divReinvest').checked;

            if (isNaN(initial) || isNaN(yieldPct) || isNaN(growthPct) || isNaN(years) ||
                initial < 0 || yieldPct < 0 || growthPct < 0 || years <= 0) {
                document.getElementById('dividendProjectionResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            const yieldDecimal = yieldPct / 100;
            const growthDecimal = growthPct / 100;

            let portfolioValue = initial;
            let annualIncome = initial * yieldDecimal;
            let totalIncomeReceived = 0;

            let yearData = [];

            for (let y = 1; y <= years; y++) {
                // Income this year based on current portfolio value and yield
                let incomeThisYear = portfolioValue * yieldDecimal;
                totalIncomeReceived += incomeThisYear;

                if (reinvest) {
                    // Add income to portfolio (assume no price change, yield stays constant)
                    portfolioValue += incomeThisYear;
                }

                // Increase future income by dividend growth rate (applies to the yield? Actually yield may stay same but dividend per share grows.
                // For simplicity, we increase the effective income next year by growth rate.
                // But since we already added reinvested capital, the growth rate is on dividends per share.
                // A more accurate model: dividend per share grows, so yield on cost increases. Here we keep yield constant on portfolio.
                // We'll apply growth to the income generated from the original investment? Simpler: just show income each year with growth applied to the yield.
                // For clarity, we'll show a table in the result.

                // We'll store for display
                yearData.push({
                    year: y,
                    income: incomeThisYear,
                    portfolio: portfolioValue
                });

                // For next year's income, if we are not reinvesting, income grows because yield * (portfolio + growth?).
                // Actually if not reinvesting, portfolio stays same, but dividend per share grows -> yield on original cost increases.
                // We'll model that by increasing the effective yield on the initial portfolio.
                // Let's keep it simple: if reinvest, portfolio grows; if not, portfolio constant but income grows due to dividend growth.
                // We'll handle both cases.

                if (!reinvest) {
                    // Portfolio constant, but income grows by growthPct each year
                    // We'll adjust next year's income manually in loop? Better to recalc each year based on growing yield on constant principal.
                    // We'll implement by adjusting yield for next iteration.
                    // But yield is a percentage of current portfolio; if portfolio constant, we can just increase income by growth rate.
                    // Let's do that: after calculating incomeThisYear, we'll increase the yield for next year.
                    // We'll keep portfolioValue constant.
                }
            }

            // For simplicity, we'll just show final numbers and a summary.
            // A more detailed approach could show a table, but we'll keep it concise.

            let resultHtml = '';
            if (reinvest) {
                resultHtml = `
                    <p><strong>With reinvestment (DRIP):</strong></p>
                    <p>After ${years} years:</p>
                    <ul style="margin-left:20px;">
                        <li>Portfolio value: $${portfolioValue.toFixed(2)}</li>
                        <li>Total dividend income received: $${totalIncomeReceived.toFixed(2)}</li>
                        <li>Annual income in year ${years}: $${yearData[yearData.length-1].income.toFixed(2)}</li>
                    </ul>
                `;
            } else {
                // Without reinvestment, portfolio stays at initial, income grows by growth rate each year.
                let incomeWithoutReinvest = initial * yieldDecimal;
                let totalIncomeNoReinvest = 0;
                for (let y = 1; y <= years; y++) {
                    totalIncomeNoReinvest += incomeWithoutReinvest;
                    incomeWithoutReinvest *= (1 + growthDecimal);
                }
                const finalIncome = incomeWithoutReinvest / (1 + growthDecimal); // last year's income before applying next growth

                resultHtml = `
                    <p><strong>Without reinvestment (taking dividends as cash):</strong></p>
                    <p>After ${years} years:</p>
                    <ul style="margin-left:20px;">
                        <li>Portfolio value: $${initial.toFixed(2)} (unchanged)</li>
                        <li>Total dividend income received: $${totalIncomeNoReinvest.toFixed(2)}</li>
                        <li>Annual income in year ${years}: $${finalIncome.toFixed(2)}</li>
                    </ul>
                `;
            }

            document.getElementById('dividendProjectionResult').innerHTML = resultHtml + '<p><small>Projections are hypothetical and not guaranteed.</small></p>';
        });
    }

    function initStrategyComparator() {
        const compareBtn = document.getElementById('compareStrategies');
        if (!compareBtn) return;

        compareBtn.addEventListener('click', function(e) {
            // Get inputs
            const initial = parseFloat(document.getElementById('stratInitial').value);
            const years = parseInt(document.getElementById('stratYears').value);

            const bhReturn = parseFloat(document.getElementById('bhReturn').value) / 100;
            const bhExpense = parseFloat(document.getElementById('bhExpense').value) / 100;
            const bhTurnover = parseFloat(document.getElementById('bhTurnover').value) / 100;

            const atReturn = parseFloat(document.getElementById('atReturn').value) / 100;
            const atExpense = parseFloat(document.getElementById('atExpense').value) / 100;
            const atTurnover = parseFloat(document.getElementById('atTurnover').value) / 100;

            const ltcgRate = parseFloat(document.getElementById('ltcgRate').value) / 100;
            const stcgRate = parseFloat(document.getElementById('stcgRate').value) / 100;

            if (isNaN(initial) || isNaN(years) || isNaN(bhReturn) || isNaN(bhExpense) || isNaN(bhTurnover) ||
                isNaN(atReturn) || isNaN(atExpense) || isNaN(atTurnover) || isNaN(ltcgRate) || isNaN(stcgRate) ||
                initial < 0 || years <= 0) {
                document.getElementById('strategyResult').innerHTML = '<span style="color:red;">Please enter valid positive numbers.</span>';
                return;
            }

            // Helper to compute after-tax final value for a strategy
            function computeFinalValue(grossReturn, expenseRatio, turnover, isLongTermPreferred) {
                let value = initial;
                let totalGain = 0;

                for (let y = 1; y <= years; y++) {
                    // Gross return before expenses
                    let gain = value * grossReturn;
                    // Subtract expenses (assume charged on assets)
                    value -= value * expenseRatio; // simplified: expense reduces value
                    // Actually expense ratio is usually deducted from returns, so net return = grossReturn - expenseRatio
                    // Better: value *= (1 + grossReturn - expenseRatio)
                    // We'll do that:
                    value = value * (1 + grossReturn - expenseRatio);

                    // Now, based on turnover, some gains are realized and taxed.
                    // Assume turnover = % of portfolio sold each year. Gains are a fraction of the gain embedded.
                    // Simplified: each year, turnover fraction of the portfolio's embedded gain is realized.
                    // We need to track cost basis. Too complex for a simple tool. Let's use a simpler approximation:
                    // Assume all gains are realized each year (100% turnover) for active, and none for buy-and-hold except at end.
                    // But we have turnover inputs, so we'll use a rough model:
                    // - For buy-and-hold, we assume only the turnover fraction of gains are realized each year and taxed at appropriate rate.
                    // - For active, same but with higher turnover.
                    // We'll approximate: at the end of each year, we compute the gain for the year (value - costBasis? but cost basis changes).
                    // Simpler: we'll assume the entire portfolio's gain for the year is realized according to turnover, and tax paid reduces value.

                    // Let's use a common simplification: after gross return, we compute the taxable gain as turnover * (value at start * grossReturn). Then tax = gain * taxRate.
                    // Then value after tax = previous value + net gain after tax.
                    // This is not perfectly accurate but gives a sense.

                    // We'll keep a running cost basis for simplicity? Maybe too complex. Let's do a year-by-year with basis tracking.

                    // For this tool, we'll implement a simple model:
                    // - Keep track of cost basis.
                    // - Each year, the portfolio grows by (grossReturn - expenseRatio). This growth is unrealized.
                    // - At year end, we realize a fraction (turnover) of the unrealized gain. That portion is taxed at either ltcg or st rate depending on holding period.
                    // - We'll assume all realized gains are short-term for active (since turnover high) and long-term for buy-and-hold? But buy-and-hold might have some turnover.
                    // - For simplicity, we'll use the tax rate passed: for buy-and-hold, we'll use ltcgRate; for active, we'll use stcgRate.
                    // This is a simplification.

                    // Let's code it.
                }

                // Instead of a complex loop, we'll use a simpler after-tax future value formula:
                // Final value = initial * (1 + netReturnAfterTax)^years
                // where netReturnAfterTax = grossReturn - expenseRatio - (turnover * taxRate * grossReturn) roughly.
                // That's very rough but illustrative.

                const netReturn = grossReturn - expenseRatio - (turnover * (isLongTermPreferred ? ltcgRate : stcgRate) * grossReturn);
                return initial * Math.pow(1 + netReturn, years);
            }

            // Compute with our simplified formula
            const bhFinal = initial * Math.pow(1 + (bhReturn - bhExpense - (bhTurnover * ltcgRate * bhReturn)), years);
            const atFinal = initial * Math.pow(1 + (atReturn - atExpense - (atTurnover * stcgRate * atReturn)), years);

            // Also compute without tax drag for comparison
            const bhNoTax = initial * Math.pow(1 + bhReturn - bhExpense, years);
            const atNoTax = initial * Math.pow(1 + atReturn - atExpense, years);

            const better = (bhFinal > atFinal) ? 'Buy‑and‑Hold' : 'Active Trading';
            const color = (bhFinal > atFinal) ? 'green' : 'orange';

            const resultDiv = document.getElementById('strategyResult');
            resultDiv.innerHTML = `
                <p><strong>After‑tax results after ${years} years:</strong></p>
                <ul style="margin-left:20px;">
                    <li>Buy‑and‑Hold: $${bhFinal.toFixed(2)}</li>
                    <li>Active Trading: $${atFinal.toFixed(2)}</li>
                </ul>
                <p><strong style="color:${color};">Recommendation: ${better} yields more in this scenario.</strong></p>
                <p><small>Before‑tax comparison: Buy‑and‑Hold $${bhNoTax.toFixed(2)} | Active $${atNoTax.toFixed(2)}</small></p>
                <p><small>This is a simplified model. Actual results depend on precise tax treatment and market behavior.</small></p>
            `;
        });
    }

})();
