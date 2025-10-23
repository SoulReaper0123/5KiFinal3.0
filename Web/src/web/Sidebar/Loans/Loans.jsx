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
  FaPrint
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import ApplyLoans from './ApplyLoans';
import ApprovedLoans from './ApprovedLoans';
import RejectedLoans from './RejectedLoans';
import { database } from '../../../../../Database/firebaseConfig';
import logoImage from '../../../../../assets/logo.png';

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
  addLoanButton: {
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
  addLoanButtonHover: {
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
    overflowY: 'auto'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
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
    transition: 'all 0.2s ease',
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
    transition: 'all 0.2s ease',
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
    padding: '20px'
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
  // Error text styles
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
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
  // Collateral styles
  collateralIndicator: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '15px',
    gap: '8px'
  },
  collateralIndicatorText: {
    fontSize: '14px',
    color: '#856404',
    fontWeight: '500',
    flex: 1
  },
  collateralButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#EAF3FF',
    border: '1px solid #2D5783',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  collateralButtonHover: {
    backgroundColor: '#dbeafe'
  },
  collateralButtonText: {
    fontSize: '14px',
    color: '#2D5783',
    fontWeight: '600',
    flex: 1
  },
  collateralSummary: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px'
  },
  collateralSummaryTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#2D5783',
    marginBottom: '8px'
  },
  collateralSummaryText: {
    fontSize: '13px',
    color: '#495057',
    marginBottom: '4px'
  },
  // Collateral Modal Styles
  collateralModal: {
    maxWidth: '600px',
    maxHeight: '80vh'
  },
  collateralScreen: {
    padding: '0'
  },
  collateralHeader: {
    backgroundColor: '#E8F1FB',
    padding: '16px',
    borderRadius: '14px 14px 0 0',
    marginBottom: '0'
  },
  collateralBody: {
    padding: '20px'
  },
  descriptionHint: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  descriptionBullet: {
    fontSize: '14px',
    color: '#666',
    marginLeft: '10px',
    marginBottom: '3px'
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    border: '1px solid #2D5783',
    borderRadius: '10px',
    backgroundColor: '#EAF3FF',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  uploadButtonHover: {
    backgroundColor: '#dbeafe'
  },
  uploadButtonText: {
    color: '#2D5783',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  proofPreview: {
    width: '100%',
    height: '180px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    marginBottom: '12px',
    objectFit: 'cover'
  }
};

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
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddLoanConfirmation, setShowAddLoanConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  
  // Print Modal State
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  // Admin data for print report
  const [adminData, setAdminData] = useState(null);

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

  const [loanTypes, setLoanTypes] = useState([]);
  const [interestByType, setInterestByType] = useState({});

  // Member validation states
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  // NEW: Collateral related states
  const [requiresCollateral, setRequiresCollateral] = useState(false);
  const [collateralType, setCollateralType] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [proofOfCollateral, setProofOfCollateral] = useState(null);
  const [memberBalance, setMemberBalance] = useState(0);
  const [memberInvestment, setMemberInvestment] = useState(0);

  const pageSize = 10;

  // Tab configuration
  const tabs = [
    { 
      key: 'applyLoans', 
      label: 'Pending', 
      icon: FaFileAlt,
      color: '#f59e0b'
    },
    { 
      key: 'approvedLoans', 
      label: 'Approved', 
      icon: FaCheckCircle,
      color: '#059669'
    },
    { 
      key: 'rejectedLoans', 
      label: 'Rejected', 
      icon: FaTimes,
      color: '#dc2626'
    }
  ];

  // Collateral Options
  const collateralOptions = [
    { key: 'Property', label: 'Property' },
    { key: 'Vehicle', label: 'Vehicle' },
    { key: 'Jewelry', label: 'Jewelry' },
    { key: 'Electronics', label: 'Electronics' },
    { key: 'Other', label: 'Other' },
  ];

  // Create style element and append to head - FIXED CSS with print header/footer removal
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
      
      /* PRINT STYLES - REMOVE BROWSER HEADERS/FOOTERS */
      @media print {
        /* Remove browser default headers and footers */
        @page {
          margin: 0.5in !important;
          size: auto;
          margin-header: 0 !important;
          margin-footer: 0 !important;
        }
        
        /* Target Webkit browsers (Chrome, Safari) */
        @page :first {
          margin-top: 0;
        }
        
        @page :left {
          margin-left: 0.5in;
          margin-right: 0.5in;
        }
        
        @page :right {
          margin-left: 0.5in;
          margin-right: 0.5in;
        }
        
        /* Hide URL, page numbers, and date in print */
        body::before,
        body::after {
          display: none !important;
        }
        
        /* Hide any browser-generated content */
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

  // Fetch member data when member ID is entered - AUTO FETCH with balance and investment
  const fetchMemberData = async (memberId) => {
    if (!memberId) {
      // Reset form if member ID is cleared
      setAddForm(prev => ({
        ...prev,
        firstName: '',
        lastName: '',
        email: ''
      }));
      setMemberNotFound(false);
      setMemberBalance(0);
      setMemberInvestment(0);
      setRequiresCollateral(false);
      return;
    }
    
    setMemberLoading(true);
    setMemberNotFound(false);
    
    try {
      const memberRef = database.ref(`Members/${memberId}`);
      const memberSnap = await memberRef.once('value');
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.val();
        setAddForm(prev => ({
          ...prev,
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          email: memberData.email || ''
        }));
        setMemberBalance(parseFloat(memberData.balance) || 0);
        setMemberInvestment(parseFloat(memberData.investment) || 0);
        setMemberNotFound(false);
        
        // Check if loan amount requires collateral
        checkCollateralRequirement(addForm.loanAmount, parseFloat(memberData.balance) || 0);
      } else {
        setAddForm(prev => ({
          ...prev,
          firstName: '',
          lastName: '',
          email: ''
        }));
        setMemberBalance(0);
        setMemberInvestment(0);
        setMemberNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMemberNotFound(true);
    } finally {
      setMemberLoading(false);
    }
  };

  // Check if collateral is required based on loan amount vs member balance
  const checkCollateralRequirement = (loanAmount, balance) => {
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const balanceNum = parseFloat(balance) || 0;
    
    if (loanAmountNum > balanceNum) {
      setRequiresCollateral(true);
    } else {
      setRequiresCollateral(false);
    }
  };

  // Check if all collateral fields are filled
  const isCollateralValid = () => {
    return collateralType && collateralValue && collateralDescription && proofOfCollateral;
  };

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
      fetchLoansDataForSection(activeSection, { silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeSection]);

  useEffect(() => {
    const currentData =
      activeSection === 'applyLoans'
        ? pendingLoans
        : activeSection === 'approvedLoans'
        ? approvedLoans
        : rejectedLoans;
    
    setFilteredData(currentData);
    setCurrentPage(0);
    setNoMatch(false);
  }, [activeSection, pendingLoans, approvedLoans, rejectedLoans]);

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
      `${item.firstName ?? ''} ${item.lastName ?? ''}`.toLowerCase().includes(text.toLowerCase()) ||
      (item.id && item.id.toString().includes(text)) ||
      (item.transactionId && item.transactionId.toString().includes(text))
    );

    setNoMatch(filtered.length === 0);
    setFilteredData(filtered);
  };

  // FIXED PRINT FUNCTION - Following PayLoans structure
  const handlePrint = (format = 'print') => {
    setPrinting(true);
    
    try {
      const sectionTitle = 
        activeSection === 'applyLoans' ? 'Pending Loans' :
        activeSection === 'approvedLoans' ? 'Approved Loans' :
        'Rejected Loans';

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
          case 'applyLoans':
            headers = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Status'];
            break;
          case 'approvedLoans':
            headers = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Date Approved'];
            break;
          case 'rejectedLoans':
            headers = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Rejection Reason'];
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
              case 'Loan Amount':
                cellValue = formatCurrency(item.loanAmount || 0);
                break;
              case 'Loan Type':
                cellValue = item.loanType || '';
                break;
              case 'Disbursement':
                cellValue = item.disbursement || '';
                break;
              case 'Status':
                cellValue = item.status || 'pending';
                break;
              case 'Date Approved':
                cellValue = item.dateApproved || '';
                break;
              case 'Rejection Reason':
                cellValue = item.rejectionReason || '';
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
                case 'applyLoans':
                  excelHeaders = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Status'];
                  break;
                case 'approvedLoans':
                  excelHeaders = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Date Approved'];
                  break;
                case 'rejectedLoans':
                  excelHeaders = ['Member ID', 'Full Name', 'Loan Amount', 'Loan Type', 'Disbursement', 'Rejection Reason'];
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
                    case 'Loan Amount':
                      cellValue = parseFloat(item.loanAmount) || 0;
                      break;
                    case 'Loan Type':
                      cellValue = item.loanType || '';
                      break;
                    case 'Disbursement':
                      cellValue = item.disbursement || '';
                      break;
                    case 'Status':
                      cellValue = item.status || 'pending';
                      break;
                    case 'Date Approved':
                      cellValue = item.dateApproved || '';
                      break;
                    case 'Rejection Reason':
                      cellValue = item.rejectionReason || '';
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

  const handleTabSwitch = async (key) => {
    setActiveSection(key);
    setSearchQuery('');
    setCurrentPage(0);
    await fetchLoansDataForSection(key);
  };

  const openAddModal = () => setAddModalVisible(true);
  const closeAddModal = () => {
    setAddModalVisible(false);
    setAddForm({
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
    setMemberNotFound(false);
    setMemberLoading(false);
    setRequiresCollateral(false);
    setCollateralType('');
    setCollateralValue('');
    setCollateralDescription('');
    setProofOfCollateral(null);
  };

  const updateForm = (field, value) => {
    setAddForm(prev => ({ ...prev, [field]: value }));

    // AUTO FETCH member data when member ID is entered
    if (field === 'memberId') {
      fetchMemberData(value);
    }

    // Check collateral requirement when loan amount changes
    if (field === 'loanAmount') {
      checkCollateralRequirement(value, memberBalance);
    }
  };

  // Handle file upload for proof of collateral
  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const handleAddApprovedLoan = async () => {
    try {
      setIsProcessing(true);
      const now = new Date();
      const dateApproved = formatDate(now);
      const timeApproved = formatTime(now);

      const required = ['memberId','firstName','lastName','email','loanAmount','term','disbursement'];
      for (const f of required) {
        if (!addForm[f]) throw new Error('Please fill all required fields');
      }

      if (memberNotFound) {
        throw new Error('Member not found. Please check the Member ID');
      }

      // Check if collateral is required but not provided
      if (requiresCollateral && !isCollateralValid()) {
        throw new Error('Collateral is required for this loan amount. Please complete all collateral details.');
      }

      const memberBalanceRef = database.ref(`Members/${addForm.memberId}/balance`);
      const fundsRef = database.ref('Settings/Funds');
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

      const maxLoanAmount = loanPercentage === 0 ? memberBalance : memberBalance * ((loanPercentage || 80) / 100);
      if (amount > maxLoanAmount) {
        const pct = loanPercentage === 0 ? 100 : (loanPercentage || 80);
        throw new Error(`Loan amount exceeds ${pct}% of member's balance.`);
      }

      if (amount > currentFunds) {
        throw new Error('Insufficient funds to approve this loan.');
      }

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
        loanType: addForm.loanType,
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
        paymentsMade: 0,
        requiresCollateral,
        ...(requiresCollateral && {
          collateralType,
          collateralValue,
          collateralDescription,
          proofOfCollateral: proofOfCollateral ? URL.createObjectURL(proofOfCollateral) : null
        })
      };

      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);

      const newFundsAmount = currentFunds - amount;
      await fundsRef.set(newFundsAmount);
      const timestampKey = now.toISOString().replace(/[.#$\[\]]/g, '_');
      await database.ref(`Settings/FundsHistory/${timestampKey}`).set(newFundsAmount);

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

      const updatedMemberBalance = Math.max(0, Math.ceil((memberBalance - amount) * 100) / 100);
      await memberBalanceRef.set(updatedMemberBalance);

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
          dueDate: approvedData.dueDate,
          requiresCollateral,
          ...(requiresCollateral && {
            collateralType,
            collateralValue,
            collateralDescription
          })
        });
      } catch (e) {
        console.warn('ApproveLoans email send failed or not configured:', e?.message || e);
      }

      setSuccessMessage('Approved loan added successfully!');
      setSuccessModalVisible(true);
      setAddModalVisible(false);
      await fetchLoansDataForSection('approvedLoans');
    } catch (err) {
      console.error('Add approved loan error:', err);
      setErrorMessage(err.message || 'Failed to add approved loan');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
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
              <div style={styles.loadingText}>Loading loans data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  return (
    <div style={styles.safeAreaView} className="component-header">
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Loans Management</h1>
            <p style={styles.headerSubtitle}>
              Manage loan applications, approvals, and rejections
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

        {/* Add Loan Button - Only show on Approved Loans tab */}
        {activeSection === 'approvedLoans' && (
          <button 
            style={{
              ...styles.addLoanButton,
              ...(isHovered.addLoan ? styles.addLoanButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('addLoan')}
            onMouseLeave={() => handleMouseLeave('addLoan')}
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

        {/* Add Loan Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay} onClick={closeAddModal}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add Approved Loan</h2>
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
                        value={addForm.memberId}
                        onChange={(e) => updateForm('memberId', e.target.value)}
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
                        value={addForm.firstName}
                        onChange={(e) => updateForm('firstName', e.target.value)}
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
                        value={addForm.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        type="email"
                        autoCapitalize="none"
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Loan Amount<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter loan amount"
                        value={addForm.loanAmount}
                        onChange={(e) => updateForm('loanAmount', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Account Name
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter account name"
                        value={addForm.accountName}
                        onChange={(e) => updateForm('accountName', e.target.value)}
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
                        value={addForm.lastName}
                        onChange={(e) => updateForm('lastName', e.target.value)}
                        autoCapitalize="words"
                        readOnly
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Loan Type<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={addForm.loanType}
                        onChange={(e) => updateForm('loanType', e.target.value)}
                      >
                        {loanTypes.map((lt) => (
                          <option key={`lt-${lt}`} value={lt}>{lt}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Term (months)<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={addForm.term}
                        onChange={(e) => updateForm('term', e.target.value)}
                      >
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

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Disbursement<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={addForm.disbursement}
                        onChange={(e) => updateForm('disbursement', e.target.value)}
                      >
                        <option value="GCash">GCash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Account Number
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter account number"
                        value={addForm.accountNumber}
                        onChange={(e) => updateForm('accountNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* NEW: Collateral Section */}
                {requiresCollateral && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2D5783', marginBottom: '10px', textAlign: 'center' }}>
                      Collateral Required
                    </h3>
                    
                    <div style={styles.collateralIndicator}>
                      <FaExclamationCircle style={{ color: '#ff9800', fontSize: '16px' }} />
                      <span style={styles.collateralIndicatorText}>
                        Loan amount exceeds member's balance. Collateral is required.
                      </span>
                    </div>

                    <button
                      style={{
                        ...styles.collateralButton,
                        ...(isHovered.collateralButton ? styles.collateralButtonHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('collateralButton')}
                      onMouseLeave={() => handleMouseLeave('collateralButton')}
                      onClick={() => setShowCollateralModal(true)}
                    >
                      <FaExclamationCircle style={{ color: '#2D5783', fontSize: '16px' }} />
                      <span style={styles.collateralButtonText}>
                        {collateralType ? 'Edit Collateral Details' : 'Add Collateral Details'}
                      </span>
                      <FaChevronRight style={{ color: '#2D5783', fontSize: '14px' }} />
                    </button>

                    {collateralType && (
                      <div style={styles.collateralSummary}>
                        <div style={styles.collateralSummaryTitle}>Collateral Summary</div>
                        <div style={styles.collateralSummaryText}>Type: {collateralType}</div>
                        <div style={styles.collateralSummaryText}>Value: {formatCurrency(collateralValue || 0)}</div>
                        <div style={styles.collateralSummaryText}>Description: {collateralDescription}</div>
                        {proofOfCollateral && (
                          <div style={styles.collateralSummaryText}>Proof: {proofOfCollateral.name}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Member Balance Information */}
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#0369a1', fontWeight: '500' }}>Member Balance:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e3a5f' }}>{formatCurrency(memberBalance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{ fontSize: '14px', color: '#0369a1', fontWeight: '500' }}>Member Investment:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e3a5f' }}>{formatCurrency(memberInvestment)}</span>
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
                  disabled={isProcessing}
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
                  onClick={() => setShowAddLoanConfirmation(true)}
                  disabled={isProcessing || memberNotFound || memberLoading || (requiresCollateral && !isCollateralValid())}
                >
                  {isProcessing ? (
                    <>
                      <div style={{...styles.spinner, width: '16px', height: '16px', borderWidth: '2px'}}></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Add Approved Loan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Collateral Details Modal */}
        {showCollateralModal && (
          <div style={styles.modalOverlay} onClick={() => setShowCollateralModal(false)}>
            <div style={{...styles.modalCard, ...styles.collateralModal}} onClick={(e) => e.stopPropagation()}>
              <div style={{...styles.modalHeader, ...styles.collateralHeader}}>
                <h2 style={styles.modalTitle}>Collateral Details</h2>
                <button 
                  onClick={() => setShowCollateralModal(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closeCollateralModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeCollateralModal')}
                  onMouseLeave={() => handleMouseLeave('closeCollateralModal')}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={{...styles.modalContent, padding: 0}}>
                <div style={{padding: '20px'}}>
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Collateral Type<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      style={styles.formSelect}
                      value={collateralType}
                      onChange={(e) => setCollateralType(e.target.value)}
                    >
                      <option value="">Select Collateral Type</option>
                      {collateralOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Collateral Value<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Enter collateral value"
                      value={collateralValue}
                      onChange={(e) => setCollateralValue(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Collateral Description<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div style={styles.descriptionHint}>
                      Please include the following details if applicable:
                    </div>
                    <div style={styles.descriptionBullet}>• Make, model, and serial number</div>
                    <div style={styles.descriptionBullet}>• Physical condition</div>
                    <div style={styles.descriptionBullet}>• Location</div>
                    <div style={styles.descriptionBullet}>• Ownership documents</div>
                    <div style={styles.descriptionBullet}>• Any identifying marks</div>
                    <textarea
                      placeholder="Describe your collateral in detail..."
                      value={collateralDescription}
                      onChange={(e) => setCollateralDescription(e.target.value)}
                      style={{
                        ...styles.formInput,
                        height: '120px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Proof of Collateral<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    {proofOfCollateral ? (
                      <div>
                        <img 
                          src={URL.createObjectURL(proofOfCollateral)} 
                          alt="Proof of Collateral" 
                          style={styles.proofPreview}
                        />
                        <button
                          style={{
                            ...styles.uploadButton,
                            ...(isHovered.changeProof ? styles.uploadButtonHover : {})
                          }}
                          onMouseEnter={() => handleMouseEnter('changeProof')}
                          onMouseLeave={() => handleMouseLeave('changeProof')}
                          onClick={() => document.getElementById('proofOfCollateral').click()}
                        >
                          <FaFileAlt style={{ color: '#2D5783', fontSize: '16px' }} />
                          <span style={styles.uploadButtonText}>Change Photo</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{
                          ...styles.uploadButton,
                          ...(isHovered.uploadProof ? styles.uploadButtonHover : {})
                        }}
                        onMouseEnter={() => handleMouseEnter('uploadProof')}
                        onMouseLeave={() => handleMouseLeave('uploadProof')}
                        onClick={() => document.getElementById('proofOfCollateral').click()}
                      >
                        <FaFileAlt style={{ color: '#2D5783', fontSize: '16px' }} />
                        <span style={styles.uploadButtonText}>Add Photo</span>
                      </button>
                    )}
                    <input
                      id="proofOfCollateral"
                      style={{ display: 'none' }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setProofOfCollateral)}
                    />
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <button
                      style={{
                        ...styles.primaryButton,
                        flex: 1,
                        ...(!isCollateralValid() && { backgroundColor: '#cccccc', cursor: 'not-allowed' })
                      }}
                      onClick={() => {
                        if (isCollateralValid()) {
                          setShowCollateralModal(false);
                          setRequiresCollateral(true);
                        }
                      }}
                      disabled={!isCollateralValid()}
                    >
                      <FaCheckCircle />
                      Save Collateral Details
                    </button>
                    
                    <button
                      style={{
                        ...styles.secondaryButton,
                        flex: 1
                      }}
                      onClick={() => setShowCollateralModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showAddLoanConfirmation && (
          <div style={styles.modalOverlay}>
            <div style={styles.centeredModal}>
              <div style={styles.modalCardSmall}>
                <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
                <p style={styles.modalText}>
                  {requiresCollateral 
                    ? 'This loan requires collateral. Are you sure you want to proceed?' 
                    : 'Are you sure you want to add this approved loan?'}
                </p>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button 
                    style={{
                      ...styles.secondaryButton,
                      flex: 1
                    }} 
                    onClick={() => setShowAddLoanConfirmation(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      ...styles.primaryButton,
                      flex: 1
                    }}
                    onClick={async () => { 
                      setActionInProgress(true); 
                      setShowAddLoanConfirmation(false); 
                      await handleAddApprovedLoan(); 
                      setActionInProgress(false); 
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.centeredModal}>
              <div style={styles.modalCardSmall}>
                <FaCheckCircle style={{ ...styles.confirmIcon, color: '#059669' }} />
                <h2 style={{...styles.modalTitle, fontSize: '18px', marginBottom: '10px'}}>Success!</h2>
                <p style={styles.modalText}>
                  {successMessage}
                </p>
                <button
                  style={{
                    ...styles.primaryButton,
                    width: '100%'
                  }}
                  onClick={() => setSuccessModalVisible(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.centeredModal}>
              <div style={styles.modalCardSmall}>
                <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
                <h2 style={{fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0'}}>Error</h2>
                <p style={styles.modalText}>
                  {errorMessage}
                </p>
                <button
                  style={{
                    ...styles.primaryButton,
                    width: '100%'
                  }}
                  onClick={() => setErrorModalVisible(false)}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingContent}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingTextOverlay}>Processing loan...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;