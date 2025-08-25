import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { SendLoanReminder } from '../../../../../Server/api';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

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
    totalLoans: 0,
    totalReceivables: 0,
    fiveKISavings: 0,
    activeBorrowers: 0,
    totalMembers: 0,
    savingsHistory: []
  });
  const [loanData, setLoanData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [dividendsData, setDividendsData] = useState([]);
  const [selectedChart, setSelectedChart] = useState('loans');
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

  const checkDueDates = async () => {
    try {
      console.log('Checking due dates for loan reminders...');
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Format dates for logging
      const formattedNow = now.toISOString();
      const formattedOneWeekFromNow = oneWeekFromNow.toISOString();
      console.log(`Current date: ${formattedNow}`);
      console.log(`One week from now: ${formattedOneWeekFromNow}`);
      
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
          
          // Check if the due date is within the next week
          const isWithinOneWeek = dueDate <= oneWeekFromNow && dueDate > now;
          console.log(`Is within one week: ${isWithinOneWeek}`);
          
          if (isWithinOneWeek) {
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

  // Refresh dividends data when year changes
  useEffect(() => {
    if (selectedChart === 'dividends') {
      fetchDashboardData();
    }
  }, [selectedYear, selectedChart]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        fundsSnapshot,
        fiveKISnapshot,
        savingsHistorySnapshot,
        fundsHistorySnapshot,
        membersSnapshot,
        currentLoansSnapshot,
        approvedLoansSnapshot,
        paymentsSnapshot,
        settingsSnapshot
      ] = await Promise.all([
        database.ref('Settings/Funds').once('value'),
        database.ref('Settings/Savings').once('value'),
        database.ref('Settings/SavingsHistory').once('value'),
        database.ref('Settings/FundsHistory').once('value'),
        database.ref('Members').once('value'),
        database.ref('Loans/CurrentLoans').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Payments/ApprovedPayments').once('value'),
        database.ref('Settings').once('value')
      ]);

      const availableFunds = fundsSnapshot.val() || 0;
      const fiveKISavings = fiveKISnapshot.val() || 0;
      const savingsHistory = Object.entries(savingsHistorySnapshot.val() || {}).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));
      const fundsHistory = Object.entries(fundsHistorySnapshot.val() || {}).map(([date, amount]) => ({
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
        totalLoans,
        totalReceivables,
        fiveKISavings,
        activeBorrowers,
        totalMembers,
        savingsHistory,
        fundsHistory,
        investmentSharePercentage,
        patronageSharePercentage,
        activeMonthsPercentage
      });
      
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
        const memberTransactions = allTransactions[memberId] || [];
        const monthlyDividends = Array(12).fill(0);
        const monthlyTransactions = Array(12).fill(null).map(() => []); // Store actual transactions for each month
        // Use member's balance from Members table as investment
        const totalInvestment = parseFloat(member.balance) || 0;
        
        // Filter transactions by selected year and process them
        memberTransactions.forEach(transaction => {
          const transactionDate = parseTransactionDate(transaction.dateApproved || transaction.dateAdded || transaction.date);
          if (transactionDate && transactionDate.getFullYear() === parseInt(selectedYear)) {
            const month = transactionDate.getMonth();
            
            // Extract amount using correct field name for each transaction type
            let amount = 0;
            switch (transaction.type) {
              case 'Registrations':
                // Registrations don't have monetary amounts, skip them
                return;
              case 'Deposits':
                amount = parseFloat(transaction.amountToBeDeposited) || 0;
                break;
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
            totalLoanAmount
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
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
        data: [fundsData.totalLoans, fundsData.totalReceivables - fundsData.totalLoans],
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
        backgroundColor: 'rgba(45, 87, 131, 0.1)',
        borderColor: '#2D5783',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#2D5783',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10B981',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
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
        }
      }
    }
  };

  const loansChartOptions = {
    ...chartOptions,
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
    scales: {
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          stepSize: 1000,
          suggestedMax: Math.ceil(fundsData.availableFunds / 1000) * 1000 || 10000
        }
      }
    }
  };

  const filteredLoans = loanData.filter(loan => 
    loan.memberId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loan.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: {
      width: '100%',
      height: '100%',
      padding: '20px',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#f5f7fa',
    },
    header: {
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '1px solid #e0e0e0'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#2D5783',
      margin: 0
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
      width: '100%',
      alignItems: 'stretch'
    },
    secondaryMetricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      marginBottom: '40px',
      marginTop: '50px',
      width: '100%',
      alignItems: 'stretch',
      '@media (max-width: 768px)': {
        gridTemplateColumns: 'repeat(2, 1fr)'
      },
      '@media (max-width: 480px)': {
        gridTemplateColumns: '1fr'
      }
    },
    primaryCard: {
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: '70px'
    },
    secondaryCard: {
      height: '100%',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    metricCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    fundsCard: {
      background: 'linear-gradient(135deg, #2D5783 0%, #1E3A8A 100%)',
      color: 'white'
    },
    metricContent: {
      marginBottom: '10px'
    },
    metricTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '5px',
      color: '#6B7280'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '5px',
      color: '#1F2937'
    },
    fundsMetricValue: {
      color: 'white'
    },
    metricDescription: {
      fontSize: '14px',
      color: '#6B7280'
    },
    fundsMetricDescription: {
      color: 'rgba(255,255,255,0.8)'
    },
    healthIndicator: {
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: '600',
      textAlign: 'center',
      backgroundColor: healthColor,
      color: 'white',
      borderRadius: '4px',
      marginTop: '6px'
    },
    chartsSection: {
      marginBottom: '20px'
    },
    chartSelector: {
      display: 'flex',
      gap: '20px',
      marginTop: '30px',
      marginBottom: '15px'
    },
    chartButton: {
      padding: '8px 16px',
      backgroundColor: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    selectedChartButton: {
      backgroundColor: '#2D5783',
      color: 'white',
      borderColor: '#2D5783'
    },
    chartContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    chartTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1F2937'
    },
    yearSelect: {
      padding: '8px 12px',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      backgroundColor: 'white'
    },
    chartWrapper: {
      height: '300px',
      position: 'relative'
    },
    loansSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap',
      gap: '10px',
      width: '100%'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1F2937',
      flex: '1 1 auto',
      minWidth: '0'
    },
    searchBox: {
      minWidth: '200px',
      maxWidth: '300px',
      flex: '0 0 auto'
    },
    searchInput: {
      width: '100%',
      padding: '10px 15px',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      outline: 'none'
    },
    tableContainer: {
      overflowX: 'auto',
      marginTop: '15px',
      maxWidth: '100%'
    },
    loansTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    tableHeader: {
      backgroundColor: '#F9FAFB',
      color: '#6B7280',
      padding: '12px',
      textAlign: 'center',
      fontWeight: '600',
      borderBottom: '1px solid #E5E7EB'
    },
    tableCell: {
      padding: '12px',
      borderBottom: '1px solid #E5E7EB',
      textAlign: 'center'
    },
    overdueDate: {
      color: '#EF4444',
      fontWeight: '600'
    },
    overdueBadge: {
      display: 'inline-block',
      marginLeft: '5px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: '#FEE2E2',
      color: '#EF4444',
      fontSize: '12px',
      fontWeight: '600'
    },
    resendButton: {
      padding: '6px 12px',
      backgroundColor: '#2D5783',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'background-color 0.2s'
    },
  modalCardSmall: {
    width: '250px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  confirmIcon: {
    marginBottom: '12px',
    fontSize: '32px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    color: '#333',
    lineHeight: '1.4'
  },
  actionButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    minWidth: '100px',
    outline: 'none'
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF'
  },
  rejectButton: {
    backgroundColor: '#f44336',
    color: '#FFF'
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'grey',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px',
    outline: 'none'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: '0.7'
  },
    noResults: {
      textAlign: 'center',
      color: '#6B7280',
      padding: '20px'
    },
    centeredModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalCard: {
      width: '90%',
      maxWidth: '800px',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxHeight: '90vh',
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    },
    modalContent: {
      paddingBottom: '12px',
      overflowY: 'auto',
      flex: 1
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#2D5783',
      margin: '0 0 20px 0',
      textAlign: 'left'
    },
    modalIcon: {
      fontSize: '32px',
      marginBottom: '10px'
    },

    modalActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px'
    },
    modalButton: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600'
    },
    spinner: {
      border: '4px solid rgba(0,0,0,0.1)',
      borderLeftColor: '#2D5783',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      animation: 'spin 1s linear infinite'
    },
    
    // Dividends Table Styles
    dividendsTableContainer: {
      overflowX: 'auto',
      marginTop: '20px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#fff',
      maxWidth: '100%'
    },
    dividendsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      minWidth: '1400px'
    },
    dividendsHeaderRow: {
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #e0e0e0'
    },
    dividendsHeaderCell: {
      padding: '12px 8px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#2D5783',
      borderRight: '1px solid #e0e0e0',
      whiteSpace: 'nowrap',
      minWidth: '80px'
    },
    dividendsDataRow: {
      borderBottom: '1px solid #f0f0f0',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#f8f9fa'
      }
    },
    dividendsDataCell: {
      padding: '12px 8px',
      borderRight: '1px solid #f0f0f0',
      verticalAlign: 'middle'
    },
    memberInfo: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: '150px'
    },
    memberName: {
      fontWeight: '600',
      color: '#333',
      marginBottom: '2px'
    },
    memberId: {
      fontSize: '12px',
      color: '#666'
    },
    dividendCell: {
      padding: '6px 8px',
      borderRadius: '4px',
      textAlign: 'center',
      color: '#fff',
      fontWeight: '500',
      minHeight: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>5KI Financial Services Dashboard</h1>
      </div>

      <div style={styles.metricsGrid}>
        <div style={{...styles.metricCard, ...styles.fundsCard, ...styles.primaryCard}}>
          <div style={{...styles.metricContent, marginBottom: '4px'}}>
            <h3 style={{...styles.metricTitle, color: 'rgba(255,255,255,0.9)'}}>Available Funds</h3>
            <div style={{...styles.metricValue, ...styles.fundsMetricValue}}>₱{formatCurrency(fundsData.availableFunds)}</div>
            <div style={{...styles.metricDescription, ...styles.fundsMetricDescription}}>Capital available for new loans</div>
          </div>
          <div style={styles.healthIndicator}>
            Financial Health: {healthStatus}
          </div>
        </div>

        <div style={{...styles.metricCard, ...styles.primaryCard}}>
          <div style={styles.metricContent}>
            <h3 style={styles.metricTitle}>Total Yields</h3>
            <div style={styles.metricValue}>₱{formatCurrency(fundsData.availableFunds + fundsData.fiveKISavings)}</div>
            <div style={styles.metricDescription}>Funds plus savings</div>
          </div>
          <div style={{...styles.healthIndicator, backgroundColor: '#10B981', opacity: 0}}>
            Placeholder
          </div>
        </div>
      </div>

      <div style={styles.secondaryMetricsGrid}>
        <div style={{...styles.metricCard, ...styles.secondaryCard}}>
          <div style={styles.metricContent}>
            <h3 style={styles.metricTitle}>Total Members</h3>
            <div style={styles.metricValue}>{fundsData.totalMembers}</div>
            <div style={styles.metricDescription}>Registered members</div>
          </div>
        </div>

        <div style={{...styles.metricCard, ...styles.secondaryCard}}>
          <div style={styles.metricContent}>
            <h3 style={styles.metricTitle}>Total Loans</h3>
            <div style={styles.metricValue}>₱{formatCurrency(fundsData.totalLoans)}</div>
            <div style={styles.metricDescription}>Active loan principal</div>
          </div>
        </div>

        <div style={{...styles.metricCard, ...styles.secondaryCard}}>
          <div style={styles.metricContent}>
            <h3 style={styles.metricTitle}>Total Receivables</h3>
            <div style={styles.metricValue}>₱{formatCurrency(fundsData.totalReceivables)}</div>
            <div style={styles.metricDescription}>Outstanding balances</div>
          </div>
        </div>

        <div style={{...styles.metricCard, ...styles.secondaryCard}}>
          <div style={styles.metricContent}>
            <h3 style={styles.metricTitle}>5KI Savings</h3>
            <div style={styles.metricValue}>₱{formatCurrency(fundsData.fiveKISavings)}</div>
            <div style={styles.metricDescription}>Organization savings</div>
          </div>
        </div>
      </div>

      <div style={styles.chartsSection}>
        <div style={styles.chartSelector}>
          <button 
            style={{
              ...styles.chartButton,
              ...(selectedChart === 'loans' && styles.selectedChartButton)
            }}
            onClick={() => setSelectedChart('loans')}
          >
            Loans Breakdown
          </button>
          <button 
            style={{
              ...styles.chartButton,
              ...(selectedChart === 'earnings' && styles.selectedChartButton)
            }}
            onClick={() => setSelectedChart('earnings')}
          >
            Funds & Savings
          </button>
          <button 
            style={{
              ...styles.chartButton,
              ...(selectedChart === 'dividends' && styles.selectedChartButton)
            }}
            onClick={() => setSelectedChart('dividends')}
          >
            Dividends
          </button>
        </div>

        <div style={styles.chartContainer}>
          {selectedChart === 'loans' && (
            <>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Loans Portfolio</h3>
              </div>
              <div style={styles.chartWrapper}>
                <Pie 
                  data={loansPieData} 
                  options={loansChartOptions}
                />
              </div>
            </>
          )}

          {selectedChart === 'earnings' && (
            <>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Funds & Savings Growth ({selectedYear})</h3>
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
              <div style={styles.chartWrapper}>
                <Line 
                  data={fundsLineData} 
                  options={fundsChartOptions}
                />
              </div>
            </>
          )}

          {selectedChart === 'dividends' && (
            <>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Dividends Distribution ({selectedYear})</h3>
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
              <div style={styles.dividendsTableContainer}>
                {(() => {
                  // Calculate total loan amount across all members for patronage share calculation
                  const totalAllMembersLoanAmount = dividendsData.reduce((sum, member) => sum + (member.totalLoanAmount || 0), 0);
                  window.totalAllMembersLoanAmount = totalAllMembersLoanAmount; // Store for use in table rows
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
                      <th style={styles.dividendsHeaderCell}>Total Loans</th>
                      <th style={styles.dividendsHeaderCell}>Loan Count</th>
                      <th style={styles.dividendsHeaderCell}>Amount</th>
                      <th style={styles.dividendsHeaderCell}>Investment Share</th>
                      <th style={styles.dividendsHeaderCell}>Patronage Share</th>
                      <th style={styles.dividendsHeaderCell}>Active Month</th>
                      <th style={styles.dividendsHeaderCell}>Active Month %</th>
                      <th style={styles.dividendsHeaderCell}>Total %</th>
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
                                  transition: 'all 0.2s ease',
                                  border: hasTransactions ? '2px solid transparent' : 'none',
                                  position: 'relative'
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
                                {hasTransactions && member.monthlyTransactions[monthIndex].length > 1 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    fontSize: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                    color: '#333',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold'
                                  }}>
                                    {member.monthlyTransactions[monthIndex].length}
                                  </span>
                                )}
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
                            {fundsData.availableFunds > 0 
                              ? ((member.investment / fundsData.availableFunds) * 100).toFixed(2) + '%' 
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
                            12
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#7C3AED'}}>
                            {dividendsData.length > 0 
                              ? (12 / (dividendsData.length * 12) * 100).toFixed(2) + '%' 
                              : '0.00%'}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#DC2626'}}>
                            {(() => {
                              // Get percentages as decimal values (divide by 100)
                              const investmentShareDecimal = fundsData.availableFunds > 0 
                                ? ((member.investment / fundsData.availableFunds)) 
                                : 0;
                              const patronageShareDecimal = totalAllMembersLoanAmount > 0 
                                ? (((member.totalLoanAmount || 0) / totalAllMembersLoanAmount)) 
                                : 0;
                              const activeMonthShareDecimal = dividendsData.length > 0 
                                ? (12 / (dividendsData.length * 12)) 
                                : 0;
                              
                              // Settings percentages are already converted to decimal in fetchDashboardData
                              const totalPercentage = 
                                (investmentShareDecimal * (fundsData.investmentSharePercentage || 0)) +
                                (patronageShareDecimal * (fundsData.patronageSharePercentage || 0)) +
                                (activeMonthShareDecimal * (fundsData.activeMonthsPercentage || 0));
                              
                              return (totalPercentage * 100).toFixed(2) + '%';
                            })()}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.loansSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Active Loans Portfolio</h2>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by Member ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
        
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
                    <td style={styles.tableCell}>
                      <span style={loan.isOverdue ? styles.overdueDate : null}>
                        {loan.dueDate}
                      </span>
                      {loan.isOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                    </td>
                    <td style={styles.tableCell}>
                      <button 
                        onClick={() => handleResendClick(loan)}
                        style={styles.resendButton}
                      >
                        Resend Reminder
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={styles.noResults}>No loans found matching your search criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

{showResendConfirmation && (
  <div style={styles.centeredModal}>
    <div style={styles.modalCardSmall}>
      <button 
        style={styles.closeButton} 
        onClick={() => setShowResendConfirmation(false)}
        aria-label="Close modal"
        onFocus={(e) => e.target.style.outline = 'none'}
      >
        <FaTimes />
      </button>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
      <p style={styles.modalText}>Are you sure you want to resend the payment reminder?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{
            ...styles.actionButton,
            backgroundColor: '#2D5783',
            color: '#fff'
          }} 
          onClick={confirmResendReminder}
          disabled={actionInProgress}
        >
          {actionInProgress ? 'Processing...' : 'Yes'}
        </button>
        <button 
          style={{
            ...styles.actionButton,
            backgroundColor: '#f44336',
            color: '#fff'
          }} 
          onClick={() => setShowResendConfirmation(false)}
          disabled={actionInProgress}
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
        onFocus={(e) => e.target.style.outline = 'none'}
      >
        <FaTimes />
      </button>
      <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
      <p style={styles.modalText}>{successMessage}</p>
      <button 
        style={{
          ...styles.actionButton,
          backgroundColor: '#2D5783',
          color: '#fff'
        }} 
        onClick={() => setSuccessMessageModalVisible(false)}
        onFocus={(e) => e.target.style.outline = 'none'}
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
        onFocus={(e) => e.target.style.outline = 'none'}
      >
        <FaTimes />
      </button>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
      <p style={styles.modalText}>{errorMessage}</p>
      <button 
        style={{
          ...styles.actionButton,
          backgroundColor: '#2D5783',
          color: '#fff'
        }} 
        onClick={() => setErrorModalVisible(false)}
        onFocus={(e) => e.target.style.outline = 'none'}
      >
        OK
      </button>
    </div>
  </div>
)}

{actionInProgress && (
  <div style={styles.centeredModal}>
    <div style={styles.spinner}></div>
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
        onFocus={(e) => e.target.style.outline = 'none'}
      >
        <FaTimes />
      </button>
      
      <h3 style={styles.modalTitle}>
        Transaction Breakdown - {selectedMonthTransactions.month} {selectedMonthTransactions.year}
      </h3>
      
      <div style={{marginBottom: '20px', color: '#666', fontSize: '14px'}}>
        <strong>{selectedMonthTransactions.member?.memberName}</strong> (ID: {selectedMonthTransactions.member?.memberId})
      </div>

      <div style={styles.modalContent}>
        <table style={{...styles.dividendsTable, margin: '0'}}>
          <thead>
            <tr style={styles.dividendsHeaderRow}>
              <th style={styles.dividendsHeaderCell}>Date</th>
              <th style={styles.dividendsHeaderCell}>Type</th>
              <th style={styles.dividendsHeaderCell}>Description</th>
              <th style={styles.dividendsHeaderCell}>Amount</th>
              <th style={styles.dividendsHeaderCell}>Status</th>
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
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {transaction.type}
                  </span>
                </td>
                <td style={styles.dividendsDataCell}>
                  {transaction.description || transaction.remarks || 
                   transaction.purpose || transaction.loanPurpose || 'No description'}
                </td>
                <td style={styles.dividendsDataCell}>
                  <div>
                    <span style={{
                      color: transaction.adjustedAmount > 0 ? '#059669' : '#dc2626',
                      fontWeight: 'bold'
                    }}>
                      {transaction.adjustedAmount > 0 ? '+' : '-'}₱{formatCurrency(Math.abs(transaction.adjustedAmount))}
                    </span>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>
                      Original: ₱{formatCurrency(transaction.originalAmount)}
                    </div>
                  </div>
                </td>
                <td style={styles.dividendsDataCell}>
                  <span style={{
                    backgroundColor: transaction.status === 'approved' ? '#d1fae5' : '#fef3c7',
                    color: transaction.status === 'approved' ? '#059669' : '#d97706',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.status || 'Processed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          borderLeft: '4px solid #2D5783'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: '600', color: '#2D5783'}}>
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

      <div style={{marginTop: '20px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px'}}>
        <button 
          style={{
            ...styles.actionButton,
            backgroundColor: '#2D5783',
            color: '#fff',
            minWidth: '100px'
          }} 
          onClick={() => setTransactionBreakdownModal(false)}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Dashboard;