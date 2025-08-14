import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaPlus,
  FaCheckCircle,
  FaTimes,
  FaExclamationCircle
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, storage } from '../../../../../Database/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import ApplyDeposits from './ApplyDeposits';
import ApprovedDeposits from './ApprovedDeposits';
import RejectedDeposits from './RejectedDeposits';
import { ApproveDeposits } from '../../../../../Server/api';

// Constants
const depositOptions = [
  { key: 'Bank', label: 'Bank' },
  { key: 'GCash', label: 'GCash' },
  { key: 'Cash', label: 'Cash on Hand' }
];

const pageSize = 10;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const Deposits = () => {
  const [activeSection, setActiveSection] = useState('applyDeposits');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    firstName: '',
    lastName: '',
    email: '',
    depositOption: '',
    accountName: '',
    accountNumber: '',
    amount: '',
  });
  const [proofOfDepositFile, setProofOfDepositFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [depositAccounts, setDepositAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });
  const [isProcessing, setIsProcessing] = useState(false);

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
      .plus-icon {
        font-size: 24px;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-container {
        background-color: #f9f9f9;
        padding: 24px;
        border-radius: 10px;
        width: 40%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #2D5783;
        text-align: center;
      }
      .form-group {
        margin-bottom: 12px;
      }
      .form-label {
        font-weight: 600;
        margin-bottom: 4px;
        color: #333;
        display: block;
      }
      .required {
        color: red;
      }
      .form-input {
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 10px;
        background-color: #fff;
        width: 100%;
        box-sizing: border-box;
      }
      .form-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-sizing: border-box;
        background-color: white;
      }
      .modal-button-container {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
      }
      .modal-submit-button {
        background-color: #2D5783;
        padding: 12px;
        border-radius: 8px;
        width: 48%;
        text-align: center;
        border: none;
        cursor: pointer;
        color: white;
        font-weight: bold;
      }
      .modal-cancel-button {
        background-color: #ccc;
        padding: 12px;
        border-radius: 8px;
        width: 48%;
        text-align: center;
        border: none;
        cursor: pointer;
        font-weight: bold;
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
      .confirm-modal-card {
        width: 300px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
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
      .bottom-buttons {
        display: flex;
        justify-content: center;
        margin-top: 10px;
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
      .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
        padding: 5px;
        background: none;
        border: none;
        cursor: pointer;
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
        border-left-color: #2D5783;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .file-input-label {
        display: block;
        padding: 10px;
        border: 1px dashed #ccc;
        border-radius: 5px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 5px;
      }
      .file-input {
        display: none;
      }
      .file-name {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        min-width: 800px;
      }
      .table-header {
        background-color: #2D5783;
        color: #fff;
        height: 50px;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
      }
      .table-header-cell {
        white-space: nowrap;
      }
      .table-row {
        height: 50px;
      }
      .table-row:nth-child(even) {
        background-color: #f5f5f5;
      }
      .table-row:nth-child(odd) {
        background-color: #ddd;
      }
      .table-cell {
        text-align: center;
        font-size: 14px;
        border-bottom: 1px solid #ddd;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status-approved {
        color: green;
      }
      .status-rejected {
        color: red;
      }
      .view-text {
        color: #2D5783;
        font-size: 14px;
        text-decoration: underline;
        cursor: pointer;
        font-weight: 500;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pSnap, aSnap, rSnap, settingsSnap] = await Promise.all([
        database.ref('Deposits/DepositApplications').once('value'),
        database.ref('Deposits/ApprovedDeposits').once('value'),
        database.ref('Deposits/RejectedDeposits').once('value'),
        database.ref('Settings/Accounts').once('value')
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

      setPending(toArray(pSnap));
      setApproved(toArray(aSnap));
      setRejected(toArray(rSnap));
      
      if (settingsSnap.exists()) {
        setDepositAccounts(settingsSnap.val());
      } else {
        const oldSettingsSnap = await database.ref('Settings/DepositAccounts').once('value');
        if (oldSettingsSnap.exists()) {
          setDepositAccounts(oldSettingsSnap.val());
        }
      }
      
      const newFilteredData = 
        activeSection === 'applyDeposits' ? toArray(pSnap) :
        activeSection === 'approvedDeposits' ? toArray(aSnap) :
        toArray(rSnap);
      
      setFilteredData(newFilteredData);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      setErrorMessage('Failed to fetch deposit data');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);

    const currentData =
      activeSection === 'applyDeposits'
        ? pending
        : activeSection === 'approvedDeposits'
        ? approved
        : rejected;

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
        activeSection === 'applyDeposits'
          ? 'PendingDeposits'
          : activeSection === 'approvedDeposits'
          ? 'ApprovedDeposits'
          : 'RejectedDeposits';

      if (dataToDownload.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(fileName);

      const headers = Object.keys(dataToDownload[0]);
      worksheet.addRow(headers);

      dataToDownload.forEach(item => {
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
      section === 'applyDeposits'
        ? pending
        : section === 'approvedDeposits'
        ? approved
        : rejected;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  const openAddModal = () => {
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setFormData({
      memberId: '',
      firstName: '',
      lastName: '',
      email: '',
      depositOption: '',
      accountName: '',
      accountNumber: '',
      amount: '',
    });
    setProofOfDepositFile(null);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'depositOption' && value && value !== 'Cash') {
      const selectedAccount = depositAccounts[value];
      setFormData(prev => ({
        ...prev,
        accountName: selectedAccount.accountName || '',
        accountNumber: selectedAccount.accountNumber || ''
      }));
    } else if (name === 'depositOption' && value === 'Cash') {
      setFormData(prev => ({
        ...prev,
        accountName: 'Cash on Hand',
        accountNumber: 'N/A'
      }));
    }
  };

  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const validateFields = () => {
    if (!formData.memberId) {
      setErrorMessage('Member ID is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.firstName) {
      setErrorMessage('First name is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.lastName) {
      setErrorMessage('Last name is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.email) {
      setErrorMessage('Email is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.depositOption) {
      setErrorMessage('Deposit option is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setErrorModalVisible(true);
      return false;
    }
    if (formData.depositOption !== 'Cash' && !proofOfDepositFile) {
      setErrorMessage('Proof of deposit is required');
      setErrorModalVisible(true);
      return false;
    }
    return true;
  };

  const handleSubmitConfirmation = () => {
    if (!validateFields()) return;
    setConfirmModalVisible(true);
  };

  const uploadImageToStorage = async (file, path) => {
    try {
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const submitDeposit = async () => {
    setConfirmModalVisible(false);
    setUploading(true);
    setIsProcessing(true);

    try {
      let proofOfDepositUrl = '';
      
      if (formData.depositOption !== 'Cash') {
        proofOfDepositUrl = await uploadImageToStorage(
          proofOfDepositFile, 
          `proofsOfDeposit/${formData.memberId}_${Date.now()}`
        );
      }

      const transactionId = generateTransactionId();
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const amount = parseFloat(formData.amount);

      const depositData = {
        transactionId,
        id: formData.memberId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        depositOption: formData.depositOption,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        amountToBeDeposited: amount,
        dateApplied: approvalDate,
        timeApplied: approvalTime,
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        status: 'approved'
      };

      if (proofOfDepositUrl) {
        depositData.proofOfDepositUrl = proofOfDepositUrl;
      }

      const approvedRef = database.ref(`Deposits/ApprovedDeposits/${formData.memberId}/${transactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${formData.memberId}/${transactionId}`);
      const memberRef = database.ref(`Members/${formData.memberId}`);
      const fundsRef = database.ref('Settings/Funds');

      const memberSnap = await memberRef.once('value');

      if (memberSnap.exists()) {
        const member = memberSnap.val();

        await approvedRef.set(depositData);
        await transactionRef.set(depositData);

        const newBalance = parseFloat(member.balance || 0) + amount;
        await memberRef.update({ balance: newBalance });

        if (formData.depositOption !== 'Cash') {
          const fundSnap = await fundsRef.once('value');
          const updatedFund = (parseFloat(fundSnap.val()) || 0) + amount;
          await fundsRef.set(updatedFund);
        }

        await callApiApprove(depositData);

        setSuccessMessage('Deposit added and approved successfully!');
        setSuccessModalVisible(true);
        closeAddModal();

        await fetchAllData();
      } else {
        throw new Error('Member not found');
      }
    } catch (error) {
      console.error('Error adding deposit:', error);
      setErrorMessage(error.message || 'Failed to add deposit');
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
      setIsProcessing(false);
    }
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const callApiApprove = async (depositData) => {
    try {
      const response = await ApproveDeposits({
        memberId: depositData.id,
        transactionId: depositData.transactionId,
        amount: depositData.amountToBeDeposited,
        dateApproved: depositData.dateApproved,
        timeApproved: depositData.timeApproved,
        email: depositData.email,
        firstName: depositData.firstName,
        lastName: depositData.lastName,
        status: 'approved'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send approval email');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Deposits</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'applyDeposits', label: 'Pending', color: '#2D5783' },
              { key: 'approvedDeposits', label: 'Approved', color: '#008000' },
              { key: 'rejectedDeposits', label: 'Rejected', color: '#FF0000' },
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
              {activeSection === 'applyDeposits' && (
                <ApplyDeposits 
                  deposits={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={fetchAllData}
                />
              )}
              {activeSection === 'approvedDeposits' && (
                <ApprovedDeposits 
                  deposits={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              {activeSection === 'rejectedDeposits' && (
                <RejectedDeposits 
                  deposits={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>

        {activeSection === 'approvedDeposits' && (
          <button 
            className="plus-button" 
            onClick={openAddModal}
          >
            <FaPlus className="plus-icon" />
          </button>
        )}

        {addModalVisible && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={closeAddModal} className="close-button">
                <AiOutlineClose />
              </button>
              <h3 className="modal-title">Add Deposit</h3>
              
              <div className="form-group">
                <label className="form-label">
                  Member ID<span className="required"> *</span>
                </label>
                <input
                  placeholder="Member ID"
                  value={formData.memberId}
                  onChange={(e) => handleInputChange('memberId', e.target.value)}
                  className="form-input"
                  type="text"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  First Name<span className="required"> *</span>
                </label>
                <input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Last Name<span className="required"> *</span>
                </label>
                <input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Email<span className="required"> *</span>
                </label>
                <input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  type="email"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Deposit Option<span className="required"> *</span>
                </label>
                <select
                  className="form-select"
                  value={formData.depositOption}
                  onChange={(e) => handleInputChange('depositOption', e.target.value)}
                >
                  <option value="">Select Deposit Option</option>
                  {depositOptions.map(option => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input
                  placeholder="Account Name"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  className="form-input"
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className="form-input"
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Amount<span className="required"> *</span>
                </label>
                <input
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {formData.depositOption !== 'Cash' && (
                <div className="form-group">
                  <label className="form-label">
                    Proof of Deposit<span className="required"> *</span>
                  </label>
                  <label className="file-input-label">
                    {proofOfDepositFile ? proofOfDepositFile.name : 'Click to upload Proof of Deposit'}
                    <input
                      type="file"
                      className="file-input"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setProofOfDepositFile)}
                    />
                  </label>
                </div>
              )}
              
              <div className="modal-button-container">
                <button
                  className="modal-submit-button"
                  onClick={handleSubmitConfirmation}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="spinner"></div>
                  ) : (
                    'Add Deposit'
                  )}
                </button>
                <button 
                  className="modal-cancel-button" 
                  onClick={closeAddModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmModalVisible && (
          <div className="centered-modal">
            <div className="confirm-modal-card">
              <FiAlertCircle className="confirm-icon" />
              <p className="modal-text">Are you sure you want to add this deposit?</p>
              <div className="bottom-buttons">
                <button
                  className="confirm-btn"
                  onClick={submitDeposit}
                >
                  Yes
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setConfirmModalVisible(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {successModalVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaCheckCircle className="confirm-icon" />
              <p className="modal-text">{successMessage}</p>
              <button className="confirm-btn" onClick={handleSuccessOk}>
                OK
              </button>
            </div>
          </div>
        )}

        {errorModalVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FiAlertCircle className="confirm-icon" />
              <p className="modal-text">{errorMessage}</p>
              <button className="cancel-btn" onClick={() => setErrorModalVisible(false)}>
                OK
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="centered-modal">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposits;