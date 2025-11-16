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
    width: '400px',
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
  },
  // Confirmation modal styles matching ApplyLoan
  modalButtonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '20px',
    gap: '10px'
  },
  modalButton: {
    paddingVertical: '10px',
    paddingHorizontal: '20px',
    borderRadius: '5px',
    minWidth: '45%',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  cancelButtonText: {
    color: '#333',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  confirmButton: {
    backgroundColor: '#2C5282',
    color: 'white'
  },
  confirmButtonText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  // Savings modal styles
  savingsConfirmModal: {
    width: '400px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  savingsInfoBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    textAlign: 'left'
  },
  savingsInfoTitle: {
    fontSize: '14px',
    color: '#856404',
    fontWeight: '600',
    marginBottom: '10px'
  },
  savingsInfoText: {
    fontSize: '13px',
    color: '#856404',
    lineHeight: '1.5'
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
  const [isHovered, setIsHovered] = useState({});
  
  // States for the ApplyLoan-like flow
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingApiData, setPendingApiData] = useState(null);
  const [showSavingsConfirmModal, setShowSavingsConfirmModal] = useState(false);
  const [savingsShortfall, setSavingsShortfall] = useState({ needed: 0, available: 0, remaining: 0 });
  const [pendingLoanForSavings, setPendingLoanForSavings] = useState(null);
  
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
    accountNumber: '',
    bankType: ''
  });

  const [loanTypes, setLoanTypes] = useState([]);
  const [interestByType, setInterestByType] = useState({});
  const [processingFee, setProcessingFee] = useState(0);
  const [loanableAmountPercentage, setLoanableAmountPercentage] = useState(80);

  // Member validation states
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  // Collateral related states
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

  // Bank Type Options
  const bankTypeOptions = [
    { key: 'BDO', label: 'BDO' },
    { key: 'Security Bank', label: 'Security Bank' },
    { key: 'BPI', label: 'BPI' },
    { key: 'ChinaBank', label: 'ChinaBank' },
    { key: 'Others', label: 'Others' },
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
        box-shadow: '0 10px 25px rgba(0,0,0,0.1)';
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

  // Load Settings for LoanTypes, InterestRateByType, and ProcessingFee
  useEffect(() => {
    const settingsRef = database.ref('Settings');
    const cb = (snap) => {
      const s = snap.val() || {};
      const lt = s.LoanTypes;
      const isMap = lt && typeof lt === 'object' && !Array.isArray(lt);
      const typesArr = isMap ? Object.keys(lt) : (lt || ['Regular Loan', 'Quick Cash']);
      setLoanTypes(typesArr);
      setInterestByType(isMap ? lt : (s.InterestRateByType || {}));
      setProcessingFee(parseFloat(s.ProcessingFee) || 0);
      setLoanableAmountPercentage(parseFloat(s.LoanPercentage) || 80);
      
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

  // Fetch member data when member ID is entered
  const fetchMemberData = async (memberId) => {
    if (!memberId) {
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

  // Check if form is valid
  const isFormValid = () => {
    const basicFieldsValid = 
      addForm.memberId && 
      addForm.firstName && 
      addForm.lastName && 
      addForm.email && 
      addForm.loanAmount && 
      addForm.term && 
      addForm.disbursement;

    const accountsOk = addForm.disbursement === 'Cash' || 
      (addForm.accountName && addForm.accountNumber && 
       (addForm.disbursement !== 'Bank' || addForm.bankType));

    if (requiresCollateral) {
      return basicFieldsValid && accountsOk && isCollateralValid();
    }

    return basicFieldsValid && accountsOk;
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

  // Polling every 5 seconds
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
      accountNumber: '',
      bankType: ''
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

    if (field === 'memberId') {
      fetchMemberData(value);
    }

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

  // Generate transaction ID function
  const generateTransactionId = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Process database approval (EXACT SAME AS ApplyLoans)
  const processDatabaseApprove = async (loanData, deductBalance, deductFunds, savingsAmount = 0) => {
    try {
      const { memberId, loanAmount, term, loanType } = loanData;
      
      const originalTransactionId = generateTransactionId();
      const newTransactionId = generateTransactionId();

      const approvedRef = database.ref(`Loans/ApprovedLoans/${memberId}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${memberId}/${newTransactionId}`);
      const currentLoanRef = database.ref(`Loans/CurrentLoans/${memberId}/${newTransactionId}`);
      const memberLoanRef = database.ref(`Members/${memberId}/loans/${newTransactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      
      const interestRatePercentage = Number(interestByType?.[loanType]?.[term]) || 0;
      const interestRateDecimal = interestRatePercentage / 100;
      const amount = parseFloat(loanAmount);
      const termMonths = parseInt(term);
      
      const interestPerTerm = amount * interestRateDecimal;
      const totalInterest = interestPerTerm * termMonths;
      const totalTermPayment = amount + totalInterest;
      const totalMonthlyPayment = totalTermPayment / termMonths;
      const monthlyPrincipal = amount / termMonths;
      const releaseAmount = amount - processingFee;

      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 30);

      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const formattedDueDate = formatDate(dueDate);

      const approvedData = {
        id: memberId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        loanAmount: amount,
        loanType: loanType,
        term: termMonths,
        disbursement: addForm.disbursement,
        accountName: addForm.accountName,
        accountNumber: addForm.accountNumber,
        bankType: addForm.disbursement === 'Bank' ? addForm.bankType : null,
        interestRate: interestRatePercentage,
        interest: Math.round(interestPerTerm * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        monthlyPayment: Math.round(monthlyPrincipal * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        totalTermPayment: Math.round(totalTermPayment * 100) / 100,
        releaseAmount: Math.round(releaseAmount * 100) / 100,
        processingFee: processingFee,
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        timestamp: now.getTime(),
        dueDate: formattedDueDate,
        status: 'approved',
        paymentsMade: 0,
        amountPaid: 0,
        remainingBalance: Math.round(totalTermPayment * 100) / 100,
        borrowedFromSavings: Math.round(savingsAmount * 100) / 100,
        requiresCollateral,
        ...(requiresCollateral && {
          collateralType,
          collateralValue,
          collateralDescription,
          proofOfCollateralUrl: proofOfCollateral ? URL.createObjectURL(proofOfCollateral) : null
        })
      };

      // Save to all locations (same as ApplyLoans)
      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);

      // Deduct from member balance
      const memberBalanceRef = database.ref(`Members/${memberId}/balance`);
      const [balanceSnap, fundsSnap] = await Promise.all([
        memberBalanceRef.once('value'),
        fundsRef.once('value')
      ]);

      const currentBalance = parseFloat(balanceSnap.val()) || 0;
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      const newMemberBalance = Math.max(0, Math.ceil((currentBalance - deductBalance) * 100) / 100);
      await memberBalanceRef.set(newMemberBalance);

      // Deduct from funds
      const newFundsAmount = currentFunds - deductFunds;
      await fundsRef.set(newFundsAmount);

      // Funds history (same as ApplyLoans)
      const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${timestamp}`);
      await fundsHistoryRef.set(newFundsAmount);

      // Savings handling (same as ApplyLoans)
      const dateKey = now.toISOString().split('T')[0];
      const savingsRef = database.ref('Settings/Savings');
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');

      const [savingsSnap, currentDaySavingsSnap] = await Promise.all([
        savingsRef.once('value'),
        savingsHistoryRef.child(dateKey).once('value')
      ]);

      const currentSavings = parseFloat(savingsSnap.val()) || 0;
      const savingsChange = -savingsAmount + processingFee;
      const newSavingsAmount = Math.ceil((currentSavings + savingsChange) * 100) / 100;
      await savingsRef.set(newSavingsAmount);

      const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
      const newDaySavings = Math.ceil((currentDaySavings + savingsChange) * 100) / 100;
      await savingsHistoryRef.child(dateKey).set(newDaySavings);

      console.log(`Auto-approval: Member balance deducted: ${formatCurrency(deductBalance)}, funds deducted: ${formatCurrency(deductFunds)}, savings change: ${formatCurrency(savingsChange)}`);

      return true;
    } catch (err) {
      console.error('Auto-approval DB error:', err);
      throw new Error(err.message || 'Failed to auto-approve loan');
    }
  };

  // Process database approve with savings (EXACT SAME AS ApplyLoans)
  const processDatabaseApproveWithSavings = async (loanData, savingsAmount) => {
    try {
      const { memberId, loanAmount, term, loanType } = loanData;
      
      const originalTransactionId = generateTransactionId();
      const newTransactionId = generateTransactionId();

      const approvedRef = database.ref(`Loans/ApprovedLoans/${memberId}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${memberId}/${newTransactionId}`);
      const currentLoanRef = database.ref(`Loans/CurrentLoans/${memberId}/${newTransactionId}`);
      const memberLoanRef = database.ref(`Members/${memberId}/loans/${newTransactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      const memberBalanceRef = database.ref(`Members/${memberId}/balance`);
      
      const interestRatePercentage = Number(interestByType?.[loanType]?.[term]) || 0;
      const interestRateDecimal = interestRatePercentage / 100;
      const amount = parseFloat(loanAmount);
      const termMonths = parseInt(term);
      
      const interestPerTerm = amount * interestRateDecimal;
      const totalInterest = interestPerTerm * termMonths;
      const totalTermPayment = amount + totalInterest;
      const totalMonthlyPayment = totalTermPayment / termMonths;
      const monthlyPrincipal = amount / termMonths;
      const releaseAmount = amount - processingFee;

      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 30);

      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const formattedDueDate = formatDate(dueDate);

      const approvedData = {
        id: memberId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        loanAmount: amount,
        loanType: loanType,
        term: termMonths,
        disbursement: addForm.disbursement,
        accountName: addForm.accountName,
        accountNumber: addForm.accountNumber,
        bankType: addForm.disbursement === 'Bank' ? addForm.bankType : null,
        interestRate: interestRatePercentage,
        interest: Math.round(interestPerTerm * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        monthlyPayment: Math.round(monthlyPrincipal * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        totalTermPayment: Math.round(totalTermPayment * 100) / 100,
        releaseAmount: Math.round(releaseAmount * 100) / 100,
        processingFee: processingFee,
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        timestamp: now.getTime(),
        dueDate: formattedDueDate,
        status: 'approved',
        paymentsMade: 0,
        amountPaid: 0,
        remainingBalance: Math.round(totalTermPayment * 100) / 100,
        borrowedFromSavings: Math.round(savingsAmount * 100) / 100,
        requiresCollateral,
        ...(requiresCollateral && {
          collateralType,
          collateralValue,
          collateralDescription,
          proofOfCollateralUrl: proofOfCollateral ? URL.createObjectURL(proofOfCollateral) : null
        })
      };

      // Save to all locations
      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);

      // Deduct from member balance first
      const [balanceSnap, fundsSnap] = await Promise.all([
        memberBalanceRef.once('value'),
        fundsRef.once('value')
      ]);

      const currentBalance = parseFloat(balanceSnap.val()) || 0;
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      const balanceToDeduct = Math.min(amount, currentBalance);
      const remainingAfterBalance = amount - balanceToDeduct;
      const newMemberBalance = Math.max(0, Math.ceil((currentBalance - balanceToDeduct) * 100) / 100);
      await memberBalanceRef.set(newMemberBalance);

      // Deduct from funds
      const fundsToDeduct = Math.min(remainingAfterBalance, currentFunds);
      const remainingAfterFunds = remainingAfterBalance - fundsToDeduct;
      const newFundsAmount = currentFunds - fundsToDeduct;
      await fundsRef.set(newFundsAmount);

      // Funds history
      const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${timestamp}`);
      await fundsHistoryRef.set(newFundsAmount);

      // Savings handling
      const dateKey = now.toISOString().split('T')[0];
      const savingsRef = database.ref('Settings/Savings');
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');

      const [savingsSnap, currentDaySavingsSnap] = await Promise.all([
        savingsRef.once('value'),
        savingsHistoryRef.child(dateKey).once('value')
      ]);

      const currentSavings = parseFloat(savingsSnap.val()) || 0;
      const newSavingsAmount = Math.ceil((currentSavings - savingsAmount + processingFee) * 100) / 100;
      await savingsRef.set(newSavingsAmount);

      const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
      const netSavingsChange = processingFee - savingsAmount;
      const newDaySavings = Math.ceil((currentDaySavings + netSavingsChange) * 100) / 100;
      await savingsHistoryRef.child(dateKey).set(newDaySavings);

      console.log(`Auto-approval with savings: Member balance deducted: ${formatCurrency(balanceToDeduct)}, funds deducted: ${formatCurrency(fundsToDeduct)}, savings deducted: ${formatCurrency(savingsAmount)}`);

      return true;
    } catch (err) {
      console.error('Auto-approval with savings DB error:', err);
      throw new Error(err.message || 'Failed to auto-approve loan with savings');
    }
  };

  // Auto approve loan (EXACT SAME LOGIC AS ApplyLoans)
  const autoApproveLoan = async () => {
    try {
      setIsProcessing(true);

      const loanAmountNum = parseFloat(addForm.loanAmount);
      const requestedAmount = loanAmountNum;

      // Fetch fresh member data
      const memberSnap = await database.ref(`Members/${addForm.memberId}`).once('value');
      const memberBalance = parseFloat(memberSnap.child('balance').val()) || 0;
      const memberInvestment = parseFloat(memberSnap.child('investment').val()) || 0;

      // Fetch current funds
      const fundsSnap = await database.ref('Settings/Funds').once('value');
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      // Fetch available savings
      const savingsSnap = await database.ref('Settings/Savings').once('value');
      const currentSavings = parseFloat(savingsSnap.val()) || 0;

      const isWithinInvestment = requestedAmount <= memberInvestment;
      let deductBalance, deductFunds, shortfall;

      if (isWithinInvestment) {
        deductBalance = Math.min(requestedAmount, memberBalance);
        deductFunds = Math.min(requestedAmount, currentFunds);
        shortfall = 0;

        if (deductBalance + deductFunds < requestedAmount) {
          throw new Error('Insufficient member balance and funds to cover the loan amount.');
        }

        // No shortfall, proceed to success
        await processDatabaseApprove(
          {
            memberId: addForm.memberId,
            loanAmount: addForm.loanAmount,
            term: addForm.term,
            loanType: addForm.loanType
          },
          deductBalance,
          deductFunds,
          0
        );

        setSuccessMessage('Loan approved successfully!');
      } else {
        // For loans exceeding investment: use full investment amount from both balance AND funds
        deductBalance = Math.min(memberInvestment, memberBalance);
        deductFunds = Math.min(memberInvestment, currentFunds);
        
        // Calculate shortfall correctly - only the amount exceeding investment
        shortfall = Math.max(0, requestedAmount - memberInvestment);

        if (shortfall > currentSavings) {
          throw new Error(`Insufficient savings to cover shortfall. Needed: ${formatCurrency(shortfall)}, Available: ${formatCurrency(currentSavings)}`);
        }

        // Show savings confirmation modal for shortfall if loan > investment
        setSavingsShortfall({
          needed: shortfall,
          available: currentSavings,
          remaining: currentSavings - shortfall + processingFee,
          processingFee: processingFee,
          deductFromBalance: deductBalance,
          deductFromFunds: deductFunds,
          loanAmount: requestedAmount
        });
        setPendingLoanForSavings({
          memberId: addForm.memberId,
          loanAmount: addForm.loanAmount,
          term: addForm.term,
          loanType: addForm.loanType
        });
        setShowSavingsConfirmModal(true);
        setIsProcessing(false);
        return;
      }

      // Prepare API data for background processing
      const loanData = {
        email: addForm.email,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        amount: loanAmountNum,
        term: addForm.term,
        date: new Date().toISOString(),
      };

      setPendingApiData(loanData);
      setSuccessMessage('Loan approved successfully! The member will receive a confirmation email shortly.');
      setSuccessModalVisible(true);
      
    } catch (error) {
      console.error('Error during loan approval:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again later.');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle savings confirmation
  const handleSavingsConfirm = async () => {
    if (!pendingLoanForSavings) return;

    setShowSavingsConfirmModal(false);

    try {
      await processDatabaseApproveWithSavings(
        pendingLoanForSavings,
        savingsShortfall.needed
      );

      setSuccessMessage('Loan approved successfully using savings!');

      // Prepare API data for background processing
      const loanData = {
        email: addForm.email,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        amount: parseFloat(addForm.loanAmount),
        term: addForm.term,
        date: new Date().toISOString(),
      };

      setPendingApiData(loanData);
      setSuccessMessageModalVisible(true);
      setPendingLoanForSavings(null);
      setSavingsShortfall({ needed: 0, available: 0, remaining: 0 });
    } catch (error) {
      console.error('Error during savings approval:', error);
      setErrorMessage(error.message || 'Failed to approve loan with savings.');
      setErrorModalVisible(true);
    }
  };

  const handleSavingsCancel = () => {
    setShowSavingsConfirmModal(false);
    setPendingLoanForSavings(null);
    setSavingsShortfall({ needed: 0, available: 0, remaining: 0 });
  };

  // Handle success OK
  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    
    // Close modal and refresh data
    closeAddModal();
    fetchLoansDataForSection('approvedLoans');
    
    // Run API call in background
    if (pendingApiData) {
      setTimeout(async () => {
        try {
          const { ApproveLoans } = await import('../../../../../Server/api');
          await ApproveLoans({
            memberId: addForm.memberId,
            transactionId: generateTransactionId(),
            amount: pendingApiData.amount.toFixed(2),
            term: pendingApiData.term,
            dateApproved: formatDate(new Date()),
            timeApproved: formatTime(new Date()),
            email: addForm.email,
            firstName: addForm.firstName,
            lastName: addForm.lastName,
            status: 'approved',
            interestRate: (Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0).toFixed(1) + '%',
            interest: (pendingApiData.amount * (Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0) / 100).toFixed(2),
            totalInterest: (pendingApiData.amount * (Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0) / 100 * parseInt(addForm.term)).toFixed(2),
            monthlyPayment: (pendingApiData.amount / parseInt(addForm.term)).toFixed(2),
            totalMonthlyPayment: ((pendingApiData.amount + (pendingApiData.amount * (Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0) / 100 * parseInt(addForm.term))) / parseInt(addForm.term)).toFixed(2),
            totalTermPayment: (pendingApiData.amount + (pendingApiData.amount * (Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0) / 100 * parseInt(addForm.term))).toFixed(2),
            releaseAmount: (pendingApiData.amount - processingFee).toFixed(2),
            processingFee: processingFee.toFixed(2),
            dueDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 30)))
          });
          console.log('Loan API call completed successfully in background');
        } catch (apiError) {
          console.error('Background API call failed:', apiError);
        }
      }, 100);
      
      setPendingApiData(null);
    }
  };

  // Show confirmation alert (following ApplyLoan design)
  const showConfirmationAlert = () => {
    const loanAmountNum = parseFloat(addForm.loanAmount) || 0;
    const processingFeeNum = parseFloat(processingFee) || 0;
    const releaseAmount = loanAmountNum - processingFeeNum;

    let message = `Loan Type: ${addForm.loanType}\n` +
      `Loan Amount: ${formatCurrency(loanAmountNum)}\n` +
      `Processing Fee: ${formatCurrency(processingFeeNum)}\n` +
      `Release Amount: ${formatCurrency(releaseAmount)}\n` +
      `Term: ${addForm.term} ${addForm.term === '1' ? 'Month' : 'Months'}\n` +
      `Disbursement: ${addForm.disbursement}`;

    if (addForm.disbursement !== 'Cash') {
      message += `\nAccount Name: ${addForm.accountName}\nAccount Number: ${addForm.accountNumber}`;
      if (addForm.disbursement === 'Bank') {
        message += `\nBank Type: ${addForm.bankType}`;
      }
    }

    if (requiresCollateral) {
      message += `\n\nCollateral Details\n` +
        `Type: ${collateralType}\n` +
        `Value: ${formatCurrency(collateralValue)}\n` +
        `Description: ${collateralDescription}\n` +
        `Proof: ${proofOfCollateral ? 'Uploaded' : 'Not provided'}`;
    }

    setConfirmMessage(message);
    setConfirmAction(() => () => {
      autoApproveLoan();
    });
    setConfirmModalVisible(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isFormValid()) {
      setErrorMessage('Please fill all required fields');
      setErrorModalVisible(true);
      return;
    }

    if (memberNotFound) {
      setErrorMessage('Member not found. Please check the Member ID');
      setErrorModalVisible(true);
      return;
    }

    const loanAmountNum = Number(addForm.loanAmount) || 0;

    if (loanAmountNum > memberBalance) {
      if (!isCollateralValid()) {
        setRequiresCollateral(true);
        setErrorMessage('Loan amount exceeds member balance. Please add collateral or lower the amount.');
        setErrorModalVisible(true);
        return;
      }
      setRequiresCollateral(true);
    } else {
      setRequiresCollateral(false);
    }

    showConfirmationAlert();
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  // Print functionality (same as before)
  const handlePrint = (format = 'print') => {
    setPrinting(true);
    
    try {
      const sectionTitle = 
        activeSection === 'applyLoans' ? 'Pending Loans' :
        activeSection === 'approvedLoans' ? 'Approved Loans' :
        'Rejected Loans';

      // ... (rest of print functionality remains the same)
      
      setPrinting(false);
    } catch (error) {
      console.error('Error printing data:', error);
      setErrorMessage('Failed to print data');
      setErrorModalVisible(true);
      setPrinting(false);
    }
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
                        {addForm.disbursement !== 'Cash' && <span style={styles.requiredAsterisk}>*</span>}
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
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Account Number
                        {addForm.disbursement !== 'Cash' && <span style={styles.requiredAsterisk}>*</span>}
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter account number"
                        value={addForm.accountNumber}
                        onChange={(e) => updateForm('accountNumber', e.target.value)}
                      />
                    </div>

                    {addForm.disbursement === 'Bank' && (
                      <div style={styles.formSection}>
                        <label style={styles.formLabel}>
                          Bank Type<span style={styles.requiredAsterisk}>*</span>
                        </label>
                        <select
                          style={styles.formSelect}
                          value={addForm.bankType}
                          onChange={(e) => updateForm('bankType', e.target.value)}
                        >
                          <option value="">Select Bank Type</option>
                          {bankTypeOptions.map((bank) => (
                            <option key={bank.key} value={bank.key}>{bank.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collateral Section */}
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
                    ...(isHovered.submitButton ? styles.primaryButtonHover : {}),
                    ...(!isFormValid() && { backgroundColor: '#cccccc', cursor: 'not-allowed' })
                  }}
                  onMouseEnter={() => handleMouseEnter('submitButton')}
                  onMouseLeave={() => handleMouseLeave('submitButton')}
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isProcessing || memberNotFound || memberLoading}
                >
                  {isProcessing ? (
                    <>
                      <div style={{...styles.spinner, width: '16px', height: '16px', borderWidth: '2px'}}></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Approve Loan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collateral Details Modal */}
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
        {confirmModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2C5282' }} />
              <h2 style={styles.modalTitle}>
                {requiresCollateral ? 'Collateral Required' : 'Confirm Loan Approval'}
              </h2>
              <div style={{ width: '100%', marginBottom: '20px' }}>
                {requiresCollateral ? (
                  <p style={styles.modalText}>
                    Loan amount is more than the member's balance, this requires collateral, do you want to continue?
                  </p>
                ) : (
                  <>
                    <p style={styles.modalText}>Member Balance: {formatCurrency(memberBalance)}</p>
                    <p style={styles.modalText}>Loan Type: {addForm.loanType}</p>
                    <p style={styles.modalText}>Loan Amount: {formatCurrency(addForm.loanAmount || 0)}</p>
                    <p style={styles.modalText}>Processing Fee: {formatCurrency(processingFee || 0)}</p>
                    <p style={styles.modalText}>Release Amount: {formatCurrency((parseFloat(addForm.loanAmount || 0) - parseFloat(processingFee || 0)) || 0)}</p>
                    <p style={styles.modalText}>Term: {addForm.term} {addForm.term === '1' ? 'Month' : 'Months'}</p>
                    <p style={styles.modalText}>Interest Rate: {(Number(interestByType?.[addForm.loanType]?.[addForm.term]) || 0).toFixed(1)}%</p>
                    <p style={styles.modalText}>Disbursement: {addForm.disbursement}</p>
                    {addForm.disbursement !== 'Cash' && (
                      <>
                        <p style={styles.modalText}>Account Name: {addForm.accountName}</p>
                        <p style={styles.modalText}>Account Number: {addForm.accountNumber}</p>
                        {addForm.disbursement === 'Bank' && (
                          <p style={styles.modalText}>Bank Type: {addForm.bankType}</p>
                        )}
                      </>
                    )}
                    {requiresCollateral && (
                      <>
                        <p style={{...styles.modalText, marginTop: '8px', fontWeight: '700', color: '#2C5282' }}>Collateral Details</p>
                        <p style={styles.modalText}>Type: {collateralType}</p>
                        <p style={styles.modalText}>Value: {formatCurrency(collateralValue || 0)}</p>
                        <p style={styles.modalText}>Description: {collateralDescription}</p>
                        <p style={styles.modalText}>Proof: {proofOfCollateral ? 'Uploaded' : 'Not provided'}</p>
                      </>
                    )}
                  </>
                )}
              </div>
              <div style={styles.modalButtonContainer}>
                <button 
                  style={{
                    ...styles.modalButton,
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd'
                  }} 
                  onClick={() => {
                    setConfirmModalVisible(false);
                    if (requiresCollateral) {
                      setShowCollateralModal(true);
                    }
                  }}
                >
                  <span style={styles.cancelButtonText}>{requiresCollateral ? 'No' : 'Cancel'}</span>
                </button>
                <button 
                  style={{
                    ...styles.modalButton,
                    ...styles.confirmButton
                  }} 
                  onClick={() => {
                    setConfirmModalVisible(false);
                    if (confirmAction) { 
                      confirmAction(); 
                      setConfirmAction(null); 
                    }
                  }}
                >
                  <span style={styles.confirmButtonText}>{requiresCollateral ? 'Yes' : 'Approve'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Savings Confirmation Modal */}
        {showSavingsConfirmModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.savingsConfirmModal}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
              <div style={styles.modalTitle}>
                Insufficient Funds - Use Savings?
              </div>
              <div style={styles.savingsInfoBox}>
                <div style={styles.savingsInfoTitle}>Loan Approval Breakdown:</div>
                <div style={styles.savingsInfoText}>
                  • Loan Amount: <strong>{formatCurrency(savingsShortfall.loanAmount)}</strong><br/>
                  • Deduct from Member Balance: <strong>{formatCurrency(savingsShortfall.deductFromBalance)}</strong><br/>
                  • Deduct from Funds: <strong>{formatCurrency(savingsShortfall.deductFromFunds)}</strong><br/>
                  • Deduct from Savings: <strong>{formatCurrency(savingsShortfall.needed)}</strong><br/>
                  • Processing Fee Added to Savings: <strong>{formatCurrency(savingsShortfall.processingFee)}</strong><br/>
                  • Savings After Approval: <strong>{formatCurrency(savingsShortfall.remaining)}</strong>
                </div>
              </div>
              <p style={styles.modalText}>
                The loan amount exceeds available balance and funds. Would you like to use <strong>{formatCurrency(savingsShortfall.needed)}</strong> from savings to cover the shortfall? Note that the processing fee of <strong>{formatCurrency(savingsShortfall.processingFee)}</strong> will be added to savings.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    ...styles.primaryButton,
                    ...styles.approveButton
                  }}
                  onClick={handleSavingsConfirm}
                >
                  Yes, Use Savings
                </button>
                <button
                  style={{
                    ...styles.secondaryButton,
                    ...styles.rejectButton
                  }}
                  onClick={handleSavingsCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
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
                  width: '100%',
                  marginTop: '10px'
                }}
                onClick={handleSuccessOk}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
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
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingContent}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingTextOverlay}>Approving loan...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
