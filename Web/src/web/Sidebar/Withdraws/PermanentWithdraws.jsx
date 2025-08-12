import React, { useState } from 'react';
import { database, auth } from '../../../../../Database/firebaseConfig';
import { ApprovePermanentWithdraws, RejectPermanentWithdraws } from '../../../../../Server/api';
import { FaCheckCircle, FaTimes, FaExclamationCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
    width: '300px',
    height: '200px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  confirmIcon: {
    alignSelf: 'center',
    marginBottom: '10px',
    fontSize: '30px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  cancelBtn: {
    backgroundColor: '#f44336',
    width: '100px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '5px',
    margin: '0 10px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
    width: '100px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '5px',
    margin: '0 10px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
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
    flex: '1'
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
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderLeftColor: '#001F3F',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
};

const rejectionReasons = [
  "Invalid reason provided",
  "Member has outstanding balance",
  "Member has active loans",
  "Incomplete information",
  "Other (please specify)"
];

const PermanentWithdraws = ({ withdrawals, currentPage, totalPages, onPageChange, refreshData }) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
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
  const [hoverStates, setHoverStates] = useState({});

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  const handleHover = (transactionId, type, isHovering) => {
    setHoverStates(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [type]: isHovering ? styles[`${type}Hover`] : {}
      }
    }));
  };

  const handleApproveClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowApproveConfirmation(true);
  };

  const handleRejectClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveConfirmation(false);
    await processAction(selectedWithdrawal, 'approve');
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
    await processAction(selectedWithdrawal, 'reject', selectedReason === "Other (please specify)" ? customReason : selectedReason);
  };

  const processAction = async (withdrawal, action, rejectionReason = '') => {
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        await processDatabaseApprove(withdrawal);
        setSuccessMessage('Membership withdrawal approved successfully!');
      } else {
        await processDatabaseReject(withdrawal, rejectionReason);
        setSuccessMessage('Membership withdrawal rejected successfully!');
      }

      setSuccessMessageModalVisible(true);
      
      const now = new Date();
      setSelectedWithdrawal(prev => ({
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

  const processDatabaseApprove = async (withdrawal) => {
    try {
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const status = 'approved';

      // Database references
      const approvedRef = database.ref(`MembershipWithdrawal/ApprovedWithdrawals/${withdrawal.memberId}/${withdrawal.transactionId}`);
      const memberRef = database.ref(`Members/${withdrawal.memberId}`);
      const pendingRef = database.ref(`MembershipWithdrawal/PendingWithdrawals/${withdrawal.memberId}/${withdrawal.transactionId}`);
      const fundsRef = database.ref('Settings/Funds');
      const authUserRef = auth.currentUser;

      // Fetch current funds
      const fundsSnap = await fundsRef.once('value');
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      // Calculate new funds (subtract member's balance)
      const memberBalance = parseFloat(withdrawal.balance) || 0;
      const newFunds = currentFunds - memberBalance;

      // Prepare approved withdrawal data
      const approvedWithdrawal = { 
        ...withdrawal, 
        dateApproved: approvalDate,
        timeApproved: approvalTime,
        status
      };

      // Execute all database operations
      await Promise.all([
        // Save to approved
        approvedRef.set(approvedWithdrawal),
        
        // Update funds
        fundsRef.set(newFunds),
        
        // Remove from pending
        pendingRef.remove(),
        
        // Update member status to inactive
        memberRef.update({ status: 'inactive' }),
        
        // Delete auth user if exists
        authUserRef && authUserRef.delete().catch(error => {
          console.error('Error deleting auth user:', error);
          // Continue even if auth deletion fails
        })
      ]);

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

      const rejectedRef = database.ref(`MembershipWithdrawal/RejectedWithdrawals/${withdrawal.memberId}/${withdrawal.transactionId}`);
      const pendingRef = database.ref(`MembershipWithdrawal/PendingWithdrawals/${withdrawal.memberId}/${withdrawal.transactionId}`);

      const rejectedWithdrawal = { 
        ...withdrawal, 
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      // Save to rejected and remove from pending
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
    setSuccessMessageModalVisible(false);
    setSelectedWithdrawal(null);
    setCurrentAction(null);
    
    try {
      if (currentAction === 'approve') {
        await callApiApprove(selectedWithdrawal);
      } else {
        await callApiReject(selectedWithdrawal);
      }
    } catch (error) {
      console.error("Email sending failed (but action succeeded):", error);
    } finally {
      refreshData();
    }
  };

  const callApiApprove = async (withdrawal) => {
    try {
      const now = new Date();
      const response = await ApprovePermanentWithdraws({
        memberId: withdrawal.memberId,
        transactionId: withdrawal.transactionId,
        email: withdrawal.email,
        firstName: withdrawal.firstName,
        lastName: withdrawal.lastName,
        dateApproved: withdrawal.dateApproved || formatDate(now),
        timeApproved: withdrawal.timeApproved || formatTime(now),
        status: 'approved',
        withdrawalType: 'membership'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send approval email: ${response.statusText}`);
      }
      return response.data;
    } catch (err) {
      console.error('API approve error:', err);
      throw err;
    }
  };

  const callApiReject = async (withdrawal) => {
    try {
      const now = new Date();
      const response = await RejectPermanentWithdraws({
        memberId: withdrawal.memberId,
        transactionId: withdrawal.transactionId,
        email: withdrawal.email,
        firstName: withdrawal.firstName,
        lastName: withdrawal.lastName,
        dateRejected: withdrawal.dateRejected || formatDate(now),
        timeRejected: withdrawal.timeRejected || formatTime(now),
        status: 'rejected',
        rejectionReason: withdrawal.rejectionReason || 'Rejected by admin',
        withdrawalType: 'membership'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send rejection email: ${response.statusText}`);
      }
      return response.data;
    } catch (err) {
      console.error('API reject error:', err);
      throw err;
    }
  };

  if (!withdrawals.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No membership withdrawal requests available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Balance</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Reason</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Submitted</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.memberId}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{item.firstName} {item.lastName}</td>
                <td style={styles.tableCell}>{formatCurrency(item.balance)}</td>
                <td style={styles.tableCell}>{item.reason}</td>
                <td style={styles.tableCell}>{item.dateSubmitted}</td>
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
            <p style={styles.modalText}>Are you sure you want to approve this membership withdrawal?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.confirmBtn,
                  ...(actionInProgress ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {})
                }} 
                onClick={confirmApprove}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={styles.cancelBtn} 
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
            <p style={styles.modalText}>Are you sure you want to reject this membership withdrawal?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.confirmBtn,
                  ...(actionInProgress ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {})
                }} 
                onClick={confirmRejectFinal}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={styles.cancelBtn} 
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
              style={styles.cancelBtn} 
              onClick={() => setErrorModalVisible(false)}
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
              style={styles.confirmBtn} 
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