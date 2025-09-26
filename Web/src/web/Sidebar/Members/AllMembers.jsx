import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { database } from '../../../../../Database/firebaseConfig';

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
  statusActive: {
    color: 'green'
  },
  statusInactive: {
    color: 'red'
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
  savingsAmount: {
    color: 'green'
  },
  loansAmount: {
    color: '#2D5783' // Same blue as table header
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
  activateButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#3e8e41'
    }
  },
  deactivateButton: {
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
  bottomButtons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '16px',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eee'
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
  }
};

const AllMembers = ({ members, currentPage, totalPages, onPageChange, refreshData }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState([]);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [loansTotals, setLoansTotals] = useState({}); // memberId -> total current loans

  useEffect(() => {
    const fetchLoansTotals = async () => {
      try {
        const snap = await database.ref('Loans/CurrentLoans').once('value');
        const all = snap.val() || {};
        const totals = {};
        Object.entries(all).forEach(([memberId, loansObj]) => {
          const sum = Object.values(loansObj || {}).reduce((acc, l) => acc + (parseFloat(l.loanAmount) || 0), 0);
          totals[memberId] = Math.ceil(sum * 100) / 100;
        });
        setLoansTotals(totals);
      } catch (e) {
        console.error('Failed to fetch members loans totals:', e);
        setLoansTotals({});
      }
    };
    fetchLoansTotals();
  }, [members]);

  const formatNumber = (value) => {
    if (value === 0 || value === '0') return '0.00';
    if (!value) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
    setSuccessMessageModalVisible(false);
  };

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (selectedMember?.validIdFront) {
      images.push({ 
        url: selectedMember.validIdFront, 
        label: 'Valid ID Front' 
      });
    }
    if (selectedMember?.validIdBack) {
      images.push({ 
        url: selectedMember.validIdBack, 
        label: 'Valid ID Back' 
      });
    }
    if (selectedMember?.selfie) {
      images.push({ 
        url: selectedMember.selfie, 
        label: 'Selfie' 
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

  const toggleStatus = () => {
    setShowStatusConfirmation(true);
  };

  const confirmStatusChange = async () => {
    setShowStatusConfirmation(false);
    setActionInProgress(true);
    setIsProcessing(true);

    try {
      const newStatus = selectedMember.status === 'active' ? 'inactive' : 'active';
      
      // Update in Firebase Realtime Database
      await database.ref(`Members/${selectedMember.id}/status`).set(newStatus);
      
      setSuccessMessage(`Member successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setSuccessMessageModalVisible(true);
      
      // Update local state
      setSelectedMember(prev => ({
        ...prev,
        status: newStatus
      }));

      // Refresh the member list
      refreshData();
    } catch (error) {
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirmation(false);
  };

  if (!members || members.length === 0) return (
    // Show only the text, no container box
    <p style={styles.noDataMessage}>No member data available.</p>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Investment</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Savings</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loans</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Role</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{member.id || 'N/A'}</td>
                <td style={styles.tableCell}>{member.firstName + " "+ member.lastName || 'N/A'}</td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.savingsAmount
                }}>
                  ₱{formatNumber(member.investment)}
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.savingsAmount
                }}>
                  ₱{formatNumber(member.balance)}
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.loansAmount
                }}>
                  ₱{formatNumber(loansTotals[member.id] || 0)}
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...(member.status === 'active' ? styles.statusActive : styles.statusInactive)
                }}>
                  {member.status || 'N/A'}
                </td>
                <td style={{
                  ...styles.tableCell,
                  fontWeight: 'bold',
                  color: member.role === 'admin' ? '#d32f2f' : 
                         member.role === 'coadmin' ? '#f57c00' : '#2e7d32',
                  textTransform: 'capitalize'
                }}>
                  {member.role || 'Member'}
                </td>
                <td style={styles.tableCell}>
                  <span 
                    style={styles.viewText} 
                    onClick={() => openModal(member)}
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
              <h2 style={styles.modalTitle}>Member Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Personal Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedMember?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>First Name:</span>
                    <span style={styles.fieldValue}>{selectedMember?.firstName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Middle Name:</span>
                    <span style={styles.fieldValue}>{selectedMember?.middleName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Last Name:</span>
                    <span style={styles.fieldValue}>{selectedMember?.lastName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedMember?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedMember?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Gender:</span>
                    <span style={styles.fieldValue}>{selectedMember?.gender || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Civil Status:</span>
                    <span style={styles.fieldValue}>{selectedMember?.civilStatus || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date of Birth:</span>
                    <span style={styles.fieldValue}>{selectedMember?.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Age:</span>
                    <span style={styles.fieldValue}>{selectedMember?.age || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Birth Place:</span>
                    <span style={styles.fieldValue}>{selectedMember?.placeOfBirth || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Address:</span>
                    <span style={styles.fieldValue}>{selectedMember?.address || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Financial Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Savings Balance:</span>
                    <span style={{
                      ...styles.fieldValue,
                      ...styles.savingsAmount
                    }}>
                      ₱{formatNumber(selectedMember?.balance)}
                    </span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Total Loans:</span>
                    <span style={{
                      ...styles.fieldValue,
                      ...styles.loansAmount
                    }}>
                      ₱{formatNumber(selectedMember?.loans)}
                    </span>
                  </div>

                  <div style={styles.sectionTitle}>Membership Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Status:</span>
                    <span style={{
                      ...styles.fieldValue,
                      ...(selectedMember?.status === 'active' ? styles.statusActive : styles.statusInactive)
                    }}>
                      {selectedMember?.status || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Role:</span>
                    <span style={{
                      ...styles.fieldValue,
                      fontWeight: 'bold',
                      color: selectedMember?.role === 'admin' ? '#d32f2f' : 
                             selectedMember?.role === 'coadmin' ? '#f57c00' : '#2e7d32',
                      textTransform: 'capitalize'
                    }}>
                      {selectedMember?.role || 'Member'}
                    </span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Added:</span>
                    <span style={styles.fieldValue}>{selectedMember?.dateApproved || selectedMember?.dateAdded || 'N/A'}</span>
                  </div>
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Submitted Documents</div>
                  <div style={styles.imageGrid}>
                    {selectedMember?.validIdFront && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Valid ID Front</p>
                        <img
                          src={selectedMember.validIdFront}
                          alt="Valid ID Front"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedMember.validIdFront, 'Valid ID Front', 0)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                    {selectedMember?.validIdBack && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Valid ID Back</p>
                        <img
                          src={selectedMember.validIdBack}
                          alt="Valid ID Back"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedMember.validIdBack, 'Valid ID Back', 1)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                    {selectedMember?.selfie && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Selfie</p>
                        <img
                          src={selectedMember.selfie}
                          alt="Selfie"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedMember.selfie, 'Selfie', 2)}
                          onFocus={(e) => e.target.style.outline = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.bottomButtons}>
              <button
                style={{
                  ...styles.actionButton,
                  ...(selectedMember?.status === 'active' ? styles.deactivateButton : styles.activateButton),
                  ...(isProcessing ? styles.disabledButton : {})
                }}
                onClick={toggleStatus}
                disabled={isProcessing}
                onFocus={(e) => e.target.style.outline = 'none'}
              >
                {selectedMember?.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirmation && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>
              Are you sure you want to {selectedMember?.status === 'active' ? 'deactivate' : 'activate'} this member?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={confirmStatusChange}
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
                onClick={cancelStatusChange}
                disabled={actionInProgress}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Modal */}
      {successMessageModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
            <p style={styles.modalText}>{successMessage}</p>
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

      {/* Error Message Modal */}
      {errorModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
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

      {/* Loading Spinner */}
      {isProcessing && (
        <div style={styles.centeredModal}>
          <div style={styles.spinner}></div>
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

export default AllMembers;