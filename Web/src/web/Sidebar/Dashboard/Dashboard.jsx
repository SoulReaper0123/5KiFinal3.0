import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner, FaChartLine, FaMoneyBillWave, FaUsers, FaCreditCard, FaExchangeAlt, FaShieldAlt, FaSearch, FaCalendarAlt, FaFilter, FaPiggyBank, FaBusinessTime, FaPercentage, FaFileContract, FaInfoCircle, FaPhone, FaCalendarPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { SendDividendEmail } from '../../../../../Server/api';

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
  const [advancedYear, setAdvancedYear] = useState((currentYear + 1).toString());
  const [isAdvancedView, setIsAdvancedView] = useState(false);
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
  const [transactionBreakdownModal, setTransactionBreakdownModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [selectedMonthTransactions, setSelectedMonthTransactions] = useState({
    member: null,
    month: null,
    year: null,
    transactions: []
  });
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [dividendsLoading, setDividendsLoading] = useState(false);
  const [showDividendsModal, setShowDividendsModal] = useState(false);
  const [distributionMembers, setDistributionMembers] = useState([]); 
  const [distributionConfirmVisible, setDistributionConfirmVisible] = useState(false);
  const [distributionProcessing, setDistributionProcessing] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dividendsDistributionHistory, setDividendsDistributionHistory] = useState({});
  const [memberInvestmentData, setMemberInvestmentData] = useState({}); 
  const [isHovered, setIsHovered] = useState({});

  const toggleAdvancedView = () => {
    setIsAdvancedView(prev => !prev);
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  useEffect(() => {
    setCurrentPage(0);
    
    const hasMatches = dividendsData.some(member => {
      const query = searchQuery.toLowerCase();
      const memberName = member.memberName.toLowerCase();
      const memberId = member.memberId.toLowerCase();
      return memberName.includes(query) || memberId.includes(query);
    });
    
    setNoMatch(searchQuery !== '' && !hasMatches);
  }, [searchQuery, dividendsData]);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedYear, advancedYear, isAdvancedView]);

  useEffect(() => {
    setCurrentPage(0);
  }, [dividendsData.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, isAdvancedView]);

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const [historySnapshot, membersSnapshot] = await Promise.all([
          database.ref('DividendsDistributionHistory').once('value'),
          database.ref('Members').once('value')
        ]);
        
        setDividendsDistributionHistory(historySnapshot.val() || {});
        
        const membersData = membersSnapshot.val() || {};
        const investmentData = {};
        
        Object.entries(membersData).forEach(([memberId, member]) => {
          investmentData[memberId] = {
            investment: parseFloat(member.investment) || 0,
            registrationDate: member.registrationDate,
            activeMonths: calculateAdvancedActiveMonths(member.registrationDate, advancedYear)
          };
        });
        
        setMemberInvestmentData(investmentData);
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };
    loadHistoricalData();
  }, [advancedYear]);

  const parseCustomDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  };

  const parseTransactionDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        return new Date(dateInput.seconds * 1000);
      }
      
      if (typeof dateInput === 'string') {
        let parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
        
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
        
        const dateParts = dateInput.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1;
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month, day);
          }
        }
      }
      
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput;
      }
      
      return null;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return null;
    }
  };

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

  const calculateAdvancedActiveMonths = (registrationDate, targetYear) => {
    if (!registrationDate) return 12;
    
    const regDate = new Date(registrationDate);
    const targetYearNum = parseInt(targetYear);
    const regYear = regDate.getFullYear();
    
    if (regYear < targetYearNum) {
      return 12;
    } else if (regYear > targetYearNum) {
      return 0;
    } else {
      const regMonthIdx = regDate.getMonth();
      return Math.max(0, 12 - regMonthIdx);
    }
  };

  const calculateActiveMonths = (registrationDate, targetYear, isAdvancedView, dividendsHistory = {}) => {
    if (!registrationDate) return 12;
    
    const regDate = new Date(registrationDate);
    const targetYearNum = parseInt(targetYear);
    const currentYearNum = new Date().getFullYear();
    
    if (isAdvancedView) {
      return calculateAdvancedActiveMonths(registrationDate, targetYear);
    }
    
    const regYear = regDate.getFullYear();
    const regMonthIdx = regDate.getMonth();
    
    const currentYearDividendsDistributed = dividendsHistory[targetYearNum] === true;
    
    if (currentYearDividendsDistributed) {
      const distributionMonth = 11;
      return Math.max(0, 12 - distributionMonth);
    }
    
    if (regYear < targetYearNum) {
      return 12;
    } else if (regYear > targetYearNum) {
      return 0;
    } else {
      return Math.max(0, 12 - regMonthIdx);
    }
  };

  const fetchDashboardData = async (options = {}) => {
    const { lightweight = false } = options;
    try {
      if (!lightweight) setLoading(true);
      
      const targetYear = isAdvancedView ? advancedYear : selectedYear;
      console.log('🔍 Fetching data for year:', targetYear, 'Advanced view:', isAdvancedView);

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
        settingsSnapshot,
        dividendsHistorySnapshot,
        dividendsTransactionsSnapshot
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
        database.ref('Settings').once('value'),
        database.ref('DividendsDistributionHistory').once('value'),
        database.ref('Transactions/Dividends').once('value')
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
      const dividendsHistoryData = dividendsHistorySnapshot.val() || {};
      const dividendsTransactionsData = dividendsTransactionsSnapshot.val() || {};
      
      console.log('👥 Total members found:', Object.keys(membersData).length);
      
      Object.entries(membersData).forEach(([memberId, member]) => {
        console.log(`Member ${memberId}:`, {
          name: `${member.firstName} ${member.lastName}`,
          role: member.role,
          status: member.status,
          registrationDate: member.registrationDate,
          dateApproved: member.dateApproved
        });
      });

      setDividendsDistributionHistory(dividendsHistoryData);
      
      const investmentSharePercentage = parseFloat(settingsData.InvestmentSharePercentage || 0) / 100;
      const patronageSharePercentage = parseFloat(settingsData.PatronageSharePercentage || 0) / 100;
      const activeMonthsPercentage = parseFloat(settingsData.ActiveMonthsPercentage || 0) / 100;
      const membersDividendPercentage = parseFloat(settingsData.MembersDividendPercentage || 0) / 100;
      const fiveKiEarningsPercentage = parseFloat(settingsData.FiveKiEarningsPercentage || 0) / 100;
      window.__dividendSettingsDate = settingsData.DividendDate || '';
      
      let totalLoans = 0;
      let totalReceivables = 0;
      let activeBorrowers = 0;
      const loanItems = [];
      const borrowerSet = new Set();
      const monthlyFunds = Array(12).fill(0);

      Object.entries(currentLoansData).forEach(([memberId, loans]) => {
        Object.entries(loans).forEach(([transactionId, loan]) => {
          const outstandingBalance = parseFloat(loan.remainingBalance) || 0;
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

      fundsHistory.forEach(item => {
        const date = new Date(item.date);
        if (date.getFullYear() === parseInt(targetYear)) {
          const month = date.getMonth();
          monthlyFunds[month] = Math.max(monthlyFunds[month], item.amount);
        }
      });

      if (monthlyFunds.every(amount => amount === 0) && parseInt(targetYear) === new Date().getFullYear()) {
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

      window.__dividendSettings = {
        investmentSharePercentage,
        patronageSharePercentage,
        activeMonthsPercentage,
        membersDividendPercentage,
        fiveKiEarningsPercentage,
        availableFunds,
        fiveKISavings
      };

      window.__visibleDashboard = {
        timestamp: new Date().toISOString(),
        availableFunds,
        totalYields,
        totalLoans,
        totalReceivables,
        fiveKISavings,
        activeBorrowers,
        totalMembers,
      };
      
      setLoanData(loanItems);
      setEarningsData(formattedFunds);
      
      const dividendsItems = [];
      
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

      await Promise.all(transactionPromises);
      
      const memberProcessingPromises = Object.entries(membersData).map(async ([memberId, member]) => {
        const status = (member?.status || '').toLowerCase();
        if (status === 'inactive') {
          console.log(`🚫 Skipping inactive member: ${memberId}`);
          return null;
        }

        const role = (member?.role || '').toLowerCase();
        const isAdmin = role === 'admin' || role === 'coadmin';
        
        let totalInvestment = 0;

        if (isAdvancedView) {
          const advancedData = memberInvestmentData[memberId];
          totalInvestment = advancedData ? (parseFloat(advancedData.investment) || 0) : (parseFloat(member.investment) || 0);
          
          if (dividendsTransactionsData[memberId]) {
            Object.values(dividendsTransactionsData[memberId]).forEach(dividend => {
              if (dividend.status === 'distributed') {
                totalInvestment += parseFloat(dividend.amount) || 0;
              }
            });
          }
        } else {
            try {
              const regsSnapForInvestment = await database.ref(`Transactions/Registrations/${memberId}`).once('value');
              if (regsSnapForInvestment.exists()) {
                Object.values(regsSnapForInvestment.val()).forEach(reg => {
                  const d = parseTransactionDate(reg.dateApproved || reg.date);
                  if (d && d.getFullYear() === parseInt(targetYear)) {
                    const amt = parseFloat(reg.amount) || 0;
                    totalInvestment += amt;
                  }
                });
              }
            } catch (e) {
              console.error(`Error computing registration part of investment for member ${memberId}:`, e);
            }
            
            try {
              const depsSnapForInvestment = await database.ref(`Transactions/Deposits/${memberId}`).once('value');
              if (depsSnapForInvestment.exists()) {
                Object.values(depsSnapForInvestment.val()).forEach(dep => {
                  const d = parseTransactionDate(dep.dateApproved || dep.dateAdded || dep.date);
                  if (d && d.getFullYear() === parseInt(targetYear)) {
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

            try {
              const withdrawalsSnap = await database.ref(`Transactions/Withdrawals/${memberId}`).once('value');
              if (withdrawalsSnap.exists()) {
                Object.values(withdrawalsSnap.val()).forEach(withdrawal => {
                  const d = parseTransactionDate(withdrawal.dateApproved || withdrawal.date);
                  if (d && d.getFullYear() === parseInt(targetYear)) {
                    const status = (withdrawal.status || '').toLowerCase();
                    if (status === 'approved' || status === 'distributed') {
                      const amt = parseFloat(withdrawal.amountWithdrawn || withdrawal.amount) || 0;
                      totalInvestment -= amt;
                    }
                  }
                });
              }
            } catch (e) {
              console.error(`Error computing withdrawal part of investment for member ${memberId}:`, e);
            }
          }

        if (isAdmin && totalInvestment <= 0) {
          console.log(`🚫 Skipping admin/coadmin with zero investment: ${memberId}`, {
            investment: totalInvestment,
            role: role
          });
          return null;
        }

        console.log(`✅ Processing member for dividends: ${memberId}`, {
          name: `${member.firstName} ${member.lastName}`,
          role: role,
          status: status,
          investment: totalInvestment,
          isAdmin: isAdmin,
          meetsCriteria: !isAdmin || (isAdmin && totalInvestment > 0)
        });

        const memberTransactions = allTransactions[memberId] || [];
        const monthlyDividends = Array(12).fill(0);
        const monthlyTransactions = Array(12).fill(null).map(() => []);
            
            if (!isAdvancedView) {
              console.log(`📅 Processing transactions for year: ${targetYear} for member ${memberId}`);
              
              memberTransactions.forEach(transaction => {
                if (transaction.type === 'Withdrawals') {
                  return;
                }
                
                const transactionDate = parseTransactionDate(transaction.dateApproved || transaction.dateAdded || transaction.date);
                
                if (transactionDate) {
                  const transactionYear = transactionDate.getFullYear();
                  const month = transactionDate.getMonth();
                  
                  console.log(`Transaction for ${memberId}:`, {
                    type: transaction.type,
                    date: transactionDate,
                    year: transactionYear,
                    targetYear: parseInt(targetYear),
                    matches: transactionYear === parseInt(targetYear)
                  });

                  if (transactionYear === parseInt(targetYear)) {
                    const status = (transaction.status || '').toLowerCase();
                    if (status !== 'approved' && status !== 'completed') {
                      console.log(`Skipping transaction with status: ${status}`);
                      return;
                    }
                    
                    if (transaction.type === 'Deposits') {
                      return;
                    }
                    
                    let amount = 0;
                    switch (transaction.type) {
                      case 'Registrations':
                        return;
                      case 'Loans':
                        amount = parseFloat(transaction.loanAmount) || 0;
                        break;
                      case 'Payments':
                        amount = parseFloat(transaction.principalPaid) || 0;
                        break;
                      default:
                        amount = parseFloat(transaction.amount) || 0;
                    }
                    
                    let adjustedAmount = amount;
                    if (transaction.type === 'Loans') {
                      adjustedAmount = -amount;
                    } else {
                      adjustedAmount = amount;
                    }
                    
                    console.log(`Adding transaction: ${transaction.type} ${adjustedAmount} for month ${month}`);
                    
                    monthlyDividends[month] += adjustedAmount;
                    
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
                } else {
                  console.log('Could not parse transaction date:', transaction.dateApproved || transaction.dateAdded || transaction.date);
                }
              });
            }
            
            const totalDividends = monthlyDividends.reduce((sum, dividend) => sum + dividend, 0);
            
            let approvedLoansCount = 0;
            let totalLoanAmount = 0;

            if (!isAdvancedView) {
              try {
                const memberLoansSnapshot = await database.ref(`Transactions/Loans/${memberId}`).once('value');
                if (memberLoansSnapshot.exists()) {
                  const memberLoans = memberLoansSnapshot.val();
                  Object.values(memberLoans).forEach(loan => {
                    if (loan.dateApproved && loan.status === 'approved') {
                      const approvedDate = parseTransactionDate(loan.dateApproved);
                      if (approvedDate && approvedDate.getFullYear() === parseInt(targetYear)) {
                        approvedLoansCount++;
                        const loanAmount = parseFloat(loan.loanAmount) || 0;
                        totalLoanAmount += loanAmount;
                      }
                    }
                  });
                }
              } catch (error) {
                console.error(`Error fetching approved loans count for member ${memberId}:`, error);
              }
            }

            let registrationDate = null;

            if (member.dateApproved) {
              registrationDate = parseTransactionDate(member.dateApproved);
            }

            if (!registrationDate && member.dateAdded) {
              registrationDate = parseTransactionDate(member.dateAdded);
            }

            if (!registrationDate && member.registrationDate) {
              registrationDate = new Date(member.registrationDate);
            }

            if (!registrationDate) {
              console.warn(`No registration date found for member ${memberId}, using current date`);
              registrationDate = new Date();
            }
                      
            const activeMonthsCount = calculateActiveMonths(registrationDate, targetYear, isAdvancedView, dividendsHistoryData);
            
            const memberResult = {
              memberId,
              memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
              investment: totalInvestment,
              monthlyDividends,
              monthlyTransactions,
              totalDividends,
              approvedLoansCount,
              totalLoanAmount,
              activeMonthsCount,
              registrationDate,
              hasTransactions: totalDividends !== 0 || totalInvestment > 0,
              role: role
            };
            
            console.log(`📊 Member result for ${memberId}:`, {
              investment: memberResult.investment,
              totalDividends: memberResult.totalDividends,
              hasTransactions: memberResult.hasTransactions,
              activeMonths: memberResult.activeMonthsCount
            });
            
            return memberResult;
          });
      
      const processedMembers = await Promise.all(memberProcessingPromises);
      
      const validMembers = processedMembers.filter(member => member !== null);
      console.log(`🎯 Final members for dividends table:`, validMembers.length);
      console.log('📋 Members details:', validMembers);
      
      setDividendsData(validMembers);
      if (!lightweight) setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      if (!lightweight) setLoading(false);
    }
  };

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

    const membersDividendDecimal = fundsData.membersDividendPercentage || 0;
    const totalShare = totalYields * totalPercentageDecimal * membersDividendDecimal;
    return totalShare;
  };

  const viewDividendTransactions = async (memberId) => {
    try {
      const transactionsSnap = await database.ref(`Transactions/Dividends/${memberId}`).once('value');
      const transactions = transactionsSnap.val() || {};
      
      const transactionsArray = Object.entries(transactions).map(([key, value]) => ({
        id: key,
        ...value
      })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      alert(`${transactionsArray.length} dividend transactions found for this member`);
    } catch (error) {
      console.error('Error fetching dividend transactions:', error);
    }
  };

  const openDividendsModal = async () => {
    try {
      setDistributionProcessing(true);
      const membersSnap = await database.ref('Members').once('value');
      const membersRaw = membersSnap.val() || {};

      const rows = dividendsData.map(m => {
        const memberRecord = membersRaw[m.memberId] || {};
        const savings = parseFloat(memberRecord.balance) || 0;
        const currentInvestment = parseFloat(memberRecord.investment) || 0;
        const email = memberRecord.email || '';
        const dividend = computeMemberDividendShare(m);
        return {
          memberId: m.memberId,
          name: m.memberName,
          investment: currentInvestment,
          savings,
          dividend,
          email: email, 
          _calcContext: {
            ...m,
            email: email 
          }
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

  const confirmDistributeDividends = () => {
    setDistributionConfirmVisible(true);
  };  

  const processDividendsDistribution = async (distributionData) => {
    try {
      const updates = {};
      const now = new Date();
      const distributedDate = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const distributedTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const year = now.getFullYear();

      const currentYields = parseFloat(fundsData.totalYields) || 0;
      const currentFunds = parseFloat(fundsData.availableFunds) || 0;
      
      const fiveKiEarningsPercentage = fundsData.fiveKiEarningsPercentage || 0;
      const totalFiveKiEarnings = currentYields * fiveKiEarningsPercentage;
      
      const membersDividendPercentage = fundsData.membersDividendPercentage || 0;
      const totalMembersDividend = currentYields * membersDividendPercentage;

      const newFundsAmount = currentFunds + totalMembersDividend;
      
      const newYieldsAmount = 0;
      
      const currentFiveKiSavings = parseFloat(fundsData.fiveKISavings) || 0;
      const newFiveKiSavings = currentFiveKiSavings + totalFiveKiEarnings;

      updates['Settings/Funds'] = parseFloat(newFundsAmount.toFixed(2));
      updates['Settings/Yields'] = parseFloat(newYieldsAmount.toFixed(2));
      updates['Settings/Savings'] = parseFloat(newFiveKiSavings.toFixed(2));
      
      const fundsHistoryPath = `Settings/FundsHistory/${now.toISOString().split('T')[0]}`;
      updates[fundsHistoryPath] = parseFloat(newFundsAmount.toFixed(2));
      
      const yieldsHistoryPath = `Settings/YieldsHistory/${now.toISOString().split('T')[0]}`;
      updates[yieldsHistoryPath] = parseFloat(newYieldsAmount.toFixed(2));
      
      const savingsHistoryPath = `Settings/SavingsHistory/${now.toISOString().split('T')[0]}`;
      updates[savingsHistoryPath] = parseFloat(newFiveKiSavings.toFixed(2));

      distributionData.forEach(row => {
        const dividendAmount = parseFloat(row.dividend) || 0;
        
        if (dividendAmount > 0) {
          const newBalPath = `Members/${row.memberId}/balance`;
          const currentBalance = parseFloat(row.savings) || 0;
          const newBalance = currentBalance + dividendAmount;
          updates[newBalPath] = parseFloat(newBalance.toFixed(2));

          const newInvPath = `Members/${row.memberId}/investment`;
          const currentInvestment = parseFloat(row.investment) || 0;
          const newInvestment = currentInvestment + dividendAmount;
          updates[newInvPath] = parseFloat(newInvestment.toFixed(2));

          const txnId = `DIV-${Date.now()}-${row.memberId}`;
          const txnPath = `Transactions/Dividends/${row.memberId}/${txnId}`;
          
          updates[`${txnPath}/transactionId`] = txnId;
          updates[`${txnPath}/memberId`] = row.memberId;
          updates[`${txnPath}/type`] = 'DividendDistribution';
          updates[`${txnPath}/amount`] = parseFloat(dividendAmount.toFixed(2));
          updates[`${txnPath}/dateApproved`] = distributedDate;
          updates[`${txnPath}/approvedTime`] = distributedTime;
          updates[`${txnPath}/year`] = year;
          updates[`${txnPath}/status`] = 'distributed';
          updates[`${txnPath}/timestamp`] = now.getTime();
          updates[`${txnPath}/firstName`] = row.name.split(' ')[0];
          updates[`${txnPath}/lastName`] = row.name.split(' ').slice(1).join(' ');
          updates[`${txnPath}/email`] = row._calcContext?.email || '';
          updates[`${txnPath}/addedToInvestment`] = true;
          updates[`${txnPath}/addedToBalance`] = true;
          
          row._emailData = {
            email: row._calcContext?.email || '',
            firstName: row.name.split(' ')[0],
            lastName: row.name.split(' ').slice(1).join(' '),
            dividendAmount: dividendAmount,
            totalInvestment: newInvestment,
            newBalance: newBalance,
            newInvestment: newInvestment,
            distributedDate: distributedDate,
            memberId: row.memberId,
            transactionId: txnId
          };
        }
      });

      updates[`DividendsDistributionHistory/${year}`] = true;

      await database.ref().update(updates);

      return {
        success: true,
        distributionData: distributionData,
        totalDividendsDistributed: totalMembersDividend,
        totalFiveKiEarnings,
        newYieldsAmount,
        newFiveKiSavings,
        newFundsAmount
      };
    } catch (e) {
      console.error('Database distribution error:', e);
      throw new Error('Failed to distribute dividends in database: ' + (e.message || 'Unknown error'));
    }
  };

  const sendDividendEmails = async (distributionData) => {
    console.log('📧 Sending dividend emails to', distributionData.length, 'members');
    
    for (let i = 0; i < distributionData.length; i++) {
      const row = distributionData[i];
      
      if (row._emailData && row._emailData.dividendAmount > 0) {
        try {
          console.log(`📧 Sending email ${i + 1}/${distributionData.length} to ${row.memberId}`);
          
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await SendDividendEmail(row._emailData);
          
          console.log(`✅ Email sent to ${row.memberId}`);
          
        } catch (error) {
          console.error(`❌ Failed to send email to ${row.memberId}:`, error);
        }
      }
    }
    
    console.log('🎉 All dividend emails completed');
  };

  const performDistributeDividends = async () => {
    setDistributionConfirmVisible(false);
    
    const totalDividends = distributionMembers.reduce((sum, row) => sum + (parseFloat(row.dividend) || 0), 0);
    setSuccessMessage(`Dividends distribution ready! 
      ₱${formatCurrency(totalDividends)} will be distributed to ${distributionMembers.length} members. 
      Click OK to complete the process.`);
    setSuccessModalVisible(true);
  };

  const calculateAndAddCurrentYearDividends = () => {
    const updatedMemberData = { ...memberInvestmentData };
    
    dividendsData.forEach(member => {
      if (member.hasTransactions) {
        const currentYearDividend = computeMemberDividendShare(member);
        const currentInvestment = parseFloat(member.investment) || 0;
        
        updatedMemberData[member.memberId] = {
          ...updatedMemberData[member.memberId],
          investment: currentInvestment + currentYearDividend,
          currentYearDividend: currentYearDividend
        };
      }
    });
    
    setMemberInvestmentData(updatedMemberData);
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

  const handleSuccessOk = async () => {
    setSuccessModalVisible(false);
    setIsProcessing(true);

    let distributionResult = null;

    try {
      distributionResult = await processDividendsDistribution(distributionMembers);
      
      await sendDividendEmails(distributionResult.distributionData);
      
      if (distributionResult) {
        setFundsData(prev => ({
          ...prev,
          totalYields: distributionResult.newYieldsAmount,
          fiveKISavings: distributionResult.newFiveKiSavings
        }));

        setDividendsDistributionHistory(prev => ({
          ...prev,
          [new Date().getFullYear()]: true
        }));
      }

      setShowDividendsModal(false);
      setDistributionConfirmVisible(false);

    } catch (error) {
      console.error('Error in dividend distribution:', error);
      setErrorMessage('Failed to distribute dividends: ' + error.message);
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
      
      fetchDashboardData({ lightweight: true });
    }
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
        year: isAdvancedView ? advancedYear : selectedYear,
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

  // Filter and paginate members
  const filteredMembers = dividendsData.filter(member => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const memberName = member.memberName.toLowerCase();
    const memberId = member.memberId.toLowerCase();
    
    return memberName.includes(query) || memberId.includes(query);
  });

  const paginatedMembers = filteredMembers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

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
            return date.getFullYear() === parseInt(isAdvancedView ? advancedYear : selectedYear) && date.getMonth() === index;
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

  const yieldsLineData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Yields',
        data: earningsData.map((_, index) => {
          const monthYields = (fundsData.yieldsHistory || []).filter(item => {
            const date = new Date(item.date);
            return date.getFullYear() === parseInt(isAdvancedView ? advancedYear : selectedYear) && date.getMonth() === index;
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

  // Styles
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
    primaryMetricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
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
    advancedButton: {
      padding: '10px 20px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: isAdvancedView ? '#1e40af' : 'white',
      color: isAdvancedView ? 'white' : '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginLeft: '12px'
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
    searchContainer: {
      position: 'relative',
      width: '300px'
    },
    searchInput: {
      width: '100%',
      padding: '10px 16px 10px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      fontSize: '16px'
    },
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
    dashboardLoadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '90vh',
      flexDirection: 'column',
      backgroundColor: 'transparent',
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
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '20px'
    },
    distributionSummary: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    viewBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: '#FEF3C7',
      color: '#B45309',
      marginLeft: '8px'
    },
    noActivityBadge: {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '500',
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      marginLeft: '8px'
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
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    },
    modalCardSmall: {
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      textAlign: 'center',
      border: '1px solid #F1F5F9'
    },
    confirmIcon: {
      marginBottom: '14px',
      fontSize: '28px'
    },
    modalText: {
      fontSize: '14px',
      marginBottom: '18px',
      textAlign: 'center',
      color: '#475569',
      lineHeight: '1.5',
      fontWeight: '500'
    },
    primaryButton: {
      background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
      color: 'white',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
      }
    },
    secondaryButton: {
      background: '#6b7280',
      color: 'white',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
      }
    },
    approveButton: {
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: 'white',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
      }
    },
    disabledButton: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: '0.7',
      '&:hover': {
        transform: 'none',
        boxShadow: 'none'
      }
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1500,
      backdropFilter: 'blur(4px)',
    },
    loadingContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
    },
    loadingTextOverlay: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '500'
    },
    noDataContainer: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },
    noDataIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      color: '#d1d5db'
    },
    noDataText: {
      fontSize: '16px',
      margin: 0
    }
  };

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
          <div style={styles.dashboardLoadingContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>Loading dashboard data...</div>
            </div>
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
              {isAdvancedView && <span style={styles.viewBadge}>Advanced View ({advancedYear})</span>}
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={styles.yearSelect}
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button 
              onClick={toggleAdvancedView}
              style={styles.advancedButton}
              onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
              onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
            >
              <FaCalendarPlus />
              {isAdvancedView ? 'Current View' : 'Advanced View'}
            </button>
          </div>
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

        {/* Financial Growth Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Financial Growth Overview ({isAdvancedView ? advancedYear : selectedYear})</h2>
          </div>
          
          <div style={styles.chartsGrid}>
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
            <h2 style={styles.sectionTitle}>Dividends Distribution ({isAdvancedView ? advancedYear : selectedYear})</h2>
            {!isAdvancedView && (
              <button 
                onClick={openDividendsModal} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => addHoverEffect(e.currentTarget)}
                onMouseLeave={(e) => removeHoverEffect(e.currentTarget)}
              >
                <FaExchangeAlt />
                Distribute Dividends
              </button>
            )}
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
              return isDue && !isAdvancedView ? (
                <span style={{ 
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
                        backgroundColor: ['#2563EB', '#EA580C', '#059669'],
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
              {isAdvancedView && (
                <span style={styles.viewBadge}>Projection View - Carrying Over Member Data</span>
              )}
            </div>

            {/* Simplified Search and Pagination Controls - Matching Deposits Style */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Search Container */}
              <div style={{
                position: 'relative',
                width: '300px'
              }}>
                <FaSearch style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px'
                }} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' } : {})
                  }}
                  placeholder="Search by member name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => handleMouseEnter('search')}
                  onBlur={() => handleMouseLeave('search')}
                />
              </div>

              {/* Pagination Controls */}
              {!noMatch && filteredMembers.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#64748b',
                    whiteSpace: 'nowrap'
                  }}>
                    {Math.min(currentPage * pageSize + 1, filteredMembers.length)} - {Math.min((currentPage + 1) * pageSize, filteredMembers.length)} of {filteredMembers.length}
                  </span>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: currentPage === 0 ? '#f3f4f6' : '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: currentPage === 0 ? '#9ca3af' : '#374151',
                        transition: 'all 0.2s ease',
                        minWidth: '40px',
                        height: '40px'
                      }}
                      onMouseEnter={() => handleMouseEnter('prevButton')}
                      onMouseLeave={() => handleMouseLeave('prevButton')}
                    >
                      <FaChevronLeft />
                    </button>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMembers.length / pageSize) - 1))}
                      disabled={currentPage >= Math.ceil(filteredMembers.length / pageSize) - 1}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: currentPage >= Math.ceil(filteredMembers.length / pageSize) - 1 ? '#f3f4f6' : '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: currentPage >= Math.ceil(filteredMembers.length / pageSize) - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: currentPage >= Math.ceil(filteredMembers.length / pageSize) - 1 ? '#9ca3af' : '#374151',
                        transition: 'all 0.2s ease',
                        minWidth: '40px',
                        height: '40px'
                      }}
                      onMouseEnter={() => handleMouseEnter('nextButton')}
                      onMouseLeave={() => handleMouseLeave('nextButton')}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {noMatch ? (
              <div style={styles.noDataContainer}>
                <FaSearch style={styles.noDataIcon} />
                <p style={styles.noDataText}>No members found matching "{searchQuery}"</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={styles.noDataContainer}>
                <FaUsers style={styles.noDataIcon} />
                <p style={styles.noDataText}>No members data available</p>
              </div>
            ) : (
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
                    {paginatedMembers.map((member, index) => ( 
                      <tr key={member.memberId} style={styles.dividendsDataRow}>
                        <td style={styles.dividendsDataCell}>
                          <div style={styles.memberInfo}>
                            <span style={styles.memberName}>
                              {member.memberName}
                              {!member.hasTransactions && isAdvancedView && (
                                <span style={styles.noActivityBadge}>Projected</span>
                              )}
                            </span>
                            <span style={styles.memberId}>ID: {member.memberId}</span>
                            {member.registrationDate && (
                              <span style={{fontSize: '11px', color: '#9CA3AF', marginTop: '2px'}}>
                                Reg: {new Date(member.registrationDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          ₱{formatCurrency(member.investment)}
                          {isAdvancedView && (
                            <div style={{fontSize: '11px', color: '#6B7280', marginTop: '2px'}}>
                              Carried Over
                            </div>
                          )}
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
                            color: member.totalDividends > 0 ? '#059669' : member.totalDividends < 0 ? '#EF4444' : '#666'
                          }}>
                            {member.totalDividends > 0 ? '+' : member.totalDividends < 0 ? '-' : ''}₱{formatCurrency(Math.abs(member.totalDividends))}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#2563EB'}}>
                            {member.approvedLoansCount || 0}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#059669'}}>
                            ₱{formatCurrency(member.totalLoanAmount || 0)}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#2563EB'}}>
                            {window.totalAllMembersInvestment > 0 
                              ? ((member.investment / window.totalAllMembersInvestment) * 100).toFixed(2) + '%' 
                              : '0.00%'}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#EA580C'}}>
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
                              const totalActiveMonths = window.totalActiveMonths || 1;
                              const activeMonthShareDecimal = (member.activeMonthsCount ?? 0) / totalActiveMonths;
                              return (activeMonthShareDecimal * 100).toFixed(2) + '%';
                            })()}
                          </strong>
                        </td>
                        <td style={styles.dividendsDataCell}>
                          <strong style={{color: '#92400E'}}>
                            {(() => {
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
                              const totalYields = fundsData.totalYields || 0;

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
                              const membersDividendDecimal = fundsData.membersDividendPercentage || 0;
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
            )}
          </div>
        </div>

        {/* Modals */}
        {showDividendsModal && (
          <div style={styles.centeredModal}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              width: '90%',
              maxWidth: '600px',
              border: '1px solid #e2e8f0',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative' 
            }}>
              <button 
                style={{
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
                }} 
                onClick={() => setShowDividendsModal(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              <h3 style={{...styles.sectionTitle, marginBottom: '20px', textAlign: 'center'}}>Distribute Dividends</h3>
              
              <div style={{marginBottom: '16px', textAlign: 'center', color: '#6B7280', fontSize: '14px'}}>
                Total to distribute: <strong style={{color: '#1E3A8A'}}>₱{formatCurrency(distributionMembers.reduce((sum, member) => sum + (member.dividend || 0), 0))}</strong>
              </div>

              <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{backgroundColor: '#f8fafc', position: 'sticky', top: 0}}>
                    <tr>
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e2e8f0',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Member</th>
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e2e8f0',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Current Investment</th>
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e2e8f0',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>New Investment</th>
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e2e8f0',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Dividend Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributionMembers.map(r => {
                      const newInvestment = (parseFloat(r.investment) || 0) + (parseFloat(r.dividend) || 0);
                      return (
                        <tr key={r.memberId} style={styles.dividendsDataRow}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                            <div style={styles.memberInfo}>
                              <span style={styles.memberName}>{r.name}</span>
                              <span style={styles.memberId}>ID: {r.memberId}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                            ₱{formatCurrency(r.investment)}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                            <strong style={{color: '#2563EB'}}>
                              ₱{formatCurrency(newInvestment)}
                            </strong>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                            <strong style={{color: '#059669'}}>₱{formatCurrency(r.dividend)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                <button 
                  style={{
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
                    gap: '8px',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                  }}
                  onClick={() => setShowDividendsModal(false)}
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button 
                  style={{
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
                    gap: '8px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
                    color: 'white',
                    ...(actionInProgress ? styles.disabledButton : {})
                  }}
                  onClick={confirmDistributeDividends}
                  disabled={actionInProgress || distributionMembers.length === 0}
                >
                  {actionInProgress ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Distribute'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {distributionConfirmVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={styles.confirmIcon} />
              <p style={styles.modalText}>Are you sure you want to distribute dividends to all listed members?</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  style={{...styles.actionButton, ...styles.primaryButton}}
                  onClick={performDistributeDividends}
                >
                  Yes, Distribute
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryButton}}
                  onClick={() => setDistributionConfirmVisible(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {successModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
              <p style={styles.modalText}>{successMessage}</p>
              <button
                style={{
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
                  gap: '8px',
                  background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
                  color: 'white',
                  width: '100%'
                }}
                onClick={handleSuccessOk}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingContent}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingTextOverlay}>
                Processing dividends distribution...
              </div>
            </div>
          </div>
        )}

        {errorModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <button 
                style={{
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
                }} 
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
                style={{
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
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
                  color: 'white',
                }}
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

        {transactionBreakdownModal && (
          <div style={styles.centeredModal}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              width: '90%',
              maxWidth: '600px',
              border: '1px solid #e2e8f0',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative' 
            }}>
              <button 
                style={{
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
                }} 
                onClick={() => setTransactionBreakdownModal(false)}
                aria-label="Close modal"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaTimes />
              </button>
              
              <h3 style={{fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '16px'}}>
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
                    {selectedMonthTransactions.transactions
                      .filter(transaction => transaction.type !== 'Withdrawals')
                      .map((transaction, index) => (
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
                      Month Total ({selectedMonthTransactions.transactions.filter(t => t.type !== 'Withdrawals').length} transactions):
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: selectedMonthTransactions.transactions
                        .filter(t => t.type !== 'Withdrawals')
                        .reduce((sum, t) => sum + t.adjustedAmount, 0) > 0 ? '#059669' : '#dc2626'
                    }}>
                      {selectedMonthTransactions.transactions
                        .filter(t => t.type !== 'Withdrawals')
                        .reduce((sum, t) => sum + t.adjustedAmount, 0) > 0 ? '+' : 
                       selectedMonthTransactions.transactions
                        .filter(t => t.type !== 'Withdrawals')
                        .reduce((sum, t) => sum + t.adjustedAmount, 0) < 0 ? '-' : ''}
                      ₱{formatCurrency(Math.abs(selectedMonthTransactions.transactions
                        .filter(t => t.type !== 'Withdrawals')
                        .reduce((sum, t) => sum + t.adjustedAmount, 0)))}
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
