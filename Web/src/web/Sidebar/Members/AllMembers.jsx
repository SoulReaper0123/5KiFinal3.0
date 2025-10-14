import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaPiggyBank,
  FaHandHoldingUsd,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaVenusMars,
  FaHeart,
  FaBirthdayCake
} from 'react-icons/fa';
import { database } from '../../../../../Database/firebaseConfig';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #2563eb',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
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
    textAlign: 'left',
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
    whiteSpace: 'nowrap'
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
    padding: '2rem'
  },
  modalCard: {
    background: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  closeButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.3)',
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
  savingsAmount: {
    color: '#059669'
  },
  loansAmount: {
    color: '#dc2626'
  },
  investmentAmount: {
    color: '#7c3aed'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusActive: {
    background: '#d1fae5',
    color: '#065f46'
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  roleBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  roleAdmin: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  roleCoadmin: {
    background: '#ffedd5',
    color: '#9a3412'
  },
  roleMember: {
    background: '#d1fae5',
    color: '#065f46'
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
  modalActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
    flexShrink: 0
  },
  actionButton: {
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    justifyContent: 'center'
  },
  activateButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
    }
  },
  deactivateButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
    }
  },
  disabledButton: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    opacity: '0.7',
    '&:hover': {
      transform: 'none',
      boxShadow: 'none'
    }
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
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#2563eb',
      color: 'white'
    }
  },
  alertModal: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  alertIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  successIcon: {
    color: '#10b981'
  },
  errorIcon: {
    color: '#dc2626'
  },
  warningIcon: {
    color: '#f59e0b'
  },
  alertTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#1f2937'
  },
  alertMessage: {
    color: '#6b7280',
    marginBottom: '2rem',
    lineHeight: '1.5'
  },
  alertActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem'
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
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #bae6fd',
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
    color: '#0369a1',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
    }
  },
  secondaryButton: {
    background: '#6b7280',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
    }
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
  const [loansTotals, setLoansTotals] = useState({});

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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
      
      await database.ref(`Members/${selectedMember.id}/status`).set(newStatus);
      
      setSuccessMessage(`Member successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setSuccessMessageModalVisible(true);
      
      setSelectedMember(prev => ({
        ...prev,
        status: newStatus
      }));

      refreshData();
    } catch (error) {
      setErrorMessage('Failed to update member status');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirmation(false);
  };

  if (!members || members.length === 0) return (
    <div style={styles.noDataContainer}>
      <FaUser style={styles.noDataIcon} />
      <div>No member data available</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Investment</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Savings</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loans</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <strong>{member.id || 'N/A'}</strong>
                </td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {member.firstName} {member.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {member.email}
                  </div>
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.financialValue,
                  ...styles.investmentAmount
                }}>
                  ₱{formatNumber(member.investment)}
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.financialValue,
                  ...styles.savingsAmount
                }}>
                  ₱{formatNumber(member.balance)}
                </td>
                <td style={{
                  ...styles.tableCell,
                  ...styles.financialValue,
                  ...styles.loansAmount
                }}>
                  ₱{formatNumber(loansTotals[member.id] || 0)}
                </td>

                <td style={styles.tableCell}>
                  <button 
                    style={styles.viewButton}
                    onClick={() => openModal(member)}
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

      {/* Member Details Modal */}
      {modalVisible && selectedMember && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaUser />
                Member Details - #{selectedMember.id}
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
                {/* Left Column - Personal Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Personal Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Full Name:
                      </span>
                      <span style={styles.fieldValue}>
                        {selectedMember.firstName} {selectedMember.middleName} {selectedMember.lastName}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.email}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaPhone />
                        Contact:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.phoneNumber}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaVenusMars />
                        Gender:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.gender}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaHeart />
                        Civil Status:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.civilStatus}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaCalendarAlt />
                      Background Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaBirthdayCake />
                        Date of Birth:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.dateOfBirth}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Age:</span>
                      <span style={styles.fieldValue}>{selectedMember.age}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMapMarkerAlt />
                        Birth Place:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.placeOfBirth}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMapMarkerAlt />
                        Address:
                      </span>
                      <span style={styles.fieldValue}>{selectedMember.address}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial & Documents */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Financial Summary
                    </h3>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Total Investment:</span>
                      <span style={{ ...styles.financialValue, ...styles.investmentAmount }}>
                        ₱{formatNumber(selectedMember.investment)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Savings Balance:</span>
                      <span style={{ ...styles.financialValue, ...styles.savingsAmount }}>
                        ₱{formatNumber(selectedMember.balance)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Active Loans:</span>
                      <span style={{ ...styles.financialValue, ...styles.loansAmount }}>
                        ₱{formatNumber(loansTotals[selectedMember.id] || 0)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Membership Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...(selectedMember.status === 'active' ? styles.statusActive : styles.statusInactive)
                      }}>
                        {selectedMember.status}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Role:</span>
                      <span style={{
                        ...styles.roleBadge,
                        ...(selectedMember.role === 'admin' ? styles.roleAdmin : 
                             selectedMember.role === 'coadmin' ? styles.roleCoadmin : styles.roleMember)
                      }}>
                        {selectedMember.role || 'Member'}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Date Joined:</span>
                      <span style={styles.fieldValue}>
                        {selectedMember.dateApproved || selectedMember.dateAdded}
                      </span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Submitted Documents
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedMember.validIdFront && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedMember.validIdFront, 'Valid ID Front', 0)}
                        >
                          <img
                            src={selectedMember.validIdFront}
                            alt="Valid ID Front"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Valid ID Front</div>
                        </div>
                      )}
                      {selectedMember.validIdBack && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedMember.validIdBack, 'Valid ID Back', 1)}
                        >
                          <img
                            src={selectedMember.validIdBack}
                            alt="Valid ID Back"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Valid ID Back</div>
                        </div>
                      )}
                      {selectedMember.selfie && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedMember.selfie, 'Selfie', 2)}
                        >
                          <img
                            src={selectedMember.selfie}
                            alt="Selfie"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Selfie</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...(selectedMember.status === 'active' ? styles.deactivateButton : styles.activateButton),
                  ...(isProcessing ? styles.disabledButton : {})
                }}
                onClick={toggleStatus}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent', 
                      borderTop: '2px solid white', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedMember.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.alertModal}>
            <FaExclamationCircle style={{ ...styles.alertIcon, ...styles.warningIcon }} />
            <h3 style={styles.alertTitle}>Confirm Status Change</h3>
            <p style={styles.alertMessage}>
              Are you sure you want to {selectedMember?.status === 'active' ? 'deactivate' : 'activate'} this member? 
              {selectedMember?.status === 'active' && ' The member will lose access to their account.'}
            </p>
            <div style={styles.alertActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.secondaryButton
                }}
                onClick={cancelStatusChange}
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  ...(selectedMember?.status === 'active' ? styles.deactivateButton : styles.activateButton)
                }}
                onClick={confirmStatusChange}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Modal */}
      {successMessageModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.alertModal}>
            <FaCheckCircle style={{ ...styles.alertIcon, ...styles.successIcon }} />
            <h3 style={styles.alertTitle}>Success</h3>
            <p style={styles.alertMessage}>{successMessage}</p>
            <div style={styles.alertActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }}
                onClick={closeModal}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Modal */}
      {errorModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.alertModal}>
            <FaExclamationCircle style={{ ...styles.alertIcon, ...styles.errorIcon }} />
            <h3 style={styles.alertTitle}>Error</h3>
            <p style={styles.alertMessage}>{errorMessage}</p>
            <div style={styles.alertActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }}
                onClick={() => setErrorModalVisible(false)}
              >
                Try Again
              </button>
            </div>
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

export default AllMembers;