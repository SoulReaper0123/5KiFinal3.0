import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { FaCheckCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { ApproveMembershipWithdrawal, RejectMembershipWithdrawal } from '../../../../../Server/api';

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
  }, [refreshData]);

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
        
        const approveData = {
          ...withdrawal,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date()),
          status: 'approved'
        };
        
        setSelectedWithdrawal(prev => ({
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
        await processDatabaseReject(withdrawal, rejectionReason);
        setSuccessMessage('Membership withdrawal rejected successfully!');
        
        const rejectData = {
          ...withdrawal,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason,
          status: 'rejected'
        };
        
        setSelectedWithdrawal(prev => ({
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
    } catch (error) {
      console.error('Error processing action:', error);
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
        balance: newMemberBalance // Update member's balance to 0
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
    setSuccessMessageModalVisible(false);
    setSelectedWithdrawal(null);
    setCurrentAction(null);
    
    // Execute pending API call
    if (pendingApiCall) {
      try {
        if (pendingApiCall.type === 'approve') {
          await ApproveMembershipWithdrawal(pendingApiCall.data);
        } else if (pendingApiCall.type === 'reject') {
          await RejectMembershipWithdrawal(pendingApiCall.data);
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
      setPendingApiCall(null);
    }
    
    refreshData();
  };

  if (loading) {
    return (
      <div style={styles.loadingView}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (!withdrawals.length) {
    // Show only the text, no container box
    return (
      <p style={styles.noDataMessage}>No membership withdrawal requests available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Balance</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Reason</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Submitted</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.memberId}</td>
                <td style={styles.tableCell}>{`${item.firstName} ${item.lastName}`}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.balance)}</td>
                <td style={styles.tableCell}>{item.reason}</td>
                <td style={styles.tableCell}>{item.dateSubmitted}</td>
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

      {modalVisible && selectedWithdrawal && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSingleColumn}>
            <button 
              style={styles.closeButton} 
              onClick={closeModal}
              aria-label="Close modal"
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <FaTimes />
            </button>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Membership Withdrawal Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.leftColumn}>
                <div style={styles.sectionTitle}>Member Information</div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Member ID:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.memberId || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Name:</span>
                  <span style={styles.fieldValue}>{`${selectedWithdrawal.firstName || ''} ${selectedWithdrawal.lastName || ''}`}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Email:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.email || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Contact:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.contact || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Address:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.address || 'N/A'}</span>
                </div>

                <div style={styles.sectionTitle}>Withdrawal Details</div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Transaction ID:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.transactionId || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Balance:</span>
                  <span style={styles.fieldValue}>{formatCurrency(selectedWithdrawal.balance)}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Reason:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.reason || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Date Joined:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.dateJoined || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Date Submitted:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.dateSubmitted || 'N/A'}</span>
                </div>
                <div style={styles.compactField}>
                  <span style={styles.fieldLabel}>Has Existing Loan:</span>
                  <span style={styles.fieldValue}>{selectedWithdrawal.hasExistingLoan ? 'Yes' : 'No'}</span>
                </div>

                {selectedWithdrawal.dateApproved && (
                  <>
                    <div style={styles.sectionTitle}>Approval Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date Approved:</span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.dateApproved}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Time Approved:</span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.timeApproved}</span>
                    </div>
                  </>
                )}

                {selectedWithdrawal.dateRejected && (
                  <>
                    <div style={styles.sectionTitle}>Rejection Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date Rejected:</span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.dateRejected}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Time Rejected:</span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.timeRejected}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Rejection Reason:</span>
                      <span style={styles.fieldValue}>{selectedWithdrawal.rejectionReason || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {selectedWithdrawal?.status !== 'approved' && selectedWithdrawal?.status !== 'rejected' && (
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
            <p style={styles.modalText}>Are you sure you want to approve this membership withdrawal?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this membership withdrawal?</p>
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

export default PermanentWithdraws;