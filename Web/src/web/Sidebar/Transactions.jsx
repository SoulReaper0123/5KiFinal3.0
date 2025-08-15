import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';

const styles = {
  tableContainer: {
    borderRadius: '8px',
    overflow: 'auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '800px'
  },
  tableHeader: {
    backgroundColor: '#2D5783',
    color: '#fff',
    height: '50px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  tableHeaderCell: {
    whiteSpace: 'nowrap'
  },
  tableRow: {
    height: '50px',
    '&:nth-child(even)': {
      backgroundColor: '#f5f5f5'
    },
    '&:nth-child(odd)': {
      backgroundColor: '#ddd'
    }
  },
  tableCell: {
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #ddd',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  viewText: {
    color: '#2D5783',
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
    '&:hover': {
      color: '#1a3d66'
    },
    outline: 'none',
    '&:focus': {
      outline: 'none'
    }
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
  modalCardSmall: {
    width: '300px',
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
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  }
};

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All');
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
        margin-top: 100px;
      }
      .top-controls {
        display: flex;
        justify-content: flex-end;
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
      .modal-container {
        width: 500px;
        height: 650px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        position: relative;
        overflow-x: hidden;
      }
      @media (max-width: 800px) {
        .modal-container {
            width: 90%;
            max-width: 90%;
            height: auto;
            max-height: 90vh;
        }
      }
      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #2D5783;
        text-align: center;
      }
      .modal-content {
        padding-bottom: 20px;
        height: calc(100% - 100px);
        display: flex;
        flex-direction: column;
      }
      .transaction-type-buttons {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 10px;
      }
      .type-button {
        padding: 8px 16px;
        border-radius: 20px;
        border: none;
        background-color: #f0f0f0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      .active-type {
        background-color: #2D5783;
        color: white;
      }
      .transactions-list {
        flex: 1;
        overflow-y: auto;
      }
      .transaction-item {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .transaction-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .transaction-type {
        font-weight: bold;
        color: #2D5783;
      }
      .transaction-date {
        color: #666;
        font-size: 12px;
      }
      .transaction-detail {
        margin-bottom: 5px;
        font-size: 14px;
      }
      .transaction-amount {
        font-weight: bold;
        color: #333;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    // Set up real-time listeners for all transaction types
    const depositsRef = database.ref('Transactions/Deposits');
    const loansRef = database.ref('Transactions/Loans');
    const withdrawalsRef = database.ref('Transactions/Withdrawals');
    const paymentsRef = database.ref('Transactions/Payments');
    const membersRef = database.ref('Members');

    const processTransactions = (data, type) => {
      if (!data.exists()) return;
      
      const transactionsData = data.val();
      setTransactions(prev => {
        const newTransactions = {...prev};
        
        Object.keys(transactionsData).forEach(memberId => {
          if (!newTransactions[memberId]) {
            newTransactions[memberId] = [];
          }
          
          Object.keys(transactionsData[memberId]).forEach(transactionId => {
            // Check if transaction already exists
            const exists = newTransactions[memberId].some(
              t => t.transactionId === transactionId && t.type === type
            );
            
            if (!exists) {
              newTransactions[memberId].push({
                ...transactionsData[memberId][transactionId],
                type,
                transactionId,
              });
            }
          });
        });
        
        return newTransactions;
      });
    };

    const depositsListener = depositsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Deposits');
      setLoading(false);
    });

    const loansListener = loansRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Loans');
      setLoading(false);
    });

    const withdrawalsListener = withdrawalsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Withdrawals');
      setLoading(false);
    });

    const paymentsListener = paymentsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Payments');
      setLoading(false);
    });

    const membersListener = membersRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        setMembers(snapshot.val());
      }
    });

    return () => {
      // Clean up listeners
      depositsRef.off('value', depositsListener);
      loansRef.off('value', loansListener);
      withdrawalsRef.off('value', withdrawalsListener);
      paymentsRef.off('value', paymentsListener);
      membersRef.off('value', membersListener);
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const handleDownload = async () => {
    try {
      if (filteredMembers.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      const headers = ['Member ID', 'Name', 'Transaction Count'];
      worksheet.addRow(headers);

      filteredMembers.forEach(memberId => {
        const member = members[memberId];
        const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
        const transactionCount = transactions[memberId]?.length || 0;
        worksheet.addRow([memberId, name, transactionCount]);
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
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const filteredMembers = Object.keys(transactions).filter(memberId => {
    const member = members[memberId];
    if (!member) return false;

    const searchLower = searchQuery.toLowerCase();
    const name = `${member.firstName} ${member.middleName || ''} ${member.lastName}`.toLowerCase();
    
    return (
      memberId.toLowerCase().includes(searchLower) ||
      name.includes(searchLower)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedData = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div className="loading-container">
        <div style={styles.spinner}></div>
      </div>
    );
  }

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Member ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '30%' }}>Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Transaction Count</th>
                    <th style={{ ...styles.tableHeaderCell, width: '30%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((memberId) => {
                    const member = members[memberId];
                    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
                    const transactionCount = transactions[memberId]?.length || 0;

                    return (
                      <tr key={memberId} style={styles.tableRow}>
                        <td style={styles.tableCell}>{memberId}</td>
                        <td style={styles.tableCell}>{name}</td>
                        <td style={styles.tableCell}>{transactionCount}</td>
                        <td style={styles.tableCell}>
                          <span 
                            style={styles.viewText} 
                            onClick={() => {
                              setSelectedMember({
                                id: memberId,
                                name,
                                transactions: transactions[memberId] || []
                              });
                              setMemberModalVisible(true);
                            }}
                          >
                            View
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Member Transactions Modal */}
        {memberModalVisible && selectedMember && (
          <div style={styles.centeredModal}>
            <div className="modal-container">
              <button 
                onClick={() => setMemberModalVisible(false)} 
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <h3 className="modal-title">{selectedMember.name}'s Transactions</h3>
              
              <div className="modal-content">
                <div className="transaction-type-buttons">
                  {['All', 'Deposits', 'Loans', 'Payments', 'Withdrawals'].map(type => (
                    <button
                      key={type}
                      className={`type-button ${transactionTypeFilter === type ? 'active-type' : ''}`}
                      onClick={() => setTransactionTypeFilter(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="transactions-list">
                  {selectedMember.transactions
                    .filter(tx => transactionTypeFilter === 'All' || tx.type === transactionTypeFilter)
                    .sort((a, b) => {
                      // Sort by dateApproved or dateApplied in descending order
                      const dateA = a.dateApproved || a.dateApplied || '';
                      const dateB = b.dateApproved || b.dateApplied || '';
                      return dateB.localeCompare(dateA);
                    })
                    .map((transaction, index) => (
                      <div key={`${transaction.transactionId}-${index}`} className="transaction-item">
                        <div className="transaction-header">
                          <span className="transaction-type">{transaction.type}</span>
                          <span className="transaction-date">
                            {transaction.dateApproved || transaction.dateApplied || 'No date'}
                            {transaction.timeApproved && ` at ${transaction.timeApproved}`}
                          </span>
                        </div>
                        <div className="transaction-detail">
                          <span>Transaction ID: </span>
                          <span>{transaction.transactionId}</span>
                        </div>
                        <div className="transaction-detail">
                          <span>Status: </span>
                          <span style={{
                            color: transaction.status === 'approved' || transaction.status === 'completed' ? 'green' : 
                                  transaction.status === 'rejected' || transaction.status === 'failed' ? 'red' : 
                                  '#666'
                          }}>
                            {transaction.status || 'Pending'}
                          </span>
                        </div>
                        <div className="transaction-detail">
                          <span>Amount: </span>
                          <span className="transaction-amount">
                            {formatCurrency(
                              transaction.amountToBeDeposited || 
                              transaction.loanAmount || 
                              transaction.amount || 
                              transaction.amountWithdrawn || 
                              transaction.amountToBePaid
                            )}
                          </span>
                        </div>
                        {transaction.interestRate && (
                          <div className="transaction-detail">
                            <span>Interest Rate: </span>
                            <span>{transaction.interestRate}%</span>
                          </div>
                        )}
                        {transaction.term && (
                          <div className="transaction-detail">
                            <span>Term: </span>
                            <span>{transaction.term} months</span>
                          </div>
                        )}
                        {transaction.rejectionReason && (
                          <div className="transaction-detail">
                            <span>Reason: </span>
                            <span style={{color: 'red'}}>{transaction.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
              <p style={styles.modalText}>{successMessage}</p>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={() => setSuccessVisible(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
              <p style={styles.modalText}>{errorMessage}</p>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={() => setErrorModalVisible(false)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div style={styles.centeredModal}>
            <div style={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;