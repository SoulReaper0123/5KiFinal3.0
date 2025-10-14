import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveLoans, RejectLoans } from '../../../../../Server/api';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationCircle, 
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
  FaFileInvoiceDollar,
  FaHandHoldingUsd,
  FaClock,
  FaPercentage
} from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
spinner: {
  border: '3px solid rgba(59, 130, 246, 0.3)',
  borderTop: '3px solid #3B82F6',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  animation: 'spin 1s linear infinite'
},
loadingContent: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '14px',
},
loadingText: {
  color: 'white',
  fontSize: '14px',
  fontWeight: '500'
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
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
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
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
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
    gridTemplateColumns: 'repeat(2, 1fr)',
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
  },
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
  "No deposit transactions made on account",
  "Insufficient funds (below ₱5,000 threshold)",
  "Existing unpaid loan balance",
  "Suspicious activity",
  "Other"
];

const ApplyLoans = ({ 
  loans, 
  currentPage, 
  totalPages, 
  onPageChange, 
  refreshData 
}) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
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
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [justCompletedAction, setJustCompletedAction] = useState(false);
  const [memberBalance, setMemberBalance] = useState(null);
  const [memberInvestment, setMemberInvestment] = useState(null);
  const [existingLoanInfo, setExistingLoanInfo] = useState({ hasExisting: false, outstanding: 0 });
  const [showSavingsConfirmModal, setShowSavingsConfirmModal] = useState(false);
  const [savingsShortfall, setSavingsShortfall] = useState({ needed: 0, available: 0, remaining: 0 });
  const [pendingLoanForSavings, setPendingLoanForSavings] = useState(null);

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

  const openModal = async (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);

    try {
      const balanceSnap = await database.ref(`Members/${loan.id}/balance`).once('value');
      const balance = parseFloat(balanceSnap.val()) || 0;
      setMemberBalance(balance);

      const investmentSnap = await database.ref(`Members/${loan.id}/investment`).once('value');
      const investment = parseFloat(investmentSnap.val()) || 0;
      setMemberInvestment(investment);

      const currentLoansSnap = await database.ref(`Loans/CurrentLoans/${loan.id}`).once('value');
      let hasExisting = false;
      let outstanding = 0;

      if (currentLoansSnap.exists()) {
        hasExisting = true;
        const loansObj = currentLoansSnap.val() || {};
        Object.values(loansObj).forEach(l => {
          const totalTermPayment = parseFloat(l.totalTermPayment) || 0;
          const amountPaid = parseFloat(l.amountPaid) || 0;
          const paymentsMade = parseFloat(l.paymentsMade) || 0;
          const perMonth = parseFloat(l.totalMonthlyPayment) || 0;
          let remaining = totalTermPayment - amountPaid;
          if (!isFinite(remaining) || remaining <= 0) {
            const term = parseFloat(l.term) || 0;
            remaining = Math.max(0, (perMonth * Math.max(0, term - paymentsMade)));
          }
          outstanding += Math.max(0, remaining);
        });
      }

      setExistingLoanInfo({ hasExisting, outstanding: Math.round(outstanding * 100) / 100 });
    } catch (e) {
      console.error('Failed fetching member financials:', e);
      setMemberBalance(null);
      setMemberInvestment(null);
      setExistingLoanInfo({ hasExisting: false, outstanding: 0 });
    }
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
    await processAction(selectedLoan, 'approve');
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

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedLoan, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

const handleSavingsConfirm = async () => {
  if (!pendingLoanForSavings) return;

  setShowSavingsConfirmModal(false);

  setSuccessMessage('Loan approved successfully using savings!');

  const approveData = {
    ...pendingLoanForSavings,
    dateApproved: formatDate(new Date()),
    timeApproved: formatTime(new Date())
  };

  setSelectedLoan(prev => ({
    ...prev,
    dateApproved: approveData.dateApproved,
    timeApproved: approveData.timeApproved,
    status: 'approved'
  }));

  setPendingApiCall({
    type: 'approve_with_savings',
    data: approveData,
    savingsAmount: savingsShortfall.needed
  });

  setSuccessMessageModalVisible(true);
  setJustCompletedAction(true);
  setPendingLoanForSavings(null);
  setSavingsShortfall({ needed: 0, available: 0, remaining: 0, memberBalance: undefined, loanAmount: undefined });
};

  const handleSavingsCancel = () => {
    setShowSavingsConfirmModal(false);
    setPendingLoanForSavings(null);
    setSavingsShortfall({ needed: 0, available: 0, remaining: 0, memberBalance: undefined, loanAmount: undefined });
  };

const processAction = async (loan, action, rejectionReason = '') => {
  // Show loading immediately
  setActionInProgress(true);
  setIsProcessing(true);
  setCurrentAction(action);

  try {
    // For approve, check balance, funds, and savings shortfall early
    if (action === 'approve') {
      const { id, loanAmount } = loan;
      const requestedAmount = parseFloat(loanAmount);

      // Fetch fresh member data
      const memberSnap = await database.ref(`Members/${id}`).once('value');
      const memberBalance = parseFloat(memberSnap.child('balance').val()) || 0;
      const memberInvestment = parseFloat(memberSnap.child('investment').val()) || 0;

      // Fetch current funds
      const fundsSnap = await database.ref('Settings/Funds').once('value');
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      // Fetch available savings
      const savingsSnap = await database.ref('Settings/Savings').once('value');
      const currentSavings = parseFloat(savingsSnap.val()) || 0;

      // Fetch processing fee
      const processingFeeSnap = await database.ref('Settings/ProcessingFee').once('value');
      const processingFee = parseFloat(processingFeeSnap.val()) || 0;

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
        setSuccessMessage('Loan approved successfully!');

        const approveData = {
          ...loan,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        };

        setSelectedLoan(prev => ({
          ...prev,
          dateApproved: approveData.dateApproved,
          timeApproved: approveData.timeApproved,
          status: 'approved'
        }));

        setPendingApiCall({
          type: 'approve',
          data: approveData,
          deductBalance,
          deductFunds,
          savingsAmount: 0
        });

        // Show success modal immediately (database operations deferred to OK button)
        setSuccessMessageModalVisible(true);
} else {
  // For loans exceeding investment: use full investment amount from both balance AND funds
  deductBalance = Math.min(memberInvestment, memberBalance); // ₱5,010
  deductFunds = Math.min(memberInvestment, currentFunds);    // ₱5,010
  
  // FIX: Calculate shortfall correctly - only the amount exceeding investment
  shortfall = Math.max(0, requestedAmount - memberInvestment); // ₱10 (5020 - 5010)

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
  setPendingLoanForSavings(loan);
  setShowSavingsConfirmModal(true);
  setIsProcessing(false);
  setActionInProgress(false);
  return;
}
    } else {
      setSuccessMessage('Loan rejected successfully!');

      const rejectData = {
        ...loan,
        dateRejected: formatDate(new Date()),
        timeRejected: formatTime(new Date()),
        rejectionReason
      };

      setSelectedLoan(prev => ({
        ...prev,
        dateRejected: rejectData.dateRejected,
        timeRejected: rejectData.timeRejected,
        rejectionReason,
        status: 'rejected'
      }));

      setPendingApiCall({
        type: 'reject',
        data: rejectData
      });

      // Show success modal immediately (database operations deferred to OK button)
      setSuccessMessageModalVisible(true);
    }
  } catch (error) {
    console.error('Error preparing action:', error);

    // Savings confirmation is handled above in the main logic

    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    // Hide loading
    setIsProcessing(false);
    setActionInProgress(false);
  }
};

const processDatabaseApprove = async (loan, deductBalance, deductFunds, savingsAmount) => {
  try {
      const { id, transactionId, term, loanAmount } = loan;

      const loanRef = database.ref(`Loans/LoanApplications/${id}/${transactionId}`);
      const memberBalanceRef = database.ref(`Members/${id}/balance`);

      const [loanSnap, memberBalanceSnap] = await Promise.all([
        loanRef.once('value'),
        memberBalanceRef.once('value')
      ]);

      if (!loanSnap.exists()) {
        throw new Error('Loan data not found.');
      }

      const memberBalance = parseFloat(memberBalanceSnap.val()) || 0;
      const requestedAmount = parseFloat(loanAmount);

      const originalTransactionId = transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const approvedRef = database.ref(`Loans/ApprovedLoans/${id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${id}/${newTransactionId}`);
      const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${newTransactionId}`);
      const memberLoanRef = database.ref(`Members/${id}/loans/${newTransactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      const loanData = loanSnap.val();

      const loanTypeKey = String(loanData.loanType || '').trim();
      const termKeyRaw = String(loanData.term ?? '').trim();
      const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
      const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);
      const processingFeeRef = database.ref('Settings/ProcessingFee');

      const [fundsSnap, feeSnap] = await Promise.all([
        fundsRef.once('value'),
        processingFeeRef.once('value'),
      ]);

      let interestRateRaw = null;
      for (const tKey of termKeys) {
        const snap = await database.ref(`Settings/LoanTypes/${loanTypeKey}/${tKey}`).once('value');
        const val = snap.val();
        if (val !== null && val !== undefined && val !== '') {
          interestRateRaw = val;
          break;
        }
      }
      if (interestRateRaw === null) {
        throw new Error(`Missing interest rate for type "${loanData.loanType}" and term ${termKeys[0] || loanData.term} months. Please set it in Settings > Loan & Dividend > Types of Loans.`);
      }

      const interestRatePercentage = parseFloat(interestRateRaw);
      const interestRateDecimal = interestRatePercentage / 100;
      const amount = parseFloat(loanData.loanAmount);
      const termMonths = parseInt(loanData.term);
      const currentFunds = parseFloat(fundsSnap.val());
      const processingFee = parseFloat(feeSnap.val());

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
        ...loanData,
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
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
      borrowedFromSavings: Math.round(savingsAmount * 100) / 100
      };

      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);

    // Deduct from member balance
    const balanceToDeduct = deductBalance;
    const newMemberBalance = Math.max(0, Math.ceil((memberBalance - balanceToDeduct) * 100) / 100);
    await memberBalanceRef.set(newMemberBalance);

    // Deduct from funds
    const fundsToDeduct = deductFunds;
    const newFundsAmount = currentFunds - fundsToDeduct;
    await fundsRef.set(newFundsAmount);

    const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
    const fundsHistoryRef = database.ref(`Settings/FundsHistory/${timestamp}`);
    await fundsHistoryRef.set(newFundsAmount);

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

    console.log(`Member balance deducted: ${formatCurrency(balanceToDeduct)}, funds deducted: ${formatCurrency(fundsToDeduct)}, savings change: ${formatCurrency(savingsChange)}, savingsAmount: ${savingsAmount}`);

      await loanRef.remove();

    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve loan');
    }
  };



// New function to handle approval with savings deduction
const processDatabaseApproveWithSavings = async (loan, savingsAmount) => {
  try {
    const { id, transactionId, term, loanAmount } = loan;

    const loanRef = database.ref(`Loans/LoanApplications/${id}/${transactionId}`);
    const memberBalanceRef = database.ref(`Members/${id}/balance`);

    const [loanSnap, memberBalanceSnap] = await Promise.all([
      loanRef.once('value'),
      memberBalanceRef.once('value')
    ]);

    if (!loanSnap.exists()) {
      throw new Error('Loan data not found.');
    }

    const memberBalance = parseFloat(memberBalanceSnap.val()) || 0;
    const requestedAmount = parseFloat(loanAmount);

    const originalTransactionId = transactionId;
    const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

    const approvedRef = database.ref(`Loans/ApprovedLoans/${id}/${newTransactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${id}/${newTransactionId}`);
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${newTransactionId}`);
    const memberLoanRef = database.ref(`Members/${id}/loans/${newTransactionId}`);
    const fundsRef = database.ref('Settings/Funds');
    const loanData = loanSnap.val();

    const loanTypeKey = String(loanData.loanType || '').trim();
    const termKeyRaw = String(loanData.term ?? '').trim();
    const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
    const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);
    const processingFeeRef = database.ref('Settings/ProcessingFee');

    const [fundsSnap, feeSnap] = await Promise.all([
      fundsRef.once('value'),
      processingFeeRef.once('value'),
    ]);

    let interestRateRaw = null;
    for (const tKey of termKeys) {
      const snap = await database.ref(`Settings/LoanTypes/${loanTypeKey}/${tKey}`).once('value');
      const val = snap.val();
      if (val !== null && val !== undefined && val !== '') {
        interestRateRaw = val;
        break;
      }
    }
    if (interestRateRaw === null) {
      throw new Error(`Missing interest rate for type "${loanData.loanType}" and term ${termKeys[0] || loanData.term} months. Please set it in Settings > Loan & Dividend > Types of Loans.`);
    }

    const interestRatePercentage = parseFloat(interestRateRaw);
    const interestRateDecimal = interestRatePercentage / 100;
    const amount = parseFloat(loanData.loanAmount);
    const termMonths = parseInt(loanData.term);
    const currentFunds = parseFloat(fundsSnap.val());
    const processingFee = parseFloat(feeSnap.val());

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
      ...loanData,
      transactionId: newTransactionId,
      originalTransactionId: originalTransactionId,
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
      borrowedFromSavings: Math.round(savingsAmount * 100) / 100
    };

    await approvedRef.set(approvedData);
    await transactionRef.set(approvedData);
    await currentLoanRef.set(approvedData);
    await memberLoanRef.set(approvedData);

    // Deduct from member balance first
    const balanceToDeduct = Math.min(amount, memberBalance);
    const remainingAfterBalance = amount - balanceToDeduct;
    const newMemberBalance = Math.max(0, Math.ceil((memberBalance - balanceToDeduct) * 100) / 100);
    await memberBalanceRef.set(newMemberBalance);

    // Deduct from funds
    const fundsToDeduct = Math.min(remainingAfterBalance, currentFunds);
    const remainingAfterFunds = remainingAfterBalance - fundsToDeduct;
    const newFundsAmount = currentFunds - fundsToDeduct;
    await fundsRef.set(newFundsAmount);

    const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
    const fundsHistoryRef = database.ref(`Settings/FundsHistory/${timestamp}`);
    await fundsHistoryRef.set(newFundsAmount);

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

    console.log(`Member balance deducted: ${formatCurrency(balanceToDeduct)}, funds deducted: ${formatCurrency(fundsToDeduct)}, savings deducted: ${formatCurrency(savingsAmount)}`);

    await loanRef.remove();

  } catch (err) {
    console.error('Approval with savings DB error:', err);
    throw new Error(err.message || 'Failed to approve loan with savings');
  }
};

  const processDatabaseReject = async (loan, rejectionReason) => {
    try {
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);
      const status = 'rejected';

      const originalTransactionId = loan.transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const loanRef = database.ref(`Loans/LoanApplications/${loan.id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Loans/RejectedLoans/${loan.id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${loan.id}/${newTransactionId}`);

      const rejectedLoan = { 
        ...loan, 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        timestamp: now.getTime(),
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedLoan);
      await transactionRef.set(rejectedLoan);

      await loanRef.remove();

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject loan');
    }
  };

  const callApiApprove = async (loan) => {
    try {
      const now = new Date();

      const toNumber = (v) => {
        if (v === null || v === undefined) return NaN;
        const s = String(v).replace(/,/g, '').trim();
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : NaN;
      };
      const toInt = (v) => {
        if (v === null || v === undefined) return NaN;
        const s = String(v).replace(/[^0-9]/g, '');
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : NaN;
      };

      const loanTypeKey = String(loan.loanType || '').trim();
      const termKeyRaw = String(loan.term ?? '').trim();
      const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
      const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);

      let interestRateRaw = null;
      for (const tKey of termKeys) {
        const snap = await database.ref(`Settings/LoanTypes/${loanTypeKey}/${tKey}`).once('value');
        const val = snap.val();
        if (val !== null && val !== undefined && val !== '') {
          interestRateRaw = val;
          break;
        }
      }
      if (interestRateRaw === null) {
        const fallbackSnap = await database.ref(`Settings/InterestRate/${termKeyInt || termKeyRaw}`).once('value');
        const fallbackVal = fallbackSnap.val();
        if (fallbackVal !== null && fallbackVal !== undefined && fallbackVal !== '') {
          interestRateRaw = fallbackVal;
        }
      }

      const interestRatePercentage = toNumber(interestRateRaw);
      const interestRate = Number.isFinite(interestRatePercentage) ? interestRatePercentage / 100 : NaN;

      const amount = toNumber(loan.loanAmount);
      const termMonths = toInt(loan.term);

      const processingFeeSnap = await database.ref('Settings/ProcessingFee').once('value');
      const processingFee = toNumber(processingFeeSnap.val());

      if (!Number.isFinite(interestRate) || !Number.isFinite(amount) || !Number.isFinite(termMonths) || termMonths <= 0 || !Number.isFinite(processingFee)) {
        throw new Error('Missing or invalid settings/data for email payload calculation.');
      }

      const monthlyPrincipal = amount / termMonths;
      const interestPerTerm = amount * interestRate;
      const totalInterest = interestPerTerm * termMonths;
      const totalTermPayment = amount + totalInterest;
      const totalMonthlyPayment = totalTermPayment / termMonths;
      const releaseAmount = amount - processingFee;

      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 30);

      const response = await ApproveLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: amount.toFixed(2),
        term: termMonths,
        dateApproved: loan.dateApproved || formatDate(now),
        timeApproved: loan.timeApproved || formatTime(now),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
        status: 'approved',
        interestRate: (interestRate * 100).toFixed(2) + '%',
        interest: (amount * interestRate).toFixed(2),
        totalInterest: totalInterest.toFixed(2), 
        monthlyPayment: monthlyPrincipal.toFixed(2),
        totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
        totalTermPayment: totalTermPayment.toFixed(2),
        releaseAmount: releaseAmount.toFixed(2),
        processingFee: processingFee.toFixed(2),
        dueDate: formatDate(dueDate)
      });

      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (loan) => {
    try {
      const now = new Date();
      
      let rejectionMessage = '';
      if (loan.rejectionReason.includes('No deposit transactions')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to our records showing that no deposit transactions have been made on your account since you joined our platform. Maintaining an active deposit history is one of the key requirements for loan eligibility. 

We encourage you to begin transacting with your account so you may be eligible for future loan applications. Thank you.`;
      } 
      else if (loan.rejectionReason.includes('Insufficient funds')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to your account's current maintaining balance falling below the required threshold of ₱5,000. As part of our eligibility criteria, a minimum maintaining balance is necessary to ensure financial stability and responsible borrowing.

We highly encourage you to review your account status and consider making a deposit to maintain eligibility in the future. You may reapply once your account meets the required balance and we'll be happy to reassess your application.`;
      }
      else if (loan.rejectionReason.includes('Existing unpaid loan')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to existing unpaid loans and balances on your account.

We recommend settling outstanding balances first before reapplying. Once cleared, you may submit a new application and we'll be happy to reassess it.`;
      }
      else {
        rejectionMessage = `After careful review, we regret to inform you that your loan application has not been approved.${loan.rejectionReason ? `\n\nReason: ${loan.rejectionReason}` : ''}`;
      }

      const response = await RejectLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: loan.loanAmount,
        term: loan.term,
        dateRejected: loan.dateRejected || formatDate(now),
        timeRejected: loan.timeRejected || formatTime(now),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
        status: 'rejected',
        rejectionReason: loan.rejectionReason || 'Rejected by admin',
        rejectionMessage: rejectionMessage
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email');
      }
    } catch (err) {
      console.error('API reject error:', err);
    }
  };

const handleSuccessOk = async () => {
  // Close success modal
  setSuccessMessageModalVisible(false);

  if (!pendingApiCall) {
    setCurrentAction(null);
    closeModal();
    setSelectedLoan(null);
    refreshData();
    return;
  }

  setIsProcessing(true);
  setActionInProgress(true);

  try {
    if (pendingApiCall.type === 'approve') {
      await processDatabaseApprove(pendingApiCall.data, pendingApiCall.deductBalance, pendingApiCall.deductFunds, pendingApiCall.savingsAmount);
      callApiApprove(pendingApiCall.data);
    } else if (pendingApiCall.type === 'approve_with_savings') {
      await processDatabaseApproveWithSavings(pendingApiCall.data, pendingApiCall.savingsAmount);
      callApiApprove(pendingApiCall.data);
    } else if (pendingApiCall.type === 'reject') {
      await processDatabaseReject(pendingApiCall.data, pendingApiCall.data.rejectionReason);
      callApiReject(pendingApiCall.data);
    }
  } catch (error) {
    console.error('Error processing DB or API call:', error);
    setErrorMessage(error.message || 'An error occurred during final processing.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false);
    setActionInProgress(false);
    setPendingApiCall(null);
    setCurrentAction(null);
    closeModal();
    setSelectedLoan(null);
    refreshData();
  }
};

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (selectedLoan.proofOfIncomeUrl) {
      images.push({ 
        url: selectedLoan.proofOfIncomeUrl, 
        label: 'Proof of Income' 
      });
    }
    if (selectedLoan.proofOfIdentityUrl) {
      images.push({ 
        url: selectedLoan.proofOfIdentityUrl, 
        label: 'Proof of Identity' 
      });
    }
    if (selectedLoan.proofOfCollateralUrl) {
      images.push({ 
        url: selectedLoan.proofOfCollateralUrl, 
        label: 'Proof of Collateral' 
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

  const hasDocuments = (loan) => {
    return loan.proofOfIncomeUrl || loan.proofOfIdentityUrl || loan.proofOfCollateralUrl;
  };

  if (!loans.length) return (
    <div style={styles.noDataContainer}>
      <FaHandHoldingUsd style={styles.noDataIcon} />
      <div>No loan applications available</div>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>
                  {formatCurrency(item.loanAmount)}
                  {item.requiresCollateral && (
                    <span style={{ marginLeft: '5px', color: '#ff9800', fontSize: '12px' }} title="Collateral Required">
                      🔒
                    </span>
                  )}
                </td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
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

      {/* Loan Details Modal */}
      {modalVisible && selectedLoan && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaHandHoldingUsd />
                Loan Application Details
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
                {/* Left Column - Member & Loan Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Member Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaIdCard />
                        Member ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.id || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Name:
                      </span>
                      <span style={styles.fieldValue}>{`${selectedLoan.firstName || ''} ${selectedLoan.lastName || ''}`}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.email || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMoneyBillWave />
                        Current Balance:
                      </span>
                      <span style={styles.fieldValue}>{memberBalance !== null ? formatCurrency(memberBalance) : 'Loading...'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaFileInvoiceDollar />
                        Existing Loan:
                      </span>
                      <span style={styles.fieldValue}>
                        {existingLoanInfo.hasExisting ? `Yes — Outstanding: ${formatCurrency(existingLoanInfo.outstanding)}` : 'No'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaHandHoldingUsd />
                      Loan Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Transaction ID:</span>
                      <span style={styles.fieldValue}>{selectedLoan.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Loan Amount:</span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedLoan.loanAmount)}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Term:</span>
                      <span style={styles.fieldValue}>{selectedLoan.term} months</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Disbursement:</span>
                      <span style={styles.fieldValue}>{selectedLoan.disbursement || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaCalendarAlt />
                        Date Applied:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.dateApplied || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial & Documents */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Account Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Account Name:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountName || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Account Number:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountNumber || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Collateral Information */}
                  {selectedLoan.requiresCollateral && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaIdCard />
                        Collateral Details
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Required:</span>
                        <span style={styles.fieldValue}>Yes</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Type:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralType || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Value:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralValue ? formatCurrency(selectedLoan.collateralValue) : 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Description:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralDescription || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Application Status
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...(selectedLoan.status === 'approved' ? styles.statusApproved : 
                             selectedLoan.status === 'rejected' ? styles.statusRejected : styles.statusPending)
                      }}>
                        {selectedLoan.status || 'pending'}
                      </span>
                    </div>
                    {selectedLoan.dateApproved && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateApproved}</span>
                      </div>
                    )}
                    {selectedLoan.dateRejected && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateRejected}</span>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  {hasDocuments(selectedLoan) && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaIdCard />
                        Submitted Documents
                      </h3>
                      <div style={styles.documentsGrid}>
                        {selectedLoan.proofOfIncomeUrl && (
                          <div 
                            style={styles.documentCard}
                            onClick={() => openImageViewer(selectedLoan.proofOfIncomeUrl, 'Proof of Income', 0)}
                          >
                            <img
                              src={selectedLoan.proofOfIncomeUrl}
                              alt="Proof of Income"
                              style={styles.documentImage}
                            />
                            <div style={styles.documentLabel}>Proof of Income</div>
                          </div>
                        )}
                        {selectedLoan.proofOfIdentityUrl && (
                          <div 
                            style={styles.documentCard}
                            onClick={() => openImageViewer(selectedLoan.proofOfIdentityUrl, 'Proof of Identity', 1)}
                          >
                            <img
                              src={selectedLoan.proofOfIdentityUrl}
                              alt="Proof of Identity"
                              style={styles.documentImage}
                            />
                            <div style={styles.documentLabel}>Proof of Identity</div>
                          </div>
                        )}
                        {selectedLoan.proofOfCollateralUrl && (
                          <div 
                            style={styles.documentCard}
                            onClick={() => openImageViewer(selectedLoan.proofOfCollateralUrl, 'Proof of Collateral', 2)}
                          >
                            <img
                              src={selectedLoan.proofOfCollateralUrl}
                              alt="Proof of Collateral"
                              style={styles.documentImage}
                            />
                            <div style={styles.documentLabel}>Proof of Collateral</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedLoan.status !== 'approved' && selectedLoan.status !== 'rejected' && (
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
      <p style={styles.modalText}>Are you sure you want to approve this loan?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(actionInProgress ? styles.disabledButton : {})
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
      <p style={styles.modalText}>Are you sure you want to reject this loan?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(actionInProgress ? styles.disabledButton : {})
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
              onClick={() => setErrorModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

{/* Loading Overlay - Same design as logout */}
{isProcessing && (
  <div style={styles.loadingOverlay}>
    <div style={styles.loadingContent}>
      <div style={styles.spinner}></div>
      <div style={styles.loadingText}>
        {currentAction === 'approve' ? 'Approving loan...' : 'Rejecting loan...'}
      </div>
    </div>
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
            ...styles.actionButton,
            ...styles.approveButton,
            ...(actionInProgress ? styles.disabledButton : {})
          }}
          onClick={handleSavingsConfirm}
          disabled={actionInProgress}
        >
          {actionInProgress ? 'Processing...' : 'Yes, Use Savings'}
        </button>
        <button
          style={{
            ...styles.actionButton,
            ...styles.rejectButton
          }}
          onClick={handleSavingsCancel}
          disabled={actionInProgress}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* Image Viewer */}
      {imageViewerVisible && (
        <div style={styles.imageViewerModal}>
          <div style={styles.imageViewerContent}>
            <button 
              style={{ ...styles.imageViewerNav, ...styles.prevButton }}
              onClick={() => navigateImages('prev')}
            >
              <FaChevronLeft />
            </button>
            <img
              src={currentImage.url}
              alt={currentImage.label}
              style={styles.largeImage}
            />
            <button 
              style={{ ...styles.imageViewerNav, ...styles.nextButton }}
              onClick={() => navigateImages('next')}
            >
              <FaChevronRight />
            </button>
            <button 
              style={styles.imageViewerClose} 
              onClick={closeImageViewer}
            >
              <FaTimes />
            </button>
            <p style={styles.imageViewerLabel}>
              {currentImage.label}
              {availableImages.length > 1 && (
                <span style={{ fontSize: '14px', opacity: 0.8, marginLeft: '10px' }}>
                  ({currentImageIndex + 1} of {availableImages.length})
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLoans;