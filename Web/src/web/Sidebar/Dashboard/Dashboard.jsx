import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  FaChartPie, 
  FaChartBar, 
  FaPiggyBank, 
  FaInfoCircle, 
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaCalendarAlt,
  FaPercentage,
  FaDollarSign,
  FaUserTie,
  FaIdCard,
  FaSearchDollar
} from 'react-icons/fa';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [loading, setLoading] = useState(true);
  const [fundsData, setFundsData] = useState({
    availableFunds: 0,
    totalLoans: 0,
    totalReceivables: 0,
    memberSavings: 0,
    fiveKISavings: 0,
    dividends: 0,
    activeBorrowers: 0
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch funds data
      const fundsRef = database.ref('Settings/Funds');
      const fundsSnapshot = await fundsRef.once('value');
      const availableFunds = fundsSnapshot.val() || 0;

      // Fetch loans data
      const loansRef = database.ref('Loans/CurrentLoans');
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
            status: loan.status || 'Active'
          });
        });
      });

      activeBorrowers = borrowerSet.size;

      // Fetch savings data
      const savingsRef = database.ref('Members');
      const savingsSnapshot = await savingsRef.once('value');
      const membersData = savingsSnapshot.val() || {};
      
      let memberSavings = 0;
      let fiveKISavings = 0;
      
      Object.values(membersData).forEach(member => {
        memberSavings += parseFloat(member.savings || 0);
        fiveKISavings += parseFloat(member.fiveKISavings || 0);
      });

      // Fetch earnings data
      const earningsRef = database.ref('Transactions/Earnings');
      const earningsSnapshot = await earningsRef.once('value');
      const earningsData = earningsSnapshot.val() || {};
      
      const monthlyEarnings = Array(12).fill(0);
      Object.values(earningsData).forEach(earning => {
        const date = new Date(earning.date);
        if (date.getFullYear() === parseInt(selectedYear)) {
          const month = date.getMonth();
          monthlyEarnings[month] += parseFloat(earning.amount || 0);
        }
      });

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
        memberSavings,
        fiveKISavings,
        dividends: memberSavings * 0.1,
        activeBorrowers
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
    if (Number.isInteger(num)) {
      return `₱${num.toLocaleString()}.00`;
    }
    return `₱${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const loansPieData = {
    labels: ['Total Loans', 'Total Receivables'],
    datasets: [
      {
        data: [fundsData.totalLoans, fundsData.totalReceivables],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1,
      },
    ],
  };

  const savingsPieData = {
    labels: ['Member Savings', '5KI Savings'],
    datasets: [
      {
        data: [fundsData.memberSavings, fundsData.fiveKISavings],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1,
      },
    ],
  };

  const earningsBarData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Earnings',
        data: earningsData.map(item => item.earnings),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
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
            return `${context.label}: ${formatCurrency(context.raw)}`;
          }
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
        <span className="detail-label"><FaUserTie /> Member ID:</span>
        <span className="detail-value">{loan.memberId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaIdCard /> Transaction ID:</span>
        <span className="detail-value">{loan.transactionId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaDollarSign /> Loan Amount:</span>
        <span className="detail-value">{formatCurrency(loan.loanAmount)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaCalendarAlt /> Term:</span>
        <span className="detail-value">{loan.term} months</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaPercentage /> Interest:</span>
        <span className="detail-value">{loan.interest}%</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaMoneyBillWave /> Monthly Payment:</span>
        <span className="detail-value">{formatCurrency(loan.monthlyPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaHandHoldingUsd /> Total Payment:</span>
        <span className="detail-value">{formatCurrency(loan.totalTermPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaCalendarAlt /> Due Date:</span>
        <span className="detail-value">{loan.dueDate}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label"><FaInfoCircle /> Status:</span>
        <span className="detail-value">
          <span className={`status-badge ${loan.status.toLowerCase()}`}>
            {loan.status}
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Business Loan Services Dashboard</h1>
        <p>Comprehensive overview of your lending operations</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        {/* Available Funds Card */}
        <div className="metric-card funds-card">
          <div className="metric-icon">
            <FaMoneyBillWave />
          </div>
          <div className="metric-content">
            <h3>Available Funds</h3>
            <div className="metric-value">{formatCurrency(fundsData.availableFunds)}</div>
            <div className="metric-description">Capital available for new loans</div>
          </div>
          <div className="health-indicator" style={{ backgroundColor: healthColor }}>
            <span>Financial Health: {healthStatus}</span>
          </div>
        </div>

        {/* Total Loans Card */}
        <div className="metric-card">
          <div className="metric-icon">
            <FaHandHoldingUsd />
          </div>
          <div className="metric-content">
            <h3>Total Loans</h3>
            <div className="metric-value">{formatCurrency(fundsData.totalLoans)}</div>
            <div className="metric-description">Active loan principal</div>
          </div>
        </div>

        {/* Receivables Card */}
        <div className="metric-card">
          <div className="metric-icon">
            <FaSearchDollar />
          </div>
          <div className="metric-content">
            <h3>Total Receivables</h3>
            <div className="metric-value">{formatCurrency(fundsData.totalReceivables)}</div>
            <div className="metric-description">Including principal and interest</div>
          </div>
        </div>

        {/* Active Borrowers Card */}
        <div className="metric-card">
          <div className="metric-icon">
            <FaUserTie />
          </div>
          <div className="metric-content">
            <h3>Active Borrowers</h3>
            <div className="metric-value">{fundsData.activeBorrowers}</div>
            <div className="metric-description">Current loan recipients</div>
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
            <FaChartPie className="chart-icon" />
            Loans Breakdown
          </button>
          <button 
            className={`chart-button ${selectedChart === 'savings' ? 'selected' : ''}`}
            onClick={() => setSelectedChart('savings')}
          >
            <FaPiggyBank className="chart-icon" />
            Savings
          </button>
          <button 
            className={`chart-button ${selectedChart === 'earnings' ? 'selected' : ''}`}
            onClick={() => setSelectedChart('earnings')}
          >
            <FaChartBar className="chart-icon" />
            Earnings
          </button>
        </div>

        <div className="chart-container">
          {selectedChart === 'loans' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Loans Portfolio</h3>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
                    <span>Active Loans: {formatCurrency(fundsData.totalLoans)}</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
                    <span>Receivables: {formatCurrency(fundsData.totalReceivables)}</span>
                  </div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Pie data={loansPieData} options={chartOptions} />
              </div>
            </div>
          )}

          {selectedChart === 'savings' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Savings Distribution</h3>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
                    <span>Member Savings: {formatCurrency(fundsData.memberSavings)}</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
                    <span>5KI Savings: {formatCurrency(fundsData.fiveKISavings)}</span>
                  </div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Pie data={savingsPieData} options={chartOptions} />
              </div>
            </div>
          )}

          {selectedChart === 'earnings' && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Monthly Earnings ({selectedYear})</h3>
                <div className="year-selector">
                  {['2024', '2023', '2022'].map((year) => (
                    <button
                      key={year}
                      className={`year-button ${selectedYear === year ? 'selected' : ''}`}
                      onClick={() => setSelectedYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-wrapper">
                <Bar 
                  data={earningsBarData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }} 
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
            <FaSearchDollar className="search-icon" />
          </div>
        </div>
        
        <div className="table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th><FaUserTie /> Member ID</th>
                <th><FaIdCard /> Transaction ID</th>
                <th><FaDollarSign /> Amount</th>
                <th><FaCalendarAlt /> Term</th>
                <th><FaPercentage /> Interest</th>
                <th><FaMoneyBillWave /> Monthly</th>
                <th><FaHandHoldingUsd /> Total</th>
                <th><FaCalendarAlt /> Due Date</th>
                <th><FaInfoCircle /> Status</th>
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
                    <td>{loan.memberId}</td>
                    <td>{loan.transactionId}</td>
                    <td>{formatCurrency(loan.loanAmount)}</td>
                    <td>{loan.term} mo</td>
                    <td>{loan.interest}%</td>
                    <td>{formatCurrency(loan.monthlyPayment)}</td>
                    <td>{formatCurrency(loan.totalTermPayment)}</td>
                    <td>{loan.dueDate}</td>
                    <td>
                      <span className={`status-badge ${loan.status.toLowerCase()}`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-results">
                  <td colSpan="9">No loans found matching your search criteria</td>
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
          --primary: #3B82F6;
          --primary-dark: #2563EB;
          --secondary: #10B981;
          --danger: #EF4444;
          --warning: #F59E0B;
          --gray: #6B7280;
          --light-gray: #F3F4F6;
          --dark-gray: #1F2937;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          color: var(--dark-gray);
          background-color: #f9fafb;
        }

        .dashboard-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--dark-gray);
          margin-bottom: 0.5rem;
        }

        .dashboard-header p {
          color: var(--gray);
          font-size: 1rem;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .funds-card {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          grid-column: 1 / -1;
        }

        .funds-card .metric-value {
          font-size: 2.5rem;
        }

        .metric-icon {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--primary);
        }

        .funds-card .metric-icon {
          color: white;
          opacity: 0.8;
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
          color: white;
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
          color: white;
        }

        /* Charts Section */
        .charts-section {
          margin-bottom: 2rem;
        }

        .chart-selector {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .chart-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-weight: 600;
          color: var(--gray);
          cursor: pointer;
          transition: all 0.2s;
        }

        .chart-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .chart-button.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .chart-icon {
          font-size: 1rem;
        }

        .chart-container {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
          font-size: 1.25rem;
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

        .year-selector {
          display: flex;
          gap: 0.5rem;
        }

        .year-button {
          padding: 0.375rem 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-button:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .year-button.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        /* Loans Section */
        .loans-section {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--dark-gray);
        }

        .search-box {
          position: relative;
          min-width: 300px;
        }

        .search-box input {
          width: 100%;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray);
          font-size: 0.875rem;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .loans-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .loans-table th {
          background-color: #f9fafb;
          color: var(--gray);
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .loans-table th svg {
          margin-right: 0.5rem;
          color: var(--primary);
        }

        .loans-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .loans-table tr:last-child td {
          border-bottom: none;
        }

        .loans-table tr:hover {
          background-color: #f9fafb;
          cursor: pointer;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active {
          background-color: #D1FAE5;
          color: #065F46;
        }

        .status-badge.pending {
          background-color: #FEF3C7;
          color: #92400E;
        }

        .status-badge.overdue {
          background-color: #FEE2E2;
          color: #991B1B;
        }

        .status-badge.completed {
          background-color: #E0E7FF;
          color: #3730A3;
        }

        .no-results {
          text-align: center;
          color: var(--gray);
        }

        .no-results td {
          padding: 2rem;
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
          background: white;
          border-radius: 0.5rem;
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
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          margin: 0;
          color: var(--dark-gray);
          font-size: 1.25rem;
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
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--gray);
          font-size: 0.875rem;
        }

        .detail-label svg {
          color: var(--primary);
        }

        .detail-value {
          color: var(--dark-gray);
          font-weight: 500;
          text-align: right;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          gap: 1rem;
        }

        .spinner {
          border: 4px solid rgba(59, 130, 246, 0.1);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        .loading-container p {
          color: var(--gray);
          font-size: 0.875rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
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
        }
      `}</style>
    </div>
  );
};

export default Dashboard;