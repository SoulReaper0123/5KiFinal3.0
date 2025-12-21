import React, { useState, useEffect } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveLoans, RejectLoans } from '../../../../../Server/api';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSpinner,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFileInvoiceDollar,
  FaHandHoldingUsd,
  FaClock,
  FaPercentage,
  FaQrcode, 
  FaPlus,
  FaFileContract
} from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
loadingOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1500,
  backdropFilter: 'blur(4px)',
},
spinner: {
  border: '3px solid rgba(59, 130, 246, 0.3)',
  borderTop: '3px solid #3B82F6',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  animation: 'spin 1s linear infinite'
},
loadingContent: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '14px',
},
loadingText: {
  color: 'white',
  fontSize: '14px',
  fontWeight: '500'
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
    textAlign: 'center'
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
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
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
  statusPending: {
    background: '#fef3c7',
    color: '#92400e'
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
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  },
  approveButton: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
    }
  },
  rejectButton: {
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
  modalCardSmall: {
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  confirmIcon: {
    marginBottom: '14px',
    fontSize: '28px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '18px',
    textAlign: 'center',
    color: '#475569',
    lineHeight: '1.5',
    fontWeight: '500'
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
    borderRadius: '12px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    border: '1px solid #F1F5F9'
  },
  rejectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#1e3a8a',
    textAlign: 'center'
  },
  reasonOption: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    padding: '0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  reasonRadio: {
    marginRight: '0.75rem'
  },
  reasonText: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#374151'
  },
  customReasonInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  rejectionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    gap: '0.75rem'
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f9fafb'
    }
  },
  confirmRejectButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626'
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
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
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
  },
  infoModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000
  },
  infoModalCard: {
    width: '340px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  infoTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: '1rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.5rem 0'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#555',
    fontSize: '0.875rem'
  },
  infoValue: {
    color: '#333',
    fontSize: '0.875rem',
    maxWidth: '60%',
    wordBreak: 'break-word',
    textAlign: 'right'
  },
  infoCloseButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#1e3a8a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#1e40af'
    }
  },
  enhancedConfirmationModal: {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '32px',
  width: '500px',
  maxWidth: '90%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  textAlign: 'center',
  border: '1px solid #F1F5F9'
},
confirmationTitle: {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1e3a8a',
  marginBottom: '16px'
},
confirmationText: {
  fontSize: '16px',
  color: '#374151',
  marginBottom: '24px',
  lineHeight: '1.5'
},
confirmationButtons: {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center'
},
attachmentSection: {
  margin: '20px 0',
  textAlign: 'left'
},
attachmentLabel: {
  fontWeight: '600',
  display: 'block',
  marginBottom: '4px',
  color: '#374151'
},
attachmentDescription: {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '16px'
},
fileUploadArea: {
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: '#fafafa',
  minHeight: '120px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff'
  }
},
fileInput: {
  display: 'none'
},
uploadText: {
  fontSize: '16px',
  color: '#374151',
  fontWeight: '500',
  margin: 0
},
fileTypes: {
  fontSize: '14px',
  color: '#6b7280',
  margin: 0
},
filePreview: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0'
},
fileInfo: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
},
fileDetails: {
  display: 'flex',
  flexDirection: 'column'
},
fileName: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  margin: 0
},
fileSize: {
  fontSize: '12px',
  color: '#6b7280',
  margin: 0
},
removeFileButton: {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#dc2626',
  borderRadius: '8px',
  padding: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#fee2e2'
  }
},
uploadingIndicator: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '12px',
  padding: '12px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #dbeafe'
},
uploadingText: {
  fontSize: '14px',
  color: '#1e40af',
  fontWeight: '500'
},
  // Add these new styles:
  enhancedConfirmationModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '500px',
    maxWidth: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  confirmationTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: '16px'
  },
  confirmationText: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  confirmationButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  attachmentSection: {
    margin: '20px 0',
    textAlign: 'left'
  },
  attachmentLabel: {
    fontWeight: '600',
    display: 'block',
    marginBottom: '4px',
    color: '#374151'
  },
  attachmentDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px'
  },
  fileUploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f0f9ff'
    }
  },
  fileInput: {
    display: 'none'
  },
  uploadText: {
    fontSize: '16px',
    color: '#374151',
    fontWeight: '500',
    margin: 0
  },
  fileTypes: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  filePreview: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  fileSize: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  removeFileButton: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#fee2e2'
    }
  },
  uploadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #dbeafe'
  },
  uploadingText: {
    fontSize: '14px',
    color: '#1e40af',
    fontWeight: '500'
  },
};

// Add keyframes for spinner animation
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = spinKeyframes;
  if (!document.head.querySelector('style[data-spin-keyframes]')) {
    styleSheet.setAttribute('data-spin-keyframes', 'true');
    document.head.appendChild(styleSheet);
  }
}

const rejectionReasons = [
  "No deposit transactions made on account",
  "Insufficient funds (below ₱5,000 threshold)",
  "Existing unpaid loan balance",
  "Suspicious activity",
  "Other"
];

const ApplyLoans = ({ 
  loans, 
  currentPage, 
  totalPages, 
  onPageChange, 
  refreshData 
}) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
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
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [justCompletedAction, setJustCompletedAction] = useState(false);
  const [memberBalance, setMemberBalance] = useState(null);
  const [memberInvestment, setMemberInvestment] = useState(null);
  const [existingLoanInfo, setExistingLoanInfo] = useState({ hasExisting: false, outstanding: 0 });

// Add these to your existing state declarations
const [approvalAttachmentFile, setApprovalAttachmentFile] = useState(null);
const [approvalAttachmentUrl, setApprovalAttachmentUrl] = useState('');
const [attachmentUploading, setAttachmentUploading] = useState(false);

// Add these functions after your existing handlers

// Handle file selection
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      setErrorModalVisible(true);
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only JPG, PNG, and PDF files are allowed');
      setErrorModalVisible(true);
      return;
    }
    
    setApprovalAttachmentFile(file);
  }
};

// Remove selected file
const removeApprovalAttachment = () => {
  setApprovalAttachmentFile(null);
  setApprovalAttachmentUrl('');
};

// Add this function to upload files
const uploadApprovalAttachment = async (file, loanId, transactionId) => {
  try {
    setAttachmentUploading(true);
    
    // Generate unique filename
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const fileName = `loan_approval_attachments/${loanId}_${transactionId}_${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storage = getStorage();
    const fileRef = storageRef(storage, fileName);
    
    // Upload file
    const snapshot = await uploadBytes(fileRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    setApprovalAttachmentUrl(downloadURL);
    setAttachmentUploading(false);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading approval attachment:', error);
    setAttachmentUploading(false);
    throw new Error('Failed to upload attachment: ' + error.message);
  }
};

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

  const openModal = async (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);

    try {
      const balanceSnap = await database.ref(`Members/${loan.id}/balance`).once('value');
      const balance = parseFloat(balanceSnap.val()) || 0;
      setMemberBalance(balance);

      const investmentSnap = await database.ref(`Members/${loan.id}/investment`).once('value');
      const investment = parseFloat(investmentSnap.val()) || 0;
      setMemberInvestment(investment);

      const currentLoansSnap = await database.ref(`Loans/CurrentLoans/${loan.id}`).once('value');
      let hasExisting = false;
      let outstanding = 0;

      if (currentLoansSnap.exists()) {
        hasExisting = true;
        const loansObj = currentLoansSnap.val() || {};
        Object.values(loansObj).forEach(l => {
          const totalTermPayment = parseFloat(l.totalTermPayment) || 0;
          const amountPaid = parseFloat(l.amountPaid) || 0;
          const paymentsMade = parseFloat(l.paymentsMade) || 0;
          const perMonth = parseFloat(l.totalMonthlyPayment) || 0;
          let remaining = totalTermPayment - amountPaid;
          if (!isFinite(remaining) || remaining <= 0) {
            const term = parseFloat(l.term) || 0;
            remaining = Math.max(0, (perMonth * Math.max(0, term - paymentsMade)));
          }
          outstanding += Math.max(0, remaining);
        });
      }

      setExistingLoanInfo({ hasExisting, outstanding: Math.round(outstanding * 100) / 100 });
    } catch (e) {
      console.error('Failed fetching member financials:', e);
      setMemberBalance(null);
      setMemberInvestment(null);
      setExistingLoanInfo({ hasExisting: false, outstanding: 0 });
    }
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

const confirmApprove = async (attachmentUrl = '') => {
  setShowApproveConfirmation(false);
  // Use the passed URL or fallback to state
  const urlToUse = attachmentUrl || approvalAttachmentUrl;
  await processAction(selectedLoan, 'approve', '', urlToUse); 
};

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    if (reason !== "Other") {
      setCustomReason('');
    }
  };

  const confirmRejection = () => {
    if (!selectedReason) {
      setErrorMessage('Please select a rejection reason');
      setErrorModalVisible(true);
      return;
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      setErrorMessage('Please specify the rejection reason');
      setErrorModalVisible(true);
      return;
    }

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedLoan, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

const processAction = async (loan, action, rejectionReason = '', attachmentUrl = '') => {
  // Show loading immediately
  setActionInProgress(true);
  setIsProcessing(true);
  setCurrentAction(action);

  try {
    if (action === 'approve') {
      const { id, loanAmount } = loan;
      const requestedAmount = parseFloat(loanAmount);

      // 1. Fetch current funds
      const fundsSnap = await database.ref('Settings/Funds').once('value');
      const currentFunds = parseFloat(fundsSnap.val()) || 0;

      // 2. Fetch member balance
      const memberSnap = await database.ref(`Members/${id}`).once('value');
      const memberBalance = parseFloat(memberSnap.child('balance').val()) || 0;

      // CORRECTED: Member pays what they can, funds covers the rest
      const memberContribution = Math.min(memberBalance, requestedAmount);
      const fundsContribution = Math.max(0, requestedAmount - memberContribution);

      // Check if funds can cover their share
      if (fundsContribution > currentFunds) {
        throw new Error(`Cannot approve loan. Insufficient funds. Funds needed: ${formatCurrency(fundsContribution)}, Available funds: ${formatCurrency(currentFunds)}`);
      }

      console.log('📊 DEBUG: Loan approval breakdown:', {
        loanAmount: formatCurrency(requestedAmount),
        memberBalanceBefore: formatCurrency(memberBalance),
        memberContribution: formatCurrency(memberContribution),
        memberBalanceAfter: formatCurrency(memberBalance - memberContribution),
        fundsBefore: formatCurrency(currentFunds),
        fundsContribution: formatCurrency(fundsContribution),
        fundsAfter: formatCurrency(currentFunds - fundsContribution)
      });

      // Proceed with approval
      setSuccessMessage('Loan approved successfully!');

      const approveData = {
        ...loan,
        dateApproved: formatDate(new Date()),
        timeApproved: formatTime(new Date()),
        ...(attachmentUrl && { proofOfTransactionUrl: attachmentUrl })
      };

      setSelectedLoan(prev => ({
        ...prev,
        dateApproved: approveData.dateApproved,
        timeApproved: approveData.timeApproved,
        status: 'approved',
        ...(attachmentUrl && { proofOfTransactionUrl: attachmentUrl })
      }));

      // Store the breakdown for payment processing
      setPendingApiCall({
        type: 'approve',
        data: approveData,
        deductBalance: memberContribution,  // From member balance
        deductFunds: fundsContribution,     // From funds (only funds portion)
        savingsAmount: 0,
        attachmentUrl: attachmentUrl || ''
      });

      // Show success modal
      setSuccessMessageModalVisible(true);
    } else {
      // Reject logic (unchanged)
      setSuccessMessage('Loan rejected successfully!');

      const rejectData = {
        ...loan,
        dateRejected: formatDate(new Date()),
        timeRejected: formatTime(new Date()),
        rejectionReason
      };

      setSelectedLoan(prev => ({
        ...prev,
        dateRejected: rejectData.dateRejected,
        timeRejected: rejectData.timeRejected,
        rejectionReason,
        status: 'rejected'
      }));

      setPendingApiCall({
        type: 'reject',
        data: rejectData
      });

      setSuccessMessageModalVisible(true);
    }
  } catch (error) {
    console.error('Error preparing action:', error);
    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false);
    setActionInProgress(false);
  }
};

const processDatabaseApprove = async (loan, deductBalance, deductFunds, savingsAmount, attachmentUrl = '') => {
  try {
    console.log('🚀 DEBUG: Starting database approval for loan application');
    console.log('📎 DEBUG: Attachment URL:', attachmentUrl || 'No attachment');
    
    const { id, transactionId, term, loanAmount } = loan;

    // Database references
    const loanRef = database.ref(`Loans/LoanApplications/${id}/${transactionId}`);
    const memberBalanceRef = database.ref(`Members/${id}/balance`);
    const memberRef = database.ref(`Members/${id}`);

    // Fetch all data in parallel
    const [loanSnap, memberBalanceSnap, memberSnap] = await Promise.all([
      loanRef.once('value'),
      memberBalanceRef.once('value'),
      memberRef.once('value')
    ]);

    // Validate loan data exists
    if (!loanSnap.exists()) {
      throw new Error('Loan application data not found in database.');
    }

    if (!memberSnap.exists()) {
      throw new Error('Member data not found in database.');
    }

    // Get values
    const loanData = loanSnap.val();
    const memberData = memberSnap.val();
    const currentMemberBalance = parseFloat(memberBalanceSnap.val()) || 0;
    const requestedAmount = parseFloat(loanAmount || loanData.loanAmount) || 0;

    console.log('📊 DEBUG: Loan approval initial values:', {
      memberId: id,
      memberName: `${memberData.firstName || ''} ${memberData.lastName || ''}`,
      currentMemberBalance: formatCurrency(currentMemberBalance),
      loanAmount: formatCurrency(requestedAmount)
    });

    // DIRECT DEDUCTION: Reduce member balance by loan amount
    const newMemberBalance = Math.round((currentMemberBalance - requestedAmount) * 100) / 100;
    
    console.log('🧮 DEBUG: Direct deduction calculation:', {
      oldMemberBalance: formatCurrency(currentMemberBalance),
      deduction: formatCurrency(requestedAmount),
      newMemberBalance: formatCurrency(newMemberBalance)
    });

    // Get loan type and term for interest rate
    const loanTypeKey = String(loanData.loanType || '').trim();
    const termKeyRaw = String(loanData.term ?? '').trim();
    const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
    const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);

    // Fetch Funds, Processing Fee, and interest rate in parallel
    const fundsRef = database.ref('Settings/Funds');
    const processingFeeRef = database.ref('Settings/ProcessingFee');
    
    const [fundsSnap, feeSnap] = await Promise.all([
      fundsRef.once('value'),
      processingFeeRef.once('value'),
    ]);

    // Find interest rate for this loan type and term
    let interestRateRaw = null;
    for (const tKey of termKeys) {
      const interestSnap = await database.ref(`Settings/LoanTypes/${loanTypeKey}/${tKey}`).once('value');
      const val = interestSnap.val();
      if (val !== null && val !== undefined && val !== '') {
        interestRateRaw = val;
        break;
      }
    }
    
    // If still not found, check old interest rate structure
    if (interestRateRaw === null) {
      for (const tKey of termKeys) {
        const fallbackSnap = await database.ref(`Settings/InterestRate/${tKey}`).once('value');
        const fallbackVal = fallbackSnap.val();
        if (fallbackVal !== null && fallbackVal !== undefined && fallbackVal !== '') {
          interestRateRaw = fallbackVal;
          break;
        }
      }
    }

    if (interestRateRaw === null) {
      throw new Error(`Missing interest rate for loan type "${loanTypeKey}" and term ${termKeys[0] || loanData.term} months. Please configure it in Settings.`);
    }

    // Calculate all financial values
    const interestRatePercentage = parseFloat(interestRateRaw);
    const interestRateDecimal = interestRatePercentage / 100;
    const amount = parseFloat(loanData.loanAmount || requestedAmount);
    const termMonths = parseInt(loanData.term) || 1;
    const currentFunds = parseFloat(fundsSnap.val()) || 0;
    const processingFee = parseFloat(feeSnap.val()) || 0;

    const interestPerTerm = amount * interestRateDecimal;
    const totalInterest = interestPerTerm * termMonths;
    const totalTermPayment = amount + totalInterest;
    const totalMonthlyPayment = totalTermPayment / termMonths;
    const monthlyPrincipal = amount / termMonths;
    const releaseAmount = Math.max(0, amount - processingFee);

    // Validate funds availability
    if (amount > currentFunds) {
      throw new Error(`Cannot approve loan. Insufficient funds in cooperative. Loan amount: ${formatCurrency(amount)}, Available funds: ${formatCurrency(currentFunds)}`);
    }

    // Calculate new funds amount (deduct FULL loan amount)
    const newFundsAmount = Math.max(0, Math.ceil((currentFunds - amount) * 100) / 100);

    // Date calculations
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30);

    const approvalDate = formatDate(now);
    const approvalTime = formatTime(now);
    const formattedDueDate = formatDate(dueDate);

    console.log('💰 DEBUG: Financial calculations:', {
      interestRate: `${interestRatePercentage}%`,
      interestPerTerm: formatCurrency(interestPerTerm),
      totalInterest: formatCurrency(totalInterest),
      totalTermPayment: formatCurrency(totalTermPayment),
      monthlyPayment: formatCurrency(totalMonthlyPayment),
      processingFee: formatCurrency(processingFee),
      releaseAmount: formatCurrency(releaseAmount),
      dueDate: formattedDueDate,
      fundsBefore: formatCurrency(currentFunds),
      fundsAfter: formatCurrency(newFundsAmount)
    });

    // Generate new transaction IDs
    const originalTransactionId = transactionId || loanData.transactionId;
    const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

    // Database references for new records
    const approvedRef = database.ref(`Loans/ApprovedLoans/${id}/${newTransactionId}`);
    const transactionRef = database.ref(`Transactions/Loans/${id}/${newTransactionId}`);
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${newTransactionId}`);
    const memberLoanRef = database.ref(`Members/${id}/loans/${newTransactionId}`);
  

    // Prepare approved loan data - SIMPLIFIED
    const approvedData = {
      // Original loan data
      ...loanData,
      
      // Transaction IDs
      transactionId: newTransactionId,
      originalTransactionId: originalTransactionId,
      
      // Financial calculations
      interestRate: interestRatePercentage,
      interest: Math.round(interestPerTerm * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      monthlyPayment: Math.round(monthlyPrincipal * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      totalTermPayment: Math.round(totalTermPayment * 100) / 100,
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      processingFee: processingFee,
      
      // Dates and status
      dateApproved: approvalDate,
      timeApproved: approvalTime,
      timestamp: now.getTime(),
      dueDate: formattedDueDate,
      status: 'approved',
      
      // Payment tracking
      paymentsMade: 0,
      amountPaid: 0,
      remainingBalance: Math.round(totalTermPayment * 100) / 100,
      loanAmount: amount,
      
      // SIMPLIFIED: No contribution tracking
      totalOwed: Math.round(totalTermPayment * 100) / 100,
      originalLoanAmount: amount,
      
      // Attachment if provided
      proofOfTransactionUrl: attachmentUrl || null,
      
      // Member information
      id: id,
      email: loanData.email || memberData.email,
      firstName: loanData.firstName || memberData.firstName,
      lastName: loanData.lastName || memberData.lastName
    };

    console.log('📝 DEBUG: Prepared approved loan data:', approvedData);

    // === START DATABASE TRANSACTIONS ===

    // 1. Create approved loan record
    console.log('💾 Step 1: Creating approved loan record...');
    await approvedRef.set(approvedData);
    
    // 2. Create transaction record
    console.log('💾 Step 2: Creating transaction record...');
    await transactionRef.set(approvedData);
    
    // 3. Create current loan record
    console.log('💾 Step 3: Creating current loan record...');
    await currentLoanRef.set(approvedData);
    
    // 4. Create member loan record
    console.log('💾 Step 4: Creating member loan record...');
    await memberLoanRef.set(approvedData);

    // 5. Update member's balance (DIRECT DEDUCTION)
    console.log('💾 Step 5: Updating member balance (direct deduction)...');
    await memberBalanceRef.set(newMemberBalance);

    // 6. Update Funds (deduct FULL loan amount)
    console.log('💾 Step 6: Updating Funds...');
    await fundsRef.set(newFundsAmount);

    // 7. Record funds history
    console.log('💾 Step 7: Recording funds history...');
    const fundsTimestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
    const fundsHistoryRef = database.ref(`Settings/FundsHistory/${fundsTimestamp}`);
    await fundsHistoryRef.set(newFundsAmount);

    // 8. Add processing fee to Savings
    console.log('💾 Step 8: Adding processing fee to Savings...');
    const savingsRef = database.ref('Settings/Savings');
    const savingsHistoryRef = database.ref('Settings/SavingsHistory');
    const dateKey = now.toISOString().split('T')[0];

    const [savingsSnap, currentDaySavingsSnap] = await Promise.all([
      savingsRef.once('value'),
      savingsHistoryRef.child(dateKey).once('value')
    ]);

    const currentSavings = parseFloat(savingsSnap.val()) || 0;
    const newSavingsAmount = Math.ceil((currentSavings + processingFee) * 100) / 100;
    await savingsRef.set(newSavingsAmount);

    // 9. Update daily SavingsHistory
    console.log('💾 Step 9: Updating Savings history...');
    const currentDaySavings = parseFloat(currentDaySavingsSnap.val()) || 0;
    const newDaySavings = Math.ceil((currentDaySavings + processingFee) * 100) / 100;
    await savingsHistoryRef.child(dateKey).set(newDaySavings);

    // 10. Record loan-specific savings entry
    console.log('💾 Step 10: Recording loan processing fee...');
    const loanSavingsHistoryRef = database.ref(`Settings/SavingsHistory/Loans/${newTransactionId}`);
    await loanSavingsHistoryRef.set({
      amount: processingFee,
      date: dateKey,
      loanId: newTransactionId,
      memberId: id,
      memberName: `${memberData.firstName || ''} ${memberData.lastName || ''}`,
      type: 'processing_fee'
    });

    // 11. Remove the original loan application
    console.log('💾 Step 11: Removing loan application...');
    await loanRef.remove();

    console.log(`✅ DEBUG: Loan approval completed successfully!`);
    console.log('📊 FINAL SUMMARY:');
    console.log(`   Member: ${memberData.firstName || ''} ${memberData.lastName || ''}`);
    console.log(`   Loan Amount: ${formatCurrency(amount)}`);
    console.log(`   Member balance deducted: ${formatCurrency(amount)}`);
    console.log(`   New member balance: ${formatCurrency(newMemberBalance)}`);
    console.log(`   New Funds amount: ${formatCurrency(newFundsAmount)}`);
    console.log(`   Processing fee added to Savings: ${formatCurrency(processingFee)}`);
    console.log(`   Loan ID: ${newTransactionId}`);

    return { success: true, transactionId: newTransactionId, approvedData };

  } catch (err) {
    console.error('❌ CRITICAL ERROR in loan approval:', {
      error: err.message,
      stack: err.stack,
      loanData: loan,
      memberId: loan?.id
    });
    throw new Error(`Failed to approve loan: ${err.message}`);
  }
};


  const processDatabaseReject = async (loan, rejectionReason) => {
    try {
      const now = new Date();
      const rejectionDate = formatDate(now);
      const rejectionTime = formatTime(now);
      const status = 'rejected';

      const originalTransactionId = loan.transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const loanRef = database.ref(`Loans/LoanApplications/${loan.id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Loans/RejectedLoans/${loan.id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Loans/${loan.id}/${newTransactionId}`);

      const rejectedLoan = { 
        ...loan, 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        timestamp: now.getTime(),
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedLoan);
      await transactionRef.set(rejectedLoan);

      await loanRef.remove();

    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject loan');
    }
  };

const callApiApprove = async (loan, attachmentUrl = '') => {
    try {
      const now = new Date();

      const toNumber = (v) => {
        if (v === null || v === undefined) return NaN;
        const s = String(v).replace(/,/g, '').trim();
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : NaN;
      };
      const toInt = (v) => {
        if (v === null || v === undefined) return NaN;
        const s = String(v).replace(/[^0-9]/g, '');
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : NaN;
      };

      const loanTypeKey = String(loan.loanType || '').trim();
      const termKeyRaw = String(loan.term ?? '').trim();
      const termKeyInt = termKeyRaw ? String(parseInt(termKeyRaw, 10)) : '';
      const termKeys = Array.from(new Set([termKeyRaw, termKeyInt])).filter(Boolean);

      let interestRateRaw = null;
      for (const tKey of termKeys) {
        const snap = await database.ref(`Settings/LoanTypes/${loanTypeKey}/${tKey}`).once('value');
        const val = snap.val();
        if (val !== null && val !== undefined && val !== '') {
          interestRateRaw = val;
          break;
        }
      }
      if (interestRateRaw === null) {
        const fallbackSnap = await database.ref(`Settings/InterestRate/${termKeyInt || termKeyRaw}`).once('value');
        const fallbackVal = fallbackSnap.val();
        if (fallbackVal !== null && fallbackVal !== undefined && fallbackVal !== '') {
          interestRateRaw = fallbackVal;
        }
      }

      const interestRatePercentage = toNumber(interestRateRaw);
      const interestRate = Number.isFinite(interestRatePercentage) ? interestRatePercentage / 100 : NaN;

      const amount = toNumber(loan.loanAmount);
      const termMonths = toInt(loan.term);

      const processingFeeSnap = await database.ref('Settings/ProcessingFee').once('value');
      const processingFee = toNumber(processingFeeSnap.val());

      if (!Number.isFinite(interestRate) || !Number.isFinite(amount) || !Number.isFinite(termMonths) || termMonths <= 0 || !Number.isFinite(processingFee)) {
        throw new Error('Missing or invalid settings/data for email payload calculation.');
      }

      const monthlyPrincipal = amount / termMonths;
      const interestPerTerm = amount * interestRate;
      const totalInterest = interestPerTerm * termMonths;
      const totalTermPayment = amount + totalInterest;
      const totalMonthlyPayment = totalTermPayment / termMonths;
      const releaseAmount = amount - processingFee;

      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 30);

      const response = await ApproveLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: amount.toFixed(2),
        term: termMonths,
        dateApproved: loan.dateApproved || formatDate(now),
        timeApproved: loan.timeApproved || formatTime(now),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
        status: 'approved',
        interestRate: (interestRate * 100).toFixed(2) + '%',
        interest: (amount * interestRate).toFixed(2),
        totalInterest: totalInterest.toFixed(2), 
        monthlyPayment: monthlyPrincipal.toFixed(2),
        totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
        totalTermPayment: totalTermPayment.toFixed(2),
        releaseAmount: releaseAmount.toFixed(2),
        processingFee: processingFee.toFixed(2),
        dueDate: formatDate(dueDate),
          proofOfTransactionUrl: attachmentUrl || null 
      });

      if (!response.ok) {
        console.error('Failed to send approval email');
      }
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (loan) => {
    try {
      const now = new Date();
      
      let rejectionMessage = '';
      if (loan.rejectionReason.includes('No deposit transactions')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to our records showing that no deposit transactions have been made on your account since you joined our platform. Maintaining an active deposit history is one of the key requirements for loan eligibility. 

We encourage you to begin transacting with your account so you may be eligible for future loan applications. Thank you.`;
      } 
      else if (loan.rejectionReason.includes('Insufficient funds')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to your account's current maintaining balance falling below the required threshold of ₱5,000. As part of our eligibility criteria, a minimum maintaining balance is necessary to ensure financial stability and responsible borrowing.

We highly encourage you to review your account status and consider making a deposit to maintain eligibility in the future. You may reapply once your account meets the required balance and we'll be happy to reassess your application.`;
      }
      else if (loan.rejectionReason.includes('Existing unpaid loan')) {
        rejectionMessage = `We appreciate your interest in applying for a loan with us. After careful review, we regret to inform you that your loan application was not approved due to existing unpaid loans and balances on your account.

We recommend settling outstanding balances first before reapplying. Once cleared, you may submit a new application and we'll be happy to reassess it.`;
      }
      else {
        rejectionMessage = `After careful review, we regret to inform you that your loan application has not been approved.${loan.rejectionReason ? `\n\nReason: ${loan.rejectionReason}` : ''}`;
      }

      const response = await RejectLoans({
        memberId: loan.id,
        transactionId: loan.transactionId,
        amount: loan.loanAmount,
        term: loan.term,
        dateRejected: loan.dateRejected || formatDate(now),
        timeRejected: loan.timeRejected || formatTime(now),
        email: loan.email,
        firstName: loan.firstName,
        lastName: loan.lastName,
        status: 'rejected',
        rejectionReason: loan.rejectionReason || 'Rejected by admin',
        rejectionMessage: rejectionMessage
      });
      
      if (!response.ok) {
        console.error('Failed to send rejection email');
      }
    } catch (err) {
      console.error('API reject error:', err);
    }
  };

const handleSuccessOk = async () => {
  // Close success modal
  setSuccessMessageModalVisible(false);

  if (!pendingApiCall) {
    setCurrentAction(null);
    closeModal();
    setSelectedLoan(null);
    refreshData();
    return;
  }

  setIsProcessing(true);
  setActionInProgress(true);

  try {
    if (pendingApiCall.type === 'approve') {
      await processDatabaseApprove(
        pendingApiCall.data, 
        pendingApiCall.deductBalance, 
        pendingApiCall.deductFunds, 
        pendingApiCall.savingsAmount,
        pendingApiCall.attachmentUrl || ''
      );
      callApiApprove(pendingApiCall.data, pendingApiCall.attachmentUrl || '');
    } else if (pendingApiCall.type === 'reject') {
      await processDatabaseReject(pendingApiCall.data, pendingApiCall.data.rejectionReason);
      callApiReject(pendingApiCall.data);
    }
    // REMOVED: 'approve_with_savings' case
  } catch (error) {
    console.error('Error processing DB or API call:', error);
    setErrorMessage(error.message || 'An error occurred during final processing.');
    setErrorModalVisible(true);
  } finally {
    setApprovalAttachmentFile(null);
    setApprovalAttachmentUrl('');
    setIsProcessing(false);
    setActionInProgress(false);
    setPendingApiCall(null);
    setCurrentAction(null);
    closeModal();
    setSelectedLoan(null);
    refreshData();
  }
};
const openImageViewer = (url, label, index) => {
  if (!selectedLoan) return;
  
  const images = [];
  
  // Add QR code first if exists
  if (selectedLoan.qrCodeUrl) {
    images.push({ 
      url: selectedLoan.qrCodeUrl, 
      label: 'QR Code' 
    });
  }
  
  // Add all collateral images
  if (selectedLoan.proofOfCollateralUrls && selectedLoan.proofOfCollateralUrls.length > 0) {
    selectedLoan.proofOfCollateralUrls.forEach((imgUrl, idx) => {
      images.push({ 
        url: imgUrl, 
        label: `Collateral Image ${idx + 1}` 
      });
    });
  }
  
  // Find the index of the clicked image
  let initialIndex = 0;
  if (label === 'QR Code') {
    initialIndex = 0; // QR code is first
  } else if (label.startsWith('Collateral Image')) {
    // Find which collateral image was clicked
    const match = label.match(/Collateral Image (\d+)/);
    if (match) {
      const imageNum = parseInt(match[1]) - 1;
      initialIndex = selectedLoan.qrCodeUrl ? 1 + imageNum : imageNum;
    }
  }
  
  setAvailableImages(images);
  setCurrentImageIndex(initialIndex);
  setCurrentImage(images[initialIndex] || images[0]);
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

const hasDocuments = (loan) => {
  return loan.proofOfIncomeUrl || 
         loan.proofOfIdentityUrl || 
         loan.proofOfCollateralUrl || 
         (loan.proofOfCollateralUrls && loan.proofOfCollateralUrls.length > 0) ||
         loan.qrCodeUrl; // Add QR code check
};

  if (!loans.length) return (
    <div style={styles.noDataContainer}>
      <FaHandHoldingUsd style={styles.noDataIcon} />
      <div>No loan applications available</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loan Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Disbursement</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: '500' }}>
                    {item.firstName} {item.lastName}
                  </div>
                </td>
                <td style={styles.tableCell}>
                  {formatCurrency(item.loanAmount)}
                  {item.requiresCollateral && (
                    <span style={{ marginLeft: '5px', color: '#ff9800', fontSize: '12px' }} title="Collateral Required">
                      🔒
                    </span>
                  )}
                </td>
                   <td style={styles.tableCell}>{item.disbursement}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(item.status === 'approved' ? styles.statusApproved : 
                         item.status === 'rejected' ? styles.statusRejected : styles.statusPending)
                  }}>
                    {item.status || 'pending'}
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

      {/* Loan Details Modal */}
      {modalVisible && selectedLoan && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaHandHoldingUsd />
                Loan Application Details
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
                {/* Left Column - Member & Loan Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Member Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaIdCard />
                        Member ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.id || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Name:
                      </span>
                      <span style={styles.fieldValue}>{`${selectedLoan.firstName || ''} ${selectedLoan.lastName || ''}`}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.email || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMoneyBillWave />
                        Current Balance:
                      </span>
                      <span style={styles.fieldValue}>{memberBalance !== null ? formatCurrency(memberBalance) : 'Loading...'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaHandHoldingUsd />
                      Loan Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Transaction ID:</span>
                      <span style={styles.fieldValue}>{selectedLoan.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Loan Amount:</span>
                      <span style={styles.fieldValue}>{formatCurrency(selectedLoan.loanAmount)}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Term:</span>
                      <span style={styles.fieldValue}>{selectedLoan.term} months</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Disbursement:</span>
                      <span style={styles.fieldValue}>{selectedLoan.disbursement || 'N/A'}</span>
                    </div>

                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaCalendarAlt />
                        Date Applied:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.dateApplied || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                 {/* Right Column - Financial & Documents */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Account Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Account Name:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountName || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Account Number:</span>
                      <span style={styles.fieldValue}>{selectedLoan.accountNumber || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Type of Bank:</span>
                      <span style={styles.fieldValue}>{selectedLoan.bankType || 'N/A'}</span>
                    </div>
                    
                    {/* QR Code Display - Added Here */}
                    {selectedLoan.qrCodeUrl && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={styles.fieldGroup}>
                          <span style={styles.fieldLabel}>
                            <FaQrcode style={{ marginRight: '5px' }} />
                            QR Code:
                          </span>
                          <span style={styles.fieldValue}>
                            <div style={{ textAlign: 'right' }}>
                              <img
                                src={selectedLoan.qrCodeUrl}
                                alt="QR Code"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  marginLeft: 'auto'
                                }}
                                onClick={() => openImageViewer(selectedLoan.qrCodeUrl, 'QR Code')}
                              />
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#64748b',
                                marginTop: '4px'
                              }}>
                           
                              </div>
                            </div>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collateral Information */}
                  {selectedLoan.requiresCollateral && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaIdCard />
                        Collateral Details
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Required:</span>
                        <span style={styles.fieldValue}>Yes</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Type:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralType || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Collateral Value:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralValue ? formatCurrency(selectedLoan.collateralValue) : 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Description:</span>
                        <span style={styles.fieldValue}>{selectedLoan.collateralDescription || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Application Status
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...(selectedLoan.status === 'approved' ? styles.statusApproved : 
                             selectedLoan.status === 'rejected' ? styles.statusRejected : styles.statusPending)
                      }}>
                        {selectedLoan.status || 'pending'}
                      </span>
                    </div>
                    {selectedLoan.dateApproved && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateApproved}</span>
                      </div>
                    )}
                    {selectedLoan.dateRejected && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedLoan.dateRejected}</span>
                      </div>
                    )}
                  </div>

                  {/* Collateral Images Section */}
                  {selectedLoan.requiresCollateral && selectedLoan.proofOfCollateralUrls && selectedLoan.proofOfCollateralUrls.length > 0 && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaIdCard />
                        Collateral Images
                      </h3>
                      <div style={styles.documentsGrid}>
                        {selectedLoan.proofOfCollateralUrls.map((url, index) => (
                          <div 
                            key={index}
                            style={styles.documentCard}
                            onClick={() => openImageViewer(url, `Collateral Image ${index + 1}`, index)}
                          >
                            <img
                              src={url}
                              alt={`Collateral ${index + 1}`}
                              style={styles.documentImage}
                              onError={(e) => {
                                console.error('Failed to load collateral image:', url);
                                e.target.style.display = 'none';
                              }}
                            />
                            <div style={styles.documentLabel}>Collateral Image {index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {selectedLoan.status !== 'approved' && selectedLoan.status !== 'rejected' && (
              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.approveButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={handleApproveClick}
                  disabled={isProcessing}
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
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

{/* Enhanced Approve Confirmation Modal */}
{showApproveConfirmation && (
  <div style={styles.modalOverlay}>
    <div style={styles.enhancedConfirmationModal}>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a', fontSize: '48px' }} />
      <h3 style={styles.confirmationTitle}>Approve Loan Application</h3>
      
      {/* Attachment Section - ADD THIS */}
      <div style={styles.attachmentSection}>
        <label style={styles.attachmentLabel}>Proof of Transaction:</label>
        
        {!approvalAttachmentFile ? (
          <div 
            style={styles.fileUploadArea}
            onClick={() => document.getElementById('approvalAttachment').click()}
          >
            <FaPlus style={{ fontSize: '24px', color: '#6b7280', marginBottom: '12px' }} />
            <p style={styles.uploadText}>Click to upload file</p>
            <p style={styles.fileTypes}>Supported: JPG, PNG, PDF (Max 5MB)</p>
            <input
              id="approvalAttachment"
              type="file"
              style={styles.fileInput}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
            />
          </div>
        ) : (
          <div style={styles.filePreview}>
            <div style={styles.fileInfo}>
              <FaFileContract style={{ fontSize: '24px', color: '#3b82f6' }} />
              <div style={styles.fileDetails}>
                <p style={styles.fileName}>{approvalAttachmentFile.name}</p>
                <p style={styles.fileSize}>
                  {(approvalAttachmentFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              style={styles.removeFileButton}
              onClick={removeApprovalAttachment}
              disabled={attachmentUploading}
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        {attachmentUploading && (
          <div style={styles.uploadingIndicator}>
            <div style={styles.spinner}></div>
            <span style={styles.uploadingText}>Uploading file...</span>
          </div>
        )}
      </div>
      
      <p style={styles.confirmationText}>
        Are you sure you want to approve this loan?
        {approvalAttachmentFile && (
          <span style={{ display: 'block', marginTop: '8px', color: '#059669', fontWeight: '600' }}>
            ✅ Attachment will be included in approval email
          </span>
        )}
      </p>
      
<div style={styles.confirmationButtons}>
  <button 
    style={{
      ...styles.actionButton,
      ...styles.primaryButton,
      ...(actionInProgress || attachmentUploading ? styles.disabledButton : {})
    }} 
    onClick={async () => {
      // If file is attached, upload it first
      if (approvalAttachmentFile) {
        try {
          setActionInProgress(true);
          const downloadURL = await uploadApprovalAttachment(
            approvalAttachmentFile,
            selectedLoan.id,
            selectedLoan.transactionId
          );
          // Store the URL in state AND pass it directly to confirmApprove
          setApprovalAttachmentUrl(downloadURL);
          // Call confirmApprove with the URL directly (don't wait for state update)
          await confirmApprove(downloadURL);
        } catch (error) {
          setErrorMessage('Failed to upload attachment: ' + error.message);
          setErrorModalVisible(true);
          setActionInProgress(false);
          return;
        }
      } else {
        // No attachment, proceed normally
        confirmApprove();
      }
    }}
    disabled={actionInProgress || attachmentUploading}
  >
    {actionInProgress ? 'Processing...' : 
     approvalAttachmentFile ? 'Approve with Attachment' : 'Approve'}
  </button>
  <button 
    style={{
      ...styles.actionButton,
      ...styles.secondaryButton
    }} 
    onClick={() => {
      setShowApproveConfirmation(false);
      removeApprovalAttachment(); // Clear any selected file
    }}
    disabled={actionInProgress || attachmentUploading}
  >
    Cancel
  </button>
</div>
    </div>
  </div>
)}

{/* Reject Confirmation Modal */}
{showRejectConfirmation && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalCardSmall}>
      <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
      <p style={styles.modalText}>Are you sure you want to reject this loan?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(actionInProgress ? styles.disabledButton : {})
          }} 
          onClick={confirmRejectFinal}
          disabled={actionInProgress}
        >
          {actionInProgress ? 'Processing...' : 'Yes'}
        </button>
        <button 
          style={{
            ...styles.actionButton,
            ...styles.secondaryButton
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
                      style={styles.customReasonInput}
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
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }} 
              onClick={() => setErrorModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

{/* Loading Overlay - Same design as logout */}
{isProcessing && (
  <div style={styles.loadingOverlay}>
    <div style={styles.loadingContent}>
      <div style={styles.spinner}></div>
      <div style={styles.loadingText}>
        {currentAction === 'approve' ? 'Approving loan...' : 'Rejecting loan...'}
      </div>
    </div>
  </div>
)}

 {/* Success Modal */}
{successMessageModalVisible && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalCardSmall}>
      {currentAction === 'approve' ? (
        <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
      ) : (
        <FaTimes style={{ ...styles.confirmIcon, color: '#ef4444' }} />
      )}
      <p style={styles.modalText}>{successMessage}</p>
      <button 
        style={{
          ...styles.actionButton,
          ...styles.primaryButton
        }} 
        onClick={handleSuccessOk}
      >
        OK
      </button>
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
            <p style={styles.imageViewerLabel}>
              {currentImage.label}
              {availableImages.length > 1 && (
                <span style={{ fontSize: '14px', opacity: 0.8, marginLeft: '10px' }}>
                  ({currentImageIndex + 1} of {availableImages.length})
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLoans;
