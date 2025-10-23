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
  FaExclamationCircle,
  FaFileAlt,
  FaPrint,
  FaSpinner
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
import logoImage from '../../../../../assets/logo.png';

// Constants
const depositOptions = [
  { key: 'Bank', label: 'Bank' },
  { key: 'GCash', label: 'GCash' },
  { key: 'Cash', label: 'Cash on Hand' }
];

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
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${hours}:${minutes}:${seconds} ${ampm}`;
};

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0'
  },
  mainContainer: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
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
  searchDownloadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: '10',
    flexShrink: '0'
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
  downloadButton: {
    padding: '10px 12px',
    backgroundColor: '#059669',
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
    width: '40px',
    height: '40px',
    flexShrink: '0'
  },
  downloadButtonHover: {
    backgroundColor: '#047857'
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
    marginBottom: '80px'
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
    minHeight: '40px'
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
  addDepositButton: {
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
  addDepositButtonHover: {
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
    padding: '20px',
    overflowY: 'auto',
    backdropFilter: 'blur(4px)'
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
    flexDirection: 'column',
    border: '1px solid #F1F5F9'
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
    overflowY: 'auto',
    flex: 1
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
    flexShrink: 0,
    background: '#f8fafc'
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
  primaryButton: {
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
    }
  },
  secondaryButton: {
    background: '#6b7280',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
    }
  },
  approveButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
    }
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
    borderLeft: '4px solid #2563eb',
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
  // Confirmation modal styles
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
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(4px)'
  },
  modalCardSmall: {
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
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
  // Loading overlay
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1500,
    backdropFilter: 'blur(4px)',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  loadingTextOverlay: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  },
  // Error text styles
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500'
  }
};

// Add keyframes for spinner animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = spinKeyframes;
  if (!document.head.querySelector('style[data-spin-keyframes]')) {
    styleSheet.setAttribute('data-spin-keyframes', 'true');
    document.head.appendChild(styleSheet);
  }
}

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
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [depositAccounts, setDepositAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  
  // Member validation states
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  
  // Print Modal State
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Admin data for print report
  const [adminData, setAdminData] = useState(null);

  // New states for the process flow
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState(null);

  const pageSize = 10;

  // Tab configuration
  const tabs = [
    { 
      key: 'applyDeposits', 
      label: 'Pending', 
      icon: FaFileAlt,
      color: '#f59e0b'
    },
    { 
      key: 'approvedDeposits', 
      label: 'Approved', 
      icon: FaCheckCircle,
      color: '#059669'
    },
    { 
      key: 'rejectedDeposits', 
      label: 'Rejected', 
      icon: FaTimes,
      color: '#dc2626'
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
        boxShadow: 0 10px 25px rgba(0,0,0,0.1);
      }
      
      /* PRINT STYLES - REMOVE BROWSER HEADERS/FOOTERS */
      @media print {
        @page {
          margin: 0.5in !important;
          size: auto;
          margin-header: 0 !important;
          margin-footer: 0 !important;
        }
        
        body::before,
        body::after {
          display: none !important;
        }
        
        .print-header:empty,
        .print-footer:empty {
          display: none;
        }
        
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
          padding: 20px;
          background: white;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-header {
          display: block !important;
        }
        .component-header {
          display: none !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
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
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

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

  useEffect(() => {
    const currentData =
      activeSection === 'applyDeposits'
        ? pending
        : activeSection === 'approvedDeposits'
        ? approved
        : rejected;
    
    setFilteredData(currentData);
    setCurrentPage(0);
    setNoMatch(false);
  }, [activeSection, pending, approved, rejected]);

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

  // Fetch member data when member ID is entered - AUTO FETCH
  const fetchMemberData = async (memberId) => {
    if (!memberId) {
      // Reset form if member ID is cleared
      setFormData(prev => ({
        ...prev,
        firstName: '',
        lastName: '',
        email: ''
      }));
      setMemberNotFound(false);
      return;
    }
    
    setMemberLoading(true);
    setMemberNotFound(false);
    
    try {
      const memberRef = database.ref(`Members/${memberId}`);
      const memberSnap = await memberRef.once('value');
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.val();
        setFormData(prev => ({
          ...prev,
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          email: memberData.email || ''
        }));
        setMemberNotFound(false);
      } else {
        setFormData(prev => ({
          ...prev,
          firstName: '',
          lastName: '',
          email: ''
        }));
        setMemberNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMemberNotFound(true);
    } finally {
      setMemberLoading(false);
    }
  };

  const handlePrint = (format = 'print') => {
    setPrinting(true);
    
    try {
      const sectionTitle = 
        activeSection === 'applyDeposits' ? 'Pending Deposits' :
        activeSection === 'approvedDeposits' ? 'Approved Deposits' :
        'Rejected Deposits';

      // Get the data that's currently displayed in the table (paginated)
      const displayedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

      const printContent = document.createElement('div');
      printContent.className = 'print-content';
      printContent.style.padding = '20px';
      printContent.style.fontFamily = 'Arial, sans-serif';
      printContent.style.boxSizing = 'border-box';
      printContent.style.margin = '0';

      // Create your custom header
      const header = document.createElement('div');
      header.className = 'print-header';
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '15px';
      header.style.marginBottom = '20px';
      header.style.boxSizing = 'border-box';

      // Logo and Report Title (Centered)
      const logoSection = document.createElement('div');
      logoSection.style.textAlign = 'center';
      logoSection.style.marginBottom = '15px';

      // Add logo image
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

      // Info Row (Generated Date on left, Prepared By on right)
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

      // Table
      if (displayedData.length > 0) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';
        table.style.boxSizing = 'border-box';

        // Table Header - Define columns based on active section
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f8f9fa';
        
        // Define columns for each section
        let headers = [];
        
        switch(activeSection) {
          case 'applyDeposits':
            headers = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Status', 'Date Applied'];
            break;
          case 'approvedDeposits':
            headers = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Date Approved', 'Transaction ID'];
            break;
          case 'rejectedDeposits':
            headers = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Rejection Reason', 'Date Rejected'];
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
              case 'Member ID':
                cellValue = item.id || '';
                break;
              case 'Full Name':
                cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                break;
              case 'Deposit Amount':
                cellValue = formatCurrency(item.amountToBeDeposited || 0);
                break;
              case 'Mode of Deposit':
                cellValue = item.depositOption || '';
                break;
              case 'Status':
                cellValue = item.status || 'pending';
                break;
              case 'Date Applied':
                cellValue = item.dateApplied || '';
                break;
              case 'Date Approved':
                cellValue = item.dateApproved || '';
                break;
              case 'Transaction ID':
                cellValue = item.transactionId || '';
                break;
              case 'Rejection Reason':
                cellValue = item.rejectionReason || '';
                break;
              case 'Date Rejected':
                cellValue = item.dateRejected || '';
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

      // Create a hidden iframe for printing to avoid browser headers
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

            // Export to Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sectionTitle);

            if (displayedData.length > 0) {
              // Define headers for Excel based on active section
              let excelHeaders = [];
              
              switch(activeSection) {
                case 'applyDeposits':
                  excelHeaders = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Status', 'Date Applied'];
                  break;
                case 'approvedDeposits':
                  excelHeaders = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Date Approved', 'Transaction ID'];
                  break;
                case 'rejectedDeposits':
                  excelHeaders = ['Member ID', 'Full Name', 'Deposit Amount', 'Mode of Deposit', 'Rejection Reason', 'Date Rejected'];
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
                    case 'Member ID':
                      cellValue = item.id || '';
                      break;
                    case 'Full Name':
                      cellValue = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                      break;
                    case 'Deposit Amount':
                      cellValue = parseFloat(item.amountToBeDeposited) || 0;
                      break;
                    case 'Mode of Deposit':
                      cellValue = item.depositOption || '';
                      break;
                    case 'Status':
                      cellValue = item.status || 'pending';
                      break;
                    case 'Date Applied':
                      cellValue = item.dateApplied || '';
                      break;
                    case 'Date Approved':
                      cellValue = item.dateApproved || '';
                      break;
                    case 'Transaction ID':
                      cellValue = item.transactionId || '';
                      break;
                    case 'Rejection Reason':
                      cellValue = item.rejectionReason || '';
                      break;
                    case 'Date Rejected':
                      cellValue = item.dateRejected || '';
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
    setMemberNotFound(false);
    setMemberLoading(false);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'depositOption' && value) {
      // FIX: Safely access depositAccounts with fallback
      const selectedAccount = depositAccounts[value] || { accountName: '', accountNumber: '' };
      setFormData(prev => ({
        ...prev,
        accountName: selectedAccount.accountName || '',
        accountNumber: selectedAccount.accountNumber || ''
      }));

      // Clear proof of deposit for Cash
      if (value === 'Cash') {
        setProofOfDepositFile(null);
      }
    }

    // AUTO FETCH member data when member ID is entered
    if (name === 'memberId') {
      fetchMemberData(value);
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
    if (memberNotFound) {
      setErrorMessage('Member not found. Please check the Member ID');
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
    // Only require proof of deposit for non-Cash deposits
    if (formData.depositOption !== 'Cash' && !proofOfDepositFile) {
      setErrorMessage('Proof of deposit is required for non-cash deposits');
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

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const processDatabaseAddition = async (depositData) => {
    try {
      const transactionId = generateTransactionId();
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const amount = parseFloat(depositData.amount);

      const approvedRef = database.ref(`Deposits/ApprovedDeposits/${depositData.memberId}/${transactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${depositData.memberId}/${transactionId}`);
      const memberRef = database.ref(`Members/${depositData.memberId}`);
      const fundsRef = database.ref('Settings/Funds');

      const memberSnap = await memberRef.once('value');

      if (memberSnap.exists()) {
        const member = memberSnap.val();

        const fullDepositData = { 
          ...depositData, 
          transactionId,
          amountToBeDeposited: amount,
          dateApplied: approvalDate,
          timeApplied: approvalTime,
          dateApproved: approvalDate,
          timeApproved: approvalTime,
          timestamp: now.getTime(),
          status: 'approved'
        };

        await approvedRef.set(fullDepositData);
        await transactionRef.set(fullDepositData);

        const newBalance = parseFloat(member.balance || 0) + amount;
        const newInvestment = parseFloat(member.investment || 0) + amount;
        
        await memberRef.update({ 
          balance: newBalance,
          investment: newInvestment
        });

        if (depositData.depositOption !== 'Cash') {
          const fundSnap = await fundsRef.once('value');
          const updatedFund = (parseFloat(fundSnap.val()) || 0) + amount;
          await fundsRef.set(updatedFund);
          
          const dateKey = now.toISOString().split('T')[0];
          const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
          await fundsHistoryRef.set(updatedFund);
        }

        return transactionId;
      } else {
        throw new Error('Member not found');
      }
    } catch (err) {
      console.error('Database addition error:', err);
      throw new Error(err.message || 'Failed to add deposit');
    }
  };

  const callApiApprove = async (depositData) => {
    try {
      const response = await ApproveDeposits({
        memberId: depositData.memberId,
        transactionId: depositData.transactionId,
        amount: depositData.amount,
        dateApproved: depositData.dateApproved,
        timeApproved: depositData.timeApproved,
        email: depositData.email,
        firstName: depositData.firstName,
        lastName: depositData.lastName,
        status: 'approved'
      });
      
      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const confirmAddDeposit = async () => {
    setConfirmModalVisible(false);
    setActionInProgress(true);
    setIsProcessing(true);

    try {
      let proofOfDepositUrl = '';
      
      // Only upload proof of deposit for non-Cash deposits
      if (formData.depositOption !== 'Cash' && proofOfDepositFile) {
        proofOfDepositUrl = await uploadImageToStorage(
          proofOfDepositFile, 
          `proofsOfDeposit/${formData.memberId}_${Date.now()}`
        );
      }

      const depositData = {
        ...formData,
        proofOfDepositUrl: proofOfDepositUrl || undefined
      };

      // Store pending API call for background processing
      setPendingApiCall({
        type: 'add',
        data: depositData
      });

      setSuccessMessage('Deposit added successfully!');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error preparing deposit:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const handleSuccessOk = async () => {
    // Show loading spinner and hide success modal
    setIsProcessing(true);
    setSuccessModalVisible(false);

    try {
      // Finalize DB changes
      if (pendingApiCall && pendingApiCall.type === 'add') {
        await processDatabaseAddition(pendingApiCall.data);
      }
    } catch (err) {
      console.error('Finalize DB on OK error:', err);
      setErrorMessage('Failed to add deposit to database');
      setErrorModalVisible(true);
      setIsProcessing(false);
      return;
    }

    // Trigger background email after DB success; do not block UI
    try {
      if (pendingApiCall && pendingApiCall.type === 'add') {
        callApiApprove(pendingApiCall.data);
      }
    } catch (error) {
      console.error('Error calling API:', error);
    } finally {
      setPendingApiCall(null);
    }

    // Close modal and clean state
    closeAddModal();
    setActionInProgress(false);

    // Finally refresh
    fetchAllData();

    // Hide loading spinner
    setIsProcessing(false);
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  if (loading) {
    return (
      <div style={styles.safeAreaView}>
        <div style={styles.mainContainer}>
          <div style={styles.dashboardLoadingContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>Loading deposits data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div style={styles.safeAreaView} className="component-header">
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Deposits Management</h1>
            <p style={styles.headerSubtitle}>
              Manage deposit applications, approvals, and rejections
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

            {/* Search, Download, Print - Right side */}
            <div style={styles.searchDownloadContainer}>
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by name, ID, or transaction..."
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

        {/* Add Deposit Button - Only show on Approved Deposits tab */}
        {activeSection === 'approvedDeposits' && (
          <button 
            style={{
              ...styles.addDepositButton,
              ...(isHovered.addDeposit ? styles.addDepositButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('addDeposit')}
            onMouseLeave={() => handleMouseLeave('addDeposit')}
            onClick={openAddModal}
            className="hover-lift"
          >
            <FaPlus />
          </button>
        )}

        {/* Print Modal */}
        {printModalVisible && (
          <div style={styles.modalOverlay}>
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

        {/* Add Deposit Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay} onClick={closeAddModal}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add New Deposit</h2>
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
                        Member ID<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={{
                          ...styles.formInput,
                          ...(memberNotFound && { borderColor: '#dc2626' })
                        }}
                        placeholder="Enter member ID"
                        value={formData.memberId}
                        onChange={(e) => handleInputChange('memberId', e.target.value)}
                        type="text"
                      />
                      {memberLoading && (
                        <p style={{...styles.errorText, color: '#3b82f6'}}>
                          Loading member data...
                        </p>
                      )}
                      {memberNotFound && (
                        <p style={styles.errorText}>
                          Member not found. Please check the Member ID.
                        </p>
                      )}
                    </div>

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
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Deposit Option<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={formData.depositOption}
                        onChange={(e) => handleInputChange('depositOption', e.target.value)}
                      >
                        <option value="">Select Deposit Option</option>
                        {depositOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Account Name
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Account name"
                        value={formData.accountName}
                        onChange={(e) => handleInputChange('accountName', e.target.value)}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
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
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Email<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        type="email"
                        autoCapitalize="none"
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Account Number
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Account number"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Amount<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Proof of Deposit Upload - Only show for non-Cash deposits */}
                {formData.depositOption && formData.depositOption !== 'Cash' && (
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Proof of Deposit<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div 
                      style={{
                        ...styles.fileUploadSection,
                        ...(isHovered.proofOfDeposit ? styles.fileUploadSectionHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('proofOfDeposit')}
                      onMouseLeave={() => handleMouseLeave('proofOfDeposit')}
                      onClick={() => document.getElementById('proofOfDeposit').click()}
                    >
                      <input
                        id="proofOfDeposit"
                        style={styles.fileInput}
                        type="file"
                        onChange={(e) => handleFileChange(e, setProofOfDepositFile)}
                        accept="image/*"
                      />
                      <p style={styles.fileUploadText}>
                        {proofOfDepositFile ? 'Change file' : 'Click to upload proof of deposit'}
                      </p>
                      {proofOfDepositFile && (
                        <p style={styles.fileName}>{proofOfDepositFile.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show message for Cash */}
                {formData.depositOption === 'Cash' && (
                  <div style={styles.formSection}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <FaCheckCircle style={{color: '#059669', marginRight: '8px'}} />
                      <span style={{color: '#0369a1', fontWeight: '500'}}>
                        Proof of deposit not required for Cash deposits
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton,
                    ...(isHovered.cancelButton ? {} : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('cancelButton')}
                  onMouseLeave={() => handleMouseLeave('cancelButton')}
                  onClick={closeAddModal}
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isHovered.submitButton ? {} : {}),
                    ...(actionInProgress ? styles.disabledButton : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('submitButton')}
                  onMouseLeave={() => handleMouseLeave('submitButton')}
                  onClick={handleSubmitConfirmation}
                  disabled={actionInProgress || memberNotFound || memberLoading}
                >
                  {actionInProgress ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Add Deposit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal - Same style as ApplyDeposits */}
        {confirmModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
              <p style={styles.modalText}>Are you sure you want to add this deposit?</p>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton,
                    flex: 1
                  }} 
                  onClick={() => setConfirmModalVisible(false)}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'No'}
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton,
                    flex: 1
                  }}
                  onClick={confirmAddDeposit}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - Same style as ApplyDeposits */}
        {successModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
              <p style={styles.modalText}>{successMessage}</p>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton,
                  width: '100%'
                }}
                onClick={handleSuccessOk}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal - Same style as ApplyDeposits */}
        {errorModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
              <p style={styles.modalText}>{errorMessage}</p>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton,
                  width: '100%'
                }}
                onClick={() => setErrorModalVisible(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner - Same style as ApplyDeposits */}
        {isProcessing && (
          <div style={styles.centeredModal}>
            <div style={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposits;