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
import ApplyLoans from './ApplyLoans';
import ApprovedLoans from './ApprovedLoans';
import RejectedLoans from './RejectedLoans';
import { database } from '../../../../../Database/firebaseConfig';

const Loans = () => {
  const [activeSection, setActiveSection] = useState('applyLoans');
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [rejectedLoans, setRejectedLoans] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Add modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Confirmation modals for Add Approved Loan
  const [showAddLoanConfirmation, setShowAddLoanConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [addForm, setAddForm] = useState({
    memberId: '',
    firstName: '',
    lastName: '',
    email: '',
    loanType: '',
    loanAmount: '',
    term: '',
    disbursement: 'GCash',
    accountName: '',
    accountNumber: ''
  });
  const pageSize = 10;

  // Settings for loan types and terms
  const [loanTypes, setLoanTypes] = useState([]);
  const [interestByType, setInterestByType] = useState({});

  // Load Settings for LoanTypes and InterestRateByType
  useEffect(() => {
    const settingsRef = database.ref('Settings');
    const cb = (snap) => {
      const s = snap.val() || {};
      const lt = s.LoanTypes;
      const isMap = lt && typeof lt === 'object' && !Array.isArray(lt);
      const typesArr = isMap ? Object.keys(lt) : (lt || ['Regular Loan', 'Quick Cash']);
      setLoanTypes(typesArr);
      setInterestByType(isMap ? lt : (s.InterestRateByType || {}));
      if (!addForm.loanType && typesArr.length > 0) {
        const defaultType = typesArr[0];
        setAddForm(prev => ({ ...prev, loanType: defaultType }));
      }
    };
    settingsRef.on('value', cb);
    return () => settingsRef.off('value', cb);
  }, []);

  // When loan type changes, ensure term is within allowed and has a defined rate
  useEffect(() => {
    const lt = addForm.loanType;
    if (!lt) return;
    const map = interestByType[lt] || {};
    const allowed = Object.keys(map).filter((t) => map[t] !== undefined && map[t] !== null && map[t] !== '');
    const sorted = allowed.sort((a,b)=>Number(a)-Number(b));
    if (!sorted.includes(String(addForm.term))) {
      const next = sorted[0] || '';
      setAddForm(prev => ({ ...prev, term: next }));
    }
  }, [addForm.loanType, interestByType]);

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

  // Centralized loan fetching; can be called on mount, tab switch, manual refresh, or polling
  // Pass options: { silent: true } to avoid toggling the loading spinner (used by polling)
  const fetchLoansDataForSection = async (sectionKey = activeSection, options = {}) => {
    const { silent = false } = options;
    if (!silent) setLoading(true);
    try {
      const [applySnap, approvedSnap, rejectedSnap] = await Promise.all([
        database.ref('Loans/LoanApplications').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Loans/RejectedLoans').once('value'),
      ]);

      const flatten = (val) => {
        const all = [];
        Object.entries(val || {}).forEach(([uid, record]) => {
          if (record && typeof record === 'object' && !record.hasOwnProperty('loanAmount')) {
            Object.entries(record).forEach(([txId, inner]) => {
              all.push({ id: uid, transactionId: txId, ...inner });
            });
          } else {
            all.push({ id: uid, ...record });
          }
        });
        return all;
      };

      const apply = flatten(applySnap.val());
      const approved = flatten(approvedSnap.val());
      const rejected = flatten(rejectedSnap.val());

      setPendingLoans(apply);
      setApprovedLoans(approved);
      setRejectedLoans(rejected);

      // Keep current tab view consistent after fetch
      const base = sectionKey === 'applyLoans' ? apply : sectionKey === 'approvedLoans' ? approved : rejected;
      setFilteredData(base);
      setNoMatch(base.length === 0);
    } catch (err) {
      console.error('Loan fetch error:', err);
      setErrorMessage('Failed to fetch loan data');
      setErrorModalVisible(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLoansDataForSection('applyLoans');
  }, []);

  // Polling every 5 seconds to keep data fresh for the active tab
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Silent refresh to avoid flicker
      fetchLoansDataForSection(activeSection, { silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeSection]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
    const base =
      activeSection === 'applyLoans'
        ? pendingLoans
        : activeSection === 'approvedLoans'
        ? approvedLoans
        : rejectedLoans;

    const filtered = base.filter(item =>
      `${item.firstName ?? ''} ${item.lastName ?? ''}`.toLowerCase().includes(text.toLowerCase())
    );

    setNoMatch(filtered.length === 0);
    setFilteredData(filtered);
  };

  const handleDownload = async () => {
    try {
      let dataToExport;
      let fileName;
      
      if (activeSection === 'applyLoans') {
        dataToExport = pendingLoans;
        fileName = 'PendingLoans';
      } else if (activeSection === 'approvedLoans') {
        dataToExport = approvedLoans;
        fileName = 'ApprovedLoans';
      } else {
        dataToExport = rejectedLoans;
        fileName = 'RejectedLoans';
      }

      if (!dataToExport.length) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Loans');

      const headers = Object.keys(dataToExport[0]);
      worksheet.addRow(headers);

      dataToExport.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
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
    } catch (err) {
      console.error('Download error:', err);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const handleTabSwitch = async (key) => {
    setActiveSection(key);
    setSearchQuery('');
    setCurrentPage(0);
    await fetchLoansDataForSection(key);
  };

  const openAddModal = () => setAddModalVisible(true);
  const closeAddModal = () => setAddModalVisible(false);
  const updateForm = (field, value) => setAddForm(prev => ({ ...prev, [field]: value }));

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  const formatTime = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Add approved loan directly (Admin-created) by mirroring ApplyLoan.js + ApplyLoans.jsx approve flow
  const handleAddApprovedLoan = async () => {
    try {
      setIsProcessing(true);
      const now = new Date();
      const dateApproved = formatDate(now);
      const timeApproved = formatTime(now);

      // Validate
      const required = ['memberId','firstName','lastName','email','loanAmount','term','disbursement'];
      for (const f of required) {
        if (!addForm[f]) throw new Error('Please fill all required fields');
      }

      // Fetch settings and member balance
      const memberBalanceRef = database.ref(`Members/${addForm.memberId}/balance`);
      const fundsRef = database.ref('Settings/Funds');
      // Per-loan-type interest rate
      const interestRateRef = database.ref(`Settings/InterestRateByType/${encodeURIComponent(addForm.loanType || '')}/${addForm.term}`);
      const processingFeeRef = database.ref('Settings/ProcessingFee');
      const loanPercentageRef = database.ref('Settings/LoanPercentage');

      const [balanceSnap, fundsSnap, irSnap, feeSnap, percSnap] = await Promise.all([
        memberBalanceRef.once('value'),
        fundsRef.once('value'),
        interestRateRef.once('value'),
        processingFeeRef.once('value'),
        loanPercentageRef.once('value')
      ]);

      const memberBalance = parseFloat(balanceSnap.val()) || 0;
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const interestRateVal = irSnap.val();
      if (interestRateVal === null || interestRateVal === undefined || interestRateVal === '') {
        throw new Error(`Missing interest rate for type "${addForm.loanType}" and term ${addForm.term} months. Set it in Settings > System Settings.`);
      }
      const interestRate = (parseFloat(interestRateVal) || 0) / 100;
      const processingFee = parseFloat(feeSnap.val()) || 0;
      const loanPercentage = parseFloat(percSnap.val());

      const amount = parseFloat(addForm.loanAmount);
      const termMonths = parseInt(addForm.term);

      // Percentage check as in ApplyLoans.jsx
      const maxLoanAmount = loanPercentage === 0 ? memberBalance : memberBalance * ((loanPercentage || 80) / 100);
      if (amount > maxLoanAmount) {
        const pct = loanPercentage === 0 ? 100 : (loanPercentage || 80);
        throw new Error(`Loan amount exceeds ${pct}% of member's balance.`);
      }

      if (amount > currentFunds) {
        throw new Error('Insufficient funds to approve this loan.');
      }

      // Compute loan figures like ApplyLoans.jsx
      const monthlyPayment = amount / termMonths;
      const interest = amount * interestRate;
      const totalMonthlyPayment = monthlyPayment + interest;
      const totalTermPayment = totalMonthlyPayment * termMonths;
      const releaseAmount = amount - processingFee;

      const dueDate = new Date(now); dueDate.setDate(now.getDate() + 30);

      const transactionId = Math.floor(100000 + Math.random() * 900000).toString();
      const approvedRef = database.ref(`Loans/ApprovedLoans/${addForm.memberId}/${transactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${addForm.memberId}/${transactionId}`);
      const currentLoanRef = database.ref(`Loans/CurrentLoans/${addForm.memberId}/${transactionId}`);
      const memberLoanRef = database.ref(`Members/${addForm.memberId}/loans/${transactionId}`);

      const approvedData = {
        id: addForm.memberId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        transactionId,
        loanAmount: amount,
        term: termMonths,
        disbursement: addForm.disbursement,
        accountName: addForm.accountName,
        accountNumber: addForm.accountNumber,
        dateApproved,
        timeApproved,
        timestamp: now.getTime(),
        status: 'approved',
        interestRate: interestRate * 100,
        interest,
        monthlyPayment,
        totalMonthlyPayment,
        totalTermPayment,
        processingFee,
        releaseAmount,
        dueDate: `${dueDate.getFullYear()}-${(dueDate.getMonth()+1).toString().padStart(2,'0')}-${dueDate.getDate().toString().padStart(2,'0')}`,
        paymentsMade: 0
      };

      // Write to DB similar to ApplyLoans.jsx approval
      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);

      // Update Settings/Funds and FundsHistory
      const newFundsAmount = currentFunds - amount;
      await fundsRef.set(newFundsAmount);
      const timestampKey = now.toISOString().replace(/[.#$\[\]]/g, '_');
      await database.ref(`Settings/FundsHistory/${timestampKey}`).set(newFundsAmount);

      // Update Savings and SavingsHistory with processing fee (same pattern)
      const dateKey = now.toISOString().split('T')[0];
      const savingsRef = database.ref('Settings/Savings');
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      const [savingsSnap, daySavingsSnap] = await Promise.all([
        savingsRef.once('value'),
        savingsHistoryRef.child(dateKey).once('value')
      ]);
      const currentSavings = parseFloat(savingsSnap.val()) || 0;
      const newSavings = Math.ceil((currentSavings + processingFee) * 100) / 100;
      await savingsRef.set(newSavings);
      const currentDaySavings = parseFloat(daySavingsSnap.val()) || 0;
      const newDaySavings = Math.ceil((currentDaySavings + processingFee) * 100) / 100;
      await savingsHistoryRef.update({ [dateKey]: newDaySavings });

      // Deduct member balance by full amount, as in ApplyLoans.jsx
      const updatedMemberBalance = Math.max(0, Math.ceil((memberBalance - amount) * 100) / 100);
      await memberBalanceRef.set(updatedMemberBalance);

      // Send approval email using existing API ApproveLoans
      try {
        const { ApproveLoans } = await import('../../../../../Server/api');
        await ApproveLoans({
          memberId: addForm.memberId,
          transactionId,
          amount: amount.toFixed(2),
          term: termMonths,
          dateApproved,
          timeApproved,
          email: addForm.email,
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          status: 'approved',
          interestRate: (interestRate * 100).toFixed(2) + '%',
          interest: interest.toFixed(2),
          monthlyPayment: monthlyPayment.toFixed(2),
          totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
          totalTermPayment: totalTermPayment.toFixed(2),
          releaseAmount: releaseAmount.toFixed(2),
          processingFee: processingFee.toFixed(2),
          dueDate: approvedData.dueDate
        });
      } catch (e) {
        console.warn('ApproveLoans email send failed or not configured:', e?.message || e);
      }

      setSuccessMessage('Approved loan added successfully!');
      setSuccessModalVisible(true);
      setAddModalVisible(false);
    } catch (err) {
      console.error('Add approved loan error:', err);
      setErrorMessage(err.message || 'Failed to add approved loan');
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
        <h2 className="header-text">Loans</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'applyLoans', label: 'Pending', color: '#2D5783' },
              { key: 'approvedLoans', label: 'Approved', color: '#008000' },
              { key: 'rejectedLoans', label: 'Rejected', color: '#FF0000' },
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
              {activeSection === 'applyLoans' && (
                <ApplyLoans 
                  loans={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={() => fetchLoansDataForSection('applyLoans')}
                />
              )}
              {activeSection === 'approvedLoans' && (
                <ApprovedLoans 
                  loans={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={() => fetchLoansDataForSection('approvedLoans')}
                />
              )}
              {activeSection === 'rejectedLoans' && (
                <RejectedLoans 
                  loans={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={() => fetchLoansDataForSection('rejectedLoans')}
                />
              )}
            </>
          )}
        </div>

        {activeSection === 'approvedLoans' && (
          <button className="plus-button" onClick={openAddModal}>
            <FaPlus className="plus-icon" />
          </button>
        )}

        {addModalVisible && (
          <div className="centered-add-modal">
            <div className="add-modal-card">
              <button onClick={closeAddModal} className="close-add-modal" style={{ position:'absolute', top:10, right:10, border:'none', background:'transparent', cursor:'pointer' }}>
                <AiOutlineClose />
              </button>
              <div className="add-modal-header">
                <h3 className="add-modal-title">Add Approved Loan</h3>
              </div>
              <div className="add-modal-body">
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
                    <label className="form-label">Loan Amount</label>
                    <input className="form-input" type="number" value={addForm.loanAmount} onChange={(e)=>updateForm('loanAmount', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Loan Type</label>
                    <select className="form-input" value={addForm.loanType} onChange={(e)=>updateForm('loanType', e.target.value)}>
                      {loanTypes.map((lt) => (
                        <option key={`lt-${lt}`} value={lt}>{lt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Term (months)</label>
                    <select className="form-input" value={addForm.term} onChange={(e)=>updateForm('term', e.target.value)}>
                      {Object.keys(interestByType[addForm.loanType] || {})
                        .filter((t) => {
                          const m = interestByType[addForm.loanType] || {};
                          return m[String(t)] !== undefined && m[String(t)] !== null && m[String(t)] !== '';
                        })
                        .sort((a,b)=>Number(a)-Number(b))
                        .map((t) => (
                          <option key={`term-${t}`} value={t}>{t}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Disbursement</label>
                    <select className="form-input" value={addForm.disbursement} onChange={(e)=>updateForm('disbursement', e.target.value)}>
                      <option value="GCash">GCash</option>
                      <option value="Bank">Bank</option>
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
                </div>
              </div>
              <div className="add-actions">
                <button className="btn btn-secondary" onClick={closeAddModal} disabled={isProcessing}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setShowAddLoanConfirmation(true)} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Add Approved Loan'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Approve (Add Approved Loan) Confirmation Modal */}
        {showAddLoanConfirmation && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaExclamationCircle className="confirm-icon" style={{ color: '#2D5783' }} />
              <p className="modal-text">Are you sure you want to add this approved loan?</p>
              <div style={{ display:'flex', gap: '10px' }}>
                <button 
                  className="confirm-btn"
                  onClick={async () => { setActionInProgress(true); setShowAddLoanConfirmation(false); await handleAddApprovedLoan(); setActionInProgress(false); }}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAddLoanConfirmation(false)}
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

export default Loans;