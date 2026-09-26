// js/app.js — Expense & Budget Visualizer

// =============================================================================
// SECTION 1: Validator (pure functions)
// =============================================================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {{ name?: string, amount?: string, category?: string }} errors
 */

/**
 * Validates raw form input.
 * Pure function — no side effects.
 *
 * @param {string} name     - Raw item name input
 * @param {string} amount   - Raw amount input (string from <input>)
 * @param {string} category - Selected category value
 * @returns {ValidationResult}
 */
function validateInput(name, amount, category) {
    const errors = {};

    // Name rule: trimmed non-empty AND length ≤ 100 characters
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName.length === 0) {
        errors.name = 'Item name is required.';
    } else if (trimmedName.length > 100) {
        errors.name = 'Item name must not exceed 100 characters.';
    }

    // Amount rule: parses to a finite number in [0.01, 999999999.99]
    const parsedAmount = parseFloat(amount);
    if (!isFinite(parsedAmount) || isNaN(parsedAmount)) {
        errors.amount = 'Amount must be a valid number.';
    } else if (parsedAmount < 0.01) {
        errors.amount = 'Amount must be at least 0.01.';
    } else if (parsedAmount > 999999999.99) {
        errors.amount = 'Amount must not exceed 999,999,999.99.';
    }

    // Category rule: must be exactly "Food", "Transport", or "Fun"
    const validCategories = ['Food', 'Transport', 'Fun'];
    if (!validCategories.includes(category)) {
        errors.category = 'Please select a valid category (Food, Transport, or Fun).';
    }

    const valid = Object.keys(errors).length === 0;
    return { valid, errors };
}

// =============================================================================
// SECTION 2: Transaction Factory (pure function)
// =============================================================================

/**
 * @typedef {Object} Transaction
 * @property {string} id        - Unique identifier
 * @property {string} name      - Trimmed item name
 * @property {number} amount    - Parsed float
 * @property {string} category  - "Food" | "Transport" | "Fun"
 * @property {number} createdAt - Unix timestamp (Date.now())
 */

/**
 * Creates a normalized Transaction object from validated inputs.
 * Pure function — no side effects.
 *
 * @param {string} name
 * @param {string|number} amount - raw input
 * @param {string} category
 * @returns {Transaction}
 */
function createTransaction(name, amount, category) {
    const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);

    return {
        id,
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        createdAt: Date.now()
    };
}

// =============================================================================
// SECTION 3: Store (Storage I/O)
// =============================================================================

const STORAGE_KEY = 'expense_visualizer_transactions';
let storageAvailable = true;

/**
 * Reads all transactions from localStorage.
 * Returns [] on any failure (SecurityError, JSON parse error, etc.)
 * and sets storageAvailable = false so the app knows storage is broken.
 *
 * @returns {Transaction[]}
 */
function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return [];
        return JSON.parse(raw);
    } catch (e) {
        storageAvailable = false;
        return [];
    }
}

/**
 * Persists the transactions array to localStorage.
 * - If storageAvailable is false, logs silently to console and returns without writing.
 * - On setItem failure, does NOT mutate the passed array and returns false.
 * - Returns true on success.
 *
 * @param {Transaction[]} transactions
 * @returns {boolean}
 */
function saveTransactions(transactions) {
    if (!storageAvailable) {
        console.log('Storage unavailable — skipping save.');
        return false;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (e) {
        console.error('Failed to save transactions to localStorage:', e);
        return false;
    }
}

// =============================================================================
// SECTION 4: Balance and Chart Data Calculators (pure functions)
// =============================================================================

/**
 * Computes the total balance across all transactions, formatted to 2 decimal places.
 * Pure function — no side effects.
 *
 * @param {Transaction[]} transactions
 * @returns {string}  e.g. "1234.56", or "0.00" for an empty array
 */
function computeBalance(transactions) {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total.toFixed(2);
}

/**
 * @typedef {Object} CategoryData
 * @property {string} label       - Category name ("Food" | "Transport" | "Fun")
 * @property {number} percentage  - Share of grand total, rounded to 2 decimal places
 * @property {number} total       - Raw sum of amounts for this category
 */

/**
 * Aggregates transaction amounts by category and returns percentage shares.
 * Only categories with a total amount greater than zero are included.
 * Pure function — no side effects.
 *
 * @param {Transaction[]} transactions
 * @returns {CategoryData[]}  Array of category entries with total > 0, percentages relative to grand total
 */
function computeCategoryData(transactions) {
    const categories = ['Food', 'Transport', 'Fun'];

    // Sum amounts per category
    const totals = {};
    for (const cat of categories) {
        totals[cat] = 0;
    }
    for (const t of transactions) {
        if (totals.hasOwnProperty(t.category)) {
            totals[t.category] += t.amount;
        }
    }

    const grandTotal = categories.reduce((sum, cat) => sum + totals[cat], 0);

    // Build result — omit categories with zero total
    return categories
        .filter(cat => totals[cat] > 0)
        .map(cat => ({
            label: cat,
            percentage: parseFloat(((totals[cat] / grandTotal) * 100).toFixed(2)),
            total: totals[cat]
        }));
}

// =============================================================================
// SECTION 5: UI Renderers (imperative DOM functions)
// =============================================================================

// Module-level Chart.js instance — replaced on every render
let chartInstance = null;

// Fixed category → color mapping
const CATEGORY_COLORS = {
    Food: '#4CAF50',
    Transport: '#2196F3',
    Fun: '#FF5722'
};

/**
 * Rebuilds the transaction list in the DOM.
 * Shows an empty-state message when the array is empty.
 *
 * @param {Transaction[]} transactions
 */
function renderTransactionList(transactions) {
    const listEl = document.getElementById('transaction-list');
    if (transactions.length === 0) {
        listEl.innerHTML = '<li id="empty-state-message">No expenses recorded yet.</li>';
        return;
    }

    listEl.innerHTML = '';
    for (const tx of transactions) {
        const li = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tx-name';
        nameSpan.textContent = tx.name;

        const catSpan = document.createElement('span');
        catSpan.className = 'tx-category';
        catSpan.textContent = tx.category;

        const amountSpan = document.createElement('span');
        amountSpan.className = 'tx-amount';
        amountSpan.textContent = parseFloat(tx.amount).toFixed(2);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.setAttribute('data-delete-id', tx.id);
        deleteBtn.setAttribute('aria-label', 'Delete ' + tx.name);
        deleteBtn.textContent = 'Delete';

        li.appendChild(nameSpan);
        li.appendChild(catSpan);
        li.appendChild(amountSpan);
        li.appendChild(deleteBtn);
        listEl.appendChild(li);
    }
}

/**
 * Updates the balance display element.
 *
 * @param {string} balanceStr - formatted to 2 dp (e.g. "1234.56")
 */
function renderBalance(balanceStr) {
    document.getElementById('balance-value').textContent = balanceStr;
}

/**
 * Creates or updates the Chart.js pie chart.
 * Shows no-data text when categoryData is empty.
 * Shows fallback when Chart.js failed to load.
 *
 * @param {CategoryData[]} categoryData
 */
function renderChart(categoryData) {
    // Guard: Chart.js not loaded (CDN failure)
    if (typeof window.Chart === 'undefined') {
        showChartFallback();
        return;
    }

    const noDataEl = document.getElementById('chart-no-data');
    const canvasEl = document.getElementById('expense-chart');

    if (categoryData.length === 0) {
        // Destroy existing instance and show no-data message
        if (chartInstance !== null) {
            chartInstance.destroy();
            chartInstance = null;
        }
        noDataEl.style.display = 'block';
        canvasEl.style.display = 'none';
        return;
    }

    // Data available — hide no-data, show canvas
    noDataEl.style.display = 'none';
    canvasEl.style.display = 'block';

    // Destroy previous instance before creating a new one
    if (chartInstance !== null) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const ctx = canvasEl.getContext('2d');
    chartInstance = new window.Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryData.map(d => d.label + ' (' + d.percentage + '%)'),
            datasets: [{
                data: categoryData.map(d => d.total),
                backgroundColor: categoryData.map(d => CATEGORY_COLORS[d.label])
            }]
        },
        options: {
            plugins: {
                legend: { display: true }
            }
        }
    });
}

/**
 * Displays inline field-level error messages.
 *
 * @param {{ name?: string, amount?: string, category?: string }} errors
 */
function showFormErrors(errors) {
    const fields = ['name', 'amount', 'category'];
    for (const key of fields) {
        const el = document.getElementById('error-' + key);
        if (el) {
            el.textContent = errors[key] || '';
        }
    }
}

/**
 * Clears all inline field error messages.
 */
function clearFormErrors() {
    const fields = ['name', 'amount', 'category'];
    for (const key of fields) {
        const el = document.getElementById('error-' + key);
        if (el) el.textContent = '';
    }
}

/**
 * Resets the expense input form to its default empty state.
 */
function resetForm() {
    document.getElementById('input-name').value = '';
    document.getElementById('input-amount').value = '';
    document.getElementById('input-category').selectedIndex = 0;
}

/**
 * Shows the dismissible storage-unavailable warning banner.
 */
function showStorageWarning() {
    const banner = document.getElementById('storage-warning');
    banner.style.display = 'flex';

    const closeBtn = document.getElementById('storage-warning-close');
    closeBtn.addEventListener('click', function () {
        banner.style.display = 'none';
    });
}

/**
 * Shows the chart fallback message (when Chart.js CDN failed to load).
 */
function showChartFallback() {
    document.getElementById('chart-fallback').style.display = 'block';
}

// =============================================================================
// SECTION 6: Module-level state + Event Handlers + App Initialization
// =============================================================================

// Single source of truth — all UI sections derive from this array
let transactions = [];

// ---------------------------------------------------------------------------
// 8.1 Form submit handler
// ---------------------------------------------------------------------------
document.getElementById('expense-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const name     = document.getElementById('input-name').value;
    const amount   = document.getElementById('input-amount').value;
    const category = document.getElementById('input-category').value;

    clearFormErrors();
    const result = validateInput(name, amount, category);

    if (!result.valid) {
        showFormErrors(result.errors);
        return;
    }

    const tx = createTransaction(name, amount, category);
    transactions.push(tx);
    saveTransactions(transactions);
    renderTransactionList(transactions);
    renderBalance(computeBalance(transactions));
    renderChart(computeCategoryData(transactions));
    resetForm();
});

// ---------------------------------------------------------------------------
// 8.2 Delete — event delegation on the transaction list
// ---------------------------------------------------------------------------
document.getElementById('transaction-list').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-delete-id]');
    if (!btn) return;

    const id   = btn.getAttribute('data-delete-id');
    const copy = transactions.slice(); // snapshot for rollback

    transactions = transactions.filter(t => t.id !== id);
    const saved = saveTransactions(transactions);

    if (!saved) {
        // Rollback and inform the user
        transactions = copy;
        renderTransactionList(transactions);

        let toast = document.getElementById('error-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'error-toast';
            document.getElementById('list-section').prepend(toast);
        }
        toast.textContent = 'Could not delete — storage error. Please try again.';
        toast.style.display = 'block';
        return;
    }

    // Success — hide any existing toast
    const toast = document.getElementById('error-toast');
    if (toast) toast.style.display = 'none';

    renderTransactionList(transactions);
    renderBalance(computeBalance(transactions));
    renderChart(computeCategoryData(transactions));
});

// ---------------------------------------------------------------------------
// 8.4 App initialization
// ---------------------------------------------------------------------------
function initApp() {
    transactions = loadTransactions();

    if (storageAvailable === false) {
        showStorageWarning();
    }

    renderTransactionList(transactions);
    renderBalance(computeBalance(transactions));
    renderChart(computeCategoryData(transactions));
}

document.addEventListener('DOMContentLoaded', initApp);
