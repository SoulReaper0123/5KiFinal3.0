import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveLoans, RejectLoans } from '../../../../../Server/api';
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
  approveText: {
    color: '#4CAF50'
  },
  rejectText: {
    color: '#f44336'
  }
};

const rejectionReasons = [
  "No deposit transactions made on account",
  "Insufficient funds (below ₱5,000 threshold)",
  "Existing unpaid loan balance",
  "Suspicious activity",
  "Other (please specify)"
];

const ApplyLoans = ({ loans, currentPage, totalPages, onPageChange, refreshData }) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
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

  const handleApproveClick = (loan) => {
    setSelectedLoan(loan);
    setShowApproveConfirmation(true);
  };

  const handleRejectClick = (loan) => {
    setSelectedLoan(loan);
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveConfirmation(false);
    await processAction(selectedLoan, 'approve');
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
    await processAction(selectedLoan, 'reject', selectedReason === "Other (please specify)" ? customReason : selectedReason);
  };

  const processAction = async (loan, action, rejectionReason = '') => {
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      // First perform database operations
      if (action === 'approve') {
        await processDatabaseApprove(loan);
        setSuccessMessage('Loan approved successfully!');
      } else {
        await processDatabaseReject(loan, rejectionReason);
        setSuccessMessage('Loan rejected successfully!');
      }

      // Show success message
      setSuccessMessageModalVisible(true);
      
      // Update local state to reflect changes
      const now = new Date();
      setSelectedLoan(prev => ({
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

const processDatabaseApprove = async (loan) => {
  try {
    const { id, transactionId, term, loanAmount } = loan;

    const loanRef = database.ref(`Loans/LoanApplications/${id}/${transactionId}`);
    const memberRef = database.ref(`Members/${id}/balance`);
    const settingsRef = database.ref('Settings/LoanPercentage');
    
    // First check if member has sufficient balance based on loan percentage
    const [loanSnap, memberSnap, settingsSnap] = await Promise.all([
      loanRef.once('value'),
      memberRef.once('value'),
      settingsRef.once('value')
    ]);

    if (!loanSnap.exists()) {
      throw new Error('Loan data not found.');
    }

    const memberBalance = parseFloat(memberSnap.val()) || 0;
    const loanPercentage = parseFloat(settingsSnap.val());
    let maxLoanAmount;
    
    // If loan percentage is 0, allow 100% of balance
    if (loanPercentage === 0) {
      maxLoanAmount = memberBalance;
    } else {
      // Use the set percentage (default to 80% if not set)
      const percentage = loanPercentage || 80;
      maxLoanAmount = memberBalance * (percentage / 100);
    }

    const requestedAmount = parseFloat(loanAmount);

    if (requestedAmount > maxLoanAmount) {
      const percentageUsed = loanPercentage === 0 ? 100 : (loanPercentage || 80);
      throw new Error(`Loan amount exceeds ${percentageUsed}% of member's balance. Maximum allowed: ${formatCurrency(maxLoanAmount)}`);
    }

    // Continue with approval process
    const approvedRef = database.ref(`Loans/ApprovedLoans/${id}/${transactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${id}/${transactionId}`);
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${transactionId}`);
    const memberLoanRef = database.ref(`Members/${id}/loans/${transactionId}`);
    const fundsRef = database.ref('Settings/Funds');
    const interestRateRef = database.ref(`Settings/InterestRate/${term}`);
    const processingFeeRef = database.ref('Settings/ProcessingFee');

    const [fundsSnap, interestSnap, feeSnap] = await Promise.all([
      fundsRef.once('value'),
      interestRateRef.once('value'),
      processingFeeRef.once('value'),
    ]);

    const loanData = loanSnap.val();
    const interestRate = parseFloat(interestSnap.val()) / 100;
    const amount = parseFloat(loanData.loanAmount);
    const termMonths = parseInt(loanData.term);
    const currentFunds = parseFloat(fundsSnap.val());
    const processingFee = parseFloat(feeSnap.val());

    if (amount > currentFunds) {
      throw new Error('Insufficient funds to approve this loan.');
    }

    const monthlyPayment = amount / termMonths;
    const interest = amount * interestRate;
    const totalMonthlyPayment = monthlyPayment + interest;
    const totalTermPayment = totalMonthlyPayment * term;
    const releaseAmount = amount - processingFee;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30);

    const approvalDate = formatDate(now);
    const approvalTime = formatTime(now);
    const formattedDueDate = formatDate(dueDate);

    const approvedData = {
      ...loanData,
      interestRate: (interestRate * 100),
      interest: interest,
      monthlyPayment: monthlyPayment,
      totalMonthlyPayment: totalMonthlyPayment,
      totalTermPayment: totalTermPayment,
      releaseAmount: releaseAmount,
      processingFee: processingFee,
      dateApproved: approvalDate,
      timeApproved: approvalTime,
      dueDate: formattedDueDate,
      status: 'approved',
      paymentsMade: 0 
    };

    // Execute all database operations in sequence
    await approvedRef.set(approvedData);
    await transactionRef.set(approvedData);
    await currentLoanRef.set(approvedData);
    await memberLoanRef.set(approvedData);
    await fundsRef.set(currentFunds - amount);
    await memberRef.set(memberBalance - amount);

    // Remove from pending loans AFTER all other operations succeed
    // await loanRef.remove();

  } catch (err) {
    console.error('Approval DB error:', err);
    throw new Error(err.message || 'Failed to approve loan');
  }
};

const processDatabaseReject = async (loan, rejectionReason) => {
  try {
    const now = new Date();
    const rejectionDate = formatDate(now);
    const rejectionTime = formatTime(now);
    const status = 'rejected';

    const loanRef = database.ref(`Loans/LoanApplications/${loan.id}/${loan.transactionId}`);
    const rejectedRef = database.ref(`Loans/RejectedLoans/${loan.id}/${loan.transactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${loan.id}/${loan.transactionId}`);

    // First create a copy of the loan data with rejection info
    const rejectedLoan = { 
      ...loan, 
      dateRejected: rejectionDate,
      timeRejected: rejectionTime,
      status,
      rejectionReason: rejectionReason || 'Rejected by admin'
    };

    // Execute all database operations in sequence
    await rejectedRef.set(rejectedLoan);
    await transactionRef.set(rejectedLoan);

    // Remove from pending loans AFTER saving to rejected
    // await loanRef.remove();

  } catch (err) {
    console.error('Rejection DB error:', err);
    throw new Error(err.message || 'Failed to reject loan');
  }
};

  const handleSuccessOk = () => {
    setSuccessMessageModalVisible(false);
    setSelectedLoan(null);
    setCurrentAction(null);
    
    // Call API in background after user clicks OK
    if (currentAction === 'approve') {
      callApiApprove(selectedLoan).catch(console.error);
    } else {
      callApiReject(selectedLoan).catch(console.error);
    }
    
    refreshData();
  };

const callApiApprove = async (loan) => {
  try {
    const now = new Date();
    
    // Get the necessary settings from Firebase
    const interestRateRef = database.ref(`Settings/InterestRate/${loan.term}`);
    const processingFeeRef = database.ref('Settings/ProcessingFee');
    
    const [interestSnap, feeSnap] = await Promise.all([
      interestRateRef.once('value'),
      processingFeeRef.once('value'),
    ]);

    const interestRate = parseFloat(interestSnap.val()) / 100;
    const amount = parseFloat(loan.loanAmount);
    const termMonths = parseInt(loan.term);
    const processingFee = parseFloat(feeSnap.val());

    // Calculate all loan details
    const monthlyPayment = amount / termMonths;
    const interest = amount * interestRate;
    const totalMonthlyPayment = monthlyPayment + interest;
    const totalTermPayment = totalMonthlyPayment * termMonths;
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
      interest: interest.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
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

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (url) {
      images.push({ 
        url, 
        label 
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

  if (!loans.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No loan applications available.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Txn ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Term</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Disb.</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Acc Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Acc No.</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>App. Date</th>
              <th style={{ ...styles.tableHeaderCell, width: '25%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.loanAmount)}</td>
                <td style={styles.tableCell}>{item.term} months</td>
                <td style={styles.tableCell}>{item.disbursement}</td>
                <td style={styles.tableCell}>{item.accountName}</td>
                <td style={styles.tableCell}>{item.accountNumber}</td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={styles.tableCell}>
                  <span 
                    style={{...styles.actionText, ...styles.approveText}}
                    onClick={() => handleApproveClick(item)}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    Approve
                  </span>
                  <span style={{color: '#aaa', margin: '0 10px'}}> | </span>
                  <span 
                    style={{...styles.actionText, ...styles.rejectText}}
                    onClick={() => handleRejectClick(item)}
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
            <p style={styles.modalText}>Are you sure you want to approve this loan?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this loan?</p>
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
            <button 
              style={{ ...styles.imageViewerNav, ...styles.prevButton }}
              onClick={() => navigateImages('prev')}
              onFocus={(e) => e.target.style.outline = 'none'}
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
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <FaChevronRight />
            </button>
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

export default ApplyLoans;