import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaFileAlt,
  FaPrint
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
import logoImage from '../../../../../assets/logo.png';

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
  { key: 'drivers_license', label: 'Drivers License' },
  { key: 'other', label: 'Others' }
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

// Add this function in your Register component, after the generateRandomPassword function
const validatePhoneNumber = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, message: 'Phone number is required' };
  }
  if (digits.length !== 11) {
    return { isValid: false, message: 'Phone number must be exactly 11 digits' };
  }
  return { isValid: true, message: '' };
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
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0',
    overflow: 'hidden'
  },
  mainContainer: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0
  },
  headerText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '4px'
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    width: '100%'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    flexWrap: 'wrap',
    flex: '1',
    minWidth: '0'
  },
  tabButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: 'transparent',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  activeTabButton: {
    backgroundColor: '#fff',
    color: '#1e40af',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tabIcon: {
    fontSize: '16px'
  },
  searchPrintContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: '10',
    flexShrink: '0'
  },
  filterContainer: {
    position: 'relative'
  },
  filterButton: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  filterButtonHover: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: '100',
    marginTop: '4px'
  },
  filterOption: {
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activeFilterOption: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontWeight: '600'
  },
  searchContainer: {
    position: 'relative',
    width: '280px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  searchInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: '1'
  },
  printButton: {
    padding: '10px 16px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  printButtonHover: {
    backgroundColor: '#b91c1c'
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '80px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },
  dataContent: {
    flex: 1,
    overflow: 'auto'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '40px',
    flexShrink: 0
  },
  paginationInfo: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  paginationButton: {
    padding: '4px 8px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '10px',
    minWidth: '24px',
    minHeight: '24px'
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb'
  },
  addMemberButton: {
    position: 'fixed',
    right: '32px',
    bottom: '32px',
    backgroundColor: '#1e40af',
    color: '#fff',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(30, 64, 175, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: '100',
    fontSize: '18px'
  },
  addMemberButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 15px 30px rgba(30, 64, 175, 0.4)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonHover: {
    backgroundColor: '#f1f5f9',
    color: '#374151'
  },
  modalContent: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formSection: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  requiredAsterisk: {
    color: '#dc2626',
    marginLeft: '2px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  formInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  fileUploadSection: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fileUploadSectionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff'
  },
  fileInput: {
    display: 'none'
  },
  fileUploadText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px',
    textAlign: 'center'
  },
  fileName: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500',
    marginTop: '4px',
    textAlign: 'center',
    wordBreak: 'break-word'
  },
  modalActions: {
    padding: '24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  primaryButtonHover: {
    backgroundColor: '#1e3a8a'
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap'
  },
  secondaryButtonHover: {
    backgroundColor: '#4b5563'
  },
  dashboardLoadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '90vh',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '16px'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '16px',
    fontWeight: '500'
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#d1d5db'
  },
  noDataText: {
    fontSize: '16px',
    margin: 0
  },
  printModalContent: {
    padding: '24px',
    textAlign: 'center'
  },
  printOption: {
    padding: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '12px',
    width: '100%'
  },
  printOptionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  printOptionText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  printOptionDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
 // Add these EXACT styles to your Register component's style object
modalCardSmall: {
  width: '300px',
  backgroundColor: 'white',
  borderRadius: '14px',
  padding: '20px',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  textAlign: 'center',
  border: '1px solid #F1F5F9'
},
confirmIcon: {
  marginBottom: '14px',
  fontSize: '28px'
},
modalText: {
  fontSize: '14px',
  marginBottom: '18px',
  textAlign: 'center',
  color: '#475569',
  lineHeight: '1.5',
  fontWeight: '500'
},
actionButton: {
  padding: '0.75rem 2rem',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s ease',
  minWidth: '140px'
},
disabledButton: {
  background: '#9ca3af',
  cursor: 'not-allowed',
  opacity: '0.7',
  '&:hover': {
    transform: 'none',
    boxShadow: 'none'
  }
},
loadingSpinnerOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 3000,
  backdropFilter: 'blur(4px)'
},
loadingSpinner: {
  border: '4px solid #f3f4f6',
  borderLeft: '4px solid #2563eb',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite'
},
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
  const [isHovered, setIsHovered] = useState({});
  const [phoneNumberError, setPhoneNumberError] = useState('');

  // Add Member Modal State - ONLY FIELDS THAT MATCH YOUR APP
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    address: '',
    governmentId: '',
    registrationFee: '',
    attendedOrientation: true,
    orientationCode: ''
  });
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);
  const [minRegistrationFee, setMinRegistrationFee] = useState(5000);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(null);

  // Print Modal State
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState(null);

  // Admin data for print report
const [adminData, setAdminData] = useState(null);
// Fetch admin data for print report
useEffect(() => {
  const fetchAdminData = async () => {
    try {
      const adminId = localStorage.getItem('adminId');
      if (!adminId) return;

      const role = localStorage.getItem('userRole') || 'admin';
      const node = role === 'superadmin' ? 'Users/SuperAdmin' : 
                  role === 'coadmin' ? 'Users/CoAdmin' : 'Users/Admin';
      
      const adminRef = database.ref(`${node}/${adminId}`);
      const snapshot = await adminRef.once('value');
      
      if (snapshot.exists()) {
        setAdminData(snapshot.val());
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  fetchAdminData();
}, []);

  const pageSize = 10;

  // Tab configuration
  const tabs = [
    { 
      key: 'registrations', 
      label: 'Pending', 
      icon: FaFileAlt,
      color: '#f59e0b'
    },
    { 
      key: 'rejectedRegistrations', 
      label: 'Rejected', 
      icon: FaUserTimes,
      color: '#dc2626'
    },
    { 
      key: 'members', 
      label: 'Members', 
      icon: FaUser,
      color: '#1e40af'
    },
    { 
      key: 'permanentWithdrawals', 
      label: 'Withdrawals', 
      icon: FaUserTimes,
      color: '#7c3aed'
    }
  ];

  // Create style element and append to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handlePhoneNumberChange = (value) => {
  // Remove any non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const limitedDigits = digitsOnly.slice(0, 11);
  
  // Update the form data
  setFormData(prev => ({
    ...prev,
    phoneNumber: limitedDigits
  }));
  
  // Validate and show error message
  const validation = validatePhoneNumber(limitedDigits);
  setPhoneNumberError(validation.message);
};


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
    // fetch minimum registration fee from Settings if available
    (async () => {
      try {
        const feeSnap = await database.ref('Settings/RegistrationMinimumFee').once('value');
        const val = feeSnap.val();
        const num = parseFloat(val);
        if (!isNaN(num)) setMinRegistrationFee(num);
      } catch (e) {
        console.warn('Failed to fetch minimum registration fee, using default.', e);
      }
    })();
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

const handlePrint = (format = 'print') => {
  setPrinting(true);
  
  try {
    const sectionTitle = 
      activeSection === 'registrations' ? 'Pending Registrations' :
      activeSection === 'rejectedRegistrations' ? 'Rejected Registrations' :
      activeSection === 'approvedRegistrations' ? 'Approved Registrations' :
      activeSection === 'members' ? 'Members' : 'Permanent Withdrawals';

    // Get the data that's currently displayed in the table (paginated)
    const displayedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const printContent = document.createElement('div');
    printContent.className = 'print-content';
    printContent.style.padding = '20px';
    printContent.style.fontFamily = 'Arial, sans-serif';
    printContent.style.boxSizing = 'border-box';
    printContent.style.margin = '0';

    // Create your custom header - MATCHING DEPOSITS STRUCTURE
    const header = document.createElement('div');
    header.className = 'print-header';
    header.style.borderBottom = '2px solid #333';
    header.style.paddingBottom = '15px';
    header.style.marginBottom = '20px';
    header.style.boxSizing = 'border-box';

    // Logo and Report Title (Centered) - LIKE DEPOSITS
    const logoSection = document.createElement('div');
    logoSection.style.textAlign = 'center';
    logoSection.style.marginBottom = '15px';

    // Add logo image (using the same logoImage import as Deposits)
    // If you don't have logoImage imported, add this at the top with other imports:
    // import logoImage from '../../../../../assets/logo.png';
    const logoImg = document.createElement('img');
    logoImg.src = logoImage;
    logoImg.style.width = '80px';
    logoImg.style.height = '80px';
    logoImg.style.marginBottom = '5px';
    logoImg.style.display = 'block';
    logoImg.style.marginLeft = 'auto';
    logoImg.style.marginRight = 'auto';

    const logo = document.createElement('div');
    logo.textContent = '5Ki Financial Services';
    logo.style.fontSize = '24px';
    logo.style.fontWeight = 'bold';
    logo.style.color = '#1e40af';
    logo.style.marginBottom = '5px';

    const reportTitle = document.createElement('div');
    reportTitle.textContent = `${sectionTitle} Report`;
    reportTitle.style.fontSize = '20px';
    reportTitle.style.fontWeight = 'bold';
    reportTitle.style.marginBottom = '15px';

    logoSection.appendChild(logoImg);
    logoSection.appendChild(logo);
    logoSection.appendChild(reportTitle);

    // Info Row (Generated Date on left, Prepared By on right) - LIKE DEPOSITS
    const infoRow = document.createElement('div');
    infoRow.style.display = 'flex';
    infoRow.style.justifyContent = 'space-between';
    infoRow.style.alignItems = 'flex-start';
    infoRow.style.fontSize = '14px';
    infoRow.style.marginBottom = '10px';
    infoRow.style.boxSizing = 'border-box';

    // Left side - Generated Date
    const generatedDate = document.createElement('div');
    generatedDate.style.textAlign = 'left';
    generatedDate.style.flex = '1';
    generatedDate.innerHTML = `
      <strong>Generated as of:</strong><br>
      ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
    `;

    // Right side - Prepared By
    const preparedBy = document.createElement('div');
    preparedBy.style.textAlign = 'right';
    preparedBy.style.flex = '1';
    const adminFirstName = adminData?.firstName || 'Admin';
    const adminRole = localStorage.getItem('userRole') || 'Admin';
    preparedBy.innerHTML = `
      <strong>Prepared by:</strong><br>
      <span style="font-weight: bold;">${adminFirstName}</span><br>
      <em>${adminRole.charAt(0).toUpperCase() + adminRole.slice(1)}</em>
    `;

    infoRow.appendChild(generatedDate);
    infoRow.appendChild(preparedBy);

    // Report Details
    const reportDetails = document.createElement('div');
    reportDetails.style.textAlign = 'center';
    reportDetails.style.marginBottom = '15px';
    reportDetails.style.fontSize = '14px';
    reportDetails.style.color = '#666';
    reportDetails.innerHTML = `
      <strong>Displayed Records: ${displayedData.length} (Page ${currentPage + 1} of ${Math.ceil(filteredData.length / pageSize)})</strong>
    `;

    header.appendChild(logoSection);
    header.appendChild(infoRow);
    header.appendChild(reportDetails);
    printContent.appendChild(header);

    // Table creation code remains the same...
    if (displayedData.length > 0) {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '20px';
      table.style.boxSizing = 'border-box';

      // Table Header - Define columns based on active section (excluding Action column)
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#f8f9fa';
      
      // Define columns for each section (excluding the Action/View column)
      let headers = [];
      
      switch(activeSection) {
        case 'registrations':
          headers = ['Full Name', 'Email Address', 'Contact Number', 'Status'];
          break;
        case 'rejectedRegistrations':
          headers = ['Full Name', 'Email Address', 'Contact Number', 'Status'];
          break;
        case 'approvedRegistrations':
          headers = ['Email', 'Contact', 'First Name', 'Last Name', 'Date Applied', 'Date Approved'];
          break;
        case 'members':
          headers = ['Member ID', 'Name', 'Investment', 'Savings', 'Loans'];
          break;
        case 'permanentWithdrawals':
          headers = ['Member ID', 'Full Name', 'Balance', 'Reason', 'Status'];
          break;
        default:
          headers = [];
      }

      // Create header cells
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '12px 8px';
        th.style.border = '1px solid #ddd';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        th.style.backgroundColor = '#e9ecef';
        th.style.boxSizing = 'border-box';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement('tbody');
      displayedData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
        
        headers.forEach(header => {
          const td = document.createElement('td');
          let cellValue = '';
          
          // Handle data extraction based on header and active section
          switch(header) {
            case 'Full Name':
              cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
              break;
            case 'Name':
              cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
              break;
            case 'Email Address':
            case 'Email':
              cellValue = item.email || '';
              break;
            case 'Contact Number':
            case 'Contact':
              cellValue = item.phoneNumber || '';
              break;
            case 'Status':
              cellValue = item.status || 'pending';
              break;
            case 'First Name':
              cellValue = item.firstName || '';
              break;
            case 'Last Name':
              cellValue = item.lastName || '';
              break;
            case 'Date Applied':
              cellValue = item.dateCreated || item.dateApplied || '';
              break;
            case 'Date Approved':
              cellValue = item.dateApproved || '';
              break;
            case 'Member ID':
              cellValue = item.memberId || item.id || '';
              break;
            case 'Investment':
              cellValue = `₱${(parseFloat(item.investment) || 0).toFixed(2)}`;
              break;
            case 'Savings':
              cellValue = `₱${(parseFloat(item.balance) || 0).toFixed(2)}`;
              break;
            case 'Loans':
              cellValue = `₱${(parseFloat(item.loans) || 0).toFixed(2)}`;
              break;
            case 'Balance':
              cellValue = `₱${(parseFloat(item.balance) || 0).toFixed(2)}`;
              break;
            case 'Reason':
              cellValue = item.reason || '';
              break;
            default:
              cellValue = item[header] || '';
          }
          
          td.textContent = cellValue;
          td.style.padding = '10px 8px';
          td.style.border = '1px solid #ddd';
          td.style.fontSize = '12px';
          td.style.boxSizing = 'border-box';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      printContent.appendChild(table);
    } else {
      const noData = document.createElement('p');
      noData.textContent = 'No data available';
      noData.style.textAlign = 'center';
      noData.style.color = '#666';
      noData.style.fontStyle = 'italic';
      printContent.appendChild(noData);
    }

    // Create a hidden iframe for printing to avoid browser headers - LIKE DEPOSITS
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    let printDocument = printFrame.contentWindow || printFrame.contentDocument;
    if (printDocument.document) {
      printDocument = printDocument.document;
    }

    // Write the print content to the iframe with CSS to remove headers/footers
    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sectionTitle} Report</title>
          <style>
            /* Reset all margins and remove browser headers/footers */
            @page {
              margin: 0.5in !important;
              size: auto;
              margin-header: 0 !important;
              margin-footer: 0 !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
            }
            
            .print-content {
              margin: 0 !important;
              padding: 20px;
            }
            
            /* Hide any potential browser elements */
            header, footer, .header, .footer {
              display: none !important;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printDocument.close();

    // Wait for content to load then print
    printFrame.onload = function() {
      try {
        if (format === 'pdf') {
          printFrame.contentWindow.print();

          // Export to Excel - LIKE DEPOSITS (REMOVED WORD OPTION)
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(sectionTitle);

          if (displayedData.length > 0) {
            // Define headers for Excel based on active section
            let excelHeaders = [];
            
            switch(activeSection) {
              case 'registrations':
                excelHeaders = ['Full Name', 'Email Address', 'Contact Number', 'Status'];
                break;
              case 'rejectedRegistrations':
                excelHeaders = ['Full Name', 'Email Address', 'Contact Number', 'Status'];
                break;
              case 'approvedRegistrations':
                excelHeaders = ['Email', 'Contact', 'First Name', 'Last Name', 'Date Applied', 'Date Approved'];
                break;
              case 'members':
                excelHeaders = ['Member ID', 'Name', 'Investment', 'Savings', 'Loans'];
                break;
              case 'permanentWithdrawals':
                excelHeaders = ['Member ID', 'Full Name', 'Balance', 'Reason', 'Status'];
                break;
              default:
                excelHeaders = [];
            }

            worksheet.addRow(excelHeaders);

            displayedData.forEach(item => {
              const row = [];
              excelHeaders.forEach(header => {
                let cellValue = '';
                
                switch(header) {
                  case 'Full Name':
                    cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                    break;
                  case 'Name':
                    cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                    break;
                  case 'Email Address':
                  case 'Email':
                    cellValue = item.email || '';
                    break;
                  case 'Contact Number':
                  case 'Contact':
                    cellValue = item.phoneNumber || '';
                    break;
                  case 'Status':
                    cellValue = item.status || 'pending';
                    break;
                  case 'First Name':
                    cellValue = item.firstName || '';
                    break;
                  case 'Last Name':
                    cellValue = item.lastName || '';
                    break;
                  case 'Date Applied':
                    cellValue = item.dateCreated || item.dateApplied || '';
                    break;
                  case 'Date Approved':
                    cellValue = item.dateApproved || '';
                    break;
                  case 'Member ID':
                    cellValue = item.memberId || item.id || '';
                    break;
                  case 'Investment':
                    cellValue = parseFloat(item.investment) || 0;
                    break;
                  case 'Savings':
                    cellValue = parseFloat(item.balance) || 0;
                    break;
                  case 'Loans':
                    cellValue = parseFloat(item.loans) || 0;
                    break;
                  case 'Balance':
                    cellValue = parseFloat(item.balance) || 0;
                    break;
                  case 'Reason':
                    cellValue = item.reason || '';
                    break;
                  default:
                    cellValue = item[header] || '';
                }
                
                row.push(cellValue);
              });
              worksheet.addRow(row);
            });
          }

          workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          });
        } else {
          // Direct print
          printFrame.contentWindow.print();
        }
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
          setPrintModalVisible(false);
          setPrinting(false);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        document.body.removeChild(printFrame);
        setPrinting(false);
      }
    };

  } catch (error) {
    console.error('Error printing data:', error);
    setErrorMessage('Failed to print data');
    setErrorModalVisible(true);
    setPrinting(false);
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
      dateOfBirth: '',
      placeOfBirth: '',
      address: '',
      governmentId: '',
      registrationFee: '',
      attendedOrientation: true,
      orientationCode: ''
    });
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setProofOfPaymentFile(null);
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
    if (!validIdFrontFile || !selfieFile) {
      setErrorMessage('Valid ID Front and Selfie are required');
      setErrorModalVisible(true);
      return false;
    }
    // Amount and proof validation (like App RegistrationFeePage)
    const amt = parseFloat(formData.registrationFee);
    if (isNaN(amt) || amt < parseFloat(minRegistrationFee)) {
      setErrorMessage(`Minimum registration fee is ₱${minRegistrationFee.toFixed(2)}`);
      setErrorModalVisible(true);
      return false;
    }
    if (!proofOfPaymentFile) {
      setErrorMessage('Proof of payment is required');
      setErrorModalVisible(true);
      return false;
    }
      if (!formData.phoneNumber) {
    setErrorMessage('Phone number is required');
    setErrorModalVisible(true);
    return false;
  }
  
  // Add phone number validation
  const phoneValidation = validatePhoneNumber(formData.phoneNumber);
  if (!phoneValidation.isValid) {
    setErrorMessage(phoneValidation.message);
    setErrorModalVisible(true);
    return false;
  }
    return true;
  };

const handleSubmitConfirmation = () => {
  // Validate phone number first
  const phoneValidation = validatePhoneNumber(formData.phoneNumber);
  if (!phoneValidation.isValid) {
    setErrorMessage(phoneValidation.message);
    setErrorModalVisible(true);
    return;
  }
  
  // Then validate other fields
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
  
  const toPeso = (n) => `₱${Number(n).toFixed(2)}`;

  const createRegistrationTransaction = async (memberData, registrationFee) => {
  try {
    const now = new Date();
    const transactionData = {
      type: 'registration',
      amount: parseFloat(registrationFee),
      dateApplied: memberData.dateAdded || '',
      dateApproved: memberData.dateAdded, // Use the same date since it's auto-approved
      approvedTime: memberData.timeAdded,
      timestamp: now.getTime(),
      status: 'approved',
      memberId: memberData.id,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      transactionId: `REG-${Date.now()}`,
      description: 'Registration fee payment - Manual Admin Addition'
    };

    // Create transaction record
    await database.ref(`Transactions/Registrations/${memberData.id}/${transactionData.transactionId}`).set(transactionData);
    
    console.log('Transaction record created successfully');
  } catch (error) {
    console.error('Error creating transaction record:', error);
    throw error;
  }
};

const submitManualMember = async () => {
  setConfirmModalVisible(false);
  setActionInProgress(true);
  setCurrentAction('add');

  try {
    // Show success modal immediately (like Registrations)
    setSuccessMessage('Member added successfully!');
    setSuccessModalVisible(true);
    
    // Store the data for processing after success modal
    setPendingApiCall({
      type: 'add',
      data: { ...formData, validIdFrontFile, selfieFile, proofOfPaymentFile }
    });

  } catch (error) {
    console.error('Error preparing member data:', error);
    setErrorMessage('Failed to prepare member data');
    setErrorModalVisible(true);
    setActionInProgress(false);
  }
};
  const updateFunds = async (amount) => {
    try {
      const fundsRef = database.ref('Settings/Funds');
      const snapshot = await fundsRef.once('value');
      const currentFunds = snapshot.val() || 0;
      const newFundsAmount = currentFunds + parseFloat(amount);
      
      await fundsRef.set(newFundsAmount);
      
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0];
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
      await fundsHistoryRef.set(newFundsAmount);
      
    } catch (error) {
      console.error('Error updating funds:', error);
      throw error;
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

const handleSuccessOk = async () => {
  // Close success modal and show loading spinner
  setSuccessModalVisible(false);
  setIsProcessing(true);

  try {
    // Process the actual database operations (like Registrations)
    if (pendingApiCall && pendingApiCall.type === 'add') {
      const { data } = pendingApiCall;
      const password = generateRandomPassword();
      const { email, firstName, middleName, lastName, registrationFee, ...rest } = data;
      
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
        data.validIdFrontFile, 
        `member_docs/${newId}/valid_id_front_${Date.now()}`
      );
      const selfieUrl = await uploadImageToStorage(
        data.selfieFile, 
        `member_docs/${newId}/selfie_${Date.now()}`
      );
      const proofOfPaymentUrl = await uploadImageToStorage(
        data.proofOfPaymentFile,
        `member_docs/${newId}/registration_payment_proof_${Date.now()}`
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
        balance: parseFloat(registrationFee) || 0,
        investment: parseFloat(registrationFee) || 0,
        loans: 0.0,
        validIdFront: validIdFrontUrl,
        selfie: selfieUrl,
        registrationFee: parseFloat(registrationFee),
        registrationPaymentProof: proofOfPaymentUrl,
        attendedOrientation: true,
        orientationCode: 'ADMIN_ADDED'
      };

      // STEP 1: Save member to database
      await database.ref(`Members/${newId}`).set(memberData);

      // STEP 2: Create transaction record (EXACTLY LIKE REGISTRATIONS)
      const transactionData = {
        type: 'registration',
        amount: parseFloat(registrationFee),
        dateApplied: dateAdded, // Use the dateAdded as application date
        dateApproved: dateAdded, // For admin-added members, approved immediately
        approvedTime: timeAdded,
        timestamp: now.getTime(),
        status: 'approved',
        memberId: newId,
        firstName,
        lastName,
        email,
        transactionId: `REG-${Date.now()}`,
        description: 'Registration fee payment - Admin Added'
      };

      // STEP 3: Save transaction to Transactions/Registrations (EXACTLY LIKE REGISTRATIONS)
      await database.ref(`Transactions/Registrations/${newId}/${transactionData.transactionId}`).set(transactionData);

      // STEP 4: Update funds
      await updateFunds(registrationFee);

      // STEP 5: Call API in background (like Registrations)
      try {
        await callApiAddMember(memberData, password);
      } catch (apiError) {
        console.error('Background API error:', apiError);
        // Don't show error to user - this is background process
      }

      // STEP 6: Refresh data (like Registrations)
      await fetchAllData();
    }

  } catch (error) {
    console.error('Error adding member:', error);
    setErrorMessage(error.message || 'Failed to add member');
    setErrorModalVisible(true);
  } finally {
    // Clean up and close everything
    closeAddModal();
    setPendingAdd(null);
    setPendingApiCall(null);
    setIsProcessing(false);
    setActionInProgress(false);
  }
};

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const renderMemberFilter = () => {
    if (activeSection !== 'members') return null;

    return (
      <div style={styles.filterContainer}>
        <button 
          style={{
            ...styles.filterButton,
            ...(isHovered.filterButton ? styles.filterButtonHover : {})
          }}
          onMouseEnter={() => handleMouseEnter('filterButton')}
          onMouseLeave={() => handleMouseLeave('filterButton')}
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <FaFilter />
          <span>{memberFilter === 'all' ? 'All Members' : memberFilter === 'active' ? 'Active' : 'Inactive'}</span>
        </button>

        {showFilterDropdown && (
          <div style={styles.filterDropdown}>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'all' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('all');
                setShowFilterDropdown(false);
              }}
            >
              <FaUser />
              <span>All Members</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'active' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('active');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserCheck />
              <span>Active</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'inactive' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('inactive');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserTimes />
              <span>Inactive</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.safeAreaView}>
        <div style={styles.mainContainer}>
          <div style={styles.dashboardLoadingContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>Loading membership data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Membership Management</h1>
            <p style={styles.headerSubtitle}>
              Manage member registrations, approvals, and withdrawals
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Left side */}
            <div style={styles.tabContainer}>
              {tabs.map((tab) => {
                const isActive = activeSection === tab.key;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabSwitch(tab.key)}
                    style={{
                      ...styles.tabButton,
                      ...(isActive ? styles.activeTabButton : {})
                    }}
                    className="hover-lift"
                  >
                    <IconComponent style={styles.tabIcon} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search, Filter, Print - Right side */}
            <div style={styles.searchPrintContainer}>
              {renderMemberFilter()}
              
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => handleMouseEnter('search')}
                  onBlur={() => handleMouseLeave('search')}
                />
              </div>

              <button 
                style={{
                  ...styles.printButton,
                  ...(isHovered.print ? styles.printButtonHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('print')}
                onMouseLeave={() => handleMouseLeave('print')}
                onClick={() => setPrintModalVisible(true)}
                title="Print/Export Options"
              >
                <FaPrint />
              </button>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div style={styles.dataContainer}>
          {/* Pagination at the top */}
          {!noMatch && filteredData.length > 0 && (
            <div style={styles.paginationContainer}>
              <span style={styles.paginationInfo}>
                {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredData.length)} of {filteredData.length}
              </span>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 0 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages - 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}

          <div style={styles.dataContent}>
            {noMatch ? (
              <div style={styles.noDataContainer}>
                <FaSearch style={styles.noDataIcon} />
                <p style={styles.noDataText}>No matches found for your search</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div style={styles.noDataContainer}>
                <FaFileAlt style={styles.noDataIcon} />
                <p style={styles.noDataText}>No data available</p>
              </div>
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
                  <AllMembers members={paginatedData} />
                )}
                {activeSection === 'permanentWithdrawals' && (
                  <PermanentWithdrawals withdrawals={paginatedData} refreshData={fetchAllData} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Member Button - Only show on Members tab */}
        {activeSection === 'members' && (
          <button 
            style={{
              ...styles.addMemberButton,
              ...(isHovered.addMember ? styles.addMemberButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('addMember')}
            onMouseLeave={() => handleMouseLeave('addMember')}
            onClick={openAddModal}
            className="hover-lift"
          >
            <FaPlus />
          </button>
        )}

        {/* Print Modal */}
        {printModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setPrintModalVisible(false)}>
            <div style={{...styles.modalCard, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Print/Export Options</h2>
                <button 
                  onClick={() => setPrintModalVisible(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closePrintModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closePrintModal')}
                  onMouseLeave={() => handleMouseLeave('closePrintModal')}
                  disabled={printing}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={styles.printModalContent}>
                <p style={{margin: '0 0 20px 0', color: '#64748b'}}>
                  Choose how you want to export the currently displayed {paginatedData.length} records:
                </p>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printDirect ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printDirect')}
                  onMouseLeave={() => handleMouseLeave('printDirect')}
                  onClick={() => handlePrint('print')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Print Directly</p>
                  <p style={styles.printOptionDescription}>
                    Send directly to your printer
                  </p>
                </button>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printPDF ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printPDF')}
                  onMouseLeave={() => handleMouseLeave('printPDF')}
                  onClick={() => handlePrint('pdf')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Save as PDF</p>
                  <p style={styles.printOptionDescription}>
                    Download as PDF file
                  </p>
                </button>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printExcel ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printExcel')}
                  onMouseLeave={() => handleMouseLeave('printExcel')}
                  onClick={() => handlePrint('excel')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Export to Excel</p>
                  <p style={styles.printOptionDescription}>
                    Download as Excel spreadsheet
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay} onClick={closeAddModal}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Register New Member</h2>
                <button 
                  onClick={closeAddModal}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closeModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeModal')}
                  onMouseLeave={() => handleMouseLeave('closeModal')}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.formGrid}>
                  {/* Left Column */}
                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        First Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Last Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Email Address<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        type="email"
                        autoCapitalize="none"
                      />
                    </div>

<div style={styles.formSection}>
  <label style={styles.formLabel}>
    Phone Number<span style={styles.requiredAsterisk}>*</span>
  </label>
  <input
    style={{
      ...styles.formInput,
      ...(phoneNumberError ? styles.errorInput : {})
    }}
    placeholder="Enter 11-digit phone number"
    value={formData.phoneNumber}
    onChange={(e) => handlePhoneNumberChange(e.target.value)}
    type="tel"
    maxLength="11" // This helps with visual feedback
  />
  {phoneNumberError && (
    <div style={{
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
      marginLeft: '2px'
    }}>
      {phoneNumberError}
    </div>
  )}
  {/* Add a helper text */}
  <div style={{
    color: '#6b7280',
    fontSize: '12px',
    marginTop: '4px',
    marginLeft: '2px'
  }}>

  </div>
</div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Valid ID Front<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <div 
                        style={{
                          ...styles.fileUploadSection,
                          ...(isHovered.validIdFront ? styles.fileUploadSectionHover : {})
                        }}
                        onMouseEnter={() => handleMouseEnter('validIdFront')}
                        onMouseLeave={() => handleMouseLeave('validIdFront')}
                        onClick={() => document.getElementById('validIdFront').click()}
                      >
                        <input
                          id="validIdFront"
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setValidIdFrontFile)}
                          accept="image/*"
                        />
                        <p style={styles.fileUploadText}>
                          {validIdFrontFile ? 'Change file' : 'Click to upload'}
                        </p>
                        {validIdFrontFile && (
                          <p style={styles.fileName}>{validIdFrontFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Middle Name
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter middle name"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formSection}>
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

                    <div style={styles.formSection}>
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

<div style={styles.formSection}>
  <label style={styles.formLabel}>
    Registration Fee<span style={styles.requiredAsterisk}>*</span>
  </label>
  <input
    style={styles.formInput}
    placeholder={`Minimum ${toPeso(minRegistrationFee)}`}
    value={formData.registrationFee}
    onChange={(e) => {
      // Only allow numbers and one decimal point - SAME AS LOANS COMPONENT
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        handleInputChange('registrationFee', value);
      }
    }}
    type="text"
    inputMode="decimal"
  />
  <div style={{
    color: '#6b7280',
    fontSize: '12px',
    marginTop: '4px',
    marginLeft: '2px'
  }}>
    Minimum: {toPeso(minRegistrationFee)}
  </div>
</div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Selfie<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <div 
                        style={{
                          ...styles.fileUploadSection,
                          ...(isHovered.selfie ? styles.fileUploadSectionHover : {})
                        }}
                        onMouseEnter={() => handleMouseEnter('selfie')}
                        onMouseLeave={() => handleMouseLeave('selfie')}
                        onClick={() => document.getElementById('selfie').click()}
                      >
                        <input
                          id="selfie"
                          style={styles.fileInput}
                          type="file"
                          onChange={(e) => handleFileChange(e, setSelfieFile)}
                          accept="image/*"
                        />
                        <p style={styles.fileUploadText}>
                          {selfieFile ? 'Change file' : 'Click to upload selfie'}
                        </p>
                        {selfieFile && (
                          <p style={styles.fileName}>{selfieFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Required Fields */}
                <div style={styles.formGrid}>
                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Place of Birth<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter place of birth"
                        value={formData.placeOfBirth}
                        onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>
                  </div>

                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Address<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter complete address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>
                  </div>
                </div>

                {/* Proof of Payment */}
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>
                    Proof of Payment<span style={styles.requiredAsterisk}>*</span>
                  </label>
                  <div 
                    style={{
                      ...styles.fileUploadSection,
                      ...(isHovered.proofOfPayment ? styles.fileUploadSectionHover : {})
                    }}
                    onMouseEnter={() => handleMouseEnter('proofOfPayment')}
                    onMouseLeave={() => handleMouseLeave('proofOfPayment')}
                    onClick={() => document.getElementById('proofOfPayment').click()}
                  >
                    <input
                      id="proofOfPayment"
                      style={styles.fileInput}
                      type="file"
                      onChange={(e) => handleFileChange(e, setProofOfPaymentFile)}
                      accept="image/*,application/pdf"
                    />
                    <p style={styles.fileUploadText}>
                      {proofOfPaymentFile ? 'Change file' : 'Click to upload proof of payment'}
                    </p>
                    {proofOfPaymentFile && (
                      <p style={styles.fileName}>{proofOfPaymentFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.secondaryButton,
                    ...(isHovered.cancelButton ? styles.secondaryButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('cancelButton')}
                  onMouseLeave={() => handleMouseLeave('cancelButton')}
                  onClick={closeAddModal}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.primaryButton,
                    ...(isHovered.submitButton ? styles.primaryButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('submitButton')}
                  onMouseLeave={() => handleMouseLeave('submitButton')}
                  onClick={handleSubmitConfirmation}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div style={{...styles.spinner, width: '16px', height: '16px', borderWidth: '2px'}}></div>
                      <span>Adding Member...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Add Member</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

{/* Confirmation Modal - EXACT SAME AS REGISTRATIONS */}
{confirmModalVisible && (
  <div style={styles.modalOverlay} onClick={() => setConfirmModalVisible(false)}>
    <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
      <FiAlertCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
      <p style={styles.modalText}>
        Are you sure you want to register this new member? This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(actionInProgress ? styles.disabledButton : {})
          }} 
          onClick={submitManualMember}
          disabled={actionInProgress}
        >
          {actionInProgress ? 'Processing...' : 'Yes'} {/* Changed from 'Confirm Registration' to 'Yes' */}
        </button>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.secondaryButton
          }} 
          onClick={() => setConfirmModalVisible(false)}
          disabled={actionInProgress}
        >
          No {/* Changed from 'Cancel' to 'No' */}
        </button>
      </div>
    </div>
  </div>
)}

{/* Success Modal - EXACT SAME AS REGISTRATIONS */}
{successModalVisible && (
  <div style={styles.modalOverlay} onClick={handleSuccessOk}>
    <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
      <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
      <p style={styles.modalText}>{successMessage}</p>
      <button 
        style={{
          ...styles.actionButton,
          ...styles.primaryButton
        }} 
        onClick={handleSuccessOk}
      >
        OK {/* Changed from 'Continue' to 'OK' */}
      </button>
    </div>
  </div>
)}

{/* Error Modal - EXACT SAME AS REGISTRATIONS */}
{errorModalVisible && (
  <div style={styles.modalOverlay} onClick={() => setErrorModalVisible(false)}>
    <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
      <p style={styles.modalText}>{errorMessage}</p>
      <button 
        style={{
          ...styles.actionButton,
          ...styles.primaryButton
        }} 
        onClick={() => setErrorModalVisible(false)}
      >
        Try Again
      </button>
    </div>
  </div>
)}

{/* Loading Spinner - EXACT SAME AS REGISTRATIONS */}
{isProcessing && (
  <div style={styles.loadingSpinnerOverlay}>
    <div style={styles.loadingSpinner}></div>
  </div>
)}
      </div>
    </div>
  );
};

export default Register;
