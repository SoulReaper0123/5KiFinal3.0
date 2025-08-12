import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveDeposits, RejectDeposits } from '../../../../../Server/api';
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
  "Invalid proof of deposit",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other (please specify)"
];

const ApplyDeposits = ({ 
  deposits, 
  currentPage, 
  totalPages, 
  onPageChange, 
  refreshData 
}) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
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

  const openModal = (deposit) => {
    setSelectedDeposit(deposit);
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
    await processAction(selectedDeposit, 'approve');
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
    await processAction(selectedDeposit, 'reject', selectedReason === "Other (please specify)" ? customReason : selectedReason);
  };

  const processAction = async (deposit, action, rejectionReason = '') => {
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        await processDatabaseApprove(deposit);
        setSuccessMessage('Deposit approved successfully!');
        
        setSelectedDeposit(prev => ({
          ...prev,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date()),
          status: 'approved'
        }));

        callApiApprove({
          ...deposit,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        }).catch(console.error);
      } else {
        await processDatabaseReject(deposit, rejectionReason);
        setSuccessMessage('Deposit rejected successfully!');
        
        setSelectedDeposit(prev => ({
          ...prev,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason,
          status: 'rejected'
        }));

        callApiReject({
          ...deposit,
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

  const processDatabaseApprove = async (deposit) => {
    try {
      const now = new Date();
      const approvalDate = formatDate(now);
      const approvalTime = formatTime(now);
      const status = 'approved';

      // Get references to all needed paths
      const pendingRef = database.ref(`Deposits/DepositApplications/${deposit.id}/${deposit.transactionId}`);
      const approvedRef = database.ref(`Deposits/ApprovedDeposits/${deposit.id}/${deposit.transactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${deposit.id}/${deposit.transactionId}`);
      const memberRef = database.ref(`Members/${deposit.id}`);
      const fundsRef = database.ref('Settings/Funds');

      const memberSnap = await memberRef.once('value');

      if (memberSnap.exists()) {
        const member = memberSnap.val();

        // First create a copy of the deposit data with approval info
        const approvedDeposit = { 
          ...deposit, 
          dateApproved: approvalDate,
          timeApproved: approvalTime,
          status
        };

        // Execute all operations in sequence
        await approvedRef.set(approvedDeposit);
        await transactionRef.set(approvedDeposit);

        // Update member balance
        const newBalance = parseFloat(member.balance || 0) + parseFloat(deposit.amountToBeDeposited);
        await memberRef.update({ balance: newBalance });

        // Update funds
        const fundSnap = await fundsRef.once('value');
        const updatedFund = (parseFloat(fundSnap.val()) || 0) + parseFloat(deposit.amountToBeDeposited);
        await fundsRef.set(updatedFund);

        // Remove from pending AFTER all other operations succeed
        await pendingRef.remove();
      }
    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve deposit');
    }
  };

  const processDatabaseReject = async (deposit, rejectionReason) => {
    try {
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);
      const status = 'rejected';

      // Get references to all needed paths
      const pendingRef = database.ref(`Deposits/DepositApplications/${deposit.id}/${deposit.transactionId}`);
      const rejectedRef = database.ref(`Deposits/RejectedDeposits/${deposit.id}/${deposit.transactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${deposit.id}/${deposit.transactionId}`);

      // First create a copy of the deposit data with rejection info
      const rejectedDeposit = { 
        ...deposit, 
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      // Execute all operations in sequence
      await rejectedRef.set(rejectedDeposit);
      await transactionRef.set(rejectedDeposit);
      
      // Remove from pending AFTER saving to rejected
      await pendingRef.remove();
    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject deposit');
    }
  };

  const callApiApprove = async (deposit) => {
    try {
      const response = await ApproveDeposits({
        memberId: deposit.id,
        transactionId: deposit.transactionId,
        amount: deposit.amountToBeDeposited,
        dateApproved: deposit.dateApproved,
        timeApproved: deposit.timeApproved,
        email: deposit.email,
        firstName: deposit.firstName,
        lastName: deposit.lastName,
        status: 'approved'
      });
      
      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (deposit) => {
    try {
      const response = await RejectDeposits({
        memberId: deposit.id,
        transactionId: deposit.transactionId,
        amount: deposit.amountToBeDeposited,
        dateRejected: deposit.dateRejected,
        timeRejected: deposit.timeRejected,
        email: deposit.email,
        firstName: deposit.firstName,
        lastName: deposit.lastName,
        status: 'rejected',
        rejectionReason: deposit.rejectionReason || 'Rejected by admin'
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
    closeModal();
    setSelectedDeposit(null);
    setCurrentAction(null);
    refreshData();
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

  if (!deposits.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No deposit applications available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Option</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{`${item.firstName} ${item.lastName}`}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBeDeposited)}</td>
                <td style={styles.tableCell}>{item.depositOption}</td>
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

      {modalVisible && selectedDeposit && (
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
              <h2 style={styles.modalTitle}>Deposit Application Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedDeposit.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedDeposit.firstName || ''} ${selectedDeposit.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedDeposit.email || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Transaction Details</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedDeposit.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedDeposit.amountToBeDeposited)}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Deposit Option:</span>
                    <span style={styles.fieldValue}>{selectedDeposit.depositOption || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedDeposit.dateApplied || 'N/A'}</span>
                  </div>

                  {selectedDeposit.dateApproved && (
                    <>
                      <div style={styles.sectionTitle}>Approval Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.dateApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.timeApproved}</span>
                      </div>
                    </>
                  )}

                  {selectedDeposit.dateRejected && (
                    <>
                      <div style={styles.sectionTitle}>Rejection Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.dateRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.timeRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.rejectionReason || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Proof of Deposit</div>
                  <div style={styles.imageGrid}>
                    {selectedDeposit.proofOfDepositUrl && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Proof of Deposit</p>
                        <img
                          src={selectedDeposit.proofOfDepositUrl}
                          alt="Proof of Deposit"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedDeposit.proofOfDepositUrl, 'Proof of Deposit', 0)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {selectedDeposit?.status !== 'approved' && selectedDeposit?.status !== 'rejected' && (
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
            <p style={styles.modalText}>Are you sure you want to approve this deposit?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this deposit?</p>
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

export default ApplyDeposits;