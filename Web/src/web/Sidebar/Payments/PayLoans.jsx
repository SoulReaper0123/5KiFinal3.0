import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import ExcelJS from 'exceljs';
import PendingPayments from './PaymentApplications';
import CompletedPayments from './ApprovedPayments';
import FailedPayments from './RejectedPayments';
import { database } from '../../../../../Database/firebaseConfig';

const PayLoans = () => {
  const [activeSection, setActiveSection] = useState('pendingPayments');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
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
      .circle-tab-wrapper {
        display: flex;
        background-color: #ddd;
        height: 40px;
        border-radius: 30px;
      }
      .tab-button {
        padding: 0 16px;
        height: 40px;
        border-radius: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 1px;
        border: none;
        cursor: pointer;
        outline: none;
      }
      .tab-button:focus {
        outline: none;
        box-shadow: none;
      }
      .tab-text {
        font-size: 14px;
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
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [pendingSnap, completedSnap, failedSnap] = await Promise.all([
          database.ref('Payments/PaymentApplications').once('value'),
          database.ref('Payments/ApprovedPayments').once('value'),
          database.ref('Payments/RejectedPayments').once('value'),
        ]);

        const flatten = (val) => {
          if (!val) return [];
          const arr = [];
          Object.entries(val).forEach(([uid, userData]) => {
            Object.entries(userData || {}).forEach(([txId, record]) => {
              arr.push({ 
                id: uid, 
                transactionId: txId, 
                ...record,
                firstName: record.firstName || '',
                lastName: record.lastName || '',
                amountToBePaid: record.amountToBePaid || 0,
                paymentOption: record.paymentOption || 'Unknown',
                dateApplied: record.dateApplied || new Date().toLocaleDateString()
              });
            });
          });
          return arr;
        };

        const pending = flatten(pendingSnap.val());
        const completed = flatten(completedSnap.val());
        const failed = flatten(failedSnap.val());

        setPendingPayments(pending);
        setCompletedPayments(completed);
        setFailedPayments(failed);
        setFilteredData(pending);
      } catch (error) {
        console.error('Fetch error:', error);
        setErrorMessage('Failed to fetch payment data: ' + error.message);
        setErrorModalVisible(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);

    const base =
      activeSection === 'pendingPayments'
        ? pendingPayments
        : activeSection === 'completedPayments'
        ? completedPayments
        : failedPayments;

    const filtered = base.filter(item => {
      const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
      const searchLower = text.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        (item.id && item.id.toLowerCase().includes(searchLower)) ||
        (item.transactionId && item.transactionId.toLowerCase().includes(searchLower)
      ));
    });

    setFilteredData(filtered);
    setNoMatch(filtered.length === 0 && text !== '');
  };

  const handleDownload = async () => {
    try {
      let dataToExport;
      let fileName;
      
      if (activeSection === 'pendingPayments') {
        dataToExport = pendingPayments;
        fileName = 'PendingPayments';
      } else if (activeSection === 'completedPayments') {
        dataToExport = completedPayments;
        fileName = 'CompletedPayments';
      } else {
        dataToExport = failedPayments;
        fileName = 'FailedPayments';
      }

      if (!dataToExport.length) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payments');

      // Add headers
      const headers = [
        'Member ID',
        'Transaction ID',
        'Name',
        'Amount',
        'Payment Method',
        'Date Applied',
        'Status',
        ...(activeSection === 'completedPayments' ? ['Date Approved'] : []),
        ...(activeSection === 'failedPayments' ? ['Date Rejected', 'Rejection Reason'] : [])
      ];
      worksheet.addRow(headers);

      // Add data rows
      dataToExport.forEach(item => {
        const row = [
          item.id,
          item.transactionId,
          `${item.firstName} ${item.lastName}`,
          item.amountToBePaid,
          item.paymentOption,
          item.dateApplied,
          activeSection === 'pendingPayments' ? 'Pending' : 
          activeSection === 'completedPayments' ? 'Approved' : 'Rejected',
          ...(activeSection === 'completedPayments' ? [item.dateApproved] : []),
          ...(activeSection === 'failedPayments' ? [item.dateRejected, item.rejectionReason] : [])
        ];
        worksheet.addRow(row);
      });

      // Format columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Data exported successfully!');
      setSuccessModalVisible(true);
    } catch (err) {
      console.error('Download error:', err);
      setErrorMessage('Failed to export data: ' + err.message);
      setErrorModalVisible(true);
    }
  };

  const handleTabSwitch = (section) => {
    setActiveSection(section);
    setSearchQuery('');
    setCurrentPage(0);

    const defaultData =
      section === 'pendingPayments'
        ? pendingPayments
        : section === 'completedPayments'
        ? completedPayments
        : failedPayments;

    setFilteredData(defaultData);
    setNoMatch(false);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [pendingSnap, completedSnap, failedSnap] = await Promise.all([
        database.ref('Payments/PaymentApplications').once('value'),
        database.ref('Payments/ApprovedPayments').once('value'),
        database.ref('Payments/RejectedPayments').once('value'),
      ]);

      const flatten = (val) => {
        if (!val) return [];
        const arr = [];
        Object.entries(val).forEach(([uid, userData]) => {
          Object.entries(userData || {}).forEach(([txId, record]) => {
            arr.push({ 
              id: uid, 
              transactionId: txId, 
              ...record,
              firstName: record.firstName || '',
              lastName: record.lastName || '',
              amountToBePaid: record.amountToBePaid || 0,
              paymentOption: record.paymentOption || 'Unknown',
              dateApplied: record.dateApplied || new Date().toLocaleDateString()
            });
          });
        });
        return arr;
      };

      const pending = flatten(pendingSnap.val());
      const completed = flatten(completedSnap.val());
      const failed = flatten(failedSnap.val());

      setPendingPayments(pending);
      setCompletedPayments(completed);
      setFailedPayments(failed);
      setFilteredData(
        activeSection === 'pendingPayments' ? pending :
        activeSection === 'completedPayments' ? completed : failed
      );
    } catch (error) {
      console.error('Refresh error:', error);
      setErrorMessage('Failed to refresh data: ' + error.message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  if (loading && pendingPayments.length === 0 && completedPayments.length === 0 && failedPayments.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Pay Loans</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'pendingPayments', label: 'Pending', color: '#2D5783' },
              { key: 'completedPayments', label: 'Approved', color: '#008000' },
              { key: 'failedPayments', label: 'Rejected', color: '#FF0000' },
            ].map((tab) => {
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabSwitch(tab.key)}
                  className={`tab-button ${isActive ? 'active-tab' : ''}`}
                  style={{ 
                    backgroundColor: isActive ? tab.color : 'transparent',
                    outline: 'none'
                  }}
                >
                  <span
                    className="tab-text"
                    style={{ color: isActive ? '#fff' : '#000' }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="search-download-container">
            <div className="search-bar">
              <input
                className="search-input"
                placeholder="Search by name, ID or transaction"
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

        {!noMatch && filteredData.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">
              Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, filteredData.length)} of {filteredData.length}
            </span>
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
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <div className="spinner"></div>
            </div>
          ) : noMatch ? (
            <span className="no-match-text">No payments match your search criteria</span>
          ) : (
            <>
              {activeSection === 'pendingPayments' && (
                <PendingPayments 
                  payments={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={refreshData}
                />
              )}
              {activeSection === 'completedPayments' && (
                <CompletedPayments payments={paginatedData} />
              )}
              {activeSection === 'failedPayments' && (
                <FailedPayments payments={paginatedData} />
              )}
            </>
          )}
        </div>

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

export default PayLoans;