/* assets/js/forex.js */

(function() {
    // Run after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            // User is logged in – run all interactive features
            initTradingVolatilitySimulator();
            initLeverageCalculator();
            initStopLossTakeProfitPlanner();
            initPositionSizeCalculator();
            initRiskRewardSimulator();
            initPsychologySimulator();
            initDemoChecklist();
            initOrderScenarioTool();
            initTechnicalAnalysisScenarios();
            initJournalBuilder();
            initFundamentalSimulator();
            initStrategyBuilder();
            initCorrelationSimulator();
            initDemoToLiveReadiness();
        }
    });

    function initTradingVolatilitySimulator() {
        const sessionSelect = document.getElementById('sessionSelect');
        const pairSelect = document.getElementById('pairSelect');
        const calcBtn = document.getElementById('calculateBtn');
        const resultDiv = document.getElementById('volatilityResult');

        if (calcBtn && sessionSelect && pairSelect && resultDiv) {
            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const session = sessionSelect.value;
                const pair = pairSelect.value;

                // Simulated historical average pip movement per session (rough estimates)
                const volatilityData = {
                    london: { EURUSD: 120, GBPUSD: 140, USDJPY: 100 },
                    newyork: { EURUSD: 110, GBPUSD: 130, USDJPY: 120 },
                    tokyo: { EURUSD: 80, GBPUSD: 70, USDJPY: 150 },
                    sydney: { EURUSD: 60, GBPUSD: 50, USDJPY: 80 }
                };

                const avgPips = volatilityData[session][pair] || 100;
                const sessionNames = {
                    london: 'London',
                    newyork: 'New York',
                    tokyo: 'Tokyo',
                    sydney: 'Sydney'
                };
                resultDiv.innerHTML = `📊 Average pip movement for <strong>${pair}</strong> during the <strong>${sessionNames[session]}</strong> session: <strong>${avgPips} pips</strong> (typical range).`;
            });
        }
    }

    function initLeverageCalculator() {
        const calcBtn = document.getElementById('leverageCalcBtn');
        const balanceInput = document.getElementById('accountBalance');
        const leverageSelect = document.getElementById('leverageSelect');
        const lotsInput = document.getElementById('tradeLots');
        const resultDiv = document.getElementById('leverageResult');

        if (calcBtn && balanceInput && leverageSelect && lotsInput && resultDiv) {
            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const balance = parseFloat(balanceInput.value) || 5000;
                const leverage = parseFloat(leverageSelect.value) || 30;
                const lots = parseFloat(lotsInput.value) || 1;

                // Assumptions: trading EUR/USD at 1.1000, 1 lot = 100,000 units
                const contractSize = 100000; // units
                const price = 1.1000;
                const tradeValue = lots * contractSize * price; // in USD
                const requiredMargin = tradeValue / leverage;
                const pipValue = lots * 10; // 1 lot EUR/USD pip ≈ $10

                // A 50-pip loss would be:
                const loss50 = pipValue * 50;

                resultDiv.innerHTML = `
                📊 <strong>Trade value:</strong> $${tradeValue.toFixed(2)}<br>
                💰 <strong>Required margin:</strong> $${requiredMargin.toFixed(2)}<br>
                📉 <strong>Pip value:</strong> ~$${pipValue.toFixed(2)}<br>
                ⚠️ <strong>50-pip loss:</strong> $${loss50.toFixed(2)} (${((loss50/balance)*100).toFixed(1)}% of your account)
            `;
            });
        }
    }

    function initStopLossTakeProfitPlanner() {
        const calcBtn = document.getElementById('slTpCalcBtn');
        const entryInput = document.getElementById('entryPrice');
        const stopPipsInput = document.getElementById('stopPips');
        const targetPipsInput = document.getElementById('targetPips');
        const lotsInput = document.getElementById('tradeLots');
        const resultDiv = document.getElementById('slTpResult');

        if (calcBtn && entryInput && stopPipsInput && targetPipsInput && lotsInput && resultDiv) {
            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const entry = parseFloat(entryInput.value) || 1.1000;
                const stopPips = parseFloat(stopPipsInput.value) || 20;
                const targetPips = parseFloat(targetPipsInput.value) || 40;
                const lots = parseFloat(lotsInput.value) || 1;

                // Assumptions: 1 pip = $10 for 1 lot on EUR/USD (approx)
                const pipValue = lots * 10;
                const riskAmount = stopPips * pipValue;
                const rewardAmount = targetPips * pipValue;
                const ratio = (rewardAmount / riskAmount).toFixed(2);

                resultDiv.innerHTML = `
                ⚠️ <strong>Risk:</strong> $${riskAmount.toFixed(2)} (${stopPips} pips)<br>
                🎯 <strong>Reward:</strong> $${rewardAmount.toFixed(2)} (${targetPips} pips)<br>
                📊 <strong>Risk‑Reward Ratio:</strong> 1:${ratio}
            `;
            });
        }
    }

    function initPositionSizeCalculator() {
        const calcBtn = document.getElementById('positionSizeCalcBtn');
        const balanceInput = document.getElementById('accountBalance');
        const riskPercentInput = document.getElementById('riskPercent');
        const stopLossInput = document.getElementById('stopLossPips');
        const pairSelect = document.getElementById('pairSelect');
        const resultDiv = document.getElementById('positionSizeResult');

        if (calcBtn && balanceInput && riskPercentInput && stopLossInput && pairSelect && resultDiv) {
            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const balance = parseFloat(balanceInput.value) || 5000;
                const riskPercent = parseFloat(riskPercentInput.value) || 2;
                const stopPips = parseFloat(stopLossInput.value) || 20;
                const pipValuePerLot = parseFloat(pairSelect.value) || 10; // from select option values

                const riskAmount = balance * (riskPercent / 100);
                const lotSize = riskAmount / (stopPips * pipValuePerLot);

                // Convert to mini/micro for readability
                const standardLots = lotSize.toFixed(2);
                const miniLots = (lotSize * 10).toFixed(1);
                const microLots = (lotSize * 100).toFixed(0);

                resultDiv.innerHTML = `
                📊 <strong>Recommended lot size:</strong><br>
                • ${standardLots} standard lots<br>
                • ${miniLots} mini lots<br>
                • ${microLots} micro lots<br>
                💵 <strong>Dollar risk:</strong> $${riskAmount.toFixed(2)} (${riskPercent}% of $${balance})
            `;
            });
        }
    }

    function initRiskRewardSimulator() {
        const riskSlider = document.getElementById('riskPips');
        const rewardSlider = document.getElementById('rewardPips');
        const riskSpan = document.getElementById('riskValue');
        const rewardSpan = document.getElementById('rewardValue');
        const calcBtn = document.getElementById('rrCalcBtn');
        const resultDiv = document.getElementById('rrResult');

        if (riskSlider && rewardSlider && riskSpan && rewardSpan && calcBtn && resultDiv) {
            // Update displayed values when sliders move
            riskSlider.addEventListener('input', function() {
                riskSpan.textContent = this.value;
            });
            rewardSlider.addEventListener('input', function() {
                rewardSpan.textContent = this.value;
            });

            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const risk = parseInt(riskSlider.value);
                const reward = parseInt(rewardSlider.value);
                const ratio = (reward / risk).toFixed(2);
                const breakEvenWinRate = (1 / (1 + reward/risk) * 100).toFixed(1);

                resultDiv.innerHTML = `
                📈 <strong>Risk‑Reward Ratio:</strong> 1:${ratio}<br>
                ⚖️ <strong>Break‑even win rate:</strong> ${breakEvenWinRate}%<br>
                <small style="color: var(--gray-color);">If your win rate is above ${breakEvenWinRate}%, you're profitable.</small>
            `;
            });
        }
    }

    function initPsychologySimulator() {
        const revengeBtn = document.getElementById('psychoRevenge');
        const fomoBtn = document.getElementById('psychoFomo');
        const overconfBtn = document.getElementById('psychoOverconf');
        const fearBtn = document.getElementById('psychoFear');
        const resultDiv = document.getElementById('psychoResult');

        if (revengeBtn && fomoBtn && overconfBtn && fearBtn && resultDiv) {
            revengeBtn.addEventListener('click', function() {
                resultDiv.innerHTML = `
                <strong style="color:#ff6b35;">Revenge Trading:</strong> You double your position size to recover a $200 loss.<br>
                The market reverses again. You lose $600. Your account drops 12%.<br>
                <span style="color: var(--gray-color);">"I should have walked away."</span>
            `;
            });

            fomoBtn.addEventListener('click', function() {
                resultDiv.innerHTML = `
                <strong style="color:#ff6b35;">FOMO:</strong> You see EUR/USD rally 50 pips and jump in late.<br>
                Price immediately retraces 30 pips. You exit with a loss, missing the next real setup.<br>
                <span style="color: var(--gray-color);">"Why did I chase?"</span>
            `;
            });

            overconfBtn.addEventListener('click', function() {
                resultDiv.innerHTML = `
                <strong style="color:#ff6b35;">Overconfidence:</strong> After 5 winning trades, you risk 5% per trade.<br>
                One loss wipes out half your profits. You're back to square one.<br>
                <span style="color: var(--gray-color);">"Pride comes before the fall."</span>
            `;
            });

            fearBtn.addEventListener('click', function() {
                resultDiv.innerHTML = `
                <strong style="color:#ff6b35;">Fear:</strong> A perfect setup appears, but you hesitate.<br>
                Price moves 40 pips without you. You enter late and get stopped out.<br>
                <span style="color: var(--gray-color);">"Fear made me miss the move and then lose."</span>
            `;
            });
        }
    }

    function initDemoChecklist() {
        const checkboxes = document.querySelectorAll('.demo-checkbox');
        const progressDiv = document.getElementById('checklistProgress');
        const resetBtn = document.getElementById('resetChecklist');

        if (!checkboxes.length || !progressDiv || !resetBtn) return;

        // Load saved state from localStorage
        const savedState = JSON.parse(localStorage.getItem('forexDemoChecklist')) || [];
        checkboxes.forEach((cb, index) => {
            if (savedState[index]) {
                cb.checked = true;
            }
            cb.addEventListener('change', updateProgress);
        });

        function updateProgress() {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            progressDiv.textContent = `Progress: ${checkedCount}/${checkboxes.length} steps completed`;

            // Save state
            const state = Array.from(checkboxes).map(cb => cb.checked);
            localStorage.setItem('forexDemoChecklist', JSON.stringify(state));
        }

        resetBtn.addEventListener('click', function() {
            checkboxes.forEach(cb => cb.checked = false);
            updateProgress();
        });

        // Initial update
        updateProgress();
    }

    function initOrderScenarioTool() {
        const buttons = document.querySelectorAll('.scenario-btn');
        if (!buttons.length) return;

        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const scenario = this.dataset.scenario;
                const answer = this.dataset.answer;
                let feedback = '';

                // Define correct answers
                const correctAnswers = {
                    1: 'limit',
                    2: 'stop',
                    3: 'stop'
                };

                const feedbackDiv = document.getElementById(`scenario${scenario}-feedback`);
                if (!feedbackDiv) return;

                if (answer === correctAnswers[scenario]) {
                    feedback = '✅ Correct! Well done.';
                    this.style.backgroundColor = '#10b981';
                    this.style.color = 'white';
                } else {
                    feedback = '❌ Not quite. Check the explanations above and try again.';
                    this.style.backgroundColor = '#ef4444';
                    this.style.color = 'white';
                }

                feedbackDiv.innerHTML = feedback;
            });
        });
    }

    function initTechnicalAnalysisScenarios() {
        const buttons = document.querySelectorAll('.ta-btn');
        if (!buttons.length) return;

        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const scenario = this.dataset.scenario;
                const answer = this.dataset.answer;
                let feedback = '';

                // Define correct answers
                const correctAnswers = {
                    1: 'uptrend',
                    2: 'support',
                    3: 'breakout'
                };

                const feedbackDiv = document.getElementById(`ta${scenario}-feedback`);
                if (!feedbackDiv) return;

                // Reset all buttons in this scenario (optional: remove previous colors)
                const parentDiv = this.closest('div');
                const allBtns = parentDiv.querySelectorAll('.ta-btn');
                allBtns.forEach(btn => {
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                });

                if (answer === correctAnswers[scenario]) {
                    feedback = '✅ Correct! Well done.';
                    this.style.backgroundColor = '#10b981';
                    this.style.color = 'white';
                } else {
                    feedback = '❌ Not quite. Review the concepts and try again.';
                    this.style.backgroundColor = '#ef4444';
                    this.style.color = 'white';
                }

                feedbackDiv.innerHTML = feedback;
            });
        });
    }

    function initJournalBuilder() {
        const buildBtn = document.getElementById('buildJournalBtn');
        const previewDiv = document.getElementById('journalPreview');

        if (!buildBtn || !previewDiv) return;

        buildBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Get values from form
            const date = document.getElementById('journalDate')?.value || '2025-01-01';
            const pair = document.getElementById('journalPair')?.value || 'EUR/USD';
            const direction = document.getElementById('journalDirection')?.value || 'Long';
            const entry = parseFloat(document.getElementById('journalEntry')?.value) || 1.1050;
            const stop = parseFloat(document.getElementById('journalStop')?.value) || 1.1020;
            const target = parseFloat(document.getElementById('journalTarget')?.value) || 1.1110;
            const lots = parseFloat(document.getElementById('journalLots')?.value) || 0.5;
            const outcome = document.getElementById('journalOutcome')?.value || 'Win';
            const notes = document.getElementById('journalNotes')?.value || 'Bounced from support';

            // Simple calculations
            const isLong = direction === 'Long';
            const riskPips = isLong ? (entry - stop) : (stop - entry);
            const rewardPips = isLong ? (target - entry) : (entry - target);
            const pipValue = lots * 10; // approximate for major pairs
            const riskAmount = riskPips * pipValue;
            const rewardAmount = rewardPips * pipValue;
            const riskReward = (rewardPips / riskPips).toFixed(2);

            // Build preview text
            const preview = `
📅 Date: ${date}
💱 Pair: ${pair}
📈 Direction: ${direction}
💰 Entry: ${entry.toFixed(4)} | Stop: ${stop.toFixed(4)} | Target: ${target.toFixed(4)}
📊 Lots: ${lots} | Risk: ${riskPips.toFixed(1)} pips ($${riskAmount.toFixed(2)}) | Reward: ${rewardPips.toFixed(1)} pips ($${rewardAmount.toFixed(2)})
⚖️ Risk/Reward: 1:${riskReward}
📌 Outcome: ${outcome}
📝 Notes: ${notes}
        `;

            previewDiv.textContent = preview;
        });
    }

    function initFundamentalSimulator() {
        const calcBtn = document.getElementById('fundamentalCalcBtn');
        const indicatorSelect = document.getElementById('indicatorSelect');
        const pairSelect = document.getElementById('pairSelectFundamental');
        const actualSelect = document.getElementById('actualSelect');
        const resultDiv = document.getElementById('fundamentalResult');

        if (!calcBtn || !indicatorSelect || !pairSelect || !actualSelect || !resultDiv) return;

        // Dummy impact data
        const impacts = {
            rate: {
                beat: (pair) => `If the central bank raises rates more than expected, the currency typically strengthens. For ${pair}, expect bullish momentum.`,
                miss: (pair) => `If the central bank holds or cuts rates unexpectedly, the currency typically weakens. For ${pair}, expect bearish pressure.`,
                inline: (pair) => `Rates in line with expectations often cause limited reaction, but focus shifts to the policy statement.`
            },
            nfp: {
                beat: (pair) => `Strong NFP beat suggests a robust US economy, bullish for USD. ${pair} likely to move in direction of USD strength.`,
                miss: (pair) => `Weak NFP suggests economic slowdown, bearish for USD. ${pair} likely to move in direction of USD weakness.`,
                inline: (pair) => `NFP in line with expectations – watch for revisions and unemployment rate for cues.`
            },
            cpi: {
                beat: (pair) => `Higher inflation may force rate hikes, bullish for the currency. For ${pair}, expect strength in the currency whose CPI beat.`,
                miss: (pair) => `Lower inflation may lead to rate cuts, bearish for the currency. For ${pair}, expect weakness.`,
                inline: (pair) => `CPI in line – focus on core CPI and forward guidance.`
            },
            gdp: {
                beat: (pair) => `Stronger‑than‑expected GDP growth supports a stronger currency. ${pair} likely to rally.`,
                miss: (pair) => `Weaker GDP suggests economic contraction, bearish for the currency. ${pair} likely to fall.`,
                inline: (pair) => `GDP in line – market may ignore if other data conflicts.`
            },
            unemployment: {
                beat: (pair) => `Lower unemployment is positive for the economy and currency. ${pair} may strengthen.`,
                miss: (pair) => `Higher unemployment is negative, currency may weaken.`,
                inline: (pair) => `Unemployment in line – little immediate impact.`
            },
            retail: {
                beat: (pair) => `Strong retail sales indicate consumer confidence, bullish for currency.`,
                miss: (pair) => `Weak retail sales indicate economic slowdown, bearish.`,
                inline: (pair) => `In line – minimal reaction.`
            }
        };

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const indicator = indicatorSelect.value;
            const pair = pairSelect.value;
            const actual = actualSelect.value;
            const impactFunc = impacts[indicator]?.[actual];
            if (impactFunc) {
                resultDiv.innerHTML = `<strong>Simulation:</strong> ${impactFunc(pair)}`;
            } else {
                resultDiv.innerHTML = `No data available for this combination.`;
            }
        });
    }

    function initStrategyBuilder() {
        const buildBtn = document.getElementById('strategyBuildBtn');
        const entrySelect = document.getElementById('entryCondition');
        const stopSelect = document.getElementById('stopPlacement');
        const tpSelect = document.getElementById('tpMethod');
        const previewDiv = document.getElementById('strategyPreview');

        if (!buildBtn || !entrySelect || !stopSelect || !tpSelect || !previewDiv) return;

        const entryDescriptions = {
            macrossover: "You enter when the fast moving average crosses above (long) or below (short) the slow moving average.",
            rsioverbought: "You enter a long trade when RSI drops below 30 (oversold) and then crosses back above 30.",
            rsioversold: "You enter a short trade when RSI rises above 70 (overbought) and then crosses back below 70.",
            supportbounce: "You enter a long trade when price bounces off a confirmed support level with a bullish candlestick pattern.",
            resistancebreak: "You enter a long trade when price breaks above a resistance level with strong momentum (or short on breakdown)."
        };

        const stopDescriptions = {
            swing: "Your stop loss is placed just below the recent swing low (for longs) or above the recent swing high (for shorts).",
            atr: "Your stop loss is set at 1.5 times the Average True Range (ATR) from your entry.",
            fixed: "Your stop loss is a fixed 30 pips from entry.",
            ema: "Your stop loss is placed just below the fast EMA (for longs) or above the fast EMA (for shorts)."
        };

        const tpDescriptions = {
            rr2: "Your take profit is set at a level that gives you a 1:2 risk‑reward ratio.",
            rr3: "Your take profit is set at a level that gives you a 1:3 risk‑reward ratio.",
            resistance: "Your take profit is placed at a previous resistance level (for longs) or support level (for shorts).",
            ema: "You exit when the fast EMA crosses back below (for longs) or above (for shorts) the slow EMA."
        };

        buildBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const entry = entrySelect.value;
            const stop = stopSelect.value;
            const tp = tpSelect.value;

            const entryText = entryDescriptions[entry] || "Unknown entry rule.";
            const stopText = stopDescriptions[stop] || "Unknown stop placement.";
            const tpText = tpDescriptions[tp] || "Unknown take profit method.";

            previewDiv.innerHTML = `
            <strong>Your custom strategy:</strong><br><br>
            <strong>Entry:</strong> ${entryText}<br>
            <strong>Stop loss:</strong> ${stopText}<br>
            <strong>Take profit:</strong> ${tpText}<br><br>
            <span style="color: var(--gray-color);">Remember to define position sizing (e.g., 1% risk per trade) and test on a demo first.</span>
        `;
        });
    }

    function initCorrelationSimulator() {
        const analyzeBtn = document.getElementById('correlateBtn');
        const pairASelect = document.getElementById('pairA');
        const pairBSelect = document.getElementById('pairB');
        const resultDiv = document.getElementById('correlationResult');

        if (!analyzeBtn || !pairASelect || !pairBSelect || !resultDiv) return;

        // Dummy correlation matrix (simplified typical relationships)
        const correlations = {
            'EUR/USD': {
                'EUR/USD': 1.0,
                'GBP/USD': 0.85,
                'USD/JPY': -0.3,
                'AUD/USD': 0.7,
                'USD/CAD': -0.6,
                'NZD/USD': 0.65,
                'XAU/USD': -0.4
            },
            'GBP/USD': {
                'EUR/USD': 0.85,
                'GBP/USD': 1.0,
                'USD/JPY': -0.25,
                'AUD/USD': 0.75,
                'USD/CAD': -0.55,
                'NZD/USD': 0.7,
                'XAU/USD': -0.35
            },
            'USD/JPY': {
                'EUR/USD': -0.3,
                'GBP/USD': -0.25,
                'USD/JPY': 1.0,
                'AUD/USD': -0.4,
                'USD/CAD': 0.5,
                'NZD/USD': -0.35,
                'XAU/USD': 0.2
            },
            'AUD/USD': {
                'EUR/USD': 0.7,
                'GBP/USD': 0.75,
                'USD/JPY': -0.4,
                'AUD/USD': 1.0,
                'USD/CAD': -0.65,
                'NZD/USD': 0.85,
                'XAU/USD': -0.3
            },
            'USD/CAD': {
                'EUR/USD': -0.6,
                'GBP/USD': -0.55,
                'USD/JPY': 0.5,
                'AUD/USD': -0.65,
                'USD/CAD': 1.0,
                'NZD/USD': -0.6,
                'XAU/USD': 0.4
            },
            'NZD/USD': {
                'EUR/USD': 0.65,
                'GBP/USD': 0.7,
                'USD/JPY': -0.35,
                'AUD/USD': 0.85,
                'USD/CAD': -0.6,
                'NZD/USD': 1.0,
                'XAU/USD': -0.25
            },
            'XAU/USD': {
                'EUR/USD': -0.4,
                'GBP/USD': -0.35,
                'USD/JPY': 0.2,
                'AUD/USD': -0.3,
                'USD/CAD': 0.4,
                'NZD/USD': -0.25,
                'XAU/USD': 1.0
            }
        };

        analyzeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const pairA = pairASelect.value;
            const pairB = pairBSelect.value;

            if (pairA === pairB) {
                resultDiv.innerHTML = `<strong>Same pair:</strong> Perfect correlation (1.0). A direct hedge (long and short) would lock in no profit/loss except swap costs.`;
                return;
            }

            const corr = correlations[pairA]?.[pairB];
            if (corr === undefined) {
                resultDiv.innerHTML = `Correlation data not available.`;
                return;
            }

            const absCorr = Math.abs(corr);
            let strength = '';
            if (absCorr > 0.7) strength = 'strong';
            else if (absCorr > 0.4) strength = 'moderate';
            else strength = 'weak';

            const direction = corr > 0 ? 'positively' : 'negatively';
            const hedgeAdvice = corr > 0.5
                ? `These pairs are strongly positively correlated. To hedge a long position in ${pairA}, consider shorting a smaller amount of ${pairB} (ratio approx ${absCorr.toFixed(2)} lots per lot).`
                : corr < -0.5
                    ? `These pairs are strongly negatively correlated. To hedge a long position in ${pairA}, consider longing ${pairB} (ratio approx ${absCorr.toFixed(2)} lots per lot).`
                    : `Correlation is weak. Hedging with these pairs may not be effective.`;

            resultDiv.innerHTML = `
            <strong>Correlation between ${pairA} and ${pairB}:</strong> ${corr.toFixed(2)} (${strength} ${direction} correlation)<br>
            ${hedgeAdvice}
        `;
        });
    }

    function initDemoToLiveReadiness() {
        const checkBtn = document.getElementById('readinessBtn');
        const q1 = document.getElementById('q1');
        const q2 = document.getElementById('q2');
        const q3 = document.getElementById('q3');
        const q4 = document.getElementById('q4');
        const q5 = document.getElementById('q5');
        const resultDiv = document.getElementById('readinessResult');

        if (!checkBtn || !q1 || !q2 || !q3 || !q4 || !q5 || !resultDiv) return;

        checkBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const score1 = parseInt(q1.value) || 0;
            const score2 = parseInt(q2.value) || 0;
            const score3 = parseInt(q3.value) || 0;
            const score4 = parseInt(q4.value) || 0;
            const score5 = parseInt(q5.value) || 0;

            const total = score1 + score2 + score3 + score4 + score5;
            const maxScore = 15; // 5 questions * 3

            let verdict = '';
            let advice = '';

            if (total >= 12) {
                verdict = '✅ You are ready to transition!';
                advice = 'Your demo experience and discipline are solid. Start with a small live account, micro lots, and stick to your plan.';
            } else if (total >= 8) {
                verdict = '⚠️ You are close, but need more preparation.';
                advice = 'Focus on the areas where you scored low. Consider trading demo for another month while working on consistency and emotional control.';
            } else {
                verdict = '❌ Not yet ready.';
                advice = 'Spend more time on demo, build a consistent track record, and work on your trading psychology. The market will wait for you.';
            }

            resultDiv.innerHTML = `
            <strong>Your readiness score:</strong> ${total}/${maxScore}<br>
            <strong>${verdict}</strong><br>
            <span style="color: var(--gray-color);">${advice}</span>
        `;
        });
    }

})();
