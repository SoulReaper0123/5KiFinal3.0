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
      Approved: 'Loans/ApprovedLoans',
      Rejected: 'Loans/RejectedLoans'
    },
    amountField: 'loanAmount',
    monthlyPaymentField: 'monthlyPayment',
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
  if (typeof dateTimeStr === 'object' && dateTimeStr.seconds) {
    return dateTimeStr.seconds * 1000;
  }
  return Date.parse(dateTimeStr.replace(' at ', ' ')) || Date.now();
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

const MarqueeData = (callback) => {
  const userEmail = auth.currentUser?.email?.toLowerCase();
  if (!userEmail) return () => {};

  const listeners = [];
  let allMessages = [];
  let currentMessageIndex = 0;
  let isFirstMessage = true;

  const startMarquee = () => {
    if (allMessages.length === 0) {
      callback([]);
      return;
    }

    // Calculate the approximate time it takes for a message to scroll completely
    // Assuming average scrolling speed of 100px per second and message width of ~500px
    const scrollDuration = 5000; // 5 seconds per message

    const showNextMessage = () => {
      if (allMessages.length === 0) return;

      // Get the current message
      const currentMessage = allMessages[currentMessageIndex];
      
      // Send the current message to the callback
      callback([currentMessage]);

      // Move to the next message
      currentMessageIndex = (currentMessageIndex + 1) % allMessages.length;

      // Schedule the next message
      setTimeout(showNextMessage, scrollDuration);
    };

    // Start the marquee
    showNextMessage();
  };

  const updateMessages = (newMessages) => {
    // Sort messages by timestamp (newest first)
    allMessages = [...newMessages].sort((a, b) => b.timestamp - a.timestamp);

    // If this is the first update, start the marquee
    if (isFirstMessage && allMessages.length > 0) {
      isFirstMessage = false;
      startMarquee();
    }
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
              messageData.dueDate = parseDateTime(record[config.dueDateField]);
              
              // Add payment reminder if applicable
              const daysUntilDue = getDaysUntilDue(messageData.dueDate);
              if (daysUntilDue >= 0 && daysUntilDue <= 3) {
                transactionMessages.push({
                  id: `reminder-${messageData.id}-${daysUntilDue}`,
                  type: 'Loan Payment',
                  status: 'reminder',
                  message: `Your payment of ₱${messageData.monthlyPayment} is due on ${formatDueDate(messageData.dueDate)}`,
                  timestamp: Date.now() - daysUntilDue,
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

  return () => {
    listeners.forEach(({ ref, listener }) => off(ref, listener));
  };
};

export default MarqueeData;