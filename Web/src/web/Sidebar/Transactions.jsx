import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberTransactions, setMemberTransactions] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [transactionType, setTransactionType] = useState('All');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .safe-area-view {
        flex: 1;
        background-color: #F5F5F5;
        height: 100%;
        width: 100%;
        overflow: auto;
      }
      .main-container {
        flex: 1;
      }
      .header-text {
        font-weight: bold;
        font-size: 40px;
        margin-bottom: 10px;
        margin-left: 25px;
        margin-right: 25px;
      }
      .top-controls {
        display: flex;
        justify-content: space-between;
        margin: 0 25px;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-download-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-bar {
        display: flex;
        border: 1px solid #ccc;
        border-radius: 25px;
        background-color: #fff;
        padding: 0 10px;
        align-items: center;
        height: 40px;
        width: 250px;
      }
      .search-input {
        height: 36px;
        width: 100%;
        font-size: 16px;
        padding-left: 8px;
        border: none;
        outline: none;
        background: transparent;
      }
      .search-icon {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
      }
      .download-icon {
        padding: 6px;
        background: none;
        border: none;
        cursor: pointer;
        color: #2D5783;
      }
      .pagination-container {
        display: flex;
        justify-content: flex-end;
        margin: 0 25px;
        margin-top: 10px;
        align-items: center;
      }
      .pagination-info {
        font-size: 12px;
        margin-right: 10px;
        color: #333;
      }
      .pagination-button {
        padding: 0;
        background-color: #2D5783;
        border-radius: 5px;
        margin: 0 3px;
        color: white;
        border: none;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .pagination-button svg {
        font-size: 10px;
        display: block;
        margin: 0 auto;
      }
      .disabled-button {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .data-container {
        flex: 1;
        margin: 0 25px;
        margin-top: 10px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .no-match-text {
        text-align: center;
        margin-top: 20px;
        font-size: 16px;
        color: #666;
      }
      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #001F3F;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .table-container {
        width: 100%;
        overflow-x: auto;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table-header {
        background-color: #2D5783;
        color: #fff;
        height: 50px;
      }
      .table-header-cell {
        padding: 10px;
        text-align: center;
        font-weight: bold;
      }
      .table-row {
        height: 50px;
        cursor: pointer;
      }
      .table-row:nth-child(even) {
        background-color: #f9f9f9;
      }
      .table-row:hover {
        background-color: #f0f0f0;
      }
      .table-cell {
        padding: 10px;
        text-align: center;
        vertical-align: middle;
      }
      .centered-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-card {
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        width: ${windowWidth < 800 ? '90%' : '35%'};
        height: ${windowWidth < 800 ? '90%' : '80%'};
        position: relative;
      }
      .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
      }
      .modal-header {
        margin-bottom: 15px;
        text-align: center;
      }
      .modal-title {
        font-size: 1.25rem;
        font-weight: bold;
        color: #2c3e50;
      }
      .tabs-container {
        display: flex;
        justify-content: space-around;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 5px;
      }
      .tab-button {
        padding: 8px 16px;
        border-radius: 30px;
        border: none;
        background: none;
        cursor: pointer;
      }
      .active-tab {
        background-color: #2D5783;
        color: #fff;
      }
      .scroll-container {
        height: calc(100% - 100px);
        overflow-y: auto;
      }
      .transactions-container {
        padding-bottom: 20px;
      }
      .transaction-item {
        background-color: #fff;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        border: 1px solid #ddd;
      }
      .transaction-type {
        font-weight: bold;
        font-size: 16px;
        color: #2D5783;
        margin-bottom: 5px;
      }
      .transaction-detail {
        font-size: 14px;
        color: #333;
        margin-bottom: 3px;
      }
      .small-modal-card {
        width: 300px;
        height: 200px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .confirm-icon {
        align-self: center;
        margin-bottom: 10px;
        font-size: 30px;
      }
      .modal-text {
        font-size: 14px;
        margin-bottom: 20px;
        text-align: center;
      }
      .cancel-btn {
        background-color: #f44336;
        width: 100px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        margin: 0 10px;
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
      .confirm-btn {
        background-color: #4CAF50;
        width: 100px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        margin: 0 10px;
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [windowWidth]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const [
          depositsSnapshot,
          applyLoansSnapshot,
          payLoansSnapshot,
          withdrawalsSnapshot,
          paymentsSnapshot,
          membersSnapshot,
        ] = await Promise.all([
          database.ref('Transactions/Deposits').once('value'),
          database.ref('Transactions/Loans').once('value'),
          database.ref('Transactions/PayLoans').once('value'),
          database.ref('Transactions/Withdrawals').once('value'),
          database.ref('Transactions/Payments').once('value'),
          database.ref('Members').once('value'),
        ]);

        const allTransactions = {};

        const formatData = (data, type) => {
          Object.keys(data).forEach((memberId) => {
            if (!allTransactions[memberId]) {
              allTransactions[memberId] = [];
            }
            Object.keys(data[memberId]).forEach((transactionId) => {
              allTransactions[memberId].push({
                type,
                transactionId,
                ...data[memberId][transactionId],
                dateApproved: data[memberId][transactionId].dateApproved,
              });
            });
          });
        };

        if (depositsSnapshot.exists()) formatData(depositsSnapshot.val(), 'Deposits');
        if (applyLoansSnapshot.exists()) formatData(applyLoansSnapshot.val(), 'Loans');
        if (payLoansSnapshot.exists()) formatData(payLoansSnapshot.val(), 'PayLoans');
        if (withdrawalsSnapshot.exists()) formatData(withdrawalsSnapshot.val(), 'Withdrawals');
        if (paymentsSnapshot.exists()) formatData(paymentsSnapshot.val(), 'Payments');

        setTransactions(allTransactions);

        if (membersSnapshot.exists()) {
          setMembers(membersSnapshot.val());
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setErrorMessage('Failed to fetch transaction data');
        setErrorModalVisible(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleRowPress = (memberId) => {
    setSelectedMemberId(memberId);
    setMemberTransactions(transactions[memberId] || []);

    if (members[memberId]) {
      const { firstName, middleName, lastName } = members[memberId];
      setMemberName(`${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`);
    } else {
      setMemberName('');
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMemberId(null);
    setMemberTransactions([]);
    setMemberName('');
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
  };

  const handleDownload = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      // Add headers
      worksheet.addRow(['ID', 'Name']);

      // Add data
      filteredMembers.forEach(memberId => {
        const member = members[memberId];
        const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
        worksheet.addRow([memberId, name]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Transactions.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Data exported successfully!');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const filteredMembers = Object.keys(transactions).filter((memberId) => {
    const member = members[memberId];
    if (!member) return false;

    const memberFullName = `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`.toLowerCase();
    return (
      memberId.includes(searchQuery) ||
      memberFullName.includes(searchQuery.toLowerCase())
    );
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedData = filteredMembers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Transactions</h2>

        <div className="top-controls">
          <div className="search-download-container">
            <div className="search-bar">
              <input
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button className="search-icon">
                <FaSearch />
              </button>
            </div>
            <button onClick={handleDownload} className="download-icon">
              <FaDownload />
            </button>
          </div>
        </div>

        {filteredMembers.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">{`Page ${currentPage + 1} of ${totalPages}`}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className={`pagination-button ${currentPage === 0 ? 'disabled-button' : ''}`}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
              className={`pagination-button ${currentPage === totalPages - 1 ? 'disabled-button' : ''}`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="data-container">
          {filteredMembers.length === 0 ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="table-header">
                    <th className="table-header-cell">ID</th>
                    <th className="table-header-cell">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((memberId, index) => {
                    const member = members[memberId];
                    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
                    
                    return (
                      <tr 
                        key={memberId} 
                        className="table-row"
                        onClick={() => handleRowPress(memberId)}
                      >
                        <td className="table-cell">{memberId}</td>
                        <td className="table-cell">{name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalVisible && (
          <div className="centered-modal">
            <div className="modal-card">
              <button onClick={closeModal} className="close-button">
                <FaTimes />
              </button>
              
              <div className="modal-header">
                <h2 className="modal-title">Transactions for {memberName} (ID: {selectedMemberId})</h2>
              </div>
              
              <div className="tabs-container">
                {['All', 'Deposits', 'Loans', 'Withdrawals', 'Payments'].map((type) => (
                  <button
                    key={type}
                    className={`tab-button ${transactionType === type ? 'active-tab' : ''}`}
                    onClick={() => setTransactionType(type)}
                  >
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              <div className="scroll-container">
                <div className="transactions-container">
                  {memberTransactions
                    .filter(tx => transactionType === 'All' || tx.type.includes(transactionType))
                    .map((transaction) => (
                      <div key={transaction.transactionId} className="transaction-item">
                        <div className="transaction-type">{transaction.type}</div>
                        <div className="transaction-detail">
                          Amount: {formatCurrency(
                            transaction.amountToBeDeposited ||
                            transaction.loanAmount ||
                            transaction.amount ||
                            transaction.amountWithdrawn ||
                            transaction.paymentAmount
                          )}
                        </div>
                        <div className="transaction-detail">Transaction ID: {transaction.transactionId}</div>
                        {transaction.dateApproved && (
                          <div className="transaction-detail">Date: {transaction.dateApproved}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaCheckCircle className="confirm-icon" style={{ color: '#4CAF50' }} />
              <p className="modal-text">{successMessage}</p>
              <button 
                className="confirm-btn" 
                onClick={() => setSuccessModalVisible(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FiAlertCircle className="confirm-icon" style={{ color: '#f44336' }} />
              <p className="modal-text">{errorMessage}</p>
              <button 
                className="cancel-btn" 
                onClick={() => setErrorModalVisible(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;