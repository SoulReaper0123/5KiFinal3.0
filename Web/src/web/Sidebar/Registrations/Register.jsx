import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaPlusCircle,
  FaCheckCircle
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, auth } from '../../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { sendMemberCredentialsEmail } from '../../../../../Server/api';

// Import your components
import Registrations from './Registrations';
import RejectedRegistrations from './RejectedRegistrations';
import ApprovedRegistrations from './ApprovedRegistrations';
import AllMembers from '../Members/AllMembers';
import PermanentWithdrawals from '../Withdraws/PermanentWithdraws';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
    return generateRandomPassword();
  }
  return pwd;
};

const Register = () => {
  const [activeSection, setActiveSection] = useState('registrations');
  const [registrations, setRegistrations] = useState([]);
  const [rejectedRegistrations, setRejectedRegistrations] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [members, setMembers] = useState([]);
  const [permanentWithdrawals, setPermanentWithdrawals] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [memberFilter, setMemberFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const pageSize = 10;

  // Add Member Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    civilStatus: '',
    age: '',
    dateOfBirth: '',
    placeOfBirth: '',
    address: '',
  });
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null);

  // Create style element and append to head
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
      .filter-container {
        position: relative;
        display: flex;
        align-items: center;
      }
      .filter-icon-button {
        padding: 6px;
        background: none;
        border: none;
        cursor: pointer;
        color: #2D5783;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .filter-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #fff;
        border-radius: 5px;
        border: 1px solid #ccc;
        min-width: 150px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 100;
      }
      .filter-dropdown-item {
        padding: 10px 12px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
      }
      .filter-text {
        color: #333;
        font-size: 14px;
      }
      .active-filter-item {
        background-color: #f0f7ff;
      }
      .active-filter-text {
        color: #2D5783;
        font-weight: bold;
        font-size: 14px;
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
        right: 20px;
        bottom: 20px;
        background-color: white;
        border-radius: 30px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        border: none;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        color: #2D5783;
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
        max-height: 80vh;
        background-color: #f9f9f9;
        padding: 24px;
        border-radius: 10px;
        width: 35%;
        max-width: 600px;
        overflow-y: auto;
      }
      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #001F3F;
        text-align: center;
      }
      .form-group {
        margin-bottom: 12px;
      }
      .form-label {
        font-weight: 600;
        margin-bottom: 4px;
        color: #001F3F;
        display: block;
      }
      .form-input {
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 10px;
        background-color: #fff;
        width: 100%;
        box-sizing: border-box;
      }
      .required {
        color: red;
      }
      .modal-button-container {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
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
        border-left-color: #001F3F;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .modal-scroll {
        max-height: 60vh;
        overflow-y: auto;
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
      const [regSnap, rejSnap, appSnap, membersSnap, withdrawalsSnap] = await Promise.all([
        database.ref('Registrations/RegistrationApplications').once('value'),
        database.ref('Registrations/RejectedRegistrations').once('value'),
        database.ref('Registrations/ApprovedRegistrations').once('value'),
        database.ref('Members').once('value'),
        database.ref('MembershipWithdrawal').once('value'),
      ]);

      const regData = regSnap.val() || {};
      const rejData = rejSnap.val() || {};
      const appData = appSnap.val() || {};
      const membersData = membersSnap.val() || {};
      const withdrawalsData = withdrawalsSnap.val() || {};

      const regArray = Object.keys(regData).map(key => ({ id: key, ...regData[key] }));
      const rejArray = Object.keys(rejData).map(key => ({ id: key, ...rejData[key] }));
      const appArray = Object.keys(appData).map(key => ({ id: key, ...appData[key] }));
      const membersArray = Object.keys(membersData).map(key => ({ id: key, ...membersData[key] }));
      const withdrawalsArray = Object.keys(withdrawalsData).map(key => ({ id: key, ...withdrawalsData[key] }));

      setRegistrations(regArray);
      setRejectedRegistrations(rejArray);
      setApprovedRegistrations(appArray);
      setMembers(membersArray);
      setPermanentWithdrawals(withdrawalsArray);
      
      // Update filtered data based on active section
      const newFilteredData = 
        activeSection === 'registrations' ? regArray :
        activeSection === 'rejectedRegistrations' ? rejArray :
        activeSection === 'approvedRegistrations' ? appArray :
        activeSection === 'permanentWithdrawals' ? withdrawalsArray :
        membersArray;
      
      setFilteredData(newFilteredData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeSection === 'members') {
      filterMembers();
    }
  }, [memberFilter, members, activeSection]);

  const filterMembers = () => {
    let filtered = members;
    
    if (memberFilter === 'active') {
      filtered = members.filter(member => member.status === 'active');
    } else if (memberFilter === 'inactive') {
      filtered = members.filter(member => member.status === 'inactive');
    }
    
    setFilteredData(filtered);
    setCurrentPage(0);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);

    const currentData =
      activeSection === 'registrations'
        ? registrations
        : activeSection === 'rejectedRegistrations'
        ? rejectedRegistrations
        : activeSection === 'approvedRegistrations'
        ? approvedRegistrations
        : activeSection === 'permanentWithdrawals'
        ? permanentWithdrawals
        : members;

    const filtered = currentData.filter(item => {
      const email = item.email?.toLowerCase() || '';
      const firstName = item.firstName?.toLowerCase() || '';
      const lastName = item.lastName?.toLowerCase() || '';
      const query = text.toLowerCase();
      return (
        email.includes(query) ||
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
        activeSection === 'rejectedRegistrations'
          ? 'RejectedRegistrations'
          : activeSection === 'approvedRegistrations'
          ? 'ApprovedRegistrations'
          : activeSection === 'members'
          ? 'Members'
          : activeSection === 'permanentWithdrawals'
          ? 'PermanentWithdrawals'
          : 'Registrations';

      if (dataToDownload.length === 0) {
        console.log('No data to download');
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
    setMemberFilter('all');
    const defaultData =
      section === 'registrations'
        ? registrations
        : section === 'rejectedRegistrations'
        ? rejectedRegistrations
        : section === 'approvedRegistrations'
        ? approvedRegistrations
        : section === 'permanentWithdrawals'
        ? permanentWithdrawals
        : members;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  const openAddModal = () => {
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setFormData({
      email: '',
      phoneNumber: '',
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      civilStatus: '',
      age: '',
      dateOfBirth: '',
      placeOfBirth: '',
      address: '',
    });
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFields = () => {
    if (!formData.email) {
      setErrorMessage('Email is required');
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
    return true;
  };

  const handleSubmitConfirmation = () => {
    if (!validateFields()) return;
    setPendingAdd({ ...formData });
    setConfirmModalVisible(true);
  };

  const submitManualMember = async () => {
    setConfirmModalVisible(false);
    setUploading(true);

    try {
      const password = generateRandomPassword();
      const { email, firstName, middleName, lastName, ...rest } = pendingAdd;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const membersSnap = await database.ref('Members').once('value');
      const membersData = membersSnap.val() || {};
      const existingIds = Object.keys(membersData).map(Number).sort((a, b) => a - b);
      
      let newId = 5001;
      for (const id of existingIds) {
        if (id === newId) newId++;
        else if (id > newId) break;
      }

      const now = new Date();
      const dateAdded = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeAdded = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const memberData = {
        id: newId,
        authUid: userId,
        email,
        firstName,
        middleName,
        lastName,
        ...rest,
        dateAdded,
        timeAdded,
        status: 'active',
        balance: 0.0,
        loans: 0.0
      };

      await database.ref(`Members/${newId}`).set(memberData);

      setSuccessMessage('Member added successfully!');
      setSuccessModalVisible(true);
      closeAddModal();

      // Refresh data after successful addition
      await fetchAllData();
      
      await callApiAddMember(memberData, password);
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorMessage(error.message || 'Failed to add member');
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const callApiAddMember = async (memberData, password) => {
    try {
      const response = await sendMemberCredentialsEmail({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        password,
        memberId: memberData.id,
        dateAdded: memberData.dateAdded
      });

      if (!response.ok) {
        throw new Error('Failed to send member credentials email');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    if (pendingAdd) {
      setPendingAdd(null);
    }
  };

  const handleRegistrationActionComplete = () => {
    // This will be passed to Registrations component to refresh data after approval/rejection
    fetchAllData();
  };

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const renderMemberFilter = () => {
    if (activeSection !== 'members') return null;

    return (
      <div className="filter-container">
        <button 
          className="filter-icon-button"
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <FaFilter />
        </button>

        {showFilterDropdown && (
          <div className="filter-dropdown-menu">
            <button 
              className={`filter-dropdown-item ${memberFilter === 'all' ? 'active-filter-item' : ''}`}
              onClick={() => {
                setMemberFilter('all');
                setShowFilterDropdown(false);
              }}
            >
              <span className={memberFilter === 'all' ? 'active-filter-text' : 'filter-text'}>All Members</span>
            </button>
            <button 
              className={`filter-dropdown-item ${memberFilter === 'active' ? 'active-filter-item' : ''}`}
              onClick={() => {
                setMemberFilter('active');
                setShowFilterDropdown(false);
              }}
            >
              <span className={memberFilter === 'active' ? 'active-filter-text' : 'filter-text'}>Active</span>
            </button>
            <button 
              className={`filter-dropdown-item ${memberFilter === 'inactive' ? 'active-filter-item' : ''}`}
              onClick={() => {
                setMemberFilter('inactive');
                setShowFilterDropdown(false);
              }}
            >
              <span className={memberFilter === 'inactive' ? 'active-filter-text' : 'filter-text'}>Inactive</span>
            </button>
          </div>
        )}
      </div>
    );
  };

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
        <h2 className="header-text">Membership</h2>

        <div className="top-controls">
          <div className="circle-tab-wrapper">
            {[
              { key: 'registrations', label: 'Pending', color: '#2D5783' },
              { key: 'rejectedRegistrations', label: 'Rejected', color: '#FF0000' },
              { key: 'approvedRegistrations', label: 'Approved', color: '#4CAF50' },
              { key: 'members', label: 'Members', color: '#2D5783' },
              { key: 'permanentWithdrawals', label: 'Membership Withdrawals', color: '#FF0000' },
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
            {renderMemberFilter()}
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
              {activeSection === 'registrations' && (
                <Registrations 
                  registrations={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={fetchAllData}
                />
              )}
              {activeSection === 'rejectedRegistrations' && (
                <RejectedRegistrations rejectedRegistrations={paginatedData} />
              )}
              {activeSection === 'approvedRegistrations' && (
                <ApprovedRegistrations approvedRegistrations={paginatedData} />
              )}
              {activeSection === 'members' && (
                <>
                  <AllMembers members={paginatedData} />
                  <button 
                    className="plus-button" 
                    onClick={openAddModal}
                  >
                    <FaPlusCircle />
                  </button>
                </>
              )}
              {activeSection === 'permanentWithdrawals' && (
                <PermanentWithdrawals withdrawals={paginatedData} />
              )}
            </>
          )}
        </div>

        {/* Add Member Modal */}
        {addModalVisible && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button onClick={closeAddModal} className="close-button">
                <AiOutlineClose />
              </button>
              <h3 className="modal-title">New Member</h3>
              
              <div className="modal-scroll">
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
                  <label className="form-label">Phone Number</label>
                  <input
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="form-input"
                    type="tel"
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
                  <label className="form-label">Middle Name</label>
                  <input
                    placeholder="Middle Name"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
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
                  <label className="form-label">Gender</label>
                  <input
                    placeholder="Gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Civil Status</label>
                  <input
                    placeholder="Civil Status"
                    value={formData.civilStatus}
                    onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="form-input"
                    type="number"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    placeholder="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="form-input"
                    type="date"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Birth Place</label>
                  <input
                    placeholder="Birth Place"
                    value={formData.placeOfBirth}
                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="form-input"
                    rows="3"
                  />
                </div>
                
                <div className="modal-button-container">
                  <button
                    className="modal-submit-button"
                    onClick={handleSubmitConfirmation}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="spinner"></div>
                    ) : (
                      'Add Member'
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
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModalVisible && (
          <div className="centered-modal">
            <div className="confirm-modal-card">
              <FiAlertCircle className="confirm-icon" />
              <p className="modal-text">Are you sure you want to add this member?</p>
              <div className="bottom-buttons">
                <button
                  className="confirm-btn"
                  onClick={submitManualMember}
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

        {/* Success Modal */}
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

        {/* Error Modal */}
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
      </div>
    </div>
  );
};

export default Register;