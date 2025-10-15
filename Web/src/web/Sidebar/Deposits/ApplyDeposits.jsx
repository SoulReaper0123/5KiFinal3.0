import React, { useState } from 'react';
import { database } from '../../../../../Database/firebaseConfig';
import { ApproveDeposits, RejectDeposits } from '../../../../../Server/api';
import { 
  FaCheckCircle, 
  FaTimes, 
  FaExclamationCircle, 
  FaImage, 
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
  FaMapMarkerAlt
} from 'react-icons/fa';
import Tesseract from 'tesseract.js';

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
  verifyButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginTop: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#1e40af'
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
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
  }
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
  "Invalid proof of deposit",
  "Incorrect amount",
  "Unclear image",
  "Suspicious activity",
  "Other"
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
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', fields: [] });
  const [validationStatus, setValidationStatus] = useState({});
  const [isVerifying, setIsVerifying] = useState({});
  const [memberData, setMemberData] = useState({});

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

  const fetchMemberData = async (memberId) => {
    try {
      const memberRef = database.ref(`Members/${memberId}`);
      const memberSnap = await memberRef.once('value');
      
      if (memberSnap.exists()) {
        const member = memberSnap.val();
        setMemberData(prev => ({
          ...prev,
          [memberId]: {
            currentBalance: member.balance || 0,
            investment: member.investment || 0,
            address: member.address || 'N/A'
          }
        }));
        return member;
      } else {
        setMemberData(prev => ({
          ...prev,
          [memberId]: {
            currentBalance: 0,
            investment: 0,
            address: 'N/A'
          }
        }));
        return null;
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMemberData(prev => ({
        ...prev,
        [memberId]: {
          currentBalance: 0,
          investment: 0,
          address: 'N/A'
        }
      }));
      return null;
    }
  };

  const showInfoModal = (title, fields) => {
    setInfoModal({ visible: true, title, fields });
  };

  const closeInfoModal = () => setInfoModal({ visible: false, title: '', fields: [] });

  const loadImageWithCORS = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const createCanvasFromImage = (img) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width || img.naturalWidth;
        canvas.height = img.height || img.naturalHeight;
        try {
          ctx.drawImage(img, 0, 0);
          return canvas;
        } catch (error) {
          return img;
        }
      };

      const tryLoadImage = (corsMode, attempt = 1) => {
        const newImg = new Image();
        
        if (corsMode) {
          newImg.crossOrigin = corsMode;
        }
        
        newImg.onload = () => {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const canvas = createCanvasFromImage(newImg);
              resolve(canvas);
            } catch (error) {
              resolve(newImg);
            }
          } else {
            resolve(newImg);
          }
        };
        
        newImg.onerror = () => {
          if (attempt === 1) {
            tryLoadImage('use-credentials', 2);
          } else if (attempt === 2) {
            tryLoadImage(null, 3);
          } else if (attempt === 3) {
            try {
              const apiHost = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
              const proxyBase = (import.meta?.env?.VITE_SERVER_URL) || apiHost;
              const proxyUrl = `${proxyBase}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
              const proxied = new Image();
              proxied.crossOrigin = 'anonymous';
              proxied.onload = () => resolve(proxied);
              proxied.onerror = () => resolve(newImg);
              proxied.src = proxyUrl;
            } catch {
              resolve(newImg);
            }
          }
        };
        
        newImg.src = imageUrl;
      };
      
      tryLoadImage('anonymous', 1);
    });
  };

  const preprocessForOCR = (img, scale = 2, binary = false) => {
    try {
      const srcW = img.width || img.naturalWidth || 0;
      const srcH = img.height || img.naturalHeight || 0;
      if (!srcW || !srcH) return img;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(srcW * scale);
      canvas.height = Math.round(srcH * scale);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let v = 0.299 * r + 0.587 * g + 0.114 * b;
        v = Math.min(255, Math.max(0, (v - 128) * 1.15 + 128));
        if (binary) v = v > 150 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    } catch {
      return img;
    }
  };

  const parsePaymentText = (raw) => {
    const text = (raw || '').replace(/\s+/g, ' ').replace(/[|]/g, ' ').trim();

    const amountPatterns = [
      /(?:amount|amt|paid)\s*[:\-]?\s*(?:php|₱)?\s*([\d.,]+)\b/i,
      /(?:php|₱)\s*([\d.,]+)\b/i
    ];
    const refPatterns = [
      /(ref(?:erence)?\s*(?:no\.?|#)?)[^A-Za-z0-9]*([0-9]{3,6}(?:\s+[0-9]{3,6}){1,5})/i,
      /(ref(?:erence)?\s*(?:no\.?|#)?|gcash\s*ref(?:erence)?|txn\s*id|transaction\s*(?:id|no\.?))\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
      /\b(?:ref(?:erence)?\s*(?:no\.?|#)?)\s*([A-Z0-9\-]{6,})\b/i,
      /\b([A-Z0-9]{10,})\b/
    ];

    const month = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
    const timePart = '(?:\\d{1,2}[:.;\\s]\\d{2}(?:[:.;\\s]\\d{2})?\\s*(?:am|pm)?)';
    const datePatterns = [
      new RegExp(`\\b${month}\\s+\\d{1,2},?\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{1,2}\\s+${month}\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b${month}\\s+\\d{1,2}\\s+\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{4}-\\d{2}-\\d{2}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}(?:\\s+${timePart})?`, 'i'),
      new RegExp(`\\b(?:date\\s*&\\s*time|date\\s+and\\s+time|transaction\\s*date|date|time)\\s*[:\\-]?\\s*(${month}\\s+\\d{1,2},?\\s+\\d{2,4}(?:\\s+${timePart})?|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}(?:\\s+${timePart})?|\\d{4}-\\d{2}-\\d{2}(?:\\s+${timePart})?)`, 'i')
    ];

    let amount = null;
    for (const re of amountPatterns) {
      const m = text.match(re);
      if (m && m[1]) {
        amount = m[1].replace(/,/g, '');
        const dotCount = (amount.match(/\./g) || []).length;
        const commaCount = (amount.match(/,/g) || []).length;
        if (commaCount && !dotCount) amount = amount.replace(/,/g, '');
        if (commaCount && dotCount) amount = amount.replace(/,/g, '');
        break;
      }
    }

    let refNo = null;
    for (const re of refPatterns) {
      const m = text.match(re);
      if (m) {
        refNo = (m[2] || m[1] || '').toString().trim();
        refNo = refNo.replace(/\s{2,}/g, ' ').trim();
        break;
      }
    }
    if (!refNo) {
      const fallback = text.match(/ref(?:erence)?\s*(?:no\.?|#)?\s*[:\-]?\s*([A-Z0-9\s\-]{8,30})/i);
      if (fallback && fallback[1]) {
        refNo = fallback[1].replace(/[^A-Z0-9\s\-]/gi, '').replace(/\s{2,}/g, ' ').trim();
      }
    }
    if (!refNo) {
      const spacedDigits = text.match(/\b\d{3,6}(?:\s+\d{3,6}){1,5}\b/);
      if (spacedDigits) {
        refNo = spacedDigits[0].replace(/\s{2,}/g, ' ').trim();
      }
    }

    let dateTime = null;
    for (const re of datePatterns) {
      const m = text.match(re);
      if (m) { dateTime = (m[1] || m[0]).trim(); break; }
    }
    if (!dateTime) {
      const dateToken = text.match(new RegExp(`\\b(?:${month})\\s+\\d{1,2},?\\s+\\d{2,4}\\b|\\b\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b`, 'i'));
      const timeToken = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i);
      if (dateToken && timeToken) dateTime = `${dateToken[0]} ${timeToken[0]}`.trim();
    }

    return { amount, refNo, dateTime };
  };

  const verifyDepositProof = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Extracting payment details...' }
    }));
    
    setIsVerifying(prev => ({ ...prev, [label]: true }));

    try {
      const baseImg = await loadImageWithCORS(imageUrl);
      const preprocessed = preprocessForOCR(baseImg, 2, false);
      const { data: { text, confidence } } = await Tesseract.recognize(preprocessed, 'eng');
      const parsed = parsePaymentText(text);
      const foundAny = parsed.amount || parsed.refNo;

      setValidationStatus(prev => ({
        ...prev,
        [label]: {
          status: foundAny ? 'valid' : (confidence > 30 ? 'partial' : 'manual'),
          message: foundAny
            ? `Amount: ${parsed.amount || 'N/A'}, Ref No: ${parsed.refNo || 'N/A'}${parsed.dateTime ? `, Date: ${parsed.dateTime}` : ''}`
            : 'Text detected but could not find Amount/Ref No'
        }
      }));

      if (foundAny) {
        showInfoModal('Verification Success', [
          { label: 'Amount', value: parsed.amount || 'N/A' },
          { label: 'Reference No', value: parsed.refNo || 'N/A' },
          { label: 'Date/Time', value: parsed.dateTime || 'N/A' }
        ]);
      } else {
        showInfoModal('Verification Failed', [
          { label: 'Reason', value: 'Could not detect Amount and Reference No.' }
        ]);
      }
    } catch (e) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Payment OCR failed' }
      }));
    } finally {
      setIsVerifying(prev => ({ ...prev, [label]: false }));
    }
  };

  const openModal = async (deposit) => {
    setSelectedDeposit(deposit);
    setModalVisible(true);
    setValidationStatus({});
    
    // Fetch member data when opening modal
    if (deposit.id) {
      await fetchMemberData(deposit.id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
    setMemberData({}); // Reset member data when closing modal
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
    await processAction(selectedDeposit, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

  const processAction = async (deposit, action, rejectionReason = '') => {
    // Defer DB writes and refresh to success modal OK
    setActionInProgress(true);
    setIsProcessing(true);
    setCurrentAction(action);

    try {
      if (action === 'approve') {
        setSuccessMessage('Deposit approved successfully!');

        const approveData = {
          ...deposit,
          dateApproved: formatDate(new Date()),
          timeApproved: formatTime(new Date())
        };

        // Local preview only; do not touch DB yet
        setSelectedDeposit(prev => ({
          ...prev,
          dateApproved: approveData.dateApproved,
          timeApproved: approveData.timeApproved,
          status: 'approved'
        }));

        setPendingApiCall({
          type: 'approve',
          data: approveData
        });
      } else {
        setSuccessMessage('Deposit rejected successfully!');

        const rejectData = {
          ...deposit,
          dateRejected: formatDate(new Date()),
          timeRejected: formatTime(new Date()),
          rejectionReason
        };

        // Local preview only; do not touch DB yet
        setSelectedDeposit(prev => ({
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
      }

      setSuccessMessageModalVisible(true);
    } catch (error) {
      console.error('Error preparing action:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
      // Hide loading on error
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

      const originalTransactionId = deposit.transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const pendingRef = database.ref(`Deposits/DepositApplications/${deposit.id}/${originalTransactionId}`);
      const approvedRef = database.ref(`Deposits/ApprovedDeposits/${deposit.id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${deposit.id}/${newTransactionId}`);
      const memberRef = database.ref(`Members/${deposit.id}`);
      const fundsRef = database.ref('Settings/Funds');

      const memberSnap = await memberRef.once('value');

      if (memberSnap.exists()) {
        const member = memberSnap.val();

        const approvedDeposit = { 
          ...deposit, 
          transactionId: newTransactionId,
          originalTransactionId: originalTransactionId,
          dateApproved: approvalDate,
          timeApproved: approvalTime,
          timestamp: now.getTime(),
          status
        };

        await approvedRef.set(approvedDeposit);
        await transactionRef.set(approvedDeposit);

        const depositAmount = parseFloat(deposit.amountToBeDeposited) || 0;
        
        // Use the correct field names from your Members structure
        const currentBalance = parseFloat(member.balance || 0);
        const currentInvestment = parseFloat(member.investment || 0);
        
        const newBalance = currentBalance + depositAmount;
        const newInvestment = currentInvestment + depositAmount;
        
        await memberRef.update({ 
          balance: newBalance, 
          investment: newInvestment 
        });

        // Update the local memberData state to reflect the changes
        setMemberData(prev => ({
          ...prev,
          [deposit.id]: {
            ...prev[deposit.id],
            currentBalance: newBalance,
            investment: newInvestment
          }
        }));

        const fundSnap = await fundsRef.once('value');
        const updatedFund = (parseFloat(fundSnap.val()) || 0) + parseFloat(deposit.amountToBeDeposited);
        await fundsRef.set(updatedFund);
        
        const dateKey = now.toISOString().split('T')[0];
        const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
        await fundsHistoryRef.set(updatedFund);

        await pendingRef.remove();
      }

      return newTransactionId;
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

      const originalTransactionId = deposit.transactionId;
      const newTransactionId = Math.floor(100000 + Math.random() * 900000).toString();

      const pendingRef = database.ref(`Deposits/DepositApplications/${deposit.id}/${originalTransactionId}`);
      const rejectedRef = database.ref(`Deposits/RejectedDeposits/${deposit.id}/${newTransactionId}`);
      const transactionRef = database.ref(`Transactions/Deposits/${deposit.id}/${newTransactionId}`);

      const rejectedDeposit = { 
        ...deposit, 
        transactionId: newTransactionId,
        originalTransactionId: originalTransactionId,
        dateRejected: rejectionDate,
        timeRejected: rejectionTime,
        timestamp: now.getTime(),
        status,
        rejectionReason: rejectionReason || 'Rejected by admin'
      };

      await rejectedRef.set(rejectedDeposit);
      await transactionRef.set(rejectedDeposit);
      
      await pendingRef.remove();

      return newTransactionId;
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

  const handleSuccessOk = async () => {
    // Show loading spinner and hide success modal
    setIsProcessing(true);
    setSuccessMessageModalVisible(false);

    try {
      // Finalize DB changes
      if (pendingApiCall) {
        if (pendingApiCall.type === 'approve') {
          await processDatabaseApprove(pendingApiCall.data);
        } else if (pendingApiCall.type === 'reject') {
          await processDatabaseReject(pendingApiCall.data, pendingApiCall.data.rejectionReason || 'Rejected by admin');
        }
      }
    } catch (err) {
      console.error('Finalize DB on OK error:', err);
      // Optionally show error modal here if needed
    }

    // Trigger background email after DB success; do not block UI
    try {
      if (pendingApiCall) {
        if (pendingApiCall.type === 'approve') {
          callApiApprove(pendingApiCall.data);
        } else if (pendingApiCall.type === 'reject') {
          callApiReject(pendingApiCall.data);
        }
      }
    } catch (error) {
      console.error('Error calling API:', error);
    } finally {
      setPendingApiCall(null);
    }

    // Close modal and clean state
    closeModal();
    setSelectedDeposit(null);
    setCurrentAction(null);

    // Finally refresh
    refreshData();

    // Hide loading spinner
    setIsProcessing(false);
  };

  const openImageViewer = (url, label) => {
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setCurrentImage({ url: '', label: '' });
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

  const handleManualVerification = () => {
    const { url, label } = currentImage;
    setIsVerifying(prev => ({ ...prev, [label]: true }));
    
    const run = async () => {
      try {
        await verifyDepositProof(url, label);
      } finally {
        setIsVerifying(prev => ({ ...prev, [label]: false }));
      }
    };

    run();
  };

  if (!deposits.length) return (
    <div style={styles.noDataContainer}>
      <FaMoneyBillWave style={styles.noDataIcon} />
      <div>No deposit applications available</div>
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
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Deposit Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Deposit Option</th>
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

      {/* Deposit Details Modal */}
      {modalVisible && selectedDeposit && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaMoneyBillWave />
                Deposit Application Details
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
                      <FaMapMarkerAlt />
                      Member Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Address:</span>
                      <span style={styles.fieldValue}>
                        {memberData[selectedDeposit.id]?.address || selectedDeposit.address || 'N/A'}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Current Balance:</span>
                      <span style={styles.fieldValue}>
                        {formatCurrency(memberData[selectedDeposit.id]?.currentBalance || 0)}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Investment:</span>
                      <span style={styles.fieldValue}>
                        {formatCurrency(memberData[selectedDeposit.id]?.investment || 0)}
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
                      <span style={styles.financialLabel}>Deposit Option:</span>
                      <span style={styles.financialValue}>{selectedDeposit.depositOption || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaCalendarAlt />
                      Application Details
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Transaction ID:</span>
                      <span style={styles.fieldValue}>{selectedDeposit.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Date Applied:</span>
                      <span style={styles.fieldValue}>{selectedDeposit.dateApplied || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...(selectedDeposit.status === 'approved' ? styles.statusApproved : 
                             selectedDeposit.status === 'rejected' ? styles.statusRejected : styles.statusPending)
                      }}>
                        {selectedDeposit.status || 'pending'}
                      </span>
                    </div>
                    {selectedDeposit.dateApproved && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Approved:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.dateApproved}</span>
                      </div>
                    )}
                    {selectedDeposit.dateRejected && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Rejected:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.dateRejected}</span>
                      </div>
                    )}
                    {selectedDeposit.rejectionReason && (
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Rejection Reason:</span>
                        <span style={styles.fieldValue}>{selectedDeposit.rejectionReason}</span>
                      </div>
                    )}
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
                          onClick={() => openImageViewer(selectedDeposit.proofOfDepositUrl, 'Proof of Deposit')}
                        >
                          <img
                            src={selectedDeposit.proofOfDepositUrl}
                            alt="Proof of Deposit"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Deposit</div>
                          {validationStatus['Proof of Deposit'] && (
                            <div style={{ 
                              marginTop: '8px', 
                              fontSize: '0.75rem',
                              color: validationStatus['Proof of Deposit'].status === 'valid' ? '#059669' : 
                                    validationStatus['Proof of Deposit'].status === 'invalid' ? '#dc2626' : 
                                    validationStatus['Proof of Deposit'].status === 'verifying' ? '#2563eb' : '#6b7280'
                            }}>
                              {validationStatus['Proof of Deposit'].message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedDeposit.status !== 'approved' && selectedDeposit.status !== 'rejected' && (
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

      {/* Approve Confirmation Modal */}
      {showApproveConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>Are you sure you want to approve this deposit?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }} 
                onClick={confirmApprove}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.secondaryButton
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
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>Are you sure you want to reject this deposit?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
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

      {/* Loading Spinner */}
      {isProcessing && (
        <div style={styles.modalOverlay}>
          <div style={styles.spinner}></div>
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
            <p style={styles.imageViewerLabel}>{currentImage.label}</p>
            <div style={{ 
              position: 'fixed', 
              bottom: '20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '15px 20px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              zIndex: 2001
            }}>
              <button
                style={{
                  ...styles.verifyButton,
                  minWidth: '120px',
                  padding: '10px 20px'
                }}
                onClick={handleManualVerification}
                disabled={Boolean(isVerifying[currentImage.label])}
              >
                {isVerifying[currentImage.label] ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                    Verifying...
                  </>
                ) : (
                  'Verify Deposit'
                )}
              </button>
            </div>

            {/* Info modal overlay inside image viewer */}
            {infoModal.visible && (
              <div style={styles.infoModalOverlay}>
                <div style={styles.infoModalCard}>
                  <div style={styles.infoTitle}>{infoModal.title}</div>
                  {infoModal.fields.map((f, i) => (
                    <div key={i} style={styles.infoRow}>
                      <span style={styles.infoLabel}>{f.label}</span>
                      <span style={styles.infoValue}>{f.value || 'N/A'}</span>
                    </div>
                  ))}
                  <button
                    style={styles.infoCloseButton}
                    onClick={closeInfoModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyDeposits;