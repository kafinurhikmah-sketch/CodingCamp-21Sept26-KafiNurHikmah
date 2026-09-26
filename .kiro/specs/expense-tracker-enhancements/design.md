# Design Document — Expense Tracker Enhancements

## Overview

This document describes the technical design for three additive enhancements to the existing **Expense & Budget Visualizer** web application:

1. **Transaction Sort** — a `Sort_Control` dropdown that re-renders the `Transaction_List` in the chosen order without altering Storage.
2. **Spending Limit Highlight** — a `Limit_Input` field plus a clear button; transactions exceeding the active limit receive an `Over_Limit_Indicator` visual class.
3. **Dark/Light Mode Toggle** — a `Theme_Toggle` button that switches the page theme via a CSS class on `<body>`, respecting OS preference on first load.

All three features persist their state to `localStorage` and degrade gracefully when Storage is unavailable. The implementation stays strictly within the existing constraints: vanilla HTML/CSS/JS, no build step, no external frameworks beyond Chart.js.

---

## Architecture

The existing codebase already has a clean separation between pure functions and DOM side effects, organized in numbered sections in `js/app.js`. The enhancements follow the same pattern:

```
js/app.js
  Section 1: validateInput()                    ← existing
  Section 2: createTransaction()                ← existing
  Section 3: Storage I/O (transactions)         ← existing
  Section 3b: Enhancement settings Storage I/O  ← NEW
  Section 4: computeBalance(), computeCategoryData() ← existing
  Section 4b: applySortOrder(), validateSpendingLimit() ← NEW (pure)
  Section 5: renderTransactionList() (updated), renderBalance(), renderChart() ← updated
  Section 5b: applyTheme(), renderSpendingLimitUI() ← NEW
  Section 6: state, event handlers, initApp()   ← updated

css/style.css
  Existing styles unchanged
  NEW: .dark-mode overrides via CSS custom properties
  NEW: .over-limit highlight class
  NEW: Theme_Toggle and Sort_Control element styles

index.html
  Existing structure unchanged
  NEW: Sort_Control dropdown added to #list-section header area
  NEW: Spending Limit sub-section added (Limit_Input + clear button)
  NEW: Theme_Toggle button added to page header/nav area
```

The data flow on every user action is:

```
User action
  → update module-level state (transactions / sortOrder / spendingLimit / theme)
  → save to Storage (saveEnhancementSetting or saveTransactions)
  → re-render affected UI (renderTransactionList / applyTheme / etc.)
```

No reactive framework is involved; re-renders are imperative and synchronous, keeping the existing sub-500 ms response expectations well within reach.

---

## Components and Interfaces

### 3b. Enhancement Settings Storage I/O

Three new Storage keys (Requirement 4.2):

| Setting        | Storage Key                           | Default Value  |
|----------------|---------------------------------------|----------------|
| Sort_Order     | `expense_visualizer_sort_order`       | `"insertion"`  |
| Spending_Limit | `expense_visualizer_spending_limit`   | `null`         |
| Theme          | `expense_visualizer_theme`            | `null` → detect OS, then `"light"` |

```js
const SORT_KEY  = 'expense_visualizer_sort_order';
const LIMIT_KEY = 'expense_visualizer_spending_limit';
const THEME_KEY = 'expense_visualizer_theme';

const VALID_SORT_ORDERS = ['insertion', 'amount-asc', 'amount-desc', 'category-asc', 'category-desc'];

/**
 * Reads all three enhancement settings from Storage.
 * Returns safe defaults for any missing or invalid stored value.
 * Pure with respect to state — no module-level mutations.
 *
 * @returns {{ sortOrder: string, spendingLimit: number|null, theme: string }}
 */
function loadEnhancementSettings() { … }

/**
 * Writes a single enhancement setting to Storage.
 * Silently no-ops when storageAvailable is false.
 *
 * @param {string} key   - one of SORT_KEY, LIMIT_KEY, THEME_KEY
 * @param {*}      value - serializable value
 */
function saveEnhancementSetting(key, value) { … }
```

`loadEnhancementSettings` behavior:
- Sort_Order: if absent or not in `VALID_SORT_ORDERS`, returns `"insertion"` (Req 1.6).
- Spending_Limit: if absent or non-positive, returns `null` (Req 2.9).
- Theme: if absent, reads `window.matchMedia('(prefers-color-scheme: dark)').matches`; if still indeterminate, returns `"light"` (Req 3.5).

---

### 4b. Pure Computation Functions

#### `applySortOrder(transactions, sortOrder)`

```js
/**
 * Returns a sorted copy of the transactions array for display.
 * Does NOT mutate the input array (Storage order is never changed — Req 1.7).
 *
 * @param {Transaction[]} transactions
 * @param {string}        sortOrder - one of VALID_SORT_ORDERS
 * @returns {Transaction[]}
 */
function applySortOrder(transactions, sortOrder) { … }
```

Sort comparison logic:

| sortOrder        | Comparator                                                 |
|------------------|------------------------------------------------------------|
| `"insertion"`    | by `createdAt` ascending (stable insertion order)          |
| `"amount-asc"`   | by `amount` ascending, tie-break by `createdAt` ascending  |
| `"amount-desc"`  | by `amount` descending, tie-break by `createdAt` ascending |
| `"category-asc"` | by `category` lexicographic ascending, tie-break by `createdAt` |
| `"category-desc"`| by `category` lexicographic descending, tie-break by `createdAt` |

The function creates a shallow copy with `.slice()` before calling `.sort()`, guaranteeing the original array reference is untouched.

#### `validateSpendingLimit(value)`

```js
/**
 * Validates a raw spending limit input.
 * Pure function — no side effects.
 *
 * @param {string|number} value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateSpendingLimit(value) { … }
```

Accepts: any finite number strictly greater than 0 and not greater than 999,999,999.99.  
Rejects: absent/empty, non-numeric, `≤ 0`, `> 999,999,999.99`, `Infinity`, `NaN`.

---

### 5b. UI Functions

#### `renderTransactionList(transactions, sortOrder, spendingLimit)`

The existing `renderTransactionList(transactions)` is updated to accept two additional parameters:

```js
/**
 * Rebuilds the transaction list in the DOM.
 * Applies sort order for display and marks over-limit entries.
 *
 * @param {Transaction[]} transactions  - insertion-order master array
 * @param {string}        sortOrder     - active Sort_Order value
 * @param {number|null}   spendingLimit - active limit, or null for none
 */
function renderTransactionList(transactions, sortOrder, spendingLimit) { … }
```

Internally it calls `applySortOrder(transactions, sortOrder)` to get the display order, then for each `<li>` it adds the CSS class `over-limit` if `tx.amount > spendingLimit` (and `spendingLimit` is not null). This satisfies Requirements 2.4, 2.5, 2.6, and 2.7 via a single render path.

All existing call sites of `renderTransactionList` are updated to pass the current `sortOrder` and `spendingLimit` module-level state variables.

#### `applyTheme(theme)`

```js
/**
 * Applies the given theme to the page by toggling a CSS class on <body>.
 * Also updates the Theme_Toggle button label.
 *
 * @param {string} theme - "light" | "dark"
 */
function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
```

#### `initTheme()`

Called once during `initApp()`. Reads the stored/OS-derived theme and calls `applyTheme()`.

#### `renderSpendingLimitUI(spendingLimit)`

Updates the `Limit_Input` field value and the clear button's visibility to match the current `spendingLimit` state. Called after any change to `spendingLimit`.

---

### HTML additions to `index.html`

#### Theme_Toggle — page header area (above `#app-container`)

```html
<header id="app-header">
  <h1>Expense &amp; Budget Visualizer</h1>
  <button type="button" id="theme-toggle" aria-label="Switch to dark mode">
    🌙 Dark Mode
  </button>
</header>
```

#### Sort_Control — inside `#list-section` header

```html
<div class="section-header">
  <h2>Transactions</h2>
  <label for="sort-control" class="sr-only">Sort transactions by</label>
  <select id="sort-control" aria-label="Sort transactions by">
    <option value="insertion">Default (Date Added)</option>
    <option value="amount-asc">Amount: Low → High</option>
    <option value="amount-desc">Amount: High → Low</option>
    <option value="category-asc">Category: A → Z</option>
    <option value="category-desc">Category: Z → A</option>
  </select>
</div>
```

#### Spending Limit — new `#limit-section` alongside `#balance-section`

```html
<section id="limit-section">
  <h2>Spending Limit</h2>
  <div class="field-group">
    <label for="input-limit">Set Limit</label>
    <input
      type="number"
      id="input-limit"
      min="0.01"
      max="999999999.99"
      step="0.01"
      placeholder="e.g. 50.00"
    />
    <span class="field-error" id="error-limit" aria-live="polite"></span>
  </div>
  <button type="button" id="btn-set-limit">Set Limit</button>
  <button type="button" id="btn-clear-limit" style="display:none;">Clear Limit</button>
</section>
```

Grid layout update: `#limit-section` is added to the two-column grid. On desktop it appears below `#balance-section` (column 1, row 3); on mobile it flows after `#balance-section`.

---

## Data Models

No new data models are required. All three enhancement settings are scalar values stored directly in localStorage:

| Field          | JS type          | Storage representation    |
|----------------|------------------|---------------------------|
| `sortOrder`    | `string`         | Raw string                |
| `spendingLimit`| `number \| null` | Stringified number or absent |
| `theme`        | `string`         | `"light"` or `"dark"`     |

Module-level state additions to `js/app.js` (Section 6):

```js
let sortOrder     = 'insertion'; // current Sort_Order
let spendingLimit = null;        // current Spending_Limit (number) or null
let theme         = 'light';     // current Theme
```

These are initialized in `initApp()` from `loadEnhancementSettings()` before the first render.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property Reflection:** After prework, properties 1.3 and 1.4 (sort invariant holds after add/delete) are subsumed by Property 1 (applySortOrder always produces a correctly sorted list). Properties 2.5, 2.6, 2.7, 2.9 are all subsumed by Property 4 (over-limit indicator applied iff amount > limit). Properties 1.5, 2.8, and 3.4 (round-trip persistence for each setting) are consolidated into Property 6 (loadEnhancementSettings round-trip). The remaining distinct testable properties are listed below.

---

### Property 1: applySortOrder produces correct ordering for any sort criterion

*For any* non-empty array of transactions and any valid sort order, `applySortOrder(transactions, sortOrder)` returns a list where consecutive elements satisfy the sort criterion — amounts are non-decreasing for `"amount-asc"`, non-increasing for `"amount-desc"`, and categories are lexicographically non-decreasing for `"category-asc"` — and the `"insertion"` order produces a list sorted by `createdAt` ascending.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 2: applySortOrder never drops or duplicates transactions

*For any* transactions array and any sort order, the length of the returned array equals the length of the input array, and every transaction ID present in the input appears exactly once in the output.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 3: applySortOrder does not mutate the input array

*For any* transactions array and any sort order, the original array reference and its elements are unchanged after calling `applySortOrder`. The insertion-order storage is preserved as-is.

**Validates: Requirements 1.7**

---

### Property 4: Over_Limit_Indicator applied if and only if amount strictly exceeds the Spending_Limit

*For any* list of transactions and any positive finite `spendingLimit`, after calling `renderTransactionList(transactions, sortOrder, spendingLimit)`, each rendered list item has the `over-limit` CSS class applied if and only if its corresponding transaction's `amount` is strictly greater than `spendingLimit`. When `spendingLimit` is `null`, no list item has the `over-limit` class.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.9**

---

### Property 5: validateSpendingLimit accepts valid values and rejects invalid values

*For any* finite positive number `v` where `0 < v ≤ 999,999,999.99`, `validateSpendingLimit(v)` returns `{ valid: true }`. *For any* value that is absent, non-numeric, `NaN`, `Infinity`, `≤ 0`, or `> 999,999,999.99`, `validateSpendingLimit(v)` returns `{ valid: false, error: <non-empty string> }`.

**Validates: Requirements 2.2, 2.3**

---

### Property 6: loadEnhancementSettings round-trip preserves stored values

*For any* valid sort order value, any positive finite spending limit, and any theme value (`"light"` or `"dark"`), writing each value via `saveEnhancementSetting` and then calling `loadEnhancementSettings` returns an object containing those exact values. When Storage is empty or unavailable, `loadEnhancementSettings` returns `{ sortOrder: "insertion", spendingLimit: null, theme: "light" }` (or `"dark"` if OS preference is dark).

**Validates: Requirements 1.5, 1.6, 2.8, 3.4, 4.1, 4.3**

---

### Property 7: applyTheme toggles between exactly two states

*For any* theme value `t` in `{ "light", "dark" }`, `applyTheme(t)` results in `document.body.classList.contains("dark-mode")` being `true` if and only if `t === "dark"`. Applying `"light"` then `"dark"` then `"light"` returns the body to its original class state (round-trip).

**Validates: Requirements 3.1, 3.2, 3.7**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Storage unavailable on load | `loadEnhancementSettings` returns defaults; existing `showStorageWarning()` banner is shown; all features work in-memory |
| Storage write fails (set limit / set sort / toggle theme) | `saveEnhancementSetting` wraps in try/catch, logs silently, returns without throwing; UI state still updates in-memory |
| Invalid sort order in Storage | `loadEnhancementSettings` resets to `"insertion"` (Req 1.6) |
| Invalid spending limit in Storage (negative, non-numeric) | `loadEnhancementSettings` resets to `null` (Req 2.9) |
| Invalid theme in Storage | `loadEnhancementSettings` falls back to OS preference or `"light"` (Req 3.5) |
| User submits invalid spending limit value | `validateSpendingLimit` returns an error; `renderSpendingLimitUI` shows the inline error message next to `#input-limit`; active `spendingLimit` is not changed (Req 2.3) |
| Chart.js CDN failure | Existing fallback unchanged; no interaction with new features |

---

## Testing Strategy

The project uses self-contained browser-based HTML test files (no build step, no Node.js test runner). New test files follow the same pattern established in `tests/validation.test.html`.

### New Test Files

| File | Coverage |
|---|---|
| `tests/sort.test.html` | `applySortOrder` pure function — unit + property tests |
| `tests/spending-limit.test.html` | `validateSpendingLimit` pure function + Over_Limit_Indicator rendering |
| `tests/theme.test.html` | `applyTheme`, `initTheme`, theme toggle interaction |
| `tests/enhancement-settings.test.html` | `loadEnhancementSettings` / `saveEnhancementSetting` round-trips and defaults |

### Unit Tests (example-based)

- `Sort_Control` element exists in DOM with all 5 option values
- Selecting a sort option and adding a transaction: list renders in that order
- `Limit_Input` element exists; clear button shows/hides correctly
- `Theme_Toggle` element exists; label text changes on toggle
- Specific Storage key names are used for each setting (Req 4.2)
- WCAG contrast values for dark theme (documented and verified at design time against CSS values)

### Property-Based Tests

Since the project has no Node.js dependency, property-based testing is implemented with a minimal inline generator harness in each test HTML file, running a configurable number of random iterations (minimum 100). Each property test is tagged with a comment referencing its design property.

**`tests/sort.test.html`**

```js
// Feature: expense-tracker-enhancements, Property 1: applySortOrder produces correct ordering
// Runs 100 iterations with randomly generated transaction arrays and sort orders.
function testSortOrdering(iterations = 100) { … }

// Feature: expense-tracker-enhancements, Property 2: applySortOrder never drops or duplicates
function testSortLengthPreservation(iterations = 100) { … }

// Feature: expense-tracker-enhancements, Property 3: applySortOrder does not mutate input
function testSortImmutability(iterations = 100) { … }
```

**`tests/spending-limit.test.html`**

```js
// Feature: expense-tracker-enhancements, Property 4: Over_Limit_Indicator applied iff amount > limit
// Generates random transaction lists and random positive spending limits.
function testOverLimitIndicator(iterations = 100) { … }

// Feature: expense-tracker-enhancements, Property 5: validateSpendingLimit accepts/rejects correctly
// Generates random valid numbers and random invalid inputs.
function testSpendingLimitValidation(iterations = 100) { … }
```

**`tests/enhancement-settings.test.html`**

```js
// Feature: expense-tracker-enhancements, Property 6: loadEnhancementSettings round-trip
// Generates random combinations of valid settings, writes, and reads back.
function testSettingsRoundTrip(iterations = 100) { … }
```

**`tests/theme.test.html`**

```js
// Feature: expense-tracker-enhancements, Property 7: applyTheme toggles between exactly two states
// Applies "light", "dark", and sequences of both; verifies body class and toggle label.
function testThemeToggle(iterations = 100) { … }
```

### Dual Coverage Summary

| Requirement | Unit/Example Tests | Property Tests |
|---|---|---|
| Req 1 (Sort) | Sort_Control DOM structure, re-render on add/delete | Properties 1, 2, 3 |
| Req 2 (Spending Limit) | UI element presence, clear control behavior | Properties 4, 5 |
| Req 3 (Dark Mode) | Toggle label, WCAG color values, OS default | Property 7 |
| Req 4 (Persistence) | Correct Storage keys, write-before-render timing | Property 6 |
