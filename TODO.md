# ApplyLoans.jsx Modification Plan

## Objective
Make ApplyLoans.jsx behave like ApplyDeposits.jsx by deferring database operations to the success OK button.

## Changes Required

### 1. Modify processAction function
- [ ] Remove immediate database operations (processDatabaseApprove/Reject calls)
- [ ] Keep only: set successMessage, update selectedLoan locally, set pendingApiCall, show successMessageModalVisible
- [ ] Ensure savings confirmation logic remains intact (as it precedes success modal)

### 2. Modify handleSuccessOk function
- [ ] Add loading state at start
- [ ] Add database operations based on pendingApiCall.type
- [ ] Keep existing API calls
- [ ] Keep cleanup and refresh logic
- [ ] Remove loading state at end

### 3. Testing
- [ ] Verify approve flow works with deferred DB operations
- [ ] Verify reject flow works with deferred DB operations
- [ ] Verify savings confirmation still works (since it happens before success modal)
- [ ] Verify API calls still happen after DB operations

## Files to Edit
- Web/src/web/Sidebar/Loans/ApplyLoans.jsx
