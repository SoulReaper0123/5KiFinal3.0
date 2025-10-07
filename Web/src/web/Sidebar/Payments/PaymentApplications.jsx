import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApprovePayments, RejectPayments } from '../../../../../Server/api';
import { 
  FaCheckCircle, 
  FaTimes, 
  FaExclamationCircle, 
  FaImage, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSpinner,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCreditCard,
  FaReceipt,
  FaCalendarCheck,
  FaBan
} from 'react-icons/fa';
import Tesseract from 'tesseract.js';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #2563eb',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '1000px'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    color: 'white',
    height: '56px',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  tableHeaderCell: {
    padding: '1rem 0.75rem',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tableRow: {
    height: '52px',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  tableCell: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  noDataContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem',
    color: '#6b7280'
  },
  noDataIcon: {
    fontSize: '3rem',
    opacity: '0.5'
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
    padding: '2rem',
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #F1F5F9'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
      transform: 'rotate(90deg)'
    }
  },
  modalContent: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '1.5rem'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  section: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e2e8f0'
  },
  fieldGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    padding: '0.5rem 0'
  },
  fieldLabel: {
    fontWeight: '500',
    color: '#64748b',
    fontSize: '0.875rem',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#1f2937',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusApproved: {
    background: '#d1fae5',
    color: '#065f46'
  },
  statusRejected: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  statusPending: {
    background: '#fef3c7',
    color: '#92400e'
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    marginTop: '1rem'
  },
  documentCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
    }
  },
  documentImage: {
    width: '100%',
    height: '120px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginBottom: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  documentLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
    flexShrink: 0
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
  approveButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
    }
  },
  rejectButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
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
  viewButton: {
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#2563eb',
      color: 'white'
    }
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
  imageViewerModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '2rem'
  },
  imageViewerContent: {
    position: 'relative',
    width: '90%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  largeImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  imageViewerLabel: {
    color: 'white',
    fontSize: '1.125rem',
    marginTop: '1rem',
    textAlign: 'center',
    fontWeight: '500'
  },
  imageViewerNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '1rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'translateY(-50%) scale(1.1)'
    }
  },
  prevButton: {
    left: '2rem'
  },
  nextButton: {
    right: '2rem'
  },
  imageViewerClose: {
    position: 'absolute',
    top: '2rem',
    right: '2rem',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'scale(1.1)'
    }
  },
  rejectionModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001
  },
  rejectionModalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    border: '1px solid #F1F5F9'
  },
  rejectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#1e3a8a',
    textAlign: 'center'
  },
  reasonOption: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    padding: '0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  reasonRadio: {
    marginRight: '0.75rem'
  },
  reasonText: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#374151'
  },
  customReasonInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  rejectionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    gap: '0.75rem'
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f9fafb'
    }
  },
  confirmRejectButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626'
    }
  },
  verifyButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginTop: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#1e40af'
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    }
  },
  financialCard: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
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
  primaryButton: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
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
  infoModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000
  },
  infoModalCard: {
    width: '340px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  infoTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: '1rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.5rem 0'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#555',
    fontSize: '0.875rem'
  },
  infoValue: {
    color: '#333',
    fontSize: '0.875rem',
    maxWidth: '60%',
    wordBreak: 'break-word',
    textAlign: 'right'
  },
  infoCloseButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#1e3a8a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#1e40af'
    }
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

const rejectionReasons = [
  "Invalid proof of payment",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other"
];

const PaymentApplications = ({ 
  payments, 
  currentPage, 
  totalPages, 
  onPageChange, 
  refreshData 
}) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [availableImages, setAvailableImages] = useState([]);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [validationStatus, setValidationStatus] = useState({});
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', fields: [] });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const showInfoModal = (title, fields) => {
    setInfoModal({ visible: true, title, fields });
  };

  const closeInfoModal = () => setInfoModal({ visible: false, title: '', fields: [] });

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
    setValidationStatus({});
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
  };

  const handleApproveClick = () => {
    setShowApproveConfirmation(true);
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveConfirmation(false);
    await processAction(selectedPayment, 'approve');
  };

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    if (reason !== "Other") {
      setCustomReason('');
    }
  };

  const confirmRejection = () => {
    if (!selectedReason) {
      setErrorMessage('Please select a rejection reason');
      setErrorModalVisible(true);
      return;
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      setErrorMessage('Please specify the rejection reason');
      setErrorModalVisible(true);
      return;
    }

    const rejectionReason = selectedReason === "Other" 
      ? customReason 
      : selectedReason;

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedPayment, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

  const processAction = async (payment, action, rejectionReason = '') => {
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        await processDatabaseApprove(payment);
        
        setSuccessMessage('Payment approved successfully!');
        setSuccessMessageModalVisible(true);
        
        const approveData = {
          ...payment,
          dateApproved: formatDate(new Date()),
          approvedTime: formatTime(new Date())
        };

        setSelectedPayment(prev => ({
          ...prev,
          dateApproved: approveData.dateApproved,
          approvedTime: approveData.approvedTime,
          status: 'approved'
        }));

        setPendingApiCall({
          type: 'approve',
          data: approveData
        });

      } else {
        await processDatabaseReject(payment, rejectionReason);
        
        setSuccessMessage('Payment rejected successfully!');
        setSuccessMessageModalVisible(true);
        
        const rejectData = {
          ...payment,
          dateRejected: formatDate(new Date()),
          rejectedTime: formatTime(new Date()),
          rejectionReason
        };

        setSelectedPayment(prev => ({
          ...prev,
          dateRejected: rejectData.dateRejected,
          rejectedTime: rejectData.rejectedTime,
          rejectionReason,
          status: 'rejected'
        }));

        setPendingApiCall({
          type: 'reject',
          data: rejectData
        });
      }
    } catch (error) {
      console.error('Error processing action:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const processDatabaseApprove = async (payment) => {
    try {
      const { id, transactionId, amountToBePaid } = payment;
      
      // 1. Verify member details
      const memberRef = database.ref(`Members/${id}`);
      const memberSnap = await memberRef.once('value');
      const memberData = memberSnap.val();

      if (!memberData || 
          memberData.email !== payment.email ||
          memberData.firstName !== payment.firstName || 
          memberData.lastName !== payment.lastName) {
        throw new Error('Member details do not match our records');
      }

      // 2. Load Settings (Funds, Yields, Savings, Penalty)
      const fundsRef = database.ref('Settings/Funds');
      const yieldsRef = database.ref('Settings/Yields');
      const yieldsHistoryRef = database.ref('Settings/YieldsHistory');
      const savingsRef = database.ref('Settings/Savings');
      const penaltyValueRef = database.ref('Settings/PenaltyValue');

      // 3. Find current loan (if any)
      const memberLoansRef = database.ref(`Loans/CurrentLoans/${id}`);

      let currentLoanData = null;
      let currentLoanKey = null;
      let isLoanPayment = false;
      let interestAmount = 0;
      let loanAmount = 0;
      let dueDateStr = '';
      let approvedLoanData = null;

      // Prefer the loan explicitly selected in the application
      const preferredLoanKey = payment.selectedLoanId;
      if (preferredLoanKey) {
        const specificLoanSnap = await database.ref(`Loans/CurrentLoans/${id}/${preferredLoanKey}`).once('value');
        if (specificLoanSnap.exists()) {
          currentLoanData = specificLoanSnap.val();
          currentLoanKey = preferredLoanKey;
          isLoanPayment = true;
          loanAmount = parseFloat(currentLoanData.loanAmount) || 0;
          dueDateStr = currentLoanData.dueDate || currentLoanData.nextDueDate || '';
        }
      }

      // Fallback: pick the first loan if none explicitly selected or not found
      if (!currentLoanData) {
        const memberLoansSnap = await memberLoansRef.once('value');
        if (memberLoansSnap.exists()) {
          memberLoansSnap.forEach((loanSnap) => {
            if (!currentLoanData) {
              currentLoanData = loanSnap.val();
              currentLoanKey = loanSnap.key;
              isLoanPayment = true;
              loanAmount = parseFloat(currentLoanData.loanAmount) || 0;
              dueDateStr = currentLoanData.dueDate || currentLoanData.nextDueDate || '';
            }
          });
        }
      }

      // 4. Fetch the original interest and term from ApprovedLoans (not from CurrentLoans)
      if (currentLoanKey) {
        const approvedLoanRef = database.ref(`Loans/ApprovedLoans/${id}/${currentLoanKey}`);
        const approvedLoanSnap = await approvedLoanRef.once('value');
        
        if (approvedLoanSnap.exists()) {
          approvedLoanData = approvedLoanSnap.val();
          interestAmount = parseFloat(approvedLoanData.interest) || 0;
        } else {
          interestAmount = 0;
        }
      }

      // Generate a new transaction ID for approved/transactions records
      const originalTransactionId = transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      // Database references for Payment and Logs
      const paymentRef = database.ref(`Payments/PaymentApplications/${id}/${originalTransactionId}`);
      const approvedRef = database.ref(`Payments/ApprovedPayments/${id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Payments/${id}/${newTransactionId}`);

      // 4. Fetch current values
      const [paymentSnap, fundsSnap, savingsSnap, penaltySnap] = await Promise.all([
        paymentRef.once('value'),
        fundsRef.once('value'),
        savingsRef.once('value'),
        penaltyValueRef.once('value')
      ]);

      if (!paymentSnap.exists()) throw new Error('Payment data not found');

      const paymentData = paymentSnap.val();
      const paymentAmount = parseFloat(amountToBePaid) || 0;
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const currentSavings = parseFloat(savingsSnap.val()) || 0;
      const memberBalance = parseFloat(memberData.balance || 0);
      const penaltyPerDay = parseFloat(penaltySnap.val()) || 0;

      // 5. NEW PENALTY CALCULATION: Continuous penalty from original due date
      const parseToStartOfDay = (d) => {
        const dt = new Date(d);
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      };

      // Prefer penalty provided in payment application; fallback to computed
      const penaltyFromApp = parseFloat(paymentData?.penalty) || 0;

      let overdueDays = 0;
      let penaltyDue = 0;
      
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

      // Include any previously accrued penalties from the loan record
      const existingAccruedPenalty = parseFloat(currentLoanData?.penaltyAccrued) || 0;
      penaltyDue = Math.round(((penaltyDue + existingAccruedPenalty) + Number.EPSILON) * 100) / 100;

      const penaltyPaid = Math.min(paymentAmount, penaltyDue);

      // Amount left for interest/principal after penalty
      const remainingAfterPenalty = paymentAmount - penaltyPaid;

      // 6. Split remaining into interest then principal
      let interestPaid = 0;
      let principalPaid = 0;
      let excessPayment = 0;
      let newMemberBalance = memberBalance;

      if (isLoanPayment && currentLoanData) {
        interestPaid = Math.min(remainingAfterPenalty, interestAmount);
        const afterInterest = remainingAfterPenalty - interestPaid;
        principalPaid = Math.min(afterInterest, loanAmount);

        // Remaining beyond loan principal becomes excess
        const remainingAfterPrincipal = afterInterest - principalPaid;
        excessPayment = Math.max(0, remainingAfterPrincipal);

        // Update or clear the loan
        const remainingLoan = loanAmount - (principalPaid + excessPayment);
        
        // Track remainingBalance (principal + total interest not yet paid) and cumulative amountPaid (principal + interest only)
        const prevRemainingBalance = parseFloat(
          (currentLoanData && currentLoanData.remainingBalance) ?? (approvedLoanData && approvedLoanData.totalTermPayment) ?? 0
        ) || 0;
        const prevAmountPaid = parseFloat(currentLoanData?.amountPaid) || 0;
        const amountPaidThisApproval = (interestPaid + principalPaid);
        const newAmountPaid = Math.ceil((prevAmountPaid + amountPaidThisApproval) * 100) / 100;
        const newRemainingBalance = Math.max(0, Math.ceil((prevRemainingBalance - amountPaidThisApproval) * 100) / 100);

        if (newRemainingBalance <= 0) {
          // Fully settled: archive as paid, remove from Current/Approved, and log transaction
          const nowPaid = new Date();
          const datePaid = formatDate(nowPaid);
          const timePaid = formatTime(nowPaid);
          const paidTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

          // Try to read original loan transaction to get canonical fields like loanAmount
          let originalLoanTxn = null;
          try {
            const origTxnSnap = await database.ref(`Transactions/Loans/${id}/${currentLoanKey}`).once('value');
            if (origTxnSnap.exists()) originalLoanTxn = origTxnSnap.val();
          } catch (e) {
            console.warn('Could not read original loan transaction for', currentLoanKey, e);
          }

          const loanAmountFromTxn = parseFloat(originalLoanTxn?.loanAmount ?? approvedLoanData?.loanAmount ?? currentLoanData?.loanAmount) || 0;

          const paidRecord = {
            ...(approvedLoanData || currentLoanData || {}),
            transactionId: paidTransactionId,
            originalTransactionId: currentLoanKey,
            status: 'paid',
            datePaid,
            timePaid,
            timestamp: nowPaid.getTime(),
            loanAmount: Math.ceil(loanAmountFromTxn * 100) / 100
          };

          // Write to Loans/PaidLoans and Transactions/Loans (paid event)
          const paidLoansRef = database.ref(`Loans/PaidLoans/${id}/${paidTransactionId}`);
          const paidTxnRef = database.ref(`Transactions/Loans/${id}/${paidTransactionId}`);
          await Promise.all([
            paidLoansRef.set(paidRecord),
            paidTxnRef.set(paidRecord)
          ]);

          // Remove from CurrentLoans and member mirror
          const memberLoanRef = database.ref(`Members/${id}/loans/${currentLoanKey}`);
          await Promise.all([
            memberLoansRef.child(currentLoanKey).remove(),
            memberLoanRef.remove()
          ]);

          // Note: Borrowed savings have been gradually deducted during payments
          // No need to return borrowed amount here as it's been handled incrementally
          const borrowedFromSavings = parseFloat(approvedLoanData?.borrowedFromSavings) || 0;
          if (borrowedFromSavings > 0) {
            console.log(`Loan fully paid. Borrowed amount (${formatCurrency(borrowedFromSavings)}) was gradually deducted during payments.`);
          }

          // Remove from ApprovedLoans (both possible paths), specific key only
          try { await database.ref(`Loans/ApprovedLoans/${id}/${currentLoanKey}`).remove(); } catch (_) {}
          try { await database.ref(`ApprovedLoans/${id}/${currentLoanKey}`).remove(); } catch (_) {}

        } else {
          // STEP 1: UPDATE CURRENTLOANS WITH CONTINUOUS PENALTY SYSTEM
          const paymentsMade = (currentLoanData.paymentsMade || 0) + 1;
          const currentMonthlyPayment = parseFloat(currentLoanData.monthlyPayment) || 0;
          const currentTotalMonthlyPayment = parseFloat(currentLoanData.totalMonthlyPayment) || 0;
          
          // Calculate excess/shortage relative to scheduled payment
          const scheduledPayment = currentTotalMonthlyPayment + penaltyDue;
          const excessBeyondScheduled = Math.max(0, paymentAmount - scheduledPayment);
          
          // NEW: Check if payment is insufficient (less than total monthly payment)
          const isPaymentInsufficient = paymentAmount < currentTotalMonthlyPayment;
          
          // Calculate shortage (only interest+principal, exclude penalty)
          const shortageBeyondScheduled = Math.max(0, currentTotalMonthlyPayment - remainingAfterPenalty);
          
          // Calculate next monthly principal by adjusting for excess/shortage
          const originalTerm = parseFloat(approvedLoanData?.term) || 1;
          const remainingTerm = Math.max(1, originalTerm - paymentsMade);
          
          // If this is the last payment term, calculate based on remaining principal portion only
          let newMonthlyPayment;
          if (remainingTerm === 1) {
            // Last payment: monthly principal portion equals remaining principal
            newMonthlyPayment = Math.max(0, remainingLoan);
          } else {
            // Normal payment: decrease by excess, increase by shortage
            newMonthlyPayment = Math.max(0, currentMonthlyPayment - excessBeyondScheduled + shortageBeyondScheduled);
          }
          
          // NEW CONTINUOUS PENALTY SYSTEM
          let newPenaltyAccrued = 0;
          let newDueDate = '';
          
          if (isPaymentInsufficient) {
            // For insufficient payments: KEEP THE ORIGINAL DUE DATE and continue penalty accrual
            // This means the member is still considered "overdue" from the original due date
            newDueDate = dueDateStr; // Keep the same due date
            
            // Calculate continuous penalty: interest × (30 days / 30 days) = full monthly interest
            const continuousPenalty = interestAmount; // Full monthly interest as penalty
            newPenaltyAccrued = Math.max(0, penaltyDue - penaltyPaid) + continuousPenalty;
            
          } else {
            // Sufficient payment: extend due date by 30 days and carry forward remaining penalty
            let newDueDateObj;
            if (dueDateStr) {
              // Parse the current due date and add 30 days to it
              newDueDateObj = new Date(dueDateStr);
              newDueDateObj.setDate(newDueDateObj.getDate() + 30);
            } else {
              // Fallback: if no current due date, use today + 30 days
              newDueDateObj = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
            }
            
            newDueDate = formatDate(newDueDateObj);
            newPenaltyAccrued = Math.max(0, penaltyDue - penaltyPaid); // Only carry forward unpaid penalty
          }
          
          // New total monthly payment = new monthly principal + scheduled interest + carried penalty
          const newTotalMonthlyPayment = newMonthlyPayment + interestAmount + newPenaltyAccrued;

          // Update CurrentLoans
          const loanUpdates = {};
          loanUpdates['loanAmount'] = Math.ceil(remainingLoan * 100) / 100;
          loanUpdates['dueDate'] = newDueDate;
          loanUpdates['monthlyPayment'] = Math.ceil(newMonthlyPayment * 100) / 100;
          loanUpdates['totalMonthlyPayment'] = Math.ceil(newTotalMonthlyPayment * 100) / 100;
          loanUpdates['paymentsMade'] = paymentsMade;
          loanUpdates['amountPaid'] = newAmountPaid;
          loanUpdates['remainingBalance'] = newRemainingBalance;
          loanUpdates['penaltyAccrued'] = newPenaltyAccrued;
          
          // Also update mirrored copy under Members/{id}/loans/{loanId}
          const memberLoanRef = database.ref(`Members/${id}/loans/${currentLoanKey}`);
          await Promise.all([
            memberLoansRef.child(currentLoanKey).update(loanUpdates),
            memberLoanRef.update(loanUpdates)
          ]);
        }

        // Principal and any excess increase member's balance
        newMemberBalance = memberBalance + principalPaid + excessPayment;
      }

      // STEP 2: UPDATE MEMBERS AND FUNDS AFTER CURRENTLOANS
      // Calculate how much of the principal should go back to member vs savings
      const borrowedFromSavings = parseFloat(approvedLoanData?.borrowedFromSavings) || 0;
      const originalLoanAmount = parseFloat(approvedLoanData?.amount) || 0;
      
      // Validate values to prevent division by zero or invalid calculations
      let memberContributionRatio = 1; // Default: all goes to member
      if (originalLoanAmount > 0 && borrowedFromSavings > 0 && borrowedFromSavings < originalLoanAmount) {
        memberContributionRatio = (originalLoanAmount - borrowedFromSavings) / originalLoanAmount;
      }
      
      // Ensure ratio is valid (between 0 and 1)
      if (isNaN(memberContributionRatio) || memberContributionRatio < 0 || memberContributionRatio > 1) {
        memberContributionRatio = 1;
      }
      
      // STEP 1: Return any borrowed amount back to savings when principal is paid
      let savingsAfterBorrowedReturn = currentSavings;
      if (borrowedFromSavings > 0) {
        // Calculate how much of the borrowed amount to return based on payment progress
        const totalLoanAmount = parseFloat(currentLoanData.loanAmount) || 0;
        
        // Return proportional borrowed amount based on principal payment
        const borrowedToReturn = borrowedFromSavings * (principalPaid / totalLoanAmount);
        
        if (borrowedToReturn > 0) {
          savingsAfterBorrowedReturn = Math.ceil((currentSavings + borrowedToReturn) * 100) / 100;
          await savingsRef.set(savingsAfterBorrowedReturn);
          
          // Update daily SavingsHistory by adding the borrowed amount back
          const now = new Date();
          const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const savingsHistoryRef = database.ref('Settings/SavingsHistory');
          const currentDaySavingsSnap = await savingsHistoryRef.child(dateKey).once('value');
          const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
          const newDaySavings = Math.ceil((currentDaySavings + borrowedToReturn) * 100) / 100;
          await savingsHistoryRef.update({ [dateKey]: newDaySavings });
        }
      }
      
      // STEP 2: Now proceed with normal member balance allocation
      const principalToMember = principalPaid - borrowedFromSavings;
      const memberBalanceToSet = Math.ceil((memberBalance + principalToMember + excessPayment) * 100) / 100;
      
      // Validate final balance to prevent invalid values
      if (isNaN(memberBalanceToSet) || !isFinite(memberBalanceToSet)) {
        const fallbackBalance = Math.ceil((memberBalance + principalPaid + excessPayment) * 100) / 100;
        await memberRef.update({ balance: fallbackBalance });
      } else {
        await memberRef.update({ balance: memberBalanceToSet });
      }

      // Update Savings with penalty only, and Yields with interest
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // 2a) Add penalties to Savings and SavingsHistory (daily aggregate)
      if (penaltyPaid > 0) {
        const newSavingsAmount = Math.ceil((savingsAfterBorrowedReturn + penaltyPaid) * 100) / 100;
        await savingsRef.set(newSavingsAmount);

        // Update daily SavingsHistory by adding to the existing value for the date
        const savingsHistoryRef = database.ref('Settings/SavingsHistory');
        const currentDaySavingsSnap = await savingsHistoryRef.child(dateKey).once('value');
        const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
        const newDaySavings = Math.ceil((currentDaySavings + penaltyPaid) * 100) / 100;
        await savingsHistoryRef.update({ [dateKey]: newDaySavings });
      }

      // 2b) Add interest to Yields and YieldsHistory
      if (interestPaid > 0) {
        const currentYieldsSnap = await yieldsRef.once('value');
        const currentYields = parseFloat(currentYieldsSnap.val()) || 0;
        const newYieldsAmount = Math.ceil((currentYields + interestPaid) * 100) / 100;
        await yieldsRef.set(newYieldsAmount);

        // Update daily YieldsHistory by adding to the existing value for the date
        const currentDayYieldsSnap = await yieldsHistoryRef.child(dateKey).once('value');
        const currentDayYields = parseFloat(currentDayYieldsSnap.val()) || 0;
        const newDayYields = Math.ceil((currentDayYields + interestPaid) * 100) / 100;
        const yieldsHistoryUpdate = {};
        yieldsHistoryUpdate[dateKey] = newDayYields;
        await yieldsHistoryRef.update(yieldsHistoryUpdate);
      }

      // Update Funds with principal amount minus borrowed portion + excess
      const principalToFunds = principalPaid - borrowedFromSavings;
      const fundsIncrease = principalToFunds + excessPayment;
      
      if (fundsIncrease > 0) {
        const newFundsAmount = Math.ceil((currentFunds + fundsIncrease) * 100) / 100;
        await fundsRef.set(newFundsAmount);
        
        // Log to FundsHistory for dashboard chart (keyed by YYYY-MM-DD to match SavingsHistory)
        const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
        await fundsHistoryRef.set(newFundsAmount);
      }

      // 10. Write approved/transaction records
      const approvedData = {
        ...paymentData,
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateApproved: formatDate(now),
        timeApproved: formatTime(now),
        timestamp: now.getTime(),
        status: 'approved',
        // breakdown
        penaltyPerDay,
        overdueDays,
        penaltyDue,
        penaltyPaid,
        interestScheduled: interestAmount,
        interestPaid,
        principalPaid,
        excessPayment,
        isLoanPayment,
        appliedToLoan: currentLoanKey,
        // NEW: Track if payment was insufficient
        isPaymentInsufficient: isLoanPayment && currentLoanData ? (paymentAmount < (currentLoanData.totalMonthlyPayment || 0)) : false
      };

      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await paymentRef.remove();

    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve payment');
    }
  };

  const processDatabaseReject = async (payment, rejectionReason) => {
    try {
      const { id, transactionId } = payment;
      const now = new Date();
      const rejectedDate = formatDate(now);
      const rejectedTime = formatTime(now);

      // Generate a new transaction ID for rejected/transactions records
      const originalTransactionId = transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const paymentRef = database.ref(`Payments/PaymentApplications/${id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Payments/RejectedPayments/${id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Payments/${id}/${newTransactionId}`);

      const paymentSnap = await paymentRef.once('value');
      if (!paymentSnap.exists()) {
        throw new Error('Payment data not found.');
      }

      const rejectedPayment = { 
        ...paymentSnap.val(), 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateRejected: rejectedDate,
        rejectedTime: rejectedTime,
        timestamp: now.getTime(),
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedPayment);
      await transactionRef.set(rejectedPayment);
      await paymentRef.remove();

      return newTransactionId;

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject payment');
    }
  };

  const callApiApprove = async (payment) => {
    try {
      const now = new Date();
      const memberSnap = await database.ref(`Members/${payment.id}`).once('value');
      const memberData = memberSnap.val();

      // Calculate interest and principal if this is a loan payment
      let interestAmount = 0;
      let principalAmount = parseFloat(payment.amountToBePaid);
      let excessPayment = 0;
      let isLoanPayment = false;

      // Check if this is a loan payment (use selectedLoanId if provided)
      const loanRef = database.ref(`Loans/CurrentLoans/${payment.id}/${payment.selectedLoanId || payment.transactionId}`);
      const loanSnap = await loanRef.once('value');
      
      if (loanSnap.exists()) {
        isLoanPayment = true;
        const loanData = loanSnap.val();
        interestAmount = parseFloat(loanData.interest) || 0;
        principalAmount = parseFloat(payment.amountToBePaid) - interestAmount;
        
        // Handle overpayment
        const remainingLoan = parseFloat(loanData.loanAmount) - principalAmount;
        if (remainingLoan < 0) {
          excessPayment = Math.abs(remainingLoan);
          principalAmount = parseFloat(loanData.loanAmount);
        }
      }

      const response = await ApprovePayments({
        memberId: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amountToBePaid,
        paymentMethod: payment.paymentOption,
        dateApproved: payment.dateApproved || formatDate(now),
        timeApproved: payment.timeApproved || formatTime(now),
        email: payment.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        status: 'approved',
        interestPaid: interestAmount.toFixed(2),
        principalPaid: principalAmount.toFixed(2),
        excessPayment: excessPayment.toFixed(2),
        isLoanPayment: isLoanPayment
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

  const callApiReject = async (payment) => {
    try {
      const now = new Date();
      const memberSnap = await database.ref(`Members/${payment.id}`).once('value');
      const memberData = memberSnap.val();

      let rejectionMessage = '';
      
      // Custom rejection messages based on reason
      if (payment.rejectionReason.includes('Invalid proof')) {
        rejectionMessage = `We regret to inform you that your payment of ₱${payment.amountToBePaid} submitted on ${payment.dateApplied} could not be processed because the proof of payment you provided could not be validated. Please ensure you upload a clear, valid proof of payment document when resubmitting.`;
      } 
      else if (payment.rejectionReason.includes('Incorrect amount')) {
        rejectionMessage = `We regret to inform you that your payment of ₱${payment.amountToBePaid} submitted on ${payment.dateApplied} could not be processed because the amount does not match our records. Please verify the correct payment amount and resubmit your payment.`;
      }
      else if (payment.rejectionReason.includes('Unclear image')) {
        rejectionMessage = `We regret to inform you that your payment of ₱${payment.amountToBePaid} submitted on ${payment.dateApplied} could not be processed because the image of your proof of payment was unclear or unreadable. Please ensure your proof of payment is clearly visible when resubmitting.`;
      }
      else {
        rejectionMessage = `We regret to inform you that your payment of ₱${payment.amountToBePaid} submitted on ${payment.dateApplied} could not be processed.${payment.rejectionReason ? `\n\nReason: ${payment.rejectionReason}` : ''}`;
      }

      const response = await RejectPayments({
        memberId: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amountToBePaid,
        paymentMethod: payment.paymentOption,
        dateRejected: payment.dateRejected || formatDate(now),
        timeRejected: payment.timeRejected || formatTime(now),
        email: payment.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        status: 'rejected',
        rejectionReason: payment.rejectionReason || 'Rejected by admin',
        rejectionMessage: rejectionMessage
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email');
      }
      return response;
    } catch (err) {
      console.error('API reject error:', err);
      throw err;
    }
  };

  const handleSuccessOk = async () => {
    setSuccessMessageModalVisible(false);
    closeModal();
    setSelectedPayment(null);
    setCurrentAction(null);
    
    // Execute pending API call
    if (pendingApiCall) {
      try {
        if (pendingApiCall.type === 'approve') {
          await callApiApprove(pendingApiCall.data);
        } else if (pendingApiCall.type === 'reject') {
          await callApiReject(pendingApiCall.data);
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
      setPendingApiCall(null);
    }
    
    refreshData();
  };

  const openImageViewer = (url, label) => {
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setCurrentImage({ url: '', label: '' });
  };

  // OCR helpers for payment proof
  const loadImageWithCORS = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const createCanvasFromImage = (img) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width || img.naturalWidth;
        canvas.height = img.height || img.naturalHeight;
        try {
          ctx.drawImage(img, 0, 0);
          return canvas;
        } catch (error) {
          return img;
        }
      };
      const tryLoadImage = (corsMode, attempt = 1) => {
        const newImg = new Image();
        if (corsMode) newImg.crossOrigin = corsMode;
        newImg.onload = () => {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try { resolve(createCanvasFromImage(newImg)); } catch { resolve(newImg); }
          } else {
            resolve(newImg);
          }
        };
        newImg.onerror = () => {
          if (attempt === 1) {
            tryLoadImage('use-credentials', 2);
          } else if (attempt === 2) {
            tryLoadImage(null, 3);
          } else if (attempt === 3) {
            try {
              const apiHost = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
              const proxyBase = (import.meta?.env?.VITE_SERVER_URL) || apiHost;
              const proxyUrl = `${proxyBase}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
              const proxied = new Image();
              proxied.crossOrigin = 'anonymous';
              proxied.onload = () => resolve(proxied);
              proxied.onerror = () => resolve(newImg);
              proxied.src = proxyUrl;
            } catch {
              resolve(newImg);
            }
          }
        };
        newImg.src = imageUrl;
      };
      tryLoadImage('anonymous', 1);
    });
  };

  // Simple preprocessing to improve OCR contrast/clarity
  const preprocessForOCR = (img, scale = 2, binary = false) => {
    try {
      const srcW = img.width || img.naturalWidth || 0;
      const srcH = img.height || img.naturalHeight || 0;
      if (!srcW || !srcH) return img;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(srcW * scale);
      canvas.height = Math.round(srcH * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let v = 0.299 * r + 0.587 * g + 0.114 * b;
        v = Math.min(255, Math.max(0, (v - 128) * 1.15 + 128));
        if (binary) v = v > 150 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    } catch {
      return img;
    }
  };

  const parsePaymentText = (raw) => {
    const text = (raw || '').replace(/\s+/g, ' ').replace(/[|]/g, ' ').trim();

    const amountPatterns = [
      /(?:amount|amt|paid)\s*[:\-]?\s*(?:php|₱)?\s*([\d.,]+)\b/i,
      /(?:php|₱)\s*([\d.,]+)\b/i
    ];
    const refPatterns = [
      // Ref with digits and spaces (e.g., "Ref No. 2012 120 513868")
      /(ref(?:erence)?\s*(?:no\.?|#)?)[^A-Za-z0-9]*([0-9]{3,6}(?:\s+[0-9]{3,6}){1,5})/i,
      // Common labelled refs
      /(ref(?:erence)?\s*(?:no\.?|#)?|gcash\s*ref(?:erence)?|txn\s*id|transaction\s*(?:id|no\.?))\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
      /\b(?:ref(?:erence)?\s*(?:no\.?|#)?)\s*([A-Z0-9\-]{6,})\b/i,
      /\b([A-Z0-9]{10,})\b/
    ];

    // Date and time extraction similar to Registrations payment proof, with more variations
    const month = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
    const timePart = '(?:\\d{1,2}[:.;\\s]\\d{2}(?:[:.;\\s]\\d{2})?\\s*(?:am|pm)?)';
    const datePatterns = [
      new RegExp(`\\b${month}\\s+\\d{1,2},?\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{1,2}\\s+${month}\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b${month}\\s+\\d{1,2}\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{4}-\\d{2}-\\d{2}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{1,2}\/\\d{1,2}\/\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b(?:date\\s*&\\s*time|date\\s+and\\s+time|transaction\\s*date|date|time)\\s*[:\\-]?\\s*(${month}\\s+\\d{1,2},?\\s+\\d{2,4}(?:\\s+${timePart})?|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}(?:\\s+${timePart})?|\\d{4}-\\d{2}-\\d{2}(?:\\s+${timePart})?)`, 'i')
    ];

    let amount = null;
    for (const re of amountPatterns) {
      const m = text.match(re);
      if (m && m[1]) {
        amount = m[1].replace(/,/g, '');
        const dotCount = (amount.match(/\./g) || []).length;
        const commaCount = (amount.match(/,/g) || []).length;
        if (commaCount && !dotCount) amount = amount.replace(/,/g, '');
        if (commaCount && dotCount) amount = amount.replace(/,/g, '');
        break;
      }
    }

    let refNo = null;
    for (const re of refPatterns) {
      const m = text.match(re);
      if (m) {
        refNo = (m[2] || m[1] || '').toString().trim();
        // Clean groups of digits with spaces into a unified format: keep spaces
        refNo = refNo.replace(/\s{2,}/g, ' ').trim();
        break;
      }
    }
    // Fallback: capture up to ~20 chars after "Ref" token if still empty
    if (!refNo) {
      const fallback = text.match(/ref(?:erence)?\s*(?:no\.?|#)?\s*[:\-]?\s*([A-Z0-9\s\-]{8,30})/i);
      if (fallback && fallback[1]) {
        refNo = fallback[1].replace(/[^A-Z0-9\s\-]/gi, '').replace(/\s{2,}/g, ' ').trim();
      }
    }
    if (!refNo) {
      // Plain spaced-digit sequences: e.g., 8030 493 146060
      const spacedDigits = text.match(/\b\d{3,6}(?:\s+\d{3,6}){1,5}\b/);
      if (spacedDigits) {
        refNo = spacedDigits[0].replace(/\s{2,}/g, ' ').trim();
      }
    }

    let dateTime = null;
    for (const re of datePatterns) {
      const m = text.match(re);
      if (m) { dateTime = (m[1] || m[0]).trim(); break; }
    }
    if (!dateTime) {
      const dateToken = text.match(new RegExp(`\\b(?:${month})\\s+\\d{1,2},?\\s+\\d{2,4}\\b|\\b\\d{1,2}\/\\d{1,2}\/\\d{2,4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b`, 'i'));
      const timeToken = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i);
      if (dateToken && timeToken) dateTime = `${dateToken[0]} ${timeToken[0]}`.trim();
    }

    return { amount, refNo, dateTime };
  };

  const verifyPaymentOCR = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Extracting payment details...' }
    }));

    try {
      const baseImg = await loadImageWithCORS(imageUrl);
      const preprocessed = preprocessForOCR(baseImg, 2, false);
      const { data: { text, confidence } } = await Tesseract.recognize(preprocessed, 'eng');
      const parsed = parsePaymentText(text);
      const foundAny = parsed.amount || parsed.refNo;

      setValidationStatus(prev => ({
        ...prev,
        [label]: {
          status: foundAny ? 'valid' : (confidence > 30 ? 'partial' : 'manual'),
          message: foundAny
            ? `Amount: ${parsed.amount || 'N/A'}, Ref No: ${parsed.refNo || 'N/A'}${parsed.dateTime ? `, Date: ${parsed.dateTime}` : ''}`
            : 'Text detected but could not find Amount/Ref No'
        }
      }));

      if (foundAny) {
        showInfoModal('Verification Success', [
          { label: 'Amount', value: parsed.amount || 'N/A' },
          { label: 'Reference No', value: parsed.refNo || 'N/A' },
          { label: 'Date/Time', value: parsed.dateTime || 'N/A' }
        ]);
      } else {
        showInfoModal('Verification Failed', [
          { label: 'Reason', value: 'Could not detect Amount and Reference No.' }
        ]);
      }
    } catch (e) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Payment OCR failed' }
      }));
    }
  };

  const getValidationText = (label) => {
    const status = validationStatus[label];
    if (!status) return null;
    const color = status.status === 'valid' ? '#4CAF50'
      : (status.status === 'invalid' || status.status === 'error') ? '#f44336'
      : status.status === 'partial' ? '#ff9800'
      : status.status === 'verifying' ? '#2196F3'
      : '#fff';
    return (
      <div style={{ 
        marginTop: 8, 
        fontSize: 13, 
        color: color,
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '8px 12px',
        borderRadius: '4px',
        maxWidth: '300px',
        wordWrap: 'break-word'
      }}>
        {status.message}
      </div>
    );
  };

  if (!payments.length) return (
    <div style={styles.noDataContainer}>
      <FaReceipt style={styles.noDataIcon} />
      <div>No payment applications available</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Payment Method</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBePaid)}</td>
                <td style={styles.tableCell}>{item.paymentOption}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(item.status === 'approved' ? styles.statusApproved : 
                         item.status === 'rejected' ? styles.statusRejected : styles.statusPending)
                  }}>
                    {item.status || 'pending'}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <button 
                    style={styles.viewButton}
                    onClick={() => openModal(item)}
                  >
                    <FaEye />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Details Modal */}
      {modalVisible && selectedPayment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaReceipt />
                Payment Application Details
              </h2>
              <button 
                style={styles.closeButton}
                onClick={closeModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.columnsContainer}>
                {/* Left Column - Member & Payment Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Member Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Member ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedPayment.id || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Name:
                      </span>
                      <span style={styles.fieldValue}>{`${selectedPayment.firstName || ''} ${selectedPayment.lastName || ''}`}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedPayment.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaCreditCard />
                      Payment Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaReceipt />
                        Transaction ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedPayment.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMoneyBillWave />
                        Amount:
                      </span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedPayment.amountToBePaid)}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaBan />
                        Penalty:
                      </span>
                      <span style={styles.fieldValue}>
                        {formatCurrency((selectedPayment.penaltyPaid != null ? selectedPayment.penaltyPaid : (selectedPayment.penalty != null ? selectedPayment.penalty : 0)))}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaCreditCard />
                        Payment Method:
                      </span>
                      <span style={styles.fieldValue}>{selectedPayment.paymentOption || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaCalendarAlt />
                        Date Applied:
                      </span>
                      <span style={styles.fieldValue}>{selectedPayment.dateApplied || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedPayment.dateApproved && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCheckCircle />
                        Approval Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedPayment.dateApproved}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedPayment.timeApproved}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Penalty Paid:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.penaltyPaid || selectedPayment.penalty || 0)}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Interest Paid:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.interestPaid || 0)}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Principal Paid:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.principalPaid || selectedPayment.amountToBePaid)}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Excess Payment:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.excessPayment || 0)}</span>
                      </div>
                    </div>
                  )}

                  {selectedPayment.dateRejected && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaTimes />
                        Rejection Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedPayment.dateRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedPayment.timeRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedPayment.rejectionReason || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Documents */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Proof of Payment
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedPayment.proofOfPaymentUrl && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedPayment.proofOfPaymentUrl, 'Proof of Payment')}
                        >
                          <img
                            src={selectedPayment.proofOfPaymentUrl}
                            alt="Proof of Payment"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Payment</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedPayment.status !== 'approved' && selectedPayment.status !== 'rejected' && (
              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={handleApproveClick}
                  disabled={isProcessing}
                >
                  Approve
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.rejectButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>Are you sure you want to approve this payment?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }} 
                onClick={confirmApprove}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.secondaryButton
                }} 
                onClick={() => setShowApproveConfirmation(false)}
                disabled={actionInProgress}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>Are you sure you want to reject this payment?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }} 
                onClick={confirmRejectFinal}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.secondaryButton
                }} 
                onClick={() => setShowRejectConfirmation(false)}
                disabled={actionInProgress}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div style={styles.rejectionModal}>
          <div style={styles.rejectionModalContent}>
            <h2 style={styles.rejectionTitle}>Select Rejection Reason</h2>
            {rejectionReasons.map((reason) => (
              <div 
                key={reason} 
                style={styles.reasonOption}
                onClick={() => handleReasonSelect(reason)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={selectedReason === reason}
                    onChange={() => handleReasonSelect(reason)}
                    style={styles.reasonRadio}
                  />
                  <span style={styles.reasonText}>{reason}</span>
                  {reason === "Other" && selectedReason === reason && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please specify reason"
                      style={styles.customReasonInput}
                    />
                  )}
                </div>
              </div>
            ))}
            <div style={styles.rejectionButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowRejectionModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmRejectButton}
                onClick={confirmRejection}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }} 
              onClick={closeModal}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isProcessing && (
        <div style={styles.modalOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {/* Success Modal */}
      {successMessageModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            {currentAction === 'approve' ? (
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
            ) : (
              <FaTimes style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            )}
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }} 
              onClick={handleSuccessOk}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {imageViewerVisible && (
        <div style={styles.imageViewerModal}>
          <div style={styles.imageViewerContent}>
            <img
              src={currentImage.url}
              alt={currentImage.label}
              style={styles.largeImage}
            />
            <button 
              style={styles.imageViewerClose} 
              onClick={closeImageViewer}
            >
              <FaTimes />
            </button>
            <p style={styles.imageViewerLabel}>{currentImage.label}</p>
            <div style={{ 
              position: 'fixed', 
              bottom: '20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '15px 20px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              zIndex: 2001
            }}>
              <button
                style={{
                  ...styles.verifyButton,
                  minWidth: '120px',
                  padding: '10px 20px'
                }}
                onClick={() => verifyPaymentOCR(currentImage.url, 'Payment Proof')}
              >
                {validationStatus['Payment Proof']?.status === 'verifying' ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                    Verifying...
                  </>
                ) : (
                  'Verify Payment'
                )}
              </button>
              {getValidationText('Payment Proof')}
            </div>

            {/* Info modal overlay inside image viewer */}
            {infoModal.visible && (
              <div style={styles.infoModalOverlay}>
                <div style={styles.infoModalCard}>
                  <div style={styles.infoTitle}>{infoModal.title}</div>
                  {infoModal.fields.map((f, i) => (
                    <div key={i} style={styles.infoRow}>
                      <span style={styles.infoLabel}>{f.label}</span>
                      <span style={styles.infoValue}>{f.value || 'N/A'}</span>
                    </div>
                  ))}
                  <button
                    style={styles.infoCloseButton}
                    onClick={closeInfoModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApplications;