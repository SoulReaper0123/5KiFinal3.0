import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { SendLoanReminder } from '../../../../../Server/api';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner, FaChartLine, FaMoneyBillWave, FaUsers, FaCreditCard, FaExchangeAlt, FaShieldAlt, FaSearch, FaCalendarAlt, FaFilter, FaPiggyBank, FaBusinessTime, FaPercentage, FaFileContract, FaInfoCircle, FaPhone } from 'react-icons/fa';

// Register Chart.js components
Chart.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend
);

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [loading, setLoading] = useState(true);
  const [fundsData, setFundsData] = useState({
    availableFunds: 0,
    totalYields: 0,
    totalLoans: 0,
    totalReceivables: 0,
    fiveKISavings: 0,
    activeBorrowers: 0,
    totalMembers: 0,
    savingsHistory: [],
    yieldsHistory: []
  });
  const [loanData, setLoanData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [dividendsData, setDividendsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [transactionBreakdownModal, setTransactionBreakdownModal] = useState(false);
  const [selectedMonthTransactions, setSelectedMonthTransactions] = useState({
    member: null,
    month: null,
    year: null,
    transactions: []
  });
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [dividendsLoading, setDividendsLoading] = useState(false);
  // Dividends distribution modal and flow
  const [showDividendsModal, setShowDividendsModal] = useState(false);
  const [distributionMembers, setDistributionMembers] = useState([]); // { memberId, name, investment, savings, dividend }
  const [distributionProcessing, setDistributionProcessing] = useState(false);
  const [distributionConfirmVisible, setDistributionConfirmVisible] = useState(false);
  const [distributionSuccessVisible, setDistributionSuccessVisible] = useState(false);

  const checkDueDates = async () => {
    try {
      console.log('Checking due dates for loan reminders...');
      const now = new Date();
      
      // Fetch reminder window (days) from Settings
      const settingsSnap = await database.ref('Settings/LoanReminderDays').once('value');
      const reminderDays = parseInt(settingsSnap.val() ?? 7, 10);
      const windowMs = Math.max(0, reminderDays) * 24 * 60 * 60 * 1000;
      const reminderWindowDate = new Date(now.getTime() + windowMs);
      
      // Format dates for logging
      const formattedNow = now.toISOString();
      const formattedWindow = reminderWindowDate.toISOString();
      console.log(`Current date: ${formattedNow}`);
      console.log(`Reminder window end (+${reminderDays}d): ${formattedWindow}`);
      
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

      console.log(`Found ${Object.keys(loansData).length} members with loans`);
      
      let remindersSent = 0;
      let loansChecked = 0;

      for (const [memberId, loans] of Object.entries(loansData)) {
        for (const [transactionId, currentLoan] of Object.entries(loans)) {
          loansChecked++;
          
          if (!currentLoan.dueDate) {
            console.log(`Loan ${transactionId} for member ${memberId} has no due date`);
            continue;
          }
          
          // Parse the due date properly
          const dueDate = new Date(currentLoan.dueDate);
          
          // Log the due date for debugging
          console.log(`Loan ${transactionId} for member ${memberId} has due date: ${dueDate.toISOString()}`);
          
          // Check if the due date is within the configured reminder window
          const isWithinWindow = dueDate <= reminderWindowDate && dueDate > now;
          console.log(`Is within reminder window: ${isWithinWindow}`);
          
          if (isWithinWindow) {
            const notificationKey = `${memberId}_${transactionId}`;
            const hasBeenNotified = notificationsData && notificationsData[notificationKey];
            
            console.log(`Notification status for ${notificationKey}: ${hasBeenNotified ? 'Already sent' : 'Not sent yet'}`);
            
            // Only send if no notification has been sent yet
            if (!hasBeenNotified) {
              const member = membersData[memberId];
              const approvedLoan = approvedLoansData[memberId]?.[transactionId];
              
              if (member && member.email) {
                try {
                  console.log(`Sending reminder to ${member.email} for loan ${transactionId}`);
                  
                  let outstandingBalance = parseFloat(currentLoan.loanAmount) || 0;
                  const originalAmount = approvedLoan 
                    ? parseFloat(approvedLoan.loanAmount) || 0 
                    : outstandingBalance;

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
                    dueDate: currentLoan.dueDate
                  });
                  
                  remindersSent++;
                  console.log(`Successfully sent reminder for loan ${transactionId}`);
                } catch (error) {
                  console.error(`Failed to send reminder for ${memberId}/${transactionId}:`, error);
                }
              } else {
                console.log(`Member ${memberId} has no email or member data not found`);
              }
            }
          }
        }
      }
      
      console.log(`Checked ${loansChecked} loans, sent ${remindersSent} reminders`);
    } catch (error) {
      console.error('Error checking due dates:', error);
    }
  };

  const handleResendClick = (loan) => {
    setSelectedLoan(loan);
    setShowResendConfirmation(true);
  };

  const confirmResendReminder = async () => {
    setShowResendConfirmation(false);
    setActionInProgress(true);
    
    try {
      const membersRef = database.ref(`Members/${selectedLoan.memberId}`);
      const membersSnapshot = await membersRef.once('value');
      const member = membersSnapshot.val();

      if (member && member.email) {
        await SendLoanReminder({
          memberId: selectedLoan.memberId,
          transactionId: selectedLoan.transactionId,
          dueDate: selectedLoan.dueDate,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          loanAmount: selectedLoan.loanAmount,
          outstandingBalance: selectedLoan.outstandingBalance
        });

        const notificationKey = `${selectedLoan.memberId}_${selectedLoan.transactionId}`;
        const updates = {
          resentAt: new Date().toISOString()
        };
        
        if (database.ServerValue && database.ServerValue.increment) {
          updates.resendCount = database.ServerValue.increment(1);
        } else {
          const notificationRef = database.ref(`LoanNotifications/${notificationKey}`);
          const notificationSnap = await notificationRef.once('value');
          const currentCount = notificationSnap.val()?.resendCount || 0;
          updates.resendCount = currentCount + 1;
        }

        await database.ref(`LoanNotifications/${notificationKey}`).update(updates);
        
        setSuccessMessage('Reminder resent successfully!');
        setSuccessMessageModalVisible(true);
      } else {
        setErrorMessage('Member email not found');
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error('Error resending reminder:', error);
      setErrorMessage('Failed to resend reminder');
      setErrorModalVisible(true);
    } finally {
      setActionInProgress(false);
    }
  };

  useEffect(() => {
    console.log('Setting up loan reminder check system...');
    // Run immediately when component mounts
    checkDueDates();
    
    // During development, check every 5 minutes instead of once per day
    // This makes it easier to test and debug
    const checkInterval = setInterval(checkDueDates, 5 * 60 * 1000); // 5 minutes
    
    // Clean up interval when component unmounts
    return () => {
      console.log('Clearing loan reminder check interval');
      clearInterval(checkInterval);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const parseCustomDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  };

  const parseTransactionDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
      // Handle Firebase Timestamp objects
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        return new Date(dateInput.seconds * 1000);
      }
      
      // Handle string dates in various formats
      if (typeof dateInput === 'string') {
        // Try direct parsing first
        let parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
        
        // Try parsing "Month Day, Year" format (e.g., "August 25, 2025")
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const parts = dateInput.split(' ');
        if (parts.length === 3) {
          const monthName = parts[0];
          const day = parseInt(parts[1].replace(',', ''));
          const year = parseInt(parts[2]);
          const monthIndex = monthNames.indexOf(monthName);
          
          if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
            return new Date(year, monthIndex, day);
          }
        }
        
        // Try parsing "MM/DD/YYYY" format
        const dateParts = dateInput.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month, day);
          }
        }
      }
      
      // Handle Date objects
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput;
      }
      
      return null;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return null;
    }
  };

  // Helpers to match PayLoan.js display and calculations
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (typeof dateInput === 'string') {
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        return dateInput;
      }
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    let due = typeof dueDate === 'string' ? new Date(dueDate) : new Date(dueDate);
    if (isNaN(due.getTime())) return 0;
    const today = startOfDay(new Date());
    const dueStart = startOfDay(due);
    if (today <= dueStart) return 0;
    const ms = today.getTime() - dueStart.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const computePenaltyAndNewTotal = (loan) => {
    const overdueDays = getOverdueDays(loan.dueDate || loan.nextDueDate);
    const interest = parseFloat(loan.interest) || 0;
    const penalty = overdueDays > 0 ? (interest * (overdueDays / 30)) : 0; // match PayLoan.js logic
    const monthly = parseFloat(loan.totalMonthlyPayment) || 0;
    const newTotalMonthly = monthly + penalty;
    return { overdueDays, penalty, newTotalMonthly };
  };

  const fetchDashboardData = async (options = {}) => {
    const { lightweight = false } = options;
    try {
      if (!lightweight) setLoading(true);
      
      const [
        fundsSnapshot,
        savingsSnapshot,
        yieldsSnapshot,
        savingsHistorySnapshot,
        fundsHistorySnapshot,
        yieldsHistorySnapshot,
        membersSnapshot,
        currentLoansSnapshot,
        approvedLoansSnapshot,
        paymentsSnapshot,
        settingsSnapshot
      ] = await Promise.all([
        database.ref('Settings/Funds').once('value'),
        database.ref('Settings/Savings').once('value'),
        database.ref('Settings/Yields').once('value'),
        database.ref('Settings/SavingsHistory').once('value'),
        database.ref('Settings/FundsHistory').once('value'),
        database.ref('Settings/YieldsHistory').once('value'),
        database.ref('Members').once('value'),
        database.ref('Loans/CurrentLoans').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Payments/ApprovedPayments').once('value'),
        database.ref('Settings').once('value')
      ]);

      const availableFunds = fundsSnapshot.val() || 0;
      const fiveKISavings = savingsSnapshot.val() || 0;
      const totalYields = yieldsSnapshot.val() || 0;
      const savingsHistory = Object.entries(savingsHistorySnapshot.val() || {}).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));
      const fundsHistory = Object.entries(fundsHistorySnapshot.val() || {}).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));
      const yieldsHistory = Object.entries(yieldsHistorySnapshot.val() || {}).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));
      const membersData = membersSnapshot.val() || {};
      const totalMembers = Object.keys(membersData).length;
      const currentLoansData = currentLoansSnapshot.val() || {};
      const approvedLoansData = approvedLoansSnapshot.val() || {};
      const paymentsData = paymentsSnapshot.val() || {};
      const settingsData = settingsSnapshot.val() || {};
      
      // Extract percentage settings
      const investmentSharePercentage = parseFloat(settingsData.InvestmentSharePercentage || 0) / 100;
      const patronageSharePercentage = parseFloat(settingsData.PatronageSharePercentage || 0) / 100;
      const activeMonthsPercentage = parseFloat(settingsData.ActiveMonthsPercentage || 0) / 100;
      const membersDividendPercentage = parseFloat(settingsData.MembersDividendPercentage || 0) / 100;
      const fiveKiEarningsPercentage = parseFloat(settingsData.FiveKiEarningsPercentage || 0) / 100;
      // Save dividend date for due indicator
      window.__dividendSettingsDate = settingsData.DividendDate || '';
      
      let totalLoans = 0;
      let totalReceivables = 0;
      let activeBorrowers = 0;
      const loanItems = [];
      const borrowerSet = new Set();
      const monthlyFunds = Array(12).fill(0);

      Object.entries(currentLoansData).forEach(([memberId, loans]) => {
        Object.entries(loans).forEach(([transactionId, loan]) => {
          const outstandingBalance = parseFloat(loan.loanAmount) || 0;
          const originalLoan = approvedLoansData[memberId]?.[transactionId];
          const originalAmount = originalLoan ? parseFloat(originalLoan.loanAmount) || 0 : outstandingBalance;
          
          const term = loan.term || 'N/A';
          const interest = parseFloat(loan.interest) || 0;
          const monthlyPayment = parseFloat(loan.monthlyPayment) || 0;
          const totalMonthlyPayment = parseFloat(loan.totalMonthlyPayment) || 0;
          const totalTermPayment = parseFloat(loan.totalTermPayment) || 0;
          const dueDate = loan.dueDate || 'N/A';
          const dueDateObj = dueDate !== 'N/A' ? new Date(dueDate) : null;
          const isOverdue = dueDateObj && new Date() > dueDateObj;
          
          totalLoans += originalAmount;
          totalReceivables += outstandingBalance;
          borrowerSet.add(memberId);
          
          loanItems.push({
            memberId,
            transactionId,
            loanAmount: originalAmount,
            outstandingBalance,
            term,
            interest,
            monthlyPayment,
            totalMonthlyPayment,
            totalTermPayment,
            dueDate,
            isOverdue
          });
        });
      });

      activeBorrowers = borrowerSet.size;

      // Process funds history data for the selected year
      fundsHistory.forEach(item => {
        const date = new Date(item.date);
        if (date.getFullYear() === parseInt(selectedYear)) {
          const month = date.getMonth();
          // Get the latest funds amount for each month (or sum if multiple entries)
          monthlyFunds[month] = Math.max(monthlyFunds[month], item.amount);
        }
      });

      // If no funds history data, use current available funds for current month
      if (monthlyFunds.every(amount => amount === 0) && parseInt(selectedYear) === new Date().getFullYear()) {
        const currentMonth = new Date().getMonth();
        monthlyFunds[currentMonth] = availableFunds;
      }

      const formattedFunds = [
        { month: 'Jan', funds: monthlyFunds[0] },
        { month: 'Feb', funds: monthlyFunds[1] },
        { month: 'Mar', funds: monthlyFunds[2] },
        { month: 'Apr', funds: monthlyFunds[3] },
        { month: 'May', funds: monthlyFunds[4] },
        { month: 'Jun', funds: monthlyFunds[5] },
        { month: 'Jul', funds: monthlyFunds[6] },
        { month: 'Aug', funds: monthlyFunds[7] },
        { month: 'Sep', funds: monthlyFunds[8] },
        { month: 'Oct', funds: monthlyFunds[9] },
        { month: 'Nov', funds: monthlyFunds[10] },
        { month: 'Dec', funds: monthlyFunds[11] },
      ];

      setFundsData({
        availableFunds,
        totalYields,
        totalLoans,
        totalReceivables,
        fiveKISavings,
        activeBorrowers,
        totalMembers,
        savingsHistory,
        fundsHistory,
        yieldsHistory,
        investmentSharePercentage,
        patronageSharePercentage,
        activeMonthsPercentage,
        membersDividendPercentage,
        fiveKiEarningsPercentage
      });

      // Preserve settings snapshot for distribution
      window.__dividendSettings = {
        investmentSharePercentage,
        patronageSharePercentage,
        activeMonthsPercentage,
        membersDividendPercentage,
        fiveKiEarningsPercentage,
        availableFunds,
        fiveKISavings
      };
      
      setLoanData(loanItems);
      setEarningsData(formattedFunds);
      
      // Process dividends data from real transactions
      const dividendsItems = [];
      
      // Fetch all transaction types
      const transactionTypes = ['Registrations', 'Deposits', 'Loans', 'Payments', 'Withdrawals'];
      const allTransactions = {};
      
      const transactionPromises = transactionTypes.map(async (transactionType) => {
        try {
          const transactionSnapshot = await database.ref(`Transactions/${transactionType}`).once('value');
          if (transactionSnapshot.exists()) {
            const transactionData = transactionSnapshot.val();
            Object.entries(transactionData).forEach(([memberId, memberTransactions]) => {
              if (!allTransactions[memberId]) {
                allTransactions[memberId] = [];
              }
              Object.entries(memberTransactions).forEach(([transactionId, transaction]) => {
                allTransactions[memberId].push({
                  ...transaction,
                  type: transactionType,
                  transactionId
                });
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching ${transactionType} transactions:`, error);
        }
      });

      // Wait for all transaction types to be fetched
      await Promise.all(transactionPromises);
      
      // Process each member's transactions
      const memberProcessingPromises = Object.entries(membersData).map(async ([memberId, member]) => {
        // Skip members that are inactive (e.g., those who permanently withdrew)
        const status = (member?.status || '').toLowerCase();
        if (status === 'inactive') {
          return null;
        }

        const memberTransactions = allTransactions[memberId] || [];
        const monthlyDividends = Array(12).fill(0);
        const monthlyTransactions = Array(12).fill(null).map(() => []); // Store actual transactions for each month
        
        // Compute Investment from Transactions within the selected year
        let totalInvestment = 0;
        try {
          // Sum registration amount(s) within selected year
          const regsSnapForInvestment = await database.ref(`Transactions/Registrations/${memberId}`).once('value');
          if (regsSnapForInvestment.exists()) {
            Object.values(regsSnapForInvestment.val()).forEach(reg => {
              const d = parseTransactionDate(reg.dateApproved || reg.date);
              if (d && d.getFullYear() === parseInt(selectedYear)) {
                const amt = parseFloat(reg.amount) || 0;
                totalInvestment += amt;
              }
            });
          }
        } catch (e) {
          console.error(`Error computing registration part of investment for member ${memberId}:`, e);
        }
        
        try {
          // Sum approved deposit amounts within selected year
          const depsSnapForInvestment = await database.ref(`Transactions/Deposits/${memberId}`).once('value');
          if (depsSnapForInvestment.exists()) {
            Object.values(depsSnapForInvestment.val()).forEach(dep => {
              const d = parseTransactionDate(dep.dateApproved || dep.dateAdded || dep.date);
              if (d && d.getFullYear() === parseInt(selectedYear)) {
                // Only consider deposits that were approved/completed if such a field exists
                const status = (dep.status || '').toLowerCase();
                if (!status || status === 'approved' || status === 'completed') {
                  const amt = parseFloat(dep.amountToBeDeposited || dep.amount) || 0;
                  totalInvestment += amt;
                }
              }
            });
          }
        } catch (e) {
          console.error(`Error computing deposit part of investment for member ${memberId}:`, e);
        }
        
        // Filter transactions by selected year and process them
        memberTransactions.forEach(transaction => {
          const transactionDate = parseTransactionDate(transaction.dateApproved || transaction.dateAdded || transaction.date);
          if (transactionDate && transactionDate.getFullYear() === parseInt(selectedYear)) {
            const month = transactionDate.getMonth();

            // Only include approved transactions for dividends (ignore any 'paid' status)
            const status = (transaction.status || '').toLowerCase();
            if (status !== 'approved') {
              return; // skip non-approved or missing status
            }
            
            // Extract amount using correct field name for each transaction type
            // Exclude Deposits from monthly table (Jan-Dec)
            if (transaction.type === 'Deposits') {
              return; // skip counting deposits in monthly breakdown
            }
            let amount = 0;
            switch (transaction.type) {
              case 'Registrations':
                // Registrations don't have monetary amounts, skip them
                return;
              case 'Loans':
                amount = parseFloat(transaction.loanAmount) || 0;
                break;
              case 'Payments':
                amount = parseFloat(transaction.amountToBePaid) || 0;
                break;
              case 'Withdrawals':
                amount = parseFloat(transaction.amountWithdrawn) || 0;
                break;
              default:
                // Fallback to generic amount field
                amount = parseFloat(transaction.amount) || 0;
            }
            
            // Debug logging
            console.log(`Processing ${transaction.type} transaction:`, {
              originalAmount: amount,
              fieldUsed: transaction.type === 'Deposits' ? 'amountToBeDeposited' : 
                         transaction.type === 'Loans' ? 'loanAmount' :
                         transaction.type === 'Payments' ? 'amountToBePaid' :
                         transaction.type === 'Withdrawals' ? 'amountWithdrawn' : 'amount',
              transactionData: transaction
            });
            
            // Determine if transaction is positive or negative
            let adjustedAmount = amount;
            if (transaction.type === 'Loans' || transaction.type === 'Withdrawals') {
              adjustedAmount = -amount; // Loans and Withdrawals are negative (money going out)
            } else {
              adjustedAmount = amount; // Deposits and Payments are positive (money coming in)
            }
            
            monthlyDividends[month] += adjustedAmount;
            
            // Store the actual transaction with processed amount
            monthlyTransactions[month].push({
              ...transaction,
              adjustedAmount,
              originalAmount: amount,
              transactionDate: transactionDate,
              formattedDate: transactionDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            });
          }
        });
        
        const totalDividends = monthlyDividends.reduce((sum, dividend) => sum + dividend, 0);
        
        // Count approved loans and calculate total loan amount for this member from Transactions/Loans
        let approvedLoansCount = 0;
        let totalLoanAmount = 0;
        try {
          const memberLoansSnapshot = await database.ref(`Transactions/Loans/${memberId}`).once('value');
          if (memberLoansSnapshot.exists()) {
            const memberLoans = memberLoansSnapshot.val();
            // Count transactions with dateApproved field and sum loan amounts
            Object.values(memberLoans).forEach(loan => {
              if (loan.dateApproved) {
                // Check if the loan was approved in the selected year
                const approvedDate = parseTransactionDate(loan.dateApproved);
                if (approvedDate && approvedDate.getFullYear() === parseInt(selectedYear)) {
                  approvedLoansCount++;
                  // Add the loan amount to the total
                  const loanAmount = parseFloat(loan.loanAmount) || 0;
                  totalLoanAmount += loanAmount;
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching approved loans count for member ${memberId}:`, error);
        }

        // Determine Active Months based on registration dateApproved in Transactions/Registrations
        let activeMonthsCount = 12; // default full year
        try {
          const regsSnapshot = await database.ref(`Transactions/Registrations/${memberId}`).once('value');
          if (regsSnapshot.exists()) {
            const regs = regsSnapshot.val();
            let earliestApprovedDate = null;
            Object.values(regs).forEach(reg => {
              const d = parseTransactionDate(reg.dateApproved);
              if (d) {
                if (!earliestApprovedDate || d < earliestApprovedDate) {
                  earliestApprovedDate = d;
                }
              }
            });
            if (earliestApprovedDate) {
              const regYear = earliestApprovedDate.getFullYear();
              const regMonthIdx = earliestApprovedDate.getMonth(); // 0-11
              const selYear = parseInt(selectedYear);
              if (regYear < selYear) {
                activeMonthsCount = 12;
              } else if (regYear > selYear) {
                activeMonthsCount = 0;
              } else {
                activeMonthsCount = Math.max(0, 12 - regMonthIdx);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching registration for member ${memberId}:`, error);
        }
        
        // Only include members who have transactions in the selected year or have investment
        if (totalDividends !== 0 || totalInvestment > 0) {
          return {
            memberId,
            memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
            investment: totalInvestment,
            monthlyDividends,
            monthlyTransactions, // Include the actual transactions
            totalDividends,
            approvedLoansCount,
            totalLoanAmount,
            activeMonthsCount
          };
        }
        return null;
      });
      
      // Wait for all member processing to complete
      const processedMembers = await Promise.all(memberProcessingPromises);
      
      // Filter out null values and add to dividendsItems
      processedMembers.forEach(member => {
        if (member) {
          dividendsItems.push(member);
        }
      });
      
      setDividendsData(dividendsItems);
      if (!lightweight) setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!lightweight) setLoading(false);
    }
  };

  // Compute per-member dividends for the modal based on current table logic
  const computeMemberDividendShare = (member) => {
    const totalYields = fundsData.totalYields || 0;
    const totalInvestments = window.totalAllMembersInvestment || dividendsData.reduce((sum, m) => sum + (m.investment || 0), 0);
    const totalLoans = window.totalAllMembersLoanAmount || dividendsData.reduce((sum, m) => sum + (m.totalLoanAmount || 0), 0);
    const totalActiveMonths = window.totalActiveMonths || dividendsData.reduce((sum, m) => sum + (m.activeMonthsCount ?? 0), 0);

    const investmentShareDecimal = totalInvestments > 0 ? (member.investment / totalInvestments) : 0;
    const patronageShareDecimal = totalLoans > 0 ? ((member.totalLoanAmount || 0) / totalLoans) : 0;
    const activeMonthShareDecimal = totalActiveMonths > 0 ? ((member.activeMonthsCount ?? 0) / totalActiveMonths) : 0;

    const totalPercentageDecimal =
      (investmentShareDecimal * (fundsData.investmentSharePercentage || 0)) +
      (patronageShareDecimal * (fundsData.patronageSharePercentage || 0)) +
      (activeMonthShareDecimal * (fundsData.activeMonthsPercentage || 0));

    const membersDividendDecimal = fundsData.membersDividendPercentage || 0; // settings already /100
    const totalShare = totalYields * totalPercentageDecimal * membersDividendDecimal;
    return totalShare;
  };

  const openDividendsModal = async () => {
    try {
      setDistributionProcessing(true);
      // Gather members with investment info already prepared in dividendsData
      // Also fetch current savings from Members table for display
      const membersSnap = await database.ref('Members').once('value');
      const membersRaw = membersSnap.val() || {};

      const rows = dividendsData.map(m => {
        const memberRecord = membersRaw[m.memberId] || {};
        const savings = parseFloat(memberRecord.balance) || 0;
        const currentInvestment = parseFloat(memberRecord.investment) || 0; // display and increment source
        const dividend = computeMemberDividendShare(m);
        return {
          memberId: m.memberId,
          name: m.memberName,
          // show current members investment like AllMembers
          investment: currentInvestment,
          savings,
          dividend,
          _calcContext: m // keep context for potential recalcs
        };
      });

      setDistributionMembers(rows);
      setShowDividendsModal(true);
    } catch (e) {
      console.error('Open dividends modal error:', e);
      setErrorMessage('Failed to prepare dividends list');
      setErrorModalVisible(true);
    } finally {
      setDistributionProcessing(false);
    }
  };

  const confirmDistributeDividends = async () => {
    setDistributionConfirmVisible(true);
  };

  const performDistributeDividends = async () => {
    setDistributionConfirmVisible(false);
    setDistributionProcessing(true);
    try {
      const updates = {};
      const now = new Date();
      const approvedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const approvedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const year = now.getFullYear();

      // For each member, add dividend to savings and log a transaction entry
      distributionMembers.forEach(row => {
        // Savings increment (balance)
        const newBalPath = `Members/${row.memberId}/balance`;
        const newBalance = (parseFloat(row.savings) || 0) + (parseFloat(row.dividend) || 0);
        updates[newBalPath] = parseFloat(newBalance.toFixed(2));

        // Investment increment (align with Registrations approval behavior)
        const newInvPath = `Members/${row.memberId}/investment`;
        const newInvestment = (parseFloat(row.investment) || 0) + (parseFloat(row.dividend) || 0);
        updates[newInvPath] = parseFloat(newInvestment.toFixed(2));

        // Log dividend transaction like other Transactions sections
        const txnId = `DIV-${Date.now()}-${row.memberId}`;
        const txnPath = `Transactions/Dividends/${row.memberId}/${txnId}`;
        updates[`${txnPath}/type`] = 'DividendDistribution';
        updates[`${txnPath}/amount`] = parseFloat(row.dividend.toFixed(2));
        updates[`${txnPath}/dateApproved`] = approvedDate;
        updates[`${txnPath}/approvedTime`] = approvedTime;
        updates[`${txnPath}/year`] = year;
        updates[`${txnPath}/status`] = 'distributed';
      });

      await database.ref().update(updates);

      setDistributionSuccessVisible(true);
    } catch (e) {
      console.error('Distribution error:', e);
      setErrorMessage('Failed to distribute dividends');
      setErrorModalVisible(true);
    } finally {
      setDistributionProcessing(false);
    }
  };

  const healthStatus = fundsData.availableFunds > fundsData.totalLoans * 1.5 
    ? 'Excellent' 
    : fundsData.availableFunds > fundsData.totalLoans 
      ? 'Good' 
      : 'Needs Attention';

  const healthColor = healthStatus === 'Excellent' 
    ? '#10B981' 
    : healthStatus === 'Good' 
      ? '#F59E0B' 
      : '#EF4444';

  const formatCurrency = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleMonthClick = (member, monthIndex) => {
    const monthTransactions = member.monthlyTransactions[monthIndex];
    
    if (monthTransactions && monthTransactions.length > 0) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      setSelectedMonthTransactions({
        member: member,
        month: monthNames[monthIndex],
        year: selectedYear,
        transactions: monthTransactions
      });
      setTransactionBreakdownModal(true);
    }
  };

  const generateYears = () => {
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const loansPieData = {
    labels: ['Total Loans', 'Total Receivables'],
    datasets: [
      {
        data: [fundsData.totalLoans, fundsData.totalReceivables],
        backgroundColor: ['#2D5783', '#3B82F6'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1,
      },
    ],
  };

  const fundsLineData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Available Funds',
        data: earningsData.map(item => item.funds),
        backgroundColor: 'rgba(45, 87, 131, 0.08)',
        borderColor: '#2D5783',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#2D5783',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
      {
        label: 'Savings',
        data: earningsData.map((_, index) => {
          const monthSavings = fundsData.savingsHistory.filter(item => {
            const date = new Date(item.date);
            return date.getFullYear() === parseInt(selectedYear) && date.getMonth() === index;
          });
          return monthSavings.reduce((sum, item) => sum + item.amount, 0);
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: '#10B981',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      }
    ],
  };

  // Build Yields line data similar to Funds & Savings
  const yieldsLineData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Yields',
        data: earningsData.map((_, index) => {
          const monthYields = (fundsData.yieldsHistory || []).filter(item => {
            const date = new Date(item.date);
            return date.getFullYear() === parseInt(selectedYear) && date.getMonth() === index;
          });
          return monthYields.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        }),
        backgroundColor: 'rgba(234, 179, 8, 0.08)',
        borderColor: '#EAB308',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#EAB308',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            if (context.datasetIndex === 0 && context.chart.data.labels) {
              const percentage = Math.round((value / total) * 100);
              return `${label}: ₱${formatCurrency(value)} (${percentage}%)`;
            }
            return `${label}: ₱${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `₱${formatCurrency(value)}`;
          },
          stepSize: 500,
        },
        grid: { color: 'rgba(0,0,0,0.06)' }
      },
      x: { grid: { display: false } }
    }
  };

  const loansChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw || 0;
            return `${context.dataset.label || 'Amount'}: ₱${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          stepSize: 500,
          suggestedMax: Math.ceil(fundsData.totalReceivables / 500) * 500 || 2000
        }
      }
    }
  };

  const fundsChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { ...chartOptions.plugins.legend, labels: { ...chartOptions.plugins.legend.labels, padding: 12 } },
      tooltip: { ...chartOptions.plugins.tooltip }
    },
    scales: {
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          stepSize: 1000,
          suggestedMax: Math.ceil(fundsData.availableFunds / 1000) * 1000 || 10000
        },
        grid: { color: 'rgba(0,0,0,0.06)' }
      },
      x: { grid: { display: false } }
    }
  };

  const filteredLoans = loanData.filter(loan => 
    loan.memberId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loan.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enhanced professional styles matching the Settings component design
  const styles = {
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '0'
    },
    mainContainer: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative'
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e2e8f0'
    },
    headerText: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0'
    },
    headerSubtitle: {
      fontSize: '16px',
      color: '#64748b',
      marginTop: '4px'
    },
    // Primary Metrics Grid
    primaryMetricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    // Secondary Metrics Grid
    secondaryMetricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    primaryCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    fundsCard: {
      background: 'linear-gradient(135deg, #1E3A8A 0%, #2D5783 100%)',
      color: 'white',
    },
    metricCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #f1f5f9',
      transition: 'all 0.3s ease'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px'
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    cardIcon: {
      fontSize: '24px',
      color: '#1e40af'
    },
    fundsCardIcon: {
      fontSize: '24px',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    cardTitleText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0'
    },
    fundsCardTitleText: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      margin: '0'
    },
    metricValue: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#1e293b'
    },
    fundsMetricValue: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
      color: 'white'
    },
    secondaryMetricValue: {
      fontSize: '22px',
      fontWeight: '700',
      marginBottom: '4px',
      color: '#1e293b'
    },
    metricDescription: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '12px'
    },
    fundsMetricDescription: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '12px'
    },
    secondaryMetricDescription: {
      fontSize: '13px',
      color: '#64748b'
    },
    healthIndicator: {
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: '600',
      textAlign: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      borderRadius: '8px',
      marginTop: '8px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    section: {
      marginBottom: '32px'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b'
    },
    yearSelect: {
      padding: '10px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      outline: 'none'
    },
    chartContainer: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9',
      marginBottom: '24px'
    },
    chartWrapper: {
      height: '300px',
      position: 'relative'
    },
    loansSection: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9'
    },
    searchBox: {
      position: 'relative',
      minWidth: '280px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8fafc'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      fontSize: '16px'
    },
    tableContainer: {
      overflowX: 'auto',
      marginTop: '16px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    loansTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      color: '#374151',
      padding: '16px',
      textAlign: 'left',
      fontWeight: '600',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tableCell: {
      padding: '16px',
      borderBottom: '1px solid #f1f5f9',
      textAlign: 'left',
      fontSize: '14px'
    },
    overdueDate: {
      color: '#EF4444',
      fontWeight: '600'
    },
    overdueBadge: {
      display: 'inline-block',
      marginLeft: '8px',
      padding: '4px 8px',
      borderRadius: '6px',
      backgroundColor: '#FEF2F2',
      color: '#DC2626',
      fontSize: '12px',
      fontWeight: '600',
      border: '1px solid #FECACA'
    },
    resendButton: {
      padding: '8px 16px',
      backgroundColor: '#1e40af',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)',
    },
    // Modal styles matching Settings component
    centeredModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      width: '90%',
      maxWidth: '900px',
      border: '1px solid #e2e8f0',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalCardSmall: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      width: '90%',
      maxWidth: '420px',
      border: '1px solid #e2e8f0'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#64748B',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
    },
    confirmIcon: {
      fontSize: '56px',
      color: '#1e3a8a',
      marginBottom: '24px'
    },
    modalText: {
      fontSize: '16px',
      color: '#374151',
      marginBottom: '28px',
      lineHeight: '1.6',
      fontWeight: '500'
    },
    modalActions: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center'
    },
    actionButton: {
      padding: '14px 28px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      minWidth: '100px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    primaryActionButton: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      color: 'white',
    },
    secondaryActionButton: {
      backgroundColor: '#f8fafc',
      color: '#64748b',
      border: '2px solid #e2e8f0',
    },
    // Dividends Table Styles
    dividendsTableContainer: {
      overflowX: 'auto',
      marginTop: '20px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#fff'
    },
    dividendsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      minWidth: '1400px'
    },
    dividendsHeaderRow: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    dividendsHeaderCell: {
      padding: '16px 12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderRight: '1px solid #e2e8f0',
      whiteSpace: 'nowrap',
      minWidth: '80px',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    dividendsDataRow: {
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.2s',
    },
    dividendsDataCell: {
      padding: '16px 12px',
      borderRight: '1px solid #f1f5f9',
      verticalAlign: 'middle',
      fontSize: '14px'
    },
    memberInfo: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: '150px'
    },
    memberName: {
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: '4px'
    },
    memberId: {
      fontSize: '12px',
      color: '#6B7280'
    },
    dividendCell: {
      padding: '8px 10px',
      borderRadius: '8px',
      textAlign: 'center',
      color: '#fff',
      fontWeight: '500',
      minHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: '2px solid transparent'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      flexDirection: 'column',
      gap: '16px'
    },
    spinner: {
      border: '4px solid #f3f4f6',
      borderLeft: '4px solid #1e40af',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      color: '#6B7280',
      fontSize: '16px',
      fontWeight: '500'
    },
    noResults: {
      textAlign: 'center',
      color: '#6B7280',
      padding: '40px',
      fontSize: '16px'
    },
    // Charts Grid
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '20px'
    },
    // Distribution Summary
    distributionSummary: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }
  };

  // Add hover effects
  const addHoverEffect = (element) => {
    if (element && element.style) {
      element.style.transform = 'translateY(-2px)';
      element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
    }
  };

  const removeHoverEffect = (element) => {
    if (element && element.style) {
      element.style.transform = 'translateY(0)';
      element.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.mainContainer}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Financial Dashboard</h1>
            <p style={styles.headerSubtitle}>
              Monitor financial performance and manage loan operations
            </p>
          </div>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={styles.yearSelect}
          >
            {generateYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Primary Key Metrics Grid */}
        <div style={styles.primaryMetricsGrid}>
          <div 
            style={{...styles.primaryCard, ...styles.fundsCard}}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaMoneyBillWave style={styles.fundsCardIcon} />
                <h3 style={styles.fundsCardTitleText}>Available Funds</h3>
              </div>
            </div>
            <div style={styles.fundsMetricValue}>₱{formatCurrency(fundsData.availableFunds)}</div>
            <div style={styles.fundsMetricDescription}>Capital available for new loans</div>
            <div style={styles.healthIndicator}>
              Financial Health: {healthStatus}
            </div>
          </div>

          <div 
            style={styles.primaryCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaChartLine style={styles.cardIcon} />
                <h3 style={styles.cardTitleText}>Total Yields</h3>
              </div>
            </div>
            <div style={styles.metricValue}>₱{formatCurrency(fundsData.totalYields)}</div>
            <div style={styles.metricDescription}>Total interest from payments</div>
          </div>

          <div 
            style={styles.primaryCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaUsers style={styles.cardIcon} />
                <h3 style={styles.cardTitleText}>Total Members</h3>
              </div>
            </div>
            <div style={styles.metricValue}>{fundsData.totalMembers}</div>
            <div style={styles.metricDescription}>Total members in 5KI </div>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div style={styles.secondaryMetricsGrid}>
          <div 
            style={styles.metricCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardTitle}>
              <FaCreditCard style={styles.cardIcon} />
              <h3 style={styles.cardTitleText}>Total Loans</h3>
            </div>
            <div style={styles.secondaryMetricValue}>₱{formatCurrency(fundsData.totalLoans)}</div>
            <div style={styles.secondaryMetricDescription}>Active loan principal</div>
          </div>

          <div 
            style={styles.metricCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardTitle}>
              <FaExchangeAlt style={styles.cardIcon} />
              <h3 style={styles.cardTitleText}>Total Receivables</h3>
            </div>
            <div style={styles.secondaryMetricValue}>₱{formatCurrency(fundsData.totalReceivables)}</div>
            <div style={styles.secondaryMetricDescription}>Outstanding balances</div>
          </div>

          <div 
            style={styles.metricCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardTitle}>
              <FaPiggyBank style={styles.cardIcon} />
              <h3 style={styles.cardTitleText}>5KI Earnings</h3>
            </div>
            <div style={styles.secondaryMetricValue}>₱{formatCurrency(fundsData.fiveKISavings)}</div>
            <div style={styles.secondaryMetricDescription}>Organization savings</div>
          </div>

          <div 
            style={styles.metricCard}
            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
          >
            <div style={styles.cardTitle}>
              <FaBusinessTime style={styles.cardIcon} />
              <h3 style={styles.cardTitleText}>Active Borrowers</h3>
            </div>
            <div style={styles.secondaryMetricValue}>{fundsData.activeBorrowers}</div>
            <div style={styles.secondaryMetricDescription}>Members with active loans</div>
          </div>
        </div>

        {/* Loans Portfolio Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Loans Portfolio Overview</h2>
          </div>
          <div style={styles.chartContainer}>
            <div style={styles.chartWrapper}>
              <Bar 
                data={{
                  labels: ['Total Loans', 'Total Receivables'],
                  datasets: [
                    {
                      label: 'Amount',
                      data: [fundsData.totalLoans, fundsData.totalReceivables],
                      backgroundColor: ['#2D5783', '#3B82F6'],
                      borderColor: ['#1E3A5F', '#1F5FBF'],
                      borderWidth: 1,
                      borderRadius: 6,
                      barThickness: 48,
                    }
                  ]
                }} 
                options={loansChartOptions}
              />
            </div>
          </div>
        </div>

        {/* Financial Growth Section - Side by Side Charts */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Financial Growth Overview ({selectedYear})</h2>
          </div>
          
          <div style={styles.chartsGrid}>
            {/* Financial Growth Overview Chart */}
            <div style={styles.chartContainer}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Funds & Savings</h3>
              </div>
              <div style={styles.chartWrapper}>
                <Line 
                  data={fundsLineData} 
                  options={fundsChartOptions}
                />
              </div>
            </div>

            {/* Yields Growth Chart */}
            <div style={styles.chartContainer}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Yields Growth</h3>
              </div>
              <div style={styles.chartWrapper}>
                <Line 
                  data={yieldsLineData}
                  options={fundsChartOptions}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dividends Distribution Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Dividends Distribution ({selectedYear})</h2>
            <button 
              onClick={openDividendsModal} 
              style={styles.resendButton}
              onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
              onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
            >
              <FaExchangeAlt />
              Distribute Dividends
            </button>
          </div>

          {/* Distribution Summary */}
          <div style={styles.distributionSummary}>
            {(() => {
              const totalYields = fundsData.totalYields || 0;
              const membersDividendValue = totalYields * (fundsData.membersDividendPercentage || 0);
              const fiveKiEarningsValue = totalYields * (fundsData.fiveKiEarningsPercentage || 0);
              const chip = (bg, border, color, label) => (
                <div style={{ 
                  padding: '8px 16px', 
                  background: bg, 
                  color, 
                  border: `1px solid ${border}`, 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  fontSize: '13px' 
                }}>
                  {label}
                </div>
              );
              return (
                <>
                  {chip('#ECFDF5', '#A7F3D0', '#065F46', `Members Dividend: ₱${formatCurrency(membersDividendValue)}`)}
                  {chip('#EFF6FF', '#BFDBFE', '#1E3A8A', `5KI Earnings: ₱${formatCurrency(fiveKiEarningsValue)}`)}
                </>
              );
            })()}
          </div>

          {/* Due Indicator */}
          <div style={{ marginBottom: '20px' }}>
            {(() => {
              const settingsDate = (window.__dividendSettingsDate || '').toString();
              const isDue = (() => {
                if (!settingsDate) return false;
                const d = new Date(settingsDate);
                if (isNaN(d.getTime())) return false;
                const today = new Date();
                const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const tt = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return dd.getTime() <= tt.getTime();
              })();
              return isDue ? (
                <span style={{ 
                  ...styles.overdueBadge, 
                  backgroundColor: '#FEF3C7', 
                  color: '#B45309', 
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px'
                }}>
                  Dividends Action Needed
                </span>
              ) : null;
            })()}
          </div>

          {/* Dividends Visualization */}
          <div style={styles.chartsGrid}>
            <div style={styles.chartContainer}>
              <div style={styles.chartWrapper}>
                <Pie
                  data={{
                    labels: ['Members Dividend', '5KI Earnings'],
                    datasets: [
                      {
                        data: [
                          ((fundsData.membersDividendPercentage || 0) * 100),
                          ((fundsData.fiveKiEarningsPercentage || 0) * 100)
                        ],
                        backgroundColor: ['#10B981', '#3B82F6'],
                        borderColor: ['#fff', '#fff'],
                        borderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(0)}%`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div style={styles.chartContainer}>
              <div style={styles.chartWrapper}>
                <Pie
                  data={{
                    labels: ['Investment Share', 'Patronage Share', 'Active Months'],
                    datasets: [
                      {
                        data: [
                          ((fundsData.investmentSharePercentage || 0) * 100),
                          ((fundsData.patronageSharePercentage || 0) * 100),
                          ((fundsData.activeMonthsPercentage || 0) * 100)
                        ],
                        backgroundColor: ['#7C3AED', '#DC2626', '#059669'],
                        borderColor: ['#fff', '#fff', '#fff'],
                        borderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(0)}%`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Detailed Dividends Table */}
          <div style={styles.chartContainer}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Member Dividends Breakdown</h3>
            </div>
            <div style={styles.dividendsTableContainer}>
              {(() => {
                const totalAllMembersInvestment = dividendsData.reduce((sum, member) => sum + (member.investment || 0), 0);
                window.totalAllMembersInvestment = totalAllMembersInvestment;
                const totalAllMembersLoanAmount = dividendsData.reduce((sum, member) => sum + (member.totalLoanAmount || 0), 0);
                window.totalAllMembersLoanAmount = totalAllMembersLoanAmount;
                const totalActiveMonths = dividendsData.reduce((sum, member) => sum + (member.activeMonthsCount || 0), 0);
                window.totalActiveMonths = totalActiveMonths;
                return null;
              })()}
              
              <table style={styles.dividendsTable}>
                <thead>
                  <tr style={styles.dividendsHeaderRow}>
                    <th style={styles.dividendsHeaderCell}>Members</th>
                    <th style={styles.dividendsHeaderCell}>Investment</th>
                    <th style={styles.dividendsHeaderCell}>Jan</th>
                    <th style={styles.dividendsHeaderCell}>Feb</th>
                    <th style={styles.dividendsHeaderCell}>Mar</th>
                    <th style={styles.dividendsHeaderCell}>Apr</th>
                    <th style={styles.dividendsHeaderCell}>May</th>
                    <th style={styles.dividendsHeaderCell}>Jun</th>
                    <th style={styles.dividendsHeaderCell}>Jul</th>
                    <th style={styles.dividendsHeaderCell}>Aug</th>
                    <th style={styles.dividendsHeaderCell}>Sep</th>
                    <th style={styles.dividendsHeaderCell}>Oct</th>
                    <th style={styles.dividendsHeaderCell}>Nov</th>
                    <th style={styles.dividendsHeaderCell}>Dec</th>
                    <th style={styles.dividendsHeaderCell}>Total</th>
                    <th style={styles.dividendsHeaderCell}>Loan Count</th>
                    <th style={styles.dividendsHeaderCell}>Amount</th>
                    <th style={styles.dividendsHeaderCell}>Investment Share</th>
                    <th style={styles.dividendsHeaderCell}>Patronage Share</th>
                    <th style={styles.dividendsHeaderCell}>Active Month</th>
                    <th style={styles.dividendsHeaderCell}>Active Month %</th>
                    <th style={styles.dividendsHeaderCell}>Total %</th>
                    <th style={styles.dividendsHeaderCell}>Total Share</th>
                  </tr>
                </thead>
                <tbody>
                  {dividendsData.map((member, index) => (
                    <tr key={member.memberId} style={styles.dividendsDataRow}>
                      <td style={styles.dividendsDataCell}>
                        <div style={styles.memberInfo}>
                          <span style={styles.memberName}>{member.memberName}</span>
                          <span style={styles.memberId}>ID: {member.memberId}</span>
                        </div>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        ₱{formatCurrency(member.investment)}
                      </td>
                      {member.monthlyDividends.map((dividend, monthIndex) => {
                        const hasTransactions = member.monthlyTransactions[monthIndex]?.length > 0;
                        return (
                          <td key={monthIndex} style={styles.dividendsDataCell}>
                            <div 
                              style={{
                                ...styles.dividendCell,
                                backgroundColor: dividend > 0 
                                  ? `rgba(16, 185, 129, ${Math.min(Math.abs(dividend) / 1000, 0.8)})` 
                                  : dividend < 0 
                                    ? `rgba(239, 68, 68, ${Math.min(Math.abs(dividend) / 1000, 0.8)})` 
                                    : '#f8f9fa',
                                color: dividend !== 0 ? '#fff' : '#666',
                                cursor: hasTransactions ? 'pointer' : 'default',
                              }}
                              onClick={() => hasTransactions && handleMonthClick(member, monthIndex)}
                              onMouseEnter={(e) => {
                                if (hasTransactions) {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.borderColor = dividend > 0 ? '#10B981' : '#EF4444';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasTransactions) {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.borderColor = 'transparent';
                                }
                              }}
                            >
                              {dividend > 0 ? '+' : dividend < 0 ? '-' : ''}₱{formatCurrency(Math.abs(dividend))}
                            </div>
                          </td>
                        );
                      })}
                      <td style={styles.dividendsDataCell}>
                        <strong style={{
                          color: member.totalDividends > 0 ? '#10B981' : member.totalDividends < 0 ? '#EF4444' : '#666'
                        }}>
                          {member.totalDividends > 0 ? '+' : member.totalDividends < 0 ? '-' : ''}₱{formatCurrency(Math.abs(member.totalDividends))}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#2D5783'}}>
                          {member.approvedLoansCount || 0}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#059669'}}>
                          ₱{formatCurrency(member.totalLoanAmount || 0)}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#7C3AED'}}>
                          {window.totalAllMembersInvestment > 0 
                            ? ((member.investment / window.totalAllMembersInvestment) * 100).toFixed(2) + '%' 
                            : '0.00%'}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#DC2626'}}>
                          {totalAllMembersLoanAmount > 0 
                            ? (((member.totalLoanAmount || 0) / totalAllMembersLoanAmount) * 100).toFixed(2) + '%' 
                            : '0.00%'}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#059669'}}>
                          {member.activeMonthsCount ?? 0}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#7C3AED'}}>
                          {(() => {
                            const totalActiveMonths = window.totalActiveMonths || 1; // avoid divide by 0
                            const activeMonthShareDecimal = (member.activeMonthsCount ?? 0) / totalActiveMonths;
                            return (activeMonthShareDecimal * 100).toFixed(2) + '%';
                          })()}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#DC2626'}}>
                          {(() => {
                            // Member shares based on totals
                            const totalInvestments = window.totalAllMembersInvestment || 0;
                            const totalLoans = window.totalAllMembersLoanAmount || 0;
                            const totalActiveMonths = window.totalActiveMonths || 0;

                            const investmentShareDecimal = totalInvestments > 0
                              ? (member.investment / totalInvestments)
                              : 0;
                            const patronageShareDecimal = totalLoans > 0
                              ? (((member.totalLoanAmount || 0) / totalLoans))
                              : 0;
                            const activeMonthShareDecimal = totalActiveMonths > 0
                              ? ((member.activeMonthsCount ?? 0) / totalActiveMonths)
                              : 0;

                            // Weights (already decimals) from settings
                            const totalPercentage =
                              (investmentShareDecimal * (fundsData.investmentSharePercentage || 0)) +
                              (patronageShareDecimal * (fundsData.patronageSharePercentage || 0)) +
                              (activeMonthShareDecimal * (fundsData.activeMonthsPercentage || 0));

                            return (totalPercentage * 100).toFixed(2) + '%';
                          })()}
                        </strong>
                      </td>
                      <td style={styles.dividendsDataCell}>
                        <strong style={{color: '#111827'}}>
                          {(() => {
                            // Total Share = Total Yields * Total% * MembersDividendPercentage (all decimals)
                            const totalYields = fundsData.totalYields || 0;

                            // Use totals-based shares (consistent with Total % cell)
                            const totalInvestments = window.totalAllMembersInvestment || 0;
                            const totalLoans = window.totalAllMembersLoanAmount || 0;
                            const totalActiveMonths = window.totalActiveMonths || 0;

                            const investmentShareDecimal = totalInvestments > 0 
                              ? (member.investment / totalInvestments) 
                              : 0;
                            const patronageShareDecimal = totalLoans > 0 
                              ? (((member.totalLoanAmount || 0) / totalLoans)) 
                              : 0;
                            const activeMonthShareDecimal = totalActiveMonths > 0 
                              ? ((member.activeMonthsCount ?? 0) / totalActiveMonths) 
                              : 0;

                            const totalPercentageDecimal = 
                              (investmentShareDecimal * (fundsData.investmentSharePercentage || 0)) +
                              (patronageShareDecimal * (fundsData.patronageSharePercentage || 0)) +
                              (activeMonthShareDecimal * (fundsData.activeMonthsPercentage || 0));
                            const membersDividendDecimal = fundsData.membersDividendPercentage || 0; // settings already /100
                            const totalShare = totalYields * totalPercentageDecimal * membersDividendDecimal;
                            return `₱${formatCurrency(totalShare)}`;
                          })()}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Loans Management Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Active Loans Portfolio</h2>
            <div style={styles.searchBox}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by Member ID or Transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>
          
          <div style={styles.loansSection}>
            <div style={styles.tableContainer}>
              <table style={styles.loansTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Member ID</th>
                    <th style={styles.tableHeader}>Transaction ID</th>
                    <th style={styles.tableHeader}>Amount</th>
                    <th style={styles.tableHeader}>Outstanding</th>
                    <th style={styles.tableHeader}>Term</th>
                    <th style={styles.tableHeader}>Interest</th>
                    <th style={styles.tableHeader}>Monthly</th>
                    <th style={styles.tableHeader}>Total Monthly</th>
                    <th style={styles.tableHeader}>Penalty</th>
                    <th style={styles.tableHeader}>New Total Monthly</th>
                    <th style={styles.tableHeader}>Due Date</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length > 0 ? (
                    filteredLoans.map((loan, index) => (
                      <tr key={`${loan.memberId}-${loan.transactionId}`}>
                        <td style={styles.tableCell}>{loan.memberId}</td>
                        <td style={styles.tableCell}>{loan.transactionId}</td>
                        <td style={styles.tableCell}>₱{formatCurrency(loan.loanAmount)}</td>
                        <td style={styles.tableCell}>₱{formatCurrency(loan.outstandingBalance)}</td>
                        <td style={styles.tableCell}>{loan.term}</td>
                        <td style={styles.tableCell}>{loan.interest}</td>
                        <td style={styles.tableCell}>₱{formatCurrency(loan.monthlyPayment)}</td>
                        <td style={styles.tableCell}>₱{formatCurrency(loan.totalMonthlyPayment)}</td>
                        {(() => {
                          const { penalty, newTotalMonthly } = computePenaltyAndNewTotal(loan);
                          return (
                            <>
                              <td style={styles.tableCell}>₱{formatCurrency(penalty)}</td>
                              <td style={styles.tableCell}>₱{formatCurrency(newTotalMonthly)}</td>
                            </>
                          );
                        })()}
                        <td style={styles.tableCell}>
                          <span style={loan.isOverdue ? styles.overdueDate : null}>
                            {formatDisplayDate(loan.dueDate)}
                          </span>
                          {loan.isOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                        </td>
                        <td style={styles.tableCell}>
                          <button 
                            onClick={() => handleResendClick(loan)}
                            style={styles.resendButton}
                            onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                            onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
                          >
                            <FaExchangeAlt />
                            Resend Reminder
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" style={styles.noResults}>
                        No loans found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* All Modals */}
        {showDividendsModal && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button 
                style={styles.closeButton} 
                onClick={() => setShowDividendsModal(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <h3 style={styles.modalTitle}>Distribute Dividends</h3>
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table style={styles.dividendsTable}>
                  <thead>
                    <tr>
                      <th style={styles.dividendsHeaderCell}>Member ID</th>
                      <th style={styles.dividendsHeaderCell}>Member</th>
                      <th style={styles.dividendsHeaderCell}>Investments</th>
                      <th style={styles.dividendsHeaderCell}>Savings</th>
                      <th style={styles.dividendsHeaderCell}>Dividends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributionMembers.map(r => (
                      <tr key={r.memberId}>
                        <td style={styles.dividendsDataCell}>{r.memberId}</td>
                        <td style={styles.dividendsDataCell}>{r.name}</td>
                        <td style={styles.dividendsDataCell}>₱{formatCurrency(r.investment)}</td>
                        <td style={styles.dividendsDataCell}>₱{formatCurrency(r.savings)}</td>
                        <td style={styles.dividendsDataCell}><strong>₱{formatCurrency(r.dividend)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{...styles.modalActions, marginTop: '24px'}}>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryActionButton}}
                  onClick={() => setShowDividendsModal(false)}
                  onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
                >
                  Cancel
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.primaryActionButton}}
                  onClick={confirmDistributeDividends}
                  disabled={distributionProcessing || distributionMembers.length === 0}
                  onMouseEnter={(e) => !distributionProcessing && distributionMembers.length > 0 && addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => !distributionProcessing && distributionMembers.length > 0 && removeHoverEffect(e.currentTarget)}
                >
                  {distributionProcessing ? 'Processing...' : 'Distribute'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Distribution Modal */}
        {distributionConfirmVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={styles.closeButton} 
                onClick={() => setDistributionConfirmVisible(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <FaExclamationCircle style={styles.confirmIcon} />
              <p style={styles.modalText}>Are you sure you want to distribute dividends to all listed members?</p>
              <div style={styles.modalActions}>
                <button 
                  style={{...styles.actionButton, ...styles.primaryActionButton}}
                  onClick={performDistributeDividends}
                  disabled={distributionProcessing}
                  onMouseEnter={(e) => !distributionProcessing && addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => !distributionProcessing && removeHoverEffect(e.currentTarget)}
                >
                  {distributionProcessing ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryActionButton}}
                  onClick={() => setDistributionConfirmVisible(false)}
                  onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {distributionSuccessVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={styles.closeButton} 
                onClick={() => setDistributionSuccessVisible(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <FaCheckCircle style={{...styles.confirmIcon, color: '#10b981'}} />
              <p style={styles.modalText}>Dividends distributed successfully!</p>
              <button 
                style={{...styles.actionButton, ...styles.primaryActionButton}}
                onClick={() => {
                  setDistributionSuccessVisible(false);
                  setShowDividendsModal(false);
                  fetchDashboardData({ lightweight: true });
                }}
                onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {showResendConfirmation && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={styles.closeButton} 
                onClick={() => setShowResendConfirmation(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <FaExclamationCircle style={styles.confirmIcon} />
              <p style={styles.modalText}>Are you sure you want to resend the payment reminder?</p>
              <div style={styles.modalActions}>
                <button 
                  style={{...styles.actionButton, ...styles.primaryActionButton}}
                  onClick={confirmResendReminder}
                  disabled={actionInProgress}
                  onMouseEnter={(e) => !actionInProgress && addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => !actionInProgress && removeHoverEffect(e.currentTarget)}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryActionButton}}
                  onClick={() => setShowResendConfirmation(false)}
                  disabled={actionInProgress}
                  onMouseEnter={(e) => !actionInProgress && addHoverEffect(e.currentTarget)}
                  onMouseLeave={(e) => !actionInProgress && removeHoverEffect(e.currentTarget)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessageModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={styles.closeButton} 
                onClick={() => setSuccessMessageModalVisible(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <FaCheckCircle style={{...styles.confirmIcon, color: '#10b981'}} />
              <p style={styles.modalText}>{successMessage}</p>
              <button 
                style={{...styles.actionButton, ...styles.primaryActionButton}}
                onClick={() => setSuccessMessageModalVisible(false)}
                onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {errorModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={styles.closeButton} 
                onClick={() => setErrorModalVisible(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <FaExclamationCircle style={{...styles.confirmIcon, color: '#ef4444'}} />
              <p style={styles.modalText}>{errorMessage}</p>
              <button 
                style={{...styles.actionButton, ...styles.primaryActionButton}}
                onClick={() => setErrorModalVisible(false)}
                onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {actionInProgress && (
          <div style={styles.centeredModal}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>Processing...</div>
            </div>
          </div>
        )}

        {/* Transaction Breakdown Modal */}
        {transactionBreakdownModal && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button 
                style={styles.closeButton} 
                onClick={() => setTransactionBreakdownModal(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              
              <h3 style={styles.modalTitle}>
                Transaction Breakdown - {selectedMonthTransactions.month} {selectedMonthTransactions.year}
              </h3>
              
              <div style={{marginBottom: '16px', color: '#666', fontSize: '14px'}}>
                <strong>{selectedMonthTransactions.member?.memberName}</strong> (ID: {selectedMonthTransactions.member?.memberId})
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={styles.dividendsHeaderRow}>
                      <th style={{...styles.dividendsHeaderCell, width: '140px'}}>Date</th>
                      <th style={{...styles.dividendsHeaderCell, width: '120px'}}>Type</th>
                      <th style={{...styles.dividendsHeaderCell, width: '160px'}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonthTransactions.transactions.map((transaction, index) => (
                      <tr key={index} style={styles.dividendsDataRow}>
                        <td style={styles.dividendsDataCell}>
                          {transaction.formattedDate}
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <span style={{
                            backgroundColor: transaction.type === 'Loans' ? '#fee2e2' : '#d1fae5',
                            color: transaction.type === 'Loans' ? '#dc2626' : '#059669',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {transaction.type}
                          </span>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <div>
                            <span style={{
                              color: transaction.adjustedAmount > 0 ? '#059669' : '#dc2626',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              {transaction.adjustedAmount > 0 ? '+' : transaction.adjustedAmount < 0 ? '-' : ''}₱{formatCurrency(Math.abs(transaction.adjustedAmount))}
                            </span>
                            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                              Original: ₱{formatCurrency(transaction.originalAmount)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{
                  marginTop: '20px', 
                  padding: '16px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #2D5783'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontWeight: '600', color: '#2D5783', fontSize: '14px'}}>
                      Month Total ({selectedMonthTransactions.transactions.length} transactions):
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: selectedMonthTransactions.transactions.reduce((sum, t) => sum + t.adjustedAmount, 0) > 0 ? '#059669' : '#dc2626'
                    }}>
                      {selectedMonthTransactions.transactions.reduce((sum, t) => sum + t.adjustedAmount, 0) > 0 ? '+' : 
                       selectedMonthTransactions.transactions.reduce((sum, t) => sum + t.adjustedAmount, 0) < 0 ? '-' : ''}
                      ₱{formatCurrency(Math.abs(selectedMonthTransactions.transactions.reduce((sum, t) => sum + t.adjustedAmount, 0)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;