import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApprovePayments, RejectPayments } from '../../../../../Server/api';
import { FaCheckCircle, FaTimes, FaExclamationCircle, FaImage, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
  },
  loadingView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  tableContainer: {
    borderRadius: '8px',
    overflow: 'auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '800px'
  },
  tableHeader: {
    backgroundColor: '#2D5783',
    color: '#fff',
    height: '50px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  tableHeaderCell: {
    whiteSpace: 'nowrap'
  },
  tableRow: {
    height: '50px',
    '&:nth-child(even)': {
      backgroundColor: '#f5f5f5'
    },
    '&:nth-child(odd)': {
      backgroundColor: '#ddd'
    }
  },
  tableCell: {
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #ddd',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusApproved: {
    color: 'green'
  },
  statusRejected: {
    color: 'red'
  },
  noDataMessage: {
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '16px',
    color: 'gray'
  },
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
    zIndex: 1000
  },
  modalCard: {
    width: '40%',
    maxWidth: '900px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '80vh',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalCardSingleColumn: {
    width: '40%',
    maxWidth: '600px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  modalCardSmall: {
    width: '250px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  modalContent: {
    paddingBottom: '12px',
    overflowY: 'auto',
    flex: 1
  },
  columns: {
    display: 'flex',
    flexDirection: 'row',
    gap: '30px'
  },
  leftColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#2D5783',
    textAlign: 'center'
  },
  modalDetailText: {
    fontSize: '13px',
    marginBottom: '6px',
    color: '#333',
    wordBreak: 'break-word',
    lineHeight: '1.3'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    marginBottom: '12px',
    gap: '10px'
  },
  imageBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  imageLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    width: '100%',
    textAlign: 'left',
    marginLeft: 0,
    paddingLeft: 0
  },
  imageThumbnail: {
    width: '90%',
    height: '120px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    objectFit: 'cover',
    cursor: 'pointer',
    outline: 'none',
    '&:focus': {
      outline: 'none'
    }
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'grey',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px',
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  },
  bottomButtons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '16px',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eee'
  },
  actionButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    minWidth: '100px',
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#3e8e41'
    }
  },
  rejectButton: {
    backgroundColor: '#f44336',
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: '0.7'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    color: '#333',
    lineHeight: '1.4'
  },
  confirmIcon: {
    marginBottom: '12px',
    fontSize: '32px'
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#2D5783',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  viewText: {
    color: '#2D5783',
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
    '&:hover': {
      color: '#1a3d66'
    },
    outline: 'none',
    '&:focus': {
      outline: 'none'
    }
  },
  modalHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px'
  },
  compactField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '8px'
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: '13px',
    minWidth: '100px'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#333',
    fontSize: '13px'
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
    zIndex: 2000
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
    borderRadius: '4px'
  },
  imageViewerLabel: {
    color: 'white',
    fontSize: '18px',
    marginTop: '16px',
    textAlign: 'center'
  },
  imageViewerClose: {
    position: 'absolute',
    top: '-40px',
    right: '0',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    '&:focus': {
      outline: 'none'
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
    borderRadius: '8px',
    padding: '20px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  rejectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#2D5783',
    textAlign: 'center'
  },
  reasonOption: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  reasonRadio: {
    marginRight: '10px'
  },
  reasonText: {
    flex: 1
  },
  customReasonInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginTop: '8px'
  },
  rejectionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
    gap: '10px'
  },
  cancelButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  confirmRejectButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#f44336',
    color: 'white',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  actionText: {
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#2D5783',
    textDecoration: 'none',
    margin: '0 5px',
    transition: 'color 0.2s ease, text-decoration 0.2s ease',
    outline: 'none'
  },
  approveHover: {
    color: '#4CAF50',
    textDecoration: 'underline'
  },
  rejectHover: {
    color: '#f44336',
    textDecoration: 'underline'
  },
  noDocumentsMessage: {
    textAlign: 'center',
    margin: '20px 0',
    color: '#666',
    fontStyle: 'italic'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2D5783',
    margin: '12px 0 8px 0',
    paddingBottom: '4px',
    borderBottom: '1px solid #eee'
  }
};

const rejectionReasons = [
  "Invalid proof of payment",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other (please specify)"
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
  const [hoverStates, setHoverStates] = useState({});

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

  const handleHover = (transactionId, type, isHovering) => {
    setHoverStates(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [type]: isHovering ? styles[`${type}Hover`] : {}
      }
    }));
  };

  const openModal = (payment) => {
    setSelectedPayment(payment);
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
    await processAction(selectedPayment, 'approve');
  };

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    if (reason !== "Other (please specify)") {
      setCustomReason('');
    }
  };

  const confirmRejection = () => {
    if (!selectedReason) {
      setErrorMessage('Please select a rejection reason');
      setErrorModalVisible(true);
      return;
    }

    if (selectedReason === "Other (please specify)" && !customReason.trim()) {
      setErrorMessage('Please specify the rejection reason');
      setErrorModalVisible(true);
      return;
    }

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedPayment, 'reject', selectedReason === "Other (please specify)" ? customReason : selectedReason);
  };

  const processAction = async (payment, action, rejectionReason = '') => {
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        await processDatabaseApprove(payment);
        setSuccessMessage('Payment approved successfully!');
        
        setSelectedPayment(prev => ({
          ...prev,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date()),
          status: 'approved'
        }));

        callApiApprove({
          ...payment,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        }).catch(console.error);
      } else {
        await processDatabaseReject(payment, rejectionReason);
        setSuccessMessage('Payment rejected successfully!');
        
        setSelectedPayment(prev => ({
          ...prev,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason,
          status: 'rejected'
        }));

        callApiReject({
          ...payment,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason
        }).catch(console.error);
      }
      
      setSuccessMessageModalVisible(true);
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

      // 2. Find current loans
      const memberLoansRef = database.ref(`Loans/CurrentLoans/${id}`);
      const memberLoansSnap = await memberLoansRef.once('value');
      
      let currentLoanData = null;
      let currentLoanKey = null;
      let isLoanPayment = false;
      let interestAmount = 0;
      let loanAmount = 0;
      
      if (memberLoansSnap.exists()) {
        memberLoansSnap.forEach((loanSnap) => {
          if (!currentLoanData) {
            currentLoanData = loanSnap.val();
            currentLoanKey = loanSnap.key;
            isLoanPayment = true;
            interestAmount = parseFloat(currentLoanData.interest) || 0;
            loanAmount = parseFloat(currentLoanData.loanAmount) || 0;
          }
        });
      }

      // Database references
      const paymentRef = database.ref(`Payments/PaymentApplications/${id}/${transactionId}`);
      const approvedRef = database.ref(`Payments/ApprovedPayments/${id}/${transactionId}`);
      const transactionRef = database.ref(`Transactions/Payments/${id}/${transactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      const savingsRef = database.ref('Settings/Savings');
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      
      // Fetch data
      const [paymentSnap, fundsSnap, savingsSnap] = await Promise.all([
        paymentRef.once('value'),
        fundsRef.once('value'),
        savingsRef.once('value')
      ]);

      if (!paymentSnap.exists()) throw new Error('Payment data not found');

      const paymentData = paymentSnap.val();
      const paymentAmount = parseFloat(amountToBePaid) || 0;
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const currentSavings = parseFloat(savingsSnap.val()) || 0;
      const memberBalance = parseFloat(memberData.balance || 0);

      // Payment calculations
      let principalAmount = paymentAmount;
      let excessPayment = 0;
      let newMemberBalance = memberBalance;

      if (isLoanPayment && currentLoanData) {
        // Calculate principal (payment minus interest)
        principalAmount = Math.max(0, paymentAmount - interestAmount);
        
        // Calculate remaining loan after this payment
        let remainingLoan = loanAmount - principalAmount;
        
        // Handle overpayment (payment exceeds remaining loan + interest)
        if (remainingLoan <= 0) {
          excessPayment = Math.abs(remainingLoan);
          principalAmount = loanAmount;
          
          // Remove the loan since it's fully paid
          await memberLoansRef.child(currentLoanKey).remove();
        } else {
          // For partial payments, update the loan terms
          const paymentsMade = (currentLoanData.paymentsMade || 0) + 1;
          const remainingTerm = Math.max(1, currentLoanData.term - paymentsMade);
          const newMonthlyPayment = remainingLoan / remainingTerm;
          
          await memberLoansRef.child(currentLoanKey).update({
            loanAmount: remainingLoan,
            monthlyPayment: newMonthlyPayment,
            totalMonthlyPayment: newMonthlyPayment + interestAmount,
            dueDate: formatDate(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)), // 30 days later
            paymentsMade: paymentsMade
          });
        }

        // Update member balance (principal + excess)
        newMemberBalance = memberBalance + principalAmount + excessPayment;
      }

      // Update all databases
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Only update savings if there's interest
      if (interestAmount > 0) {
        const newSavingsTotal = currentSavings + interestAmount;
        
        // Update savings total
        await savingsRef.set(newSavingsTotal);
        
        // Update savings history
        const savingsHistoryUpdate = {};
        savingsHistoryUpdate[dateKey] = interestAmount;
        
        await savingsHistoryRef.update(savingsHistoryUpdate);
      }

      // Update funds and member balance
      await fundsRef.set(currentFunds + principalAmount);
      await memberRef.update({ balance: newMemberBalance });

      // Create payment record
      const approvedData = {
        ...paymentData,
        dateApproved: formatDate(now),
        timeApproved: formatTime(now),
        status: 'approved',
        interestPaid: interestAmount,
        principalPaid: principalAmount,
        excessPayment: excessPayment,
        isLoanPayment: isLoanPayment,
        appliedToLoan: currentLoanKey
      };

      // Finalize operations
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
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);

      const paymentRef = database.ref(`Payments/PaymentApplications/${id}/${transactionId}`);
      const rejectedRef = database.ref(`Payments/RejectedPayments/${id}/${transactionId}`);
      const transactionRef = database.ref(`Transactions/Payments/${id}/${transactionId}`);

      const paymentSnap = await paymentRef.once('value');
      if (!paymentSnap.exists()) {
        throw new Error('Payment data not found.');
      }

      const rejectedPayment = { 
        ...paymentSnap.val(), 
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedPayment);
      await transactionRef.set(rejectedPayment);
      await paymentRef.remove();

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

      // Check if this is a loan payment
      const loanRef = database.ref(`Loans/CurrentLoans/${payment.id}/${payment.transactionId}`);
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

  const handleSuccessOk = () => {
    setSuccessMessageModalVisible(false);
    closeModal();
    setSelectedPayment(null);
    setCurrentAction(null);
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

  const hasDocuments = (payment) => {
    return payment.proofOfPaymentUrl;
  };

  if (!payments.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No payment applications available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Payment Method</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{`${item.firstName} ${item.lastName}`}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBePaid)}</td>
                <td style={styles.tableCell}>{item.paymentOption}</td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={{
                  ...styles.tableCell,
                  ...(item.status === 'approved' ? styles.statusApproved : {}),
                  ...(item.status === 'rejected' ? styles.statusRejected : {})
                }}>
                  {item.status || 'pending'}
                </td>
                <td style={styles.tableCell}>
                  <span 
                    style={styles.viewText} 
                    onClick={() => openModal(item)}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    View
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalVisible && selectedPayment && (
        <div style={styles.centeredModal}>
          <div style={hasDocuments(selectedPayment) ? styles.modalCard : styles.modalCardSingleColumn}>
            <button 
              style={styles.closeButton} 
              onClick={closeModal}
              aria-label="Close modal"
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <FaTimes />
            </button>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Payment Application Details</h2>
            </div>
            <div style={styles.modalContent}>
              {hasDocuments(selectedPayment) ? (
                <div style={styles.columns}>
                  <div style={styles.leftColumn}>
                    <div style={styles.sectionTitle}>Member Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Member ID:</span>
                      <span style={styles.fieldValue}>{selectedPayment.id || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Name:</span>
                      <span style={styles.fieldValue}>{`${selectedPayment.firstName || ''} ${selectedPayment.lastName || ''}`}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Email:</span>
                      <span style={styles.fieldValue}>{selectedPayment.email || 'N/A'}</span>
                    </div>

                    <div style={styles.sectionTitle}>Payment Details</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Transaction ID:</span>
                      <span style={styles.fieldValue}>{selectedPayment.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Amount:</span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedPayment.amountToBePaid)}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Payment Method:</span>
                      <span style={styles.fieldValue}>{selectedPayment.paymentOption || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date Applied:</span>
                      <span style={styles.fieldValue}>{selectedPayment.dateApplied || 'N/A'}</span>
                    </div>

                    {selectedPayment.dateApproved && (
                      <>
                        <div style={styles.sectionTitle}>Approval Information</div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Date Approved:</span>
                          <span style={styles.fieldValue}>{selectedPayment.dateApproved}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Time Approved:</span>
                          <span style={styles.fieldValue}>{selectedPayment.timeApproved}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Interest Paid:</span>
                          <span style={styles.fieldValue}>{formatCurrency(selectedPayment.interestPaid || 0)}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Principal Paid:</span>
                          <span style={styles.fieldValue}>{formatCurrency(selectedPayment.principalPaid || selectedPayment.amountToBePaid)}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Excess Payment:</span>
                          <span style={styles.fieldValue}>{formatCurrency(selectedPayment.excessPayment || 0)}</span>
                        </div>
                      </>
                    )}

                    {selectedPayment.dateRejected && (
                      <>
                        <div style={styles.sectionTitle}>Rejection Information</div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Date Rejected:</span>
                          <span style={styles.fieldValue}>{selectedPayment.dateRejected}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Time Rejected:</span>
                          <span style={styles.fieldValue}>{selectedPayment.timeRejected}</span>
                        </div>
                        <div style={styles.compactField}>
                          <span style={styles.fieldLabel}>Rejection Reason:</span>
                          <span style={styles.fieldValue}>{selectedPayment.rejectionReason || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={styles.rightColumn}>
                    <div style={styles.sectionTitle}>Proof of Payment</div>
                    <div style={styles.imageGrid}>
                      <div style={styles.imageBlock}>
                        <span style={styles.imageLabel}>Proof of Payment</span>
                        <img
                          src={selectedPayment.proofOfPaymentUrl}
                          alt="Proof of Payment"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedPayment.proofOfPaymentUrl, 'Proof of Payment', 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedPayment.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedPayment.firstName || ''} ${selectedPayment.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedPayment.email || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Payment Details</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedPayment.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedPayment.amountToBePaid)}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Payment Method:</span>
                    <span style={styles.fieldValue}>{selectedPayment.paymentOption || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedPayment.dateApplied || 'N/A'}</span>
                  </div>

                  {selectedPayment.dateApproved && (
                    <>
                      <div style={styles.sectionTitle}>Approval Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedPayment.dateApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedPayment.timeApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Interest Paid:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.interestPaid || 0)}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Principal Paid:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.principalPaid || selectedPayment.amountToBePaid)}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Excess Payment:</span>
                        <span style={styles.fieldValue}>{formatCurrency(selectedPayment.excessPayment || 0)}</span>
                      </div>
                    </>
                  )}

                  {selectedPayment.dateRejected && (
                    <>
                      <div style={styles.sectionTitle}>Rejection Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedPayment.dateRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedPayment.timeRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedPayment.rejectionReason || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {selectedPayment?.status !== 'approved' && selectedPayment?.status !== 'rejected' && (
              <div style={styles.bottomButtons}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={handleApproveClick}
                  disabled={isProcessing}
                  onFocus={(e) => e.target.style.outline = 'none'}
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
                  onFocus={(e) => e.target.style.outline = 'none'}
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
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to approve this payment?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={confirmApprove}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
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
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to reject this payment?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={confirmRejectFinal}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
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
                <input
                  type="radio"
                  name="rejectionReason"
                  checked={selectedReason === reason}
                  onChange={() => handleReasonSelect(reason)}
                  style={styles.reasonRadio}
                />
                <span style={styles.reasonText}>{reason}</span>
                {reason === "Other (please specify)" && selectedReason === reason && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify reason"
                    style={styles.customReasonInput}
                  />
                )}
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
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle 
              style={{ ...styles.confirmIcon, color: '#f44336' }} 
            />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={() => setErrorModalVisible(false)}
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div style={styles.centeredModal}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {/* Success Modal */}
      {successMessageModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            {currentAction === 'approve' ? (
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
            ) : (
              <FaTimes style={{ ...styles.confirmIcon, color: '#f44336' }} />
            )}
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={handleSuccessOk}
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              OK
            </button>
          </div>
        </div>
      )}

  {/* Image Viewer Modal */}
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
              aria-label="Close image viewer"
              onFocus={(e) => e.target.style.outline = 'none'}
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

export default PaymentApplications;