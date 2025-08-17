import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { SendLoanReminder } from '../../../../../Server/api';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';

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
  const [selectedChart, setSelectedChart] = useState('loans');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const checkDueDates = async () => {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
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

      for (const [memberId, loans] of Object.entries(loansData)) {
        for (const [transactionId, currentLoan] of Object.entries(loans)) {
          const dueDate = new Date(currentLoan.dueDate);
          
          if (dueDate <= oneWeekFromNow && dueDate > now) {
            const notificationKey = `${memberId}_${transactionId}`;
            
            if (!notificationsData[notificationKey]) {
              const member = membersData[memberId];
              const approvedLoan = approvedLoansData[memberId]?.[transactionId];
              
              if (member && member.email) {
                try {
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

                  await notificationsRef.child(notificationKey).set({
                    sentAt: new Date().toISOString(),
                    dueDate: currentLoan.dueDate
                  });
                } catch (error) {
                  console.error(`Failed to send reminder for ${memberId}/${transactionId}:`, error);
                }
              }
            }
          }
        }
      }
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

        // Update the notification record
        const notificationKey = `${selectedLoan.memberId}_${selectedLoan.transactionId}`;
        const updates = {
          resentAt: new Date().toISOString()
        };
        
        // Check if database.ServerValue exists or use alternative increment method
        if (database.ServerValue && database.ServerValue.increment) {
          updates.resendCount = database.ServerValue.increment(1);
        } else {
          // Fallback method if ServerValue.increment isn't available
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
    // Run check immediately when component mounts
    checkDueDates();
    
    // Then set up daily check (runs every 24 hours)
    const dailyCheckInterval = setInterval(checkDueDates, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(dailyCheckInterval);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const parseCustomDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    return new Date();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [
        fundsSnapshot,
        fiveKISnapshot,
        savingsHistorySnapshot,
        membersSnapshot,
        currentLoansSnapshot,
        approvedLoansSnapshot,
        paymentsSnapshot
      ] = await Promise.all([
        database.ref('Settings/Funds').once('value'),
        database.ref('Settings/Savings').once('value'),
        database.ref('Settings/SavingsHistory').once('value'),
        database.ref('Members').once('value'),
        database.ref('Loans/CurrentLoans').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Payments/ApprovedPayments').once('value')
      ]);

      // Process data
      const availableFunds = fundsSnapshot.val() || 0;
      const fiveKISavings = fiveKISnapshot.val() || 0;
      const savingsHistory = Object.entries(savingsHistorySnapshot.val() || {}).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));
      const membersData = membersSnapshot.val() || {};
      const totalMembers = Object.keys(membersData).length;
      const currentLoansData = currentLoansSnapshot.val() || {};
      const approvedLoansData = approvedLoansSnapshot.val() || {};
      const paymentsData = paymentsSnapshot.val() || {};
      
      let totalLoans = 0;
      let totalReceivables = 0;
      let activeBorrowers = 0;
      const loanItems = [];
      const borrowerSet = new Set();
      const monthlyEarnings = Array(12).fill(0);

      // Process current loans
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

      // Process payments for earnings
      Object.values(paymentsData).forEach(payment => {
        if (payment.dateApproved) {
          const date = parseCustomDate(payment.dateApproved);
          if (date && date.getFullYear() === parseInt(selectedYear)) {
            const month = date.getMonth();
            monthlyEarnings[month] += parseFloat(payment.interestPaid || 0);
          }
        }
      });

      // Format earnings data
      const formattedEarnings = [
        { month: 'Jan', earnings: monthlyEarnings[0] },
        { month: 'Feb', earnings: monthlyEarnings[1] },
        { month: 'Mar', earnings: monthlyEarnings[2] },
        { month: 'Apr', earnings: monthlyEarnings[3] },
        { month: 'May', earnings: monthlyEarnings[4] },
        { month: 'Jun', earnings: monthlyEarnings[5] },
        { month: 'Jul', earnings: monthlyEarnings[6] },
        { month: 'Aug', earnings: monthlyEarnings[7] },
        { month: 'Sep', earnings: monthlyEarnings[8] },
        { month: 'Oct', earnings: monthlyEarnings[9] },
        { month: 'Nov', earnings: monthlyEarnings[10] },
        { month: 'Dec', earnings: monthlyEarnings[11] },
      ];

      setFundsData({
        availableFunds,
        totalLoans,
        totalReceivables,
        fiveKISavings,
        activeBorrowers,
        totalMembers,
        savingsHistory
      });
      
      setLoanData(loanItems);
      setEarningsData(formattedEarnings);
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
    const formattedNum = num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formattedNum}`;
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

  const earningsBarData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Interest Earnings',
        data: earningsData.map(item => item.earnings),
        backgroundColor: '#2D5783',
        borderColor: '#2D5783',
        borderWidth: 1,
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
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
        type: 'line',
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y',
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

  const earningsChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          stepSize: 50,
          suggestedMax: 200
        }
      }
    }
  };

  const filteredLoans = loanData.filter(loan => 
    loan.memberId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loan.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal styles matching your Registrations component
  const modalStyles = {
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
      outline: 'none',
      '&:focus': {
        outline: 'none',
        boxShadow: 'none'
      }
    },
    spinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#2D5783',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      animation: 'spin 1s linear infinite'
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>5KI Financial Services Dashboard</h1>
        <div className="header-controls">
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card funds-card">
          <div className="metric-content">
            <h3>Available Funds</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.availableFunds)}</div>
            <div className="metric-description">Capital available for new loans</div>
          </div>
          <div className="health-indicator" style={{ backgroundColor: healthColor }}>
            <span>Financial Health: {healthStatus}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>Total Members</h3>
            <div className="metric-value">{fundsData.totalMembers}</div>
            <div className="metric-description">Registered members</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>Total Loans</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.totalLoans)}</div>
            <div className="metric-description">Active loan principal</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>Total Receivables</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.totalReceivables)}</div>
            <div className="metric-description">Outstanding balances</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>5KI Savings</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.fiveKISavings)}</div>
            <div className="metric-description">Organization savings</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-selector">
          <button 
            className={`chart-button ${selectedChart === 'loans' ? 'selected' : ''}`}
            onClick={() => setSelectedChart('loans')}
          >
            Loans Breakdown
          </button>
          <button 
            className={`chart-button ${selectedChart === 'earnings' ? 'selected' : ''}`}
            onClick={() => setSelectedChart('earnings')}
          >
            Earnings
          </button>
        </div>

        <div className="chart-container">
          {selectedChart === 'loans' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Loans Portfolio</h3>
              </div>
              <div className="chart-wrapper">
                <Pie 
                  data={loansPieData} 
                  options={loansChartOptions}
                />
              </div>
            </div>
          )}

          {selectedChart === 'earnings' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Monthly Earnings ({selectedYear})</h3>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="year-select"
                >
                  {generateYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="chart-wrapper">
                <Bar 
                  data={earningsBarData} 
                  options={earningsChartOptions}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="loans-section">
        <div className="section-header">
          <h2>Active Loans Portfolio</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Member ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th className="text-center">Member ID</th>
                <th className="text-center">Transaction ID</th>
                <th className="text-center">Amount</th>
                <th className="text-center">Outstanding</th>
                <th className="text-center">Term</th>
                <th className="text-center">Interest</th>
                <th className="text-center">Monthly</th>
                <th className="text-center">Total Monthly</th>
                <th className="text-center">Due Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan, index) => (
                  <tr key={`${loan.memberId}-${loan.transactionId}`}>
                    <td className="text-center">{loan.memberId}</td>
                    <td className="text-center">{loan.transactionId}</td>
                    <td className="text-center">₱{formatCurrency(loan.loanAmount)}</td>
                    <td className="text-center">₱{formatCurrency(loan.outstandingBalance)}</td>
                    <td className="text-center">{loan.term}</td>
                    <td className="text-center">{loan.interest}</td>
                    <td className="text-center">₱{formatCurrency(loan.monthlyPayment)}</td>
                    <td className="text-center">₱{formatCurrency(loan.totalMonthlyPayment)}</td>
                    <td className="text-center">
                      <span className={loan.isOverdue ? 'overdue-date' : ''}>
                        {loan.dueDate}
                      </span>
                      {loan.isOverdue && <span className="overdue-badge">Overdue</span>}
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => handleResendClick(loan)}
                        className="resend-button"
                      >
                        Resend Reminder
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-results">
                  <td colSpan="10" className="text-center">No loans found matching your search criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resend Confirmation Modal */}
      {showResendConfirmation && (
        <div style={modalStyles.centeredModal}>
          <div style={modalStyles.modalCardSmall}>
            <FaExclamationCircle style={{ ...modalStyles.confirmIcon, color: '#2D5783' }} />
            <p style={modalStyles.modalText}>Are you sure you want to resend the payment reminder?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...modalStyles.actionButton,
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
                  ...modalStyles.actionButton,
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

      {/* Success Modal */}
      {successMessageModalVisible && (
        <div style={modalStyles.centeredModal}>
          <div style={modalStyles.modalCardSmall}>
            <FaCheckCircle style={{ ...modalStyles.confirmIcon, color: '#4CAF50' }} />
            <p style={modalStyles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...modalStyles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={() => setSuccessMessageModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalVisible && (
        <div style={modalStyles.centeredModal}>
          <div style={modalStyles.modalCardSmall}>
            <FaExclamationCircle style={{ ...modalStyles.confirmIcon, color: '#f44336' }} />
            <p style={modalStyles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...modalStyles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={() => setErrorModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {actionInProgress && (
        <div style={modalStyles.centeredModal}>
          <div style={modalStyles.spinner}></div>
        </div>
      )}

      <style jsx>{`
        :root {
          --primary: #2D5783;
          --primary-light: #3B82F6;
          --secondary: #10B981;
          --danger: #EF4444;
          --warning: #F59E0B;
          --gray: #6B7280;
          --light-gray: #F3F4F6;
          --dark-gray: #1F2937;
          --white: #FFFFFF;
          --bg-color: #F9FAFB;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dashboard-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          color: var(--dark-gray);
          background-color: var(--bg-color);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #E5E7EB;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--dark-gray);
          margin-bottom: 0.5rem;
        }

        .header-controls {
          display: flex;
          gap: 1rem;
        }

        .year-select {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #E5E7EB;
          background-color: var(--white);
          font-size: 0.875rem;
          color: var(--dark-gray);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: var(--white);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
          border: 1px solid #E5E7EB;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .funds-card {
          background: linear-gradient(135deg, var(--primary) 0%, #1E3A8A 100%);
          color: var(--white);
          grid-column: 1 / -1;
        }

        .funds-card .metric-value {
          font-size: 2.25rem;
        }

        .metric-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--gray);
        }

        .funds-card .metric-content h3 {
          color: rgba(255, 255, 255, 0.9);
        }

        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--dark-gray);
        }

        .funds-card .metric-value {
          color: var(--white);
        }

        .metric-description {
          font-size: 0.875rem;
          color: var(--gray);
        }

        .funds-card .metric-description {
          color: rgba(255, 255, 255, 0.8);
        }

        .health-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          color: var(--white);
        }

        .charts-section {
          margin-bottom: 2rem;
        }

        .chart-selector {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .chart-button {
          padding: 0.75rem 1.25rem;
          background: var(--white);
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          font-weight: 600;
          color: var(--gray);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .chart-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .chart-button.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
        }

        .chart-container {
          background: var(--white);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #E5E7EB;
        }

        .chart-card {
          height: 100%;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .chart-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--dark-gray);
        }

        .chart-wrapper {
          height: 300px;
          position: relative;
        }

        .loans-section {
          background: var(--white);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #E5E7EB;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--dark-gray);
        }

        .search-box {
          position: relative;
          min-width: 300px;
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
          background-color: var(--white);
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(45, 87, 131, 0.1);
        }

        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #E5E7EB;
        }

        .loans-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .loans-table th {
          background-color: #F9FAFB;
          color: var(--gray);
          padding: 0.75rem 1rem;
          text-align: center;
          font-weight: 600;
          border-bottom: 1px solid #E5E7EB;
          white-space: nowrap;
        }

        .loans-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #E5E7EB;
          white-space: nowrap;
          text-align: center;
        }

        .loans-table tr:last-child td {
          border-bottom: none;
        }

        .loans-table tr:hover {
          background-color: #F9FAFB;
          cursor: pointer;
        }

        .overdue {
          color: var(--danger);
          font-weight: 600;
        }

        .overdue-date {
          color: var(--danger);
          font-weight: 600;
        }

        .overdue-badge {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          background-color: #FEE2E2;
          color: var(--danger);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .resend-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          transition: background-color 0.2s;
        }

        .resend-button:hover {
          background-color: #1E3A8A;
        }

        .no-results {
          text-align: center;
          color: var(--gray);
        }

        .no-results td {
          padding: 2rem;
        }

        .text-center {
          text-align: center;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .chart-selector {
            flex-direction: column;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .search-box {
            width: 100%;
          }

          .loans-table th, .loans-table td {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .loans-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;