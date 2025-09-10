import { database, auth } from '../../firebaseConfig';
import { ref as dbRef, onValue, off } from 'firebase/database';

// Message templates
const STATUS_MESSAGES = {
  pending: (type, amount) => `Your ${type} of ₱${amount} is being processed.`,
  approved: (type, amount) => `Your ${type} of ₱${amount} has been approved!`,
  rejected: (type, amount, reason) =>
    `Your ${type} of ₱${amount} was rejected. ${reason ? `Reason: ${reason}` : ''}`
};

const TRANSACTION_TYPES = {
  Deposit: {
    paths: {
      Application: 'Deposits/DepositApplications',
      Approved: 'Deposits/ApprovedDeposits',
      Rejected: 'Deposits/RejectedDeposits'
    },
    amountField: 'amountToBeDeposited'
  },
  Loan: {
    paths: {
      Application: 'Loans/LoanApplications',
      Approved: 'Loans/CurrentLoans',
      Rejected: 'Loans/RejectedLoans'
    },
    amountField: 'loanAmount',
    monthlyPaymentField: 'totalMonthlyPayment',
    dueDateField: 'dueDate'
  },
  Withdrawal: {
    paths: {
      Application: 'Withdrawals/WithdrawalApplications',
      Approved: 'Withdrawals/ApprovedWithdrawals',
      Rejected: 'Withdrawals/RejectedWithdrawals'
    },
    amountField: 'amountWithdrawn'
  },
  Payment: {
    paths: {
      Application: 'Payments/PaymentApplications',
      Approved: 'Payments/ApprovedPayments',
      Rejected: 'Payments/RejectedPayments'
    },
    amountField: 'amountToBePaid'
  }
};

const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return Date.now();
  if (typeof dateTimeStr === 'number') {
    // Already a timestamp (ms)
    return dateTimeStr;
  }
  if (typeof dateTimeStr === 'object' && dateTimeStr.seconds) {
    // Firestore-like timestamp
    return dateTimeStr.seconds * 1000;
  }
  // Normalize common string formats
  const normalized = String(dateTimeStr).replace(' at ', ' ');
  return Date.parse(normalized) || Date.now();
};

const formatDueDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDaysUntilDue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

// Prefer nextDueDate when it's later or more relevant than dueDate
const pickDueTimestamp = (record) => {
  const hasDue = !!record?.dueDate;
  const hasNext = !!record?.nextDueDate;
  if (!hasDue && !hasNext) return Date.now();

  const dueTs = hasDue ? parseDateTime(record.dueDate) : null;
  const nextTs = hasNext ? parseDateTime(record.nextDueDate) : null;

  // If only one exists, return it
  if (dueTs && !nextTs) return dueTs;
  if (!dueTs && nextTs) return nextTs;

  // If both exist, prefer the later/next one
  return nextTs >= dueTs ? nextTs : dueTs;
};

const MarqueeData = (callback) => {
  const userEmail = auth.currentUser?.email?.toLowerCase();
  if (!userEmail) return () => {};

  const listeners = [];
  let allMessages = [];
  let currentMessageIndex = 0;
  let isFirstMessage = true;

  const startMarquee = () => {
    // For Recent Activity list: always send newest-first stable list, no rotation
    callback([...allMessages]);
  };

  const updateMessages = (newMessages) => {
    // Sort messages by timestamp (newest first)
    allMessages = [...newMessages].sort((a, b) => b.timestamp - a.timestamp);
    // Always emit full newest-first list for a stable Recent Activity section
    callback([...allMessages]);
  };

  const handleTransactionData = (type, config) => {
    let transactionMessages = [];

    const processMessages = () => {
      // Filter out duplicate messages (same type and status)
      const uniqueMessages = transactionMessages.reduce((acc, current) => {
        const existing = acc.find(
          item => item.type === current.type && 
                 item.status === current.status && 
                 item.amount === current.amount
        );
        if (!existing) {
          acc.push(current);
        } else if (current.timestamp > existing.timestamp) {
          // Replace with newer message
          acc = acc.filter(item => item !== existing);
          acc.push(current);
        }
        return acc;
      }, []);

      updateMessages(uniqueMessages);
    };

    Object.entries(config.paths).forEach(([status, path]) => {
      const ref = dbRef(database, path);
      const listener = onValue(ref, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Clear previous messages for this transaction type and status
        transactionMessages = transactionMessages.filter(
          msg => !(msg.type === type && msg.status === status.toLowerCase())
        );

        Object.values(data).forEach(userRecords => {
          if (typeof userRecords !== 'object') return;

          Object.values(userRecords).forEach(record => {
            if (!record?.email || record.email.toLowerCase() !== userEmail) return;

            const entryStatus = status === 'Application'
              ? (record.status?.toLowerCase() || 'pending')
              : status.toLowerCase();

            const messageData = {
              id: `${type}-${record.transactionId || Date.now()}`,
              type,
              status: entryStatus,
              message: STATUS_MESSAGES[entryStatus](
                type.toLowerCase(),
                parseFloat(record[config.amountField] || 0).toFixed(2),
                record.rejectionReason
              ),
              timestamp: status === 'Approved' ? parseDateTime(record.dateApproved)
                : status === 'Rejected' ? parseDateTime(record.dateRejected)
                : parseDateTime(record.dateApplied),
              amount: parseFloat(record[config.amountField] || 0).toFixed(2)
            };

            if (type === 'Loan' && config.dueDateField && record[config.dueDateField]) {
              messageData.monthlyPayment = config.monthlyPaymentField
                ? parseFloat(record[config.monthlyPaymentField] || 0).toFixed(2)
                : null;
              // Align with ExistingLoan: prefer the later of dueDate or nextDueDate
              messageData.dueDate = pickDueTimestamp(record);
              
              // Add payment reminder if applicable
              const daysUntilDue = getDaysUntilDue(messageData.dueDate);
              if (daysUntilDue >= 0 && daysUntilDue <= 3) {
                transactionMessages.push({
                  id: `reminder-${messageData.id}-${daysUntilDue}`,
                  type: 'Loan Payment',
                  status: 'reminder',
                  message: `Your payment of ₱${messageData.monthlyPayment} is due on ${formatDueDate(messageData.dueDate)}`,
                  timestamp: messageData.dueDate,
                  amount: messageData.monthlyPayment,
                  daysUntilDue,
                  isReminder: true
                });
              }
            }

            transactionMessages.push(messageData);
          });
        });

        processMessages();
      });

      listeners.push({ ref, listener });
    });
  };

  Object.entries(TRANSACTION_TYPES).forEach(([type, config]) => {
    handleTransactionData(type, config);
  });

  // Additionally, listen to Loans/CurrentLoans to generate payment reminders from the live current loan data
  // This ensures reminders reflect the latest dueDate and totalMonthlyPayment
  const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
  const currentLoansListener = onValue(currentLoansRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const userEmail = auth.currentUser?.email?.toLowerCase();
    if (!userEmail) return;

    let reminderMessages = [];

    Object.values(data).forEach(userRecords => {
      if (typeof userRecords !== 'object') return;

      Object.values(userRecords).forEach(record => {
        if (!record?.email || record.email.toLowerCase() !== userEmail) return;

        const dueTs = pickDueTimestamp(record);
        const monthly = parseFloat(record.totalMonthlyPayment || record.monthlyPayment || 0).toFixed(2);

        // Create/refresh a reminder message for this current loan
        const daysUntilDue = getDaysUntilDue(dueTs);
        if (daysUntilDue >= 0) {
          reminderMessages.push({
            id: `currentloan-reminder-${record.transactionId || dueTs}`,
            type: 'Loan Payment',
            status: 'reminder',
            message: `Your payment of ₱${monthly} is due on ${formatDueDate(dueTs)}`,
            timestamp: dueTs, // Use due date timestamp for stable ordering
            amount: monthly,
            isReminder: true
          });
        }
      });
    });

    // Merge with existing messages and re-sort newest-first
    const merged = [...reminderMessages];
    // Include previously gathered non-reminder messages
    // allMessages might include deposit/withdraw/loan status messages from other listeners
    // Keep unique by id
    const existing = allMessages.filter(m => !m.isReminder);
    const combined = [...existing, ...merged]
      .reduce((acc, cur) => {
        if (!acc.find(x => x.id === cur.id)) acc.push(cur);
        return acc;
      }, [])
      .sort((a, b) => b.timestamp - a.timestamp);

    allMessages = combined;
    callback([...allMessages]);
  });

  listeners.push({ ref: currentLoansRef, listener: currentLoansListener });

  return () => {
    listeners.forEach(({ ref, listener }) => off(ref, listener));
  };
};

export default MarqueeData;