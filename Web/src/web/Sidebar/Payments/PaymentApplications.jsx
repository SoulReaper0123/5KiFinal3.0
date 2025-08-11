import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApprovePayments, RejectPayments } from '../../../../../Server/api';
import { FaCheckCircle, FaTimes, FaExclamationCircle, FaImage, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
    color: '#333',
    lineHeight: '1.4'
  },
  confirmIcon: {
    marginBottom: '12px',
    fontSize: '32px'
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
  imageViewerNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    '&:hover': {
      color: '#2D5783'
    },
    '&:focus': {
      outline: 'none'
    }
  },
  prevButton: {
    left: '50px'
  },
  nextButton: { 
    right: '50px'
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
}
};

const rejectionReasons = [
  "Invalid proof of payment",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other (please specify)"
];

const PaymentApplications = ({ payments, currentPage, totalPages, onPageChange, refreshData }) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
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
  
  const handleHover = (transactionId, type, isHovering) => {
  setHoverStates(prev => ({
    ...prev,
    [transactionId]: {
      ...prev[transactionId],
      [type]: isHovering ? styles[`${type}Hover`] : {}
    }
  }));
};

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

  const handleApproveClick = (payment) => {
    setSelectedPayment(payment);
    setShowApproveConfirmation(true);
  };

  const handleRejectClick = (payment) => {
    setSelectedPayment(payment);
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
      } else {
        await processDatabaseReject(payment, rejectionReason);
        setSuccessMessage('Payment rejected successfully!');
      }

      setSuccessMessageModalVisible(true);
      
      const now = new Date();
      setSelectedPayment(prev => ({
        ...prev,
        ...(action === 'approve' ? {
          dateApproved: formatDate(now),
          timeApproved: formatTime(now),
          status: 'approved'
        } : {
          dateRejected: formatDate(now),
          timeRejected: formatTime(now),
          status: 'rejected',
          rejectionReason
        })
      }));

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

    return { 
      success: true,
      principalPaid: principalAmount,
      interestPaid: interestAmount,
      excessPayment: excessPayment 
    };

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

const handleSuccessOk = async () => {
  setSuccessMessageModalVisible(false);
  setSelectedPayment(null);
  setCurrentAction(null);
  
  try {
    // Call API after user clicks OK
    if (currentAction === 'approve') {
      await callApiApprove(selectedPayment);
    } else {
      await callApiReject(selectedPayment);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
  
  refreshData();
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
      // You might want to show a warning to the admin that email failed
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

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (url) {
      images.push({ 
        url, 
        label: 'Proof of Payment' 
      });
    }

    setAvailableImages(images);
    setCurrentImage({ url, label: 'Proof of Payment' });
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Payment Method</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Proof</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBePaid)}</td>
                <td style={styles.tableCell}>{item.paymentOption}</td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={styles.tableCell}>
                  <span 
                    style={styles.viewText}
                    onClick={() => openImageViewer(item.proofOfPaymentUrl, 'Proof of Payment', 0)}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    <FaImage /> View
                  </span>
                </td>
<td style={styles.tableCell}>
  <span 
    style={{
      ...styles.actionText,
      ...(hoverStates[item.transactionId]?.approve || {})
    }}
    onClick={() => handleApproveClick(item)}
    onMouseEnter={() => handleHover(item.transactionId, 'approve', true)}
    onMouseLeave={() => handleHover(item.transactionId, 'approve', false)}
    onFocus={(e) => e.target.style.outline = 'none'}
  >
    Approve
  </span>
  <span style={{color: '#aaa', margin: '0 10px'}}> | </span>
  <span 
    style={{
      ...styles.actionText,
      ...(hoverStates[item.transactionId]?.reject || {})
    }}
    onClick={() => handleRejectClick(item)}
    onMouseEnter={() => handleHover(item.transactionId, 'reject', true)}
    onMouseLeave={() => handleHover(item.transactionId, 'reject', false)}
    onFocus={(e) => e.target.style.outline = 'none'}
  >
    Reject
  </span>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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