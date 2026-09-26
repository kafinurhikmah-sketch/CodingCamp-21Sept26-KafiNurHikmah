# Requirements Document

## Introduction

This document specifies three enhancement features for the existing Expense & Budget Visualizer web application: transaction sorting by amount or category, a configurable spending limit with visual highlighting, and a dark/light mode toggle. All enhancements are additive and must remain consistent with the existing architecture (vanilla HTML, CSS, JavaScript; no build step; data persisted in browser Local Storage).

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense record consisting of an item name, a monetary amount, and a category (existing)
- **Transaction_List**: The scrollable on-screen list that displays all stored Transactions (existing)
- **Sort_Control**: The UI element (dropdown or button group) that allows the user to select a sort criterion for the Transaction_List
- **Sort_Order**: The current sort criterion applied to the Transaction_List — one of: `"insertion"` (default), `"amount-asc"`, `"amount-desc"`, `"category-asc"`, or `"category-desc"`
- **Spending_Limit**: A user-defined monetary threshold above which individual Transaction amounts are considered over-budget
- **Limit_Input**: The numeric input field through which the user sets the Spending_Limit
- **Over_Limit_Indicator**: The visual highlight applied to a Transaction_List entry whose amount exceeds the Spending_Limit
- **Theme**: The active color scheme of the App — either `"light"` (default) or `"dark"`
- **Theme_Toggle**: The interactive control (button or switch) that switches the Theme between `"light"` and `"dark"`
- **Storage**: The browser's Local Storage API used to persist data client-side (existing)
- **Validator**: The client-side validation logic that checks input field completeness before submission (existing)

---

## Requirements

### Requirement 1: Transaction Sort

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can quickly find and review related expenses.

#### Acceptance Criteria

1. THE App SHALL provide a Sort_Control that offers the following sort options: default insertion order, amount ascending, amount descending, category ascending (A–Z), and category descending (Z–A).
2. WHEN the user selects a sort option from the Sort_Control, THE Transaction_List SHALL re-render within 300 milliseconds to display Transactions in the selected Sort_Order without requiring a page reload.
3. WHEN the user adds a new Transaction while a non-default Sort_Order is active, THE Transaction_List SHALL re-render in the currently active Sort_Order after the Transaction is added.
4. WHEN the user deletes a Transaction while a non-default Sort_Order is active, THE Transaction_List SHALL re-render in the currently active Sort_Order after the Transaction is deleted.
5. THE Sort_Control SHALL preserve the active Sort_Order across page reloads by reading and writing the Sort_Order value to Storage.
6. WHEN the Sort_Order stored in Storage is absent or contains an unrecognized value, THE App SHALL initialize the Sort_Control to the default insertion order.
7. THE Sort_Control SHALL NOT modify the order in which Transactions are stored in Storage; Storage SHALL always preserve insertion order.

---

### Requirement 2: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit so that I can immediately see which individual expenses exceed my budget threshold.

#### Acceptance Criteria

1. THE App SHALL provide a Limit_Input field that accepts a positive numeric value representing the Spending_Limit.
2. WHEN the user submits a Spending_Limit value, THE Validator SHALL check that the value is a finite number greater than 0 and not greater than 999,999,999.99.
3. IF the Validator detects that the Spending_Limit value is absent, non-numeric, less than or equal to 0, or greater than 999,999,999.99, THEN THE Validator SHALL display an inline error message adjacent to the Limit_Input field and SHALL NOT update the active Spending_Limit.
4. WHEN a valid Spending_Limit is set, THE App SHALL apply the Over_Limit_Indicator to every Transaction_List entry whose amount is strictly greater than the Spending_Limit.
5. WHEN a valid Spending_Limit is set, THE App SHALL remove the Over_Limit_Indicator from every Transaction_List entry whose amount is less than or equal to the Spending_Limit.
6. WHEN a new Transaction is added while a Spending_Limit is active, THE App SHALL apply or omit the Over_Limit_Indicator to the new entry based on whether the Transaction amount is strictly greater than the Spending_Limit.
7. WHEN a Spending_Limit is updated, THE App SHALL re-evaluate and update the Over_Limit_Indicator on every Transaction_List entry immediately without requiring a page reload.
8. THE App SHALL persist the active Spending_Limit value to Storage so that the Spending_Limit is restored after a page reload.
9. WHEN no Spending_Limit has been set or the stored value is absent, THE App SHALL display no Over_Limit_Indicator on any Transaction_List entry.
10. THE App SHALL provide a control to clear the active Spending_Limit; WHEN the user activates this control, THE App SHALL remove all Over_Limit_Indicators and clear the Spending_Limit from Storage.

---

### Requirement 3: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between a dark and light color theme, so that I can use the app comfortably in different lighting environments.

#### Acceptance Criteria

1. THE App SHALL provide a Theme_Toggle that switches the Theme between `"light"` and `"dark"`.
2. WHEN the user activates the Theme_Toggle, THE App SHALL apply the selected Theme to the entire page within 200 milliseconds without requiring a page reload.
3. THE Theme_Toggle SHALL display a visible label or icon indicating the currently active Theme so the user can identify the current mode at a glance.
4. THE App SHALL persist the active Theme value to Storage so that the selected Theme is restored after a page reload.
5. WHEN no Theme value is stored, THE App SHALL initialize the Theme to match the operating system preference reported by the `prefers-color-scheme` media query; IF no operating system preference is detectable, THE App SHALL default to `"light"` Theme.
6. THE dark Theme SHALL maintain a minimum contrast ratio of 4.5:1 between all visible text elements and their respective backgrounds, as measured by the WCAG 2.1 AA standard.
7. THE App SHALL apply the Theme by toggling a CSS class on the `<body>` element so that all Theme-specific colors are defined exclusively in CSS.
8. WHEN the Theme is `"dark"`, THE App SHALL apply a dark background color (maximum luminance value of #444444) and a light text color (minimum luminance value of #dddddd) to the page body.

---

### Requirement 4: Persistence of Enhancement Settings

**User Story:** As a user, I want my sort preference, spending limit, and theme choice to survive page refreshes, so that I do not need to reconfigure the app every time I reload the page.

#### Acceptance Criteria

1. WHEN the App loads, THE App SHALL read the Sort_Order, Spending_Limit, and Theme values from Storage and apply each setting before the user can interact with the App.
2. THE App SHALL store the Sort_Order under the Storage key `"expense_visualizer_sort_order"`, the Spending_Limit under `"expense_visualizer_spending_limit"`, and the Theme under `"expense_visualizer_theme"`.
3. IF Storage is unavailable, THE App SHALL initialize all three enhancement settings to their default values (insertion order, no spending limit, system/light theme) and SHALL continue to function without persisting settings.
4. WHEN any enhancement setting changes, THE App SHALL write the updated value to Storage before the next user interaction is processed.

