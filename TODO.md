- [x] Update LoanPaymentHistory.js to use 'appliedToLoan' instead of 'originalTransactionId' for filtering payments
- [x] Modify fetchPayments to only fetch from Transactions/Payments and filter by appliedToLoan matching loan.commonOriginalTransactionId
- [x] Test the payment fetching to ensure correct filtering and descending order

## Fix LoanPaymentHistory.js: Fetch and Display /appliedToLoan Details

- [x] Update fetchPayments: For each approved matching transaction, fetch nested data from `Transactions/Payments/${memberId}/${transactionId}/appliedToLoan`.
- [x] In pushPayment or after, extract fields from appliedToLoan object: amountToBePaid, dateApplied, dateApproved, interestPaid; add transactionId (as id) and appliedToLoan (ID) to payment object. Only include if appliedToLoan ID matches loan.commonOriginalTransactionId.
- [x] Handle missing /appliedToLoan: Use fallbacks (null/'N/A'), log errors, but continue with basic payment info.
- [x] Update display: Replace simple paymentRow with detailed card showing Transaction ID, Applied To Loan, Amount to Be Paid, Date Applied, Date Approved, Interest Paid (formatted), plus existing amount/date/method.
- [x] Ensure sorting by timestamp descending and empty state updates.
- [x] Test: Verify fetches, display, and edge cases (no appliedToLoan, multiple transactions).
