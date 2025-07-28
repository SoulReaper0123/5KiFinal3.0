import React, { useState } from 'react';
import { FaTimesCircle, FaImage, FaTimes } from 'react-icons/fa';

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
  }
};

const RejectedDeposits = ({ deposits, currentPage, totalPages, onPageChange }) => {
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const openModal = (deposit) => {
    setSelectedDeposit(deposit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openImageViewer = (url, label) => {
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };

  if (!deposits.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No rejected deposits available.</p>
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
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Option</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Proof</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBeDeposited)}</td>
                <td style={styles.tableCell}>{item.depositOption}</td>
                <td style={styles.tableCell}>{item.dateApplied}</td>
                <td style={styles.tableCell}>
                  <span 
                    style={styles.viewText}
                    onClick={() => openImageViewer(item.proofOfDepositUrl, 'Proof of Deposit')}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    <FaImage /> View
                  </span>
                </td>
                <td style={{...styles.tableCell, ...styles.statusRejected}}>
                  <FaTimesCircle /> Rejected
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
              <h2 style={styles.modalTitle}>Deposit Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Transaction Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedDeposit?.amountToBeDeposited) || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Deposit Option:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.depositOption || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Reference Number:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.referenceNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.dateApplied || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Rejected:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.dateRejected || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Time Rejected:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.timeRejected || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Rejection Reason:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.rejectionReason || 'N/A'}</span>
                  </div>
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedDeposit?.firstName || ''} ${selectedDeposit?.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedDeposit?.phoneNumber || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Proof of Deposit</div>
                  {selectedDeposit?.proofOfDepositUrl && (
                    <div style={styles.imageBlock}>
                      <p style={styles.imageLabel}>Proof of Deposit</p>
                      <img
                        src={selectedDeposit.proofOfDepositUrl}
                        alt="Proof of Deposit"
                        style={styles.imageThumbnail}
                        onClick={() => openImageViewer(selectedDeposit.proofOfDepositUrl, 'Proof of Deposit')}
                        onFocus={(e) => e.target.style.outline = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default RejectedDeposits;