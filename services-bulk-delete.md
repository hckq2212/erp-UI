# Plan: Services Bulk Delete Implementation

Implementation of bulk delete functionality for the Services page using RTK Query.

## Project Type
WEB (React + RTK Query + Tailwind CSS)

## Success Criteria
- [ ] Users can toggle "Selection Mode" by clicking a "Bulk Delete" button.
- [ ] Users can select multiple services using checkboxes.
- [ ] Users can "Select All" services currently visible in the table.
- [ ] Clicking "Delete Selected" calls the backend API with all selected IDs.
- [ ] The table refreshes automatically after a successful deletion.
- [ ] UI is smooth, clean, and easy to use without excessive animations.

## Tech Stack
- React (Functional Components + Hooks)
- RTK Query (Mutation)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- React Toastify (Notifications)

## File Structure
- `src/api/services.js`: Add `bulkDeleteService` mutation.
- `src/pages/Services/ServicesPage.jsx`: Implement selection logic and UI updates.

## Task Breakdown

### Phase 1: API Implementation
- **Task ID**: `api-bulk-delete`
- **Name**: Add bulk delete mutation to services API
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **Priority**: P0
- **Input**: `src/api/services.js`
- **Output**: Updated `servicesApi` with `bulkDeleteService` mutation.
- **Verify**: Check if `bulkDeleteService` is exported and follows the project's RTK Query pattern.

### Phase 2: Selection Logic (State)
- **Task ID**: `ui-selection-state`
- **Name**: Implement selection state in ServicesPage
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Input**: `src/pages/Services/ServicesPage.jsx`
- **Output**: Logic for `isSelectionMode`, `selectedIds`, `toggleSelect`, and `toggleSelectAll`.
- **Verify**: Ensure selection state updates correctly when checking/unchecking items.

### Phase 3: UI Implementation
- **Task ID**: `ui-bulk-delete-elements`
- **Name**: Add checkboxes and bulk action buttons
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Input**: `src/pages/Services/ServicesPage.jsx`
- **Output**: New column for checkboxes, "Bulk Delete" toggle, and "Delete Selected / Cancel" buttons.
- **Verify**: Verify visibility of elements changes correctly based on `isSelectionMode`.

### Phase 4: Integration & Feedback
- **Task ID**: `integration-bulk-delete`
- **Name**: Connect UI to bulk delete mutation
- **Agent**: `frontend-specialist`
- **Skills**: `react-best-practices`
- **Priority**: P1
- **Input**: `src/pages/Services/ServicesPage.jsx`
- **Output**: Calling `bulkDeleteService` on button click with proper loading/success/error handling.
- **Verify**: Test deleting multiple items and verify list updates.

## Phase X: Verification Checklist
- [ ] No purple/violet hex codes used.
- [ ] Checkboxes and buttons are properly aligned and responsive.
- [ ] Loading states are handled (buttons disabled during deletion).
- [ ] Success/Error toasts are displayed.
- [ ] Selection state is cleared after successful deletion.
- [ ] Lint & Type Check: `npm run lint`
