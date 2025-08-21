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
import { database, auth, storage } from '../../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendMemberCredentialsEmail } from '../../../../../Server/api';

// Import your components
import Registrations from './Registrations';
import RejectedRegistrations from './RejectedRegistrations';
import ApprovedRegistrations from './ApprovedRegistrations';
import AllMembers from '../Members/AllMembers';
import PermanentWithdrawals from '../Withdraws/PermanentWithdraws';

const genderOptions = [
  { key: 'Male', label: 'Male' },
  { key: 'Female', label: 'Female' }
];

const civilStatusOptions = [
  { key: 'Single', label: 'Single' },
  { key: 'Married', label: 'Married' },
  { key: 'Widowed', label: 'Widowed' },
  { key: 'Separated', label: 'Separated' }
];

const governmentIdOptions = [
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Drivers License' }
];

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

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const styles = {
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
  modalCard: {
    width: '40%',
    maxWidth: '800px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column'
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
    outline: 'none'
  },
  modalHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#2D5783',
    textAlign: 'center'
  },
  modalContent: {
    paddingBottom: '12px',
    overflowY: 'auto',
    flex: 1
  },
  formColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    flex: 1
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '20px',
    width: '100%'
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: '5px',
    display: 'block',
    fontSize: '14px',
    color: '#333'
  },
  requiredAsterisk: {
    color: 'red',
    marginLeft: '3px'
  },
  formInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontSize: '14px'
  },
  formSelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    fontSize: '14px'
  },
  fileInputLabel: {
    display: 'block',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '14px',
    color: '#495057'
  },
  fileInput: {
    display: 'none'
  },
  bottomButtons: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eee'
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
    outline: 'none'
  }
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
    governmentId: ''
  });
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [validIdBackFile, setValidIdBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState([]);

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
      .image-viewer-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        alignItems: center;
        z-index: 2000;
      }
      .image-viewer-content {
        position: relative;
        width: 90%;
        max-width: 800px;
        display: flex;
        flex-direction: column;
        alignItems: center;
      }
      .large-image {
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: 4px;
      }
      .image-viewer-label {
        color: white;
        font-size: 18px;
        margin-top: 16px;
        text-align: center;
      }
      .image-viewer-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
        background-color: transparent;
        border: none;
        outline: none;
      }
      .image-viewer-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 16px;
        background-color: transparent;
        border: none;
        outline: none;
      }
      .prev-button {
        left: 50px;
      }
      .next-button {
        right: 50px;
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
      governmentId: ''
    });
    setValidIdFrontFile(null);
    setValidIdBackFile(null);
    setSelfieFile(null);
    setSelfieWithIdFile(null);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
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
    if (!formData.phoneNumber) {
      setErrorMessage('Phone number is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.gender) {
      setErrorMessage('Gender is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.civilStatus) {
      setErrorMessage('Civil status is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.placeOfBirth) {
      setErrorMessage('Place of birth is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.address) {
      setErrorMessage('Address is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!formData.governmentId) {
      setErrorMessage('Government ID is required');
      setErrorModalVisible(true);
      return false;
    }
    if (!validIdFrontFile || !validIdBackFile || !selfieFile || !selfieWithIdFile) {
      setErrorMessage('All image uploads are required');
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

      // Upload images
      const validIdFrontUrl = await uploadImageToStorage(
        validIdFrontFile, 
        `member_docs/${newId}/valid_id_front_${Date.now()}`
      );
      const validIdBackUrl = await uploadImageToStorage(
        validIdBackFile, 
        `member_docs/${newId}/valid_id_back_${Date.now()}`
      );
      const selfieUrl = await uploadImageToStorage(
        selfieFile, 
        `member_docs/${newId}/selfie_${Date.now()}`
      );
      const selfieWithIdUrl = await uploadImageToStorage(
        selfieWithIdFile, 
        `member_docs/${newId}/selfie_with_id_${Date.now()}`
      );

      const memberData = {
        id: newId,
        authUid: userId,
        email,
        firstName,
        middleName: middleName || '',
        lastName,
        ...rest,
        dateAdded,
        timeAdded,
        status: 'active',
        balance: 0.0,
        loans: 0.0,
        validIdFront: validIdFrontUrl,
        validIdBack: validIdBackUrl,
        selfie: selfieUrl,
        selfieWithId: selfieWithIdUrl
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

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (pendingAdd?.validIdFront) {
      images.push({ 
        url: pendingAdd.validIdFront, 
        label: 'Valid ID Front' 
      });
    }
    if (pendingAdd?.validIdBack) {
      images.push({ 
        url: pendingAdd.validIdBack, 
        label: 'Valid ID Back' 
      });
    }
    if (pendingAdd?.selfie) {
      images.push({ 
        url: pendingAdd.selfie, 
        label: 'Selfie' 
      });
    }
    if (pendingAdd?.selfieWithId) {
      images.push({ 
        url: pendingAdd.selfieWithId, 
        label: 'Selfie with ID' 
      });
    }

    setAvailableImages(images);
    setCurrentImage({ url, label });
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setCurrentImage({ url: '', label: '' });
    setCurrentImageIndex(0);
  };

  const navigateImages = (direction) => {
    if (availableImages.length === 0) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = (currentImageIndex - 1 + availableImages.length) % availableImages.length;
    } else {
      newIndex = (currentImageIndex + 1) % availableImages.length;
    }

    setCurrentImageIndex(newIndex);
    setCurrentImage(availableImages[newIndex]);
  };

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

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

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
                    <FaPlus className="plus-icon" />
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
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button 
                onClick={closeAddModal}
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>New Member</h2>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.formColumns}>
                  <div style={styles.formColumn}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        First Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Last Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Email<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        type="email"
                        autoCapitalize="none"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Birth Place<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Birth Place"
                        value={formData.placeOfBirth}
                        onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Gender<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        {genderOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Date of Birth<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        type="date"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Valid ID Front<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <label style={styles.fileInputLabel}>
                        {validIdFrontFile ? validIdFrontFile.name : "Choose file"}
                        <input
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setValidIdFrontFile)}
                          accept="image/*"
                        />
                      </label>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Selfie<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <label style={styles.fileInputLabel}>
                        {selfieFile ? selfieFile.name : "Choose file"}
                        <input
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setSelfieFile)}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>

                  <div style={styles.formColumn}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Middle Name
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Middle Name"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Phone Number<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        type="tel"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Address<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Age<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Age"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        type="number"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Civil Status<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={formData.civilStatus}
                        onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                      >
                        <option value="">Select Civil Status</option>
                        {civilStatusOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Government ID<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={formData.governmentId}
                        onChange={(e) => handleInputChange('governmentId', e.target.value)}
                      >
                        <option value="">Select Government ID</option>
                        {governmentIdOptions.map((option) => (
                          <option key={option.key} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Valid ID Back<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <label style={styles.fileInputLabel}>
                        {validIdBackFile ? validIdBackFile.name : "Choose file"}
                        <input
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setValidIdBackFile)}
                          accept="image/*"
                        />
                      </label>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Selfie with ID<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <label style={styles.fileInputLabel}>
                        {selfieWithIdFile ? selfieWithIdFile.name : "Choose file"}
                        <input
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setSelfieWithIdFile)}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div style={styles.bottomButtons}>
                  <button 
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#2D5783',
                      color: '#FFF'
                    }}
                    onClick={handleSubmitConfirmation}
                    disabled={uploading}
                  >
                    {uploading ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#6c757d',
                      color: '#FFF'
                    }}
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

        {/* Image Viewer Modal */}
        {imageViewerVisible && (
          <div className="image-viewer-modal">
            <div className="image-viewer-content">
              <button 
                className="image-viewer-nav prev-button"
                onClick={() => navigateImages('prev')}
              >
                <FaChevronLeft />
              </button>
              <img
                src={currentImage.url}
                alt={currentImage.label}
                className="large-image"
              />
              <button 
                className="image-viewer-nav next-button"
                onClick={() => navigateImages('next')}
              >
                <FaChevronRight />
              </button>
              <button 
                className="image-viewer-close" 
                onClick={closeImageViewer}
              >
                <FaTimes />
              </button>
              <p className="image-viewer-label">{currentImage.label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;