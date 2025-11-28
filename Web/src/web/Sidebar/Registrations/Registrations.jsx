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
import Tesseract from 'tesseract.js';


const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
    justifyContent: 'center',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    width: '40%',
    margin: '0 auto',
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
  maxHeight: '60vh', // Reduced from 70vh to make space for buttons
  objectFit: 'contain',
  borderRadius: '8px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  marginBottom: '80px' // Add space for verification section
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
  const [isVerifying, setIsVerifying] = useState({});
  const [pendingApiCall, setPendingApiCall] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', fields: [] });

// ===== CLIENT-SIDE IMAGE VERIFICATION FUNCTIONS =====

// ===== ALL-IN-ONE CLIENT-SIDE VERIFICATION WITH TESSERACT =====

const loadImageForOCR = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Enhanced ID Verification with Better Preprocessing
const verifyID = async (imageUrl, label) => {
  setIsVerifying(prev => ({ ...prev, [label]: true }));
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing ID document...' }
  }));

  try {
    const img = await loadImageForOCR(imageUrl);
    
    // Enhanced preprocessing for ID documents
    const canvas = preprocessImageForOCR(img);
    
    // Use multiple OCR configurations for better accuracy
    const { data: { text, confidence } } = await Tesseract.recognize(
      canvas,
      'eng',
      { 
        logger: m => console.log(m),
        tessedit_pageseg_mode: 6, // Uniform block of text
        tessedit_ocr_engine_mode: 1, // LSTM engine
        textord_min_linesize: 1.5, // Better for document text
        textord_heavy_nr: 1, // Noise reduction
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-., ',
        preserve_interword_spaces: '1'
      }
    );

    console.log('=== ENHANCED ID VERIFICATION START ===');
    console.log('Raw OCR Text:', text);
    console.log('OCR Confidence:', confidence);

    // IMPROVED TEXT CLEANING
    let cleanedText = text
      .replace(/[|\\/{}\[\]()~`@#$%^&*_=+<>"']/g, ' ') // Remove special chars
      .replace(/\b\w\b/g, ' ') // Remove single letters
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log('Cleaned Text:', cleanedText);

    const upperText = cleanedText.toUpperCase();
    let extractedName = { first: '', middle: '', last: '' };
    let idType = 'Unknown';
    let idNumber = null;
    let extractedAddress = null;
    let dateOfBirth = null;

    // ENHANCED PHILIPPINE ID DETECTION PATTERNS
    const phIdPatterns = {
      nationalId: {
        patterns: [
          /REPUBLIKA NG PILIPINAS/i,
          /PAMBANSANG PAGKAKAKILANLAN/i,
          /PHILIPPINE IDENTIFICATION/i,
          /PHILSYS/i,
          /NATIONAL ID/i,
          /4169[- ]1564[- ]8734[- ]9658/i
        ],
        idNumber: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
        type: 'Philippine National ID'
      },
      driversLicense: {
        patterns: [
          /DRIVER'?S? LICENSE/i,
          /LAND TRANSPORTATION OFFICE/i,
          /LTO/i,
          /DEPARTMENT OF TRANSPORTATION/i,
          /REPUBLIC OF THE PHILIPPINES/i
        ],
        idNumber: /\b[A-Z]\d{2}[- ]?\d{2}[- ]?\d{6,8}\b/,
        type: "Driver's License"
      },
      passport: {
        patterns: [/PASSPORT/i, /REPUBLIC OF THE PHILIPPINES/i],
        idNumber: /\b[A-Z]\d{7,8}\b/,
        type: 'Passport'
      }
    };

    // IMPROVED ID TYPE DETECTION
    const detectIDType = (text) => {
      const upperText = text.toUpperCase();
      
      for (const [type, patterns] of Object.entries(phIdPatterns)) {
        for (const pattern of patterns.patterns) {
          if (upperText.match(pattern)) {
            return { type: patterns.type, pattern: type };
          }
        }
      }
      return { type: 'Unknown', pattern: 'unknown' };
    };

    const detectedId = detectIDType(upperText);
    idType = detectedId.type;
    console.log('Detected ID Type:', idType, 'Pattern:', detectedId.pattern);

    // IMPROVED ID NUMBER EXTRACTION
    if (detectedId.pattern in phIdPatterns) {
      const idPattern = phIdPatterns[detectedId.pattern].idNumber;
      const match = cleanedText.match(idPattern);
      if (match) {
        idNumber = match[0].replace(/\s+/g, '');
        console.log('Found ID Number:', idNumber);
      }
    }

    // If no specific pattern found, try generic patterns
    if (!idNumber) {
      const genericPatterns = [
        /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // PhilID
        /\b[A-Z]\d{2}[- ]?\d{2}[- ]?\d{6,8}\b/, // Driver's License
        /\b[A-Z]\d{7,8}\b/, // Passport
        /\b\d{9,12}\b/, // Generic numbers
      ];
      
      for (const pattern of genericPatterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          idNumber = match[0].replace(/\s+/g, '');
          console.log('Found ID Number (generic):', idNumber);
          break;
        }
      }
    }

    // IMPROVED NAME EXTRACTION FOR PHILIPPINE IDs
    console.log('=== ENHANCED NAME EXTRACTION ===');
    
    // Look for "Last Name, First Name Middle Name" pattern commonly found in Philippine IDs
    const nameCommaPattern = /([A-Z][A-Z]+),\s*([A-Z][A-Z\s]+)(?:\s+([A-Z][A-Z]+))?/;
    const commaMatch = cleanedText.match(nameCommaPattern);
    
    if (commaMatch) {
      extractedName.last = commaMatch[1].trim();
      const firstMiddle = commaMatch[2].trim();
      
      // Split first and middle names (usually first name comes first, then middle)
      const nameParts = firstMiddle.split(/\s+/);
      if (nameParts.length >= 1) {
        extractedName.first = nameParts[0];
      }
      if (nameParts.length >= 2) {
        extractedName.middle = nameParts.slice(1).join(' ');
      }
      console.log('Found name (comma format):', extractedName);
    }

    // If comma format not found, try label-based extraction
    if (!extractedName.first && !extractedName.last) {
      const nameLabels = [
        { pattern: /(?:LAST NAME|APELYIDO)[:\s]*([A-Z][A-Z\s]+)/i, type: 'last' },
        { pattern: /(?:FIRST NAME|GIVEN NAME|MGA PANGALAN)[:\s]*([A-Z][A-Z\s]+)/i, type: 'first' },
        { pattern: /(?:MIDDLE NAME|GITNANG PANGALAN)[:\s]*([A-Z][A-Z\s]+)/i, type: 'middle' },
      ];

      for (const { pattern, type } of nameLabels) {
        const match = cleanedText.match(pattern);
        if (match && match[1]) {
          const nameValue = match[1].trim();
          // Validate name (2-30 chars, no numbers, reasonable length)
          if (nameValue.length >= 2 && nameValue.length <= 30 && 
              !nameValue.match(/^\d+$/) && !nameValue.match(/\d{4,}/)) {
            extractedName[type] = nameValue;
            console.log(`Found ${type} name:`, nameValue);
          }
        }
      }
    }

    // IMPROVED ADDRESS EXTRACTION
    console.log('=== ENHANCED ADDRESS EXTRACTION ===');
    
    const addressPatterns = [
      /(?:ADDRESS|TIRAHA?N)[:\s]*([A-Z0-9][A-Z0-9\s,.-]{10,80})/i,
      /YATI,\s*LILOAN,\s*CEBU,\s*6002/i, // Specific address from your example
      /PUROK\s+TUGAS,\s*YATI,\s*LILOAN,\s*CEBU/i, // National ID address format
    ];

    for (const pattern of addressPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        const addressCandidate = match[1] ? match[1].trim() : match[0].trim();
        // More lenient address validation
        if (addressCandidate.length >= 5 && addressCandidate.length <= 100) {
          extractedAddress = addressCandidate;
          console.log('Found address:', extractedAddress);
          break;
        }
      }
    }

    // IMPROVED DATE OF BIRTH EXTRACTION
    console.log('=== ENHANCED DATE EXTRACTION ===');
    
    const datePatterns = [
      /(?:DATE OF BIRTH|BIRTHDATE|NESSA? NG KAPANGANAKAN)[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
      /(?:DATE OF BIRTH|BIRTHDATE)[:\s]*([A-Z]+ \d{1,2},? \d{4})/i,
      /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
      /([A-Z]+ \d{1,2},? \d{4})/, // Month Day, Year
    ];

    for (const pattern of datePatterns) {
      const match = cleanedText.match(pattern);
      if (match && match[1]) {
        dateOfBirth = match[1].trim();
        console.log('Found date of birth:', dateOfBirth);
        break;
      }
    }

    // CONSTRUCT FULL NAME
    let fullName = null;
    if (extractedName.first && extractedName.last) {
      fullName = `${extractedName.first} ${extractedName.middle ? extractedName.middle + ' ' : ''}${extractedName.last}`.trim();
      console.log('Constructed full name:', fullName);
    }

    // ENHANCED VALIDATION LOGIC
    const hasValidName = !!(fullName && fullName.length >= 5 && fullName.split(' ').length >= 2);
    const hasValidID = !!(idNumber && idNumber.length >= 8);
    const hasValidAddress = !!(extractedAddress && extractedAddress.length >= 10);
    const hasValidDOB = !!(dateOfBirth && dateOfBirth.length >= 8);
    
    const dataScore = [hasValidName, hasValidID, hasValidAddress, hasValidDOB].filter(Boolean).length;
    
    console.log('Enhanced Data Validation Score:', {
      hasValidName, hasValidID, hasValidAddress, hasValidDOB, dataScore, confidence
    });

    // IMPROVED STATUS DETERMINATION
    let status = 'invalid';
    let statusMessage = '';
    
    if (dataScore >= 3 && confidence > 60) {
      status = 'valid';
      statusMessage = '✅ High confidence - Valid ID';
    } else if (dataScore >= 2 && confidence > 40) {
      status = 'manual';
      statusMessage = '⚠️ Medium confidence - Manual review recommended';
    } else {
      status = 'manual';
      statusMessage = '⚠️ Low confidence - Requires manual verification';
    }

    // CONSTRUCT DETAILED RESULT MESSAGE
    let message = '';
    if (fullName) {
      message = `Name: ${fullName}`;
    } else {
      message = 'Name: Not clearly detected';
    }

    message += ` | ID Type: ${idType}`;
    message += ` | ID Number: ${idNumber || 'Not found'}`;
    message += ` | Confidence: ${Math.round(confidence)}%`;

    console.log('Enhanced Final Validation Result:', {
      status,
      fullName,
      idType,
      idNumber,
      extractedAddress,
      dateOfBirth,
      confidence,
      dataScore
    });

    // UPDATE VALIDATION STATUS
    setValidationStatus(prev => ({
      ...prev,
      [label]: {
        status,
        message: `${statusMessage} | ${message}`,
        details: { 
          extractedName: fullName, 
          idType, 
          idNumber, 
          address: extractedAddress,
          dateOfBirth,
          confidence,
          dataScore
        }
      }
    }));

    // SMART AUTO-FILL WITH BETTER VALIDATION
    if (selectedRegistration && status !== 'invalid') {
      setSelectedRegistration(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        
        // Only fill if current field is empty or very short
        if (hasValidName) {
          if (!updated.firstName || updated.firstName.trim().length < 2) {
            updated.firstName = extractedName.first;
          }
          if (!updated.lastName || updated.lastName.trim().length < 2) {
            updated.lastName = extractedName.last;
          }
          if (extractedName.middle && extractedName.middle.length > 1 && 
              (!updated.middleName || updated.middleName.trim().length < 2)) {
            updated.middleName = extractedName.middle;
          }
        }
        
        if (hasValidAddress && (!updated.address || updated.address.trim().length < 5)) {
          updated.address = extractedAddress;
        }
        
        if (hasValidDOB && (!updated.dateOfBirth || updated.dateOfBirth.trim().length < 5)) {
          updated.dateOfBirth = dateOfBirth;
        }
        
        console.log('Auto-filled validated fields:', {
          firstName: updated.firstName,
          lastName: updated.lastName,
          middleName: updated.middleName,
          address: updated.address,
          dateOfBirth: updated.dateOfBirth
        });
        
        return updated;
      });
    }

    // SHOW DETAILED RESULTS
    const infoFields = [
      { label: 'Detected Name', value: fullName || 'Not clearly detected' },
      { label: 'ID Type', value: idType },
      { label: 'ID Number', value: idNumber || 'Not found' },
      { label: 'Address', value: extractedAddress || 'Not found' },
      { label: 'Date of Birth', value: dateOfBirth || 'Not found' },
      { label: 'OCR Confidence', value: `${Math.round(confidence)}%` },
      { label: 'Data Quality', value: `${dataScore}/4 fields detected` },
      { label: 'Verification', value: statusMessage }
    ];

    showInfoModal('ID Verification Results', infoFields);

  } catch (error) {
    console.error('ID verification error:', error);
    
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'error', 
        message: `Verification failed: ${error.message || 'Unknown error'}` 
      }
    }));
    
    const errorFields = [
      { label: 'Error', value: 'Verification failed' },
      { label: 'Details', value: error.message || 'Unknown error occurred' },
      { label: 'Status', value: '❌ Error' }
    ];
    
    showInfoModal('ID Verification Error', errorFields);
  } finally {
    setIsVerifying(prev => ({ ...prev, [label]: false }));
  }
};

// Enhanced Image Preprocessing
const preprocessImageForOCR = (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to original image size
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Enhanced preprocessing for ID documents
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale with better weights
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhanced contrast for text clarity
    const contrast = 2.0; // Increased contrast
    const adjusted = contrast * (gray - 128) + 128;
    
    // Apply threshold to make text more distinct
    const threshold = 128;
    const finalValue = adjusted > threshold ? 255 : 0;
    
    data[i] = data[i + 1] = data[i + 2] = finalValue;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Additional sharpening for text clarity
  ctx.filter = 'contrast(1.5) brightness(1.1)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  
  return canvas;
};

// Enhanced Payment Proof Verification with Tesseract
const verifyPaymentProof = async (imageUrl, label) => {
  setIsVerifying(prev => ({ ...prev, [label]: true }));
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing payment receipt...' }
  }));

  try {
    const img = await loadImageForOCR(imageUrl);
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      img,
      'eng',
      { 
        logger: m => console.log(m),
        tessedit_pageseg_mode: 6
      }
    );

    console.log('Payment OCR Result:', { text: text.substring(0, 100), confidence });

    // Enhanced payment pattern matching for GCash/Philippine receipts
    const normalized = text.replace(/\s+/g, ' ').trim();
    const upperText = normalized.toUpperCase();

    // Amount patterns (Philippine currency focused)
    const amountPatterns = [
      /(?:AMOUNT|AMT|TOTAL|SENT|SEND)\s*[:\-]?\s*(?:PHP|₱|P)?\s*([\d,]+\.?\d{2})/i,
      /(?:PHP|₱|P)\s*([\d,]+\.?\d{2})/i,
      /TOTAL AMOUNT SENT\s*P\s*([\d,]+\.?\d{2})/i,
      /SENT\s*P\s*([\d,]+\.?\d{2})/i,
      /(?:PAYMENT|PAID)\s*[:\-]?\s*(?:PHP|₱|P)?\s*([\d,]+\.?\d{2})/i
    ];
    
    let amount = null;
    for (const re of amountPatterns) {
      const m = normalized.match(re);
      if (m && m[1]) {
        amount = m[1].replace(/[\s,]/g, '');
        console.log('Found amount:', amount);
        break;
      }
    }

    // Reference number patterns (GCash specific)
    const refPatterns = [
      /(?:REF NO\.|REFERENCE NO\.|REFERENCE|REF)\s*[:\-]?\s*(\d{3,4}\s+\d{3}\s+\d{6})/i,
      /(?:REF NO\.|REFERENCE NO\.)\s*(\d{10,15})/i,
      /\b(\d{3,4}\s+\d{3}\s+\d{6})\b/,
      /REF NO\.\s*(\d{4}\s+\d{3}\s+\d{6})/i,
      /(?:TRANSACTION|TXN)\s*(?:NO\.?|ID)\s*[:\-]?\s*(\d{10,15})/i
    ];
    
    let reference = null;
    for (const re of refPatterns) {
      const m = normalized.match(re);
      if (m) {
        reference = (m[1] || '').toString().trim().replace(/\s+/g, ' ');
        console.log('Found reference:', reference);
        break;
      }
    }

    // Date patterns
    const datePatterns = [
      /\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]* \d{1,2},? \d{4}/i,
      /\b\d{4}-\d{2}-\d{2}\b/,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
      /(?:DATE|TIME)\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ];
    
    let dateTime = null;
    for (const re of datePatterns) {
      const m = normalized.match(re);
      if (m) { 
        dateTime = m[0]; 
        console.log('Found date:', dateTime);
        break;
      }
    }

    // Detect payment method
    let paymentMethod = 'Unknown';
    if (upperText.includes('GCASH')) {
      paymentMethod = 'GCash';
    } else if (upperText.includes('PAYMAYA') || upperText.includes('MAYA')) {
      paymentMethod = 'Maya';
    } else if (upperText.includes('BANK') || upperText.includes('BDO') || upperText.includes('BPI') || upperText.includes('METROBANK')) {
      paymentMethod = 'Bank Transfer';
    }

    // IMPROVED VALIDATION LOGIC - FIXED HERE
    const hasAmount = !!amount;
    const hasReference = !!reference;
    const hasDate = !!dateTime;
    const hasGoodConfidence = confidence > 40;
    
    console.log('Validation check:', {
      hasAmount, hasReference, hasDate, confidence, hasGoodConfidence
    });

  let status = 'invalid';
let statusMessage = '';

if (hasAmount && hasReference && hasGoodConfidence) {
  status = 'valid';
  statusMessage = '✅ Valid payment receipt';
} else if ((hasAmount || hasReference) && confidence > 25) {
  status = 'manual';
  statusMessage = '⚠️ Partial details found - Manual review recommended';
} else {
  status = 'invalid';
  statusMessage = '❌ Invalid - No payment details detected'; // THIS WAS MISSING
}

    // CONSTRUCT DETAILED MESSAGE
    let message = '';
    if (amount) {
      message += `Amount: ₱${amount}`;
    } else {
      message += 'Amount: Not detected';
    }
    
    if (reference) {
      message += `${message ? ' | ' : ''}Ref: ${reference}`;
    } else {
      message += `${message ? ' | ' : ''}Ref: Not detected`;
    }
    
    if (dateTime) {
      message += `${message ? ' | ' : ''}Date: ${dateTime}`;
    } else {
      message += `${message ? ' | ' : ''}Date: Not detected`;
    }
    
    message += ` | Confidence: ${Math.round(confidence)}%`;

    console.log('Final validation result:', {
      status, statusMessage, message, amount, reference, dateTime
    });

    // UPDATE VALIDATION STATUS
    setValidationStatus(prev => ({
      ...prev,
      [label]: {
        status,
        message: `${statusMessage} | ${message}`,
        details: { amount, reference, date: dateTime, paymentMethod, confidence }
      }
    }));

    // SHOW RESULTS IN INFO MODAL - ALWAYS SHOW EVEN WHEN NOTHING DETECTED
const infoFields = [
  { label: 'Amount', value: amount ? `₱${amount}` : '❌ Not detected' },
  { label: 'Reference Number', value: reference || '❌ Not detected' },
  { label: 'Date', value: dateTime || '❌ Not detected' },
  { label: 'Payment Method', value: paymentMethod },
  { label: 'OCR Confidence', value: `${Math.round(confidence)}%` },
  { label: 'Status', value: status === 'valid' ? '✅ Valid Payment Receipt' : 
                          status === 'manual' ? '⚠️ Manual Review Required' : 
                          '❌ Invalid - No payment details detected' }
];

    showInfoModal('Payment Verification Results', infoFields);

  } catch (error) {
    console.error('Payment verification error:', error);
    
    // SHOW ERROR IN INFO MODAL
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'error', message: 'Payment verification failed' }
    }));
    
    const errorFields = [
      { label: 'Error', value: 'Verification failed' },
      { label: 'Details', value: error.message || 'Unknown error occurred' },
      { label: 'Status', value: '❌ Error' }
    ];
    
    showInfoModal('Payment Verification Error', errorFields);
  } finally {
    setIsVerifying(prev => ({ ...prev, [label]: false }));
  }
};

// Smart Selfie Verification using Image Analysis (NO TensorFlow)
const verifyFace = async (imageUrl, label) => {
  setIsVerifying(prev => ({ ...prev, [label]: true }));
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing selfie image...' }
  }));

  try {
    const img = await loadImageForOCR(imageUrl);
    
    // Smart selfie analysis using multiple heuristics
    const analysis = analyzeSelfieImage(img);
    
    const { hasFace, confidence, reasons } = analysis;
    const status = hasFace ? 'valid' : 'invalid';

    setValidationStatus(prev => ({
      ...prev,
      [label]: {
        status,
        message: hasFace ? '✅ Valid selfie detected' : `❌ ${reasons.join(', ')}`,
        details: analysis
      }
    }));

    // Show detailed analysis
    const infoFields = [
      { label: 'Face Detected', value: hasFace ? 'Detected' : 'No face detected' },
      { label: 'Detection Confidence', value: `${confidence}%` },
    ];

    showInfoModal('Selfie Analysis Results', infoFields);

  } catch (error) {
    console.error('Selfie verification error:', error);
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'error', message: 'Selfie analysis failed' }
    }));
  } finally {
    setIsVerifying(prev => ({ ...prev, [label]: false }));
  }
};

// Smart selfie image analysis (replaces TensorFlow)
const analyzeSelfieImage = (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate image statistics
  let totalBrightness = 0;
  let skinTonePixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    
    // Simple skin tone detection (common ranges)
    if (r > 95 && g > 40 && b > 20 && 
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 15 && r > g && r > b) {
      skinTonePixels++;
    }
  }

  const avgBrightness = totalBrightness / (data.length / 4);
  const skinToneRatio = skinTonePixels / (data.length / 4);

  // Analyze image characteristics
  const aspectRatio = img.width / img.height;
  const isPortrait = aspectRatio < 1.3 && aspectRatio > 0.7;
  const hasGoodSize = img.width > 250 && img.height > 250;
  const hasGoodBrightness = avgBrightness > 50 && avgBrightness < 200;
  const hasSkinTones = skinToneRatio > 0.1; // At least 10% skin-like pixels

  // Face detection heuristics
  const heuristics = [
    { condition: isPortrait, weight: 30, reason: 'Portrait orientation' },
    { condition: hasGoodSize, weight: 25, reason: 'Good image size' },
    { condition: hasGoodBrightness, weight: 20, reason: 'Good lighting' },
    { condition: hasSkinTones, weight: 25, reason: 'Skin tones detected' }
  ];

  let confidence = 0;
  let reasons = [];

  heuristics.forEach(({ condition, weight, reason }) => {
    if (condition) {
      confidence += weight;
    } else {
      reasons.push(`No ${reason.toLowerCase()}`);
    }
  });

  const hasFace = confidence >= 60; // Need at least 60% confidence

  return {
    hasFace,
    confidence,
    reasons: hasFace ? ['Valid selfie characteristics'] : reasons,
    aspectRatio: aspectRatio.toFixed(2),
    orientation: isPortrait ? 'Portrait' : 'Landscape',
    brightness: avgBrightness.toFixed(0),
    skinToneRatio: (skinToneRatio * 100).toFixed(1) + '%',
    imageSize: `${img.width} × ${img.height}`,
    notes: hasFace ? 
      'Image appears to be a valid selfie with good characteristics' : 
      'Image may not be a proper selfie photo'
  };
};

  const handleImageClick = (url, label) => {
    setCurrentImage({ url, label });
    setImageViewerVisible(true);
  };
const handleManualVerification = () => {
  const { url, label } = currentImage;

  setIsVerifying(prev => ({ ...prev, [label]: true }));
  
  console.log('Manual verification triggered for:', label);

  const labelLower = label.toLowerCase();

  // Use client-side validation functions
  if (labelLower.includes('payment') || labelLower.includes('proof') || labelLower.includes('receipt')) {
    verifyPaymentProof(url, label);
  } else if (labelLower.includes('id') && !labelLower.includes('back')) {
    verifyID(url, label);
  } else if (labelLower.includes('selfie') || labelLower.includes('face')) {
    verifyFace(url, label);
  } else {
    // For other images, mark as manual review
    setValidationStatus(prev => ({
      ...prev,
      [label]: { status: 'manual', message: 'Manual review required' }
    }));
    setIsVerifying(prev => ({ ...prev, [label]: false }));
  }
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
        setSuccessMessage('Registration approved successfully!');

        const approveData = {
          ...registration,
          dateApproved: formatDate(new Date()),
          approvedTime: formatTime(new Date()),
          amount: registration.registrationFee || 0 
        };

        setSelectedRegistration(prev => ({
          ...prev,
          dateApproved: approveData.dateApproved,
          approvedTime: approveData.approvedTime,
          status: 'approved'
        }));

        setPendingApiCall({
          type: 'approve',
          data: approveData
        });
      } else {
        setSuccessMessage('Registration rejected successfully!');

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

      setSuccessMessageModalVisible(true);
    } catch (error) {
      console.error('Error preparing action:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setErrorModalVisible(true);
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
      
      const emailExistsWithDifferentName = Object.values(membersData).some(u => 
        u.email?.toLowerCase() === email.toLowerCase() &&
        (u.firstName?.toLowerCase() !== firstName.toLowerCase() || 
         u.lastName?.toLowerCase() !== lastName.toLowerCase())
      );
      
      if (emailExistsWithDifferentName) return true;

      const adminsSnap = await database.ref('Users/Admin').once('value');
      const adminsData = adminsSnap.val() || {};
      
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

      if (!samePersonCheck.exists) {
        const emailWithDifferentName = await checkIfEmailExistsInDatabase(email, firstName, lastName);

        if (emailWithDifferentName) {
          throw new Error('This email is already registered to a different member.');
        }
      }
      
      if (samePersonCheck.exists) {
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
            description: 'Registration approved for existing Admin',
            amount: registrationFee || 0 
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

      const emailWithDifferentName = await checkIfEmailExistsInDatabase(email, firstName, lastName);
      if (emailWithDifferentName) {
        throw new Error('This email is already registered to a different member.');
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('Email exists in Firebase Auth but not in database, proceeding...');
          userId = `auth-${Date.now()}`;
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
        description: 'Registration fee payment',
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
        status: 'active',
        amount: registrationFee || 0 
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
          description: 'Registration approved for Admin',
          amount: registrationFee || 0 
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

      await removeFromPendingRegistrations(id);

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

      await removeFromPendingRegistrations(id);
    } catch (err) {
      console.error('Rejection DB error:', err);
      throw new Error(err.message || 'Failed to reject registration');
    }
  };

  const callApiApprove = async (reg) => {
    try {
      console.log('Sending approval email in background...');
      const response = await ApproveRegistration({
        email: reg.email,
        firstName: reg.firstName,
        lastName: reg.lastName,
        amount: reg.registrationFee || 0, 
        dateApproved: reg.dateApproved,
        approvedTime: reg.approvedTime,
        memberId: reg.memberId,
        password: reg.password 
      });
      
      if (!response.ok) {
        console.warn('Background: Failed to send approval email');
      } else {
        console.log('Background: Approval email sent successfully');
      }
    } catch (err) {
      console.error('Background API approve error:', err);
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
    }
  };

  const handleSuccessOk = async () => {
    setIsProcessing(true);
    setSuccessMessageModalVisible(false);

    try {
      if (pendingApiCall) {
        if (pendingApiCall.type === 'approve') {
          const memberId = await processDatabaseApprove(pendingApiCall.data);
          pendingApiCall.data.memberId = memberId;
        } else if (pendingApiCall.type === 'reject') {
          await processDatabaseReject(pendingApiCall.data, pendingApiCall.data.rejectionReason || 'Rejected by admin');
        }
      }
    } catch (err) {
      console.error('Finalize DB on OK error:', err);
    }

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

    closeModal();
    setSelectedRegistration(null);
    setCurrentAction(null);
    refreshData();
    setIsProcessing(false);
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
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email Address</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Contact Number</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
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
                  ...styles.primaryButton,
                  ...(actionInProgress ? styles.disabledButton : {})
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
      
      {/* Fixed Verification Button Section */}
{/* Fixed Verification Button Section */}
<div style={{ 
  position: 'absolute', 
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
  zIndex: 2001,
  minWidth: '200px'
}}>
  {!(currentImage.label?.toLowerCase().includes('valid id back') || currentImage.label?.toLowerCase().includes('selfie with id')) && (
    <button
      style={{
        ...styles.verifyButton,
        minWidth: '120px',
        padding: '10px 20px'
      }}
      onClick={() => handleManualVerification()}
      disabled={Boolean(isVerifying[currentImage.label])}
    >
      {isVerifying[currentImage.label] ? (
        <>
          <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          Verifying...
        </>
      ) : (
        <>
          {currentImage.label?.toLowerCase().includes('payment') || currentImage.label?.toLowerCase().includes('proof') ? 'Verify Payment' : 
           currentImage.label?.toLowerCase().includes('id') ? 'Verify ID' : 'Verify Face'}
        </>
      )}
    </button>
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
