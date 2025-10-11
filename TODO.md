# TODO: Fix ApplyLoans.jsx Loan Approval Logic

## Steps to Complete
- [ ] Rename state `memberInvestment` to `memberBalance` and update all references in ApplyLoans.jsx
- [ ] Update `processAction` function for 'approve' to implement sequential deduction logic: balance → funds → savings (with confirmation if savings used)
- [ ] Merge database processing functions into a single `processDatabaseApprove` that handles deductions based on parameters (useSavings, savingsAmount)
- [ ] Update `handleSavingsConfirm` to set correct pendingApiCall for savings usage
- [ ] Update `handleSuccessOk` to call the unified DB function with appropriate params
- [ ] Remove redundant DB functions (`processDatabaseApproveWithSavings`, `processDatabaseApproveWithMemberBalanceShortfall`)
- [ ] Test the changes: Run locally, verify deductions in Firebase, check modal calculations
- [ ] Verify email API calls still work for approvals/rejections
