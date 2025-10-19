import React, { useState } from 'react';
import { 
  FaCheckCircle, 
  FaImage, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '1000px'
  },
  tableHeader: {
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
    color: 'white',
    height: '56px',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  tableHeaderCell: {
    padding: '1rem 0.75rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tableRow: {
    height: '52px',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  tableCell: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    justifyContent: 'center'
  },
  noDataContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem',
    color: '#6b7280'
  },
  noDataIcon: {
    fontSize: '3rem',
    opacity: '0.5'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '2rem',
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #F1F5F9'
  },
  modalHeader: {
    background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
      transform: 'rotate(90deg)'
    }
  },
  modalContent: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '1.5rem'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  section: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e2e8f0'
  },
  fieldGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    padding: '0.5rem 0'
  },
  fieldLabel: {
    fontWeight: '500',
    color: '#64748b',
    fontSize: '0.875rem',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#1f2937',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusApproved: {
    background: '#d1fae5',
    color: '#065f46'
  },
  statusRejected: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginTop: '1rem'
  },
  documentCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
    }
  },
  documentImage: {
    width: '100%',
    height: '120px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginBottom: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  documentLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
viewButton: {
  background: 'transparent',
  color: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: '6px',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center', // Add this
  gap: '0.25rem',
  transition: 'all 0.2s ease',
  width: '40%', // Add this to take full cell width
  margin: '0 auto', // Add this for extra centering
  '&:hover': {
    background: '#2563eb',
    color: 'white'
  }
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
    zIndex: 2000,
    padding: '2rem'
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
    borderRadius: '8px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  imageViewerLabel: {
    color: 'white',
    fontSize: '1.125rem',
    marginTop: '1rem',
    textAlign: 'center',
    fontWeight: '500'
  },
  imageViewerNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '1rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'translateY(-50%) scale(1.1)'
    }
  },
  prevButton: {
    left: '2rem'
  },
  nextButton: {
    right: '2rem'
  },
  imageViewerClose: {
    position: 'absolute',
    top: '2rem',
    right: '2rem',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'scale(1.1)'
    }
  },
  financialCard: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    border: '1px solid #6ee7b7',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  financialLabel: {
    fontSize: '0.875rem',
    color: '#065f46',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#065f46'
  },
  rejectionCard: {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  rejectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  rejectionLabel: {
    fontSize: '0.875rem',
    color: '#991b1b',
    fontWeight: '500'
  },
  rejectionValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#991b1b'
  }
};

const ApprovedDeposits = ({ deposits, currentPage, totalPages, onPageChange }) => {
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState([]);

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
      <div style={styles.noDataContainer}>
        <FaMoneyBillWave style={styles.noDataIcon} />
        <div>No approved deposits available</div>
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
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Deposit Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Mode of Deposit</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBeDeposited)}</td>
                <td style={styles.tableCell}>{item.depositOption}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    ...styles.statusApproved
                  }}>
                    approved
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <button 
                    style={styles.viewButton}
                    onClick={() => openModal(item)}
                  >
                    <FaEye />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deposit Details Modal */}
      {modalVisible && selectedDeposit && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaCheckCircle />
                Approved Deposit Details
              </h2>
              <button 
                style={styles.closeButton}
                onClick={closeModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.columnsContainer}>
                {/* Left Column - Member Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Member Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Member ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedDeposit.id || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Full Name:
                      </span>
                      <span style={styles.fieldValue}>
                        {selectedDeposit.firstName} {selectedDeposit.lastName}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedDeposit.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaCalendarAlt />
                      Application Timeline
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Date Applied:</span>
                      <span style={styles.fieldValue}>{selectedDeposit.dateApplied || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Date Approved:</span>
                      <span style={styles.fieldValue}>{selectedDeposit.dateApproved}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...styles.statusApproved
                      }}>
                        approved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Transaction & Documents */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Transaction Information
                    </h3>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Deposit Amount:</span>
                      <span style={styles.financialValue}>
                        {formatCurrency(selectedDeposit.amountToBeDeposited)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Transaction ID:</span>
                      <span style={styles.financialValue}>{selectedDeposit.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Mode of Deposit:</span>
                      <span style={styles.financialValue}>{selectedDeposit.depositOption || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Submitted Documents
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedDeposit.proofOfDepositUrl && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedDeposit.proofOfDepositUrl, 'Proof of Deposit', 0)}
                        >
                          <img
                            src={selectedDeposit.proofOfDepositUrl}
                            alt="Proof of Deposit"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Deposit</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {imageViewerVisible && (
        <div style={styles.imageViewerModal}>
          <div style={styles.imageViewerContent}>
            <button 
              style={{ ...styles.imageViewerNav, ...styles.prevButton }}
              onClick={() => navigateImages('prev')}
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
            >
              <FaChevronRight />
            </button>
            <button 
              style={styles.imageViewerClose} 
              onClick={closeImageViewer}
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

export default ApprovedDeposits;