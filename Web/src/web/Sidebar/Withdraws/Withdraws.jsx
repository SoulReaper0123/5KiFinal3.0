import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaPlus
} from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { FiAlertCircle } from 'react-icons/fi';
import ExcelJS from 'exceljs';
import WithdrawApplications from './WithdrawApplications';
import ApprovedWithdraws from './ApprovedWithdraws';
import RejectedWithdraws from './RejectedWithdraws';
import { database } from '../../../../../Database/firebaseConfig';

const Withdraws = () => {
  const [activeSection, setActiveSection] = useState('withdrawApplications');
  const [withdrawApplications, setWithdrawApplications] = useState([]);
  const [approvedWithdraws, setApprovedWithdraws] = useState([]);
  const [rejectedWithdraws, setRejectedWithdraws] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Add modal states for Approved tab
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddWithdrawConfirmation, setShowAddWithdrawConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [addForm, setAddForm] = useState({
    memberId: '',
    firstName: '',
    lastName: '',
    email: '',
    withdrawOption: 'GCash',
    accountName: '',
    accountNumber: '',
    amountWithdrawn: ''
  });
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
      .plus-button {
        position: fixed;
        right: 30px;
        bottom: 30px;
        background-color: #2D5783;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border: none;
        width: 60px;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        color: white;
        z-index: 100;
      }
      .plus-icon { font-size: 24px; }
      .centered-add-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000; }
      .add-modal-card { width: 40%; max-width: 800px; background:#fff; border-radius:8px; padding:20px; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:90vh; height:auto; display:flex; flex-direction:column; }
      .add-modal-header { border-bottom:1px solid #eee; padding-bottom:12px; margin-bottom:12px; }
      .add-modal-title { font-size:18px; font-weight:bold; color:#2D5783; text-align:center; }
      .add-form { display:grid; grid-template-columns:1fr 1fr; gap: 20px; }
      .form-group { display:flex; flex-direction:column; margin-bottom:12px; }
      .form-label { font-weight:600; margin-bottom:6px; font-size:14px; }
      .form-input { padding:10px; border:1px solid #ccc; border-radius:5px; font-size:14px; }
      .add-actions { display:flex; justify-content:center; gap:12px; padding-top:12px; border-top:1px solid #eee; }
      .btn { padding:8px 16px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; }
      .btn-primary { background:#4CAF50; color:#fff; }
      .btn-secondary { background:#f44336; color:#fff; }
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
        const [wSnap, aSnap, rSnap] = await Promise.all([
          database.ref('Withdrawals/WithdrawalApplications').once('value'),
          database.ref('Withdrawals/ApprovedWithdrawals').once('value'),
          database.ref('Withdrawals/RejectedWithdrawals').once('value'),
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
        : rejectedWithdraws;

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
          : 'RejectedWithdrawals';

      if (dataToDownload.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(fileName);

      // Define headers based on the section
      const headers = [
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
      ];

      worksheet.addRow(headers);

      dataToDownload.forEach(item => {
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
        : rejectedWithdraws;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  const openAddModal = () => setAddModalVisible(true);
  const closeAddModal = () => setAddModalVisible(false);
  const updateForm = (field, value) => setAddForm(prev => ({ ...prev, [field]: value }));

  const formatDate = (d) => d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const formatTime = (d) => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  // Add an approved withdrawal directly (mirrors WithdrawApplications approve + App Withdraw.js)
  const handleAddApprovedWithdraw = async () => {
    try {
      setIsProcessing(true);
      const now = new Date();
      const dateApproved = formatDate(now);
      const timeApproved = formatTime(now);

      const required = ['memberId','firstName','lastName','email','withdrawOption','amountWithdrawn'];
      for (const f of required) { if (!addForm[f]) throw new Error('Please fill all required fields'); }

      const memberRef = database.ref(`Members/${addForm.memberId}`);
      const fundsRef = database.ref('Settings/Funds');

      const [memberSnap, fundsSnap] = await Promise.all([
        memberRef.once('value'),
        fundsRef.once('value')
      ]);

      if (!memberSnap.exists()) throw new Error('Member not found');

      const member = memberSnap.val();
      const withdrawAmount = parseFloat(addForm.amountWithdrawn);
      const currentBalance = parseFloat(member.balance || 0);
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      if (withdrawAmount > currentBalance) throw new Error('Insufficient member balance');
      if (withdrawAmount > currentFunds) throw new Error('Insufficient funds');

      const transactionId = Math.floor(100000 + Math.random() * 900000).toString();
      const approvedRef = database.ref(`Withdrawals/ApprovedWithdrawals/${addForm.memberId}/${transactionId}`);
      const txnRef = database.ref(`Transactions/Withdrawals/${addForm.memberId}/${transactionId}`);

      const approvedData = {
        id: addForm.memberId,
        transactionId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        withdrawOption: addForm.withdrawOption,
        accountName: addForm.accountName,
        accountNumber: addForm.accountNumber,
        amountWithdrawn: withdrawAmount,
        dateApproved,
        timeApproved,
        status: 'approved'
      };

      // Persist as in WithdrawApplications approve flow
      await approvedRef.set(approvedData);
      await txnRef.set(approvedData);

      const newBalance = currentBalance - withdrawAmount;
      const newFunds = currentFunds - withdrawAmount;
      await memberRef.update({ balance: newBalance });
      await fundsRef.set(newFunds);

      // Log to FundsHistory (YYYY-MM-DD) like WithdrawApplications
      const dateKey = now.toISOString().split('T')[0];
      await database.ref(`Settings/FundsHistory/${dateKey}`).set(newFunds);

      // Send email via ApproveWithdraws API
      try {
        const { ApproveWithdraws } = await import('../../../../../Server/api');
        await ApproveWithdraws({
          memberId: addForm.memberId,
          transactionId,
          amount: withdrawAmount,
          dateApproved,
          timeApproved,
          email: addForm.email,
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          status: 'approved'
        });
      } catch (e) {
        console.warn('ApproveWithdraws email send failed or not configured:', e?.message || e);
      }

      setSuccessMessage('Approved withdrawal added successfully!');
      setSuccessModalVisible(true);
      setAddModalVisible(false);
    } catch (err) {
      console.error('Add approved withdraw error:', err);
      setErrorMessage(err.message || 'Failed to add approved withdrawal');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
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
            </>
          )}
        </div>

        {activeSection === 'approvedWithdraws' && (
          <button className="plus-button" onClick={openAddModal}>
            <FaPlus className="plus-icon" />
          </button>
        )}

        {addModalVisible && (
          <div className="centered-add-modal">
            <div className="add-modal-card">
              <button onClick={closeAddModal} style={{ position:'absolute', top:10, right:10, border:'none', background:'transparent', cursor:'pointer' }}>
                <AiOutlineClose />
              </button>
              <div className="add-modal-header">
                <h3 className="add-modal-title">Add Approved Withdrawal</h3>
              </div>
              <div className="add-form">
                <div className="form-group">
                  <label className="form-label">Member ID</label>
                  <input className="form-input" value={addForm.memberId} onChange={(e)=>updateForm('memberId', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={addForm.email} onChange={(e)=>updateForm('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={addForm.firstName} onChange={(e)=>updateForm('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={addForm.lastName} onChange={(e)=>updateForm('lastName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Withdraw Option</label>
                  <select className="form-input" value={addForm.withdrawOption} onChange={(e)=>updateForm('withdrawOption', e.target.value)}>
                    <option value="GCash">GCash</option>
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input className="form-input" value={addForm.accountName} onChange={(e)=>updateForm('accountName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input className="form-input" value={addForm.accountNumber} onChange={(e)=>updateForm('accountNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="form-input" type="number" value={addForm.amountWithdrawn} onChange={(e)=>updateForm('amountWithdrawn', e.target.value)} />
                </div>
              </div>
              <div className="add-actions">
                <button className="btn btn-secondary" onClick={closeAddModal} disabled={isProcessing}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setShowAddWithdrawConfirmation(true)} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Add Approved Withdrawal'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Approve (Add Approved Withdrawal) Confirmation Modal */}
        {showAddWithdrawConfirmation && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaExclamationCircle className="confirm-icon" style={{ color: '#2D5783' }} />
              <p className="modal-text">Are you sure you want to add this approved withdrawal?</p>
              <div style={{ display:'flex', gap: '10px' }}>
                <button 
                  className="confirm-btn"
                  onClick={async () => { setActionInProgress(true); setShowAddWithdrawConfirmation(false); await handleAddApprovedWithdraw(); setActionInProgress(false); }}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAddWithdrawConfirmation(false)}
                  disabled={actionInProgress}
                >
                  No
                </button>
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

export default Withdraws;