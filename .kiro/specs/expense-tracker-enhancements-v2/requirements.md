# Requirements Document

## Introduction

This document covers three enhancements to the existing Expense and Budget Visualizer web application. The app is a vanilla JS single-page application that lets users record, view, and delete expense transactions, with data persisted to localStorage and a Chart.js pie chart showing spending by category.

The three features are:

1. **Sort Transactions** - a UI control to sort the transaction list by amount (ascending/descending) or by category (A-Z).
2. **Spending Limit Highlight** - a user-configurable spending limit; any individual transaction whose amount exceeds this limit is visually highlighted in the transaction list.
3. **Dark/Light Mode Toggle** - a button that switches the entire UI between dark and light themes, with the preference persisted to localStorage.

---

## Glossary

- **App**: The Expense and Budget Visualizer single-page web application.
- **Transaction**: A single expense record with the properties id, name, amount, category, and createdAt.
- **Transaction_List**: The ordered ul element (#transaction-list) that displays all recorded transactions.
- **Sort_Control**: The UI element (dropdown or button group) that lets the user select a sort order for the Transaction_List.
- **Sort_Order**: One of three supported orderings - Amount Ascending, Amount Descending, or Category A-Z.
- **Spending_Limit**: A user-defined numeric threshold. Defaults to empty (no limit active).
- **Limit_Input**: The numeric input field where the user enters the Spending_Limit value.
- **Highlighted_Transaction**: A transaction list item visually distinguished because its amount exceeds the active Spending_Limit.
- **Theme**: One of two visual modes - light (default) or dark.
- **Theme_Toggle**: The button that switches the active Theme between light and dark.
- **Theme_Preference**: The Theme value persisted in localStorage under the key expense_visualizer_theme.

---

## Requirements

### Requirement 1: Sort Transactions by Amount or Category

**User Story:** As a user, I want to sort my transaction list by amount or category so that I can quickly find the largest expenses or group related items together.

#### Acceptance Criteria

1. THE App SHALL display a Sort_Control above the Transaction_List that offers at least three Sort_Order options: Amount Ascending, Amount Descending, and Category A-Z.
2. WHEN the user selects a Sort_Order from the Sort_Control, THE Transaction_List SHALL re-render within 300 milliseconds with transactions ordered according to the selected Sort_Order.
3. WHEN the Sort_Order is Amount Ascending, THE Transaction_List SHALL display transactions ordered from the lowest amount to the highest amount, with ties broken by createdAt ascending.
4. WHEN the Sort_Order is Amount Descending, THE Transaction_List SHALL display transactions ordered from the highest amount to the lowest amount, with ties broken by createdAt ascending.
5. WHEN the Sort_Order is Category A-Z, THE Transaction_List SHALL display transactions ordered alphabetically by category name from A to Z.
6. WHEN two transactions share the same sort key under the Category A-Z Sort_Order, THE Transaction_List SHALL order those transactions by createdAt ascending as a tiebreaker.
7. WHEN a new Transaction is added, THE Transaction_List SHALL re-render in the currently selected Sort_Order.
8. WHEN a Transaction is deleted, THE Transaction_List SHALL re-render in the currently selected Sort_Order.
9. THE App SHALL apply a default Sort_Order of Amount Descending on initial page load.
10. THE Sort_Control SHALL remain visible on both desktop and mobile viewports.
11. WHEN the Transaction_List is empty, THE Sort_Control SHALL remain visible and SHALL reflect the currently selected Sort_Order.

---

### Requirement 2: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and have any transaction above that limit visually highlighted, so that I can immediately spot high-value expenses.

#### Acceptance Criteria

1. THE App SHALL display a Limit_Input field that accepts a positive numeric value in the range 0.01 to 999999999.99 with a maximum input length of 13 characters, representing the Spending_Limit.
2. WHEN the user enters a value in the Limit_Input and that value parses to a finite number greater than 0, THE App SHALL treat that value as the active Spending_Limit.
3. WHEN the Limit_Input is empty or contains a non-numeric value, THE App SHALL treat the Spending_Limit as inactive, remove any existing highlights from all visible transactions, and THE Transaction_List SHALL display no Highlighted_Transactions.
4. WHEN the Spending_Limit is active, THE Transaction_List SHALL apply a background color change to every Highlighted_Transaction whose amount is strictly greater than the Spending_Limit, meeting the contrast ratio specified in Criterion 9.
5. WHEN the Spending_Limit is active and a transaction amount is less than or equal to the Spending_Limit, THE Transaction_List SHALL display that transaction without the highlighted visual style.
6. WHEN the user changes the Spending_Limit value in the Limit_Input, THE Transaction_List SHALL re-evaluate and update the highlighted state of all visible transactions on each input event within the same render frame.
7. WHEN a new Transaction is added, THE Transaction_List SHALL apply the current Spending_Limit highlighting rules to the new item.
8. IF the Limit_Input receives a value less than or equal to 0, THEN THE App SHALL display an inline validation message stating the limit must be greater than 0 and SHALL treat the Spending_Limit as inactive.
9. THE Highlighted_Transaction visual style SHALL meet a color contrast ratio of at least 3:1 between the highlight background and the default list item background.
10. THE Limit_Input SHALL be visible and fully usable at viewport widths as narrow as 320px without horizontal scrolling or clipping.

---

### Requirement 3: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes and have my preference remembered, so that I can use the app comfortably in different lighting conditions without resetting my choice every visit.

#### Acceptance Criteria

1. THE App SHALL display a Theme_Toggle button that is visible and reachable in all App views without scrolling.
2. WHEN the user activates the Theme_Toggle, THE App SHALL immediately switch the active Theme from light to dark, or from dark to light, with no delay or intermediate state.
3. WHEN the Theme is dark, THE App SHALL apply a dark color palette to all visible UI sections, including the background, text, inputs, buttons, and the Transaction_List.
4. WHEN the Theme is light, THE App SHALL apply the original light color palette to all visible UI sections.
5. WHEN the user activates the Theme_Toggle, THE App SHALL save the new Theme value as the Theme_Preference in localStorage under the key expense_visualizer_theme.
6. WHEN the App initializes, THE App SHALL read the Theme_Preference from localStorage under the key expense_visualizer_theme and apply it such that no flash of a different Theme is observable during page load.
7. IF no Theme_Preference is found in localStorage on initialization, THEN THE App SHALL apply the light Theme as the default.
8. WHEN the Theme is dark, THE App SHALL maintain a minimum text-to-background contrast ratio of 4.5:1 for all body text.
9. WHEN the Theme is dark, THE App SHALL maintain a minimum text-to-background contrast ratio of 3:1 for all large text and UI components.
10. WHEN the Theme is light, THE App SHALL maintain a minimum text-to-background contrast ratio of 4.5:1 for all body text and 3:1 for all large text and UI components.
11. WHILE the Theme is light, THE Theme_Toggle button SHALL display a label or icon indicating Dark mode; WHILE the Theme is dark, THE Theme_Toggle button SHALL display a label or icon indicating Light mode.
