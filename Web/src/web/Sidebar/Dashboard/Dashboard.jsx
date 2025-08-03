import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

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
    savingsHistory: []
  });
  const [loanData, setLoanData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [selectedChart, setSelectedChart] = useState('loans');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const parseCustomDate = (dateString) => {
    if (!dateString) return null;
    
    // Try parsing as "Month Day, Year" format first
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    // If that fails, try other formats or return current date
    return new Date();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch funds data
      const fundsRef = database.ref('Settings/Funds');
      const fundsSnapshot = await fundsRef.once('value');
      const availableFunds = fundsSnapshot.val() || 0;

      // Fetch 5KI Savings data and history
      const fiveKIRef = database.ref('Settings/Savings');
      const fiveKISnapshot = await fiveKIRef.once('value');
      const fiveKISavings = fiveKISnapshot.val() || 0;

      // Fetch savings history
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      const savingsHistorySnapshot = await savingsHistoryRef.once('value');
      const savingsHistoryData = savingsHistorySnapshot.val() || {};
      const savingsHistory = Object.entries(savingsHistoryData).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount) || 0
      }));

      // Fetch loans data
      const loansRef = database.ref('Loans/ApprovedLoans');
      const loansSnapshot = await loansRef.once('value');
      const loansData = loansSnapshot.val() || {};
      
      let totalLoans = 0;
      let totalReceivables = 0;
      let activeBorrowers = 0;
      const loanItems = [];
      const borrowerSet = new Set();
      
      Object.entries(loansData).forEach(([memberId, loans]) => {
        Object.entries(loans).forEach(([transactionId, loan]) => {
          const loanAmount = parseFloat(loan.loanAmount) || 0;
          const term = loan.term || 'N/A';
          const interest = parseFloat(loan.interest) || 0;
          const monthlyPayment = parseFloat(loan.monthlyPayment) || 0;
          const totalMonthlyPayment = parseFloat(loan.totalMonthlyPayment) || 0;
          const totalTermPayment = parseFloat(loan.totalTermPayment) || 0;
          const dueDate = loan.dueDate || 'N/A';
          const dueDateObj = dueDate !== 'N/A' ? new Date(dueDate) : null;
          const isOverdue = dueDateObj && new Date() > dueDateObj;
          
          totalLoans += loanAmount;
          totalReceivables += totalTermPayment;
          borrowerSet.add(memberId);
          
          loanItems.push({
            memberId,
            transactionId,
            loanAmount,
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

      // Fetch payments data for earnings
      const paymentsRef = database.ref('Payments/ApprovedPayments');
      const paymentsSnapshot = await paymentsRef.once('value');
      const paymentsData = paymentsSnapshot.val() || {};
      
      const monthlyEarnings = Array(12).fill(0);
      
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

  // Generate years from current year back to 2020
  const generateYears = () => {
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
      years.push(year.toString());
    }
    return years;
  };

  // Chart data configurations
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
          stepSize: 500, // Default step size
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

  const renderLoanDetails = (loan) => (
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">Loan Details</h3>
        <button className="close-button" onClick={() => setModalVisible(false)}>
          &times;
        </button>
      </div>
      <div className="detail-row">
        <span className="detail-label">Member ID:</span>
        <span className="detail-value">{loan.memberId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Transaction ID:</span>
        <span className="detail-value">{loan.transactionId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Loan Amount:</span>
        <span className="detail-value">₱{formatCurrency(loan.loanAmount)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Term:</span>
        <span className="detail-value">{loan.term} months</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Interest:</span>
        <span className="detail-value">{loan.interest}%</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Monthly Payment:</span>
        <span className="detail-value">₱{formatCurrency(loan.monthlyPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Total Monthly Payment:</span>
        <span className="detail-value">₱{formatCurrency(loan.totalMonthlyPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Total Payment:</span>
        <span className="detail-value">₱{formatCurrency(loan.totalTermPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Due Date:</span>
        <span className={`detail-value ${loan.isOverdue ? 'overdue' : ''}`}>
          {loan.dueDate}
          {loan.isOverdue && <span className="overdue-badge">Overdue</span>}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Status:</span>
        <span className="detail-value">
          <span className={`status-badge ${loan.isOverdue ? 'overdue' : 'active'}`}>
            {loan.isOverdue ? 'Overdue' : 'Active'}
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>5KI Financial Services Dashboard</h1>
        <div className="header-controls">
        </div>
      </div>

      {/* Key Metrics */}
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
            <h3>Total Loans</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.totalLoans)}</div>
            <div className="metric-description">Active loan principal</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <h3>Total Receivables</h3>
            <div className="metric-value">₱{formatCurrency(fundsData.totalReceivables)}</div>
            <div className="metric-description">Including principal and interest</div>
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

      {/* Charts Section */}
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

      {/* Loans Table Section */}
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
                <th className="text-center">Term</th>
                <th className="text-center">Interest</th>
                <th className="text-center">Monthly</th>
                <th className="text-center">Total Monthly</th>
                <th className="text-center">Total</th>
                <th className="text-center">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan, index) => (
                  <tr 
                    key={index}
                    onClick={() => {
                      setSelectedLoan(loan);
                      setModalVisible(true);
                    }}
                  >
                    <td className="text-center">{loan.memberId}</td>
                    <td className="text-center">{loan.transactionId}</td>
                    <td className="text-center">₱{formatCurrency(loan.loanAmount)}</td>
                    <td className="text-center">{loan.term}</td>
                    <td className="text-center">{loan.interest}</td>
                    <td className="text-center">₱{formatCurrency(loan.monthlyPayment)}</td>
                    <td className="text-center">₱{formatCurrency(loan.totalMonthlyPayment)}</td>
                    <td className="text-center">₱{formatCurrency(loan.totalTermPayment)}</td>
                    <td className={`text-center ${loan.isOverdue ? 'overdue' : ''}`}>
                      {loan.dueDate}
                      {loan.isOverdue && <span className="overdue-badge">Overdue</span>}
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

      {/* Loan Details Modal */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            {selectedLoan && renderLoanDetails(selectedLoan)}
          </div>
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

        /* Metrics Grid */
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

        /* Charts Section */
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

        .chart-legend {
          display: flex;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .chart-wrapper {
          height: 300px;
          position: relative;
        }

        /* Loans Section */
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

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active {
          background-color: #E0E7FF;
          color: #4338CA;
        }

        .status-badge.overdue {
          background-color: #FEE2E2;
          color: #991B1B;
        }

        .no-results {
          text-align: center;
          color: var(--gray);
        }

        .no-results td {
          padding: 2rem;
        }

        /* Text Alignment Helpers */
        .text-center {
          text-align: center;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .modal {
          background: var(--white);
          border-radius: 0.75rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          border-bottom: 1px solid #E5E7EB;
        }

        .modal-title {
          margin: 0;
          color: var(--dark-gray);
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--gray);
          transition: color 0.2s;
        }

        .close-button:hover {
          color: var(--danger);
        }

        .modal-content {
          padding: 1.25rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #F3F4F6;
        }

        .detail-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .detail-label {
          font-weight: 600;
          color: var(--gray);
          font-size: 0.875rem;
        }

        .detail-value {
          color: var(--dark-gray);
          font-weight: 500;
          text-align: right;
        }

        /* Responsive */
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