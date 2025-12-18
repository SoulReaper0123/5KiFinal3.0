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
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tableRow: {
    height: '52px',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f1f5f9'
  },
  tableCell: {
    textAlign: 'center',
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
  justifyContent: 'center', // Add this
  gap: '0.25rem',
  transition: 'all 0.2s ease',
  width: '40%', // Add this to take full cell width
  margin: '0 auto', // Add this for extra centering
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

  setShowRejectionModal(false);
  setShowRejectConfirmation(true);
};

const confirmRejectFinal = async () => {
  setShowRejectConfirmation(false);
  await processAction(selectedPayment, 'reject', selectedReason === "Other" ? customReason : selectedReason);
};

const processAction = async (payment, action, rejectionReason = '') => {
  // Defer DB writes and refresh to success modal OK
  setActionInProgress(true);
  setIsProcessing(true);
  setCurrentAction(action);

  try {
    if (action === 'approve') {
      setSuccessMessage('Payment approved successfully!');

      const approveData = {
        ...payment,
        dateApproved: formatDate(new Date()),
        timeApproved: formatTime(new Date())
      };

      // Local preview only; do not touch DB yet
      setSelectedPayment(prev => ({
        ...prev,
        dateApproved: approveData.dateApproved,
        timeApproved: approveData.timeApproved,
        status: 'approved'
      }));

      setPendingApiCall({
        type: 'approve',
        data: approveData
      });
    } else {
      setSuccessMessage('Payment rejected successfully!');

      const rejectData = {
        ...payment,
        dateRejected: formatDate(new Date()),
        timeRejected: formatTime(new Date()),
        rejectionReason
      };

      // Local preview only; do not touch DB yet
      setSelectedPayment(prev => ({
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
    }

    setSuccessMessageModalVisible(true);
  } catch (error) {
    console.error('Error preparing action:', error);
    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false);
    setActionInProgress(false);
  }
};

const processDatabaseApprove = async (payment) => {
  try {
    console.log('🚀 DEBUG: Starting payment approval process');
    
    const { id, transactionId, amountToBePaid } = payment;

    // 1. Verify member details
    console.log('🔍 Step 1: Verifying member details...');
    const memberRef = database.ref(`Members/${id}`);
    const memberSnap = await memberRef.once('value');
    const memberData = memberSnap.val();

    if (!memberData) {
      throw new Error('Member data not found in database.');
    }

    if (memberData.email !== payment.email ||
        memberData.firstName !== payment.firstName || 
        memberData.lastName !== payment.lastName) {
      throw new Error('Member details in payment do not match member record.');
    }

    console.log('✅ Member verified:', {
      memberId: id,
      name: `${memberData.firstName} ${memberData.lastName}`,
      email: memberData.email
    });

    // 2. Load Settings
    console.log('🔍 Step 2: Loading system settings...');
    const fundsRef = database.ref('Settings/Funds');
    const yieldsRef = database.ref('Settings/Yields');
    const yieldsHistoryRef = database.ref('Settings/YieldsHistory');
    const savingsRef = database.ref('Settings/Savings');
    const savingsHistoryRef = database.ref('Settings/SavingsHistory');

    // 3. Find current loan for this member
    console.log('🔍 Step 3: Finding current loan...');
    const memberLoansRef = database.ref(`Loans/CurrentLoans/${id}`);
    let currentLoanData = null;
    let currentLoanKey = null;
    let isLoanPayment = false;
    let interestAmount = 0;
    let loanAmount = 0;
    let dueDateStr = '';
    let approvedLoanData = null;

    // Try preferred loan ID first (from payment)
    const preferredLoanKey = payment.selectedLoanId;
    if (preferredLoanKey) {
      console.log(`🔍 Looking for specific loan: ${preferredLoanKey}`);
      const specificLoanSnap = await database.ref(`Loans/CurrentLoans/${id}/${preferredLoanKey}`).once('value');
      if (specificLoanSnap.exists()) {
        currentLoanData = specificLoanSnap.val();
        currentLoanKey = preferredLoanKey;
        isLoanPayment = true;
        loanAmount = parseFloat(currentLoanData.loanAmount) || 0;
        dueDateStr = currentLoanData.dueDate || currentLoanData.nextDueDate || '';
        console.log(`✅ Found specific loan: ${currentLoanKey}`);
      }
    }

    // Fallback: find first active loan
    if (!currentLoanData) {
      console.log('🔍 Searching for any active loan...');
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
        if (currentLoanData) {
          console.log(`✅ Found loan: ${currentLoanKey}`);
        }
      }
    }

    if (!currentLoanData) {
      console.log('⚠️ No current loan found - treating as non-loan payment');
    }

    // 4. Fetch original loan breakdown from ApprovedLoans
    console.log('🔍 Step 4: Fetching original loan breakdown...');
    let originalMemberContribution = 0;
    let originalFundsContribution = 0;
    let originalTotalInterest = 0;
    
    if (currentLoanKey) {
      const approvedLoanRef = database.ref(`Loans/ApprovedLoans/${id}/${currentLoanKey}`);
      const approvedLoanSnap = await approvedLoanRef.once('value');
      if (approvedLoanSnap.exists()) {
        approvedLoanData = approvedLoanSnap.val();
        interestAmount = parseFloat(approvedLoanData.interest) || 0;
        originalTotalInterest = parseFloat(approvedLoanData.totalInterest) || 0;
        
        // Get original breakdown from loan approval
        originalMemberContribution = parseFloat(approvedLoanData.memberContribution) || 0;
        originalFundsContribution = parseFloat(approvedLoanData.borrowedFromFunds) || 0;
        
        console.log('📊 Original loan breakdown:', {
          memberContribution: formatCurrency(originalMemberContribution),
          fundsContribution: formatCurrency(originalFundsContribution),
          interestPerTerm: formatCurrency(interestAmount),
          totalInterest: formatCurrency(originalTotalInterest)
        });
      }
    }

    // Generate new transaction ID for approved payment
    console.log('🔢 Step 5: Generating transaction IDs...');
    const originalTransactionId = transactionId;
    const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

    // Database references
    const paymentRef = database.ref(`Payments/PaymentApplications/${id}/${originalTransactionId}`);
    const approvedRef = database.ref(`Payments/ApprovedPayments/${id}/${newTransactionId}`);
    const transactionRef = database.ref(`Transactions/Payments/${id}/${newTransactionId}`);

    // 5. Fetch current values
    console.log('🔍 Step 6: Fetching current financial values...');
    const [paymentSnap, fundsSnap, savingsSnap, yieldsSnap] = await Promise.all([
      paymentRef.once('value'),
      fundsRef.once('value'),
      savingsRef.once('value'),
      yieldsRef.once('value')
    ]);

    if (!paymentSnap.exists()) {
      throw new Error('Payment application data not found.');
    }

    const paymentData = paymentSnap.val();
    const paymentAmount = parseFloat(amountToBePaid) || 0;
    const currentFunds = parseFloat(fundsSnap.val()) || 0;
    const currentSavings = parseFloat(savingsSnap.val()) || 0;
    const currentYields = parseFloat(yieldsSnap.val()) || 0;
    const memberBalance = parseFloat(memberData.balance || 0);
    const memberInvestment = parseFloat(memberData.investment || 0);

    console.log('📊 Current financial state:', {
      paymentAmount: formatCurrency(paymentAmount),
      memberBalance: formatCurrency(memberBalance),
      memberInvestment: formatCurrency(memberInvestment),
      currentFunds: formatCurrency(currentFunds),
      currentSavings: formatCurrency(currentSavings),
      currentYields: formatCurrency(currentYields),
      hasLoan: isLoanPayment,
      loanAmount: formatCurrency(loanAmount)
    });

    // 6. Calculate penalty (goes to Savings)
    console.log('🧮 Step 7: Calculating penalty...');
    let penaltyDue = 0;
    const penaltyFromApp = parseFloat(paymentData?.penalty) || 0;
    
    if (penaltyFromApp > 0) {
      penaltyDue = Math.round((penaltyFromApp + Number.EPSILON) * 100) / 100;
      console.log(`   Penalty from application: ${formatCurrency(penaltyDue)}`);
    } else if (isLoanPayment && dueDateStr) {
      try {
        const parseToStartOfDay = (d) => {
          const dt = new Date(d);
          return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        };
        
        const todayStart = parseToStartOfDay(new Date());
        const dueDateParsed = parseToStartOfDay(new Date(dueDateStr));
        
        if (!isNaN(dueDateParsed.getTime()) && todayStart > dueDateParsed) {
          const ms = todayStart.getTime() - dueDateParsed.getTime();
          const overdueDays = Math.ceil(ms / (1000 * 60 * 60 * 24));
          penaltyDue = Math.max(0, Math.round(((interestAmount * (overdueDays / 30)) + Number.EPSILON) * 100) / 100);
          console.log(`   Calculated penalty: ${formatCurrency(penaltyDue)} (${overdueDays} days overdue)`);
        }
      } catch (error) {
        console.warn('   Error calculating penalty:', error.message);
      }
    }

    // Include any previously accrued penalties
    const existingAccruedPenalty = parseFloat(currentLoanData?.penaltyAccrued) || 0;
    if (existingAccruedPenalty > 0) {
      console.log(`   Adding existing accrued penalty: ${formatCurrency(existingAccruedPenalty)}`);
    }
    
    penaltyDue = Math.round(((penaltyDue + existingAccruedPenalty) + Number.EPSILON) * 100) / 100;
    const penaltyPaid = Math.min(paymentAmount, penaltyDue);

    console.log(`📊 Penalty calculation complete: ${formatCurrency(penaltyPaid)} to be paid`);

    // Amount left for interest/principal after penalty
    const remainingAfterPenalty = paymentAmount - penaltyPaid;
    console.log(`   Amount after penalty: ${formatCurrency(remainingAfterPenalty)}`);

    // 7. Calculate interest and principal payment
    console.log('🧮 Step 8: Calculating interest and principal allocation...');
    let interestPaid = 0;
    let principalPaid = 0;
    let excessPayment = 0;
    let fundsAllocation = 0;
    let memberBalanceAllocation = 0;
    let memberInvestmentAllocation = 0;

    if (isLoanPayment && currentLoanData) {
      console.log('   Processing as LOAN PAYMENT');
      
      // First pay interest (goes to Yields)
      interestPaid = Math.min(remainingAfterPenalty, interestAmount);
      const afterInterest = remainingAfterPenalty - interestPaid;
      
      console.log(`   Interest to pay: ${formatCurrency(interestPaid)}`);
      console.log(`   Amount after interest: ${formatCurrency(afterInterest)}`);

      // Get total principal owed
      const totalPrincipalOwed = parseFloat(currentLoanData.loanAmount) || 0;
      const principalAlreadyPaid = parseFloat(currentLoanData.amountPaid || 0);
      const remainingPrincipal = totalPrincipalOwed - principalAlreadyPaid;
      
      console.log(`   Principal details:`, {
        totalOwed: formatCurrency(totalPrincipalOwed),
        alreadyPaid: formatCurrency(principalAlreadyPaid),
        remaining: formatCurrency(remainingPrincipal)
      });

      // Then pay principal (up to remaining principal)
      principalPaid = Math.min(afterInterest, remainingPrincipal);
      
      // Any remaining after paying full principal is excess
      excessPayment = Math.max(0, afterInterest - principalPaid);
      
      console.log(`   Principal to pay: ${formatCurrency(principalPaid)}`);
      console.log(`   Excess payment: ${formatCurrency(excessPayment)}`);

      // Calculate allocations based on original sources
      if (principalPaid > 0) {
        console.log('   Allocating principal repayment...');
        
        // IMPORTANT: The ENTIRE principal payment stays in Funds
        // But we track how much should be credited back to member
        fundsAllocation = principalPaid; // ALL principal stays in Funds
        
        // Member gets credit for their original contribution portion
        if (originalMemberContribution > 0 && totalPrincipalOwed > 0) {
          const memberProportion = originalMemberContribution / originalFundsContribution;
          memberBalanceAllocation = Math.round((principalPaid * memberProportion) * 100) / 100;
          console.log(`   Member proportion: ${(memberProportion * 100).toFixed(2)}%`);
          console.log(`   Member credit from principal: ${formatCurrency(memberBalanceAllocation)}`);
        } else {
          // If no member contribution recorded, all stays in Funds
          memberBalanceAllocation = 0;
        }
      }
      
      // EXCESS PAYMENT: Full excess added to BOTH member AND Funds
      if (excessPayment > 0) {
        console.log(`   Allocating excess payment: ${formatCurrency(excessPayment)}`);
        
        // Excess goes to member (balance + investment)
        memberBalanceAllocation += excessPayment;
        memberInvestmentAllocation = excessPayment;
        
        // Excess ALSO stays in Funds
        fundsAllocation += excessPayment;
        
        console.log(`   Excess to member (balance+investment): ${formatCurrency(excessPayment)}`);
        console.log(`   Excess also stays in Funds: ${formatCurrency(excessPayment)}`);
      }
      
      console.log('📊 Final allocation:', {
        fundsAllocation: formatCurrency(fundsAllocation),
        memberBalanceAllocation: formatCurrency(memberBalanceAllocation),
        memberInvestmentAllocation: formatCurrency(memberInvestmentAllocation)
      });

      // Update loan record
      const prevAmountPaid = parseFloat(currentLoanData?.amountPaid || 0);
      const totalInterestForLoan = parseFloat(currentLoanData?.totalInterest || originalTotalInterest || (interestAmount * (currentLoanData.term || 1)));
      const amountPaidThisApproval = interestPaid + principalPaid;
      const newAmountPaid = prevAmountPaid + amountPaidThisApproval;
      const newRemainingBalance = Math.max(0, (totalPrincipalOwed + totalInterestForLoan) - newAmountPaid);

      console.log('📊 Loan update calculation:', {
        prevAmountPaid: formatCurrency(prevAmountPaid),
        amountPaidThisTime: formatCurrency(amountPaidThisApproval),
        newAmountPaid: formatCurrency(newAmountPaid),
        newRemainingBalance: formatCurrency(newRemainingBalance)
      });

      if (newRemainingBalance <= 0.01) { // Allow small rounding errors
        console.log('🏁 Loan fully paid! Marking as paid...');
        
        // Loan fully paid - mark as paid
        const nowPaid = new Date();
        const datePaid = formatDate(nowPaid);
        const timePaid = formatTime(nowPaid);
        const paidTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

        const paidRecord = {
          ...(currentLoanData || {}),
          transactionId: paidTransactionId,
          originalTransactionId: currentLoanKey,
          status: 'paid',
          datePaid,
          timePaid,
          timestamp: nowPaid.getTime(),
          loanAmount: totalPrincipalOwed,
          // Record final allocations
          memberCredit: memberBalanceAllocation,
          fundsAllocation: fundsAllocation,
          totalPayment: paymentAmount,
          interestPaid: interestPaid,
          principalPaid: principalPaid,
          excessPayment: excessPayment,
          penaltyPaid: penaltyPaid,
          finalBreakdown: {
            toYields: interestPaid,
            toSavings: penaltyPaid,
            toMemberBalance: memberBalanceAllocation,
            toMemberInvestment: memberInvestmentAllocation,
            staysInFunds: fundsAllocation
          }
        };

        // Write to PaidLoans
        const paidLoansRef = database.ref(`Loans/PaidLoans/${id}/${paidTransactionId}`);
        const paidTxnRef = database.ref(`Transactions/Loans/${id}/${paidTransactionId}`);
        await Promise.all([
          paidLoansRef.set(paidRecord),
          paidTxnRef.set(paidRecord)
        ]);

        // Remove from CurrentLoans and ApprovedLoans
        const memberLoanRef = database.ref(`Members/${id}/loans/${currentLoanKey}`);
        await Promise.all([
          memberLoansRef.child(currentLoanKey).remove(),
          memberLoanRef.remove(),
          database.ref(`Loans/ApprovedLoans/${id}/${currentLoanKey}`).remove()
        ]);

        console.log('✅ Loan marked as paid and moved to PaidLoans');

      } else {
        console.log('📝 Updating loan with remaining balance...');
        // Update loan with remaining balance
        const loanUpdates = {};
        loanUpdates['loanAmount'] = Math.ceil((remainingPrincipal - principalPaid) * 100) / 100;
        loanUpdates['amountPaid'] = newAmountPaid;
        loanUpdates['remainingBalance'] = Math.round(newRemainingBalance * 100) / 100;
        loanUpdates['paymentsMade'] = (currentLoanData.paymentsMade || 0) + 1;
        
        const memberLoanRef = database.ref(`Members/${id}/loans/${currentLoanKey}`);
        await Promise.all([
          memberLoansRef.child(currentLoanKey).update(loanUpdates),
          memberLoanRef.update(loanUpdates),
          database.ref(`Loans/ApprovedLoans/${id}/${currentLoanKey}`).update({
            amountPaid: newAmountPaid,
            remainingBalance: Math.round(newRemainingBalance * 100) / 100,
            paymentsMade: (currentLoanData.paymentsMade || 0) + 1
          })
        ]);
        
        console.log('✅ Loan updated with new balance');
      }
    } else {
      console.log('💳 Processing as NON-LOAN PAYMENT');
      // Non-loan payment: All goes to member balance
      memberBalanceAllocation = paymentAmount;
      console.log(`   All payment to member balance: ${formatCurrency(memberBalanceAllocation)}`);
    }

    // 8. Update Member Balance and Investment
    console.log('👤 Step 9: Updating member balance and investment...');
    const newMemberBalance = Math.ceil((memberBalance + memberBalanceAllocation) * 100) / 100;
    const newMemberInvestment = Math.ceil((memberInvestment + memberInvestmentAllocation) * 100) / 100;
    
    console.log('📊 Member update:', {
      oldBalance: formatCurrency(memberBalance),
      addedToBalance: formatCurrency(memberBalanceAllocation),
      newBalance: formatCurrency(newMemberBalance),
      oldInvestment: formatCurrency(memberInvestment),
      addedToInvestment: formatCurrency(memberInvestmentAllocation),
      newInvestment: formatCurrency(newMemberInvestment)
    });
    
    await memberRef.update({ 
      balance: newMemberBalance,
      investment: newMemberInvestment
    });

    // 9. Update Funds
    console.log('🏦 Step 10: Updating Funds...');
    const newFundsAmount = Math.ceil((currentFunds + fundsAllocation) * 100) / 100;
    
    console.log('📊 Funds update:', {
      oldFunds: formatCurrency(currentFunds),
      addedToFunds: formatCurrency(fundsAllocation),
      newFunds: formatCurrency(newFundsAmount)
    });
    
    await fundsRef.set(newFundsAmount);

    // Record funds history
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
    await fundsHistoryRef.set(newFundsAmount);

    // 10. Update Savings with penalty
    if (penaltyPaid > 0) {
      console.log('💰 Step 11: Adding penalty to Savings...');
      const newSavingsAmount = Math.ceil((currentSavings + penaltyPaid) * 100) / 100;
      await savingsRef.set(newSavingsAmount);

      // Update daily SavingsHistory
      const savingsDayRef = database.ref(`Settings/SavingsHistory/${dateKey}`);
      const savingsDaySnap = await savingsDayRef.once('value');
      const currentDaySavings = parseFloat(savingsDaySnap.val()) || 0;
      const newDaySavings = Math.ceil((currentDaySavings + penaltyPaid) * 100) / 100;
      await savingsDayRef.set(newDaySavings);
      
      console.log(`✅ Penalty ${formatCurrency(penaltyPaid)} added to Savings`);
    }

    // 11. Update Yields with interest
    if (interestPaid > 0) {
      console.log('📈 Step 12: Adding interest to Yields...');
      const newYieldsAmount = Math.ceil((currentYields + interestPaid) * 100) / 100;
      await yieldsRef.set(newYieldsAmount);

      // Update daily YieldsHistory
      const yieldsDayRef = database.ref(`Settings/YieldsHistory/${dateKey}`);
      const yieldsDaySnap = await yieldsDayRef.once('value');
      const currentDayYields = parseFloat(yieldsDaySnap.val()) || 0;
      const newDayYields = Math.ceil((currentDayYields + interestPaid) * 100) / 100;
      await yieldsDayRef.set(newDayYields);
      
      console.log(`✅ Interest ${formatCurrency(interestPaid)} added to Yields`);
    }

    // 12. Write approved payment record
    console.log('📝 Step 13: Creating approved payment record...');
    const approvedData = {
      ...paymentData,
      transactionId: newTransactionId,
      originalTransactionId: originalTransactionId,
      selectedLoanId: payment.selectedLoanId,
      dateApproved: formatDate(now),
      timeApproved: formatTime(now),
      timestamp: now.getTime(),
      status: 'approved',
      
      // Financial breakdown
      penaltyPaid,
      interestPaid,
      principalPaid,
      excessPayment,
      fundsAllocation,           // Money that stays in Funds
      memberBalanceAllocation,   // Money credited to member balance
      memberInvestmentAllocation, // Money added to member investment
      
      // Original loan tracking
      originalMemberContribution,
      originalFundsContribution,
      isLoanPayment,
      appliedToLoan: currentLoanKey,
      
      // Final balances
      finalMemberBalance: newMemberBalance,
      finalMemberInvestment: newMemberInvestment,
      finalFundsBalance: newFundsAmount,
      finalSavingsBalance: Math.ceil((currentSavings + penaltyPaid) * 100) / 100,
      finalYieldsBalance: Math.ceil((currentYields + interestPaid) * 100) / 100,
      
      // Member info
      id: id,
      email: paymentData.email || memberData.email,
      firstName: paymentData.firstName || memberData.firstName,
      lastName: paymentData.lastName || memberData.lastName
    };

    await approvedRef.set(approvedData);
    await transactionRef.set(approvedData);
    await paymentRef.remove();

    console.log('✅ Payment approval completed successfully!');
    console.log('='.repeat(60));
    console.log('📊 FINAL PAYMENT ALLOCATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`💰 Payment Amount: ${formatCurrency(paymentAmount)}`);
    console.log(`   ├── Interest to Yields: ${formatCurrency(interestPaid)}`);
    console.log(`   ├── Penalty to Savings: ${formatCurrency(penaltyPaid)}`);
    console.log(`   ├── Principal repayment: ${formatCurrency(principalPaid)}`);
    console.log(`   └── Excess payment: ${formatCurrency(excessPayment)}`);
    console.log('');
    console.log(`🏦 Funds Allocation: ${formatCurrency(fundsAllocation)}`);
    console.log(`   ├── Principal stays in Funds: ${formatCurrency(principalPaid)}`);
    console.log(`   └── Excess also stays in Funds: ${formatCurrency(excessPayment)}`);
    console.log('');
    console.log(`👤 Member Allocation: ${formatCurrency(memberBalanceAllocation + memberInvestmentAllocation)}`);
    console.log(`   ├── To Balance: ${formatCurrency(memberBalanceAllocation)}`);
    console.log(`   └── To Investment: ${formatCurrency(memberInvestmentAllocation)}`);
    console.log('');
    console.log(`📈 FINAL BALANCES:`);
    console.log(`   Member Balance: ${formatCurrency(memberBalance)} → ${formatCurrency(newMemberBalance)}`);
    console.log(`   Member Investment: ${formatCurrency(memberInvestment)} → ${formatCurrency(newMemberInvestment)}`);
    console.log(`   Funds: ${formatCurrency(currentFunds)} → ${formatCurrency(newFundsAmount)}`);
    console.log(`   Savings: ${formatCurrency(currentSavings)} → ${formatCurrency(currentSavings + penaltyPaid)}`);
    console.log(`   Yields: ${formatCurrency(currentYields)} → ${formatCurrency(currentYields + interestPaid)}`);
    console.log('='.repeat(60));

    return { success: true, transactionId: newTransactionId, approvedData };

  } catch (err) {
    console.error('❌ CRITICAL ERROR in payment approval:', {
      error: err.message,
      stack: err.stack,
      paymentData: payment,
      memberId: payment?.id
    });
    throw new Error(`Failed to approve payment: ${err.message}`);
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
  // Show loading spinner and hide success modal
  setIsProcessing(true);
  setSuccessMessageModalVisible(false);

  try {
    // Finalize DB changes
    if (pendingApiCall) {
      if (pendingApiCall.type === 'approve') {
        await processDatabaseApprove(pendingApiCall.data);
      } else if (pendingApiCall.type === 'reject') {
        await processDatabaseReject(pendingApiCall.data, pendingApiCall.data.rejectionReason || 'Rejected by admin');
      }
    }
  } catch (err) {
    console.error('Finalize DB on OK error:', err);
    // Optionally show error modal here if needed
  }

  // Trigger background email after DB success; do not block UI
  try {
    if (pendingApiCall) {
      if (pendingApiCall.type === 'approve') {
        callApiApprove(pendingApiCall.data);
      } else if (pendingApiCall.type === 'reject') {
        callApiReject(pendingApiCall.data);
      }
    }
  } catch (error) {
    console.error('Error calling API:', error);
  } finally {
    setPendingApiCall(null);
  }

  // Close modal and clean state
  closeModal();
  setSelectedPayment(null);
  setCurrentAction(null);

  // Finally refresh
  refreshData();

  // Hide loading spinner
  setIsProcessing(false);
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
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Payment Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Mode of Payment</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
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
                        Mode of Payment:
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
      <p style={styles.modalText}>Are you sure you want to reject this payment?</p>
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
              onClick={closeModal}
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
        {currentAction === 'approve' ? 'Approving payment...' : 'Rejecting payment...'}
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
