import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveLoans, RejectLoans } from '../../../../../Server/api';
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
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2D5783',
    margin: '12px 0 8px 0',
    paddingBottom: '4px',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
    width: '100%'
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
    right: '80px',
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
  }
};

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
  const [hoverStates, setHoverStates] = useState({});
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [justCompletedAction, setJustCompletedAction] = useState(false);
  // New: member financials for modal display
  const [memberBalance, setMemberBalance] = useState(null);
  const [existingLoanInfo, setExistingLoanInfo] = useState({ hasExisting: false, outstanding: 0 });

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

  const openModal = async (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);

    try {
      // Fetch current balance
      const balanceSnap = await database.ref(`Members/${loan.id}/balance`).once('value');
      const balance = parseFloat(balanceSnap.val()) || 0;
      setMemberBalance(balance);

      // Fetch existing current loans and compute outstanding
      const currentLoansSnap = await database.ref(`Loans/CurrentLoans/${loan.id}`).once('value');
      let hasExisting = false;
      let outstanding = 0;

      if (currentLoansSnap.exists()) {
        hasExisting = true;
        const loansObj = currentLoansSnap.val() || {};
        // Sum remaining balances across all current loans for this member
        Object.values(loansObj).forEach(l => {
          const totalTermPayment = parseFloat(l.totalTermPayment) || 0;
          const amountPaid = parseFloat(l.amountPaid) || 0; // fallback if tracked
          const paymentsMade = parseFloat(l.paymentsMade) || 0; // number of payments made
          const perMonth = parseFloat(l.totalMonthlyPayment) || 0;
          // Compute remaining: prefer totalTermPayment - amountPaid, fallback to perMonth*(term - paymentsMade)
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
      if (action === 'approve') {
        await processDatabaseApprove(loan);
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

        // Store API call data for later execution
        setPendingApiCall({
          type: 'approve',
          data: approveData
        });
      } else {
        await processDatabaseReject(loan, rejectionReason);
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

        // Store API call data for later execution
        setPendingApiCall({
          type: 'reject',
          data: rejectData
        });
      }
      
      setSuccessMessageModalVisible(true);
      setJustCompletedAction(true);
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
    const memberInvestmentRef = database.ref(`Members/${id}/investment`);
    
    // Check strictly against member's investment (no percentage rule)
    const [loanSnap, memberInvestmentSnap] = await Promise.all([
      loanRef.once('value'),
      memberInvestmentRef.once('value')
    ]);

    if (!loanSnap.exists()) {
      throw new Error('Loan data not found.');
    }

    const memberInvestment = parseFloat(memberInvestmentSnap.val()) || 0;
    const requestedAmount = parseFloat(loanAmount);

    if (requestedAmount > memberInvestment) {
      throw new Error(`Loan amount exceeds member's investment. Maximum allowed: ${formatCurrency(memberInvestment)}`);
    }

    // Continue with approval process
    const originalTransactionId = transactionId;
    const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

    const approvedRef = database.ref(`Loans/ApprovedLoans/${id}/${newTransactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${id}/${newTransactionId}`);
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${newTransactionId}`);
    const memberLoanRef = database.ref(`Members/${id}/loans/${newTransactionId}`);
    const fundsRef = database.ref('Settings/Funds');
    const loanData = loanSnap.val();

    // Fetch per-loan-type interest rate and processing fee
    const loanTypeKey = String(loanData.loanType || '').trim();
    const termKeyRaw = String(loanData.term ?? '').trim();
    const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
    const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);
    const processingFeeRef = database.ref('Settings/ProcessingFee');

    const [fundsSnap, feeSnap] = await Promise.all([
      fundsRef.once('value'),
      processingFeeRef.once('value'),
    ]);

    // Resolve interest rate using canonical structure only: Settings/LoanTypes/{type}/{term}
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
    const interestRateDecimal = interestRatePercentage / 100; // Convert to decimal
    const amount = parseFloat(loanData.loanAmount);
    const termMonths = parseInt(loanData.term);
    const currentFunds = parseFloat(fundsSnap.val());
    const processingFee = parseFloat(feeSnap.val());

    if (amount > currentFunds) {
      throw new Error('Insufficient funds to approve this loan.');
    }

    // NEW CALCULATION METHOD:
    // 1. Calculate interest per term: loanAmount * interestRateDecimal
    const interestPerTerm = amount * interestRateDecimal;
    
    // 2. Calculate total interest: interestPerTerm * termMonths
    const totalInterest = interestPerTerm * termMonths;
    
    // 3. Calculate total term payment: loanAmount + totalInterest
    const totalTermPayment = amount + totalInterest;
    
    // 4. Calculate monthly payment: totalTermPayment / termMonths
    const totalMonthlyPayment = totalTermPayment / termMonths;
    
    // 5. Monthly principal remains: amount / termMonths
    const monthlyPrincipal = amount / termMonths;

    // Release amount after deducting processing fee
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
      interestRate: interestRatePercentage, // Store as percentage (e.g., 1 for 1%)
      interest: Math.round(interestPerTerm * 100) / 100, // Interest for each term period
      totalInterest: Math.round(totalInterest * 100) / 100, // Total interest over entire loan
      monthlyPayment: Math.round(monthlyPrincipal * 100) / 100, // Principal portion of monthly payment
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100, // Total monthly payment (principal + interest)
      totalTermPayment: Math.round(totalTermPayment * 100) / 100, // Total amount to be repaid
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      processingFee: processingFee,
      dateApproved: approvalDate,
      timeApproved: approvalTime,
      timestamp: now.getTime(),
      dueDate: formattedDueDate,
      status: 'approved',
      paymentsMade: 0,
      amountPaid: 0, // Track total amount paid
      remainingBalance: Math.round(totalTermPayment * 100) / 100 // Start with full amount
    };

    // Execute all database operations in sequence
    await approvedRef.set(approvedData);
    await transactionRef.set(approvedData);
    await currentLoanRef.set(approvedData);
    await memberLoanRef.set(approvedData);
    
    // Update funds and log to history
    const newFundsAmount = currentFunds - amount;
    await fundsRef.set(newFundsAmount);
    
    // Log to FundsHistory for dashboard chart
    const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
    const fundsHistoryRef = database.ref(`Settings/FundsHistory/${timestamp}`);
    await fundsHistoryRef.set(newFundsAmount);
    
    // Update Savings and SavingsHistory
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const savingsRef = database.ref('Settings/Savings');
    const savingsHistoryRef = database.ref('Settings/SavingsHistory');

    const [savingsSnap, currentDaySavingsSnap] = await Promise.all([
      savingsRef.once('value'),
      savingsHistoryRef.child(dateKey).once('value')
    ]);

    const currentSavings = parseFloat(savingsSnap.val()) || 0;
    const newSavingsAmount = Math.ceil((currentSavings + processingFee) * 100) / 100;
    await savingsRef.set(newSavingsAmount);

    // Increment daily savings history by processing fee
    const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
    const newDaySavings = Math.ceil((currentDaySavings + processingFee) * 100) / 100;
    const savingsHistoryUpdate = {};
    savingsHistoryUpdate[dateKey] = newDaySavings;
    await savingsHistoryRef.update(savingsHistoryUpdate);
    
    // Update member balance: deduct full loan amount as requested
    const memberRef = database.ref(`Members/${id}/balance`);
    const currentBalanceSnap = await memberRef.once('value');
    const currentMemberBalance = parseFloat(currentBalanceSnap.val()) || 0;
    const updatedMemberBalance = Math.max(0, Math.ceil((currentMemberBalance - amount) * 100) / 100);
    await memberRef.set(updatedMemberBalance);
    console.log('Member balance deducted for loan approval');

    // Remove from pending loans AFTER all other operations succeed
    await loanRef.remove();


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

      // Generate a new transaction ID for rejected/transactions records
      const originalTransactionId = loan.transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const loanRef = database.ref(`Loans/LoanApplications/${loan.id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Loans/RejectedLoans/${loan.id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${loan.id}/${newTransactionId}`);

      // First create a copy of the loan data with rejection info
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

      // Execute all database operations in sequence
      await rejectedRef.set(rejectedLoan);
      await transactionRef.set(rejectedLoan);

      // Remove from pending loans AFTER saving to rejected
      await loanRef.remove();

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject loan');
    }
  };

  const callApiApprove = async (loan) => {
    try {
      const now = new Date();

      // Robust parsing helpers
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

      // Resolve interest rate like processDatabaseApprove: Settings/LoanTypes/{type}/{term}
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
      // Backward-compat fallback to old path if needed
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

      // Fetch processing fee
      const processingFeeSnap = await database.ref('Settings/ProcessingFee').once('value');
      const processingFee = toNumber(processingFeeSnap.val());

      if (!Number.isFinite(interestRate) || !Number.isFinite(amount) || !Number.isFinite(termMonths) || termMonths <= 0 || !Number.isFinite(processingFee)) {
        throw new Error('Missing or invalid settings/data for email payload calculation.');
      }

      // Calculate all loan details (mirror DB logic semantics)
      const monthlyPrincipal = amount / termMonths;
      const interestPerTerm = amount * interestRate; // per month interest from rate
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
    setSuccessMessageModalVisible(false);
    closeModal();
    setSelectedLoan(null);
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
    // Do not call refreshData here directly; let useEffect handle it when modal closes
  };

  // Auto-refresh when success modal closes (after approve/reject)
  useEffect(() => {
    if (!successMessageModalVisible && justCompletedAction) {
      // Give the database a brief moment to settle writes
      const t = setTimeout(() => {
        if (typeof refreshData === 'function') {
          refreshData();
        }
        setJustCompletedAction(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [successMessageModalVisible, justCompletedAction, refreshData]);

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

  const hasDocuments = (loan) => {
    return loan.proofOfIncomeUrl || loan.proofOfIdentityUrl;
  };

  if (!loans.length) {
    // Show only the text, no container box
    return (
      <p style={styles.noDataMessage}>No loan applications available.</p>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{`${item.firstName}` + " " + `${item.lastName}`}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.loanAmount)}</td>
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

      {modalVisible && selectedLoan && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCard}>
            <button 
              style={styles.closeButton} 
              onClick={closeModal}
              aria-label="Close modal"
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <FaTimes />
            </button>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Loan Application Details</h2>
            </div>
            <div style={styles.modalContent}>
              {hasDocuments(selectedLoan) ? (
                <div style={styles.columns}>
                  <div style={styles.leftColumn}>
                    <div style={styles.sectionTitle}>Member Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Member ID:</span>
                      <span style={styles.fieldValue}>{selectedLoan.id || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Name:</span>
                      <span style={styles.fieldValue}>{`${selectedLoan.firstName || ''} ${selectedLoan.lastName || ''}`}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Email:</span>
                      <span style={styles.fieldValue}>{selectedLoan.email || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Current Balance:</span>
                      <span style={styles.fieldValue}>{memberBalance !== null ? formatCurrency(memberBalance) : 'Loading...'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Existing Loan:</span>
                      <span style={styles.fieldValue}>
                        {existingLoanInfo.hasExisting ? `Yes — Outstanding: ${formatCurrency(existingLoanInfo.outstanding)}` : 'No'}
                      </span>
                    </div>

                    <div style={styles.sectionTitle}>Loan Details</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Transaction ID:</span>
                      <span style={styles.fieldValue}>{selectedLoan.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Loan Amount:</span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedLoan.loanAmount)}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Term:</span>
                      <span style={styles.fieldValue}>{selectedLoan.term} months</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Disbursement:</span>
                      <span style={styles.fieldValue}>{selectedLoan.disbursement || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Account Name:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountName || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Account Number:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountNumber || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date Applied:</span>
                      <span style={styles.fieldValue}>{selectedLoan.dateApplied || 'N/A'}</span>
                    </div>


                  </div>
                  <div style={styles.rightColumn}>
                    <div style={styles.sectionTitle}>Proof of Documents</div>
                    <div style={styles.imageGrid}>
                      {selectedLoan.proofOfIncomeUrl && (
                        <div style={styles.imageBlock}>
                          <p style={styles.imageLabel}>Proof of Income</p>
                          <img
                            src={selectedLoan.proofOfIncomeUrl}
                            alt="Proof of Income"
                            style={styles.imageThumbnail}
                            onClick={() => openImageViewer(selectedLoan.proofOfIncomeUrl, 'Proof of Income', 0)}
                            onFocus={(e) => e.target.style.outline = 'none'}
                          />
                        </div>
                      )}
                      {selectedLoan.proofOfIdentityUrl && (
                        <div style={styles.imageBlock}>
                          <p style={styles.imageLabel}>Proof of Identity</p>
                          <img
                            src={selectedLoan.proofOfIdentityUrl}
                            alt="Proof of Identity"
                            style={styles.imageThumbnail}
                            onClick={() => openImageViewer(selectedLoan.proofOfIdentityUrl, 'Proof of Identity', 1)}
                            onFocus={(e) => e.target.style.outline = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.columns}>
                  <div style={styles.leftColumn}>
 <div style={styles.sectionTitle}>Member Information</div>
                    <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedLoan.firstName || ''} ${selectedLoan.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedLoan.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Current Balance:</span>
                    <span style={styles.fieldValue}>{memberBalance !== null ? formatCurrency(memberBalance) : 'Loading...'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Existing Loan:</span>
                    <span style={styles.fieldValue}>
                      {existingLoanInfo.hasExisting ? `Yes — Outstanding: ${formatCurrency(existingLoanInfo.outstanding)}` : 'No'}
                    </span>
                  </div>
                  
                  </div>
                  <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Loan Details</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Loan Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedLoan.loanAmount)}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Term:</span>
                    <span style={styles.fieldValue}>{selectedLoan.term} months</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Disbursement:</span>
                    <span style={styles.fieldValue}>{selectedLoan.disbursement || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Name:</span>
                    <span style={styles.fieldValue}>{selectedLoan.accountName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Number:</span>
                    <span style={styles.fieldValue}>{selectedLoan.accountNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedLoan.dateApplied || 'N/A'}</span>
                  </div>


                </div>
                </div>
              )}
            </div>
            {selectedLoan?.status !== 'approved' && selectedLoan?.status !== 'rejected' && (
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
                      style={{ ...styles.customReasonInput, marginTop: 0, maxWidth: '60%' }}
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
    </div>
  );
};

export default ApplyLoans;