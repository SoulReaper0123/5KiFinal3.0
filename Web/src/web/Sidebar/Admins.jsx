import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaPlus,
  FaCheckCircle,
  FaTimes,
  FaExclamationCircle,
  FaFileAlt,
  FaUser,
  FaEye,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaIdCard,
  FaSpinner
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendAdminCredentialsEmail, sendAdminDeleteData } from '../../../../Server/api';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
    return generateRandomPassword();
  }
  return pwd;
};

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0'
  },
  mainContainer: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  headerText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '4px'
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    width: '100%'
  },
  searchDownloadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: '10',
    flexShrink: '0'
  },
  searchContainer: {
    position: 'relative',
    width: '280px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  searchInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: '1'
  },
  downloadButton: {
    padding: '10px 12px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    width: '40px',
    height: '40px',
    flexShrink: '0'
  },
  downloadButtonHover: {
    backgroundColor: '#047857'
  },
  createButton: {
    padding: '12px 24px',
    backgroundColor: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  createButtonHover: {
    backgroundColor: '#1e3a8a',
    transform: 'translateY(-1px)'
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '80px'
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '1000px'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
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
  viewButton: {
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#2563eb',
      color: 'white',
      transform: 'translateY(-1px)'
    }
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '40px'
  },
  paginationInfo: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  paginationButton: {
    padding: '4px 8px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '10px',
    minWidth: '24px',
    minHeight: '24px'
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb'
  },
  addAdminButton: {
    position: 'fixed',
    right: '32px',
    bottom: '32px',
    backgroundColor: '#1e40af',
    color: '#fff',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(30, 64, 175, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: '100',
    fontSize: '18px'
  },
  addAdminButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 15px 30px rgba(30, 64, 175, 0.4)'
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
    padding: '20px',
    overflowY: 'auto',
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
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
    gap: '0.75rem',
    margin: 0
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formSection: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  requiredAsterisk: {
    color: '#dc2626',
    marginLeft: '2px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  formInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
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
  deleteButton: {
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
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
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
  noDataText: {
    fontSize: '16px',
    margin: 0
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
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '12px'
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  imageLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  imagePreview: {
    width: '100px',
    height: '100px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    objectFit: 'cover',
    cursor: 'pointer'
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

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [confirmAddVisible, setConfirmAddVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');

  const pageSize = 10;

  // Create style element and append to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .hover-lift:hover {
        transform: translateY(-2px);
        boxShadow: 0 10px 25px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const snapshot = await database.ref('Users/Admin').once('value');
        const data = snapshot.val() || {};
        const adminList = Object.entries(data).map(([id, admin]) => ({
          id,
          ...admin,
          name: admin.firstName 
            ? `${admin.firstName}${admin.middleName ? ' ' + admin.middleName : ''} ${admin.lastName}`.trim()
            : admin.name || ''
        }));
        setAdmins(adminList);
        setFilteredData(adminList);
      } catch (error) {
        console.error('Error fetching admins:', error);
        setErrorMessage('Failed to fetch admin data');
        setErrorModalVisible(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  useEffect(() => {
    const filtered = admins.filter(admin => {
      const searchLower = searchQuery.toLowerCase();
      return (
        admin.id.toString().includes(searchLower) ||
        (admin.firstName && admin.firstName.toLowerCase().includes(searchLower)) ||
        (admin.lastName && admin.lastName.toLowerCase().includes(searchLower)) ||
        (admin.middleName && admin.middleName.toLowerCase().includes(searchLower)) ||
        (admin.name && admin.name.toLowerCase().includes(searchLower)) ||
        admin.email.toLowerCase().includes(searchLower) ||
        (admin.contactNumber && admin.contactNumber.toLowerCase().includes(searchLower))
      );
    });
    setFilteredData(filtered);
    setNoMatch(filtered.length === 0);
    setCurrentPage(0);
  }, [searchQuery, admins]);

  const getNextId = async () => {
    try {
      const adminsSnapshot = await database.ref('Users/Admin').once('value');
      const membersSnapshot = await database.ref('Members').once('value');
      
      const adminsData = adminsSnapshot.val() || {};
      const membersData = membersSnapshot.val() || {};
      
      const adminIds = Object.keys(adminsData).map(id => parseInt(id));
      const memberIds = Object.keys(membersData).map(id => parseInt(id));
      const allIds = [...adminIds, ...memberIds];
      
      if (allIds.length === 0) {
        return 5001;
      }
      
      for (let i = 5001; i <= 9999; i++) {
        if (!allIds.includes(i)) {
          return i;
        }
      }
      
      return 5001;
    } catch (error) {
      console.error('Error getting next ID:', error);
      return 5001;
    }
  };

  const validateFields = () => {
    let isValid = true;
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setContactNumberError('');

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!contactNumber.trim()) {
      setContactNumberError('Contact number is required');
      isValid = false;
    } else if (!/^\d{11}$/.test(contactNumber)) {
      setContactNumberError('Contact number must be exactly 11 digits');
      isValid = false;
    }

    return isValid;
  };

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (selectedAdmin?.validIdFront) {
      images.push({ 
        url: selectedAdmin.validIdFront, 
        label: 'Valid ID Front' 
      });
    }
    if (selectedAdmin?.validIdBack) {
      images.push({ 
        url: selectedAdmin.validIdBack, 
        label: 'Valid ID Back' 
      });
    }
    if (selectedAdmin?.selfie) {
      images.push({ 
        url: selectedAdmin.selfie, 
        label: 'Selfie' 
      });
    }
    if (selectedAdmin?.selfieWithId) {
      images.push({ 
        url: selectedAdmin.selfieWithId, 
        label: 'Selfie with ID' 
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

  const handleAddAdmin = async () => {
    setConfirmAddVisible(false);
    setIsProcessing(true);
    setActionInProgress(true);

    try {
      const password = generateRandomPassword();
      const newId = await getNextId();
      const now = new Date();
      const dateAdded = formatDate(now);
      const timeAdded = formatTime(now);

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      const displayName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim();
      await userCredential.user.updateProfile({
        displayName
      });

      await auth.currentUser.updatePassword(password);

      await database.ref(`Users/Admin/${newId}`).set({
        id: newId,
        firstName,
        middleName: middleName || '',
        lastName,
        email,
        contactNumber,
        dateAdded,
        timeAdded,
        role: 'admin',
        uid: userCredential.user.uid,
        initialPassword: password
      });

      await database.ref(`Members/${newId}`).set({
        id: newId,
        firstName,
        middleName: middleName || '',
        lastName,
        email,
        contactNumber,
        dateAdded,
        timeAdded,
        role: 'admin',
        status: 'active',
        uid: userCredential.user.uid
      });

      setPendingAdd({
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        password
      });

      setSuccessMessage(`Admin account created successfully!`);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error adding admin:', error);
      setErrorMessage(error.message || 'Failed to add admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const deleteFirebaseUser = async (uid) => {
    try {
      // You need to be authenticated as an admin to delete users
      // This requires setting up Firebase Admin SDK or using a Cloud Function
      console.log('Attempting to delete Firebase user with UID:', uid);
      
      // Note: Client-side Firebase Auth doesn't allow deleting other users
      // This would need to be handled via a Cloud Function
      // For now, we'll just log the UID that needs to be deleted
      
      // If you have a Cloud Function set up, you would call it here:
      // await fetch('/deleteUser', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ uid: uid })
      // });
      
      console.log(`Firebase user with UID ${uid} should be deleted via Cloud Function`);
      return true;
    } catch (error) {
      console.error('Error deleting Firebase user:', error);
      throw new Error('Failed to delete user authentication: ' + error.message);
    }
  };

  const handleDeleteAdmin = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);
    setActionInProgress(true);

    try {
      const idToDelete = pendingDelete.id;
      const uidToDelete = pendingDelete.uid;

      // Delete from database
      await database.ref(`Users/Admin/${idToDelete}`).remove();
      await database.ref(`Members/${idToDelete}`).remove();

      // Delete Firebase authentication user if UID exists
      if (uidToDelete) {
        try {
          await deleteFirebaseUser(uidToDelete);
          console.log('Firebase authentication user deletion initiated for UID:', uidToDelete);
        } catch (authError) {
          console.warn('Could not delete Firebase auth user, but proceeding with database deletion:', authError);
          // Continue with success even if auth deletion fails
        }
      }

      setSuccessMessage(`Admin account deleted successfully!`);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error deleting admin:', error);
      setErrorMessage(error.message || 'Failed to delete admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (filteredData.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Admins');

      const headers = ['ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Contact Number', 'Date Added'];
      worksheet.addRow(headers);

      filteredData.forEach(admin => {
        const row = [
          admin.id,
          admin.firstName || '',
          admin.middleName || '',
          admin.lastName || '',
          admin.email,
          admin.contactNumber,
          admin.dateAdded,
        ];
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheet.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Admins.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Data exported successfully!');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    
    // Close the admin details modal if it's open (after delete action)
    if (pendingDelete) {
      setAdminModalVisible(false);
      setSelectedAdmin(null);
    }
  
    if (pendingAdd) {
      sendAdminCredentialsEmail({
        email: pendingAdd.email,
        password: pendingAdd.password,
        firstName: pendingAdd.firstName,
        middleName: pendingAdd.middleName,
        lastName: pendingAdd.lastName
      }).catch(error => console.error('Error sending admin credentials email:', error));
      
      // Reset form
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');
      setAddModalVisible(false);
    } 
    else if (pendingDelete) {
      sendAdminDeleteData({
        email: pendingDelete.email,
        firstName: pendingDelete.firstName || '',
        middleName: pendingDelete.middleName || '',
        lastName: pendingDelete.lastName || ''
      }).catch(error => console.error('Error sending admin delete notification:', error));
    }

    setPendingAdd(null);
    setPendingDelete(null);
    
    // Refresh the list
    const fetchAdmins = async () => {
      try {
        const snapshot = await database.ref('Users/Admin').once('value');
        const data = snapshot.val() || {};
        const adminList = Object.entries(data).map(([id, admin]) => ({
          id,
          ...admin,
          name: admin.firstName 
            ? `${admin.firstName}${admin.middleName ? ' ' + admin.middleName : ''} ${admin.lastName}`.trim()
            : admin.name || ''
        }));
        setAdmins(adminList);
        setFilteredData(adminList);
      } catch (error) {
        console.error('Error refreshing admin data:', error);
      }
    };

    fetchAdmins();
  };

  const handleSubmitConfirmation = () => {
    if (!validateFields()) return;
    
    const emailExists = admins.some(admin => admin.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      setEmailError('Email address is already in use');
      return;
    }

    setConfirmAddVisible(true);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setContactNumber('');
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setContactNumberError('');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Admins Management</h1>
            <p style={styles.headerSubtitle}>
              Manage admin accounts and permissions
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Create Button - Left side */}
            <button
              style={{
                ...styles.createButton,
                ...(isHovered.create ? styles.createButtonHover : {})
              }}
              onMouseEnter={() => handleMouseEnter('create')}
              onMouseLeave={() => handleMouseLeave('create')}
              onClick={() => setAddModalVisible(true)}
              className="hover-lift"
            >
              <FaPlus />
              <span>Create New Admin</span>
            </button>

            {/* Search and Download - Right side */}
            <div style={styles.searchDownloadContainer}>
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => handleMouseEnter('search')}
                  onBlur={() => handleMouseLeave('search')}
                />
              </div>

              <button 
                style={{
                  ...styles.downloadButton,
                  ...(isHovered.download ? styles.downloadButtonHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('download')}
                onMouseLeave={() => handleMouseLeave('download')}
                onClick={handleDownload}
                title="Export to Excel"
              >
                <FaDownload />
              </button>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div style={styles.dataContainer}>
          {/* Pagination at the top */}
          {!noMatch && filteredData.length > 0 && (
            <div style={styles.paginationContainer}>
              <span style={styles.paginationInfo}>
                {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredData.length)} of {filteredData.length}
              </span>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 0 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages - 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* Table Content */}
          {noMatch ? (
            <div style={styles.noDataContainer}>
              <FaSearch style={styles.noDataIcon} />
              <p style={styles.noDataText}>No matches found for your search</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={styles.noDataContainer}>
              <FaUser style={styles.noDataIcon} />
              <p style={styles.noDataText}>No admin accounts found</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>First Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Middle Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Last Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Email Address</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Contact Number</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Added</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((admin) => (
                    <tr key={admin.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>#{admin.id}</td>
                      <td style={styles.tableCell}>{admin.firstName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.middleName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.lastName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.email}</td>
                      <td style={styles.tableCell}>{admin.contactNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.dateAdded || 'N/A'}</td>
                      <td style={styles.tableCell}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setAdminModalVisible(true);
                          }}
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
          )}
        </div>

        {/* Add Admin Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay} onClick={() => { setAddModalVisible(false); resetForm(); }}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaUser />
                  Create New Admin
                </h2>
                <button 
                  onClick={() => { setAddModalVisible(false); resetForm(); }}
                  style={styles.closeButton}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.formGrid}>
                  {/* Left Column */}
                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        First Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoCapitalize="words"
                      />
                      {firstNameError && <span style={styles.errorText}>{firstNameError}</span>}
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Last Name<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoCapitalize="words"
                      />
                      {lastNameError && <span style={styles.errorText}>{lastNameError}</span>}
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Email<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        autoCapitalize="none"
                      />
                      {emailError && <span style={styles.errorText}>{emailError}</span>}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>Middle Name</label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter middle name"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        autoCapitalize="words"
                      />
                    </div>

                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>
                        Contact Number<span style={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        style={styles.formInput}
                        placeholder="Enter 11-digit contact number"
                        value={contactNumber}
                        onChange={(e) => {
                          const numericText = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                          setContactNumber(numericText);
                        }}
                        type="tel"
                      />
                      {contactNumberError && <span style={styles.errorText}>{contactNumberError}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => { setAddModalVisible(false); resetForm(); }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={handleSubmitConfirmation}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Details Modal */}
        {adminModalVisible && selectedAdmin && (
          <div style={styles.modalOverlay} onClick={() => setAdminModalVisible(false)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaUser />
                  Admin Details
                </h2>
                <button 
                  onClick={() => setAdminModalVisible(false)}
                  style={styles.closeButton}
                >
                  <AiOutlineClose />
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
                          <FaIdCard />
                          ID:
                        </span>
                        <span style={styles.fieldValue}>#{selectedAdmin.id}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>First Name:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.firstName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Middle Name:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.middleName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Last Name:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.lastName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Gender:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.gender || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date of Birth:</span>
                        <span style={styles.fieldValue}>
                          {selectedAdmin.dateOfBirth ? new Date(selectedAdmin.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Age:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.age || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Place of Birth:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Address:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.address || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Civil Status:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.civilStatus || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Contact & Account Information */}
                  <div style={styles.column}>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaEnvelope />
                        Contact Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaEnvelope />
                          Email:
                        </span>
                        <span style={styles.fieldValue}>{selectedAdmin.email || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaPhone />
                          Contact Number:
                        </span>
                        <span style={styles.fieldValue}>{selectedAdmin.contactNumber || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Government ID:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.governmentId || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCalendarAlt />
                        Account Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Added:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.dateAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Added:</span>
                        <span style={styles.fieldValue}>{selectedAdmin.timeAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Status:</span>
                        <span style={styles.fieldValue}>Active</span>
                      </div>
                      {selectedAdmin.uid && (
                        <div style={styles.fieldGroup}>
                          <span style={styles.fieldLabel}>Firebase UID:</span>
                          <span style={styles.fieldValue}>{selectedAdmin.uid}</span>
                        </div>
                      )}
                    </div>

                    {/* Submitted Documents */}
                    {(selectedAdmin.validIdFront || selectedAdmin.validIdBack || selectedAdmin.selfie || selectedAdmin.selfieWithId) && (
                      <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                          <FaIdCard />
                          Submitted Documents
                        </h3>
                        <div style={styles.imageGrid}>
                          {selectedAdmin.validIdFront && (
                            <div style={styles.imageContainer}>
                              <span style={styles.imageLabel}>Valid ID Front</span>
                              <img
                                src={selectedAdmin.validIdFront}
                                alt="Valid ID Front"
                                style={styles.imagePreview}
                                onClick={() => openImageViewer(selectedAdmin.validIdFront, 'Valid ID Front', 0)}
                              />
                            </div>
                          )}
                          {selectedAdmin.validIdBack && (
                            <div style={styles.imageContainer}>
                              <span style={styles.imageLabel}>Valid ID Back</span>
                              <img
                                src={selectedAdmin.validIdBack}
                                alt="Valid ID Back"
                                style={styles.imagePreview}
                                onClick={() => openImageViewer(selectedAdmin.validIdBack, 'Valid ID Back', 1)}
                              />
                            </div>
                          )}
                          {selectedAdmin.selfie && (
                            <div style={styles.imageContainer}>
                              <span style={styles.imageLabel}>Selfie</span>
                              <img
                                src={selectedAdmin.selfie}
                                alt="Selfie"
                                style={styles.imagePreview}
                                onClick={() => openImageViewer(selectedAdmin.selfie, 'Selfie', 2)}
                              />
                            </div>
                          )}
                          {selectedAdmin.selfieWithId && (
                            <div style={styles.imageContainer}>
                              <span style={styles.imageLabel}>Selfie with ID</span>
                              <img
                                src={selectedAdmin.selfieWithId}
                                alt="Selfie with ID"
                                style={styles.imagePreview}
                                onClick={() => openImageViewer(selectedAdmin.selfieWithId, 'Selfie with ID', 3)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => {
                    setPendingDelete(selectedAdmin);
                    setConfirmDeleteVisible(true);
                  }}
                  disabled={isProcessing}
                >
                  <FaTrash />
                  Delete Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        {confirmAddVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmAddVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f59e0b' }} />
              <p style={styles.modalText}>
                Are you sure you want to create this admin account?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton
                  }} 
                  onClick={handleAddAdmin}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes'}
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton
                  }} 
                  onClick={() => setConfirmAddVisible(false)}
                  disabled={actionInProgress}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmDeleteVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
              <p style={styles.modalText}>
                Are you sure you want to delete this admin account? This will also remove their authentication access. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton
                  }} 
                  onClick={handleDeleteAdmin}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Delete Account'}
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton
                  }} 
                  onClick={() => setConfirmDeleteVisible(false)}
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
          <div style={styles.modalOverlay} onClick={handleSuccessOk}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#059669' }} />
              <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Success!</h2>
              <p style={styles.modalText}>
                {successMessage}
              </p>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton
                }}
                onClick={handleSuccessOk}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setErrorModalVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
              <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Error</h2>
              <p style={styles.modalText}>
                {errorMessage}
              </p>
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
    </div>
  );
};

export default Admins;