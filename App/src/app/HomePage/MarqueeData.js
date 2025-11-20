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

// Use only dueDate from database; do not use nextDueDate
const pickDueTimestamp = (record) => {
  if (!record?.dueDate) return null;
  return parseDateTime(record.dueDate);
};

// Automatic Loan Reminder System
const checkDueDatesForReminders = async () => {
  try {
    console.log('🔔 Automatic loan reminder system checking due dates...');
    const now = new Date();
    
    // Fetch reminder window (days) from Settings
    const settingsSnap = await database.ref('Settings/LoanReminderDays').once('value');
    const reminderDays = parseInt(settingsSnap.val() ?? 7, 10);
    const windowMs = Math.max(0, reminderDays) * 24 * 60 * 60 * 1000;
    const reminderWindowDate = new Date(now.getTime() + windowMs);
    
    // Format dates for logging
    const formattedNow = now.toISOString();
    const formattedWindow = reminderWindowDate.toISOString();
    console.log(`📅 Current date: ${formattedNow}`);
    console.log(`⏰ Reminder window end (+${reminderDays}d): ${formattedWindow}`);
    
    const loansRef = database.ref('Loans/CurrentLoans');
    const loansSnapshot = await loansRef.once('value');
    const loansData = loansSnapshot.val() || {};
    
    const approvedLoansRef = database.ref('Loans/ApprovedLoans');
    const approvedLoansSnapshot = await approvedLoansRef.once('value');
    const approvedLoansData = approvedLoansSnapshot.val() || {};
    
    const membersRef = database.ref('Members');
    const membersSnapshot = await membersRef.once('value');
    const membersData = membersSnapshot.val() || {};

    const notificationsRef = database.ref('LoanNotifications');
    const notificationsSnapshot = await notificationsRef.once('value');
    const notificationsData = notificationsSnapshot.val() || {};

    console.log(`📊 Found ${Object.keys(loansData).length} members with loans`);
    
    let remindersSent = 0;
    let loansChecked = 0;

    for (const [memberId, loans] of Object.entries(loansData)) {
      for (const [transactionId, currentLoan] of Object.entries(loans)) {
        loansChecked++;
        
        if (!currentLoan.dueDate) {
          console.log(`❌ Loan ${transactionId} for member ${memberId} has no due date`);
          continue;
        }
        
        // Parse the due date properly
        const dueDate = new Date(currentLoan.dueDate);
        
        // Log the due date for debugging
        console.log(`📅 Loan ${transactionId} for member ${memberId} has due date: ${dueDate.toISOString()}`);
        
        // Use startOfDay for proper date comparison
        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dueDateStart = startOfDay(dueDate);
        const nowStart = startOfDay(now);
        const reminderWindowStart = startOfDay(reminderWindowDate);
        
        // Check if the due date is within the configured reminder window
        // We want to send reminders for due dates that are between today and the reminder window
        const isWithinWindow = dueDateStart >= nowStart && dueDateStart <= reminderWindowStart;
        console.log(`🎯 Is within reminder window: ${isWithinWindow} (Due: ${dueDateStart.toISOString()}, Now: ${nowStart.toISOString()}, Window: ${reminderWindowStart.toISOString()})`);
        
        if (isWithinWindow) {
          const notificationKey = `${memberId}_${transactionId}`;
          const hasBeenNotified = notificationsData && notificationsData[notificationKey];
          
          console.log(`📧 Notification status for ${notificationKey}: ${hasBeenNotified ? 'Already sent' : 'Not sent yet'}`);
          
          // Only send if no notification has been sent yet
          if (!hasBeenNotified) {
            const member = membersData[memberId];
            const approvedLoan = approvedLoansData[memberId]?.[transactionId];
            
            if (member && member.email) {
              try {
                console.log(`✉️ Sending reminder to ${member.email} for loan ${transactionId}`);
                
                let outstandingBalance = parseFloat(currentLoan.loanAmount) || 0;
                const originalAmount = approvedLoan 
                  ? parseFloat(approvedLoan.loanAmount) || 0 
                  : outstandingBalance;

                // Import SendLoanReminder function (make sure it's available in your scope)
                const { SendLoanReminder } = await import('../../Server/api');
                
                await SendLoanReminder({
                  memberId,
                  transactionId,
                  dueDate: currentLoan.dueDate,
                  email: member.email,
                  firstName: member.firstName,
                  lastName: member.lastName,
                  loanAmount: originalAmount,
                  outstandingBalance: outstandingBalance
                });

                // Record that we've sent a notification
                await notificationsRef.child(notificationKey).set({
                  sentAt: new Date().toISOString(),
                  dueDate: currentLoan.dueDate,
                  reminderDays: reminderDays,
                  memberId: memberId,
                  transactionId: transactionId
                });
                
                remindersSent++;
                console.log(`✅ Successfully sent reminder for loan ${transactionId}`);
              } catch (error) {
                console.error(`❌ Failed to send reminder for ${memberId}/${transactionId}:`, error);
              }
            } else {
              console.log(`❌ Member ${memberId} has no email or member data not found`);
            }
          }
        }
      }
    }
    
    console.log(`📋 Checked ${loansChecked} loans, sent ${remindersSent} reminders`);
  } catch (error) {
    console.error('❌ Error checking due dates:', error);
  }
};

// Initialize automatic reminder system
const initializeReminderSystem = () => {
  console.log('🔔 Initializing automatic loan reminder system...');
  
  // Run immediately when system starts
  checkDueDatesForReminders();
  
  // Check once per day (24 hours) - production frequency
  const checkInterval = setInterval(checkDueDatesForReminders, 24 * 60 * 60 * 1000);
  
  console.log('✅ Automatic reminder system initialized - checking every 24 hours');
  
  return () => {
    console.log('🛑 Clearing loan reminder check interval');
    clearInterval(checkInterval);
  };
};

const MarqueeData = (callback) => {
  const userEmail = auth.currentUser?.email?.toLowerCase();
  if (!userEmail) return () => {};

  const listeners = [];
  let allMessages = [];
  let currentMessageIndex = 0;
  let isFirstMessage = true;

  // Start the automatic reminder system
  const cleanupReminderSystem = initializeReminderSystem();

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
    // Clean up all Firebase listeners
    listeners.forEach(({ ref, listener }) => off(ref, listener));
    
    // Clean up the reminder system
    if (cleanupReminderSystem) {
      cleanupReminderSystem();
    }
    
    console.log('🧹 All MarqueeData listeners and reminder system cleaned up');
  };
};

export default MarqueeData;
