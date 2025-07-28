import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { Pie, Bar } from 'react-chartjs-2'; // Corrected imports
import { FaChartPie, FaChartBar, FaPiggyBank, FaInfoCircle } from 'react-icons/fa';
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
    dividends: 0
  });
  const [loanData, setLoanData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [selectedChart, setSelectedChart] = useState('loans');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

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
      const loanItems = [];
      
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
          
          loanItems.push({
            memberId,
            transactionId,
            loanAmount,
            term,
            interest,
            monthlyPayment,
            totalMonthlyPayment,
            totalTermPayment,
            dueDate
          });
        });
      });

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
        dividends: memberSavings * 0.1
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
    ? '#4CAF50' 
    : healthStatus === 'Good' 
      ? '#FFC107' 
      : '#F44336';

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
        backgroundColor: ['#2D5783', '#4CAF50'],
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
        backgroundColor: ['#2D5783', '#4CAF50'],
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
        backgroundColor: '#2D5783',
        borderColor: '#2D5783',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
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
        <span className="detail-value">{formatCurrency(loan.loanAmount)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Term:</span>
        <span className="detail-value">{loan.term} months</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Monthly Payment:</span>
        <span className="detail-value">{formatCurrency(loan.monthlyPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Total Payment:</span>
        <span className="detail-value">{formatCurrency(loan.totalTermPayment)}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Due Date:</span>
        <span className="detail-value">{loan.dueDate}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Funds Card */}
      <div className="card funds-card">
        <div className="card-header">
          <h2 className="card-title">Available Funds</h2>
        </div>
        <div className="funds-amount">{formatCurrency(fundsData.availableFunds)}</div>
        
        <div className="health-container">
          <span className="health-label">Financial Health:</span>
          <span className="health-tag" style={{ backgroundColor: healthColor }}>
            {healthStatus}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-container">
        <div className="stat-card">
          <FaChartPie className="stat-icon" />
          <div className="stat-value">{formatCurrency(fundsData.totalLoans)}</div>
          <div className="stat-label">Total Loans</div>
        </div>
        <div className="stat-card">
          <FaChartBar className="stat-icon" />
          <div className="stat-value">{formatCurrency(fundsData.totalReceivables)}</div>
          <div className="stat-label">Receivables</div>
        </div>
        <div className="stat-card">
          <FaPiggyBank className="stat-icon" />
          <div className="stat-value">{formatCurrency(fundsData.memberSavings)}</div>
          <div className="stat-label">Savings</div>
        </div>
      </div>

      {/* Active Loans Table */}
      <div className="card">
        <h2 className="section-title">Active Loans</h2>
        <div className="table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Term</th>
                <th>Interest</th>
                <th>Monthly</th>
                <th>Total</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loanData.map((loan, index) => (
                <tr 
                  key={index} 
                  className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                  onClick={() => {
                    setSelectedLoan(loan);
                    setModalVisible(true);
                  }}
                >
                  <td>{loan.memberId}</td>
                  <td>{loan.transactionId}</td>
                  <td>{formatCurrency(loan.loanAmount)}</td>
                  <td>{loan.term}</td>
                  <td>{formatCurrency(loan.interest)}</td>
                  <td>{formatCurrency(loan.monthlyPayment)}</td>
                  <td>{formatCurrency(loan.totalTermPayment)}</td>
                  <td>{loan.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Selector */}
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

      {/* Charts */}
      <div className="card chart-card">
        {selectedChart === 'loans' && (
          <>
            <h2 className="section-title">Loans Breakdown</h2>
            <div className="chart-wrapper">
              <Pie data={loansPieData} options={chartOptions} />
            </div>
            <div className="legend-container">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#2D5783' }}></div>
                <span className="legend-text">
                  Active Loans: {formatCurrency(fundsData.totalLoans)}
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                <span className="legend-text">
                  Receivables: {formatCurrency(fundsData.totalReceivables)}
                </span>
              </div>
            </div>
          </>
        )}

        {selectedChart === 'savings' && (
          <>
            <h2 className="section-title">Savings Distribution</h2>
            <div className="chart-wrapper">
              <Pie data={savingsPieData} options={chartOptions} />
            </div>
            <div className="legend-container">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#2D5783' }}></div>
                <span className="legend-text">
                  Member Savings: {formatCurrency(fundsData.memberSavings)}
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                <span className="legend-text">
                  5KI Savings: {formatCurrency(fundsData.fiveKISavings)}
                </span>
              </div>
            </div>
          </>
        )}

        {selectedChart === 'earnings' && (
          <>
            <h2 className="section-title">Monthly Earnings ({selectedYear})</h2>
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
          </>
        )}
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
        .dashboard-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .spinner {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #2D5783;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .funds-card {
          text-align: center;
          background: linear-gradient(135deg, #2D5783 0%, #1E3A8A 100%);
          color: white;
        }

        .card-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .funds-amount {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 15px 0;
        }

        .health-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .health-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .health-tag {
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 10px;
          color: #2D5783;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2D5783;
          margin: 5px 0;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2D5783;
          margin-bottom: 20px;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 15px;
        }

        .loans-table {
          width: 100%;
          border-collapse: collapse;
        }

        .loans-table th {
          background-color: #2D5783;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }

        .loans-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .loans-table tr:hover {
          background-color: #f5f5f5;
          cursor: pointer;
        }

        .even-row {
          background-color: #f9f9f9;
        }

        .odd-row {
          background-color: white;
        }

        .chart-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .chart-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chart-button.selected {
          background: #2D5783;
          color: white;
        }

        .chart-icon {
          font-size: 1.2rem;
        }

        .chart-card {
          padding: 25px;
        }

        .chart-wrapper {
          height: 300px;
          margin: 20px 0;
        }

        .legend-container {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          margin-top: 20px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 15px;
          height: 15px;
          border-radius: 3px;
        }

        .legend-text {
          font-size: 0.9rem;
        }

        .year-selector {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .year-button {
          padding: 8px 15px;
          background: #f0f0f0;
          border: none;
          border-radius: 5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-button.selected {
          background: #2D5783;
          color: white;
        }

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
        }

        .modal {
          background: white;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-title {
          margin: 0;
          color: #2D5783;
          font-size: 1.3rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-content {
          padding: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f5f5f5;
        }

        .detail-label {
          font-weight: 600;
          color: #555;
        }

        .detail-value {
          color: #2D5783;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .stats-container {
            grid-template-columns: 1fr;
          }

          .chart-selector {
            flex-direction: column;
          }

          .loans-table {
            font-size: 0.8rem;
          }

          .loans-table th, .loans-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;