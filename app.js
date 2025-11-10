// =========================================
// GLOBAL STATE
// =========================================
let appState = {
    currentPage: 'dashboard',
    searchQuery: '',
    filters: {
        kategori: 'all',
        operator: 'all',
        status: 'all'
    },
    filteredData: [...mockCrawlData], // Data yang saat ini tampil di hasil pencarian
    isAnalyzing: false
};

// =========================================
// ROUTER & NAVIGATION
// =========================================
function initRouter() {
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Load initial page
}

function handleRouting() {
    const hash = window.location.hash.substring(1);
    const [page, param] = hash.split('/');
    
    // Set active state on nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page || (page === 'analysis' && link.dataset.page === 'search'));
    });

    const app = document.getElementById('app');
    app.innerHTML = ''; // Clear previous content

    switch (page) {
        case 'dashboard':
        case '':
            renderDashboard(app);
            break;
        case 'search':
            renderSearch(app);
            break;
        case 'analysis':
            if (param) {
                renderAnalysisDetail(app, param);
            } else {
                navigateTo('search');
            }
            break;
        default:
            renderDashboard(app);
    }
    lucide.createIcons();
}

function navigateTo(page, param = null) {
    window.location.hash = param ? `#${page}/${param}` : `#${page}`;
}

// =========================================
// PAGE RENDERERS
// =========================================

// --- DASHBOARD ---
function renderDashboard(container) {
    container.innerHTML = `
        <div class="space-y-8 fade-in">
            <div>
                <h1 class="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p class="text-gray-400">Monitor and analyze domain crawling activities.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${renderMetricCard('Total Domains', mockMetrics.totalDomains.toLocaleString(), 'Domains detected', 'shield')}
                ${renderMetricCard('Flagged Categories', mockMetrics.flaggedCategories, 'Active categories', 'alert-triangle')}
                ${renderMetricCard('Success Rate', mockMetrics.successRate + '%', 'Crawling success', 'trending-up')}
                ${renderMetricCard("Today's Crawls", mockMetrics.todaysCrawls, 'New crawls today', 'eye')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div class="lg:col-span-3 glass-effect rounded-xl p-6 border border-white/10">
                    <h3 class="text-lg font-semibold mb-6 text-white">Crawling Trend (7 Days)</h3>
                    <div id="chart-trend" class="h-[300px]"></div>
                </div>
                <div class="lg:col-span-2 glass-effect rounded-xl p-6 border border-white/10">
                    <h3 class="text-lg font-semibold mb-6 text-white">Category Distribution</h3>
                    <div id="chart-category" class="h-[300px] flex justify-center"></div>
                </div>
            </div>
        </div>
    `;

    // Initialize charts after DOM is ready
    setTimeout(() => {
        initTrendChart();
        initCategoryChart();
    }, 0);
}

function renderMetricCard(title, value, subtitle, iconName) {
    return `
        <div class="glass-effect p-6 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-sm font-medium text-gray-400">${title}</h3>
                <div class="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <i data-lucide="${iconName}" class="h-5 w-5 text-purple-400"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1">${value}</div>
            <p class="text-xs text-gray-500">${subtitle}</p>
        </div>
    `;
}

// --- SEARCH & ANALYSIS ---
function renderSearch(container) {
    container.innerHTML = `
        <div class="space-y-6 fade-in">
            <div>
                <h1 class="text-3xl font-bold text-white mb-2">Search & Analysis</h1>
                <p class="text-gray-400">Investigate domains and perform manual analysis.</p>
            </div>

            <div class="glass-effect p-6 rounded-xl border border-white/10">
                <div class="flex items-center mb-6">
                    <i data-lucide="scan" class="h-5 w-5 text-purple-400 mr-3"></i>
                    <h2 class="text-lg font-semibold text-white">Manual URL Analysis</h2>
                </div>
                <div class="flex gap-3">
                    <input type="text" id="manual-url-input" placeholder="Enter URL to analyze (e.g., example.com)" 
                        class="flex-1 h-11 rounded-lg border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all">
                    <button onclick="handleManualAnalysis()" id="analyze-btn" class="galaxy-button px-6 h-11 rounded-lg text-white font-medium flex items-center justify-center min-w-[120px]">
                        <i data-lucide="sparkles" class="h-4 w-4 mr-2"></i> Analyze
                    </button>
                </div>
            </div>

            <div class="space-y-4">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"></i>
                    <input type="text" id="search-input" placeholder="Search database (domain, keyword, account, QRIS...)" 
                        value="${appState.searchQuery}"
                        oninput="handleSearchInput(this.value)"
                        class="w-full h-12 pl-12 pr-4 rounded-lg border border-white/10 bg-black/40 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 glass-effect rounded-xl border border-white/10">
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">Category</label>
                        <select id="filter-kategori" onchange="handleFilterChange('kategori', this.value)" class="w-full h-10 rounded-md border border-white/10 bg-black/50 px-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="all">All Categories</option>
                            ${[...new Set(mockCrawlData.map(d => d.kategori))].map(cat => `<option value="${cat}" ${appState.filters.kategori === cat ? 'selected' : ''}>${capitalize(cat)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="space-y-2">
                         <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">Operator</label>
                         <select id="filter-operator" onchange="handleFilterChange('operator', this.value)" class="w-full h-10 rounded-md border border-white/10 bg-black/50 px-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="all">All Operators</option>
                             ${[...new Set(mockCrawlData.map(d => d.operator_hosting))].map(op => `<option value="${op}" ${appState.filters.operator === op ? 'selected' : ''}>${op}</option>`).join('')}
                        </select>
                    </div>
                     <div class="space-y-2">
                         <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</label>
                         <select id="filter-status" onchange="handleFilterChange('status', this.value)" class="w-full h-10 rounded-md border border-white/10 bg-black/50 px-3 text-sm text-white outline-none focus:border-purple-500">
                            <option value="all">All Statuses</option>
                             ${[...new Set(mockCrawlData.map(d => d.status))].map(s => `<option value="${s}" ${appState.filters.status === s ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="resetFilters()" class="h-10 w-full px-4 border border-white/10 hover:bg-white/5 rounded-md text-sm text-gray-300 transition-colors flex items-center justify-center">
                            <i data-lucide="rotate-ccw" class="h-4 w-4 mr-2"></i> Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            <div class="glass-effect rounded-xl border border-white/10 overflow-hidden">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                     <h3 class="text-white font-medium" id="result-count">Loading results...</h3>
                     <button onclick="openExportModal()" class="text-xs galaxy-button px-3 py-1.5 rounded-md text-white flex items-center">
                        <i data-lucide="download" class="h-3.5 w-3.5 mr-1.5"></i> Export Current View
                     </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-gray-300">
                        <thead class="text-xs uppercase bg-white/5 text-gray-400">
                            <tr>
                                <th class="px-6 py-4 font-medium">Domain</th>
                                <th class="px-6 py-4 font-medium">Category</th>
                                <th class="px-6 py-4 font-medium">Confidence</th>
                                <th class="px-6 py-4 font-medium">Operator</th>
                                <th class="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody id="search-results-body" class="divide-y divide-white/5">
                            </tbody>
                    </table>
                </div>
                 <div id="no-results" class="hidden p-12 text-center">
                    <i data-lucide="search-x" class="h-12 w-12 text-gray-600 mx-auto mb-4"></i>
                    <p class="text-gray-400">No results found matching your criteria.</p>
                </div>
            </div>
        </div>
    `;
    
    // Perform initial filter to populate table
    applyFilters();
}

// --- ANALYSIS DETAIL ---
function renderAnalysisDetail(container, domain) {
    const data = mockCrawlData.find(d => d.domain === domain);
    if (!data) {
        showToast('Domain not found in database', 'error');
        navigateTo('search');
        return;
    }

    const judgment = data.structured_judgment;
    const isSafe = judgment.status === 'Safe';

    container.innerHTML = `
        <div class="space-y-6 fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div class="flex items-center space-x-3 mb-1">
                        <h1 class="text-3xl font-bold text-white">${data.domain}</h1>
                        ${getConfidenceBadge(data.confidence)}
                    </div>
                    <p class="text-gray-400">Analysis completed on ${new Date(data.crawl_timestamp).toLocaleDateString()}</p>
                </div>
                <div class="flex space-x-3">
                     <button onclick="navigateTo('search')" class="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 flex items-center transition-colors">
                        <i data-lucide="arrow-left" class="h-4 w-4 mr-2"></i> Back to Search
                    </button>
                    <button onclick="openExportModal()" class="galaxy-button px-4 py-2 rounded-lg text-white flex items-center">
                        <i data-lucide="download" class="h-4 w-4 mr-2"></i> Export Report
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="glass-effect p-6 rounded-xl border border-white/10 flex items-center space-x-4">
                    <div class="p-3 rounded-full ${isSafe ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        <i data-lucide="${isSafe ? 'shield-check' : 'siren'}" class="h-8 w-8"></i>
                    </div>
                    <div>
                        <h3 class="text-sm text-gray-400">Verdict Status</h3>
                        <p class="text-2xl font-bold ${isSafe ? 'text-green-400' : 'text-red-400'}">${judgment.status}</p>
                    </div>
                 </div>
                 <div class="glass-effect p-6 rounded-xl border border-white/10">
                    <div class="flex justify-between mb-2">
                         <h3 class="text-sm text-gray-400">Illegal Content Rate</h3>
                         <span class="font-bold text-white">${judgment.illegal_rate}%</span>
                    </div>
                    <div class="h-3 bg-black/50 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-yellow-500 to-red-600" style="width: ${judgment.illegal_rate}%"></div>
                    </div>
                 </div>
                  <div class="glass-effect p-6 rounded-xl border border-white/10 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">IP Address</span>
                        <span class="font-mono text-white">${judgment.domain_ip}</span>
                    </div>
                     <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Server</span>
                        <span class="font-mono text-purple-300">${judgment.server_version}</span>
                    </div>
                     <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Hosting</span>
                        <span class="text-white">${data.operator_hosting}</span>
                    </div>
                 </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-6">
                    <div class="glass-effect rounded-xl border border-white/10 overflow-hidden">
                        <div class="p-4 border-b border-white/10 bg-white/5 flex items-center">
                            <i data-lucide="bug" class="h-5 w-5 text-yellow-400 mr-2"></i>
                            <h3 class="font-semibold text-white">Detected Weaknesses</h3>
                        </div>
                        <div class="p-6">
                            <div class="flex flex-wrap gap-2">
                                ${judgment.weaknesses.length > 0 
                                    ? judgment.weaknesses.map(w => `<span class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30">${w}</span>`).join('')
                                    : '<span class="text-gray-500 italic">No standard weaknesses detected.</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="glass-effect rounded-xl border border-white/10 overflow-hidden">
                        <div class="p-4 border-b border-white/10 bg-white/5 flex items-center">
                             <i data-lucide="code-2" class="h-5 w-5 text-purple-400 mr-2"></i>
                            <h3 class="font-semibold text-white">Suspicious Scripts</h3>
                        </div>
                        <div class="p-4 space-y-2">
                             ${judgment.suspicious_scripts.length > 0 
                                    ? judgment.suspicious_scripts.map(s => `<div class="font-mono text-sm bg-black/50 p-3 rounded-lg text-red-300 border-l-2 border-red-500 truncate">${s}</div>`).join('')
                                    : '<span class="text-gray-500 italic p-2">No suspicious scripts found.</span>'}
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="glass-effect rounded-xl border border-white/10 overflow-hidden">
                        <div class="p-4 border-b border-white/10 bg-white/5 flex items-center">
                            <i data-lucide="list-checks" class="h-5 w-5 text-green-400 mr-2"></i>
                            <h3 class="font-semibold text-white">AI Recommendations</h3>
                        </div>
                        <div class="p-6">
                            <ul class="space-y-3">
                                ${judgment.recommendations.map(rec => `
                                    <li class="flex items-start">
                                        <i data-lucide="check-circle-2" class="h-5 w-5 text-purple-400 mr-2 shrink-0 mt-0.5"></i>
                                        <span class="text-gray-300">${rec}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>

                     <div class="glass-effect rounded-xl border border-white/10 overflow-hidden">
                        <div class="p-4 border-b border-white/10 bg-white/5 flex items-center">
                             <i data-lucide="fingerprint" class="h-5 w-5 text-blue-400 mr-2"></i>
                            <h3 class="font-semibold text-white">Detected Entities</h3>
                        </div>
                        <div class="p-6">
                             <div class="flex flex-wrap gap-2">
                                ${data.entities_detected.length > 0 
                                    ? data.entities_detected.map(e => `<span class="px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">${e}</span>`).join('')
                                    : '<span class="text-gray-500 italic">No specific entities extracted.</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =========================================
// LOGIC HANDLERS
// =========================================

// --- SEARCH LOGIC ---
function handleSearchInput(val) {
    appState.searchQuery = val.toLowerCase();
    applyFilters();
}

function handleFilterChange(type, val) {
    appState.filters[type] = val;
    applyFilters();
}

function resetFilters() {
    appState.searchQuery = '';
    appState.filters = { kategori: 'all', operator: 'all', status: 'all' };
    document.getElementById('search-input').value = '';
    document.getElementById('filter-kategori').value = 'all';
    document.getElementById('filter-operator').value = 'all';
    document.getElementById('filter-status').value = 'all';
    applyFilters();
    showToast('Filters reset');
}

function applyFilters() {
    let results = mockCrawlData.filter(item => {
        // Text Search
        const matchQuery = !appState.searchQuery || 
            item.domain.toLowerCase().includes(appState.searchQuery) || 
            item.kategori.toLowerCase().includes(appState.searchQuery) ||
            item.entities_detected.some(e => e.toLowerCase().includes(appState.searchQuery));
        
        // Dropdown Filters
        const matchKategori = appState.filters.kategori === 'all' || item.kategori === appState.filters.kategori;
        const matchOperator = appState.filters.operator === 'all' || item.operator_hosting === appState.filters.operator;
        const matchStatus = appState.filters.status === 'all' || item.status === appState.filters.status;

        return matchQuery && matchKategori && matchOperator && matchStatus;
    });

    appState.filteredData = results;
    updateSearchResultsTable(results);
}

function updateSearchResultsTable(results) {
    const tbody = document.getElementById('search-results-body');
    const noResults = document.getElementById('no-results');
    const countLabel = document.getElementById('result-count');

    if (!tbody) return; // Guard clause if not on search page

    countLabel.innerText = `Showing ${results.length} of ${mockCrawlData.length} results`;

    if (results.length === 0) {
        tbody.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');
    tbody.innerHTML = results.map(row => `
        <tr class="hover:bg-white/5 cursor-pointer transition-colors group" onclick="navigateTo('analysis', '${row.domain}')">
            <td class="px-6 py-4 font-medium text-purple-300 group-hover:text-purple-200">${row.domain}</td>
            <td class="px-6 py-4 capitalize">${row.kategori}</td>
            <td class="px-6 py-4">${getConfidenceBadge(row.confidence)}</td>
            <td class="px-6 py-4 text-gray-400">${row.operator_hosting}</td>
            <td class="px-6 py-4 text-right">
                <button class="p-2 hover:bg-purple-500/20 rounded-full text-purple-400 transition-colors">
                    <i data-lucide="chevron-right" class="h-5 w-5"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function handleManualAnalysis() {
    const btn = document.getElementById('analyze-btn');
    const input = document.getElementById('manual-url-input');
    if (!input.value.includes('.')) {
        showToast("Please enter a valid domain URL", "error");
        return;
    }

    // Simulate loading state
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="h-4 w-4 mr-2 animate-spin"></i> Analyzing...`;
    lucide.createIcons();

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles" class="h-4 w-4 mr-2"></i> Analyze`;
        lucide.createIcons();
        
        // Mock result redirect if it exists in our mock DB, else show toast
        const existing = mockCrawlData.find(d => d.domain === input.value.trim());
        if (existing) {
            showToast("Domain found in database!");
            navigateTo('analysis', existing.domain);
        } else {
            showToast("New domain analyzed. Added to queue.", "success");
            // In a real app, this would add to the list or redirect to a new analysis result
        }
    }, 2000);
}


// =========================================
// MODALS & TOASTS
// =========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const borderColor = type === 'error' ? 'border-red-500' : type === 'success' ? 'border-green-500' : 'border-purple-500';
    const textColor = type === 'error' ? 'text-red-200' : type === 'success' ? 'text-green-200' : 'text-white';
    
    toast.className = `glass-effect p-4 rounded-lg border-l-4 ${borderColor} ${textColor} shadow-xl transform transition-all duration-500 translate-x-full opacity-0 flex items-center`;
    toast.innerHTML = `
        <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}" class="h-5 w-5 mr-3 ${textColor}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    lucide.createIcons();

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
}

// =========================================
// EXPORT LOGIC
// =========================================
function openExportModal() {
    const modal = document.getElementById('export-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    updateExportPreview(); // Set initial count based on default 'all' selection
}

function updateExportPreview() {
    const scope = document.getElementById('export-scope').value;
    const countEl = document.getElementById('export-count');
    
    if (scope === 'all') {
        countEl.innerText = `${mockCrawlData.length} records`;
    } else {
        // If we are on search page, use filtered data, else if on dashboard, it might be all or none.
        // For simplicity, if not on search page, filtered usually means "current view" which might be none.
        // Let's assume filteredData is always maintained by the last search/filter action.
        countEl.innerText = `${appState.filteredData.length} records`;
    }
}

function performExport() {
    const scope = document.getElementById('export-scope').value;
    const dataToExport = scope === 'all' ? mockCrawlData : appState.filteredData;
    
    if (dataToExport.length === 0) {
        showToast("No data to export based on current selection.", "error");
        closeModal('export-modal');
        return;
    }

    const success = exportToCSV(dataToExport, `cakra_export_${scope}_${new Date().toISOString().slice(0,10)}.csv`);
    if (success) {
        showToast(`Successfully exported ${dataToExport.length} records!`, 'success');
    } else {
        showToast("Export failed.", "error");
    }
    closeModal('export-modal');
}

// =========================================
// HELPERS & CHARTS INITIALIZATION
// =========================================
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getConfidenceBadge(score) {
    let colorClass, label;
    if (score >= 0.8) {
        colorClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
        label = 'High';
    } else if (score >= 0.5) {
        colorClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
        label = 'Medium';
    } else {
        colorClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
        label = 'Low';
    }
    return `<span class="px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}">${label} ${(score * 100).toFixed(0)}%</span>`;
}

function initTrendChart() {
    const options = {
        chart: { type: 'area', height: '100%', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
        theme: { mode: 'dark' },
        stroke: { curve: 'smooth', width: 3, colors: ['#8B5CF6'] },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 100], colorStops: [{ offset: 0, color: '#8B5CF6', opacity: 0.6 }, { offset: 100, color: '#8B5CF6', opacity: 0.1 }] } },
        dataLabels: { enabled: false },
        series: [{ name: 'Crawls', data: mockChartData.crawlTrend.map(d => d.crawls) }],
        xaxis: { categories: mockChartData.crawlTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), labels: { style: { colors: '#9CA3AF' } }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
        yaxis: { labels: { style: { colors: '#9CA3AF' } } },
        grid: { borderColor: '#FFFFFF10', strokeDashArray: 5, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
        tooltip: { theme: 'dark', x: { show: false } }
    };
    new ApexCharts(document.querySelector("#chart-trend"), options).render();
}

function initCategoryChart() {
    const options = {
        chart: { type: 'donut', height: '100%', background: 'transparent' },
        theme: { mode: 'dark' },
        series: mockChartData.categoryDistribution,
        labels: mockChartData.categoryLabels,
        colors: ['#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#10B981', '#6B7280', '#991B1B', '#CA8A04'],
        plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', color: '#fff', fontSize: '16px', fontWeight: 600 } } } } },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', labels: { colors: '#9CA3AF' }, markers: { width: 8, height: 8 } },
        stroke: { width: 0 }
    };
    new ApexCharts(document.querySelector("#chart-category"), options).render();
}

// =========================================
// APP INITIALIZATION
// =========================================
document.addEventListener('DOMContentLoaded', initRouter);