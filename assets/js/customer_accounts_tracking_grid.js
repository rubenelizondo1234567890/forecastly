/* assets/js/customer_accounts_tracking_grid.js */
document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const gridContainer = document.querySelector('.grid-scroll-container');
    const refreshBtn = document.getElementById('refreshGrid');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    const scrollToBottomBtn = document.getElementById('scrollToBottom');
    const fitToScreenBtn = document.getElementById('fitToScreen');

    // Year/month selection
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            const year = this.value;
            const month = monthSelect.value;
            window.location.href = `?year=${year}&month=${month}`;
        });
    }

    if (monthSelect) {
        monthSelect.addEventListener('change', function() {
            const month = this.value;
            const year = yearSelect.value;
            window.location.href = `?year=${year}&month=${month}`;
        });
    }

    // Refresh grid
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Scroll to top
    if (scrollToTopBtn && gridContainer) {
        scrollToTopBtn.addEventListener('click', function() {
            gridContainer.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Scroll to bottom
    if (scrollToBottomBtn && gridContainer) {
        scrollToBottomBtn.addEventListener('click', function() {
            gridContainer.scrollTo({ top: gridContainer.scrollHeight, behavior: 'smooth' });
        });
    }

    // Fit to screen (toggle between fixed and responsive)
    if (fitToScreenBtn && gridContainer) {
        fitToScreenBtn.addEventListener('click', function() {
            if (gridContainer.style.width === '100%') {
                gridContainer.style.width = '2160px';
                gridContainer.style.height = '800px';
                fitToScreenBtn.innerHTML = '<i class="fas fa-compress"></i> Fit to Screen';
            } else {
                gridContainer.style.width = '100%';
                gridContainer.style.height = '600px';
                fitToScreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fixed Size';
            }
        });
    }

    // Auto-scroll to current date
    function scrollToCurrentDate() {
        if (!gridContainer) return;

        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Get selected year and month from the page context
        const selectedYear = parseInt(document.querySelector('#year-select')?.value || currentYear);
        const selectedMonth = parseInt(document.querySelector('#month-select')?.value || currentMonth);

        // Only scroll if we're viewing the current month and year
        if (selectedYear === currentYear && selectedMonth === currentMonth) {
            const dayRows = document.querySelectorAll('.accounts-grid tbody tr');
            if (dayRows.length >= currentDay) {
                const currentDayRow = dayRows[currentDay - 1];
                if (currentDayRow) {
                    const rowTop = currentDayRow.offsetTop;
                    gridContainer.scrollTo({ top: rowTop - 50, behavior: 'smooth' });
                }
            }
        }
    }

    // Scroll to current date after a short delay
    setTimeout(scrollToCurrentDate, 500);
});