import { database, auth } from '../../firebaseConfig';
import { ref as dbRef, onValue, off } from 'firebase/database';

const STATUS_MESSAGES = {
  pending: (type) => `Your ${type} application is being processed.`,
  approved: (type) => `Your ${type} has been approved!`,
  rejected: (type) => `Your ${type} application was rejected.`,
};

// Parse datetime strings in format "Month Day, Year HH:MM" or "YYYY-MM-DD HH:MM"
const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return Date.now();
  
  // Handle Firebase Timestamp objects
  if (typeof dateTimeStr === 'object' && dateTimeStr.seconds) {
    return dateTimeStr.seconds * 1000;
  }

  // Remove " at " if present (e.g., "August 2, 2025 at 14:30" → "August 2, 2025 14:30")
  const normalized = dateTimeStr.replace(' at ', ' ');

  // Try parsing common formats
  const parsed = Date.parse(normalized);
  return isNaN(parsed) ? Date.now() : parsed;
};

const MarqueeData = (callback) => {
  const userEmail = auth.currentUser?.email?.toLowerCase();
  if (!userEmail) return () => {};

  const listeners = [];
  const categories = [
    {
      type: 'Deposit',
      paths: {
        Application: 'Deposits/DepositApplications',
        Approved: 'Deposits/ApprovedDeposits',
        Rejected: 'Deposits/RejectedDeposits'
      }
    },
    {
      type: 'Loan',
      paths: {
        Application: 'Loans/LoanApplications',
        Approved: 'Loans/ApprovedLoans',
        Rejected: 'Loans/RejectedLoans'
      }
    },
    {
      type: 'Withdrawal',
      paths: {
        Application: 'Withdrawals/WithdrawalApplications',
        Approved: 'Withdrawals/ApprovedWithdrawals',
        Rejected: 'Withdrawals/RejectedWithdrawals'
      }
    },
    {
      type: 'Payment',
      paths: {
        Application: 'Payments/PaymentApplications',
        Approved: 'Payments/ApprovedPayments',
        Rejected: 'Payments/RejectedPayments'
      }
    }
  ];

  categories.forEach(({ type, paths }) => {
    const latestEntries = {};

    const updateMarquee = () => {
      const validEntries = Object.values(latestEntries).filter(Boolean);
      if (validEntries.length === 0) return;

      const mostRecent = validEntries.reduce((a, b) => 
        a.timestamp > b.timestamp ? a : b
      );
      
      callback(prev => [
        ...prev.filter(e => e.type !== type),
        mostRecent
      ].sort((a, b) => b.timestamp - a.timestamp));
    };

    Object.entries(paths).forEach(([status, path]) => {
      const ref = dbRef(database, path);
      const listener = onValue(ref, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        let latestEntry = null;

        Object.values(data).forEach((userRecords) => {
          if (typeof userRecords !== 'object') return;

          Object.values(userRecords).forEach((record) => {
            if (!record?.email || record.email.toLowerCase() !== userEmail) return;

            // Determine status (approved/rejected/pending)
            const entryStatus = status === 'Application' 
              ? (record.status?.toLowerCase() || 'pending')
              : status.toLowerCase();

            // Use the appropriate datetime field
            const timestamp = status === 'Approved' ? parseDateTime(record.dateApproved)
                            : status === 'Rejected' ? parseDateTime(record.dateRejected)
                            : parseDateTime(record.dateApplied);

            latestEntry = {
              message: STATUS_MESSAGES[entryStatus]?.(type.toLowerCase()),
              timestamp,
              type,
              id: `${type}-${record.transactionId || Date.now()}`,
            };
          });
        });

        if (latestEntry) {
          latestEntries[status] = latestEntry;
          updateMarquee();
        }
      });

      listeners.push({ ref, listener });
    });
  });

  return () => listeners.forEach(({ ref, listener }) => off(ref, listener));
};

export default MarqueeData;