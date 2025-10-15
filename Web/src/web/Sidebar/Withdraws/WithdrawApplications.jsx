import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveWithdraws, RejectWithdraws } from '../../../../../Server/api';
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
  FaBan,
  FaBuilding,
  FaUniversity
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
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center'
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
  "Invalid proof of withdrawal",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other"
];

const WithdrawApplications = ({ 
  withdraws, 
  currentPage, 
  totalPages, 
  onPageChange, 
  refreshData 
}) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
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

  const openModal = (withdraw) => {
    setSelectedWithdraw(withdraw);
    setModalVisible(true);
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
    await processAction(selectedWithdraw, 'approve');
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
    await processAction(selectedWithdraw, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

  const processAction = async (withdraw, action, rejectionReason = '') => {
    // Defer DB writes and refresh to success modal OK
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        setSuccessMessage('Withdrawal approved successfully!');

        const approveData = {
          ...withdraw,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        };

        // Local preview only; do not touch DB yet
        setSelectedWithdraw(prev => ({
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
        setSuccessMessage('Withdrawal rejected successfully!');

        const rejectData = {
          ...withdraw,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason
        };

        // Local preview only; do not touch DB yet
        setSelectedWithdraw(prev => ({
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

  const processDatabaseApprove = async (withdraw) => {
    try {
      const { id, transactionId, amountWithdrawn } = withdraw;
      
      // 1. Verify member details
      const memberRef = database.ref(`Members/${id}`);
      const memberSnap = await memberRef.once('value');
      const memberData = memberSnap.val();

      if (!memberData || 
          memberData.email !== withdraw.email ||
          memberData.firstName !== withdraw.firstName || 
          memberData.lastName !== withdraw.lastName) {
        throw new Error('Member details do not match our records');
      }

      // Check if member has sufficient balance
      const currentBalance = parseFloat(memberData.balance || 0);
      const withdrawAmount = parseFloat(amountWithdrawn);
      
      if (currentBalance < withdrawAmount) {
        throw new Error('Member has insufficient balance for this withdrawal');
      }

      // Generate a new transaction ID for approved/transactions records
      const originalTransactionId = transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      // Database references
      const withdrawRef = database.ref(`Withdrawals/WithdrawalApplications/${id}/${originalTransactionId}`);
      const approvedRef = database.ref(`Withdrawals/ApprovedWithdrawals/${id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Withdrawals/${id}/${newTransactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      
      // Fetch data
      const [withdrawSnap, fundsSnap] = await Promise.all([
        withdrawRef.once('value'),
        fundsRef.once('value')
      ]);

      if (!withdrawSnap.exists()) throw new Error('Withdrawal data not found');

      const withdrawData = withdrawSnap.val();
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      // Update all databases
      const now = new Date();
      
      // Update funds and member balance
      const newBalance = currentBalance - withdrawAmount;
      const newFunds = currentFunds - withdrawAmount;
      
      await fundsRef.set(newFunds);
      
      // Log to FundsHistory for dashboard chart (keyed by YYYY-MM-DD)
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
      await fundsHistoryRef.set(newFunds);
      
      await memberRef.update({ balance: newBalance });

      // Create withdrawal record
      const approvedData = {
        ...withdrawData,
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateApproved: formatDate(now),
        timeApproved: formatTime(now),
        timestamp: now.getTime(),
        status: 'approved'
      };

      // Finalize operations
      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await withdrawRef.remove();

      return newTransactionId;

    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve withdrawal');
    }
  };

  const processDatabaseReject = async (withdraw, rejectionReason) => {
    try {
      const { id, transactionId } = withdraw;
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);

      // Generate a new transaction ID for rejected/transactions records
      const originalTransactionId = transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const withdrawRef = database.ref(`Withdrawals/WithdrawalApplications/${id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Withdrawals/RejectedWithdrawals/${id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Withdrawals/${id}/${newTransactionId}`);

      const withdrawSnap = await withdrawRef.once('value');
      if (!withdrawSnap.exists()) {
        throw new Error('Withdrawal data not found.');
      }

      const rejectedWithdraw = { 
        ...withdrawSnap.val(), 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        timestamp: now.getTime(),
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedWithdraw);
      await transactionRef.set(rejectedWithdraw);
      await withdrawRef.remove();

      return newTransactionId;

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject withdrawal');
    }
  };

  const callApiApprove = async (withdraw) => {
    try {
      const now = new Date();
      const memberSnap = await database.ref(`Members/${withdraw.id}`).once('value');
      const memberData = memberSnap.val();

      const response = await ApproveWithdraws({
        memberId: withdraw.id,
        transactionId: withdraw.transactionId,
        amount: withdraw.amountWithdrawn,
        dateApproved: withdraw.dateApproved || formatDate(now),
        timeApproved: withdraw.timeApproved || formatTime(now),
        email: withdraw.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        status: 'approved'
      });
      
      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
      // Don't throw error - this runs in background
    }
  };

  const callApiReject = async (withdraw) => {
    try {
      const now = new Date();
      const memberSnap = await database.ref(`Members/${withdraw.id}`).once('value');
      const memberData = memberSnap.val();

      let rejectionMessage = '';
      
      // Custom rejection messages based on reason
      if (withdraw.rejectionReason.includes('Invalid proof')) {
        rejectionMessage = `We regret to inform you that your withdrawal of ₱${withdraw.amountWithdrawn} submitted on ${withdraw.dateApplied} could not be processed because the proof of withdrawal you provided could not be validated. Please ensure you upload a clear, valid proof when resubmitting.`;
      } 
      else if (withdraw.rejectionReason.includes('Incorrect amount')) {
        rejectionMessage = `We regret to inform you that your withdrawal of ₱${withdraw.amountWithdrawn} submitted on ${withdraw.dateApplied} could not be processed because the amount does not match our records. Please verify the correct amount and resubmit your request.`;
      }
      else if (withdraw.rejectionReason.includes('Unclear image')) {
        rejectionMessage = `We regret to inform you that your withdrawal of ₱${withdraw.amountWithdrawn} submitted on ${withdraw.dateApplied} could not be processed because the image of your proof was unclear or unreadable. Please ensure your proof is clearly visible when resubmitting.`;
      }
      else {
        rejectionMessage = `We regret to inform you that your withdrawal of ₱${withdraw.amountWithdrawn} submitted on ${withdraw.dateApplied} could not be processed.${withdraw.rejectionReason ? `\n\nReason: ${withdraw.rejectionReason}` : ''}`;
      }

      const response = await RejectWithdraws({
        memberId: withdraw.id,
        transactionId: withdraw.transactionId,
        amount: withdraw.amountWithdrawn,
        dateRejected: withdraw.dateRejected || formatDate(now),
        timeRejected: withdraw.timeRejected || formatTime(now),
        email: withdraw.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        status: 'rejected',
        rejectionReason: withdraw.rejectionReason || 'Rejected by admin',
        rejectionMessage: rejectionMessage
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email');
      }
    } catch (err) {
      console.error('API reject error:', err);
      // Don't throw error - this runs in background
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
    setSelectedWithdraw(null);
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

  if (!withdraws.length) return (
    <div style={styles.noDataContainer}>
      <FaMoneyBillWave style={styles.noDataIcon} />
      <div>No withdrawal applications available</div>
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
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Withdrawal Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Disbursement</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdraws.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>{formatCurrency(item.amountWithdrawn)}</td>
                    <td style={styles.tableCell}>{item.withdrawOption}</td>
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

      {/* Withdrawal Details Modal */}
      {modalVisible && selectedWithdraw && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaMoneyBillWave />
                Withdrawal Application Details
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
                {/* Left Column - Member & Withdrawal Information */}
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
                      <span style={styles.fieldValue}>{selectedWithdraw.id || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Name:
                      </span>
                      <span style={styles.fieldValue}>{`${selectedWithdraw.firstName || ''} ${selectedWithdraw.lastName || ''}`}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Withdrawal Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaReceipt />
                        Transaction ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMoneyBillWave />
                        Amount:
                      </span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedWithdraw.amountWithdrawn)}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaBuilding />
                        Bank Name:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.bankName || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Account Name:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.accountName || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUniversity />
                        Account Number:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.accountNumber || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaCalendarAlt />
                        Date Applied:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdraw.dateApplied || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedWithdraw.dateApproved && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCheckCircle />
                        Approval Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.dateApproved}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.timeApproved}</span>
                      </div>
                    </div>
                  )}

                  {selectedWithdraw.dateRejected && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaTimes />
                        Rejection Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.dateRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.timeRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.rejectionReason || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Documents */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Proof of Withdrawal
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedWithdraw.proofOfWithdrawalUrl && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedWithdraw.proofOfWithdrawalUrl, 'Proof of Withdrawal')}
                        >
                          <img
                            src={selectedWithdraw.proofOfWithdrawalUrl}
                            alt="Proof of Withdrawal"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Withdrawal</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedWithdraw.status !== 'approved' && selectedWithdraw.status !== 'rejected' && (
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
            <p style={styles.modalText}>Are you sure you want to approve this withdrawal?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this withdrawal?</p>
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

      {/* Loading Overlay */}
      {isProcessing && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>
              {currentAction === 'approve' ? 'Approving withdrawal...' : 'Rejecting withdrawal...'}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawApplications;