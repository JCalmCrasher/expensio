# Requirements Document

## Introduction

A minimal, local-first personal expense and repayment tracker built for speed and daily use. The app lets users capture expenses in seconds via a natural-language "Quick Add" input, track partial repayments with a progress bar, organize expenses by month, and roll unfinished items forward. All data is stored locally in the browser using IndexedDB — no accounts, no sync, no server.

The app is built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Dexie.js (IndexedDB), and Zustand. Because all data lives in the browser, every interactive component is a Client Component. Dexie.js components must be loaded with `next/dynamic` and `ssr: false` to avoid server-side rendering errors.

The app succeeds when adding an expense is faster than opening a spreadsheet.

### Design Philosophy

The UI must feel modern, minimal, and premium — inspired by fintech and productivity tools like Linear, Notion, and Stripe dashboards. The visual language is built on a neutral zinc/gray base with one or two accent colors, soft shadows, rounded corners (`rounded-2xl`), and subtle borders. Spacing and visual hierarchy are paramount: no clutter, no heavy tables. Content is presented in card or list style with clean separation.

Interactive elements use smooth hover states and transitions. Progress bars are visually prominent and slightly animated. Priority levels are communicated through both color and icon. Category tags render as Chrome-style colored pills. Typography maintains a clear hierarchy across title, meta, and secondary text levels. The overall result should feel like a polished SaaS product, not a basic admin panel.


---

## Glossary

- **App**: The expense tracker Next.js application.
- **Expense**: A single financial obligation with a title, total amount, amount paid so far, status, priority, category, and the month it belongs to.
- **Quick_Add_Input**: The sticky, always-visible text input at the top of the page used to create expenses from a natural-language string.
- **Parser**: The client-side module that converts a raw Quick Add string into a structured Expense object.
- **Expense_List**: The scrollable table/list that displays all expenses for the current month.
- **Progress_Bar**: A visual indicator showing the ratio of amount paid to total amount for a single expense, or for the month overall.
- **Month_Context**: The currently selected month (year + month) that scopes which expenses are displayed.
- **Rollover**: The action of copying all unfinished expenses from the current month into the next month, preserving their paid progress.
- **Monthly_Summary**: The aggregate view showing total owed, total paid, and overall progress for the active Month_Context.
- **Priority**: A three-level classification of an expense: High, Medium, or Low.
- **Category**: A user-defined or auto-detected label attached to an expense, displayed as a colored tag.
- **Status**: The payment state of an expense: `paid` or `unpaid`.
- **Partial_Payment**: A payment that covers only part of an expense's total amount, updating the amount paid without marking the expense as fully paid.
- **Store**: The Dexie.js IndexedDB database that persists all Expense records locally in the browser.
- **Zustand_Store**: The in-memory Zustand state store that holds the active Month_Context and any UI state derived from the Store.

---

## Requirements

### Requirement 1: Quick Add Expense Entry

**User Story:** As a user, I want to type or paste a natural-language string into a sticky input and have an expense created instantly, so that capturing a new expense takes less time than opening a spreadsheet.

#### Acceptance Criteria

1. THE App SHALL render the Quick_Add_Input as a sticky element visible at the top of the viewport at all times, regardless of scroll position.
2. WHEN the user submits the Quick_Add_Input (via Enter key or submit button), THE Parser SHALL extract a title, status (`paid` or `unpaid`), and amount from the input string.
3. WHEN the input string contains a word matching `paid` or `unpaid` (case-insensitive), THE Parser SHALL set the Expense status to the matched value.
4. WHEN the input string contains no status keyword, THE Parser SHALL default the Expense status to `unpaid`.
5. WHEN the input string contains a numeric token, THE Parser SHALL set the Expense amount to that number.
6. WHEN the input string contains no numeric token, THE Parser SHALL reject the input and THE App SHALL display an inline error message indicating that an amount is required.
7. WHEN the input string contains tokens that are neither a status keyword nor a numeric token, THE Parser SHALL concatenate those tokens as the Expense title.
8. WHEN the Parser successfully creates an Expense, THE Parser SHALL assign a default Priority of `Medium` to the new Expense.
9. WHEN the Parser successfully creates an Expense, THE App SHALL assign the new Expense to the active Month_Context.
10. WHEN the Parser successfully creates an Expense, THE App SHALL clear the Quick_Add_Input field and return keyboard focus to it.
11. FOR ALL valid input strings, parsing then serializing then parsing the result SHALL produce an equivalent Expense object (round-trip property).

---

### Requirement 2: Expense List Display

**User Story:** As a user, I want to see all my expenses for the current month in a clean, readable list, so that I can understand my financial obligations at a glance.

#### Acceptance Criteria

1. THE Expense_List SHALL display all Expenses belonging to the active Month_Context.
2. THE Expense_List SHALL display the following fields for each Expense: title, total amount, Status, Progress_Bar, Priority, and Category tag.
3. THE Progress_Bar for each Expense SHALL display the ratio of amount paid to total amount as a percentage from 0 to 100.
4. WHEN an Expense has a Status of `paid`, THE Expense_List SHALL render that Expense with a visual distinction (e.g., muted color or strikethrough) to differentiate it from unpaid expenses.
5. WHEN an Expense has been rolled over from a previous month, THE Expense_List SHALL display a visual indicator (e.g., a "rolled over" badge) on that Expense.
6. THE Category tag for each Expense SHALL be rendered with a distinct background color associated with that category label.
7. THE Expense_List SHALL be navigable using keyboard Tab and arrow keys without requiring a mouse.

---

### Requirement 3: Partial Repayments

**User Story:** As a user, I want to record partial payments against an expense, so that the progress bar accurately reflects how much I have repaid over time.

#### Acceptance Criteria

1. WHEN the user submits a Partial_Payment for an Expense, THE App SHALL add the payment amount to the Expense's existing amount paid.
2. WHEN a Partial_Payment is recorded, THE Progress_Bar for that Expense SHALL update to reflect the new ratio of amount paid to total amount.
3. WHEN the cumulative amount paid equals or exceeds the total amount, THE App SHALL automatically set the Expense Status to `paid`.
4. IF a submitted Partial_Payment amount is less than or equal to zero, THEN THE App SHALL reject the payment and display an inline error message.
5. IF a submitted Partial_Payment amount would cause the cumulative amount paid to exceed the total amount, THEN THE App SHALL cap the amount paid at the total amount and set the Status to `paid`.

---

### Requirement 4: Priority Management

**User Story:** As a user, I want to assign a priority level to each expense, so that I can focus on the most important repayments first.

#### Acceptance Criteria

1. THE App SHALL support exactly three Priority levels: `High`, `Medium`, and `Low`.
2. WHEN a new Expense is created via the Quick_Add_Input, THE App SHALL assign a default Priority of `Medium`.
3. WHEN the user changes the Priority of an Expense, THE App SHALL persist the updated Priority to the Store immediately.
4. THE Expense_List SHALL display the Priority of each Expense as a labeled badge (e.g., "High", "Medium", "Low").

---

### Requirement 5: Category Tags

**User Story:** As a user, I want to tag each expense with a category, so that I can visually group and identify expenses by type.

#### Acceptance Criteria

1. THE App SHALL allow the user to assign a text category label to any Expense.
2. THE App SHALL render each category label as a colored tag on the Expense in the Expense_List.
3. THE App SHALL assign a consistent color to each unique category label across all Expenses and months.
4. WHEN two Expenses share the same category label, THE App SHALL render both tags with the same background color.

---

### Requirement 6: Monthly Context and Navigation

**User Story:** As a user, I want each expense to belong to a specific month and be able to navigate between months, so that I can track my finances over time without past expenses cluttering the current view.

#### Acceptance Criteria

1. THE App SHALL display a Month_Context selector showing the currently active month (e.g., "June 2025").
2. WHEN the user navigates to a different month, THE Expense_List SHALL update to show only Expenses belonging to the selected Month_Context.
3. THE App SHALL default the active Month_Context to the current calendar month on first load.
4. WHEN a new Expense is created, THE App SHALL assign it to the currently active Month_Context.
5. THE App SHALL allow the user to navigate to any past or future month using previous/next controls.

---

### Requirement 7: Rollover Unfinished Expenses

**User Story:** As a user, I want to roll over unfinished expenses into the next month with their progress preserved, so that I don't lose track of partially repaid obligations when a new month starts.

#### Acceptance Criteria

1. THE App SHALL display a "Roll Over" button when the active Month_Context is not the current calendar month or when unfinished Expenses exist in the active month.
2. WHEN the user activates the Roll Over action, THE App SHALL copy all Expenses from the active Month_Context with a Status of `unpaid` into the next calendar month.
3. WHEN an Expense is rolled over, THE App SHALL preserve the Expense's amount paid, title, total amount, Priority, and Category on the rolled-over copy.
4. WHEN an Expense is rolled over, THE App SHALL mark the rolled-over copy with a `rolledOver` flag set to `true`.
5. WHEN an Expense is rolled over, THE App SHALL retain the original Expense in its source month unchanged.
6. IF the active Month_Context contains no unpaid Expenses, THEN THE App SHALL disable the Roll Over button and display a message indicating there is nothing to roll over.

---

### Requirement 8: Monthly Summary

**User Story:** As a user, I want to see a summary of my total owed, total paid, and overall progress for the active month, so that I can understand my financial position at a glance.

#### Acceptance Criteria

1. THE Monthly_Summary SHALL display the total amount owed across all Expenses in the active Month_Context.
2. THE Monthly_Summary SHALL display the total amount paid across all Expenses in the active Month_Context.
3. THE Monthly_Summary SHALL display an overall Progress_Bar representing the ratio of total amount paid to total amount owed for the active Month_Context.
4. WHEN any Expense in the active Month_Context is created, updated, or deleted, THE Monthly_Summary SHALL update immediately to reflect the change.
5. WHEN the active Month_Context contains no Expenses, THE Monthly_Summary SHALL display zero values and a Progress_Bar at 0%.

---

### Requirement 9: Local Data Persistence

**User Story:** As a user, I want my expenses to be saved locally in my browser, so that my data is available the next time I open the app without requiring an account or internet connection.

#### Acceptance Criteria

1. THE Store SHALL persist all Expense records to IndexedDB using Dexie.js.
2. WHEN the App is loaded, THE Store SHALL read all existing Expense records from IndexedDB and make them available to the Zustand_Store.
3. WHEN an Expense is created, updated, or deleted, THE Store SHALL write the change to IndexedDB before the UI reflects the change.
4. THE App SHALL load the Store using `next/dynamic` with `ssr: false` to prevent server-side rendering errors caused by browser-only IndexedDB APIs.
5. IF IndexedDB is unavailable in the current browser environment, THEN THE App SHALL display a warning message indicating that data cannot be saved and will not persist between sessions.

---

### Requirement 10: Keyboard-Friendly Interactions

**User Story:** As a user, I want to perform all core actions using only the keyboard, so that I can use the app efficiently without switching between keyboard and mouse.

#### Acceptance Criteria

1. WHEN the App loads, THE Quick_Add_Input SHALL receive keyboard focus automatically.
2. THE App SHALL allow the user to submit the Quick_Add_Input by pressing the Enter key.
3. THE App SHALL allow the user to navigate between Expenses in the Expense_List using the Tab key and arrow keys.
4. THE App SHALL allow the user to open and submit a Partial_Payment for a focused Expense using keyboard shortcuts without requiring mouse interaction.
5. THE App SHALL maintain a visible focus indicator on all interactive elements at all times, compliant with WCAG 2.1 AA focus visibility requirements.

---

### Requirement 11: UI Design and Visual Standards

**User Story:** As a user, I want the app to feel modern, minimal, and premium, so that managing expenses feels as polished as using a professional SaaS product rather than a basic admin panel.

#### Acceptance Criteria

1. THE App SHALL apply a neutral zinc/gray base color palette with no more than two accent colors used across the entire UI.
2. THE App SHALL apply `rounded-2xl` border radius to all card and container elements to produce consistently rounded corners.
3. THE App SHALL apply soft box shadows and subtle borders to card and container elements to create visual depth without heaviness.
4. THE App SHALL maintain consistent spacing and visual hierarchy across all views, ensuring no section appears cluttered or unstructured.
5. THE Expense_List SHALL render Expenses as cards or list rows with clean visual separation, rather than as a traditional HTML table.
6. THE Progress_Bar SHALL render with a smooth CSS transition animation when its value changes, and SHALL be visually prominent relative to surrounding content.
7. THE App SHALL render each Priority level using both a distinct color and a distinct icon, not text alone.
8. THE App SHALL render each Category tag as a colored pill element styled consistently with the Chrome browser tab label pattern.
9. WHEN the user hovers over any interactive element, THE App SHALL apply a smooth CSS transition to the hover state with a duration no greater than 200ms.
10. THE App SHALL apply a typographic hierarchy across all text content, using distinct font size, weight, and color for title, meta, and secondary text levels.
11. THE App SHALL render all focus indicators, hover states, and transitions using CSS properties that respect the user's `prefers-reduced-motion` media query by disabling or reducing animations when the preference is set to `reduce`.
