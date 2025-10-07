import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ApproveRegistration, RejectRegistration } from '../../../../../Server/api';
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
  FaVenusMars,
  FaHeart,
  FaBirthdayCake
} from 'react-icons/fa';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as blazeface from '@tensorflow-models/blazeface';
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
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
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
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
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
    gap: '0.25rem',
    transition: 'all 0.2s ease',
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
  "Invalid ID documents",
  "Incomplete information",
  "Poor quality images",
  "Suspicious activity",
  "Other"
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
  const [availableImages, setAvailableImages] = useState([]);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [validationStatus, setValidationStatus] = useState({});
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [isVerifying, setIsVerifying] = useState({});
  const [tfModels, setTfModels] = useState({
    mobilenet: null,
    blazeface: null
  });
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', fields: [] });

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading TensorFlow.js models...');
        
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js backend ready');
        
        let mobilenetModel = null;
        let blazefaceModel = null;
        
        try {
          console.log('Loading MobileNet...');
          mobilenetModel = await mobilenet.load();
          console.log('MobileNet loaded successfully');
        } catch (mobilenetError) {
          console.warn('MobileNet failed to load:', mobilenetError);
        }
        
        try {
          console.log('Loading BlazeFace...');
          blazefaceModel = await blazeface.load();
          console.log('BlazeFace loaded successfully');
        } catch (blazefaceError) {
          console.warn('BlazeFace failed to load:', blazefaceError);
        }
        
        setTfModels({
          mobilenet: mobilenetModel,
          blazeface: blazefaceModel
        });
        
        console.log('Skipping face-api.js models to avoid conflicts with TensorFlow.js');
        
        const hasModels = mobilenetModel || blazefaceModel;
        setModelsLoaded(hasModels);
        
        if (hasModels) {
          console.log('TensorFlow models loaded successfully');
        } else {
          console.warn('No models loaded successfully, using manual validation mode');
        }
        
      } catch (err) {
        console.error('Failed to load models:', err);
        console.error('Error details:', err.message);
        
        try {
          console.log('Trying CPU backend as fallback...');
          await tf.setBackend('cpu');
          await tf.ready();
          
          const mobilenetModel = await mobilenet.load();
          setTfModels({
            mobilenet: mobilenetModel,
            blazeface: null
          });
          setModelsLoaded(true);
          console.log('CPU backend loaded successfully with MobileNet');
        } catch (fallbackError) {
          console.error('CPU backend also failed:', fallbackError);
          setModelsLoaded(false);
          setTfModels({ mobilenet: null, blazeface: null });
          console.warn('All model loading failed, using manual validation mode');
        }
      }
    };

    loadModels();
  }, []);

  const loadImageForTensorFlow = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const tryLoad = (mode, attempt) => {
        const img = new Image();
        if (mode) img.crossOrigin = mode;
        img.onload = () => {
          console.log(`TF image loaded with mode: ${mode || 'none'} (attempt ${attempt})`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`TF image failed with mode: ${mode || 'none'} (attempt ${attempt})`);
          if (attempt === 1) {
            tryLoad('use-credentials', 2);
          } else if (attempt === 2) {
            tryLoad(null, 3);
          } else if (attempt === 3) {
            try {
              const apiHost = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
              const proxyBase = (import.meta?.env?.VITE_SERVER_URL) || apiHost;
              const proxyUrl = `${proxyBase}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
              const proxied = new Image();
              proxied.crossOrigin = 'anonymous';
              proxied.onload = () => resolve(proxied);
              proxied.onerror = () => reject(new Error('Failed to load image via proxy for TF'));
              proxied.src = proxyUrl;
            } catch (e) {
              reject(e);
            }
          }
        };
        img.src = imageUrl;
      };
      tryLoad('anonymous', 1);
    });
  };

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
          console.warn('Canvas drawing failed:', error);
          return img;
        }
      };

      const tryLoadImage = (corsMode, attempt = 1) => {
        const newImg = new Image();
        
        if (corsMode) {
          newImg.crossOrigin = corsMode;
        }
        
        newImg.onload = () => {
          console.log(`Image loaded successfully with CORS mode: ${corsMode || 'none'} (attempt ${attempt})`);
          
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const canvas = createCanvasFromImage(newImg);
              resolve(canvas);
            } catch (error) {
              console.warn('Canvas creation failed, using original image:', error);
              resolve(newImg);
            }
          } else {
            resolve(newImg);
          }
        };
        
        newImg.onerror = (error) => {
          console.warn(`Failed to load image with CORS mode: ${corsMode || 'none'} (attempt ${attempt})`, error);
          
          if (attempt === 1) {
            tryLoadImage('use-credentials', 2);
          } else if (attempt === 2) {
            tryLoadImage(null, 3);
          } else if (attempt === 3) {
            const apiHost = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
            const proxyBase = (import.meta?.env?.VITE_SERVER_URL) || apiHost;
            const proxyUrl = `${proxyBase}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            const proxied = new Image();
            proxied.crossOrigin = 'anonymous';
            proxied.onload = () => resolve(proxied);
            proxied.onerror = () => {
              console.warn('Proxy also failed, using fallback canvas');
              const canvas = document.createElement('canvas');
              canvas.width = 300;
              canvas.height = 200;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#f0f0f0';
              ctx.fillRect(0, 0, 300, 200);
              ctx.fillStyle = '#666';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Image Load Failed', 150, 100);
              resolve(canvas);
            };
            proxied.src = proxyUrl;
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

      const minTargetW = Math.max(800, Math.floor(srcW * scale));
      const factor = minTargetW / srcW;
      const targetW = Math.floor(srcW * factor);
      const targetH = Math.floor(srcH * factor);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const d = imageData.data;

      const contrast = binary ? 80 : 50;
      const c = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const thresh = 180;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let y = 0.299 * r + 0.587 * g + 0.114 * b;
        y = c * (y - 128) + 128;
        if (binary) {
          y = y >= thresh ? 255 : 0;
        }
        d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, y));
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    } catch (e) {
      console.warn('preprocessForOCR failed, using original image', e);
      return img;
    }
  };

  const cropPercent = (canvasOrImg, xPct, yPct, wPct, hPct) => {
    try {
      const baseW = canvasOrImg.width || canvasOrImg.naturalWidth;
      const baseH = canvasOrImg.height || canvasOrImg.naturalHeight;
      const x = Math.max(0, Math.floor(baseW * xPct));
      const y = Math.max(0, Math.floor(baseH * yPct));
      const w = Math.min(baseW - x, Math.floor(baseW * wPct));
      const h = Math.min(baseH - y, Math.floor(baseH * hPct));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvasOrImg, x, y, w, h, 0, 0, w, h);
      return c;
    } catch (e) {
      console.warn('cropPercent failed', e);
      return canvasOrImg;
    }
  };

  const upsampleIfSmall = (imgOrCanvas, minW = 600) => {
    try {
      const w = imgOrCanvas.width || imgOrCanvas.naturalWidth;
      const h = imgOrCanvas.height || imgOrCanvas.naturalHeight;
      if (!w || !h) return imgOrCanvas;
      if (w >= minW) return imgOrCanvas;
      const scale = minW / w;
      const c = document.createElement('canvas');
      c.width = Math.floor(w * scale);
      c.height = Math.floor(h * scale);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgOrCanvas, 0, 0, c.width, c.height);
      return c;
    } catch {
      return imgOrCanvas;
    }
  };

  const recognizeText = async (imgOrCanvas, options = {}) => {
    const defaultOpts = {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ,-'",
      tessedit_pageseg_mode: 6,
      preserve_interword_spaces: '1'
    };
    const opts = { ...defaultOpts, ...options };
    const big = upsampleIfSmall(imgOrCanvas, 800);
    const { data: { text, confidence } } = await Tesseract.recognize(big, 'eng', opts);
    return { text: (text || '').trim(), confidence: confidence ?? 0 };
  };

  const extractNameFromIDText = (rawText) => {
    if (!rawText) return null;

    const text = rawText.replace(/[|]/g, 'I');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const upperLines = lines.map(l => l.toUpperCase());

    const clean = (s) => (s || '')
      .toUpperCase()
      .replace(/[^A-Z,'\-\s]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    for (const line of upperLines) {
      const L = clean(line);
      const m = L.match(/^([A-Z][A-Z'\-\s]{1,30}),\s*([A-Z][A-Z'\-]{1,20})(?:\s+([A-Z][A-Z'\-]{1,20}))?(?:\s+([A-Z][A-Z'\-]{1,10}))?$/);
      if (m) {
        const last = m[1].replace(/\s{2,}/g, ' ').trim();
        const first = m[2];
        const middle = [m[3], m[4]].filter(Boolean).join(' ');
        const candidate = middle ? `${first} ${middle} ${last}` : `${first} ${last}`;
        if (plausible(candidate)) return toTitleCase(candidate);
      }
    }

    const toTitleCase = (name) => {
      const keepUpper = new Set(['MC', 'MAC']);
      const minor = new Set(['DE', 'DEL', 'DA', 'DI', 'LA', 'LE', 'VON', 'VAN', 'DY', 'DU']);
      return name.split(/\s+/).map(w => {
        if (keepUpper.has(w)) return w;
        if (minor.has(w)) return w.charAt(0) + w.slice(1).toLowerCase();
        return w.charAt(0) + w.slice(1).toLowerCase();
      }).join(' ');
    };

    const plausible = (s) => {
      const t = (s || '').split(/\s+/).filter(Boolean);
      if (t.length < 2) return false;
      if ((s || '').length < 8) return false;
      if (t.some(w => /\d/.test(w))) return false;
      return true;
    };

    let philIdx = upperLines.findIndex(l => /(APELYIDO|LAST\s*NAME)/.test(l));
    if (philIdx !== -1) {
      const collected = [];
      for (let j = philIdx + 1; j < Math.min(philIdx + 8, upperLines.length); j++) {
        const raw = upperLines[j];
        if (/(APELYIDO|LAST\s*NAME|MGA\s*PANGALAN|GIVEN\s*NAMES|GITNANG\s*APELYIDO|MIDDLE\s*NAME|DATE\s*OF\s*BIRTH|ADDRESS|TIRAHAN)/.test(raw)) continue;
        let cand = clean(raw);
        if (!cand) continue;
        if (/(PHILIPPINES|REPUBLIC|DRIVER|LICENSE|NUMBER|SEX|WEIGHT|HEIGHT|EYES|CODE|EXPIRATION|AGENCY|BIRTH)/.test(cand)) break;
        if (/^[A-Z' \-]+$/.test(cand)) collected.push(cand);
        if (collected.length >= 3) break;
      }
      if (collected.length >= 1) {
        const last = collected[0];
        const given = collected[1] || '';
        const middle = collected[2] || '';
        const result = `${given} ${middle} ${last}`.replace(/\s+/g, ' ').trim();
        if (plausible(result)) return toTitleCase(result);
      }
    }

    let idx = upperLines.findIndex(l => /LAST\s*NAME.*FIRST\s*NAME/.test(l));
    if (idx !== -1) {
      for (let j = idx + 1; j < Math.min(idx + 4, upperLines.length); j++) {
        let cand = clean(upperLines[j]);
        if (!cand) continue;
        if (/,$/.test(cand) && upperLines[j + 1]) {
          cand = `${cand.replace(/,+$/, '')}, ${clean(upperLines[j + 1])}`;
        }
        if (cand.includes(',')) {
          const [last, rest] = cand.split(',').map(s => clean(s));
          const result = `${rest} ${last}`.replace(/\s+/g, ' ').trim();
          if (plausible(result)) return toTitleCase(result);
        } else if (plausible(cand)) {
          return toTitleCase(cand);
        }
      }
    }

    for (const l of upperLines) {
      const candLine = clean(l);
      if (/(APELYIDO|LAST\s*NAME|GIVEN\s*NAMES|MIDDLE\s*NAME|ADDRESS|TIRAHAN|DATE\s*OF\s*BIRTH|DRIVER|LICENSE)/.test(candLine)) continue;
      if (candLine.includes(',')) {
        const parts = candLine.split(',');
        const last = clean(parts.shift());
        const rest = clean(parts.join(' '));
        const result = `${rest} ${last}`.replace(/\s+/g, ' ').trim();
        if (plausible(result)) return toTitleCase(result);
      }
    }

    for (let i = 0; i < upperLines.length - 1; i++) {
      const a = clean(upperLines[i]);
      const b = clean(upperLines[i + 1]);
      if (/(APELYIDO|LAST\s*NAME|ADDRESS|TIRAHAN|DRIVER|LICENSE)/.test(a)) continue;
      if (a.endsWith(',') && b) {
        const cand = `${a.replace(/,+$/, '')}, ${b}`;
        const [last, rest] = cand.split(',').map(s => clean(s));
        const result = `${rest} ${last}`.trim();
        if (plausible(result)) return toTitleCase(result);
      }
    }

    const blacklist = /(REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|OFFICE|DRIVER|LICENSE|DL|CONDITIONS|NATIONALITY|SEX|WEIGHT|HEIGHT|EYES|ADDRESS|TIRAHAN|DATE|BIRTH|LICENSEE|SIGNATURE|ASSISTANT|SECRETARY|AGENCY|CODE|EXPIRATION|NUMBER|AGENCY|G06|OO\+|BLACK)/;
    const candidates = upperLines
      .map(clean)
      .filter(l => l && /^[A-Z\s'\-]+$/.test(l) && !blacklist.test(l))
      .filter(l => {
        const words = l.split(/\s+/).filter(Boolean);
        const minorSet = new Set(['DE','DEL','DA','DI','LA','LE','VON','VAN','DY','DU']);
        const longWords = words.filter(w => w.length >= 3 || minorSet.has(w));
        const singleLetters = words.filter(w => w.length === 1).length;
        if (singleLetters / Math.max(words.length, 1) > 0.4) return false;
        return words.length >= 2 && words.length <= 6 && longWords.length >= 2;
      })
      .sort((a, b) => (b.split(' ').length - a.split(' ').length) || (b.length - a.length));

    if (candidates.length) {
      const best = candidates[0];
      if (plausible(best)) return toTitleCase(best);
    }

    return null;
  };

  const __nameOcrCache = new Map();

  const recognizeNameFromIDFrontFast = async (img, keyUrl = '') => {
    if (keyUrl && __nameOcrCache.has(keyUrl)) return { name: __nameOcrCache.get(keyUrl), mode: 'cache' };

    const tryAngles = [0, -2, 2, -3, 3];
    const tryRegions = (base) => [
      cropPercent(base, 0.15, 0.18, 0.78, 0.40),
      cropPercent(base, 0.18, 0.22, 0.75, 0.35),
      cropPercent(base, 0.22, 0.26, 0.70, 0.30)
    ];
    const rotateSmall = (imgIn, deg) => {
      if (!deg) return imgIn;
      try {
        const w = imgIn.width || imgIn.naturalWidth;
        const h = imgIn.height || imgIn.naturalHeight;
        const rad = (deg * Math.PI) / 180;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.translate(w/2, h/2); ctx.rotate(rad);
        ctx.drawImage(imgIn, -w/2, -h/2);
        return c;
      } catch { return imgIn; }
    };

    for (const ang of tryAngles) {
      const rotated = rotateSmall(img, ang);
      const base = preprocessForOCR(rotated, 1.6, false);
      for (const region of tryRegions(base)) {
        try {
          let { text } = await recognizeText(region, { tessedit_pageseg_mode: 6 });
          let name = extractNameFromIDText(text);
          if (name) { if (keyUrl) __nameOcrCache.set(keyUrl, name); return { name, mode: 'fast-psm6' }; }
          const bin = preprocessForOCR(region, 1.0, true);
          ({ text } = await recognizeText(bin, { tessedit_pageseg_mode: 7 }));
          name = extractNameFromIDText(text);
          if (name) { if (keyUrl) __nameOcrCache.set(keyUrl, name); return { name, mode: 'fast-psm7-binary' }; }
        } catch {}
      }
    }

    return { name: null, mode: 'none' };
  };

  const manualVerifyID = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Verifying...' }
    }));

    try {
      const loadedImg = await loadImageWithCORS(imageUrl);

      if (label && label.toLowerCase().includes('front')) {
        try {
          const pre1 = preprocessForOCR(loadedImg, 2.2, false);
          let { data: { text: ocrText1 } } = await Tesseract.recognize(pre1, 'eng', {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ,-'
          });
          let text = (ocrText1 || '').trim();

          if (!text || text.length < 8) {
            const pre2 = preprocessForOCR(loadedImg, 2.4, true);
            const { data: { text: ocrText2 } } = await Tesseract.recognize(pre2, 'eng', {
              tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ,-'
            });
            text = (ocrText2 || '').trim();
          }
          
          let extractedName = null;
          try {
            const fast = await recognizeNameFromIDFrontFast(loadedImg, imageUrl);
            extractedName = fast?.name || null;
          } catch {}

          if (!extractedName) {
            const up = (text || '').toUpperCase();
            const sanitized = up
              .replace(/NATIONALITY[^\n]*\n?/g, ' ')
              .replace(/SEX[^\n]*\n?/g, ' ')
              .replace(/BIRTH[^\n]*\n?/g, ' ')
              .replace(/ADDRESS[^\n]*\n?/g, ' ');
            extractedName = extractNameFromIDText(sanitized);
          }

          const detectIdType = (raw) => {
            const t = (raw || '').toUpperCase();
            if (/PHILIPPINE\s*IDENTIFICATION\s*CARD|PAMBANSANG\s*PAGKAKAKILANLAN|PHILSYS|PSN\s*ID|REPUBLIC\s*OF\s*THE\s*PHILIPPINES/.test(t)) return 'Philippine Identification Card';
            if (/DRIVER'?S\s*LICENSE|LAND\s*TRANSPORTATION\s*OFFICE|\bLTO\b/.test(t)) return 'Driver\'s License';
            if (/POSTAL\s*ID/.test(t)) return 'Postal ID';
            if (/SSS|UMID/.test(t)) return 'SSS/UMID';
            return 'Unknown';
          };
          const idType = detectIdType(text);
          
          if (extractedName) {
            try {
              const tokens = extractedName.split(/\s+/).filter(Boolean);
              let firstName = tokens[0] || '';
              let lastName = tokens[tokens.length - 1] || '';
              let middleName = tokens.slice(1, -1).join(' ') || '';
              const particles = new Set(['De','Del','Dei','Da','Di','La','Le','Von','Van','Dy','Du','Mac','Mc','San','Santa','Santo']);
              if (tokens.length >= 3) {
                const secondLast = tokens[tokens.length - 2];
                if (particles.has(secondLast)) {
                  lastName = tokens.slice(tokens.length - 2).join(' ');
                  middleName = tokens.slice(1, -2).join(' ') || '';
                }
              }
 
              setSelectedRegistration(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                if (!updated.firstName && firstName) updated.firstName = firstName;
                if (!updated.lastName && lastName) updated.lastName = lastName;
                if (!updated.middleName && middleName) updated.middleName = middleName;
                return updated;
              });
            } catch {}
          }
 
          setValidationStatus(prev => ({
            ...prev,
            [label]: {
              status: (text && text.trim()) ? 'valid' : 'invalid',
              message: extractedName ? `Name: ${extractedName}` : (text && text.trim()) ? 'Text detected' : 'No text detected',
              details: `Type of ID: ${idType}`
            }
          }));

          if (extractedName) {
            showInfoModal('Verification Success', [
              { label: 'Type of ID', value: idType },
              { label: 'Name', value: extractedName }
            ]);
          }
        } catch (ocrErr) {
          setValidationStatus(prev => ({
            ...prev,
            [label]: { status: 'manual', message: 'Text extraction failed. Try a clearer, closer photo of the name line.' }
          }));
        }
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'manual', message: 'Manual review required' }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Verification failed' }
      }));
    } finally {
      setIsValidating(false);
    }
  };

  const verifyID = async (imageUrl, label) => {
    console.log('Using manual ID verification due to CORS restrictions');
    return manualVerifyID(imageUrl, label);
  };

  const manualVerifyFace = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Verifying...' }
    }));

    try {
      const loadedImg = await loadImageForTensorFlow(imageUrl);
      if (tfModels.blazeface) {
        try {
          const faces = await tfModels.blazeface.estimateFaces(loadedImg, false);
          const faceCount = faces.length;
          setValidationStatus(prev => ({
            ...prev,
            [label]: {
              status: faceCount > 0 ? 'valid' : 'invalid',
              message: faceCount > 0 ? 'Face detected' : 'No face detected'
            }
          }));
        } catch (err) {
          setValidationStatus(prev => ({
            ...prev,
            [label]: { status: 'manual', message: 'Automatic face detection failed' }
          }));
        }
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'manual', message: 'Face model not loaded' }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Automatic face detection failed' }
      }));
    }
  };

  const verifyPaymentProof = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Extracting payment details...' }
    }));

    try {
      const loadedImg = await loadImageWithCORS(imageUrl);
      const { data: { text, confidence } } = await Tesseract.recognize(loadedImg, 'eng');

      const parsePaymentText = (raw) => {
        const normalized = raw.replace(/\s+/g, ' ').replace(/[|]/g, ' ').trim();

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
        const datePatterns = [
          /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4}\b\s*(?:\d{1,2}:\d{2}\s*(?:am|pm))?/i,
          /\b\d{4}-\d{2}-\d{2}\b\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)?/i,
          /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)?/i
        ];

        let amount = null;
        for (const re of amountPatterns) {
          const m = normalized.match(re);
          if (m && m[1]) {
            amount = m[1].replace(/[\s,]/g, '');
            break;
          }
        }

        let refNo = null;
        for (const re of refPatterns) {
          const m = normalized.match(re);
          if (m) {
            refNo = (m[2] || m[1] || '').toString().trim();
            refNo = refNo.replace(/\s{2,}/g, ' ').trim();
            break;
          }
        }
        if (!refNo) {
          const fallback = normalized.match(/ref(?:erence)?\s*(?:no\.?|#)?\s*[:\-]?\s*([A-Z0-9\s\-]{8,30})/i);
          if (fallback && fallback[1]) {
            refNo = fallback[1].replace(/[^A-Z0-9\s\-]/gi, '').replace(/\s{2,}/g, ' ').trim();
          }
        }
        if (!refNo) {
          const spacedDigits = normalized.match(/\b\d{3,6}(?:\s+\d{3,6}){1,5}\b/);
          if (spacedDigits) {
            refNo = spacedDigits[0].replace(/\s{2,}/g, ' ').trim();
          }
        }

        let dateTime = null;
        for (const re of datePatterns) {
          const m = normalized.match(re);
          if (m) { dateTime = m[0]; break; }
        }

        return { amount, refNo, dateTime };
      };

      const parsed = parsePaymentText(text || '');
      const foundAll = Boolean(parsed.amount && parsed.refNo && parsed.dateTime);
      const foundAny = parsed.amount || parsed.refNo || parsed.dateTime;

      setValidationStatus(prev => ({
        ...prev,
        [label]: {
          status: foundAny ? 'valid' : (confidence > 30 ? 'partial' : 'manual'),
          message: foundAny
            ? `Amount: ${parsed.amount || 'N/A'}, Ref No: ${parsed.refNo || 'N/A'}${parsed.dateTime ? `, Date: ${parsed.dateTime}` : ''}`
            : 'Text detected but could not find Amount/Ref No'
        }
      }));

      if (foundAll) {
        showInfoModal('Verification Success', [
          { label: 'Amount', value: parsed.amount },
          { label: 'Ref No.', value: parsed.refNo },
          { label: 'Date', value: parsed.dateTime }
        ]);
      } else if (!parsed.amount && !parsed.refNo) {
        showInfoModal('Verification Failed', [
          { label: 'Reason', value: 'Could not detect Amount and Reference No.' }
        ]);
      }
    } catch (error) {
      console.error('Payment proof OCR failed:', error);
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Payment OCR failed' }
      }));
    }
  };

  const verifyFace = async (imageUrl, label) => {
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Verifying face' }
    }));

    try {
      const loadedImg = await loadImageForTensorFlow(imageUrl);
      const width = loadedImg.width || 300;
      const height = loadedImg.height || 200;

      if (width < 64 || height < 64) {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'manual', message: 'Image too small for detection' }
        }));
        return;
      }

      let faceCount = 0;
      let confidence = 0;
      let detectionMethod = 'none';

      if (tfModels.blazeface) {
        try {
          const predictions = await tfModels.blazeface.estimateFaces(loadedImg, false);
          faceCount = predictions.length;
          detectionMethod = 'BlazeFace';
          confidence = predictions[0]?.probability?.[0] ?? (faceCount > 0 ? 0.8 : 0);
        } catch (e) {
          setValidationStatus(prev => ({
            ...prev,
            [label]: { status: 'manual', message: 'Automatic face detection failed' }
          }));
          return;
        }
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'manual', message: 'Face model not loaded' }
        }));
        return;
      }

      if (faceCount > 0) {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'valid', message: 'Face detected'}
        }));
        showInfoModal('Verification Success', [
          { label: 'Face', value: 'Detected' }
        ]);
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'invalid', message: 'No face detected' }
        }));
        showInfoModal('Verification Result', [
          { label: 'Face', value: 'No face detected' }
        ]);
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { status: 'error', message: 'Face verification error' }
      }));
    } finally {
      setIsValidating(false);
    }
  };

  const handleImageClick = (url, label) => {
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
  };

  const handleManualVerification = () => {
    const { url, label } = currentImage;

    setIsVerifying(prev => ({ ...prev, [label]: true }));
    
    console.log('Manual verification triggered for:', label);
    console.log('Image URL:', url);

    const labelLower = (label || '').toLowerCase();

    const finish = () => setIsVerifying(prev => ({ ...prev, [label]: false }));

    const run = async () => {
      try {
        if (labelLower.includes('payment') || labelLower.includes('proof') || labelLower.includes('receipt')) {
          await verifyPaymentProof(url, label);
        } else if (labelLower.includes('id') && !labelLower.includes('back')) {
          await verifyID(url, label);
        } else if (labelLower.includes('selfie')) {
          if (!modelsLoaded) {
            console.warn('AI models not loaded yet');
            setValidationStatus(prev => ({
              ...prev,
              [label]: { status: 'error', message: 'AI models not loaded yet' }
            }));
            return;
          }
          await verifyFace(url, label);
        }
      } finally {
        finish();
      }
    };

    run();
  };

  const showInfoModal = (title, fields) => {
    setInfoModal({ visible: true, title, fields });
  };

  const closeInfoModal = () => setInfoModal({ visible: false, title: '', fields: [] });

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
    setValidationStatus({});
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
  };

  const removeFromPendingRegistrations = async (id) => {
    try {
     await database.ref(`Registrations/RegistrationApplications/${id}`).remove();
    } catch (error) {
      console.error('Error removing from pending registrations:', error);
      throw error;
    }
  };

  const handleApproveClick = () => {
    setShowApproveConfirmation(true);
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveConfirmation(false);
    await processAction(selectedRegistration, 'approve');
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

    const rejectionReason = selectedReason === "Other" 
      ? customReason 
      : selectedReason;

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedRegistration, 'reject', selectedReason === "Other" ? customReason : selectedReason);
  };

const processAction = async (registration, action, rejectionReason = '') => {
  setActionInProgress(true);
  setIsProcessing(true);
  setCurrentAction(action);

  try {
    if (action === 'approve') {
      const samePersonCheck = await checkIfSamePersonExists(
        registration.email, 
        registration.firstName, 
        registration.lastName
      );

      if (!samePersonCheck.exists) {
        // Only block if email exists with DIFFERENT name
        const emailWithDifferentName = await checkIfEmailExistsInDatabase(
          registration.email,
          registration.firstName,
          registration.lastName
        );
        
        if (emailWithDifferentName) {
          setErrorMessage('This email is already registered to a different member.');
          setErrorModalVisible(true);
          setIsProcessing(false);
          setActionInProgress(false);
          return;
        }
      }
      
      // If we get here, either:
      // 1. Same person exists (update their record)
      // 2. Person doesn't exist but email is not used by anyone else (create new)
      // 3. Email exists in Firebase Auth but not in our database (create new)
      
      const memberId = await processDatabaseApprove(registration);
     await removeFromPendingRegistrations(registration.email.replace(/[.#$[\]]/g, '_'));
      
      setSuccessMessage('Registration approved successfully!');
      setSuccessMessageModalVisible(true);
      
      const approveData = {
        ...registration,
        memberId,
        dateApproved: formatDate(new Date()),
        approvedTime: formatTime(new Date())
      };

      setSelectedRegistration(prev => ({
        ...prev,
        memberId,
        dateApproved: approveData.dateApproved, 
        approvedTime: approveData.approvedTime,
        status: 'approved'
      }));

      setPendingApiCall({
        type: 'approve',
        data: approveData
      });

    } else {
      // Rejection logic remains the same
      await processDatabaseReject(registration, rejectionReason);
      await removeFromPendingRegistrations(registration.email.replace(/[.#$[\]]/g, '_'));
      
      setSuccessMessage('Registration rejected successfully!');
      setSuccessMessageModalVisible(true);
      
      const rejectData = {
        ...registration,
        dateRejected: formatDate(new Date()),
        rejectedTime: formatTime(new Date()),
        rejectionReason
      };

      setSelectedRegistration(prev => ({
        ...prev,
        dateRejected: rejectData.dateRejected,
        rejectedTime: rejectData.rejectedTime,
        rejectionReason,
        status: 'rejected'
      }));

      setPendingApiCall({
        type: 'reject',
        data: rejectData
      });
    }
  } catch (error) {
    console.error('Error processing action:', error);
    setErrorMessage(error.message || 'An error occurred. Please try again.');
    setErrorModalVisible(true);
  } finally {
    setIsProcessing(false);
    setActionInProgress(false);
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

const checkIfEmailExistsInDatabase = async (email, firstName, lastName) => {
  try {
    const membersSnap = await database.ref('Members').once('value');
    const membersData = membersSnap.val() || {};
    
    // Check if email exists with DIFFERENT name (this should block approval)
    const emailExistsWithDifferentName = Object.values(membersData).some(u => 
      u.email?.toLowerCase() === email.toLowerCase() &&
      (u.firstName?.toLowerCase() !== firstName.toLowerCase() || 
       u.lastName?.toLowerCase() !== lastName.toLowerCase())
    );
    
    if (emailExistsWithDifferentName) return true;

    const adminsSnap = await database.ref('Users/Admin').once('value');
    const adminsData = adminsSnap.val() || {};
    
    // Check if email exists with DIFFERENT name in Admins
    const adminEmailExistsWithDifferentName = Object.values(adminsData).some(u => 
      u.email?.toLowerCase() === email.toLowerCase() &&
      (u.firstName?.toLowerCase() !== firstName.toLowerCase() || 
       u.lastName?.toLowerCase() !== lastName.toLowerCase())
    );
    
    return adminEmailExistsWithDifferentName;
  } catch (err) {
    console.error('DB email check error:', err);
    return false;
  }
};

const checkIfSamePersonExists = async (email, firstName, lastName) => {
  try {
    const membersSnap = await database.ref('Members').once('value');
    const membersData = membersSnap.val() || {};
    
    // Check if same person exists in Members (all three fields must match)
    const memberEntry = Object.entries(membersData).find(([_, member]) => 
      member.email?.toLowerCase() === email.toLowerCase() &&
      member.firstName?.toLowerCase() === firstName.toLowerCase() &&
      member.lastName?.toLowerCase() === lastName.toLowerCase()
    );

    if (memberEntry) {
      return { exists: true, source: 'member', id: memberEntry[0], data: memberEntry[1] };
    }

    const adminsSnap = await database.ref('Users/Admin').once('value');
    const adminsData = adminsSnap.val() || {};
    
    // Check if same person exists in Admins (all three fields must match)
    const adminEntry = Object.entries(adminsData).find(([_, admin]) => 
      admin.email?.toLowerCase() === email.toLowerCase() &&
      admin.firstName?.toLowerCase() === firstName.toLowerCase() &&
      admin.lastName?.toLowerCase() === lastName.toLowerCase()
    );

    if (adminEntry) {
      return { exists: true, source: 'admin', id: adminEntry[0], data: adminEntry[1] };
    }

    return { exists: false };
  } catch (err) {
    console.error('DB same person check error:', err);
    return { exists: false };
  }
};

  const updateFunds = async (amount) => {
    try {
      const fundsRef = database.ref('Settings/Funds');
      const snapshot = await fundsRef.once('value');
      const currentFunds = snapshot.val() || 0;
      const newFundsAmount = currentFunds + parseFloat(amount);
      
      await fundsRef.set(newFundsAmount);
      
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0];
      const fundsHistoryRef = database.ref(`Settings/FundsHistory/${dateKey}`);
      await fundsHistoryRef.set(newFundsAmount);
      
    } catch (error) {
      console.error('Error updating funds:', error);
      throw error;
    }
  };

const processDatabaseApprove = async (reg) => {
  try {
    const { id, email, password, firstName, lastName, registrationFee = 0, ...rest } = reg;
    let userId = null;
    
    const samePersonCheck = await checkIfSamePersonExists(email, firstName, lastName);
    
    if (samePersonCheck.exists) {
      // Update existing member/admin record
      const now = new Date();
      const approvedDate = formatDate(now);
      const approvedTime = formatTime(now);

      const updateData = {};

      Object.keys(rest).forEach(key => {
        if (samePersonCheck.data[key] === undefined || samePersonCheck.data[key] !== rest[key]) {
          updateData[key] = rest[key];
        }
      });

      const currentBalance = samePersonCheck.data.balance || 0;
      updateData.balance = currentBalance + parseFloat(registrationFee);

      updateData.dateApproved = approvedDate;
      updateData.approvedTime = approvedTime;

      const existingRole = samePersonCheck.data.role;
      const existingStatus = samePersonCheck.data.status;
      const isAdminLike = samePersonCheck.source === 'admin' || existingRole === 'admin' || existingRole === 'coadmin';
      if (isAdminLike) {
        updateData.role = existingRole || 'admin';
        updateData.status = existingStatus || 'active';
      } else {
        updateData.status = 'active';
      }

      const transactionData = {
        type: 'registration',
        amount: parseFloat(registrationFee),
        dateApplied: rest?.dateCreated || rest?.dateApplied || '',
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        timestamp: now.getTime(),
        status: 'approved',
        memberId: parseInt(samePersonCheck.id),
        firstName,
        lastName,
        email,
        transactionId: `REG-${Date.now()}`,
        description: 'Registration fee payment'
      };

      await database.ref(`Transactions/Registrations/${samePersonCheck.id}/${transactionData.transactionId}`).set(transactionData);

      if (isAdminLike) {
        const adminTxnRef = database.ref(`Transactions/Admins/${samePersonCheck.id}`).push();
        await adminTxnRef.set({
          transactionId: adminTxnRef.key,
          type: 'AdminRegistrationApproval',
          dateApproved: approvedDate,
          approvedTime: approvedTime,
          firstName,
          lastName,
          email,
          memberId: parseInt(samePersonCheck.id),
          status: 'approved',
          description: 'Registration approved for existing Admin'
        });
      }

      const memberRef = database.ref(`Members/${samePersonCheck.id}`);
      const memberSnap = await memberRef.once('value');
      if (!memberSnap.exists()) {
        await memberRef.set({
          id: parseInt(samePersonCheck.id),
          firstName,
          lastName,
          email,
          ...rest,
          dateApproved: approvedDate,
          approvedTime: approvedTime,
          investment: updateData.balance || parseFloat(registrationFee) || 0,
          balance: updateData.balance || parseFloat(registrationFee) || 0,
          status: isAdminLike ? (existingStatus || 'active') : 'active',
          role: isAdminLike ? (existingRole || 'admin') : (rest?.role || 'member')
        });
      } else {
        await memberRef.update(updateData);
      }
      await updateFunds(registrationFee);

      await database.ref(`Registrations/ApprovedRegistrations/${id}`).set({
        firstName,
        lastName,
        ...rest,
        email,
        dateCreated: rest?.dateCreated || rest?.dateApplied || '',
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        memberId: parseInt(samePersonCheck.id),
        status: 'approved'
      });

      return parseInt(samePersonCheck.id);
    }

    // Check if email exists with different name (should have been caught earlier, but double-check)
    const emailWithDifferentName = await checkIfEmailExistsInDatabase(email, firstName, lastName);
    if (emailWithDifferentName) {
      throw new Error('This email is already registered to a different member.');
    }

    // Try to create Firebase Auth account, but handle "email already in use" gracefully
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      userId = userCredential.user.uid;
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        // Email exists in Firebase Auth but not in our database - this is OK
        // We'll proceed without creating a new auth account
        console.log('Email exists in Firebase Auth but not in database, proceeding...');
        userId = `auth-${Date.now()}`; // Create a placeholder ID
      } else {
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
    
    const initialBalance = parseFloat(registrationFee) || 0;
    
    const transactionData = {
      type: 'registration',
      amount: parseFloat(registrationFee),
      dateApplied: rest?.dateCreated || rest?.dateApplied || '',
      dateApproved: approvedDate,
      approvedTime: approvedTime,
      timestamp: now.getTime(),
      status: 'approved',
      memberId: newId,
      firstName,
      lastName,
      email,
      transactionId: `REG-${Date.now()}`,
      description: 'Registration fee payment'
    };

    await database.ref(`Members/${newId}`).set({
      id: newId,
      uid: userId,
      firstName,
      lastName,
      ...rest,
      email,
      dateApproved: approvedDate,
      approvedTime: approvedTime,
      balance: initialBalance,
      investment: initialBalance,
      loans: 0.0,
      status: 'active'
    });

    await database.ref(`Transactions/Registrations/${newId}/${transactionData.transactionId}`).set(transactionData);

    const roleFromReg = (rest && rest.role) || (reg && reg.role);
    if (roleFromReg === 'admin' || roleFromReg === 'coadmin') {
      const adminTxnRef = database.ref(`Transactions/Admins/${newId}`).push();
      await adminTxnRef.set({
        transactionId: adminTxnRef.key,
        type: 'AdminRegistrationApproval',
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        firstName,
        lastName,
        email,
        memberId: newId,
        status: 'approved',
        description: 'Registration approved for Admin'
      });
    }

    await updateFunds(registrationFee);
    
    await database.ref(`Registrations/ApprovedRegistrations/${id}`).set({
      firstName,
      lastName,
      ...rest,
      email,
      dateCreated: rest?.dateCreated || rest?.dateApplied || '',
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
    console.log('Sending approval email in background...');
    const response = await ApproveRegistration({
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      password: reg.password,
      dateApproved: reg.dateApproved,
      approvedTime: reg.approvedTime,
      memberId: reg.memberId
    });
    
    if (!response.ok) {
      console.warn('Background: Failed to send approval email');
    } else {
      console.log('Background: Approval email sent successfully');
    }
  } catch (err) {
    console.error('Background API approve error:', err);
    // Don't throw error - this runs in background
  }
};

const callApiReject = async (reg) => {
  try {
    console.log('Sending rejection email in background...');
    const response = await RejectRegistration({
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      dateRejected: reg.dateRejected,
      rejectedTime: reg.rejectedTime,
      rejectionReason: reg.rejectionReason || 'Rejected by admin'
    });
    
    if (!response.ok) {
      console.warn('Background: Failed to send rejection email');
    } else {
      console.log('Background: Rejection email sent successfully');
    }
  } catch (err) {
    console.error('Background API reject error:', err);
    // Don't throw error - this runs in background
  }
};

const handleSuccessOk = async () => {
  setSuccessMessageModalVisible(false);
  closeModal();
  setSelectedRegistration(null);
  setCurrentAction(null);
  
  // Call API in background without blocking the UI
  if (pendingApiCall) {
    // Don't await these calls - let them run in background
    if (pendingApiCall.type === 'approve') {
      callApiApprove(pendingApiCall.data).catch(error => {
        console.error('Background API approval error:', error);
        // You could show a subtle notification here if needed
      });
    } else if (pendingApiCall.type === 'reject') {
      callApiReject(pendingApiCall.data).catch(error => {
        console.error('Background API rejection error:', error);
        // You could show a subtle notification here if needed
      });
    }
    setPendingApiCall(null);
  }
  
  // Refresh data after a short delay to ensure UI is updated first
  setTimeout(() => {
    refreshData();
  }, 500);
};

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (selectedRegistration?.validIdFront) {
      images.push({ 
        url: selectedRegistration.validIdFront, 
        label: 'Valid ID Front' 
      });
    }
    if (selectedRegistration?.validIdBack) {
      images.push({ 
        url: selectedRegistration.validIdBack, 
        label: 'Valid ID Back' 
      });
    }
    if (selectedRegistration?.selfie) {
      images.push({ 
        url: selectedRegistration.selfie, 
        label: 'Selfie' 
      });
    }
    if (selectedRegistration?.selfieWithId) {
      images.push({ 
        url: selectedRegistration.selfieWithId, 
        label: 'Selfie with ID' 
      });
    }
    if (selectedRegistration?.paymentProof) {
      images.push({ 
        url: selectedRegistration.paymentProof, 
        label: 'Payment Proof' 
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

  if (!registrations.length) return (
    <div style={styles.noDataContainer}>
      <FaUser style={styles.noDataIcon} />
      <div>No registration applications available</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Contact</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Date Applied</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
  {registrations.map((item, index) => (
    <tr key={index} style={styles.tableRow}>
      <td style={styles.tableCell}>
        <div style={{ fontWeight: '500' }}>
          {item.firstName} {item.lastName}
        </div>
      </td>
      <td style={styles.tableCell}>{item.email}</td>
      <td style={styles.tableCell}>{item.phoneNumber}</td>
      <td style={styles.tableCell}>
        {item.dateApplied || item.dateCreated || 'N/A'}
      </td>
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

      {/* Registration Details Modal */}
      {modalVisible && selectedRegistration && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaUser />
                Registration Details
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
                        {selectedRegistration.firstName} {selectedRegistration.middleName} {selectedRegistration.lastName}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.email}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaPhone />
                        Contact:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.phoneNumber}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaVenusMars />
                        Gender:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.gender}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaHeart />
                        Civil Status:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.civilStatus}</span>
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
                      <span style={styles.fieldValue}>{selectedRegistration.dateOfBirth}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Age:</span>
                      <span style={styles.fieldValue}>{selectedRegistration.age}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMapMarkerAlt />
                        Birth Place:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.placeOfBirth}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaMapMarkerAlt />
                        Address:
                      </span>
                      <span style={styles.fieldValue}>{selectedRegistration.address}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial & Documents */}
                <div style={styles.column}>
                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Financial Information
                    </h3>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Registration Fee:</span>
                      <span style={styles.financialValue}>
                        ₱{selectedRegistration.registrationFee ? parseFloat(selectedRegistration.registrationFee).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                 <div style={styles.section}>
  <h3 style={styles.sectionTitle}>
    <FaIdCard />
    Application Details
  </h3>
  <div style={styles.fieldGroup}>
    <span style={styles.fieldLabel}>Date Applied:</span>
    <span style={styles.fieldValue}>
      {selectedRegistration.dateApplied || selectedRegistration.dateCreated || 'N/A'}
    </span>
  </div>
  <div style={styles.fieldGroup}>
    <span style={styles.fieldLabel}>Status:</span>
    <span style={{
      ...styles.statusBadge,
      ...(selectedRegistration.status === 'approved' ? styles.statusApproved : 
           selectedRegistration.status === 'rejected' ? styles.statusRejected : styles.statusPending)
    }}>
      {selectedRegistration.status || 'pending'}
    </span>
  </div>
  {selectedRegistration.dateApproved && (
    <div style={styles.fieldGroup}>
      <span style={styles.fieldLabel}>Date Approved:</span>
      <span style={styles.fieldValue}>{selectedRegistration.dateApproved}</span>
    </div>
  )}
  {selectedRegistration.dateRejected && (
    <div style={styles.fieldGroup}>
      <span style={styles.fieldLabel}>Date Rejected:</span>
      <span style={styles.fieldValue}>{selectedRegistration.dateRejected}</span>
    </div>
  )}
</div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Submitted Documents
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedRegistration.validIdFront && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedRegistration.validIdFront, 'Valid ID Front', 0)}
                        >
                          <img
                            src={selectedRegistration.validIdFront}
                            alt="Valid ID Front"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Valid ID Front</div>
                        </div>
                      )}
                      {selectedRegistration.validIdBack && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedRegistration.validIdBack, 'Valid ID Back', 1)}
                        >
                          <img
                            src={selectedRegistration.validIdBack}
                            alt="Valid ID Back"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Valid ID Back</div>
                        </div>
                      )}
                      {selectedRegistration.selfie && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedRegistration.selfie, 'Selfie', 2)}
                        >
                          <img
                            src={selectedRegistration.selfie}
                            alt="Selfie"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Selfie</div>
                        </div>
                      )}
                      {selectedRegistration.paymentProof && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedRegistration.paymentProof, 'Payment Proof', 3)}
                        >
                          <img
                            src={selectedRegistration.paymentProof}
                            alt="Payment Proof"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Payment Proof</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedRegistration.status !== 'approved' && selectedRegistration.status !== 'rejected' && (
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
            <p style={styles.modalText}>Are you sure you want to approve this registration?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this registration?</p>
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
        <div style={{ ...styles.modalOverlay, zIndex: 3000 }}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }} 
              onClick={closeModal}
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
              {!(currentImage.label?.toLowerCase().includes('valid id back') || currentImage.label?.toLowerCase().includes('selfie with id')) && (
                <>
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
                      <>
                        {currentImage.label?.includes('Payment') || currentImage.label?.includes('Proof') ? 'Verify Payment' : 
                         currentImage.label?.includes('ID') ? 'Verify ID' : 'Verify Face'}
                      </>
                    )}
                  </button>
                </>
              )}
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

export default Registrations;