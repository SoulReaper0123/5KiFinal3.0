import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveMembershipWithdrawal, RejectMembershipWithdrawal } from '../../../../../Server/api';
import { 
  FaCheckCircle, 
  FaTimes, 
  FaExclamationCircle, 
  FaSpinner,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaReceipt,
  FaBan,
  FaSignOutAlt
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
    justifyContent: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    width: '40%',
    margin: '0 auto',
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
  },
  withdrawalCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  withdrawalItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  withdrawalLabel: {
    fontSize: '0.875rem',
    color: '#92400e',
    fontWeight: '500'
  },
  withdrawalValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#92400e'
  },
  financialCard: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    border: '1px solid #6ee7b7',
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
    color: '#065f46',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#065f46'
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
  "Invalid reason provided",
  "Member has outstanding balance",
  "Member has active loans",
  "Incomplete information",
  "Other"
];

const PermanentWithdraws = ({ refreshData }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState(null);

useEffect(() => {
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const withdrawalsRef = database.ref('MembershipWithdrawal/PendingWithdrawals');
      const snapshot = await withdrawalsRef.once('value');
      
      if (snapshot.exists()) {
        const withdrawalsData = snapshot.val();
        const withdrawalsList = [];
        
        // Convert the nested structure to an array
        Object.keys(withdrawalsData).forEach(memberId => {
          const withdrawal = withdrawalsData[memberId];
          if (withdrawal && typeof withdrawal === 'object') {
            withdrawalsList.push({
              ...withdrawal,
              memberId,
              id: memberId
            });
          }
        });
        
        setWithdrawals(withdrawalsList);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setErrorMessage('Failed to load withdrawal requests');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  fetchWithdrawals();
}, []); // Remove refreshData from dependencies since it might cause infinite re-renders

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

  const openModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
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
    await processAction(selectedWithdrawal, 'approve');
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
    await processAction(selectedWithdrawal, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

  const processAction = async (withdrawal, action, rejectionReason = '') => {
    // Defer DB writes and refresh to success modal OK
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        setSuccessMessage('Membership withdrawal approved successfully!');

        const approveData = {
          ...withdrawal,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        };

        // Local preview only; do not touch DB yet
        setSelectedWithdrawal(prev => ({
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
        setSuccessMessage('Membership withdrawal rejected successfully!');

        const rejectData = {
          ...withdrawal,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason
        };

        // Local preview only; do not touch DB yet
        setSelectedWithdrawal(prev => ({
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

  const processDatabaseApprove = async (withdrawal) => {
    try {
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const status = 'approved';

      // Generate a new transaction ID for approved/transactions records
      const originalTransactionId = withdrawal.transactionId || withdrawal.memberId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      // Database references
      const approvedRef = database.ref(`MembershipWithdrawal/ApprovedWithdrawals/${withdrawal.memberId}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/MembershipWithdrawals/${withdrawal.memberId}/${newTransactionId}`);
      const memberRef = database.ref(`Members/${withdrawal.memberId}`);
      const pendingRef = database.ref(`MembershipWithdrawal/PendingWithdrawals/${withdrawal.memberId}`);
      const fundsRef = database.ref('Settings/Funds');
      
      // Fetch current funds and member data
      const [fundsSnap, memberSnap] = await Promise.all([
        fundsRef.once('value'),
        memberRef.once('value')
      ]);
      
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const memberData = memberSnap.val() || {};
      const memberBalance = parseFloat(withdrawal.balance) || 0;
      
      // Calculate new funds and new member balance
      const newFunds = currentFunds - memberBalance;
      const newMemberBalance = 0; // Set balance to 0 since they're withdrawing

      // Prepare approved withdrawal data
      const approvedWithdrawal = { 
        ...withdrawal, 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        timestamp: now.getTime(),
        status
      };

      // Execute all database operations
      await Promise.all([
        approvedRef.set(approvedWithdrawal),
        transactionRef.set(approvedWithdrawal),
        fundsRef.set(newFunds),
        memberRef.update({ 
          status: 'inactive',
          balance: newMemberBalance, 
          investment: 0 
        }),
        pendingRef.remove() // Remove from pending after approval
      ]);
      
      // Log to FundsHistory for dashboard chart (keyed by YYYY-MM-DD)
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
      await fundsHistoryRef.set(newFunds);

      return newTransactionId;

    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve membership withdrawal');
    }
  };

  const processDatabaseReject = async (withdrawal, rejectionReason) => {
    try {
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);
      const status = 'rejected';

      const rejectedRef = database.ref(`MembershipWithdrawal/RejectedWithdrawals/${withdrawal.memberId}`);
      const pendingRef = database.ref(`MembershipWithdrawal/PendingWithdrawals/${withdrawal.memberId}`);

      const rejectedWithdrawal = { 
        ...withdrawal, 
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        timestamp: now.getTime(),
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await Promise.all([
        rejectedRef.set(rejectedWithdrawal),
        pendingRef.remove()
      ]);

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject membership withdrawal');
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
        ApproveMembershipWithdrawal(pendingApiCall.data);
      } else if (pendingApiCall.type === 'reject') {
        RejectMembershipWithdrawal(pendingApiCall.data);
      }
    }
  } catch (error) {
    console.error('Error calling API:', error);
  } finally {
    setPendingApiCall(null);
  }

  // Close modal and clean state
  closeModal();
  setSelectedWithdrawal(null);
  setCurrentAction(null);

  // Finally refresh - with error handling
  try {
    if (refreshData && typeof refreshData === 'function') {
      refreshData();
    } else {
      console.warn('refreshData is not available, refetching data locally');
      // Fallback: refetch withdrawals data locally
      const withdrawalsRef = database.ref('MembershipWithdrawal/PendingWithdrawals');
      const snapshot = await withdrawalsRef.once('value');
      
      if (snapshot.exists()) {
        const withdrawalsData = snapshot.val();
        const withdrawalsList = [];
        
        Object.keys(withdrawalsData).forEach(memberId => {
          const withdrawal = withdrawalsData[memberId];
          if (withdrawal && typeof withdrawal === 'object') {
            withdrawalsList.push({
              ...withdrawal,
              memberId,
              id: memberId
            });
          }
        });
        
        setWithdrawals(withdrawalsList);
      } else {
        setWithdrawals([]);
      }
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
  }

  // Hide loading spinner
  setIsProcessing(false);
};

  if (loading) {
    return (
      <div style={styles.noDataContainer}>
        <FaSpinner style={{ ...styles.noDataIcon, animation: 'spin 1s linear infinite' }} />
        <div>Loading withdrawal requests...</div>
      </div>
    );
  }

  if (!withdrawals.length) {
    return (
      <div style={styles.noDataContainer}>
        <FaSignOutAlt style={styles.noDataIcon} />
        <div>No membership withdrawal requests available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Balance</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Reason</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.memberId}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>{formatCurrency(item.balance)}</td>
                <td style={styles.tableCell}>{item.reason}</td>
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
      {modalVisible && selectedWithdrawal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaSignOutAlt />
                Membership Withdrawal Details
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
                      <span style={styles.fieldValue}>{selectedWithdrawal.memberId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Name:
                      </span>
                      <span style={styles.fieldValue}>{`${selectedWithdrawal.firstName || ''} ${selectedWithdrawal.lastName || ''}`}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.email || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMapMarkerAlt />
                        Address:
                      </span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.address || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.withdrawalCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaSignOutAlt />
                      Withdrawal Details
                    </h3>
                    <div style={styles.withdrawalItem}>
                      <span style={styles.withdrawalLabel}>Transaction ID:</span>
                      <span style={styles.withdrawalValue}>{selectedWithdrawal.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.withdrawalItem}>
                      <span style={styles.withdrawalLabel}>Reason:</span>
                      <span style={styles.withdrawalValue}>{selectedWithdrawal.reason || 'N/A'}</span>
                    </div>
                    <div style={styles.withdrawalItem}>
                      <span style={styles.withdrawalLabel}>Date Joined:</span>
                      <span style={styles.withdrawalValue}>{selectedWithdrawal.dateJoined || 'N/A'}</span>
                    </div>
                    <div style={styles.withdrawalItem}>
                      <span style={styles.withdrawalLabel}>Date Submitted:</span>
                      <span style={styles.withdrawalValue}>{selectedWithdrawal.dateSubmitted || 'N/A'}</span>
                    </div>
                    <div style={styles.withdrawalItem}>
                      <span style={styles.withdrawalLabel}>Has Existing Loan:</span>
                      <span style={styles.withdrawalValue}>{selectedWithdrawal.hasExistingLoan ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial Information */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Financial Information
                    </h3>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Current Balance:</span>
                      <span style={styles.financialValue}>
                        {formatCurrency(selectedWithdrawal.balance)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Amount to Withdraw:</span>
                      <span style={styles.financialValue}>
                        {formatCurrency(selectedWithdrawal.balance)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Final Settlement:</span>
                      <span style={styles.financialValue}>
                        {formatCurrency(selectedWithdrawal.balance)}
                      </span>
                    </div>
                  </div>

                  {selectedWithdrawal.dateApproved && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCheckCircle />
                        Approval Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdrawal.dateApproved}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdrawal.timeApproved}</span>
                      </div>
                    </div>
                  )}

                  {selectedWithdrawal.dateRejected && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaTimes />
                        Rejection Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdrawal.dateRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdrawal.timeRejected}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedWithdrawal.rejectionReason || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedWithdrawal.status !== 'approved' && selectedWithdrawal.status !== 'rejected' && (
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
            <p style={styles.modalText}>Are you sure you want to approve this membership withdrawal?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this membership withdrawal?</p>
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
              {currentAction === 'approve' ? 'Approving membership withdrawal...' : 'Rejecting membership withdrawal...'}
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
    </div>
  );
};

export default PermanentWithdraws;