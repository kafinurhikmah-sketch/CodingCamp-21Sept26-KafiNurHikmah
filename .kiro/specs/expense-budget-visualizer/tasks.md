# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a fully client-side single-page web application using plain HTML, CSS, and Vanilla JavaScript. The app allows users to record personal expenses by category (Food, Transport, Fun), view a running balance, and visualize spending via a Chart.js pie chart. All data persists in the browser's Local Storage with no build step or external dependencies beyond a CDN-loaded Chart.js.

Implementation follows the design's layered architecture: pure logic functions (validator, balance calculator, chart data calculator) isolated from imperative DOM/Storage I/O, all wired together by event handlers in a single `js/app.js` file.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create the root `index.html`, `css/` directory, and `js/` directory
  - Write the complete HTML structure: `<head>` with meta viewport, charset, title, and CSS link; `<body>` with four named sections — Input Form (`#form-section`), Balance Display (`#balance-section`), Transaction List (`#list-section`), and Chart (`#chart-section`)
  - Add visible `<h2>` headings for each section (font-size rule to be enforced in CSS)
  - Place the Chart.js CDN `<script>` tag with an `onerror` handler that reveals the `#chart-fallback` element
  - Place `<script src="js/app.js"></script>` at the bottom of `<body>`
  - Add `<div id="chart-fallback" style="display:none">` inside the chart section
  - Add a dismissible `<div id="storage-warning" style="display:none">` banner at the top of `<body>`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Build the Input Form HTML and CSS
  - [x] 2.1 Add Input Form fields and submit button to `index.html`
    - Text input `#input-name` (maxlength="100"), number input `#input-amount`, `<select id="input-category">` with a blank default option and exactly three options: Food, Transport, Fun
    - Each field wrapped in a `<div class="field-group">` containing a `<label>` and a `<span class="field-error" aria-live="polite"></span>` for inline errors
    - A `<button type="submit">Add Expense</button>`
    - _Requirements: 1.1, 1.4_

  - [x] 2.2 Style the Input Form in `css/style.css`
    - Base body styles: `font-size: 14px`, `line-height: 1.4`, neutral background and text colors achieving ≥ 4.5:1 contrast ratio
    - Section headings at least 2 px larger than body font (`font-size: 16px` minimum)
    - Sections separated by `margin-bottom: 16px` or equivalent spacing
    - Style `.field-error` in red with sufficient contrast; hidden by default via empty content
    - Style the submit button with accessible focus styles
    - _Requirements: 6.2, 6.4, 6.6_

- [x] 3. Implement the Validator pure function in `js/app.js`
  - [x] 3.1 Write `validateInput(name, amount, category)`
    - Returns `{ valid: true, errors: {} }` or `{ valid: false, errors: { name?, amount?, category? } }`
    - Name rule: trimmed non-empty AND length ≤ 100 characters
    - Amount rule: parses to a finite number in [0.01, 999999999.99]
    - Category rule: must be exactly `"Food"`, `"Transport"`, or `"Fun"`
    - _Requirements: 1.3, 1.4, 1.6_

  - [ ]* 3.2 Write property test for `validateInput` (Property 1)
    - **Property 1: Validator correctness** — for any (name, amount, category) triple, `validateInput` returns `valid: true` if and only if all three rules pass simultaneously; otherwise `valid: false` with errors identifying each offending field
    - Use `fc.string()`, `fc.float()`, `fc.constantFrom(...)` generators including whitespace-only names, out-of-range amounts, and invalid category strings
    - Run minimum 100 iterations
    - **Validates: Requirements 1.2, 1.3, 1.6**

- [-] 4. Implement the Transaction Factory and Store in `js/app.js`
  - [x] 4.1 Write `createTransaction(name, amount, category)`
    - Generates a unique `id` using `crypto.randomUUID()` (fallback: `Date.now().toString(36) + Math.random().toString(36).slice(2)`)
    - Stores `name` as trimmed string, `amount` as `parseFloat(amount)`, `category` as-is, `createdAt` as `Date.now()`
    - _Requirements: 1.2, 5.1_

  - [x] 4.2 Write `loadTransactions()` and `saveTransactions(transactions)`
    - `loadTransactions`: reads `"expense_visualizer_transactions"` from `localStorage`, wraps in try/catch, returns `[]` on any failure and sets module-level `storageAvailable = false`
    - `saveTransactions`: wraps `localStorage.setItem` in try/catch; on failure does NOT mutate the in-memory array and returns `false`; silently logs to console when `storageAvailable = false`
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]* 4.3 Write property test for serialization round-trip (Property 6)
    - **Property 6: Transaction serialization round-trip** — for any array of valid Transaction objects, `JSON.parse(JSON.stringify(transactions))` produces objects with equivalent `id`, `name`, `amount`, `category`, and `createdAt` fields
    - Use `fc.array(transactionArbitrary)` generator
    - **Validates: Requirements 5.3**

- [x] 5. Implement Balance Calculator and Chart Data Calculator in `js/app.js`
  - [x] 5.1 Write `computeBalance(transactions)`
    - Returns `transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)`
    - Returns `"0.00"` for an empty array
    - _Requirements: 3.1, 3.4_

  - [ ]* 5.2 Write property test for `computeBalance` (Property 2)
    - **Property 2: Balance calculation accuracy** — for any array of transactions, result equals `reduce+toFixed(2)`; empty array returns `"0.00"`
    - Use `fc.array(fc.record({ amount: fc.float({ min: 0.01, max: 999999999.99 }) }))` including empty array case
    - **Validates: Requirements 3.1, 3.4**

  - [x] 5.3 Write `computeCategoryData(transactions)`
    - Aggregates total amount per category (Food, Transport, Fun)
    - Returns only categories where total > 0 as `{ label, percentage, total }` objects
    - `percentage = (categoryTotal / grandTotal) * 100`, rounded to 2 dp
    - _Requirements: 4.1, 4.7_

  - [ ]* 5.4 Write property test for `computeCategoryData` (Property 3)
    - **Property 3: Category percentage integrity** — for any non-empty transaction list, sum of all returned percentages equals 100 (±0.01 tolerance); only categories with total > 0 are included; each percentage equals `(categoryTotal / grandTotal) * 100`
    - Use `fc.array(fc.record({ category: fc.constantFrom('Food','Transport','Fun'), amount: fc.float({min:0.01}) }), {minLength:1})` — include single-category and two-category cases
    - **Validates: Requirements 4.1, 4.7**

- [x] 6. Checkpoint — core pure logic complete
  - Ensure all property tests for Validator, Balance Calculator, Chart Data Calculator, and Serialization pass
  - Ask the user if questions arise before proceeding to UI

- [x] 7. Implement UI Renderer functions in `js/app.js`
  - [x] 7.1 Write `renderTransactionList(transactions)`
    - Clears the list container and rebuilds it; each row shows item name, amount formatted to 2 dp, category, and a delete button with `data-delete-id` attribute
    - When `transactions` is empty, renders the empty-state message ("No expenses recorded yet.")
    - Insertion order matches array order
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 7.2 Write property test for list ordering and formatting (Property 4)
    - **Property 4: Transaction list ordering and formatting** — for any transaction array, rendered HTML preserves insertion order and each amount appears formatted to exactly 2 decimal places
    - Use `fc.array(transactionArbitrary)` generator; inspect rendered DOM nodes
    - **Validates: Requirements 2.1**

  - [x] 7.3 Write `renderBalance(balanceStr)`
    - Updates the text content of the `#balance-value` element with the provided string
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.4 Write `renderChart(categoryData)`
    - If `categoryData` is empty (no transactions or all-zero), destroys any existing Chart instance and shows the no-data text; does NOT render any pie slices
    - Otherwise, creates or updates a `Chart.js` instance of type `"pie"` with fixed color mapping (`Food → #4CAF50`, `Transport → #2196F3`, `Fun → #FF5722`), labels showing category names and percentages, and a legend
    - Handles the case where `window.Chart` is undefined (CDN failure) by showing `#chart-fallback`
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 7.4, 7.5_

  - [x] 7.5 Write `showFormErrors(errors)`, `clearFormErrors()`, and `resetForm()`
    - `showFormErrors`: inserts the error string into the corresponding `.field-error` span for each key in `errors`
    - `clearFormErrors`: empties all `.field-error` spans
    - `resetForm`: sets name and amount inputs to `""` and category select to its default blank option
    - _Requirements: 1.4, 1.5_

  - [x] 7.6 Write `showStorageWarning()` and `showChartFallback()`
    - `showStorageWarning`: makes `#storage-warning` visible with a dismissible close button
    - `showChartFallback`: makes `#chart-fallback` visible
    - _Requirements: 5.4, 7.5_

- [x] 8. Implement Event Handlers and app initialization in `js/app.js`
  - [x] 8.1 Wire the form submit event handler
    - Reads `#input-name`, `#input-amount`, `#input-category` values; calls `clearFormErrors()`, then `validateInput()`
    - On invalid: calls `showFormErrors(errors)` and returns
    - On valid: calls `createTransaction()`, pushes to `transactions`, calls `saveTransactions()`, then `renderTransactionList()`, `renderBalance()`, `renderChart()`, `resetForm()` — all within the same synchronous call
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.2, 4.2_

  - [x] 8.2 Wire the delete event handler (event delegation on list container)
    - Listens for clicks on `[data-delete-id]` elements; saves original array copy for rollback
    - Filters out the matching id; calls `saveTransactions()`; on save failure restores from copy and calls `renderTransactionList()` + shows error message
    - On success calls `renderTransactionList()`, `renderBalance()`, `renderChart()`
    - _Requirements: 2.3, 2.5, 3.3, 4.3_

  - [ ]* 8.3 Write property test for delete correctness (Property 5)
    - **Property 5: Delete removes the correct transaction** — for any non-empty transaction array and any valid index, filtering by that transaction's id produces a list that: does not contain the deleted id, contains all other transactions unchanged, and has length exactly one less
    - Use `fc.array(transactionArbitrary, {minLength:1})` + `fc.integer` for index selection
    - **Validates: Requirements 2.3**

  - [x] 8.4 Write the `initApp()` startup function and call it on `DOMContentLoaded`
    - Calls `loadTransactions()`; if `storageAvailable === false` calls `showStorageWarning()`
    - Calls `renderTransactionList()`, `renderBalance()`, `renderChart()` to hydrate UI before first user interaction
    - _Requirements: 5.3, 5.4_

- [x] 9. Checkpoint — full logic and rendering wired together
  - Ensure all property tests pass; manually verify add and delete flows update list, balance, and chart correctly
  - Ask the user if questions arise before proceeding to styling

- [x] 10. CSS responsive layout and accessibility
  - [x] 10.1 Implement responsive single-column layout
    - Default layout: two-column grid (form+balance on left, list+chart on right) or flexible layout that avoids horizontal scroll between 320 px and 1920 px
    - Media query at `max-width: 767px`: stack all four sections vertically in a single column; no element exceeds `100vw`
    - _Requirements: 6.1, 6.5_

  - [ ]* 10.2 Write unit tests for responsive layout (CSS media query smoke test)
    - At 767 px viewport width, verify single-column stacking; at 1024 px, verify multi-column layout
    - _Requirements: 6.5_

  - [x] 10.3 Apply typography and spacing rules
    - Body `font-size: 14px`, `line-height: 1.4`
    - Section headings `font-size: 16px` (at least 2 px above body)
    - Inter-section spacing `≥ 16px`
    - All text/background color pairs meet WCAG 2.1 AA 4.5:1 contrast ratio
    - _Requirements: 6.2, 6.4, 6.6_

- [x] 11. Write unit tests for integration scenarios
  - [x]* 11.1 Write unit tests for form validation cases
    - Valid full submission: verify transaction in list, balance updated, form reset within 500 ms
    - Each invalid case (empty name, whitespace-only name, amount = 0, amount < 0, amount > max, no category): verify correct error message shown, transaction count unchanged
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x]* 11.2 Write unit tests for empty state, storage load, and error paths
    - Empty state: `0.00` balance, empty-state message in list, no-data message in chart
    - Storage load on init: pre-populate `localStorage` with valid JSON, reload app, verify all transactions render
    - Storage unavailable: mock `localStorage.setItem` to throw; verify warning banner and in-memory state retained
    - Delete failure: mock `saveTransactions` to fail; verify transaction remains in list and error message shown
    - Chart.js CDN failure: set `window.Chart = undefined`; verify `#chart-fallback` visible and non-chart features work
    - Category colors: verify Food → `#4CAF50`, Transport → `#2196F3`, Fun → `#FF5722`
    - _Requirements: 2.4, 2.5, 3.4, 4.4, 4.5, 5.3, 5.4, 7.5_

  - [x]* 11.3 Write integration tests for full add-delete cycle and page reload persistence
    - Add 3 transactions across all three categories; verify balance and chart percentages; delete one; verify all three UI sections update correctly
    - Add transactions, trigger page reload, verify all transactions restored from `localStorage`
    - Set `localStorage['expense_visualizer_transactions']` to invalid JSON, reload, verify empty state with warning
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. Final checkpoint — all tests pass, cross-browser smoke test
  - Ensure all property tests and unit tests pass
  - Open `index.html` directly in Chrome, Firefox, Edge, and Safari; verify no console JavaScript errors
  - Ask the user if questions arise before closing out the spec

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Checkpoints at tasks 6, 9, and 12 validate incremental progress
- All six design correctness properties are covered by property-based tests (tasks 3.2, 4.3, 5.2, 5.4, 7.2, 8.3)
- The entire app lives in three files: `index.html`, `css/style.css`, `js/app.js` — no build step required
- `fast-check` is the recommended property-based testing library; load via CDN in a test HTML or use with Vitest/Jest

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1", "4.2", "5.1", "5.3"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.3", "5.2", "5.4"] },
    { "id": 2, "tasks": ["7.1", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 3, "tasks": ["7.2", "8.1", "8.2", "8.4"] },
    { "id": 4, "tasks": ["8.3", "10.1", "10.3"] },
    { "id": 5, "tasks": ["10.2", "11.1", "11.2"] },
    { "id": 6, "tasks": ["11.3"] }
  ]
}
```
