import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ApproveRegistration, RejectRegistration } from '../../../../../Server/api';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as blazeface from '@tensorflow-models/blazeface';
import Tesseract from 'tesseract.js';

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
    backgroundColor: '#fff'
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
    outline: 'none'
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
    outline: 'none'
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
    outline: 'none'
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    color: '#FFF'
  },
  rejectButton: {
    backgroundColor: '#f44336',
    color: '#FFF'
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
  viewText: {
    color: '#2D5783',
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
    outline: 'none'
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
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  largeImage: {
    width: '90%',
    maxWidth: '1100px',
    maxHeight: '82vh',
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
    position: 'fixed',
    top: '20px',
    right: '28px',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    zIndex: 2200
  },
  imageViewerNav: {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '16px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '50%',
    border: 'none',
    outline: 'none',
    zIndex: 2200
  },
  prevButton: {
    left: '28px'
  },
  nextButton: { 
    right: '28px'
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
    cursor: 'pointer'
  },
  validationText: {
    color: 'white',
    fontSize: '12px',
    marginTop: '8px',
    textAlign: 'center'
  },
  validText: {
    color: '#4CAF50'
  },
  invalidText: {
    color: '#f44336'
  },
  verifyingText: {
    color: '#FFC107'
  },
  partialText: {
    color: '#FF9800'
  },
  manualText: {
    color: '#9E9E9E'
  },
  paymentStatus: {
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  paidStatus: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  unpaidStatus: {
    backgroundColor: '#f44336',
    color: 'white'
  },
  verifyButton: {
    padding: '8px 16px',
    backgroundColor: '#2D5783',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    '&:hover': {
      backgroundColor: '#1a3d66'
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  imageViewerHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px'
  },
  // Overlay modal used inside the image viewer for verification success
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
    boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
    textAlign: 'center'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: '12px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    margin: '6px 0'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#555',
    fontSize: '13px'
  },
  infoValue: {
    color: '#333',
    fontSize: '13px',
    maxWidth: '60%',
    wordBreak: 'break-word',
    textAlign: 'right'
  },
  infoCloseButton: {
    marginTop: '14px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2D5783',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold'
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
  // Per-image verifying state keyed by label to avoid cross-image spinners
  const [isVerifying, setIsVerifying] = useState({});
  const [tfModels, setTfModels] = useState({
    mobilenet: null,
    blazeface: null
  });
  const [pendingApiCall, setPendingApiCall] = useState(null);
  // Info modal state for per-image verification success inside the image viewer
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', fields: [] });

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading TensorFlow.js models...');
        
        // Set TensorFlow.js backend to webgl for better performance
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js backend ready');
        
        // Load models sequentially to avoid conflicts
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
        
        // Skip face-api.js loading to avoid conflicts with TensorFlow
        console.log('Skipping face-api.js models to avoid conflicts with TensorFlow.js');
        
        // Set models as loaded if at least one TensorFlow model loaded
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
        
        // Fallback to CPU backend if WebGL fails
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

  // Image loader for TensorFlow: try CORS-friendly modes and proxy fallback so tf.browser.fromPixels can read pixels
  const loadImageForTensorFlow = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const tryLoad = (mode, attempt) => {
        const img = new Image();
        if (mode) img.crossOrigin = mode; // 'anonymous' or 'use-credentials'
        img.onload = () => {
          console.log(`TF image loaded with mode: ${mode || 'none'} (attempt ${attempt})`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`TF image failed with mode: ${mode || 'none'} (attempt ${attempt})`);
          if (attempt === 1) {
            // Try with credentials
            tryLoad('use-credentials', 2);
          } else if (attempt === 2) {
            // Try without CORS (may still work for same-origin)
            tryLoad(null, 3);
          } else if (attempt === 3) {
            // Final: use proxy endpoint to serve with proper CORS
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
      // Start with anonymous which is required for canvas pixel access
      tryLoad('anonymous', 1);
    });
  };

  const loadImageWithCORS = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      // Create a canvas to handle CORS issues with Firebase Storage
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
          return img; // Return original image if canvas fails
        }
      };

      // Try multiple CORS strategies
      const tryLoadImage = (corsMode, attempt = 1) => {
        const newImg = new Image();
        
        // Set CORS mode if specified
        if (corsMode) {
          newImg.crossOrigin = corsMode;
        }
        
        newImg.onload = () => {
          console.log(`Image loaded successfully with CORS mode: ${corsMode || 'none'} (attempt ${attempt})`);
          
          // For Firebase Storage images, try to create a canvas to avoid CORS issues
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
            // Try with use-credentials
            tryLoadImage('use-credentials', 2);
          } else if (attempt === 2) {
            // Try without CORS
            tryLoadImage(null, 3);
          } else if (attempt === 3) {
            // Try proxy endpoint to bypass CORS for Firebase Storage
            const apiHost = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
            const proxyBase = (import.meta?.env?.VITE_SERVER_URL) || apiHost;
            const proxyUrl = `${proxyBase}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            const proxied = new Image();
            proxied.crossOrigin = 'anonymous';
            proxied.onload = () => resolve(proxied);
            proxied.onerror = () => {
              // Final fallback canvas
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
      
      // Start with anonymous CORS
      tryLoadImage('anonymous', 1);
    });
  };

  // Image preprocessing for OCR: scale up, grayscale, contrast/threshold
  const preprocessForOCR = (img, scale = 2, binary = false) => {
    try {
      const srcW = img.width || img.naturalWidth || 0;
      const srcH = img.height || img.naturalHeight || 0;
      if (!srcW || !srcH) return img; // fallback if dimensions missing

      // Ensure minimum width for better OCR (reduced for performance)
      const minTargetW = Math.max(800, Math.floor(srcW * scale));
      const factor = minTargetW / srcW;
      const targetW = Math.floor(srcW * factor);
      const targetH = Math.floor(srcH * factor);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // Draw scaled image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Get pixels and apply grayscale + enhancement
      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const d = imageData.data;

      // contrast factor: moderate + threshold if binary
      const contrast = binary ? 80 : 50; // 0..100
      const c = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const thresh = 180; // threshold level when binary

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let y = 0.299 * r + 0.587 * g + 0.114 * b; // grayscale
        // apply contrast
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

  // --- Helpers to improve OCR for ID names ---
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
    // Ensure Tesseract never sees too tiny images
    const big = upsampleIfSmall(imgOrCanvas, 800);
    const { data: { text, confidence } } = await Tesseract.recognize(big, 'eng', opts);
    return { text: (text || '').trim(), confidence: confidence ?? 0 };
  };

  const recognizeNameFromIDFront = async (img) => {
    // Build candidate canvases: full preprocessed + likely name regions
    const base = preprocessForOCR(img, 2.4, false);
    const regions = [
      base,
      cropPercent(base, 0.18, 0.25, 0.75, 0.35), // wider band covering name area
      cropPercent(base, 0.22, 0.28, 0.70, 0.28), // typical name band (right of photo)
      cropPercent(base, 0.18, 0.35, 0.74, 0.25), // slightly lower/wider
      cropPercent(base, 0.30, 0.30, 0.60, 0.25)  // tighter
    ];
    // Add binary versions to boost contrast
    const binaries = regions.map(r => preprocessForOCR(r, 1.0, true));
    const candidates = [...regions, ...binaries];

    const configs = [
      { tessedit_pageseg_mode: 7 }, // single line
      { tessedit_pageseg_mode: 6 }, // uniform block
      { tessedit_pageseg_mode: 7, preserve_interword_spaces: '1' }
    ];

    let best = { name: null, score: 0, details: '' };

    for (const canvas of candidates) {
      for (const cfg of configs) {
        try {
          const { text, confidence } = await recognizeText(canvas, cfg);
          const extracted = extractNameFromIDText(text);
          if (extracted) {
            // Score by length and confidence
            const score = (extracted.length) + (confidence || 0);
            if (score > best.score) {
              best = { name: extracted, score, details: `PSM:${cfg.tessedit_pageseg_mode}, conf:${confidence?.toFixed ? confidence.toFixed(1) : confidence}` };
            }
          }
        } catch (e) {
          // continue trying others
        }
      }
    }
    return best;
  };

  // Simple cache to avoid re-OCR on same image URL in one session
  const __nameOcrCache = new Map();

  const recognizeNameFromIDFrontFast = async (img, keyUrl = '') => {
    if (keyUrl && __nameOcrCache.has(keyUrl)) return { name: __nameOcrCache.get(keyUrl), mode: 'cache' };

    // Fast attempts on likely regions with tiny deskew to handle handheld photos
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

  // Function to extract name from ID text (robust for PH IDs like LTO Driver's License)
  const extractNameFromIDText = (rawText) => {
    if (!rawText) return null;

    // Normalize common OCR artifacts
    const text = rawText.replace(/[|]/g, 'I');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const upperLines = lines.map(l => l.toUpperCase());

    const clean = (s) => (s || '')
      .toUpperCase()
      .replace(/[^A-Z,'\-\s]/g, ' ') // keep letters, comma, hyphen, apostrophe
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Try to capture common PH ID pattern: LAST, FIRST MIDDLE
    // Works even when OCR spaces/commas are noisy
    for (const line of upperLines) {
      const L = clean(line);
      // e.g., "SARINO, LOUIS ANDRE DY" or with extra spaces
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
      if (t.length < 2) return false; // need at least first + last
      if ((s || '').length < 8) return false;
      if (t.some(w => /\d/.test(w))) return false;
      return true;
    };

    // 1) PhilID layout: APELYIDO/LAST NAME, MGA PANGALAN/GIVEN NAMES, GITNANG APELYIDO/MIDDLE NAME
    let philIdx = upperLines.findIndex(l => /(APELYIDO|LAST\s*NAME)/.test(l));
    if (philIdx !== -1) {
      // collect next few uppercase content lines that are not label lines
      const collected = [];
      for (let j = philIdx + 1; j < Math.min(philIdx + 8, upperLines.length); j++) {
        const raw = upperLines[j];
        if (/(APELYIDO|LAST\s*NAME|MGA\s*PANGALAN|GIVEN\s*NAMES|GITNANG\s*APELYIDO|MIDDLE\s*NAME|DATE\s*OF\s*BIRTH|ADDRESS|TIRAHAN)/.test(raw)) continue;
        let cand = clean(raw);
        if (!cand) continue;
        // stop if we hit obvious non-name content
        if (/(PHILIPPINES|REPUBLIC|DRIVER|LICENSE|NUMBER|SEX|WEIGHT|HEIGHT|EYES|CODE|EXPIRATION|AGENCY|BIRTH)/.test(cand)) break;
        // Only accept lines that look like names
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

    // 2) LTO layout cue: line contains both LAST NAME and FIRST NAME on same line
    let idx = upperLines.findIndex(l => /LAST\s*NAME.*FIRST\s*NAME/.test(l));
    if (idx !== -1) {
      for (let j = idx + 1; j < Math.min(idx + 4, upperLines.length); j++) {
        let cand = clean(upperLines[j]);
        if (!cand) continue;
        // Handle case where surname line ends with comma and given is on next line
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

    // 2) Explicit comma pattern anywhere: "LAST, FIRST [MIDDLE ...]"
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

    // 3) Combine two consecutive lines when first ends with a comma
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

    // 4) Fallback: choose a reasonable uppercase multi-word line, avoid common non-name words
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

  const manualVerifyID = async (imageUrl, label) => {
    // For Valid ID Front: run OCR and display only extracted text
    // For other labels, keep existing minimal status
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Verifying...' }
    }));

    try {
      const loadedImg = await loadImageWithCORS(imageUrl);

      // If this is the front side, extract only the name using Tesseract
      if (label && label.toLowerCase().includes('front')) {
        try {
          // Preprocess and run OCR; retry with binary threshold if needed
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
          
          // Fast path: minimal OCR on the name band
          let extractedName = null;
          try {
            const fast = await recognizeNameFromIDFrontFast(loadedImg, imageUrl);
            extractedName = fast?.name || null;
          } catch {}

          // Force-boost name accuracy for PhilID and LTO by scanning for known labels and avoiding 'NATIONALITY'
          if (!extractedName) {
            const up = (text || '').toUpperCase();
            // Remove obvious non-name chunks before parsing (e.g., NATIONALITY values like 'PHL M')
            const sanitized = up
              .replace(/NATIONALITY[^\n]*\n?/g, ' ')
              .replace(/SEX[^\n]*\n?/g, ' ')
              .replace(/BIRTH[^\n]*\n?/g, ' ')
              .replace(/ADDRESS[^\n]*\n?/g, ' ');
            extractedName = extractNameFromIDText(sanitized);
          }

          // Detect ID type from OCR text
          const detectIdType = (raw) => {
            const t = (raw || '').toUpperCase();
            // Detect PhilID with multiple cues in both EN and Filipino
            if (/PHILIPPINE\s*IDENTIFICATION\s*CARD|PAMBANSANG\s*PAGKAKAKILANLAN|PHILSYS|PSN\s*ID|REPUBLIC\s*OF\s*THE\s*PHILIPPINES/.test(t)) return 'Philippine Identification Card';
            if (/DRIVER'?S\s*LICENSE|LAND\s*TRANSPORTATION\s*OFFICE|\bLTO\b/.test(t)) return 'Driver\'s License';
            if (/POSTAL\s*ID/.test(t)) return 'Postal ID';
            if (/SSS|UMID/.test(t)) return 'SSS/UMID';
            return 'Unknown';
          };
          const idType = detectIdType(text);
          
          // If we got a name, auto-fill empty First/Middle/Last fields in the selected registration
          if (extractedName) {
            try {
              const tokens = extractedName.split(/\s+/).filter(Boolean);
              let firstName = tokens[0] || '';
              let lastName = tokens[tokens.length - 1] || '';
              let middleName = tokens.slice(1, -1).join(' ') || '';
              // Handle common multi-word last-name particles (e.g., "De la Cruz")
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

          // If we have a name, show success modal in viewer
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
        // Leave Valid ID Back as-is (no change requested): keep minimal
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
    // Always use manual verification due to CORS issues with TensorFlow
    console.log('Using manual ID verification due to CORS restrictions');
    return manualVerifyID(imageUrl, label);
  };

  const manualVerifyFace = async (imageUrl, label) => {
    // Minimal result: only show whether a face is detected or not
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'verifying', message: 'Verifying...' }
    }));

    try {
      // Use TF-friendly loader to avoid tainted canvas
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
        // Model unavailable -> fallback to minimal message
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
            // Normalize formats like 1,234.56 or 1 234.56 -> 1234.56
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

      // Update inline status for fallback/debugging
      setValidationStatus(prev => ({
        ...prev,
        [label]: {
          status: foundAny ? 'valid' : (confidence > 30 ? 'partial' : 'manual'),
          message: foundAny
            ? `Amount: ${parsed.amount || 'N/A'}, Ref No: ${parsed.refNo || 'N/A'}${parsed.dateTime ? `, Date: ${parsed.dateTime}` : ''}`
            : 'Text detected but could not find Amount/Ref No'
        }
      }));

      // If all fields present, open compact success modal inside image viewer
      if (foundAll) {
        showInfoModal('Verification Success', [
          { label: 'Amount', value: parsed.amount },
          { label: 'Ref No.', value: parsed.refNo },
          { label: 'Date', value: parsed.dateTime }
        ]);
      } else if (!parsed.amount && !parsed.refNo) {
        // Show failure modal if neither key field is detected
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
    // TensorFlow face verification (BlazeFace)
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
        // Show compact success modal for face detection
        showInfoModal('Verification Success', [
          { label: 'Face', value: 'Detected' }
        ]);
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { status: 'invalid', message: 'No face detected' }
        }));
        // Show modal when no face detected as requested
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
    
    // First open the image viewer
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
 
    // Do not auto-verify on open; verification is manual per image to avoid cross-process interference
  };

  const handleManualVerification = () => {
    const { url, label } = currentImage;

    // Set verifying state only for this specific label
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

  // Helper to show standardized info modal inside image viewer
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

    setShowRejectionModal(false);
    setShowRejectConfirmation(true);
  };

  const confirmRejectFinal = async () => {
    setShowRejectConfirmation(false);
    await processAction(selectedRegistration, 'reject', selectedReason === "Other (please specify)" ? customReason : selectedReason);
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
          const onDB = await checkIfEmailExistsInDatabase(registration.email);
          if (onDB) {
            setErrorMessage('This email is already registered to a different member.');
            setErrorModalVisible(true);
            setIsProcessing(false);
            setActionInProgress(false);
            return;
          }
        }
        
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

        // Store API call data for later execution
        setPendingApiCall({
          type: 'approve',
          data: approveData
        });

      } else {
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

        // Store API call data for later execution
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

  const checkIfEmailExistsInDatabase = async (email) => {
    try {
      const membersSnap = await database.ref('Members').once('value');
      const membersData = membersSnap.val() || {};
      const memberExists = Object.values(membersData).some(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (memberExists) return true;

      const adminsSnap = await database.ref('Users/Admin').once('value');
      const adminsData = adminsSnap.val() || {};
      const adminExists = Object.values(adminsData).some(u => u.email?.toLowerCase() === email.toLowerCase());
      
      return adminExists;
    } catch (err) {
      console.error('DB email check error:', err);
      return false;
    }
  };

  const checkIfSamePersonExists = async (email, firstName, lastName) => {
    try {
      const membersSnap = await database.ref('Members').once('value');
      const membersData = membersSnap.val() || {};
      
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
      
      // Update the current funds
      await fundsRef.set(newFundsAmount);
      
      // Log to FundsHistory for dashboard chart (keyed by YYYY-MM-DD)
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
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
      // If user already exists (Member or Admin), update their data but don't create new auth account
      const now = new Date();
      const approvedDate = formatDate(now);
      const approvedTime = formatTime(now);

      const updateData = {};

      Object.keys(rest).forEach(key => {
        if (samePersonCheck.data[key] === undefined || samePersonCheck.data[key] !== rest[key]) {
          updateData[key] = rest[key];
        }
      });

      // Add registration fee to existing balance (fallback to 0 if not present)
      const currentBalance = samePersonCheck.data.balance || 0;
      updateData.balance = currentBalance + parseFloat(registrationFee);

      updateData.dateApproved = approvedDate;
      updateData.approvedTime = approvedTime;

      // Preserve Admin role/status if the match source is Admin or existing member has role admin/coadmin
      const existingRole = samePersonCheck.data.role;
      const existingStatus = samePersonCheck.data.status;
      const isAdminLike = samePersonCheck.source === 'admin' || existingRole === 'admin' || existingRole === 'coadmin';
      if (isAdminLike) {
        updateData.role = existingRole || 'admin';
        updateData.status = existingStatus || 'active'; // keep Admin status as is
      } else {
        updateData.status = 'active';
      }

      // Create transaction record (use consistent fields for Transactions.jsx)
      const transactionData = {
        type: 'registration',
        amount: parseFloat(registrationFee),
        // Provide both applied and approved dates for sorting/display
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

      // If the matched person is an Admin or has admin/coadmin role, also log under Transactions/Admins
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

      // Ensure a Members record exists; if not, create it preserving admin role/status
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
        // Keep original application date for tables
        dateCreated: rest?.dateCreated || rest?.dateApplied || '',
        dateApproved: approvedDate,
        approvedTime: approvedTime,
        memberId: parseInt(samePersonCheck.id),
        status: 'approved'
      });

      return parseInt(samePersonCheck.id);
    }

    const emailExists = await checkIfEmailExistsInDatabase(email);
    if (emailExists) {
      throw new Error('This email is already registered to a different member.');
    }

    // Create Firebase Auth account with email and password
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      userId = userCredential.user.uid;
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('This email is already in use by another account.');
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
    
    // Set initial balance to the registration fee
    const initialBalance = parseFloat(registrationFee) || 0;
    
    // Create transaction record (use consistent fields for Transactions.jsx)
    const transactionData = {
      type: 'registration',
      amount: parseFloat(registrationFee),
      // Provide both applied and approved dates for sorting/display
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

    // Create member record in database
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

    // Save transaction record
    await database.ref(`Transactions/Registrations/${newId}/${transactionData.transactionId}`).set(transactionData);

    // If the registration explicitly sets admin/coadmin role, also log under Transactions/Admins for the new member
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
    
    // Add to approved registrations
    await database.ref(`Registrations/ApprovedRegistrations/${id}`).set({
      firstName,
      lastName,
      ...rest,
      email,
      // Keep original application date for tables
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
      throw err;
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
      throw err;
    }
  };

  const handleSuccessOk = async () => {
    setSuccessMessageModalVisible(false);
    closeModal();
    setSelectedRegistration(null);
    setCurrentAction(null);
    
    // Execute pending API call
    if (pendingApiCall) {
      try {
        if (pendingApiCall.type === 'approve') {
          await callApiApprove(pendingApiCall.data);
        } else if (pendingApiCall.type === 'reject') {
          await callApiReject(pendingApiCall.data);
        }
      } catch (error) {
        console.error('Error calling API:', error);
      }
      setPendingApiCall(null);
    }
    
    refreshData();
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

  const getValidationText = (label) => {
    if (!validationStatus[label]) return null;
    
    const status = validationStatus[label];
    let statusStyle = styles.verifyingText;
    
    if (status.status === 'valid') {
      statusStyle = styles.validText;
    } else if (status.status === 'invalid' || status.status === 'error') {
      statusStyle = styles.invalidText;
    } else if (status.status === 'partial') {
      statusStyle = styles.partialText;
    } else if (status.status === 'manual') {
      statusStyle = styles.manualText;
    }

    return (
      <div style={{ 
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '8px 12px',
        borderRadius: '4px',
        maxWidth: '300px',
        wordWrap: 'break-word'
      }}>
        <div style={{ ...styles.validationText, ...statusStyle }}>
          {status.message}
        </div>
        {status.details && (
          <div style={{ 
            ...styles.validationText, 
            fontSize: '10px', 
            marginTop: '4px',
            opacity: 0.8 
          }}>
            {status.details}
          </div>
        )}
      </div>
    );
  };

  const getPaymentStatus = () => {
    if (!selectedRegistration) return null;
    
    const isPaid = selectedRegistration.paymentStatus === 'paid';
    return (
      <div style={styles.compactField}>

      </div>
    );
  };

  if (!registrations.length) return (
    // Show only the text, no container box
    <p style={styles.noDataMessage}>No registration applications available.</p>
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
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Registration Fee:</span>
                    <span style={styles.fieldValue}>
                      {selectedRegistration?.registrationFee ? `₱${parseFloat(selectedRegistration.registrationFee).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  {getPaymentStatus()}

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
                      <div style={styles.compactField}>
                        <span style={styles.fieldLabel}>Initial Balance:</span>
                        <span style={styles.fieldValue}>
                          ₱{(parseFloat(selectedRegistration.registrationFee) || 0).toFixed(2)}
                        </span>
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
                    {selectedRegistration?.paymentProof && (
                      <div style={styles.imageBlock}>
                        <p style={styles.imageLabel}>Payment Proof</p>
                        <img
                          src={selectedRegistration.paymentProof}
                          alt="Payment Proof"
                          style={styles.imageThumbnail}
                          onClick={() => openImageViewer(selectedRegistration.paymentProof, 'Payment Proof', 4)}
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
            <p style={styles.modalText}>Are you sure you want to approve this registration?</p>
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
            <p style={styles.modalText}>Are you sure you want to reject this registration?</p>
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
                      style={{ ...styles.customReasonInput, marginTop: 0, maxWidth: '60%' }}
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

      {isProcessing && (
        <div style={styles.centeredModal}>
          <div style={styles.spinner}></div>
        </div>
      )}

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
              {/* Hide Verify for Valid ID Back and Selfie with ID */}
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
                    onFocus={(e) => e.target.style.outline = 'none'}
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
                    onFocus={(e) => e.target.style.outline = 'none'}
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