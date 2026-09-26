# Test Suite — Expense & Budget Visualizer

All tests are self-contained HTML files. No build step, no Node.js, no npm
commands are needed. Open each file in a browser to run it.

---

## Files

| File | Task | Coverage |
|---|---|---|
| `validation.test.html` | 11.1 | Form validation (pure function + submit integration) |
| `storage-and-state.test.html` | 11.2 | Empty state, localStorage load, storage errors, Chart.js CDN failure, category colors |
| `integration.test.html` | 11.3 | Full add-delete cycle, page-reload persistence, corrupt-JSON recovery |

---

## How to Run

### Option A — Laragon (recommended)

1. Start Laragon and make sure Apache is running.
2. The project is already served at:
   `http://localhost/CodingCamp-21Sept26-KafiNurHikmah/`
3. Open any test file directly in your browser:
   - `http://localhost/CodingCamp-21Sept26-KafiNurHikmah/tests/validation.test.html`
   - `http://localhost/CodingCamp-21Sept26-KafiNurHikmah/tests/storage-and-state.test.html`
   - `http://localhost/CodingCamp-21Sept26-KafiNurHikmah/tests/integration.test.html`
4. Each page renders a pass/fail summary. All tests should show green.

### Option B — VS Code Live Server

1. Install the **Live Server** extension in VS Code.
2. Right-click any test HTML file → **Open with Live Server**.
3. The browser opens automatically and runs the tests.

### Option C — file:// (works for most tests)

Open the test files directly from disk:
```
File → Open File → tests/validation.test.html
```

> **Note:** Some browsers block `localStorage` on `file://` URLs by default
> (especially Safari). Use Laragon or Live Server if localStorage-related
> tests fail unexpectedly.

---

## What a Passing Run Looks Like

Each test page shows a coloured summary banner at the top:

- **Green** — all tests passed
- **Red** — one or more tests failed, with details below

Open the browser's DevTools console for additional detail on any failure.

---

## Requirements Traceability

| Requirement | Covered by |
|---|---|
| 1.2, 1.3, 1.4, 1.5, 1.6 | `validation.test.html` |
| 2.3, 2.4, 2.5 | `storage-and-state.test.html`, `integration.test.html` |
| 3.1, 3.2, 3.3, 3.4 | `validation.test.html`, `integration.test.html` |
| 4.1, 4.4, 4.5, 4.6, 4.7 | `storage-and-state.test.html`, `integration.test.html` |
| 5.1, 5.2, 5.3, 5.4 | `integration.test.html`, `storage-and-state.test.html` |
| 7.4, 7.5 | `storage-and-state.test.html` |
