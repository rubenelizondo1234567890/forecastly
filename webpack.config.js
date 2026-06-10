const Encore = require('@symfony/webpack-encore');

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // directory where compiled assets will be stored
    .setOutputPath('public/build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')
    // only needed for CDN's or subdirectory deploy
    //.setManifestKeyPrefix('build/')

    /*
     * ENTRY CONFIG
     *
     * Each entry will result in one JavaScript file (e.g. app.js)
     * and one CSS file (e.g. app.css) if your JavaScript imports CSS.
     */

    //Base html
    .addEntry('appCss', './assets/styles/app.css')
    .addEntry('appJs', './assets/js/app.js')

    .addEntry('contact_support_css', './assets/styles/contact_support.css')
    .addEntry('contact_support_js', './assets/js/contact_support.js')

    //Prospect endpoints
    .addEntry('prospectCss', './assets/styles/prospect.css')
    .addEntry('prospectJs', './assets/js/prospect.js')
    .addEntry('prospectRegistrationCss', './assets/styles/prospect_registration.css')
    .addEntry('prospectRegistrationJs', './assets/js/prospect_registration.js')
    .addEntry('waitlist_css', './assets/styles/waitlist.css')
    .addEntry('waitlist_js', './assets/js/waitlist.js')

    //Customer Dashboard entries
    .addEntry('customer_login_css', './assets/styles/customer_login.css')
    .addEntry('customer_dashboard_css', './assets/styles/customer_dashboard.css')
    .addEntry('customer_dashboard_js', './assets/js/customer_dashboard.js')

    //Customer Budget Tracking Groups
    .addEntry('customer_budget_groups_css', './assets/styles/budget_tracking_groups.css')
    .addEntry('customer_budget_groups_js', './assets/js/budget_tracking_groups.js')

    // Customer Accounts entries
    .addEntry('customer_accounts_css', './assets/styles/customer_accounts.css')
    .addEntry('customer_accounts_js', './assets/js/customer_accounts.js')
    .addEntry('customer_savings_accounts_css', './assets/styles/customer_savings_accounts.css')
    .addEntry('customer_savings_accounts_js', './assets/js/customer_savings_accounts.js')

    //Customer Recurring Income Entries
    .addEntry('customer_recurring_incomes_css', './assets/styles/recurring_incomes.css')
    .addEntry('customer_recurring_incomes_js', './assets/js/recurring_incomes.js')

    //Customer Non-Recurring Income Entries
    .addEntry('customer_non_recurring_incomes_css', './assets/styles/non_recurring_incomes.css')
    .addEntry('customer_non_recurring_incomes_js', './assets/js/non_recurring_incomes.js')

    // Customer Recurring Expense Entries
    .addEntry('customer_recurring_expenses_css', './assets/styles/recurring_expenses.css')
    .addEntry('customer_recurring_expenses_js', './assets/js/recurring_expenses.js')

    //Customer Non-Recurring Expense Entries
    .addEntry('customer_non_recurring_expenses_css', './assets/styles/non_recurring_expenses.css')
    .addEntry('customer_non_recurring_expenses_js', './assets/js/non_recurring_expenses.js')

    //Customer Recurring Interest Entries
    .addEntry('customer_recurring_interest_css', './assets/styles/recurring_interest.css')
    .addEntry('customer_recurring_interest_js', './assets/js/recurring_interest.js')

    // Customer Accounts Tracking Calendar and Grid
    .addEntry('customer_accounts_tracking_calendar_css', './assets/styles/customer_accounts_tracking_calendar.css')
    .addEntry('customer_accounts_tracking_calendar_js', './assets/js/customer_accounts_tracking_calendar.js')
    .addEntry('customer_accounts_tracking_grid_css', './assets/styles/customer_accounts_tracking_grid.css')
    .addEntry('customer_accounts_tracking_grid_js', './assets/js/customer_accounts_tracking_grid.js')

    // Customer Account Settings
    .addEntry('customer_account_settings_css', './assets/styles/customer_account_settings.css')
    .addEntry('customer_account_settings_js', './assets/js/customer_account_settings.js')
    .addEntry('customer_subscription_css', './assets/styles/customer_subscription.css')
    .addEntry('customer_subscription_js', './assets/js/customer_subscription.js')

    // Customer Forecasting
    .addEntry('customer_accounts_forecasting_css', './assets/styles/customer_accounts_forecasting.css')
    .addEntry('customer_accounts_forecasting_js', './assets/js/customer_accounts_forecasting.js')

    .addEntry('customer_net_balance_forecasting_css', './assets/styles/customer_net_balance_forecasting.css')
    .addEntry('customer_net_balance_forecasting_js', './assets/js/customer_net_balance_forecasting.js')

    .addEntry('customer_wealth_forecasting_css', './assets/styles/customer_wealth_forecasting.css')
    .addEntry('customer_wealth_forecasting_js', './assets/js/customer_wealth_forecasting.js')

    .addEntry('customer_what_if_forecasting_css', './assets/styles/customer_what_if_forecasting.css')
    .addEntry('customer_what_if_forecasting_js', './assets/js/customer_what_if_forecasting.js')

    //Debt Management
    .addEntry('customer_revolving_payments_css', './assets/styles/customer_revolving_payments.css')
    .addEntry('customer_revolving_payments_js', './assets/js/customer_revolving_payments.js')
    // .addEntry('customer_debt_payoff_strategies_css', './assets/styles/customer_debt_payoff_strategies.css')
    // .addEntry('customer_debt_payoff_strategies_js', './assets/js/customer_debt_payoff_strategies.js')

    //Savings Management
    .addEntry('customer_recurring_savings_css', './assets/styles/customer_recurring_savings.css')
    .addEntry('customer_recurring_savings_js', './assets/js/customer_recurring_savings.js')

    //Admin Dashboard entries
    .addEntry('admin_login_css', './assets/styles/admin/admin_login.css')
    .addEntry('admin_dashboard_css', './assets/styles/admin/admin_dashboard.css')
    .addEntry('admin_dashboard_js', './assets/js/admin/admin_dashboard.js')

    //Financial Education Journeys
    .addEntry('home_css', './assets/styles/home.css')
    .addEntry('home_js', './assets/js/home.js')
    .addEntry('promo_landing_css', './assets/styles/promo_landing.css')
    .addEntry('promo_landing_js', './assets/js/promo_landing.js')
    .addEntry('personal_finance_css', './assets/styles/personal_finance.css')
    .addEntry('personal_finance_js', './assets/js/personal_finance.js')
    .addEntry('forex_css', './assets/styles/forex.css')
    .addEntry('forex_js', './assets/js/forex.js')
    .addEntry('bonds_css', './assets/styles/bonds.css')
    .addEntry('bonds_js', './assets/js/bonds.js')
    .addEntry('credit_css', './assets/styles/credit.css')
    .addEntry('credit_js', './assets/js/credit.js')
    .addEntry('crypto_css', './assets/styles/crypto.css')
    .addEntry('crypto_js', './assets/js/crypto.js')
    .addEntry('fire_css', './assets/styles/fire.css')
    .addEntry('fire_js', './assets/js/fire.js')
    .addEntry('psychology_css', './assets/styles/psychology.css')
    .addEntry('psychology_js', './assets/js/psychology.js')
    .addEntry('real_state_css', './assets/styles/real_state.css')
    .addEntry('real_state_js', './assets/js/real_state.js')
    .addEntry('retirement_css', './assets/styles/retirement.css')
    .addEntry('retirement_js', './assets/js/retirement.js')
    .addEntry('stock_css', './assets/styles/stock.css')
    .addEntry('stock_js', './assets/js/stock.js')
    .addEntry('tax_css', './assets/styles/tax.css')
    .addEntry('tax_js', './assets/js/tax.js')
    .addEntry('career_capital_css', './assets/styles/career_capital.css')
    .addEntry('career_capital_js', './assets/js/career_capital.js')




    // When enabled, Webpack "splits" your files into smaller pieces for greater optimization.
    .splitEntryChunks()

    // will require an extra script tag for runtime.js
    // but, you probably want this, unless you're building a single-page app
    .enableSingleRuntimeChunk()

    /*
     * FEATURE CONFIG
     *
     * Enable & configure other features below. For a full
     * list of features, see:
     * https://symfony.com/doc/current/frontend.html#adding-more-features
     */
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSourceMaps(!Encore.isProduction())
    // enables hashed filenames (e.g. app.abc123.css)
    .enableVersioning(Encore.isProduction())

    // configure Babel
    // .configureBabel((config) => {
    //     config.plugins.push('@babel/a-babel-plugin');
    // })

    // enables and configure @babel/preset-env polyfills
    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = '3.38';
    })

    // enables Sass/SCSS support
    //.enableSassLoader()

    // uncomment if you use TypeScript
    //.enableTypeScriptLoader()

    // uncomment if you use React
    //.enableReactPreset()

    // uncomment to get integrity="..." attributes on your script & link tags
    // requires WebpackEncoreBundle 1.4 or higher
    //.enableIntegrityHashes(Encore.isProduction())

    // uncomment if you're having problems with a jQuery plugin
    //.autoProvidejQuery()
;

module.exports = Encore.getWebpackConfig();
