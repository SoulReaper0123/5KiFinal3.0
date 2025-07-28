import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveLoans, RejectLoans } from '../../../../../Server/api';
import { FaCheckCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';

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
    maxWidth: '800px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    height: '80vh',
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
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: '0.7'
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

const ApplyLoans = ({ loans, currentPage, totalPages, onPageChange }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const removeFromPendingLoans = async (memberId, transactionId) => {
    try {
      await database.ref(`Loans/LoanApplications/${memberId}/${transactionId}`).remove();
    } catch (error) {
      console.error('Error removing from pending loans:', error);
      throw error;
    }
  };

  const processAction = async (loan, action) => {
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        const success = await handleApprove(loan);
        if (!success) return;
        
        setSuccessMessage('Loan approved successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedLoan(prev => ({
          ...prev,
          dateApproved: formatDate(new Date()),
          approvedTime: formatTime(new Date()),
          status: 'approved'
        }));
      } else {
        await handleReject(loan);
        setSuccessMessage('Loan rejected successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedLoan(prev => ({
          ...prev,
          dateRejected: formatDate(new Date()),
          rejectedTime: formatTime(new Date()),
          status: 'rejected'
        }));
      }
      
      // Remove the loan application from pending loans
      await removeFromPendingLoans(loan.id, loan.transactionId);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing action:', error); 
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
      setIsProcessing(false);
    }
  };

  const handleApprove = async (loan) => {
    const { id, transactionId, term, loanAmount } = loan;

    const loanRef = database.ref(`Loans/LoanApplications/${id}/${transactionId}`);
    const memberRef = database.ref(`Members/${id}/balance`);
    const settingsRef = database.ref('Settings/LoanPercentage');
    
    // First check if member has sufficient balance based on loan percentage
    try {
      const [loanSnap, memberSnap, settingsSnap] = await Promise.all([
        loanRef.once('value'),
        memberRef.once('value'),
        settingsRef.once('value')
      ]);

      if (!loanSnap.exists()) {
        setErrorMessage('Loan data not found.');
        setErrorModalVisible(true);
        setIsProcessing(false);
        return false;
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
        setErrorMessage(`Loan amount exceeds ${percentageUsed}% of member's balance. Maximum allowed: ${formatCurrency(maxLoanAmount)}`);
        setErrorModalVisible(true);
        setIsProcessing(false);
        return false;
      }

      // Continue with the rest of the approval process
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
        setErrorMessage('Insufficient funds to approve this loan.');
        setErrorModalVisible(true);
        setIsProcessing(false);
        return false;
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
        interestRate: (interestRate * 100).toFixed(2) + '%',
        interest: interest.toFixed(2),
        monthlyPayment: monthlyPayment.toFixed(2),
        totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
        totalTermPayment: totalTermPayment.toFixed(2),
        releaseAmount: releaseAmount.toFixed(2),
        processingFee: processingFee.toFixed(2),
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        dueDate: formattedDueDate,
        status: 'approved',
      };

      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await currentLoanRef.set(approvedData);
      await memberLoanRef.set(approvedData);
      await fundsRef.set(currentFunds - amount);
      await memberRef.set(memberBalance - amount);

      return true;
    } catch (err) {
      console.error('Approval error:', err);
      setErrorMessage('An unexpected error occurred during approval.');
      setErrorModalVisible(true);
      setIsProcessing(false);
      return false;
    }
  };

  const handleReject = async (loan) => {
    const loanRef = database.ref(`Loans/LoanApplications/${loan.id}/${loan.transactionId}`);
    const rejectedRef = database.ref(`Loans/RejectedLoans/${loan.id}/${loan.transactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${loan.id}/${loan.transactionId}`);
    const snapshot = await loanRef.once('value');

    const rejectionDate = formatDate(new Date());
    const rejectionTime = formatTime(new Date());

    if (snapshot.exists()) {
      const data = snapshot.val();

      const rejectedData = {
        ...data,
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        status: 'rejected',
      };

      await rejectedRef.set(rejectedData);
      await transactionRef.set(rejectedData);
    }
  };

  const handleSuccessOk = () => {
    setSuccessMessageModalVisible(false);
    
    if (currentAction === 'approve') {
      callApiApprove(selectedLoan).catch(err => console.error('Background API error:', err));
    } else {
      callApiReject(selectedLoan).catch(err => console.error('Background API error:', err));
    }
    
    setSelectedLoan(null);
    setCurrentAction(null);
  };

  const callApiApprove = async (loan) => {
    try {
      await ApproveLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: loan.loanAmount,
        term: loan.term,
        dateApproved: formatDate(new Date()),
        timeApproved: formatTime(new Date()),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
      });
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (loan) => {
    try {
      await RejectLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: loan.loanAmount,
        term: loan.term,
        dateRejected: formatDate(new Date()),
        timeRejected: formatTime(new Date()),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
      });
    } catch (err) {
      console.error('API reject error:', err);
    }
  };

  const openModal = (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Term</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Disbursement</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Actions</th>
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
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={styles.tableCell}>
                  <span 
                    style={{...styles.actionText, ...styles.approveText}}
                    onClick={() => processAction(item, 'approve')}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    Approve
                  </span>
                  <span style={{color: '#aaa', margin: '0 10px'}}> | </span>
                  <span 
                    style={{...styles.actionText, ...styles.rejectText}}
                    onClick={() => processAction(item, 'reject')}
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

      {/* View Details Modal */}
      {modalVisible && (
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
              <h2 style={styles.modalTitle}>Loan Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Loan Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedLoan?.loanAmount) || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Term:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.term ? `${selectedLoan.term} months` : 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Disbursement:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.disbursement || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.dateApplied || 'N/A'}</span>
                  </div>

                  {selectedLoan?.dateApproved && (
                    <>
                      <div style={styles.sectionTitle}>Approval Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedLoan.approvedTime}</span>
                      </div>
                    </>
                  )}

                  {selectedLoan?.dateRejected && (
                    <>
                      <div style={styles.sectionTitle}>Rejection Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedLoan.rejectedTime}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedLoan?.firstName || ''} ${selectedLoan?.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.phoneNumber || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Bank Details</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Name:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.accountName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Number:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.accountNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Bank Name:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.bankName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            {selectedLoan?.status !== 'approved' && selectedLoan?.status !== 'rejected' && (
              <div style={styles.bottomButtons}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => processAction(selectedLoan, 'approve')}
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
                  onClick={() => processAction(selectedLoan, 'reject')}
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