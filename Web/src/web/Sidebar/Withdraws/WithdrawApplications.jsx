import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveWithdraws, RejectWithdraws } from '../../../../../Server/api';
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
  imageBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '12px'
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
    width: '100%',
    height: '200px',
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
  }
};

const WithdrawApplications = ({ withdraws, currentPage, totalPages, onPageChange }) => {
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const removeFromPendingWithdrawals = async (memberId, transactionId) => {
    try {
      await database.ref(`Withdrawals/WithdrawalApplications/${memberId}/${transactionId}`).remove();
    } catch (error) {
      console.error('Error removing from pending withdrawals:', error);
      throw error;
    }
  };

  const processAction = async (withdraw, action) => {
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        await processDatabaseApprove(withdraw);
        setSuccessMessage('Withdrawal approved successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedWithdraw(prev => ({
          ...prev,
          dateApproved: formatDate(new Date()),
          approvedTime: formatTime(new Date()),
          status: 'approved'
        }));
      } else {
        await processDatabaseReject(withdraw);
        setSuccessMessage('Withdrawal rejected successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedWithdraw(prev => ({
          ...prev,
          dateRejected: formatDate(new Date()),
          rejectedTime: formatTime(new Date()),
          status: 'rejected'
        }));
      }
      
      await removeFromPendingWithdrawals(withdraw.id, withdraw.transactionId);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing action:', error); 
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
      setIsProcessing(false);
    }
  };

  const processDatabaseApprove = async (withdraw) => {
    try {
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const status = 'approved';

      const approvedRef = database.ref(`Withdrawals/ApprovedWithdrawals/${withdraw.id}/${withdraw.transactionId}`);
      const transactionRef = database.ref(`Transactions/Withdrawals/${withdraw.id}/${withdraw.transactionId}`);
      const memberRef = database.ref(`Members/${withdraw.id}`);
      const fundsRef = database.ref('Settings/Funds');

      const memberSnap = await memberRef.once('value');

      if (memberSnap.exists()) {
        const member = memberSnap.val();

        await approvedRef.set({ 
          ...withdraw, 
          dateApproved: approvalDate,
          timeApproved: approvalTime,
          status
        });
        
        await transactionRef.set({ 
          ...withdraw, 
          dateApproved: approvalDate,
          timeApproved: approvalTime,
          status
        });

        const newBalance = parseFloat(member.balance || 0) - parseFloat(withdraw.amountWithdrawn);
        await memberRef.update({ balance: newBalance });

        const fundSnap = await fundsRef.once('value');
        const updatedFund = (parseFloat(fundSnap.val()) || 0) - parseFloat(withdraw.amountWithdrawn);
        await fundsRef.set(updatedFund);
      }
    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve withdrawal');
    }
  };

  const processDatabaseReject = async (withdraw) => {
    try {
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);
      const status = 'rejected';

      const rejectedRef = database.ref(`Withdrawals/RejectedWithdrawals/${withdraw.id}/${withdraw.transactionId}`);

      await rejectedRef.set({ 
        ...withdraw, 
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        status,
        rejectionReason: 'Rejected by admin'
      });
    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject withdrawal');
    }
  };

  const callApiApprove = async (withdraw) => {
    try {
      const response = await ApproveWithdraws({
        memberId: withdraw.id,
        transactionId: withdraw.transactionId,
        amount: withdraw.amountWithdrawn,
        dateApproved: withdraw.dateApproved,
        timeApproved: withdraw.approvedTime,
        email: withdraw.email,
        firstName: withdraw.firstName,
        lastName: withdraw.lastName,
        status: 'approved'
      });
      
      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (withdraw) => {
    try {
      const response = await RejectWithdraws({
        memberId: withdraw.id,
        transactionId: withdraw.transactionId,
        amount: withdraw.amountWithdrawn,
        dateRejected: withdraw.dateRejected,
        timeRejected: withdraw.rejectedTime,
        email: withdraw.email,
        firstName: withdraw.firstName,
        lastName: withdraw.lastName,
        status: 'rejected',
        rejectionReason: withdraw.rejectionReason || 'Rejected by admin'
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email');
      }
    } catch (err) {
      console.error('API reject error:', err);
    }
  };

  const handleSuccessOk = () => {
    setSuccessMessageModalVisible(false);
    
    if (currentAction === 'approve') {
      callApiApprove(selectedWithdraw).catch(err => console.error('Background API error:', err));
    } else {
      callApiReject(selectedWithdraw).catch(err => console.error('Background API error:', err));
    }
    
    setSelectedWithdraw(null);
    setCurrentAction(null);
  };

  const openModal = (withdraw) => {
    setSelectedWithdraw(withdraw);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
  };

  const openImageViewer = (url, label, index = 0) => {
    setCurrentImage({ url, label });
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };

  const navigateImages = (direction) => {
    const images = [
      { url: selectedWithdraw?.proofOfWithdrawalUrl, label: 'Proof of Withdrawal' }
    ].filter(img => img.url);

    if (direction === 'prev') {
      const newIndex = (currentImageIndex - 1 + images.length) % images.length;
      setCurrentImage(images[newIndex]);
      setCurrentImageIndex(newIndex);
    } else {
      const newIndex = (currentImageIndex + 1) % images.length;
      setCurrentImage(images[newIndex]);
      setCurrentImageIndex(newIndex);
    }
  };

  if (!withdraws.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No withdrawal applications available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Account Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Account Number</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Proof</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdraws.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountWithdrawn)}</td>
                <td style={styles.tableCell}>{item.accountName}</td>
                <td style={styles.tableCell}>{item.accountNumber}</td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={styles.tableCell}>
                  {item.proofOfWithdrawalUrl && (
                    <span 
                      style={styles.viewText}
                      onClick={() => openImageViewer(item.proofOfWithdrawalUrl, 'Proof of Withdrawal', 0)}
                      onFocus={(e) => e.target.style.outline = 'none'}
                    >
                      <FaImage /> View
                    </span>
                  )}
                </td>
                <td style={styles.tableCell}>
                  <span 
                    style={{...styles.actionText, ...styles.approveText}}
                    onClick={() => processAction(item, 'approve')}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    Approve
                  </span>
                  <span style={{color: '#aaa'}}> | </span>
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
              <h2 style={styles.modalTitle}>Withdrawal Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Transaction Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedWithdraw?.amountWithdrawn) || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Name:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.accountName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Number:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.accountNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.dateApplied || 'N/A'}</span>
                  </div>

                  {selectedWithdraw?.dateApproved && (
                    <>
                      <div style={styles.sectionTitle}>Approval Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.dateApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.approvedTime}</span>
                      </div>
                    </>
                  )}

                  {selectedWithdraw?.dateRejected && (
                    <>
                      <div style={styles.sectionTitle}>Rejection Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.dateRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.rejectedTime}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedWithdraw.rejectionReason || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedWithdraw?.firstName || ''} ${selectedWithdraw?.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedWithdraw?.phoneNumber || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Proof of Withdrawal</div>
                  {selectedWithdraw?.proofOfWithdrawalUrl && (
                    <div style={styles.imageBlock}>
                      <p style={styles.imageLabel}>Proof of Withdrawal</p>
                      <img
                        src={selectedWithdraw.proofOfWithdrawalUrl}
                        alt="Proof of Withdrawal"
                        style={styles.imageThumbnail}
                        onClick={() => openImageViewer(selectedWithdraw.proofOfWithdrawalUrl, 'Proof of Withdrawal', 0)}
                        onFocus={(e) => e.target.style.outline = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {selectedWithdraw?.status !== 'approved' && selectedWithdraw?.status !== 'rejected' && (
              <div style={styles.bottomButtons}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => processAction(selectedWithdraw, 'approve')}
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
                  onClick={() => processAction(selectedWithdraw, 'reject')}
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

export default WithdrawApplications;