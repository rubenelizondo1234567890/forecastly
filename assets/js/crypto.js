/* assets/js/crypto.js */

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.userLoggedIn) {
            // User is logged in – initialise all interactive features
            initBitcoinPowerSimulator();
            initBlockchainDemo();
            initWalletRiskSimulator();
            initExchangeMatchmaker();
            initEmotionalSimulator();
            initScamIdentifier();
            initHardwareWalletSimulator();
            initAllocationCalculator();
            initExchangeSetupSimulator();
            initPurchaseSimulator();
            initWithdrawalSimulator();
            initTaxSimulator();
            initDeFiSimulator();
            initYieldSimulator();
            initNFTUtilityChecker();
            initAdvancedSecuritySimulator();
        }
    });

    function initBitcoinPowerSimulator() {
        const simulateBtn = document.getElementById('simulateBtn');
        const amountInput = document.getElementById('btcAmount');
        const yearSelect = document.getElementById('yearSelect');
        const resultDiv = document.getElementById('simulatorResult');

        if (!simulateBtn || !amountInput || !yearSelect || !resultDiv) return;

        // Approximate Bitcoin prices at the start of each year (USD)
        const prices = {
            '2020': 7200,
            '2017': 1000,
            '2015': 300,
            '2013': 100,
            '2011': 5
        };
        const currentPrice = 50000; // approximate current BTC price

        simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const amount = parseFloat(amountInput.value) || 100;
            const year = yearSelect.value;
            const pastPrice = prices[year];
            if (!pastPrice) return;

            const btcBought = amount / pastPrice;
            const currentValue = btcBought * currentPrice;
            const multiple = (currentValue / amount).toFixed(1);

            resultDiv.innerHTML = `
                💰 If you had invested $${amount} in ${year}, you would have bought approximately ${btcBought.toFixed(4)} BTC.<br>
                📈 Today that would be worth <strong>$${currentValue.toFixed(2)}</strong> (${multiple}x your money).
            `;
        });
    }

    function initBlockchainDemo() {
        const demoContainer = document.getElementById('blockchain-demo');
        if (!demoContainer) return; // not on blockchain basics page

        // Simple Block class for demo purposes
        class Block {
            constructor(index, timestamp, transactions, previousHash = '') {
                this.index = index;
                this.timestamp = timestamp;
                this.transactions = transactions;
                this.previousHash = previousHash;
                this.hash = this.calculateHash();
            }
            calculateHash() {
                // Simple hash simulation (not real crypto)
                let data = this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash;
                let hash = 0;
                for (let i = 0; i < data.length; i++) {
                    hash = ((hash << 5) - hash) + data.charCodeAt(i);
                    hash |= 0; // Convert to 32-bit integer
                }
                // Convert to positive hex-like string
                return Math.abs(hash).toString(16).padStart(8, '0');
            }
        }

        class SimpleBlockchain {
            constructor() {
                this.chain = [this.createGenesisBlock()];
                this.pendingTransactions = [];
            }
            createGenesisBlock() {
                return new Block(0, Date.now(), ['Genesis Block'], '0');
            }
            getLatestBlock() {
                return this.chain[this.chain.length - 1];
            }
            addTransaction(transaction) {
                this.pendingTransactions.push(transaction);
            }
            minePendingTransactions() {
                if (this.pendingTransactions.length === 0) return false;
                let block = new Block(
                    this.chain.length,
                    Date.now(),
                    [...this.pendingTransactions],
                    this.getLatestBlock().hash
                );
                this.chain.push(block);
                this.pendingTransactions = [];
                return true;
            }
            reset() {
                this.chain = [this.createGenesisBlock()];
                this.pendingTransactions = [];
            }
        }

        // Initialize a new blockchain for this session
        const blockchain = new SimpleBlockchain();

        // DOM elements
        const txInput = document.getElementById('txInput');
        const addTxBtn = document.getElementById('addTxBtn');
        const mineBlockBtn = document.getElementById('mineBlockBtn');
        const resetChainBtn = document.getElementById('resetChainBtn');
        const pendingList = document.getElementById('pendingList');
        const chainDisplay = document.getElementById('chainDisplay');
        const demoMessage = document.getElementById('demoMessage');

        if (!txInput || !addTxBtn || !mineBlockBtn || !resetChainBtn || !pendingList || !chainDisplay || !demoMessage) return;

        function updateUI() {
            // Update pending transactions
            if (blockchain.pendingTransactions.length === 0) {
                pendingList.innerText = 'None';
            } else {
                pendingList.innerText = blockchain.pendingTransactions.join(' | ');
            }

            // Display chain
            chainDisplay.innerHTML = '';
            blockchain.chain.forEach((block) => {
                const blockDiv = document.createElement('div');
                blockDiv.className = 'block-item';
                blockDiv.style.cssText = 'background: white; border-radius: 12px; padding: 15px; border-left: 6px solid var(--crypto-color); box-shadow: var(--shadow); margin-bottom: 10px;';
                blockDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Block #${block.index}</strong>
                        <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 8px;">${block.hash}</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9rem;">
                        <div>Previous hash: <span style="font-family: monospace;">${block.previousHash}</span></div>
                        <div>Transactions: ${block.transactions.join('; ')}</div>
                        <div style="color: var(--gray-color);">Time: ${new Date(block.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
                chainDisplay.appendChild(blockDiv);
            });
        }

        addTxBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let tx = txInput.value.trim();
            if (tx === '') tx = 'Sample transaction';
            blockchain.addTransaction(tx);
            txInput.value = '';
            updateUI();
        });

        mineBlockBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const mined = blockchain.minePendingTransactions();
            if (mined) {
                demoMessage.innerText = '✅ Block mined! Notice how the hash changed.';
            } else {
                demoMessage.innerText = '⚠️ No pending transactions to mine.';
            }
            updateUI();
        });

        resetChainBtn.addEventListener('click', function(e) {
            e.preventDefault();
            blockchain.reset();
            demoMessage.innerText = '🔄 Blockchain reset to genesis.';
            updateUI();
        });

        // Initial UI
        updateUI();
    }

    function initWalletRiskSimulator() {
        const resultDiv = document.getElementById('riskResult');
        const custodialHack = document.getElementById('custodialHackBtn');
        const custodialLost = document.getElementById('custodialLostBtn');
        const selfHack = document.getElementById('selfHackBtn');
        const selfLost = document.getElementById('selfLostBtn');

        if (!resultDiv || !custodialHack || !custodialLost || !selfHack || !selfLost) return;

        custodialHack.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 1.5rem; margin-right: 10px;"></i>
            <strong>Exchange hacked:</strong> If the exchange is insolvent, your funds could be lost. You're relying on their security and insurance.
            In past exchange failures (Mt. Gox, FTX), users often recovered little or nothing.
        `;
        });

        custodialLost.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-key" style="color: #10b981; font-size: 1.5rem; margin-right: 10px;"></i>
            <strong>Lost password:</strong> With most custodial wallets, you can reset your password via email or customer support.
            Your funds are safe as long as the exchange exists and you can verify your identity.
        `;
        });

        selfHack.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-skull-crosswind" style="color: #ef4444; font-size: 1.5rem; margin-right: 10px;"></i>
            <strong>Malware on your device:</strong> If your computer is infected, hackers could steal your private keys from a software wallet.
            Hardware wallets protect against this because keys never leave the device.
        `;
        });

        selfLost.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-frown" style="color: #ef4444; font-size: 1.5rem; margin-right: 10px;"></i>
            <strong>Lost seed phrase:</strong> Without your seed, your funds are gone forever. There's no "forgot password" option.
            This is why backing up your seed phrase (offline) is critical.
        `;
        });
    }

    function initExchangeMatchmaker() {
        const feeSlider = document.getElementById('feeSlider');
        const securitySlider = document.getElementById('securitySlider');
        const coinSlider = document.getElementById('coinSlider');
        const matchBtn = document.getElementById('matchBtn');
        const resultDiv = document.getElementById('matchResult');

        if (!feeSlider || !securitySlider || !coinSlider || !matchBtn || !resultDiv) return;

        function getRecommendation(fee, security, coin) {
            // Simple logic: if security and control are high, recommend DEX; if low fees and many coins, recommend CEX; else mixed
            if (security > 70 && coin < 50) {
                return "🔐 You value security and control above all – a **decentralized exchange (DEX)** like Uniswap or PancakeSwap is your best bet. You'll hold your own keys, but be ready for a steeper learning curve.";
            } else if (fee > 70 && coin > 60) {
                return "💰 You want low fees and lots of coin choices – a major **centralized exchange (CEX)** like Binance or Kraken offers both. Just remember they hold your funds.";
            } else if (fee < 30 && security < 30 && coin < 30) {
                return "🤔 It seems you're not too concerned about any factor. Maybe start with a user‑friendly CEX like **Coinbase** to get comfortable.";
            } else {
                return "⚖️ Your preferences are balanced. A reputable **centralized exchange** like Kraken or Gemini offers good security and a decent coin selection. If you're more advanced, you could also explore DEXs.";
            }
        }

        matchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const fee = parseInt(feeSlider.value);
            const security = parseInt(securitySlider.value);
            const coin = parseInt(coinSlider.value);
            const recommendation = getRecommendation(fee, security, coin);
            resultDiv.innerHTML = `<i class="fas fa-hand-holding-heart" style="color: var(--crypto-color); margin-right: 10px;"></i> ${recommendation}`;
        });
    }

    function initEmotionalSimulator() {
        const crashBtn = document.getElementById('scenarioCrashBtn');
        const pumpBtn = document.getElementById('scenarioPumpBtn');
        const whaleBtn = document.getElementById('scenarioWhaleBtn');
        const newsBtn = document.getElementById('scenarioNewsBtn');
        const resultDiv = document.getElementById('emotionResult');

        if (!crashBtn || !pumpBtn || !whaleBtn || !newsBtn || !resultDiv) return;

        crashBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-face-frown" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>😨 Emotional response:</strong> Panic! You sell everything to avoid further loss. Later the price recovers – you locked in losses.<br>
            <strong>🧘 Rational response:</strong> You review your investment thesis. If fundamentals are still strong, you hold or even buy more at a discount.
        `;
        });

        pumpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-face-grin-stars" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>😈 Emotional response:</strong> FOMO! You buy more at the peak, convinced it will go higher. Then it corrects, and you're in the red.<br>
            <strong>🧘 Rational response:</strong> You stick to your plan. If you already have a target allocation, you don't chase pumps. You consider taking profits.
        `;
        });

        whaleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-fish" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>😨 Emotional response:</strong> Fear that the "whale" knows something. You sell in a panic, assuming the price will keep dropping.<br>
            <strong>🧘 Rational response:</strong> You recognize that large holders can move markets temporarily. You wait for the dust to settle before acting.
        `;
        });

        newsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-newspaper" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>😠 Emotional response:</strong> You react immediately to the headline, selling or buying based on fear or hype without verifying facts.<br>
            <strong>🧘 Rational response:</strong> You research the news source, check multiple perspectives, and consider whether it actually affects long-term value.
        `;
        });
    }

    function initScamIdentifier() {
        const giveawayBtn = document.getElementById('scamGiveawayBtn');
        const phishingBtn = document.getElementById('scamPhishingBtn');
        const pumpBtn = document.getElementById('scamPumpBtn');
        const romanceBtn = document.getElementById('scamRomanceBtn');
        const exchangeBtn = document.getElementById('scamExchangeBtn');
        const rugBtn = document.getElementById('scamRugBtn');
        const resultDiv = document.getElementById('scamResult');

        if (!giveawayBtn || !phishingBtn || !pumpBtn || !romanceBtn || !exchangeBtn || !rugBtn || !resultDiv) return;

        giveawayBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-gift" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🎁 Fake Giveaway</strong><br>
            <strong>Red flags:</strong> “Elon Musk is giving away 10,000 BTC!” – usually from impersonated accounts. They ask you to send a small amount first.<br>
            <strong>How to avoid:</strong> Legitimate giveaways don't ask for money. Always check verified handles and official websites.
        `;
        });

        phishingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-envelope" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>📧 Phishing</strong><br>
            <strong>Red flags:</strong> Urgent emails with links, misspelled URLs, requests for private keys or 2FA codes.<br>
            <strong>How to avoid:</strong> Never click links in unsolicited emails. Type the exchange URL manually. Enable 2FA and use a password manager.
        `;
        });

        pumpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-arrow-trend-up" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>📈 Pump & Dump</strong><br>
            <strong>Red flags:</strong> Sudden hype in Telegram/Discord about a low‑cap coin, promises of “guaranteed x10”. Charts show a spike then crash.<br>
            <strong>How to avoid:</strong> Don't buy based on anonymous tips. Research the project; if it has no real value, stay away.
        `;
        });

        romanceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-heart" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>💔 Romance Scam</strong><br>
            <strong>Red flags:</strong> Someone you met online quickly professes love, but can't meet in person. Eventually asks for crypto for an “emergency” or “investment”.<br>
            <strong>How to avoid:</strong> Never send money to someone you haven't met in real life. Reverse‑image search their photos.
        `;
        });

        exchangeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-building" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🏢 Fake Exchange</strong><br>
            <strong>Red flags:</strong> Unrealistic bonuses, poor website design, no company info, withdrawal issues.<br>
            <strong>How to avoid:</strong> Only use well‑known exchanges. Check reviews on Trustpilot and forums. Start with a small test withdrawal.
        `;
        });

        rugBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-robot" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🧨 Rug Pull</strong><br>
            <strong>Red flags:</strong> Anonymous developers, locked liquidity? (if not locked, it's risky). Hype without a working product.<br>
            <strong>How to avoid:</strong> Check if liquidity is locked on sites like RugDoc. Look for audits and doxxed teams.
        `;
        });
    }

    function initHardwareWalletSimulator() {
        const step1 = document.getElementById('step1Btn');
        const step2 = document.getElementById('step2Btn');
        const step3 = document.getElementById('step3Btn');
        const step4 = document.getElementById('step4Btn');
        const resultDiv = document.getElementById('setupResult');

        if (!step1 || !step2 || !step3 || !step4 || !resultDiv) return;

        step1.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-power-off" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 1: Initialize Device</strong><br>
            Connect your hardware wallet to your computer via USB (or Bluetooth for some models). Follow the on‑screen prompts to set it up as a new device. The device will generate a random seed phrase internally.
        `;
        });

        step2.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-pencil" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 2: Write Down Seed Phrase</strong><br>
            The device will display 12–24 words. <strong>Write them down in order on the provided recovery sheet.</strong> Never type them into a computer or take a photo. Store the sheet in a safe place (e.g., safe deposit box). This is your backup.
        `;
        });

        step3.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-lock" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 3: Set PIN</strong><br>
            Choose a strong PIN (4–8 digits). This protects the device from physical theft. If someone enters the wrong PIN too many times, the device wipes itself (but your funds are safe because you have the seed phrase).
        `;
        });

        step4.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-download" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 4: Install Apps & Receive Crypto</strong><br>
            Install the corresponding desktop/mobile app (e.g., Ledger Live, Trezor Suite). Add blockchain apps for the coins you want (Bitcoin, Ethereum, etc.). Then generate a receive address on the device and confirm it matches the one on screen. Now you can safely transfer crypto to that address.
        `;
        });
    }

    function initAllocationCalculator() {
        const ageSlider = document.getElementById('ageSlider');
        const riskSlider = document.getElementById('riskSlider');
        const savingsSlider = document.getElementById('savingsSlider');
        const ageValue = document.getElementById('ageValue');
        const riskValue = document.getElementById('riskValue');
        const savingsValue = document.getElementById('savingsValue');
        const calcBtn = document.getElementById('calculateAllocationBtn');
        const resultDiv = document.getElementById('allocationResult');

        if (!ageSlider || !riskSlider || !savingsSlider || !calcBtn || !resultDiv) return;

        // Update displayed values
        ageSlider.addEventListener('input', () => { ageValue.textContent = ageSlider.value; });
        riskSlider.addEventListener('input', () => { riskValue.textContent = riskSlider.value; });
        savingsSlider.addEventListener('input', () => { savingsValue.textContent = savingsSlider.value; });

        calcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const age = parseInt(ageSlider.value);
            const risk = parseInt(riskSlider.value);
            const savings = parseInt(savingsSlider.value);

            // Simple heuristic: younger + higher risk + higher savings = higher allocation
            let base = 5; // 5% as starting point
            // Age factor: younger = more risk
            if (age < 30) base += 2;
            else if (age > 50) base -= 2;
            // Risk factor (1-10) maps to -2 to +3
            base += (risk - 5) * 0.8;
            // Savings factor: if savings > 15%, add 1; if <5%, subtract 1
            if (savings >= 15) base += 1.5;
            else if (savings <= 5) base -= 1.5;

            // Clamp to reasonable range 1% - 15%
            let allocation = Math.min(15, Math.max(1, Math.round(base * 10) / 10));

            let recommendation = '';
            if (allocation < 3) recommendation = 'You may prefer a very conservative allocation. Focus on safety first.';
            else if (allocation < 6) recommendation = 'A moderate allocation keeps you in the game without excessive risk.';
            else if (allocation < 10) recommendation = 'You have a higher risk tolerance – consider a growth‑oriented allocation.';
            else recommendation = 'You are very aggressive. Make sure you understand the risks and have a long time horizon.';

            resultDiv.innerHTML = `
            <i class="fas fa-chart-pie" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Suggested crypto allocation: ${allocation}% of your portfolio.</strong><br>
            ${recommendation}
        `;
        });
    }

    function initExchangeSetupSimulator() {
        const step1 = document.getElementById('setupStep1Btn');
        const step2 = document.getElementById('setupStep2Btn');
        const step3 = document.getElementById('setupStep3Btn');
        const step4 = document.getElementById('setupStep4Btn');
        const step5 = document.getElementById('setupStep5Btn');
        const resultDiv = document.getElementById('setupStepResult');

        if (!step1 || !step2 || !step3 || !step4 || !step5 || !resultDiv) return;

        step1.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-search" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 1: Choose an Exchange</strong><br>
            Research top exchanges like Coinbase, Kraken, or Binance. Compare fees, supported coins, and security features. Read recent user reviews on Trustpilot and Reddit. Avoid unknown platforms with too‑good‑to‑be‑true offers.
        `;
        });

        step2.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-envelope" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 2: Sign Up</strong><br>
            Go to the official website (double‑check the URL!). Click “Sign Up” and enter your email and a strong password. Use a password manager to generate and store a unique password. Verify your email via the link they send.
        `;
        });

        step3.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-id-card" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 3: KYC Verification</strong><br>
            You'll be asked to provide personal information: full name, date of birth, address. Then upload a photo of your government‑issued ID (passport or driver's license). You may also need to take a selfie or record a short video. This process can take a few minutes to a few days.
        `;
        });

        step4.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-lock" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 4: Enable Two‑Factor Authentication (2FA)</strong><br>
            Download an authenticator app like Google Authenticator or Authy. Scan the QR code displayed on the exchange. Enter the 6‑digit code to confirm. This adds a second layer of security – without it, anyone with your password could access your account.
        `;
        });

        step5.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-money-bill" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Step 5: Deposit Funds</strong><br>
            Navigate to “Deposit” or “Buy”. Choose your currency (USD, EUR, etc.) and payment method – bank transfer is usually cheapest, card is instant but more expensive. Start with a small amount (e.g., $50) to ensure everything works. Once deposited, you're ready to buy crypto!
        `;
        });
    }

    function initPurchaseSimulator() {
        const coinSelect = document.getElementById('coinSelect');
        const fiatAmount = document.getElementById('fiatAmount');
        const orderTypeRadios = document.getElementsByName('orderType');
        const limitPriceContainer = document.getElementById('limitPriceContainer');
        const limitPrice = document.getElementById('limitPrice');
        const simulateBtn = document.getElementById('simulatePurchaseBtn');
        const resultDiv = document.getElementById('purchaseResult');

        if (!coinSelect || !fiatAmount || !orderTypeRadios || !limitPriceContainer || !limitPrice || !simulateBtn || !resultDiv) return;

        // Price data (approximate)
        const prices = { btc: 58430, eth: 2890 };

        // Toggle limit price input visibility
        function toggleLimitPrice() {
            for (let radio of orderTypeRadios) {
                if (radio.checked && radio.value === 'limit') {
                    limitPriceContainer.style.display = 'block';
                    return;
                }
            }
            limitPriceContainer.style.display = 'none';
        }
        for (let radio of orderTypeRadios) {
            radio.addEventListener('change', toggleLimitPrice);
        }

        simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const coin = coinSelect.value;
            const amount = parseFloat(fiatAmount.value) || 100;
            const feeRate = 0.005; // 0.5% trading fee
            let orderType = 'market';
            for (let radio of orderTypeRadios) {
                if (radio.checked) orderType = radio.value;
            }

            let price = prices[coin];
            let limitPriceVal = parseFloat(limitPrice.value) || price;

            if (orderType === 'limit') {
                if (limitPriceVal >= price) {
                    // Limit price is above current market – order would fill immediately (like market)
                    price = limitPriceVal; // but they'd pay their limit price? Actually if limit price is above market, they'd pay market price. For simplicity, we'll use market price and note it.
                    resultDiv.innerHTML = `
                    <i class="fas fa-info-circle" style="color: var(--crypto-color); margin-right: 10px;"></i>
                    <strong>Limit order at $${limitPriceVal.toFixed(2)}</strong><br>
                    Your limit price is above the current market price ($${prices[coin].toFixed(2)}). The order would fill immediately at market price, effectively a market order.<br>
                    <strong>You would receive:</strong> ${((amount * (1 - feeRate)) / prices[coin]).toFixed(6)} ${coin.toUpperCase()}<br>
                    <strong>Fee paid:</strong> $${(amount * feeRate).toFixed(2)}
                `;
                    return;
                } else {
                    // Limit price below market – order won't fill
                    resultDiv.innerHTML = `
                    <i class="fas fa-hourglass-half" style="color: var(--crypto-color); margin-right: 10px;"></i>
                    <strong>Limit order placed at $${limitPriceVal.toFixed(2)}</strong><br>
                    Current market price is $${prices[coin].toFixed(2)}. Your order will only fill if the price drops to your limit. No crypto purchased yet.<br>
                    <strong>If filled:</strong> You would receive ${((amount * (1 - feeRate)) / limitPriceVal).toFixed(6)} ${coin.toUpperCase()} (after fees).
                `;
                    return;
                }
            }

            // Market order
            const cryptoAmount = (amount * (1 - feeRate)) / price;
            resultDiv.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Market order executed!</strong><br>
            You spent <strong>$${amount.toFixed(2)}</strong> to buy <strong>${cryptoAmount.toFixed(6)} ${coin.toUpperCase()}</strong> at $${price.toFixed(2)} per coin.<br>
            <strong>Trading fee (0.5%):</strong> $${(amount * feeRate).toFixed(2)}<br>
            <strong>Final holdings:</strong> ${cryptoAmount.toFixed(6)} ${coin.toUpperCase()} (now in your exchange wallet).
        `;
        });

        // Initialize limit price display
        toggleLimitPrice();
    }

    function initWithdrawalSimulator() {
        const coinSelect = document.getElementById('withdrawCoinSelect');
        const amountInput = document.getElementById('withdrawAmount');
        const addressInput = document.getElementById('walletAddress');
        const simulateBtn = document.getElementById('simulateWithdrawBtn');
        const resultDiv = document.getElementById('withdrawResult');

        if (!coinSelect || !amountInput || !addressInput || !simulateBtn || !resultDiv) return;

        // Fee estimates (in USD)
        const fees = { btc: 2.50, eth: 1.80 };
        const coinNames = { btc: 'Bitcoin', eth: 'Ethereum' };

        simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const coin = coinSelect.value;
            const amount = parseFloat(amountInput.value) || 200;
            const address = addressInput.value.trim();
            const fee = fees[coin];
            const totalDeducted = amount + fee;
            const cryptoAmount = coin === 'btc' ? amount / 58430 : amount / 2890; // approximate prices
            const cryptoAmountWithdrawn = coin === 'btc' ? amount / 58430 : amount / 2890;

            if (!address) {
                resultDiv.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #e74c3c; margin-right: 10px;"></i> Please enter a destination address.`;
                return;
            }

            // Simulate transaction processing
            resultDiv.innerHTML = `
            <i class="fas fa-spinner fa-pulse" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Withdrawal initiated!</strong><br>
            Sending <strong>${cryptoAmountWithdrawn.toFixed(6)} ${coinNames[coin]}</strong> to address:<br>
            <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 8px;">${address.substring(0, 20)}...${address.slice(-10)}</span><br>
            <strong>Network fee:</strong> $${fee.toFixed(2)} (deducted from your balance)<br>
            <strong>Total deducted:</strong> $${totalDeducted.toFixed(2)}<br>
            <strong>Transaction ID (TXID):</strong> <span style="font-family: monospace;">0x${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}</span><br>
            <strong>Status:</strong> Pending (typically confirms in 10–60 minutes)<br>
            <div style="margin-top: 15px; background: #fff3cd; padding: 10px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <i class="fas fa-clock"></i> In reality, you can track progress on a block explorer using the TXID.
            </div>
        `;
        });
    }

    function initTaxSimulator() {
        const buyPriceInput = document.getElementById('buyPrice');
        const sellPriceInput = document.getElementById('sellPrice');
        const holdingPeriodSelect = document.getElementById('holdingPeriod');
        const calculateBtn = document.getElementById('calculateTaxBtn');
        const resultDiv = document.getElementById('taxResult');

        if (!buyPriceInput || !sellPriceInput || !holdingPeriodSelect || !calculateBtn || !resultDiv) return;

        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const buy = parseFloat(buyPriceInput.value) || 0;
            const sell = parseFloat(sellPriceInput.value) || 0;
            const period = holdingPeriodSelect.value;

            if (buy <= 0 || sell <= 0) {
                resultDiv.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Please enter valid positive numbers.`;
                return;
            }

            const gain = sell - buy;
            const gainPercent = ((gain / buy) * 100).toFixed(2);
            const periodText = period === 'short' ? 'short‑term' : 'long‑term';

            // Simulated tax advice (generic)
            let taxAdvice = '';
            if (period === 'short') {
                taxAdvice = 'Short‑term gains are usually taxed as ordinary income (your marginal tax rate).';
            } else {
                taxAdvice = 'Long‑term gains often qualify for reduced tax rates (0%, 15%, or 20% depending on income).';
            }

            if (gain > 0) {
                resultDiv.innerHTML = `
                <i class="fas fa-arrow-up" style="color: #27ae60; margin-right: 10px;"></i>
                <strong>Capital Gain: $${gain.toFixed(2)} (${gainPercent}%)</strong><br>
                This is a <strong>${periodText} gain</strong>. ${taxAdvice}<br>
                <span style="font-size:0.9rem;">Remember to factor in fees and your specific tax bracket.</span>
            `;
            } else if (gain < 0) {
                resultDiv.innerHTML = `
                <i class="fas fa-arrow-down" style="color: #e74c3c; margin-right: 10px;"></i>
                <strong>Capital Loss: $${Math.abs(gain).toFixed(2)} (${gainPercent}%)</strong><br>
                This is a <strong>${periodText} loss</strong>. Losses can offset gains and reduce your tax bill.<br>
                <span style="font-size:0.9rem;">Consult a tax professional for loss harvesting rules.</span>
            `;
            } else {
                resultDiv.innerHTML = `
                <i class="fas fa-equals" style="color: var(--gray-color); margin-right: 10px;"></i>
                <strong>No gain or loss.</strong><br>
                You broke even on this trade – no tax implications.
            `;
            }
        });
    }

    function initDeFiSimulator() {
        const amountInput = document.getElementById('defiAmount');
        const apyInput = document.getElementById('defiApy');
        const yearsInput = document.getElementById('defiYears');
        const simulateBtn = document.getElementById('simulateDefiBtn');
        const resultDiv = document.getElementById('defiResult');

        if (!amountInput || !apyInput || !yearsInput || !simulateBtn || !resultDiv) return;

        simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let amount = parseFloat(amountInput.value) || 0;
            let apy = parseFloat(apyInput.value) || 0;
            let years = parseFloat(yearsInput.value) || 0;

            if (amount <= 0 || apy <= 0 || years <= 0) {
                resultDiv.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Please enter positive numbers.`;
                return;
            }

            // Compound interest formula: A = P * (1 + r/n)^(nt) with n=1 (yearly compounding for simplicity)
            const futureValue = amount * Math.pow(1 + apy / 100, years);
            const interest = futureValue - amount;

            resultDiv.innerHTML = `
            <i class="fas fa-chart-line" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>Potential returns (before fees/risks):</strong><br>
            Initial deposit: $${amount.toFixed(2)}<br>
            After ${years} year(s) at ${apy}% APY (compounded annually):<br>
            <strong>Future value: $${futureValue.toFixed(2)}</strong><br>
            <strong>Interest earned: $${interest.toFixed(2)}</strong><br>
            <span style="font-size:0.9rem;">⚠️ APYs can change, and smart contract risk exists. This is not financial advice.</span>
        `;
        });
    }

    function initYieldSimulator() {
        const amountInput = document.getElementById('yieldAmount');
        const stakingApyInput = document.getElementById('stakingApy');
        const farmingApyInput = document.getElementById('farmingApy');
        const yearsInput = document.getElementById('yieldYears');
        const simulateBtn = document.getElementById('simulateYieldBtn');
        const resultDiv = document.getElementById('yieldResult');

        if (!amountInput || !stakingApyInput || !farmingApyInput || !yearsInput || !simulateBtn || !resultDiv) return;

        simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let amount = parseFloat(amountInput.value) || 0;
            let stakingApy = parseFloat(stakingApyInput.value) || 0;
            let farmingApy = parseFloat(farmingApyInput.value) || 0;
            let years = parseFloat(yearsInput.value) || 0;

            if (amount <= 0 || stakingApy <= 0 || farmingApy <= 0 || years <= 0) {
                resultDiv.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Please enter positive numbers.`;
                return;
            }

            // Compound annually for simplicity
            const stakingValue = amount * Math.pow(1 + stakingApy / 100, years);
            const farmingValue = amount * Math.pow(1 + farmingApy / 100, years);

            const stakingEarnings = stakingValue - amount;
            const farmingEarnings = farmingValue - amount;

            resultDiv.innerHTML = `
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <i class="fas fa-lock" style="color: var(--crypto-color);"></i>
                    <strong>Staking</strong><br>
                    Future value: $${stakingValue.toFixed(2)}<br>
                    Earnings: $${stakingEarnings.toFixed(2)}
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <i class="fas fa-tractor" style="color: var(--crypto-color);"></i>
                    <strong>Yield Farming</strong><br>
                    Future value: $${farmingValue.toFixed(2)}<br>
                    Earnings: $${farmingEarnings.toFixed(2)}
                </div>
            </div>
            <hr style="margin:15px 0;">
            <p style="font-size:0.9rem;"><i class="fas fa-exclamation-triangle" style="color:#e67e22;"></i> Farming returns are not guaranteed and may include impermanent loss. Staking rewards can also vary. This is a simplified projection.</p>
        `;
        });
    }

    function initNFTUtilityChecker() {
        const pfpBtn = document.getElementById('nftPfpBtn');
        const artBtn = document.getElementById('nftArtBtn');
        const gameBtn = document.getElementById('nftGameBtn');
        const membershipBtn = document.getElementById('nftMembershipBtn');
        const domainBtn = document.getElementById('nftDomainBtn');
        const musicBtn = document.getElementById('nftMusicBtn');
        const resultDiv = document.getElementById('nftResult');

        if (!pfpBtn || !artBtn || !gameBtn || !membershipBtn || !domainBtn || !musicBtn || !resultDiv) return;

        pfpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-user-circle" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🖼️ Profile Picture NFTs (e.g., Bored Apes, CryptoPunks)</strong><br>
            <span style="color:#e67e22;">Mostly hype, but with social utility.</span> These act as status symbols and community membership in exclusive clubs. Some projects offer additional perks (events, merch). Value is driven by brand and community, not inherent utility.
        `;
        });

        artBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-paint-brush" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🎨 Digital Art NFTs</strong><br>
            <span style="color:#27ae60;">Mixed: art value + royalties.</span> Artists can earn royalties on secondary sales. But many pieces are speculative. Real utility comes from provenance, supporting artists, and potential display in virtual galleries.
        `;
        });

        gameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-gamepad" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🎮 In‑Game Items (e.g., Axie Infinity, Sandbox)</strong><br>
            <span style="color:#27ae60;">Real utility within the game.</span> You can use, trade, or sell items. True utility depends on game popularity and item usefulness. Risk: if game dies, items lose value.
        `;
        });

        membershipBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-id-card" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🔑 Membership Passes</strong><br>
            <span style="color:#27ae60;">High utility.</span> Grants access to exclusive content, events, or communities. Examples: Flyfish Club (restaurant), Unlock Protocol. Value tied to real‑world benefits.
        `;
        });

        domainBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-globe" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🌐 Domain Names (e.g., ENS, Unstoppable Domains)</strong><br>
            <span style="color:#27ae60;">High utility.</span> Simplify crypto addresses, host websites, and can be used as login. They are like real estate on the blockchain – scarcity and utility increase with adoption.
        `;
        });

        musicBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-music" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🎵 Music NFTs</strong><br>
            <span style="color:#e67e22;">Emerging utility.</span> Artists can sell direct to fans, offer royalties, or unlock concert access. Hype exists, but direct artist‑fan relationship has real potential.
        `;
        });
    }

    function initAdvancedSecuritySimulator() {
        const singleBtn = document.getElementById('securitySingleBtn');
        const multi2of3Btn = document.getElementById('securityMulti2of3Btn');
        const multi3of5Btn = document.getElementById('securityMulti3of5Btn');
        const shamirBtn = document.getElementById('securityShamirBtn');
        const metalBtn = document.getElementById('securityMetalBtn');
        const passphraseBtn = document.getElementById('securityPassphraseBtn');
        const resultDiv = document.getElementById('securityResult');

        if (!singleBtn || !multi2of3Btn || !multi3of5Btn || !shamirBtn || !metalBtn || !passphraseBtn || !resultDiv) return;

        singleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-key" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🔑 Single‑Key Wallet (Baseline)</strong><br>
            One private key controls the funds. Convenient but a single point of failure. If the key is lost or stolen, funds are gone. Suitable for small amounts, but not recommended for large holdings.
        `;
        });

        multi2of3Btn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-lock" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🔐 Multi‑Sig 2-of-3</strong><br>
            Three keys are created; any two are needed to spend. Typical setup: one key on your main hardware wallet, one backup at home, one with a trusted friend or in a bank safe. If you lose one key, you can still recover with the other two.
        `;
        });

        multi3of5Btn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-lock" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🔐 Multi‑Sig 3-of-5</strong><br>
            Five keys, need three to spend. More redundancy but also more complexity. Useful for organizations or family offices where multiple people must approve transactions.
        `;
        });

        shamirBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-cut" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>✂️ Shamir Backup (Seed Splitting)</strong><br>
            Your seed phrase is split into shares (e.g., 5 shares, need 3 to recover). Store shares in different secure locations. Even if one location is compromised, your seed remains safe. Supported by some hardware wallets (Trezor, Keystone).
        `;
        });

        metalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-hard-drive" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🪨 Metal Backup</strong><br>
            Stamp your seed phrase onto stainless steel or titanium plates. Resistant to fire, flood, and corrosion. Products like Cryptosteel, Ledger Capsule, or DIY washers. Essential for long‑term storage.
        `;
        });

        passphraseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resultDiv.innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--crypto-color); margin-right: 10px;"></i>
            <strong>🔢 Passphrase (25th Word)</strong><br>
            A custom word added to your seed phrase (BIP39 passphrase). Creates a completely new wallet. Even if your seed is stolen, funds are safe without the passphrase. But if you forget the passphrase, funds are unrecoverable. Store it separately!
        `;
        });
    }

})();
