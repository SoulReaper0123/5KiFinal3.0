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
  FaUser,
  FaMoneyBillWave,
  FaCreditCard,
  FaCalendarAlt,
  FaReceipt,
  FaBan,
  FaSpinner
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, storage } from '../../../../../Database/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import PendingPayments from './PaymentApplications';
import CompletedPayments from './ApprovedPayments';
import FailedPayments from './RejectedPayments';
import { ApprovePayments } from '../../../../../Server/api';
import logoImage from '../../../../../assets/logo.png';

// Constants
const paymentOptions = [
  { key: 'Bank', label: 'Bank' },
  { key: 'GCash', label: 'GCash' },
  { key: 'Cash-on-Hand', label: 'Cash on Hand' }
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
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// FIXED: Date parsing functions from React Native component
const parseDateTime = (dateInput) => {
  try {
    if (!dateInput) return null;
    if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
      return new Date(dateInput.seconds * 1000);
    }
    if (typeof dateInput === 'string') {
      if (dateInput.includes(' at ')) {
        const [datePart, timePart] = dateInput.split(' at ');
        if (datePart.includes('/')) {
          const [month, day, year] = datePart.split('/');
          const [hours, minutes] = timePart.split(':');
          return new Date(year, month - 1, day, hours, minutes);
        } else {
          const parsed = new Date(dateInput.replace(' at ', ' '));
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
        const parsed = new Date(dateInput + ' 00:00:00');
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return new Date(dateInput + 'T00:00:00');
      }
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
    return null;
  } catch {
    return null;
  }
};

const computeOverdueDays = (raw) => {
  const d = parseDateTime(raw);
  if (!d) return 0;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (startToday < startDue) return 0;
  const diffMs = startToday.getTime() - startDue.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
  addPaymentButton: {
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
  addPaymentButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 15px 30px rgba(30, 64, 175, 0.4)'
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
  // Loan selection styles
  loanInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #e9ecef'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: '10px',
    textAlign: 'center'
  },
  loanSelectItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  loanSelectItemActive: {
    borderColor: '#2D5783',
    backgroundColor: '#F1F5F9'
  },
  loanSelectTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: '4px'
  },
  loanSelectSub: {
    fontSize: '12px',
    color: '#475569'
  },
  checkboxArea: {
    paddingLeft: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Confirmation modal styles (matching PaymentApplications)
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
  // Financial info styles
  financialCard: {
    backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  financialLabel: {
    fontSize: '0.875rem',
    color: '#0369a1',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600'
  },

  // Error text styles
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500'
  },
  // Loan Details Modal Styles
  loanDetailsModal: {
    maxWidth: '600px',
    maxHeight: '80vh'
  },
  loanDetailsContent: {
    padding: '0'
  },
  loanDetailsHeader: {
    backgroundColor: '#E8F1FB',
    padding: '16px',
    borderRadius: '14px 14px 0 0',
    marginBottom: '0'
  },
  loanDetailsBody: {
    padding: '20px'
  },
  loanDetailsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #E2E8F0'
  },
  loanDetailsLabel: {
    color: '#64748B',
    fontSize: '14px',
    fontWeight: '600',
    flex: 1
  },
  loanDetailsValue: {
    color: '#0F172A',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1
  },
  loanDetailsValueOverdue: {
    color: '#D32F2F'
  },
  overdueBadge: {
    color: '#D32F2F',
    fontSize: '12px',
    fontWeight: '700',
    marginTop: '4px'
  },
  paymentSummarySection: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    marginTop: '16px',
    borderRadius: '8px',
    borderBottom: '1px solid #E2E8F0'
  },
  totalDueRow: {
    backgroundColor: '#F1F5F9',
    borderTop: '2px solid #E2E8F0',
    padding: '16px',
    marginTop: '16px',
    borderRadius: '0 0 8px 8px'
  },
  totalDueLabel: {
    color: '#1E3A5F',
    fontSize: '16px',
    fontWeight: '700'
  },
  totalDueValue: {
    color: '#1E3A5F',
    fontSize: '18px',
    fontWeight: '800'
  },
  overdueWarning: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    border: '1px solid #D32F2F',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '16px'
  },
  overdueWarningText: {
    color: '#D32F2F',
    fontSize: '14px',
    fontWeight: '600',
    marginLeft: '8px',
    flex: 1
  },
  viewDetailsButton: {
    backgroundColor: 'transparent',
    border: '1px solid #2D5783',
    color: '#2D5783',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: '8px'
  },
  viewDetailsButtonHover: {
    backgroundColor: '#2D5783',
    color: 'white'
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

  disabledButton: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    opacity: '0.7',
    '&:hover': {
      transform: 'none',
      boxShadow: 'none'
    }
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
    width: '80%',
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    alignItems: 'center',
    maxWidth: '500px',
  },
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
  modalContent: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
      maxHeight: '60vh', // Add this
  paddingRight: '10px', // Add some padding for scrollbar
  },
  modalActions: {
    padding: '24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0
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
};

const PayLoans = () => {
  const [activeSection, setActiveSection] = useState('pendingPayments');
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [failed, setFailed] = useState([]);
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
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);

  const pageSize = 10;
  const [formData, setFormData] = useState({
    memberId: '',
    firstName: '',
    lastName: '',
    email: '',
    paymentOption: '',
    accountName: '',
    accountNumber: '',
    amount: '',
  });
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' },
    'Cash-on-Hand': { accountName: '', accountNumber: '' }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  
  // New states for loan selection
  const [activeLoans, setActiveLoans] = useState([]);
  
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [currentLoan, setCurrentLoan] = useState(null);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [totalAmountDue, setTotalAmountDue] = useState(0);
  const [overdueDays, setOverdueDays] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // Member validation states
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  
  // Loan Details Modal State
  const [loanDetailsModalVisible, setLoanDetailsModalVisible] = useState(false);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState(null);
  
  // Print Modal State
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);

  // View Details button hover states
  const [viewDetailsHovered, setViewDetailsHovered] = useState({});

  // Admin data for print report
  const [adminData, setAdminData] = useState(null);

  // Payment processing states (same as PaymentApplications)
  const [currentAction, setCurrentAction] = useState(null);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState(null);

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
      const [pSnap, cSnap, fSnap, settingsSnap] = await Promise.all([
        database.ref('Payments/PaymentApplications').once('value'),
        database.ref('Payments/ApprovedPayments').once('value'),
        database.ref('Payments/RejectedPayments').once('value'),
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
      setCompleted(toArray(cSnap));
      setFailed(toArray(fSnap));
      
      if (settingsSnap.exists()) {
        setPaymentAccounts(settingsSnap.val());
      } else {
        const oldSettingsSnap = await database.ref('Settings/PaymentAccounts').once('value');
        if (oldSettingsSnap.exists()) {
          setPaymentAccounts(oldSettingsSnap.val());
        }
      }
      
      const newFilteredData = 
        activeSection === 'pendingPayments' ? toArray(pSnap) :
        activeSection === 'completedPayments' ? toArray(cSnap) :
        toArray(fSnap);
      
      setFilteredData(newFilteredData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setErrorMessage('Failed to fetch payment data');
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
      activeSection === 'pendingPayments'
        ? pending
        : activeSection === 'completedPayments'
        ? completed
        : failed;
    
    setFilteredData(currentData);
    setCurrentPage(0);
    setNoMatch(false);
  }, [activeSection, pending, completed, failed]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);

    const currentData =
      activeSection === 'pendingPayments'
        ? pending
        : activeSection === 'completedPayments'
        ? completed
        : failed;

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
      setActiveLoans([]);
      setSelectedLoanId(null);
      setCurrentLoan(null);
      setBalance(0);
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
        setBalance(memberData.balance || 0);
        setMemberNotFound(false);
        
        // Fetch active loans for this member
        await fetchActiveLoans(memberId);
      } else {
        setFormData(prev => ({
          ...prev,
          firstName: '',
          lastName: '',
          email: ''
        }));
        setActiveLoans([]);
        setSelectedLoanId(null);
        setCurrentLoan(null);
        setMemberNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMemberNotFound(true);
    } finally {
      setMemberLoading(false);
    }
  };

  // Add this function to validate if submission should be allowed
const canSubmitPayment = () => {
  // Check if member has active loans
  const hasActiveLoans = activeLoans.length > 0;
  
  // If no active loans, cannot submit
  if (!hasActiveLoans) return false;
  
  // Check required fields
  const hasRequiredFields = 
    formData.memberId && 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.paymentOption && 
    formData.amount;
  
  // Check proof of payment for non-cash payments
  const hasProofIfRequired = 
    formData.paymentOption === 'Cash-on-Hand' ? true : proofOfPaymentFile;
  
  return hasRequiredFields && hasProofIfRequired;
};

  // Fetch active loans for member
const fetchActiveLoans = async (memberId) => {
  try {
    const currentLoansRef = database.ref(`Loans/CurrentLoans/${memberId}`);
    const snapshot = await currentLoansRef.once('value');
    
    const found = [];
    if (snapshot.exists()) {
      const loans = snapshot.val();
      for (const loanId in loans) {
        const loan = loans[loanId];
        // Only include active loans (not paid, not rejected)
        if (loan.status !== 'paid' && loan.status !== 'rejected') {
          found.push({ 
            ...loan, 
            _loanId: loanId,
            loanType: loan.loanType || 'Personal Loan',
            loanAmount: loan.loanAmount || loan.amount || 0,
            outstandingBalance: loan.outstandingBalance || loan.loanAmount || loan.amount || 0,
            interestRate: loan.interestRate || 0,
            interest: loan.interest || 0,
            term: loan.term || loan.loanTerm || 0,
            monthlyPayment: loan.monthlyPayment || 0,
            totalMonthlyPayment: loan.totalMonthlyPayment || loan.monthlyPayment || 0,
            dueDate: loan.dueDate || loan.nextDueDate,
            dateApplied: loan.dateApplied,
            dateApproved: loan.dateApproved,
            transactionId: loan.transactionId || loanId
          });
        }
      }
    }

    if (found.length > 0) {
      setActiveLoans(found);
      const first = found[0];
      setSelectedLoanId(first._loanId);
      setCurrentLoan(first);
      calculatePenaltyAndTotal(first);
    } else {
      setActiveLoans([]);
      setSelectedLoanId(null);
      setCurrentLoan(null);
      setPenaltyAmount(0);
      setTotalAmountDue(0);
      setOverdueDays(0);
    }
  } catch (error) {
    console.error('Error fetching active loans:', error);
    setActiveLoans([]);
  }
};

  // Calculate penalty and total amount due
  const calculatePenaltyAndTotal = (loan) => {
    if (!loan) {
      setPenaltyAmount(0);
      setTotalAmountDue(0);
      setOverdueDays(0);
      return;
    }

    try {
      const currentDueDate = loan.dueDate || loan.nextDueDate;
      const overdueDays = computeOverdueDays(currentDueDate);
      setOverdueDays(overdueDays);
      
      const loanInterest = parseFloat(loan.interest) || 0;
      const penalty = overdueDays > 0 ? loanInterest * (overdueDays / 30) : 0;
      setPenaltyAmount(penalty);
      
      const monthlyPayment = parseFloat(loan.totalMonthlyPayment || loan.monthlyPayment || 0) || 0;
      const total = monthlyPayment + penalty;
      setTotalAmountDue(total);
    } catch (error) {
      console.error('Error calculating penalty:', error);
      setPenaltyAmount(0);
      setTotalAmountDue(loan?.totalMonthlyPayment || loan?.monthlyPayment || 0);
      setOverdueDays(0);
    }
  };

  // Calculate penalty for loan details modal
  const calculateLoanDetails = (loan) => {
    if (!loan) {
      return { penalty: 0, totalDue: 0, overdueDays: 0, isOverdue: false };
    }

    try {
      const currentDueDate = loan.dueDate || loan.nextDueDate;
      const overdueDays = computeOverdueDays(currentDueDate);
      const loanInterest = parseFloat(loan.interest) || 0;
      const penalty = overdueDays > 0 ? loanInterest * (overdueDays / 30) : 0;
      const monthlyPayment = parseFloat(loan.totalMonthlyPayment || loan.monthlyPayment || 0) || 0;
      const total = monthlyPayment + penalty;
      
      return { 
        penalty, 
        totalDue: total, 
        overdueDays, 
        isOverdue: overdueDays > 0 
      };
    } catch (error) {
      console.error('Error calculating loan details:', error);
      return { penalty: 0, totalDue: loan?.totalMonthlyPayment || loan?.monthlyPayment || 0, overdueDays: 0, isOverdue: false };
    }
  };

  // Format display date for loans
  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';

      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (typeof dateInput === 'string') {
        const parsedDate = parseDateTime(dateInput);
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
        }
        return dateInput;
      }

      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      return 'N/A';
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Open loan details modal
  const openLoanDetails = (loan) => {
    try {
      const safeLoan = {
        ...loan,
        loanType: loan.loanType || 'Personal Loan',
        loanAmount: loan.loanAmount || loan.amount || 0,
        outstandingBalance: loan.outstandingBalance || loan.loanAmount || loan.amount || 0,
        interestRate: loan.interestRate || 0,
        interest: loan.interest || 0,
        term: loan.term || loan.loanTerm || 0,
        monthlyPayment: loan.monthlyPayment || 0,
        totalMonthlyPayment: loan.totalMonthlyPayment || loan.monthlyPayment || 0,
        dueDate: loan.dueDate || loan.nextDueDate,
        dateApplied: loan.dateApplied,
        dateApproved: loan.dateApproved,
        transactionId: loan.transactionId || loan._loanId
      };
      
      setSelectedLoanForDetails(safeLoan);
      setLoanDetailsModalVisible(true);
    } catch (error) {
      console.error('Error opening loan details:', error);
      setErrorMessage('Failed to open loan details');
      setErrorModalVisible(true);
    }
  };

  // Handle view details button hover
  const handleViewDetailsHover = (loanId, isHovering) => {
    setViewDetailsHovered(prev => ({
      ...prev,
      [loanId]: isHovering
    }));
  };

  // PAYMENT APPROVAL LOGIC (SAME AS PaymentApplications)
const processDatabaseApprove = async (paymentData) => {
  try {
    const { memberId, amount, selectedLoanId } = paymentData;
    
    // 1. Verify member details
    const memberRef = database.ref(`Members/${memberId}`);
    const memberSnap = await memberRef.once('value');
    const memberData = memberSnap.val();

    if (!memberData) {
      throw new Error('Member not found in our records');
    }

    // 2. Load Settings (Funds, Yields, Savings, Penalty)
    const fundsRef = database.ref('Settings/Funds');
    const yieldsRef = database.ref('Settings/Yields');
    const yieldsHistoryRef = database.ref('Settings/YieldsHistory');
    const savingsRef = database.ref('Settings/Savings');
    const penaltyValueRef = database.ref('Settings/PenaltyValue');

    // 3. Find current loan (if any)
    const memberLoansRef = database.ref(`Loans/CurrentLoans/${memberId}`);
    let currentLoanData = null;
    let currentLoanKey = null;
    let isLoanPayment = false;
    let interestAmount = 0;
    let loanAmount = 0;
    let dueDateStr = '';
    let approvedLoanData = null;

    // Use the selected loan ID
    if (selectedLoanId) {
      const specificLoanSnap = await database.ref(`Loans/CurrentLoans/${memberId}/${selectedLoanId}`).once('value');
      if (specificLoanSnap.exists()) {
        currentLoanData = specificLoanSnap.val();
        currentLoanKey = selectedLoanId;
        isLoanPayment = true;
        loanAmount = parseFloat(currentLoanData.loanAmount) || 0;
        dueDateStr = currentLoanData.dueDate || currentLoanData.nextDueDate || '';
        
        // Fetch the original interest from ApprovedLoans
        const approvedLoanRef = database.ref(`Loans/ApprovedLoans/${memberId}/${selectedLoanId}`);
        const approvedLoanSnap = await approvedLoanRef.once('value');
        if (approvedLoanSnap.exists()) {
          approvedLoanData = approvedLoanSnap.val();
          interestAmount = parseFloat(approvedLoanData.interest) || 0;
        }
      }
    }

    // Generate NEW transaction IDs for this payment
    const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();
    const originalTransactionId = newTransactionId;

    // 4. Fetch current values
    const [fundsSnap, savingsSnap, penaltySnap] = await Promise.all([
      fundsRef.once('value'),
      savingsRef.once('value'),
      penaltyValueRef.once('value')
    ]);

    const paymentAmount = parseFloat(amount) || 0;
    const currentFunds = parseFloat(fundsSnap.val()) || 0;
    const currentSavings = parseFloat(savingsSnap.val()) || 0;
    const memberBalance = parseFloat(memberData.balance || 0);
    const memberInvestment = parseFloat(memberData.investment || 0);
    const penaltyPerDay = parseFloat(penaltySnap.val()) || 0;

    // 5. Penalty calculation
    const parseToStartOfDay = (d) => {
      const dt = new Date(d);
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    let overdueDays = 0;
    let penaltyDue = 0;
    
    // Use penalty from form data if provided
    const penaltyFromApp = parseFloat(paymentData?.penalty) || 0;
    
    if (penaltyFromApp > 0) {
      penaltyDue = Math.round((penaltyFromApp + Number.EPSILON) * 100) / 100;
    } else if (isLoanPayment && dueDateStr) {
      const todayStart = parseToStartOfDay(new Date());
      const dueDateParsed = parseToStartOfDay(new Date(dueDateStr));
      
      if (!isNaN(dueDateParsed.getTime()) && todayStart > dueDateParsed) {
        const ms = todayStart.getTime() - dueDateParsed.getTime();
        overdueDays = Math.ceil(ms / (1000 * 60 * 60 * 24));
      }
      
      // Overdue penalty = monthly interest * (days_lapsed / 30)
      const interestForPenalty = parseFloat(interestAmount) || 0;
      penaltyDue = Math.max(0, Math.round(((interestForPenalty * (overdueDays / 30)) + Number.EPSILON) * 100) / 100);
    }

    // Include any previously accrued penalties
    const existingAccruedPenalty = parseFloat(currentLoanData?.penaltyAccrued) || 0;
    penaltyDue = Math.round(((penaltyDue + existingAccruedPenalty) + Number.EPSILON) * 100) / 100;

    const penaltyPaid = Math.min(paymentAmount, penaltyDue);

    // Amount left for interest/principal after penalty
    const remainingAfterPenalty = paymentAmount - penaltyPaid;

    // 6. NEW: Calculate ExcessMonthlyPayment (same as PaymentApplications)
    let currentTotalMonthlyPayment = 0;
    let scheduledMonthlyPayment = 0;
    let excessMonthlyPayment = 0;

    if (isLoanPayment && currentLoanData) {
      currentTotalMonthlyPayment = parseFloat(currentLoanData.totalMonthlyPayment) || 0;
      scheduledMonthlyPayment = currentTotalMonthlyPayment + penaltyDue;
      excessMonthlyPayment = Math.max(0, paymentAmount - scheduledMonthlyPayment);
    }

    // 7. Split remaining into interest then principal
    let interestPaid = 0;
    let principalPaid = 0;
    let excessPayment = 0;
    let investmentIncrease = 0;
    let balanceIncrease = 0;

    if (isLoanPayment && currentLoanData) {
      interestPaid = Math.min(remainingAfterPenalty, interestAmount);
      const afterInterest = remainingAfterPenalty - interestPaid;
      principalPaid = Math.min(afterInterest, loanAmount);

      // Remaining beyond loan principal becomes excess
      const remainingAfterPrincipal = afterInterest - principalPaid;
      excessPayment = Math.max(0, remainingAfterPrincipal);

      // NEW: Calculate how much principal goes to member balance (same as PaymentApplications)
      const borrowedFromSavings = parseFloat(approvedLoanData?.borrowedFromSavings) || 0;
      const principalToMember = principalPaid - borrowedFromSavings;
      
      // ALLOCATION LOGIC: Excess goes to investment, balance, and funds
      investmentIncrease = excessPayment;
      balanceIncrease = principalToMember + excessPayment;

      // Update loan records
      const remainingLoan = loanAmount - principalPaid;
      
      const prevAmountPaid = parseFloat(currentLoanData?.amountPaid) || 0;
      const amountPaidThisApproval = (interestPaid + principalPaid); 
      const newAmountPaid = prevAmountPaid + amountPaidThisApproval;

      if (remainingLoan <= 0) {
        // Loan fully paid - archive it
        const nowPaid = new Date();
        const datePaid = formatDate(nowPaid);
        const timePaid = formatTime(nowPaid);
        const paidTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

        const paidRecord = {
          ...(approvedLoanData || currentLoanData || {}),
          transactionId: paidTransactionId,
          originalTransactionId: currentLoanKey,
          status: 'paid',
          datePaid,
          timePaid,
          timestamp: nowPaid.getTime(),
          loanAmount: Math.ceil(loanAmount * 100) / 100
        };

        // Write to PaidLoans
        const paidLoansRef = database.ref(`Loans/PaidLoans/${memberId}/${paidTransactionId}`);
        const paidTxnRef = database.ref(`Transactions/Loans/${memberId}/${paidTransactionId}`);
        await Promise.all([
          paidLoansRef.set(paidRecord),
          paidTxnRef.set(paidRecord)
        ]);

        // Remove from CurrentLoans
        const memberLoanRef = database.ref(`Members/${memberId}/loans/${currentLoanKey}`);
        await Promise.all([
          memberLoansRef.child(currentLoanKey).remove(),
          memberLoanRef.remove()
        ]);

        // Remove from ApprovedLoans
        try { 
          await database.ref(`Loans/ApprovedLoans/${memberId}/${currentLoanKey}`).remove(); 
        } catch (_) {}

      } else {
        // Update existing loan
        const paymentsMade = (currentLoanData.paymentsMade || 0) + 1;
        
        const loanUpdates = {};
        loanUpdates['loanAmount'] = Math.ceil(remainingLoan * 100) / 100;
        loanUpdates['paymentsMade'] = paymentsMade;
        loanUpdates['amountPaid'] = newAmountPaid;
        
        // Also update mirrored copy under Members
        const memberLoanRef = database.ref(`Members/${memberId}/loans/${currentLoanKey}`);
        await Promise.all([
          memberLoansRef.child(currentLoanKey).update(loanUpdates),
          memberLoanRef.update(loanUpdates)
        ]);
      }
    } else {
      // Not a loan payment - treat as savings/investment
      balanceIncrease = paymentAmount;
      investmentIncrease = paymentAmount;
    }

    // 8. Update member balance and investment (FIXED - now includes principal)
    const memberBalanceToSet = Math.ceil((memberBalance + balanceIncrease) * 100) / 100;
    const memberInvestmentToSet = Math.ceil((memberInvestment + investmentIncrease) * 100) / 100;

    await memberRef.update({ 
      balance: memberBalanceToSet,
      investment: memberInvestmentToSet 
    });

    // 9. Update Savings with penalty
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (penaltyPaid > 0) {
      const newSavingsAmount = Math.ceil((currentSavings + penaltyPaid) * 100) / 100;
      await savingsRef.set(newSavingsAmount);

      // Update daily SavingsHistory
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      const currentDaySavingsSnap = await savingsHistoryRef.child(dateKey).once('value');
      const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
      const newDaySavings = Math.ceil((currentDaySavings + penaltyPaid) * 100) / 100;
      await savingsHistoryRef.update({ [dateKey]: newDaySavings });
    }

    // 10. Update Yields with interest
    if (interestPaid > 0) {
      const currentYieldsSnap = await yieldsRef.once('value');
      const currentYields = parseFloat(currentYieldsSnap.val()) || 0;
      const newYieldsAmount = Math.ceil((currentYields + interestPaid) * 100) / 100;
      await yieldsRef.set(newYieldsAmount);

      // Update daily YieldsHistory
      const currentDayYieldsSnap = await yieldsHistoryRef.child(dateKey).once('value');
      const currentDayYields = parseFloat(currentDayYieldsSnap.val()) || 0;
      const newDayYields = Math.ceil((currentDayYields + interestPaid) * 100) / 100;
      const yieldsHistoryUpdate = {};
      yieldsHistoryUpdate[dateKey] = newDayYields;
      await yieldsHistoryRef.update(yieldsHistoryUpdate);
    }

    // 11. Update Funds
    const borrowedFromSavings = parseFloat(approvedLoanData?.borrowedFromSavings) || 0;
    const principalToFunds = principalPaid - borrowedFromSavings;
    const fundsIncrease = principalToFunds + excessPayment;
    
    if (fundsIncrease > 0) {
      const newFundsAmount = Math.ceil((currentFunds + fundsIncrease) * 100) / 100;
      await fundsRef.set(newFundsAmount);
      
      // Log to FundsHistory
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
      await fundsHistoryRef.set(newFundsAmount);
    }

    // 12. Create approved payment record (UPDATED with excessMonthlyPayment)
    const approvedRef = database.ref(`Payments/ApprovedPayments/${memberId}/${newTransactionId}`);
    const transactionRef = database.ref(`Transactions/Payments/${memberId}/${newTransactionId}`);

    const approvedData = {
      // Basic payment info
      id: memberId,
      transactionId: newTransactionId,
      originalTransactionId: originalTransactionId,
      firstName: paymentData.firstName,
      lastName: paymentData.lastName,
      email: paymentData.email,
      amountToBePaid: paymentAmount,
      paymentOption: paymentData.paymentOption,
      accountName: paymentData.accountName,
      accountNumber: paymentData.accountNumber,
      proofOfPaymentUrl: paymentData.proofOfPaymentUrl || '',
      
      // Approval info
      selectedLoanId: selectedLoanId,
      dateApproved: formatDate(now),
      timeApproved: formatTime(now),
      timestamp: now.getTime(),
      status: 'approved',
      
      // Payment breakdown (UPDATED)
      penaltyPerDay,
      overdueDays,
      penaltyDue,
      penaltyPaid,
      interestScheduled: interestAmount,
      interestPaid,
      principalPaid,
      excessPayment,
      excessMonthlyPayment, // NEW: Added this field
      investmentIncrease,
      balanceIncrease,
      isLoanPayment,
      appliedToLoan: currentLoanKey
    };

    await approvedRef.set(approvedData);
    await transactionRef.set(approvedData);

    return newTransactionId;

  } catch (err) {
    console.error('Approval DB error:', err);
    throw new Error(err.message || 'Failed to approve payment');
  }
};

const callApiApprove = async (paymentData) => {
  try {
    const now = new Date();
    const memberSnap = await database.ref(`Members/${paymentData.memberId}`).once('value');
    const memberData = memberSnap.val();

    const response = await ApprovePayments({
      memberId: paymentData.memberId,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentOption,
      dateApproved: paymentData.dateApproved || formatDate(now),
      timeApproved: paymentData.timeApproved || formatTime(now),
      email: paymentData.email,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      status: 'approved',
      interestPaid: (paymentData.interestPaid || 0).toFixed(2),
      principalPaid: (paymentData.principalPaid || 0).toFixed(2),
      excessPayment: (paymentData.excessPayment || 0).toFixed(2),
      isLoanPayment: paymentData.isLoanPayment || false
    });
    
    if (!response.ok) {
      console.error('Failed to send approval email');
    }
    return response;
  } catch (err) {
    console.error('API approve error:', err);
    throw err;
  }
};
const processAction = async (paymentData, action) => {
  setIsProcessing(true); // Use only one loading state
  setCurrentAction(action);

  try {
    setSuccessMessage('Payment approved successfully!');

    const now = new Date();
    const approveData = {
      ...paymentData,
      dateApproved: formatDate(now),
      timeApproved: formatTime(now)
    };

    setPendingApiCall({
      type: 'approve',
      data: approveData
    });

    setSuccessMessageModalVisible(true);
  } catch (error) {
    console.error('Error preparing action:', error);
    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false); // Use only one loading state
  }
};

const handleSuccessOk = async () => {
  // Show loading and hide success modal
  setIsProcessing(true);
  setSuccessMessageModalVisible(false);

  try {
    // Finalize DB changes only when user clicks OK
    if (pendingApiCall) {
      if (pendingApiCall.type === 'approve') {
        await processDatabaseApprove(pendingApiCall.data);
      }
    }
  } catch (err) {
    console.error('Finalize DB on OK error:', err);
    setErrorMessage('Failed to process payment in database');
    setErrorModalVisible(true);
    setIsProcessing(false);
    return;
  }

  // Trigger background email after DB success
  try {
    if (pendingApiCall) {
      if (pendingApiCall.type === 'approve') {
        // Run API in background (don't await)
        callApiApprove(pendingApiCall.data);
      }
    }
  } catch (error) {
    console.error('Error calling API:', error);
    // Don't show error to user since main operation succeeded
  } finally {
    setPendingApiCall(null);
  }

  // Close modal and clean state
  closeAddModal();
  setCurrentAction(null);

  // Refresh data
  fetchAllData();

  // Hide loading spinner
  setIsProcessing(false);
};

// 1. Handle Approve Click - Show Confirmation
const handleApproveClick = () => {
  if (!validateFields()) return;
  setShowApproveConfirmation(true);
};

const confirmApprove = async () => {
  setShowApproveConfirmation(false);
  setIsProcessing(true); // Use only one loading state
  setCurrentAction('approve');

  try {
    // Prepare payment data (but don't save to database yet)
    const paymentData = {
      memberId: formData.memberId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      paymentOption: formData.paymentOption,
      accountName: formData.accountName,
      accountNumber: formData.accountNumber,
      amount: parseFloat(formData.amount),
      selectedLoanId: selectedLoanId,
      ...(penaltyAmount > 0 && { 
        penalty: penaltyAmount,
        overdueDays: overdueDays 
      })
    };

    // Store the data for later processing
    setPendingApiCall({
      type: 'approve',
      data: paymentData
    });

    // Show success message
    setSuccessMessage('Payment added and approved successfully!');
    setSuccessMessageModalVisible(true);

  } catch (error) {
    console.error('Error preparing approval:', error);
    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false); // Use only one loading state
  }
};

const handlePrint = (format = 'print') => {
  setPrinting(true);
  
  try {
    const sectionTitle = 
      activeSection === 'pendingPayments' ? 'Pending Payments' :
      activeSection === 'completedPayments' ? 'Approved Payments' :
      'Rejected Payments';

    // Get the data that's currently displayed in the table (paginated)
    const displayedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const printContent = document.createElement('div');
    printContent.className = 'print-content';
    printContent.style.padding = '20px';
    printContent.style.fontFamily = 'Arial, sans-serif';
    printContent.style.boxSizing = 'border-box';
    printContent.style.margin = '0';
    printContent.style.display = 'flex';
    printContent.style.flexDirection = 'column';
    printContent.style.minHeight = '100vh';

    // Main content container
    const mainContent = document.createElement('div');
    mainContent.style.flex = '1';

    // ========== HEADER SECTION ==========
    const header = document.createElement('div');
    header.className = 'print-header';
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
    header.appendChild(reportDetails);
    mainContent.appendChild(header);

    // ========== TABLE SECTION ==========
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
        case 'pendingPayments':
          headers = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Status', 'Date Applied'];
          break;
        case 'completedPayments':
          headers = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Date Approved', 'Transaction ID'];
          break;
        case 'failedPayments':
          headers = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Rejection Reason', 'Date Rejected'];
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
            case 'Payment Amount':
              cellValue = formatCurrency(item.amountToBePaid || 0);
              break;
            case 'Payment Method':
              cellValue = item.paymentOption || '';
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
      mainContent.appendChild(table);
    } else {
      const noData = document.createElement('p');
      noData.textContent = 'No data available';
      noData.style.textAlign = 'center';
      noData.style.color = '#666';
      noData.style.fontStyle = 'italic';
      noData.style.marginTop = '40px';
      mainContent.appendChild(noData);
    }

    // Add main content to printContent
    printContent.appendChild(mainContent);

    // ========== FOOTER SECTION ========== (MOVED FROM HEADER)
    const footer = document.createElement('div');
    footer.style.marginTop = 'auto';
    footer.style.paddingTop = '30px';
    footer.style.borderTop = '1px solid #ddd';
    footer.style.fontSize = '12px';
    footer.style.color = '#666';

    // Footer content container
    const footerContent = document.createElement('div');
    footerContent.style.display = 'flex';
    footerContent.style.justifyContent = 'space-between';
    footerContent.style.alignItems = 'flex-start';
    footerContent.style.boxSizing = 'border-box';

    // Left side - Generated Date
    const generatedDate = document.createElement('div');
    generatedDate.style.textAlign = 'left';
    generatedDate.style.flex = '1';
    generatedDate.innerHTML = `
      <div style="margin-bottom: 5px;"><strong>Generated as of:</strong></div>
      <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;

    // Right side - Prepared By
    const preparedBy = document.createElement('div');
    preparedBy.style.textAlign = 'right';
    preparedBy.style.flex = '1';
    const adminFirstName = adminData?.firstName || 'Admin';
    const adminRole = localStorage.getItem('userRole') || 'Admin';
    preparedBy.innerHTML = `
      <div style="margin-bottom: 5px;"><strong>Prepared by:</strong></div>
      <div style="font-weight: bold;">${adminFirstName}</div>
      <div style="font-style: italic;">${adminRole.charAt(0).toUpperCase() + adminRole.slice(1)}</div>
    `;

    footerContent.appendChild(generatedDate);
    footerContent.appendChild(preparedBy);
    footer.appendChild(footerContent);
    printContent.appendChild(footer);

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
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            
            .print-content {
              margin: 0 !important;
              padding: 20px;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
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
              case 'pendingPayments':
                excelHeaders = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Status', 'Date Applied'];
                break;
              case 'completedPayments':
                excelHeaders = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Date Approved', 'Transaction ID'];
                break;
              case 'failedPayments':
                excelHeaders = ['Member ID', 'Full Name', 'Payment Amount', 'Payment Method', 'Rejection Reason', 'Date Rejected'];
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
                  case 'Payment Amount':
                    cellValue = parseFloat(item.amountToBePaid) || 0;
                    break;
                  case 'Payment Method':
                    cellValue = item.paymentOption || '';
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

  const handleDownload = async () => {
    try {
      let dataToDownload = filteredData;
      let fileName =
        activeSection === 'pendingPayments'
          ? 'PendingPayments'
          : activeSection === 'completedPayments'
          ? 'ApprovedPayments'
          : 'RejectedPayments';

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
      section === 'pendingPayments'
        ? pending
        : section === 'completedPayments'
        ? completed
        : failed;
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
      paymentOption: '',
      accountName: '',
      accountNumber: '',
      amount: '',
    });
    setProofOfPaymentFile(null);
    setActiveLoans([]);
    setSelectedLoanId(null);
    setCurrentLoan(null);
    setPenaltyAmount(0);
    setTotalAmountDue(0);
    setOverdueDays(0);
    setBalance(0);
    setMemberNotFound(false);
    setMemberLoading(false);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'paymentOption' && value) {
      const selectedAccount = paymentAccounts[value] || { accountName: '', accountNumber: '' };
      setFormData(prev => ({
        ...prev,
        accountName: selectedAccount.accountName || '',
        accountNumber: selectedAccount.accountNumber || ''
      }));

      if (value === 'Cash-on-Hand') {
        setProofOfPaymentFile(null);
      }
    }

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
  if (activeLoans.length === 0) { // Add this check
    setErrorMessage('This member has no active loans. Loan payments can only be made for members with active loans.');
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
  if (!formData.paymentOption) {
    setErrorMessage('Payment option is required');
    setErrorModalVisible(true);
    return false;
  }
  if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
    setErrorMessage('Please enter a valid amount');
    setErrorModalVisible(true);
    return false;
  }
  if (formData.paymentOption !== 'Cash-on-Hand' && !proofOfPaymentFile) {
    setErrorMessage('Proof of payment is required for non-cash payments');
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

const submitPayment = async () => {
  setConfirmModalVisible(false);
  setUploading(true);
  setIsProcessing(true); // Use only one loading state

  try {
    let proofOfPaymentUrl = '';
    
    if (formData.paymentOption !== 'Cash-on-Hand' && proofOfPaymentFile) {
      proofOfPaymentUrl = await uploadImageToStorage(
        proofOfPaymentFile, 
        `proofsOfPayment/${formData.memberId}_${Date.now()}`
      );
    }

    const paymentData = {
      memberId: formData.memberId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      paymentOption: formData.paymentOption,
      accountName: formData.accountName,
      accountNumber: formData.accountNumber,
      amount: parseFloat(formData.amount),
      proofOfPaymentUrl,
      selectedLoanId: selectedLoanId,
      ...(penaltyAmount > 0 && { 
        penalty: penaltyAmount,
        overdueDays: overdueDays 
      })
    };

    await processAction(paymentData, 'approve');

  } catch (error) {
    console.error('Error adding payment:', error);
    setErrorMessage(error.message || 'Failed to add payment');
    setErrorModalVisible(true);
    setUploading(false);
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
              <div style={styles.loadingText}>Loading payment data...</div>
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
            <h1 style={styles.headerText}>Payment Management</h1>
            <p style={styles.headerSubtitle}>
              Manage payment applications, approvals, and rejections
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Left side */}
            <div style={styles.tabContainer}>
              {[
                { key: 'pendingPayments', label: 'Pending', icon: FaFileAlt },
                { key: 'completedPayments', label: 'Approved', icon: FaCheckCircle },
                { key: 'failedPayments', label: 'Rejected', icon: FaTimes }
              ].map((tab) => {
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
              {activeSection === 'pendingPayments' && (
                <PendingPayments 
                  payments={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  refreshData={fetchAllData}
                />
              )}
              {activeSection === 'completedPayments' && (
                <CompletedPayments 
                  payments={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
              {activeSection === 'failedPayments' && (
                <FailedPayments 
                  payments={paginatedData} 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>

        {/* Add Payment Button - Only show on Completed Payments tab */}
        {activeSection === 'completedPayments' && (
          <button 
            style={{
              ...styles.addPaymentButton,
              ...(isHovered.addPayment ? styles.addPaymentButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('addPayment')}
            onMouseLeave={() => handleMouseLeave('addPayment')}
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

        {/* Add Payment Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay} onClick={closeAddModal}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add New Payment</h2>
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
                        Payment Option<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <select
                        style={styles.formSelect}
                        value={formData.paymentOption}
                        onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                      >
                        <option value="">Select Payment Option</option>
                        {paymentOptions.map((option) => (
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
    Pay Amount<span style={styles.requiredAsterisk}>*</span>
  </label>
  <input
    style={styles.formInput}
    placeholder="Enter amount"
    value={formData.amount}
    onChange={(e) => {
      const value = e.target.value;
      // Only allow numbers and at most one decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        handleInputChange('amount', value);
      }
    }}
    type="text"
    inputMode="decimal"
  />
</div>
                  </div>
                </div>

                {/* Loan Selection Section */}
                {activeLoans.length > 0 && (
                  <div style={styles.loanInfoContainer}>
                    <h3 style={styles.sectionTitle}>Select Loan to Pay</h3>
                    {activeLoans.map((loan) => {
                      const loanDetails = calculateLoanDetails(loan);
                      return (
                        <div
                          key={loan._loanId}
                          style={{
                            ...styles.loanSelectItem,
                            ...(selectedLoanId === loan._loanId ? styles.loanSelectItemActive : {})
                          }}
                        >
                          <div 
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedLoanId(loan._loanId);
                              setCurrentLoan(loan);
                              calculatePenaltyAndTotal(loan);
                            }}
                          >
                            <div style={styles.loanSelectTitle}>{loan.loanType || 'Loan'}</div>
                            <div style={styles.loanSelectSub}>
                              Amount: {formatCurrency(loan.loanAmount || 0)}
                            </div>
                            <div style={styles.loanSelectSub}>
                              Due: {formatDisplayDate(loan.dueDate)}
                            </div>
                            {loanDetails.isOverdue && (
                              <div style={{...styles.loanSelectSub, color: '#dc2626', fontWeight: 'bold'}}>
                                Overdue: {loanDetails.overdueDays} days
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              style={{
                                ...styles.viewDetailsButton,
                                ...(viewDetailsHovered[loan._loanId] ? styles.viewDetailsButtonHover : {})
                              }}
                              onMouseEnter={() => handleViewDetailsHover(loan._loanId, true)}
                              onMouseLeave={() => handleViewDetailsHover(loan._loanId, false)}
                              onClick={(e) => {
                                e.stopPropagation();
                                openLoanDetails(loan);
                              }}
                            >
                              View Details
                            </button>
                            <div style={styles.checkboxArea}>
                              {selectedLoanId === loan._loanId ? (
                                <FaCheckCircle style={{color: '#2D5783', fontSize: '18px'}} />
                              ) : (
                                <div style={{width: '18px', height: '18px', border: '2px solid #94A3B8', borderRadius: '3px'}} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Financial Summary */}
                    {currentLoan && (
                      <div style={styles.financialCard}>
                        <div style={styles.financialItem}>
                          <span style={styles.financialLabel}>Monthly Payment:</span>
                          <span style={styles.financialValue}>
                            {formatCurrency(currentLoan.totalMonthlyPayment || currentLoan.monthlyPayment || 0)}
                          </span>
                        </div>
                        {penaltyAmount > 0 && (
                          <div style={styles.financialItem}>
                            <span style={{...styles.financialLabel, color: '#dc2626'}}>Penalty:</span>
                            <span style={{...styles.financialValue, color: '#dc2626'}}>
                              {formatCurrency(penaltyAmount)}
                            </span>
                          </div>
                        )}
                        <div style={styles.financialItem}>
                          <span style={styles.financialLabel}>Total Amount Due:</span>
                          <span style={styles.financialValue}>
                            {formatCurrency(totalAmountDue)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
  {activeLoans.length === 0 && formData.memberId && !memberLoading && (
  <div style={{
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'center'
  }}>
    <FaExclamationCircle style={{color: '#dc2626', fontSize: '20px', marginBottom: '8px'}} />
    <p style={{color: '#dc2626', margin: '0', fontWeight: '500'}}>
      This member has no active loans to pay.
    </p>
    <p style={{color: '#991b1b', margin: '8px 0 0 0', fontSize: '14px'}}>
      Loan payments can only be made for members with active loans.
    </p>
  </div>
)}

                {/* Proof of Payment Upload - Only show for non-Cash-on-Hand payments */}
                {formData.paymentOption !== 'Cash-on-Hand' && (
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
                        accept="image/*"
                      />
                      <p style={styles.fileUploadText}>
                        {proofOfPaymentFile ? 'Change file' : 'Click to upload proof of payment'}
                      </p>
                      {proofOfPaymentFile && (
                        <p style={styles.fileName}>{proofOfPaymentFile.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show message for Cash-on-Hand */}
                {formData.paymentOption === 'Cash-on-Hand' && (
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
                        Proof of payment not required for Cash-on-Hand payments
                      </span>
                    </div>
                  </div>
                )}
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
    disabled={uploading || isProcessing}
  >
    Cancel
  </button>
  <button
    style={{
      ...styles.primaryButton,
      ...(isHovered.submitButton ? styles.primaryButtonHover : {}),
      ...((uploading || isProcessing || memberNotFound || memberLoading || !canSubmitPayment()) ? styles.disabledButton : {})
    }}
    onMouseEnter={() => handleMouseEnter('submitButton')}
    onMouseLeave={() => handleMouseLeave('submitButton')}
    onClick={handleApproveClick}
    disabled={uploading || isProcessing || memberNotFound || memberLoading || !canSubmitPayment()}
  >
    {uploading || isProcessing ? (
      <>
        <div style={{...styles.spinner, width: '16px', height: '16px', borderWidth: '2px'}}></div>
        <span>Processing...</span>
      </>
    ) : activeLoans.length === 0 ? ( // Add this condition
      <>
        <FaBan />
        <span>No Active Loans</span>
      </>
    ) : (
      <>
        <FaCheckCircle />
        <span>Add Payment</span>
      </>
    )}
  </button>
</div>

            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {loanDetailsModalVisible && selectedLoanForDetails && (
          <div style={styles.modalOverlay} onClick={() => setLoanDetailsModalVisible(false)}>
            <div style={{...styles.modalCard, ...styles.loanDetailsModal}} onClick={(e) => e.stopPropagation()}>
              <div style={{...styles.modalHeader, ...styles.loanDetailsHeader}}>
                <h2 style={styles.modalTitle}>Loan Details</h2>
                <button 
                  onClick={() => setLoanDetailsModalVisible(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closeLoanDetails ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeLoanDetails')}
                  onMouseLeave={() => handleMouseLeave('closeLoanDetails')}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={{...styles.modalContent, padding: 0}}>
                <div style={{padding: '20px'}}>
                  {/* Loan Information */}
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Loan ID</span>
                    <span style={styles.loanDetailsValue}>
                      {selectedLoanForDetails.transactionId || selectedLoanForDetails._loanId || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Loan Type</span>
                    <span style={styles.loanDetailsValue}>
                      {selectedLoanForDetails.loanType || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Approved Amount</span>
                    <span style={styles.loanDetailsValue}>
                      {formatCurrency(selectedLoanForDetails.loanAmount)}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Outstanding Balance</span>
                    <span style={styles.loanDetailsValue}>
                      {formatCurrency(selectedLoanForDetails.remainingBalance)}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Date Applied</span>
                    <span style={styles.loanDetailsValue}>
                      {formatDisplayDate(selectedLoanForDetails.dateApproved)}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Date Approved</span>
                    <span style={styles.loanDetailsValue}>
                      {formatDisplayDate(selectedLoanForDetails.dateApproved)}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Interest Rate</span>
                    <span style={styles.loanDetailsValue}>
                      {Number(selectedLoanForDetails.interestRate || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Interest</span>
                    <span style={styles.loanDetailsValue}>
                      {formatCurrency(selectedLoanForDetails.interest)}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Terms</span>
                    <span style={styles.loanDetailsValue}>
                      {selectedLoanForDetails.term ? `${selectedLoanForDetails.term} months` : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.loanDetailsRow}>
                    <span style={styles.loanDetailsLabel}>Monthly Payment</span>
                    <span style={styles.loanDetailsValue}>
                      {formatCurrency(selectedLoanForDetails.monthlyPayment)}
                    </span>
                  </div>

                  {/* Due Date with overdue indicator */}
                  {(() => {
                    const dueDate = selectedLoanForDetails.dueDate;
                    const loanDetails = calculateLoanDetails(selectedLoanForDetails);
                    return (
                      <div style={styles.loanDetailsRow}>
                        <span style={styles.loanDetailsLabel}>Due Date</span>
                        <div style={{ maxWidth: '60%', alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                          <span style={{
                            ...styles.loanDetailsValue,
                            ...(loanDetails.isOverdue && styles.loanDetailsValueOverdue)
                          }}>
                            {formatDisplayDate(dueDate)}
                          </span>
                          {loanDetails.isOverdue && (
                            <span style={styles.overdueBadge}>Overdue</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Summary */}
                  <div style={styles.paymentSummarySection}>
                    <h3 style={{...styles.sectionTitle, textAlign: 'left', marginBottom: '16px'}}>Payment Summary</h3>
                    
                    {(() => {
                      const loanDetails = calculateLoanDetails(selectedLoanForDetails);
                      return (
                        <>
                          <div style={styles.loanDetailsRow}>
                            <span style={styles.loanDetailsLabel}>Monthly Payment</span>
                            <span style={styles.loanDetailsValue}>
                              {formatCurrency(selectedLoanForDetails.totalMonthlyPayment || selectedLoanForDetails.monthlyPayment || 0)}
                            </span>
                          </div>

                          {loanDetails.isOverdue && (
                            <>
                              <div style={styles.loanDetailsRow}>
                                <span style={styles.loanDetailsLabel}>Late Fee</span>
                                <div style={{ maxWidth: '60%', alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                                  <span style={[styles.loanDetailsValue, styles.loanDetailsValueOverdue]}>
                                    {formatCurrency(loanDetails.penalty)}
                                  </span>
                                  <span style={{color: '#94A3B8', fontSize: '12px', marginTop: '2px'}}>
                                    ({formatCurrency(selectedLoanForDetails.interest || 0)} × {loanDetails.overdueDays}/30 days)
                                  </span>
                                </div>
                              </div>
                              
                              {/* Total Amount Due - Highlighted */}
                              <div style={styles.totalDueRow}>
                                <span style={styles.totalDueLabel}>Total Amount Due</span>
                                <span style={styles.totalDueValue}>
                                  {formatCurrency(loanDetails.totalDue)}
                                </span>
                              </div>
                              
                              {/* Overdue Warning */}
                              <div style={styles.overdueWarning}>
                                <FaExclamationCircle style={{color: '#D32F2F', fontSize: '20px'}} />
                                <span style={styles.overdueWarningText}>
                                  This loan is {loanDetails.overdueDays} day{loanDetails.overdueDays > 1 ? 's' : ''} overdue. Please pay immediately to avoid additional penalties.
                                </span>
                              </div>
                            </>
                          )}

                          {!loanDetails.isOverdue && (
                            <div style={styles.totalDueRow}>
                              <span style={styles.totalDueLabel}>Total Amount Due: </span>
                              <span style={styles.totalDueValue}>
                                {formatCurrency(selectedLoanForDetails.totalMonthlyPayment || selectedLoanForDetails.monthlyPayment || 0)}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.secondaryButton,
                    ...(isHovered.closeDetailsButton ? styles.secondaryButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeDetailsButton')}
                  onMouseLeave={() => handleMouseLeave('closeDetailsButton')}
                  onClick={() => setLoanDetailsModalVisible(false)}
                >
                  Close
                </button>
                <button
                  style={{
                    ...styles.primaryButton,
                    ...(isHovered.selectLoanButton ? styles.primaryButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('selectLoanButton')}
                  onMouseLeave={() => handleMouseLeave('selectLoanButton')}
                  onClick={() => {
                    setSelectedLoanId(selectedLoanForDetails._loanId);
                    setCurrentLoan(selectedLoanForDetails);
                    calculatePenaltyAndTotal(selectedLoanForDetails);
                    setLoanDetailsModalVisible(false);
                  }}
                >
                  <FaCheckCircle />
                  Select This Loan
                </button>
              </div>
            </div>
          </div>
        )}

{/* Approve Confirmation Modal - MATCHING PaymentApplications DESIGN */}
{showApproveConfirmation && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalCardSmall}>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
      <p style={styles.modalText}>Are you sure you want to add and approve this payment?</p>
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(isProcessing ? styles.disabledButton : {}),
            flex: 1
          }} 
          onClick={confirmApprove}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Yes'}
        </button>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.secondaryButton,
            flex: 1
          }} 
          onClick={() => setShowApproveConfirmation(false)}
          disabled={isProcessing}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
{/* Success Modal - MATCHING PaymentApplications DESIGN */}
{successMessageModalVisible && (
  <div style={styles.modalOverlay}>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayLoans;
