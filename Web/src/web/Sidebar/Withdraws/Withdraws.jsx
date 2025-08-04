import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import ExcelJS from 'exceljs';
import WithdrawApplications from './WithdrawApplications';
import ApprovedWithdraws from './ApprovedWithdraws';
import RejectedWithdraws from './RejectedWithdraws';
import PermanentWithdraws from './PermanentWithdraws';
import { database } from '../../../../../Database/firebaseConfig';

const Withdraws = () => {
  const [activeSection, setActiveSection] = useState('withdrawApplications');
  const [withdrawApplications, setWithdrawApplications] = useState([]);
  const [approvedWithdraws, setApprovedWithdraws] = useState([]);
  const [rejectedWithdraws, setRejectedWithdraws] = useState([]);
  const [permanentWithdraws, setPermanentWithdraws] = useState([]);
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
        const [wSnap, aSnap, rSnap, pSnap] = await Promise.all([
          database.ref('Withdrawals/WithdrawalApplications').once('value'),
          database.ref('Withdrawals/ApprovedWithdrawals').once('value'),
          database.ref('Withdrawals/RejectedWithdrawals').once('value'),
          database.ref('MembershipWithdrawal').once('value'),
        ]);

        const toArray = snap => {
          const val = snap.val() || {};
          const all = [];
          Object.entries(val).forEach(([uid, data]) => {
            Object.entries(data).forEach(([txId, record]) => {
              all.push({ id: uid, transactionId: txId, ...record });
            });
          });
          return all;
        };

        setWithdrawApplications(toArray(wSnap));
        setApprovedWithdraws(toArray(aSnap));
        setRejectedWithdraws(toArray(rSnap));
        setPermanentWithdraws(toArray(pSnap));
        setFilteredData(toArray(wSnap));
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        setErrorMessage('Failed to fetch withdrawal data');
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

    const currentData =
      activeSection === 'withdrawApplications'
        ? withdrawApplications
        : activeSection === 'approvedWithdraws'
        ? approvedWithdraws
        : activeSection === 'rejectedWithdraws'
        ? rejectedWithdraws
        : permanentWithdraws;

    const filtered = currentData.filter(item => {
      const memberId = item.id?.toString() || '';
      const transactionId = item.transactionId?.toString() || '';
      const firstName = item.firstName?.toLowerCase() || '';
      const lastName = item.lastName?.toLowerCase() || '';
      const query = text.toLowerCase();
      
      return (
        memberId.includes(query) ||
        transactionId.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      );
    });

    setNoMatch(filtered.length === 0);
    setFilteredData(filtered);
  };

  const handleDownload = async () => {
    try {
      let dataToDownload = filteredData;
      let fileName =
        activeSection === 'withdrawApplications'
          ? 'PendingWithdrawals'
          : activeSection === 'approvedWithdraws'
          ? 'ApprovedWithdrawals'
          : activeSection === 'rejectedWithdraws'
          ? 'RejectedWithdrawals'
          : 'PermanentWithdrawals';

      if (dataToDownload.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(fileName);

      // Define headers based on the section
      const headers = [];
      if (activeSection === 'permanentWithdraws') {
        headers.push(
          'Transaction ID',
          'Member ID',
          'First Name',
          'Last Name',
          'Email',
          'Address',
          'Contact',
          'Date Joined',
          'Reason',
          'Balance',
          'Date Submitted',
          'Status',
          'Has Existing Loan'
        );
      } else {
        headers.push(
          'Transaction ID',
          'Member ID',
          'First Name',
          'Last Name',
          'Email',
          'Withdraw Option',
          'Account Name',
          'Account Number',
          'Amount',
          'Date Applied',
          'Status'
        );
      }

      worksheet.addRow(headers);

      dataToDownload.forEach(item => {
        if (activeSection === 'permanentWithdraws') {
          worksheet.addRow([
            item.transactionId,
            item.id,
            item.firstName,
            item.lastName,
            item.email,
            item.address,
            item.contact,
            item.dateJoined,
            item.reason,
            item.balance,
            item.dateSubmitted,
            item.status,
            item.hasExistingLoan ? 'Yes' : 'No'
          ]);
        } else {
          worksheet.addRow([
            item.transactionId,
            item.id,
            item.firstName,
            item.lastName,
            item.email,
            item.withdrawOption,
            item.accountName,
            item.accountNumber,
            item.amountWithdrawn,
            item.dateApplied,
            item.status
          ]);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.xlsx`;
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

  const handleTabSwitch = (section) => {
    setActiveSection(section);
    setSearchQuery('');
    setCurrentPage(0);
    const defaultData =
      section === 'withdrawApplications'
        ? withdrawApplications
        : section === 'approvedWithdraws'
        ? approvedWithdraws
        : section === 'rejectedWithdraws'
        ? rejectedWithdraws
        : permanentWithdraws;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Withdrawals</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'withdrawApplications', label: 'Pending', color: '#2D5783' },
              { key: 'approvedWithdraws', label: 'Approved', color: '#008000' },
              { key: 'rejectedWithdraws', label: 'Rejected', color: '#FF0000' },
              { key: 'permanentWithdraws', label: 'Permanent', color: '#800080' },
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

        {!noMatch && filteredData.length > 0 && (
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
          {noMatch ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <>
              {activeSection === 'withdrawApplications' && (
                <WithdrawApplications 
                  withdraws={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              {activeSection === 'approvedWithdraws' && (
                <ApprovedWithdraws 
                  withdraws={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              {activeSection === 'rejectedWithdraws' && (
                <RejectedWithdraws 
                  withdraws={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              {activeSection === 'permanentWithdraws' && (
                <PermanentWithdraws 
                  withdraws={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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

export default Withdraws;