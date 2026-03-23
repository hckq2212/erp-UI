# PLAN: Opportunity Validation Refinement

Refine the validation logic in `OpportunityModal.jsx` to ensure that error messages are cleared as soon as a user starts typing or modifies a field. This improves the user experience by providing immediate feedback.

## User Review Required

> [!NOTE]
> This change only affects the frontend behavior of the `OpportunityModal.jsx` component. No backend changes are required.

## Proposed Changes

### [Component Name] Frontend

#### [MODIFY] [OpportunityModal.jsx](file:///c:/HCKQ_Self_learning/GETVINI/ERP_UI/erp-frontend/src/pages/Opportunities/OpportunityModal.jsx)

- Update `handleChange` to clear specific field errors in the `errors` state.
- Update `handleNumberChange` to clear specific field errors.
- Update `handleServiceChange` and `handlePackageTemplateChange` to clear relevant error keys.

## Verification Plan

### Automated Tests
- None existing. No new automated tests are planned for this UI-only change.

### Manual Verification
1.  Open the "Tạo Cơ Hội Mới" modal.
2.  Click "Tạo cơ hội" without filling any fields to trigger validation errors.
3.  Observe red error messages and border highlights.
4.  Type a character into the "Tên cơ hội" field.
5.  **Expected Result**: The red error message and border highlight for "Tên cơ hội" should disappear immediately.
6.  Repeat for other fields like "Mô tả", "Lĩnh vực", "Doanh thu kỳ vọng", etc.
