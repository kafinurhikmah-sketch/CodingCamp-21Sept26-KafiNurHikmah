# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, organize them by category, and visualize spending distribution through a pie chart. The application requires no backend server; all data is persisted in the browser's Local Storage. It is built with plain HTML, CSS, and Vanilla JavaScript, and runs as a standalone web page or browser extension in modern browsers.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense record consisting of an item name, a monetary amount, and a category
- **Category**: One of the three predefined spending groups � Food, Transport, or Fun
- **Transaction_List**: The scrollable on-screen list that displays all stored Transactions
- **Input_Form**: The HTML form through which the user creates new Transactions
- **Balance_Display**: The UI element at the top of the page that shows the total sum of all Transaction amounts
- **Chart**: The pie chart that visualizes spending distribution across Categories
- **Storage**: The browser's Local Storage API used to persist Transaction data client-side
- **Validator**: The client-side validation logic that checks Input_Form field completeness before submission

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter expense details through a form, so that I can record new transactions quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name accepting up to 100 characters, a numeric field for amount accepting values between 0.01 and 999,999,999.99, and a dropdown selector for Category with exactly three options: Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled, THE App SHALL create a new Transaction and add it to the Transaction_List.
3. WHEN the user submits the Input_Form, THE Validator SHALL check that the item name field is not empty, the amount field contains a numeric value between 0.01 and 999,999,999.99, and a Category option has been selected.
4. IF the Validator detects that one or more required fields are empty or invalid, THEN THE Validator SHALL display an inline error message adjacent to each offending field identifying whether the field is empty or contains an invalid value, and SHALL prevent the Transaction from being created.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the Category selector to its unselected default state within 500 milliseconds of the Transaction being added to the Transaction_List.
6. IF the item name field value exceeds 100 characters, THEN THE Validator SHALL display an inline error message adjacent to the item name field indicating the character limit has been exceeded and SHALL prevent the Transaction from being created.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a list of all my recorded expenses, so that I can review and manage my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored Transactions in chronological order of insertion, with each entry showing the item name (up to 100 characters), amount formatted to 2 decimal places, and Category.
2. WHILE the number of Transactions exceeds the visible area of the Transaction_List, THE Transaction_List SHALL remain scrollable to allow the user to view all entries.
3. WHEN the user clicks the delete control for a Transaction entry, THE App SHALL remove that Transaction from the Transaction_List and from Storage within 1 second of the click.
4. WHEN the Transaction_List contains no Transactions, THE Transaction_List SHALL display an empty-state message indicating that no expenses have been recorded.
5. IF a delete operation fails, THEN THE App SHALL retain the Transaction in the Transaction_List and Storage, and SHALL display an error message to the user.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending at a glance, so that I can understand my overall expense level immediately.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of the amounts of all Transactions currently stored in Storage, formatted to two decimal places (e.g., "1234.56").
2. WHEN a new Transaction is added, THE Balance_Display SHALL immediately update to display the recalculated two-decimal total without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL immediately update to display the recalculated two-decimal total without requiring a page reload.
4. WHEN the Transaction_List contains no Transactions, THE Balance_Display SHALL display a value of 0.00.

---

### Requirement 4: Visual Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand how my money is distributed across different areas.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart that displays each Category's percentage share of the total Transaction amount.
2. WHEN a new Transaction is added, THE Chart SHALL update automatically within 1 second to reflect the new spending distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Chart SHALL update automatically within 1 second to reflect the revised spending distribution without requiring a page reload.
4. WHEN the Transaction_List contains no Transactions, THE Chart SHALL display a text message stating there is no data to display and SHALL NOT render any pie slices.
5. THE Chart SHALL assign a unique, non-identical fill color to each of the three Categories (Food, Transport, Fun) so that no two Categories share the same color.
6. THE Chart SHALL display a legend or labels showing each Category name and its corresponding percentage of total spending.
7. IF a Category has a total Transaction amount of zero, THEN THE Chart SHALL omit that Category's slice from the pie chart and its entry from the legend.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my expense data to survive page refreshes, so that I do not lose recorded transactions when I close or reload the browser tab.

#### Acceptance Criteria

1. WHEN a Transaction is created, THE App SHALL write the Transaction data to Storage before the next user interaction is processed.
2. WHEN a Transaction is deleted, THE App SHALL remove the corresponding Transaction data from Storage before the next user interaction is processed.
3. WHEN the App loads, THE App SHALL read all Transactions from Storage and render them in the Transaction_List, the Balance_Display, and the Chart before the user can interact with the Input_Form.
4. IF Storage is unavailable or returns a parse error, THEN THE App SHALL initialize with an empty Transaction_List and SHALL display a non-blocking warning message that the user can dismiss.

---

### Requirement 6: Responsive and Accessible Interface

**User Story:** As a user, I want the interface to be readable and usable on different screen sizes, so that I can access the app from desktop or mobile browsers.

#### Acceptance Criteria

1. THE App SHALL render without horizontal scrollbars on viewport widths between 320px and 1920px.
2. THE App SHALL use a minimum body font size of 14px and a minimum line-height of 1.4 to ensure readable typography.
3. WHEN the App loads in Chrome, Firefox, Edge, or Safari on their current stable releases, THE App SHALL render and function without JavaScript errors.
4. THE Input_Form, Transaction_List, Balance_Display, and Chart SHALL each display a visible heading with a font size at least 2px larger than the body font size, and each section SHALL be visually separated by spacing of at least 16px.
5. IF the viewport width is less than 768px, THEN THE App SHALL stack the Input_Form, Balance_Display, Transaction_List, and Chart vertically in a single column with no element exceeding 100% of the viewport width.
6. THE App SHALL achieve a minimum contrast ratio of 4.5:1 between text and its background color for all visible text elements, as measured by the WCAG 2.1 AA standard.

---

### Requirement 7: Code and File Structure

**User Story:** As a developer, I want the codebase to follow a defined folder structure, so that the project remains maintainable and easy to navigate.

#### Acceptance Criteria

1. THE App SHALL contain exactly one CSS file located in the `css/` directory.
2. THE App SHALL contain exactly one JavaScript file located in the `js/` directory.
3. THE App SHALL load without any external dependencies that require a build step or a package manager.
4. WHERE Chart.js is used for the Chart, THE App SHALL load Chart.js from a CDN link in the HTML file.
5. IF the Chart.js CDN fails to load, THEN THE App SHALL display a fallback message in the Chart area indicating that the chart could not be loaded, and SHALL continue to function for all non-chart features.
