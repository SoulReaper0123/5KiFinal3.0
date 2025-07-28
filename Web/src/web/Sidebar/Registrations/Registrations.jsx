import React, { useState } from 'react';
import { database, auth } from '../../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ApproveRegistration, RejectRegistration } from '../../../../../Server/api';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
  // New styles for rejection modal
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
  }
};

const rejectionReasons = [
  "Invalid ID documents",
  "Incomplete information",
  "Poor quality images",
  "Suspicious activity",
  "Other (please specify)"
];

const Registrations = ({ 
  registrations, 
  currentPage, 
  totalPages, 
  onPageChange,
  refreshData
}) => {
  const [selectedRegistration, setSelectedRegistration] = useState(null);
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
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

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

  const openModal = (registration) => {
    setSelectedRegistration(registration);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
  };

  const checkIfEmailExistsInDatabase = async (email) => {
    try {
      const snap = await database.ref('Members').once('value');
      const data = snap.val() || {};
      return Object.values(data).some(u => u.email?.toLowerCase() === email.toLowerCase());
    } catch (err) {
      console.error('DB email check error:', err);
      return false;
    }
  };

  const removeFromPendingRegistrations = async (id) => {
    try {
      await database.ref(`Registrations/RegistrationApplications/${id}`).remove();
    } catch (error) {
      console.error('Error removing from pending registrations:', error);
      throw error;
    }
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
    setSelectedReason('');
    setCustomReason('');
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

    const rejectionReason = selectedReason === "Other (please specify)" 
      ? customReason 
      : selectedReason;

    processAction(selectedRegistration, 'reject', rejectionReason);
    setShowRejectionModal(false);
  };

  const processAction = async (registration, action, rejectionReason = '') => {
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        const onDB = await checkIfEmailExistsInDatabase(registration.email);
        if (onDB) {
          setErrorMessage('This email is already registered as a member.');
          setErrorModalVisible(true);
          setIsProcessing(false);
          return;
        }
        
        const memberId = await processDatabaseApprove(registration);
        setSuccessMessage('Registration approved successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedRegistration(prev => ({
          ...prev,
          memberId,
          dateApproved: formatDate(new Date()),
          approvedTime: formatTime(new Date())
        }));
      } else {
        await processDatabaseReject(registration, rejectionReason);
        setSuccessMessage('Registration rejected successfully!');
        setSuccessMessageModalVisible(true);
        
        setSelectedRegistration(prev => ({
          ...prev,
          dateRejected: formatDate(new Date()),
          rejectedTime: formatTime(new Date()),
          rejectionReason
        }));
      }
      
      // await removeFromPendingRegistrations(registration.id);
      setIsProcessing(false);
      refreshData();
    } catch (error) {
      console.error('Error processing action:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
      setIsProcessing(false);
    }
  };

  const updateRegistrationStatus = async (id, status) => {
    try {
      await database.ref(`Registrations/RegistrationApplications/${id}/status`).set(status);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const processDatabaseApprove = async (reg) => {
    try {
      const { id, email, password, ...rest } = reg;
      let userId = null;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      } catch (authError) {
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError;
        }
      }

      const membersSnap = await database.ref('Members').once('value');
      const members = membersSnap.val() || {};
      
      let newId = 5001;
      const existingIds = Object.keys(members).map(Number).sort((a, b) => a - b);
      
      for (const id of existingIds) {
        if (id === newId) newId++;
        else if (id > newId) break;
      }
      
      const now = new Date();
      const approvedDate = formatDate(now);
      const approvedTime = formatTime(now);
      
      await database.ref(`Members/${newId}`).set({
        id: newId,
        authUid: userId,
        ...rest,
        email,
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        balance: 0.0,
        loans: 0.0,
        status: 'active'
      });
      
      await database.ref(`Registrations/ApprovedRegistrations/${id}`).set({
        ...rest,
        email,
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        memberId: newId,
        status: 'approved'
      });
      
      return newId;
    } catch (err) {
      console.error('Approval DB error:', err);
      throw new Error(err.message || 'Failed to approve registration');
    }
  };

  const processDatabaseReject = async (reg, rejectionReason) => {
    try {
      const { id, ...rest } = reg;
      const now = new Date();
      const rejectedDate = formatDate(now);
      const rejectedTime = formatTime(now);
      
      await database.ref(`Registrations/RejectedRegistrations/${id}`).set({
        ...rest,
        dateRejected: rejectedDate,
        rejectedTime: rejectedTime,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by admin'
      });
    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject registration');
    }
  };

  const callApiApprove = async (reg) => {
    try {
      const response = await ApproveRegistration({
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        dateApproved: reg.dateApproved,
        approvedTime: reg.approvedTime,
        memberId: reg.memberId
      });
      
      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (reg) => {
    try {
      const response = await RejectRegistration({
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        dateRejected: reg.dateRejected,
        rejectedTime: reg.rejectedTime,
        rejectionReason: reg.rejectionReason || 'Rejected by admin'
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
    
    if (currentAction === 'approve') {
      callApiApprove(selectedRegistration).catch(err => console.error('Background API error:', err));
    } else {
      callApiReject(selectedRegistration).catch(err => console.error('Background API error:', err));
    }
    
    setSelectedRegistration(null);
    setCurrentAction(null);
  };

  const openImageViewer = (url, label, index) => {
    setCurrentImage({ url, label });
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };

  const navigateImages = (direction) => {
    const images = [
      { url: selectedRegistration?.validIdFront, label: 'Valid ID Front' },
      { url: selectedRegistration?.validIdBack, label: 'Valid ID Back' },
      { url: selectedRegistration?.selfie, label: 'Selfie' },
      { url: selectedRegistration?.selfieWithId, label: 'Selfie with ID' },
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

  if (!registrations.length) return (
    <div style={styles.loadingView}>
      <p style={styles.noDataMessage}>No registration applications available.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '22%' }}>Email</th>
              <th style={{ ...styles.tableHeaderCell, width: '14%' }}>Contact</th>
              <th style={{ ...styles.tableHeaderCell, width: '14%' }}>First Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '14%' }}>Last Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '14%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.email || ''}</td>
                <td style={styles.tableCell}>{item.phoneNumber || ''}</td>
                <td style={styles.tableCell}>{item.firstName || ''}</td>
                <td style={styles.tableCell}>{item.lastName || ''}</td>
                <td style={styles.tableCell}>{item.dateCreated || ''}</td>
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
              <h2 style={styles.modalTitle}>Registration Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Personal Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>First Name:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.firstName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Middle Name:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.middleName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Last Name:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.lastName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Gender:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.gender || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Civil Status:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.civilStatus || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date of Birth:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Age:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.age || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Birth Place:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.placeOfBirth || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Address:</span>
                    <span style={styles.fieldValue}>{selectedRegistration?.address || 'N/A'}</span>
                  </div>

                  {selectedRegistration?.dateApproved && (
                    <>
                      <div style={styles.sectionTitle}>Approval Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.dateApproved}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Approved:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.approvedTime}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Member ID:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.memberId || 'N/A'}</span>
                      </div>
                    </>
                  )}

                  {selectedRegistration?.dateRejected && (
                    <>
                      <div style={styles.sectionTitle}>Rejection Information</div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.dateRejected}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Time Rejected:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.rejectedTime}</span>
                      </div>
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedRegistration.rejectionReason || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Submitted Documents</div>
                  <div style={styles.imageGrid}>
                    {selectedRegistration?.validIdFront && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Valid ID Front</p>
                        <img
                          src={selectedRegistration.validIdFront}
                          alt="Valid ID Front"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedRegistration.validIdFront, 'Valid ID Front', 0)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                    {selectedRegistration?.validIdBack && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Valid ID Back</p>
                        <img
                          src={selectedRegistration.validIdBack}
                          alt="Valid ID Back"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedRegistration.validIdBack, 'Valid ID Back', 1)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                    {selectedRegistration?.selfie && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Selfie</p>
                        <img
                          src={selectedRegistration.selfie}
                          alt="Selfie"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedRegistration.selfie, 'Selfie', 2)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                    {selectedRegistration?.selfieWithId && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Selfie with ID</p>
                        <img
                          src={selectedRegistration.selfieWithId}
                          alt="Selfie with ID"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedRegistration.selfieWithId, 'Selfie with ID', 3)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {selectedRegistration?.status !== 'approved' && selectedRegistration?.status !== 'rejected' && (
              <div style={styles.bottomButtons}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton
                  }}
                  onClick={() => processAction(selectedRegistration, 'approve')}
                  onFocus={(e) => e.target.style.outline = 'none'}
                >
                  Approve
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.rejectButton
                  }}
                  onClick={handleRejectClick}
                  onFocus={(e) => e.target.style.outline = 'none'}
                >
                  Reject
                </button>
              </div>
            )}
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
              onClick={closeModal}
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

export default Registrations;