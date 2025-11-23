import React, { useEffect, useMemo, useState } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight, 
  FaPlus, 
  FaSave, 
  FaTimes, 
  FaCheckCircle, 
  FaUser, 
  FaUserCheck, 
  FaUserTimes, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaIdCard, 
  FaMapMarkerAlt, 
  FaMoneyBillWave, 
  FaSpinner, 
  FaHandHoldingUsd,
  FaReceipt  
} from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { FiAlertCircle } from 'react-icons/fi';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendMemberCredentialsEmail, sendMemberDeleteData } from '../../../../Server/api';
import ExcelJS from 'exceljs';

// Options
const governmentIdOptions = [
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Drivers License' }
];

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

const formatCurrency = (amount) => {
  return `₱${Number(amount || 0).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
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
  tabContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    flexWrap: 'wrap',
    flex: '1',
    minWidth: '0'
  },
  tabButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: 'transparent',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  activeTabButton: {
    backgroundColor: '#fff',
    color: '#1e40af',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tabIcon: {
    fontSize: '16px'
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
  filterContainer: {
    position: 'relative'
  },
  filterButton: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  filterButtonHover: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: '100',
    marginTop: '4px'
  },
  filterOption: {
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activeFilterOption: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontWeight: '600'
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
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '80px'
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
  addMemberButton: {
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
  addMemberButtonHover: {
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
    height: '200px'
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
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#d1d5db'
  },
  noDataText: {
    fontSize: '16px',
    margin: 0
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
  fileUploadSection: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fileUploadSectionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff'
  },
  fileInput: {
    display: 'none'
  },
  fileUploadText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px',
    textAlign: 'center'
  },
  fileName: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500',
    marginTop: '4px',
    textAlign: 'center',
    wordBreak: 'break-word'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
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
  loanSection: {
    background: '#fff9f0',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem'
  },
  loanCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    cursor: 'pointer'
  },
  loanFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px'
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '12px'
  },
  infoText: {
    fontSize: '12px',
    color: '#856404',
    lineHeight: '1.5'
  },
  loansContainer: {
    marginTop: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f8fafc'
  },
  loanCard: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: 'white'
  },
  loanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  },
  loanTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e3a8a',
    margin: 0
  },
  removeLoanButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  addAnotherLoanButton: {
    background: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: '8px'
  }
};

const emptyForm = {
  memberId: '',
  email: '',
  phoneNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  address: '',
  governmentId: '',
  balance: '',
  investment: '',
  currentSavings: '',
  hasExistingLoan: false,
  loanAmount: '',
  loanTerm: ''
};


const DataMigration = () => {
  // Data
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');


  // Pagination
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Files
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  // UX
  const [uploading, setUploading] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  const [memberFilter, setMemberFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Form validation errors
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [memberIdError, setMemberIdError] = useState('');
  
  // Loan and penalty states
const [currentLoan, setCurrentLoan] = useState(null);
const [activeLoans, setActiveLoans] = useState([]); // list of active loans for member
const [selectedLoanId, setSelectedLoanId] = useState(null); // which loan is selected for payment
const [penaltyAmount, setPenaltyAmount] = useState(0);
const [penaltyPerDay, setPenaltyPerDay] = useState(100); // Default penalty
const [totalAmountDue, setTotalAmountDue] = useState(0);
const [overdueDays, setOverdueDays] = useState(0);
const [refreshing, setRefreshing] = useState(false);

// Add these state variables to your existing DataMigration component
const [existingLoans, setExistingLoans] = useState([]);
const [paymentTransactions, setPaymentTransactions] = useState([]);
const [interestRatesByType, setInterestRatesByType] = useState({});
const [loanTypeOptions, setLoanTypeOptions] = useState([]);
const [availableTerms, setAvailableTerms] = useState([]);
const [processingFee, setProcessingFee] = useState(0);


// Empty loan template
const emptyLoan = {
  id: Date.now().toString(),
  loanType: '',
  loanAmount: '',
  term: '',
  outstandingBalance: '',
  monthsRemaining: '',
  paymentsMade: 0,
  status: 'active',
  dateApproved: new Date().toISOString().split('T')[0],
  interestRate: 0,
  interestRateDecimal: 0,
  interestPerTerm: 0,
  totalInterest: 0,
  totalTermPayment: 0,
  totalMonthlyPayment: 0,
  monthlyPrincipal: 0,
  disbursement: 'Cash',
  accountName: '',
  accountNumber: '',
  bankType: '',
  transactionId: '' // Will be generated when saved
};

// ADD DISBURSEMENT OPTIONS CONSTANT (add this near the top with other options)
const disbursementOptions = [
  { key: 'Cash', label: 'Cash' },
  { key: 'Bank', label: 'Bank' },
  { key: 'GCash', label: 'GCash' },
];

// ADD BANK TYPE OPTIONS
const bankTypeOptions = [
  { key: 'BDO', label: 'BDO' },
  { key: 'Security Bank', label: 'Security Bank' },
  { key: 'BPI', label: 'BPI' },
  { key: 'ChinaBank', label: 'ChinaBank' },
  { key: 'Others', label: 'Others' },
];

// Empty payment transaction template
const emptyPaymentTransaction = {
  id: Date.now().toString(),
  loanTransactionId: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentTime: formatTime(new Date()),
  paymentAmount: '',
  paymentMethod: 'Cash',
  accountName: '',
  accountNumber: '',
  bankType: '',
  proofOfPaymentUrl: null,
  status: 'approved',
  penaltyPaid: 0,
  interestPaid: 0,
  principalPaid: 0,
  excessPayment: 0
};

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

  

  // Add this function after the existing formatDate and formatTime functions
const deductOneYear = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    date.setFullYear(date.getFullYear() - 1);
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error deducting year from date:', error);
    return dateString; // Return original if there's an error
  }
};


const fetchMembers = async () => {
  setLoading(true);
  try {
    const snap = await database.ref('Members').once('value');
    const data = snap.val() || {};
    const list = Object.values(data).sort((a, b) => Number(a.id) - Number(b.id));
    
    // Deduct 1 year from dateAdded for each member
    const membersWithAdjustedDates = list.map(member => ({
      ...member,
      dateAdded: deductOneYear(member.dateAdded)
    }));
    
    setMembers(membersWithAdjustedDates);
  } catch (e) {
    console.error(e);
    setErrorMessage('Failed to load members');
    setErrorModalVisible(true);
  } finally {
    setLoading(false);
  }
};

// Function to update available terms based on selected loan type
const updateAvailableTerms = (loanType, interestRatesMap = null) => {
  const rates = interestRatesMap || interestRatesByType;
  const termsForType = rates[loanType] || {};
  
  const terms = Object.keys(termsForType)
    .sort((a, b) => Number(a) - Number(b))
    .map(term => ({
      key: term,
      label: `${term} ${term === '1' ? 'Month' : 'Months'}`,
      interestRate: (Number(termsForType[term]) || 0) / 100
    }));
  
  setAvailableTerms(terms);
  return terms;
};

// Function to fetch loan types and interest rates from settings
const fetchLoanSettings = async () => {
  try {
    const settingsSnap = await database.ref('Settings').once('value');
    const settings = settingsSnap.val() || {};
    
    // Get loan types from Settings/LoanTypes
    const loanTypes = settings.LoanTypes || {};
    const types = Object.keys(loanTypes).map(type => ({
      key: type,
      label: type
    }));
    
    // Get processing fee
    const processingFeeValue = settings.ProcessingFee || 0;
    
    setLoanTypeOptions(types);
    setInterestRatesByType(loanTypes);
    setProcessingFee(parseFloat(processingFeeValue));
    
    return { loanTypes, processingFee: processingFeeValue };
  } catch (error) {
    console.error('Error fetching loan settings:', error);
    // Set default values
    setLoanTypeOptions([
      { key: 'Regular Loan', label: 'Regular Loan' },
      { key: 'Quick Cash', label: 'Quick Cash' }
    ]);
    setProcessingFee(0);
    return { loanTypes: {}, processingFee: 0 };
  }
};

// Function to add a new loan
const addNewLoan = () => {
  const transactionId = Math.floor(100000 + Math.random() * 900000).toString();
  const newLoan = {
    ...emptyLoan,
    id: Date.now().toString(), // Unique ID for React key and internal management
    transactionId: transactionId, // Unique transaction ID for database and linking
    loanType: '',
    loanAmount: '',
    term: '',
    outstandingBalance: '',
    monthsRemaining: '',
    paymentsMade: 0,
    status: 'active',
    dateApproved: new Date().toISOString().split('T')[0],
    interestRate: 0,
    interestRateDecimal: 0,
    interestPerTerm: 0,
    totalInterest: 0,
    totalTermPayment: 0,
    totalMonthlyPayment: 0,
    monthlyPrincipal: 0,
    disbursement: 'Cash',
    accountName: '',
    accountNumber: '',
    bankType: ''
  };
  setExistingLoans(prev => [...prev, newLoan]);
};

// Function to remove a loan
const removeLoan = (loanId) => {
  setExistingLoans(prev => prev.filter(loan => loan.id !== loanId));
  
  // Also remove any payment transactions linked to this loan
  const loanToRemove = existingLoans.find(loan => loan.id === loanId);
  if (loanToRemove) {
    setPaymentTransactions(prev => 
      prev.filter(payment => payment.loanTransactionId !== loanToRemove.transactionId)
    );
  }
};

// FIXED: Update loan field function
const updateLoanField = (loanId, field, value) => {
  setExistingLoans(prev => prev.map(loan => {
    if (loan.id === loanId) {
      const updatedLoan = { ...loan, [field]: value };
      
      // Handle loan type change - update available terms
      if (field === 'loanType' && value) {
        const terms = updateAvailableTerms(value);
        if (terms.length > 0 && !updatedLoan.term) {
          updatedLoan.term = terms[0].key;
          updatedLoan.interestRateDecimal = terms[0].interestRate;
        }
      }
      
      // Handle disbursement change - reset account fields if changing to Cash
      if (field === 'disbursement') {
        if (value === 'Cash') {
          updatedLoan.accountName = '';
          updatedLoan.accountNumber = '';
          updatedLoan.bankType = '';
        } else if (value === 'GCash') {
          updatedLoan.bankType = ''; // GCash doesn't need bank type
        }
      }
      
      // Handle account number validation
      if (field === 'accountNumber') {
        const validatedValue = validateAccountNumber(value, updatedLoan.disbursement);
        updatedLoan.accountNumber = validatedValue;
      }
      
      // Auto-calculate interest rate when loan type or term changes
      if ((field === 'loanType' || field === 'term') && updatedLoan.loanType && updatedLoan.term) {
        const interestRatePercentage = interestRatesByType[updatedLoan.loanType]?.[updatedLoan.term] || 0;
        updatedLoan.interestRate = parseFloat(interestRatePercentage) || 0;
        updatedLoan.interestRateDecimal = (parseFloat(interestRatePercentage) || 0) / 100;
      }
      
      // FIX: Only auto-calculate if NOT the outstandingBalance field
      if (field !== 'outstandingBalance') {
        const calculatedLoan = calculateLoanDetails(updatedLoan);
        return calculatedLoan;
      }
      
      // For outstandingBalance field, just return the updated value without recalculation
      return updatedLoan;
    }
    return loan;
  }));
};

// Enhanced calculateLoanDetails function
const calculateLoanDetails = (loan) => {
  const amount = parseFloat(loan.loanAmount) || 0;
  const termMonths = parseInt(loan.term) || 0;
  const interestRate = loan.interestRateDecimal || 0;
  const paymentsMade = parseInt(loan.paymentsMade) || 0;
  
  if (amount > 0 && termMonths > 0 && interestRate > 0) {
    const interestPerTerm = amount * interestRate;
    const totalInterest = interestPerTerm * termMonths;
    const totalTermPayment = amount + totalInterest;
    const totalMonthlyPayment = totalTermPayment / termMonths;
    const monthlyPrincipal = amount / termMonths;
    
    // Calculate interest paid based on payments made
    const interestPaidSoFar = Math.min(totalInterest, (paymentsMade * interestPerTerm));
    
    // FIX: NEVER auto-calculate outstanding balance for migration
    // Always preserve the manually entered value
    const outstandingBalance = parseFloat(loan.outstandingBalance) || totalTermPayment;
    
    return {
      ...loan,
      interestPerTerm: Math.round(interestPerTerm * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalTermPayment: Math.round(totalTermPayment * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      monthlyPrincipal: Math.round(monthlyPrincipal * 100) / 100,
      interestPaid: Math.round(interestPaidSoFar * 100) / 100,
      // CRITICAL FIX: Always use manual outstanding balance without recalculation
      outstandingBalance: outstandingBalance,
      // Auto-calculate months remaining only
      monthsRemaining: Math.max(0, termMonths - paymentsMade)
    };
  }
  
  return loan;
};
// Function to add a new payment transaction
const addPaymentTransaction = () => {
  const newPayment = {
    ...emptyPaymentTransaction,
    id: Date.now().toString()
  };
  setPaymentTransactions(prev => [...prev, newPayment]);
};

// Function to remove a payment transaction
const removePaymentTransaction = (paymentId) => {
  setPaymentTransactions(prev => prev.filter(payment => payment.id !== paymentId));
};

// Function to update payment transaction field
const updatePaymentTransactionField = (paymentId, field, value) => {
  setPaymentTransactions(prev => prev.map(payment => {
    if (payment.id === paymentId) {
      return { ...payment, [field]: value };
    }
    return payment;
  }));
};

// Function to auto-calculate payment allocation
const calculatePaymentAllocation = (paymentAmount, linkedLoan) => {
  if (!linkedLoan) return { penaltyPaid: 0, interestPaid: 0, principalPaid: 0, excessPayment: 0 };
  
  const amount = parseFloat(paymentAmount) || 0;
  const outstanding = parseFloat(linkedLoan.outstandingBalance) || 0;
  const monthlyPayment = parseFloat(linkedLoan.totalMonthlyPayment) || 0;
  
  // Simple allocation logic - you can enhance this based on your business rules
  let penaltyPaid = 0;
  let interestPaid = Math.min(amount, linkedLoan.interestPerTerm || 0);
  let principalPaid = Math.min(amount - interestPaid, outstanding);
  let excessPayment = Math.max(0, amount - interestPaid - principalPaid);
  
  return {
    penaltyPaid: Math.round(penaltyPaid * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
    principalPaid: Math.round(principalPaid * 100) / 100,
    excessPayment: Math.round(excessPayment * 100) / 100
  };
};

// Add this function to your DataMigration component, after the other helper functions

// Function to add interest payments to Yields during migration
const addInterestToYields = async (interestAmount, paymentDate = null) => {
  try {
    const now = new Date();
    const dateKey = paymentDate ? new Date(paymentDate).toISOString().split('T')[0] : now.toISOString().split('T')[0];
    
    // Get current yields
    const yieldsRef = database.ref('Settings/Yields');
    const yieldsSnap = await yieldsRef.once('value');
    const currentYields = parseFloat(yieldsSnap.val()) || 0;
    
    // Add interest to yields
    const newYieldsAmount = Math.ceil((currentYields + interestAmount) * 100) / 100;
    await yieldsRef.set(newYieldsAmount);
    
    // Update YieldsHistory for the specific date
    const yieldsHistoryRef = database.ref('Settings/YieldsHistory');
    const currentDayYieldsSnap = await yieldsHistoryRef.child(dateKey).once('value');
    const currentDayYields = parseFloat(currentDayYieldsSnap.val()) || 0;
    const newDayYields = Math.ceil((currentDayYields + interestAmount) * 100) / 100;
    
    await yieldsHistoryRef.update({ [dateKey]: newDayYields });
    
    console.log(`Added ${formatCurrency(interestAmount)} to Yields on ${dateKey}`);
    return true;
  } catch (error) {
    console.error('Error adding interest to yields:', error);
    throw error;
  }
};

// Add this useEffect to prevent auto-calculation interference
useEffect(() => {
  // This ensures that when loans are added, they don't get auto-calculated values
  if (existingLoans.length > 0) {
    const loansWithManualOutstanding = existingLoans.map(loan => {
      // If user has manually set outstanding balance, preserve it
      if (loan.outstandingBalance && loan.outstandingBalance !== loan.totalTermPayment) {
        return loan;
      }
      return loan;
    });
    
    // Only update if there's actually a change needed
    if (JSON.stringify(existingLoans) !== JSON.stringify(loansWithManualOutstanding)) {
      setExistingLoans(loansWithManualOutstanding);
    }
  }
}, [existingLoans.length]); // Only run when number of loans changes

// Add this to your useEffect
useEffect(() => {
  (async () => {
    await fetchLoanSettings();
    await fetchMembers();
  })();
}, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = members;
    
    // Apply status filter
    if (memberFilter === 'active') {
      filtered = members.filter(member => member.status === 'active');
    } else if (memberFilter === 'inactive') {
      filtered = members.filter(member => member.status === 'inactive');
    }
    
    // Apply search filter
    if (q) {
      filtered = filtered.filter(m => (
        `${m.firstName || ''} ${m.middleName || ''} ${m.lastName || ''}`.toLowerCase().includes(q) ||
        `${m.email || ''}`.toLowerCase().includes(q) ||
        `${m.phoneNumber || ''}`.toLowerCase().includes(q) ||
        String(m.id || '').includes(q)
      ));
    }
    
    return filtered;
  }, [searchQuery, members, memberFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(0);
  }, [totalPages]);

  const toPeso = (n) => `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
  };

  const handleDownload = async () => {
    try {
      if (filteredData.length === 0) {
        setErrorMessage('No data to download');
        setErrorModalVisible(true);
        return;
      }
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Members');
      
      const headers = Object.keys(filteredData[0]);
      worksheet.addRow(headers);
      
      filteredData.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Members_Migration.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const getNextAvailableMemberId = () => {
    if (members.length === 0) return 5001;
    
    const existingIds = members.map(m => Number(m.id)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    let newId = 5001;
    
    for (const id of existingIds) {
      if (id === newId) newId++;
      else if (id > newId) break;
    }
    
    return newId;
  };

// UPDATE THE VALIDATION - Allow outstanding balance to be any value
const validateLoans = () => {
  for (const loan of existingLoans) {
    // Check required fields
    if (!loan.loanType || !loan.loanAmount || !loan.term || !loan.outstandingBalance) {
      setErrorMessage('Please fill all required fields for all loans (Loan Type, Amount, Term, and Outstanding Balance)');
      setErrorModalVisible(true);
      return false;
    }
    
    // Validate disbursement fields
    if (loan.disbursement !== 'Cash') {
      if (!loan.accountName || !loan.accountNumber) {
        setErrorMessage(`Account Name and Account Number are required for ${loan.disbursement} disbursement`);
        setErrorModalVisible(true);
        return false;
      }
      
      if (!isAccountNumberValid(loan.accountNumber, loan.disbursement)) {
        const message = getAccountNumberValidationMessage(loan.accountNumber, loan.disbursement);
        setErrorMessage(`Invalid account number for ${loan.disbursement}: ${message}`);
        setErrorModalVisible(true);
        return false;
      }
      
      // Validate bank type for Bank disbursement
      if (loan.disbursement === 'Bank' && !loan.bankType) {
        setErrorMessage('Bank Type is required for Bank disbursement');
        setErrorModalVisible(true);
        return false;
      }
    }
    
    const loanAmount = parseFloat(loan.loanAmount);
    const outstanding = parseFloat(loan.outstandingBalance);
    const totalTermPayment = parseFloat(loan.totalTermPayment) || 0;
    
    // FIX: Remove strict validation - allow any outstanding balance for migration
    // This handles cases where members paid more than principal
    if (outstanding < 0) {
      setErrorMessage(`Outstanding balance cannot be negative for ${loan.loanType}`);
      setErrorModalVisible(true);
      return false;
    }
    
    // Only warn if outstanding balance seems too high, but don't block
    if (outstanding > totalTermPayment * 1.5) {
      console.warn(`Outstanding balance seems high for ${loan.loanType}, but allowing for migration`);
    }
  }
  return true;
};

  const validateFields = () => {
    let isValid = true;
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
    setPhoneNumberError('');
    setMemberIdError('');

    // Member ID validation
    if (!formData.memberId.trim()) {
      setMemberIdError('Member ID is required');
      isValid = false;
    } else {
      const memberId = parseInt(formData.memberId);
      if (isNaN(memberId) || memberId < 5001) {
        setMemberIdError('Member ID must be a number starting from 5001');
        isValid = false;
      } else {
        // Check if member ID already exists
        const idExists = members.some(member => member.id === memberId);
        if (idExists) {
          setMemberIdError(`Member ID ${memberId} is already taken`);
          isValid = false;
        }
      }
    }

    if (!formData.email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      setPhoneNumberError('Contact number is required');
      isValid = false;
    } else if (!/^\d{11}$/.test(formData.phoneNumber)) {
      setPhoneNumberError('Contact number must be exactly 11 digits');
      isValid = false;
    }

    // Validate loan fields if has existing loan
    if (formData.hasExistingLoan) {
      if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
        setErrorMessage('Loan amount is required when adding existing loan');
        isValid = false;
      }
      if (!formData.loanTerm) {
        setErrorMessage('Loan term is required when adding existing loan');
        isValid = false;
      }
    }

    return isValid;
  };

  const openAddModal = () => {
    const nextAvailableId = getNextAvailableMemberId();
    setFormData({ 
      ...emptyForm, 
      memberId: nextAvailableId.toString(),
      hasExistingLoan: false
    });
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
    setPhoneNumberError('');
    setMemberIdError('');
    setAddModalVisible(true);
  };

  const openViewModal = (member) => {
    setSelectedMember(member);
    setViewModalVisible(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      memberId: member.id.toString(),
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      firstName: member.firstName || '',
      middleName: member.middleName || '',
      lastName: member.lastName || '',
      dateOfBirth: member.dateOfBirth || '',
      placeOfBirth: member.placeOfBirth || '',
      address: member.address || '',
      governmentId: member.governmentId || '',
      balance: String(member.balance ?? 0),
      investment: String(member.investment ?? 0),
      currentSavings: String(member.currentSavings ?? 0),
      hasExistingLoan: false,
      loanAmount: '',
      loanTerm: ''
    });
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setEditModalVisible(true);
  };

  const closeModals = () => {
    setAddModalVisible(false);
    setViewModalVisible(false);
    setEditModalVisible(false);
    setSelectedMember(null);
    setEditingMember(null);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-suggest next available ID when typing in memberId field
    if (name === 'memberId' && value.trim() === '') {
      const nextAvailableId = getNextAvailableMemberId();
      setFormData(prev => ({
        ...prev,
        memberId: nextAvailableId.toString()
      }));
    }
  };

  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const uploadImageToStorage = async (file, path) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Validate account number based on disbursement type
const validateAccountNumber = (value, disbursementType) => {
  // Remove any non-digit characters
  const cleanValue = value.replace(/\D/g, '');
  
  if (disbursementType === 'GCash') {
    // GCash: exactly 11 digits
    if (cleanValue.length > 11) {
      return cleanValue.slice(0, 11);
    }
  } else if (disbursementType === 'Bank') {
    // Bank: minimum 8 digits, maximum 16 digits
    if (cleanValue.length > 16) {
      return cleanValue.slice(0, 16);
    }
  }
  
  return cleanValue;
};

// Check if account number meets requirements
const isAccountNumberValid = (accountNumber, disbursementType) => {
  if (disbursementType === 'Cash') return true;
  
  const cleanAccountNumber = accountNumber.replace(/\D/g, '');
  
  if (disbursementType === 'GCash') {
    return cleanAccountNumber.length === 11;
  } else if (disbursementType === 'Bank') {
    return cleanAccountNumber.length >= 8 && cleanAccountNumber.length <= 16;
  }
  
  return false;
};

// Get account number validation message
const getAccountNumberValidationMessage = (accountNumber, disbursementType) => {
  if (disbursementType === 'Cash') return '';
  
  const cleanAccountNumber = accountNumber.replace(/\D/g, '');
  
  if (disbursementType === 'GCash') {
    if (cleanAccountNumber.length === 0) return '';
    if (cleanAccountNumber.length < 11) return 'GCash number must be 11 digits';
    if (cleanAccountNumber.length > 11) return 'GCash number cannot exceed 11 digits';
    return 'Valid GCash number';
  } else if (disbursementType === 'Bank') {
    if (cleanAccountNumber.length === 0) return '';
    if (cleanAccountNumber.length < 8) return 'Bank account must be at least 8 digits';
    if (cleanAccountNumber.length > 16) return 'Bank account cannot exceed 16 digits';
    return 'Valid bank account number';
  }
  
  return '';
};

  const validateAddFields = () => {
    if (!validateFields()) {
      return false;
    }
    
    if (!validIdFrontFile || !selfieFile) {
      setErrorMessage('Please upload Valid ID Front and Selfie images.');
      setErrorModalVisible(true);
      return false;
    }
    
    // Check if email already exists
    const emailExists = members.some(member => member.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      setEmailError('Email address is already in use');
      return false;
    }
      // Validate existing loans if any
  if (existingLoans.length > 0) {
    for (const loan of existingLoans) {
      if (!loan.loanType || !loan.loanAmount || !loan.term || !loan.outstandingBalance) {
        setErrorMessage('Please fill all required fields for all loans (Loan Type, Amount, Term, and Outstanding Balance)');
        setErrorModalVisible(true);
        return false;
      }
      
      const loanAmount = parseFloat(loan.loanAmount);
      const outstanding = parseFloat(loan.outstandingBalance);
      
      if (outstanding > loanAmount) {
        setErrorMessage(`Outstanding balance cannot be greater than original loan amount for ${loan.loanType}`);
        setErrorModalVisible(true);
        return false;
      }
    }
  }
    // Validate existing loans if any
  if (existingLoans.length > 0) {
    if (!validateLoans()) {
      return false;
    }
  }
    
    return true;
  };

  const handleSubmitConfirmation = () => {
    if (!validateAddFields()) return;
    setPendingAction('add');
    setConfirmModalVisible(true);
  };

// Function to create loan record in database
// Enhanced createLoanRecord function
const createLoanRecord = async (memberId, loanData) => {
  try {
    const now = new Date();
    
    const {
      loanType,
      loanAmount,
      term,
      outstandingBalance,
      paymentsMade,
      status,
      dateApproved,
      interestRate,
      disbursement,
      accountName,
      accountNumber,
      bankType,
      interestPerTerm,
      totalInterest,
      totalTermPayment,
      totalMonthlyPayment,
      monthlyPrincipal
    } = loanData;
    
    const amount = parseFloat(loanAmount);
    const outstanding = parseFloat(outstandingBalance) || amount;
    const termMonths = parseInt(term);
    const payments = parseInt(paymentsMade) || 0;
    const releaseAmount = Math.round((amount - processingFee) * 100) / 100;
    
    // Calculate total amount paid (principal + interest)
    const totalPaid = Math.max(0, (totalTermPayment || (amount + totalInterest)) - outstanding);
    
    // Calculate how much interest has been paid based on payments made
    const totalInterestForLoan = parseFloat(totalInterest) || (interestPerTerm * termMonths) || 0;
    const interestPaidSoFar = Math.min(totalInterestForLoan, totalPaid * 0.3); // Assume 30% of payments go to interest
    
    // Set due date
    const dueDate = new Date(dateApproved || now);
    dueDate.setMonth(dueDate.getMonth() + payments + 1);
    
    const loanRecord = {
      transactionId: loanData.transactionId,
      id: memberId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      disbursement: disbursement || 'Cash',
      accountName: accountName || '',
      accountNumber: accountNumber || '',
      bankType: bankType || (disbursement === 'Bank' ? '' : null),
      loanAmount: amount,
      loanType: loanType,
      term: termMonths,
      interestRate: parseFloat(interestRate) || 0,
      
      // Calculated fields
      interest: Math.round(interestPerTerm * 100) / 100,
      totalInterest: Math.round(totalInterestForLoan * 100) / 100,
      monthlyPayment: Math.round(monthlyPrincipal * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      totalTermPayment: Math.round(totalTermPayment * 100) / 100,
      releaseAmount: releaseAmount,
      processingFee: processingFee,
      
      // Dates
      dateApplied: formatDate(new Date(dateApproved || now)),
      timeApplied: formatTime(now),
      dateApproved: formatDate(new Date(dateApproved || now)),
      timeApproved: formatTime(now),
      timestamp: now.getTime(),
      dueDate: formatDate(dueDate),
      
      // Payment tracking
      status: status || 'approved',
      paymentsMade: payments,
      amountPaid: Math.round(totalPaid * 100) / 100,
      remainingBalance: Math.round(outstanding * 100) / 100,
      outstandingBalance: Math.round(outstanding * 100) / 100,
      interestPaid: Math.round(interestPaidSoFar * 100) / 100,
      principalPaid: Math.round((totalPaid - interestPaidSoFar) * 100) / 100,
      
      // Migration flags
      isMigration: true,
      originalLoanAmount: amount
    };
    
    // Save to all relevant locations
    await database.ref(`Loans/LoanApplications/${memberId}/${loanData.transactionId}`).set(loanRecord);
    await database.ref(`Loans/ApprovedLoans/${memberId}/${loanData.transactionId}`).set(loanRecord);
    
    if (status === 'active') {
      await database.ref(`Loans/CurrentLoans/${memberId}/${loanData.transactionId}`).set(loanRecord);
    }
    
    // Save to transactions
    await database.ref(`Transactions/Loans/${memberId}/${loanData.transactionId}`).set({
      ...loanRecord,
      label: 'Loan',
      type: 'Loans'
    });
    
    // Save to member's loans
    await database.ref(`Members/${memberId}/loans/${loanData.transactionId}`).set(loanRecord);
    
    // If paid, move to PaidLoans and add interest to yields
    if (status === 'paid' && interestPaidSoFar > 0) {
      await database.ref(`Loans/PaidLoans/${memberId}/${loanData.transactionId}`).set(loanRecord);
      await database.ref(`Loans/CurrentLoans/${memberId}/${loanData.transactionId}`).remove();
      
      // ADD INTEREST TO YIELDS for paid loans
      await addInterestToYields(interestPaidSoFar, dateApproved);
    }
    
    return loanRecord;
    
  } catch (error) {
    console.error('Error creating loan record:', error);
    throw error;
  }
};

// Function to create payment record in database
const createPaymentRecord = async (memberId, paymentData, linkedLoan) => {
  try {
    const now = new Date();
    const transactionId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const {
      loanTransactionId,
      paymentDate,
      paymentTime,
      paymentAmount,
      paymentMethod,
      accountName,
      accountNumber,
      bankType,
      penaltyPaid,
      interestPaid,
      principalPaid,
      excessPayment
    } = paymentData;
    
    const paymentAmountNum = parseFloat(paymentAmount) || 0;
    const interestPaidNum = parseFloat(interestPaid) || 0;
    
    const paymentRecord = {
      transactionId,
      id: memberId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      
      // Payment details
      amountToBePaid: paymentAmountNum,
      paymentOption: paymentMethod,
      accountName: accountName || 'Migration',
      accountNumber: accountNumber || 'Migration',
      bankType: bankType || (paymentMethod === 'Bank' ? 'Migration' : null),
      
      // Dates
      dateApplied: `${formatDate(new Date(paymentDate))} at ${paymentTime}`,
      timestamp: now.getTime(),
      
      // Breakdown
      penalty: parseFloat(penaltyPaid) || 0,
      penaltyPaid: parseFloat(penaltyPaid) || 0,
      interestPaid: interestPaidNum,
      principalPaid: parseFloat(principalPaid) || 0,
      excessPayment: parseFloat(excessPayment) || 0,
      
      // Status
      status: 'approved',
      dateApproved: formatDate(now),
      timeApproved: formatTime(now),
      
      // Links
      selectedLoanId: loanTransactionId,
      
      // Migration flags
      isMigration: true
    };
    
    // Save to payment records
    await database.ref(`Payments/PaymentApplications/${memberId}/${transactionId}`).set(paymentRecord);
    await database.ref(`Payments/ApprovedPayments/${memberId}/${transactionId}`).set(paymentRecord);
    
    // Save to transactions
    await database.ref(`Transactions/Payments/${memberId}/${transactionId}`).set({
      ...paymentRecord,
      label: 'Payment',
      type: 'Payments'
    });
    
    // ADD INTEREST TO YIELDS for payment transactions with interest
    if (interestPaidNum > 0) {
      await addInterestToYields(interestPaidNum, paymentDate);
    }
    
    return paymentRecord;
    
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
};

// Enhanced submit function that handles both loans and payments
// Enhanced submitAddMember function
const submitAddMember = async () => {
  setConfirmModalVisible(false);
  setUploading(true);
  
  try {
    const password = generateRandomPassword();
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const userId = userCredential.user.uid;
    
    const newId = parseInt(formData.memberId);
    if (isNaN(newId) || newId < 5001) {
      throw new Error('Invalid member ID');
    }
    
    // Double-check if member ID already exists
    const idExists = members.some(member => member.id === newId);
    if (idExists) {
      throw new Error(`Member ID ${newId} is already taken`);
    }
    
    const now = new Date();
    
    // Deduct 1 year from current date for dateAdded
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const dateAdded = formatDate(oneYearAgo);
    const timeAdded = formatTime(now);
    
    // Upload member documents
// Upload member documents
const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newId}/valid_id_front_${Date.now()}`);
const selfieUrl = await uploadImageToStorage(selfieFile, `member_docs/${newId}/selfie_${Date.now()}`);
    
    const investment = parseFloat(formData.investment || 0);
    const currentSavings = parseFloat(formData.currentSavings || 0);
    const balance = parseFloat(formData.balance || 0);
    
    const finalBalance = balance;
    
    const memberData = {
      id: newId,
      authUid: userId,
      email: formData.email,
      firstName: formData.firstName,
      middleName: formData.middleName || '',
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      placeOfBirth: formData.placeOfBirth,
      address: formData.address,
      governmentId: formData.governmentId,
      dateAdded,
      timeAdded,
      status: 'active',
      balance: finalBalance,
      investment: investment,
      loans: 0,
      validIdFront: validIdFrontUrl,
      selfie: selfieUrl,
      initialPassword: password,
      isMigration: true
    };
    
    // Save member data
    await database.ref(`Members/${newId}`).set(memberData);
    
    // Update Funds with investment
    if (investment > 0) {
      const fundsRef = database.ref('Settings/Funds');
      const fundsSnap = await fundsRef.once('value');
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const newFunds = currentFunds + balance;
      await fundsRef.set(newFunds);
      
      // Update Funds History
      const timestamp = now.toISOString().replace(/[.#$[\]]/g, '_');
      await database.ref(`Settings/FundsHistory/${timestamp}`).set(newFunds);
    }
    
    // Update Savings
    if (currentSavings > 0) {
      const savingsRef = database.ref('Settings/Savings');
      const savingsSnap = await savingsRef.once('value');
      const currentSavingsAmount = parseFloat(savingsSnap.val()) || 0;
      const newSavings = currentSavingsAmount + currentSavings;
      await savingsRef.set(newSavings);
      
      // Update Savings History
      const dateKey = now.toISOString().split('T')[0];
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      const daySavingsSnap = await savingsHistoryRef.child(dateKey).once('value');
      const currentDaySavings = parseFloat(daySavingsSnap.val()) || 0;
      await savingsHistoryRef.child(dateKey).set(currentDaySavings + currentSavings);
    }
    
    // Track total interest for all loans
    let totalInterestForAllLoans = 0;
    
    // Create loan records for all existing loans
    let totalLoansAmount = 0;
    if (existingLoans.length > 0) {
      for (const loan of existingLoans) {
        if (loan.loanType && loan.loanAmount && loan.term) {
          const loanRecord = await createLoanRecord(newId, loan);
          totalLoansAmount += parseFloat(loan.loanAmount);
          
          // Accumulate interest for paid loans
          if (loan.status === 'paid') {
            const interestPaid = parseFloat(loanRecord.interestPaid) || 0;
            totalInterestForAllLoans += interestPaid;
          }
          
          console.log(`Created loan record: ${loan.loanType} - ${formatCurrency(loan.loanAmount)}`);
        }
      }
      
      // Update member's total loans amount
      await database.ref(`Members/${newId}/loans`).set(totalLoansAmount);
    }
    
    // Create payment transactions and track interest
    if (paymentTransactions.length > 0) {
      for (const payment of paymentTransactions) {
        if (payment.loanTransactionId && payment.paymentAmount) {
          const linkedLoan = existingLoans.find(loan => loan.transactionId === payment.loanTransactionId);
          const paymentRecord = await createPaymentRecord(newId, payment, linkedLoan);
          
          // Interest from payment transactions is already added in createPaymentRecord
          const interestFromPayment = parseFloat(payment.interestPaid) || 0;
          totalInterestForAllLoans += interestFromPayment;
          
          console.log(`Created payment record: ${formatCurrency(payment.paymentAmount)} for loan ${payment.loanTransactionId}`);
        }
      }
    }
    
    // Log total interest added to Yields
    if (totalInterestForAllLoans > 0) {
      console.log(`Total interest added to Yields during migration: ${formatCurrency(totalInterestForAllLoans)}`);
    }
    
    // Store pending add for email sending
    setPendingAdd({
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      password: password,
      memberId: memberData.id,
      dateAdded: memberData.dateAdded
    });
    
    setSuccessMessage('Member migrated successfully with all transactions!');
    setSuccessModalVisible(true);
    closeModals();
    await fetchMembers();
    
  } catch (error) {
    console.error('Error adding member:', error);
    setErrorMessage(error.message || 'Failed to migrate member');
    setErrorModalVisible(true);
  } finally {
    setUploading(false);
  }
};

  const submitEditMember = async () => {
    if (!editingMember) return;
    setUploading(true);
    
    try {
      const id = editingMember.id;
      const updates = {
        phoneNumber: formData.phoneNumber || '',
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        dateOfBirth: formData.dateOfBirth || '',
        placeOfBirth: formData.placeOfBirth || '',
        address: formData.address || '',
        governmentId: formData.governmentId || '',
        balance: parseFloat(formData.balance || editingMember.balance || 0),
        investment: parseFloat(formData.investment || editingMember.investment || 0),
        loans: parseFloat(formData.loans || editingMember.loans || 0)
      };
      
      if (validIdFrontFile) updates.validIdFront = await uploadImageToStorage(validIdFrontFile, `member_docs/${id}/valid_id_front_${Date.now()}`);
      if (selfieFile) updates.selfie = await uploadImageToStorage(selfieFile, `member_docs/${id}/selfie_${Date.now()}`);
      
      await database.ref(`Members/${id}`).update(updates);
      
      setSuccessMessage('Member updated successfully!');
      setSuccessModalVisible(true);
      closeModals();
      await fetchMembers();
      
    } catch (error) {
      console.error('Error updating member:', error);
      setErrorMessage(error.message || 'Failed to update member');
      setErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  // Function to delete Firebase user
  const deleteFirebaseUser = async (uid) => {
    try {
      if (!uid) {
        console.log('No UID provided for Firebase user deletion');
        return true;
      }
      
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid === uid) {
        await deleteUser(currentUser);
        console.log('Current Firebase user deleted successfully');
      } else {
        console.warn('Cannot delete other users client-side. UID:', uid);
        console.log('Note: To delete other users, implement a Cloud Function');
        throw new Error('Cannot delete other users client-side. Implement a Cloud Function for this operation.');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting Firebase user:', error);
      throw new Error('Failed to delete user authentication: ' + error.message);
    }
  };

  const handleDeleteMember = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);
    setActionInProgress(true);
    
    try {
      const idToDelete = pendingDelete.id;
      const uidToDelete = pendingDelete.authUid;
      
      // Delete from database first
      await database.ref(`Members/${idToDelete}`).remove();
      
      // Delete Firebase authentication user if UID exists
      if (uidToDelete) {
        try {
          await deleteFirebaseUser(uidToDelete);
          console.log('Firebase authentication user deletion completed for UID:', uidToDelete);
        } catch (authError) {
          console.warn('Could not delete Firebase auth user, but proceeding with database deletion:', authError);
        }
      }
      
      setSuccessMessage(`Member account #${idToDelete} deleted successfully!`);
      setSuccessModalVisible(true);
      
      // Store pending delete for notification
      setPendingDelete({
        ...pendingDelete,
        id: idToDelete
      });
      
    } catch (error) {
      console.error('Error deleting member:', error);
      setErrorMessage(error.message || 'Failed to delete member');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
      setActionInProgress(false);
    }
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    
    // Send member credentials email after successful addition
    if (pendingAdd) {
      sendMemberCredentialsEmail({
        firstName: pendingAdd.firstName,
        lastName: pendingAdd.lastName,
        email: pendingAdd.email,
        password: pendingAdd.password,
        memberId: pendingAdd.memberId,
        dateAdded: pendingAdd.dateAdded
      }).catch(error => console.error('Error sending member credentials email:', error));
      
      setPendingAdd(null);
    }
    
    // Send delete notification after successful deletion
    if (pendingDelete) {
      sendMemberDeleteData({
        email: pendingDelete.email,
        firstName: pendingDelete.firstName || '',
        lastName: pendingDelete.lastName || '',
        memberId: pendingDelete.id
      }).catch(error => console.error('Error sending member delete notification:', error));
      
      setViewModalVisible(false);
      setSelectedMember(null);
    }
    
    if (pendingAction) {
      setPendingAction(null);
    }
  };

  const renderMemberFilter = () => {
    return (
      <div style={styles.filterContainer}>
        <button 
          style={{
            ...styles.filterButton,
            ...(isHovered.filterButton ? styles.filterButtonHover : {})
          }}
          onMouseEnter={() => handleMouseEnter('filterButton')}
          onMouseLeave={() => handleMouseLeave('filterButton')}
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <FaFilter />
          <span>{memberFilter === 'all' ? 'All Members' : memberFilter === 'active' ? 'Active' : 'Inactive'}</span>
        </button>
        {showFilterDropdown && (
          <div style={styles.filterDropdown}>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'all' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('all');
                setShowFilterDropdown(false);
              }}
            >
              <FaUser />
              <span>All Members</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'active' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('active');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserCheck />
              <span>Active</span>
            </button>
            <button 
              style={{
                ...styles.filterOption,
                ...(memberFilter === 'inactive' ? styles.activeFilterOption : {})
              }}
              onClick={() => {
                setMemberFilter('inactive');
                setShowFilterDropdown(false);
              }}
            >
              <FaUserTimes />
              <span>Inactive</span>
            </button>
          </div>
        )}
      </div>
    );
  };

const renderAddEditModal = (mode) => (
  <div style={styles.modalOverlay} onClick={closeModals}>
    <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>
          {mode === 'add' ? 'Migrate Existing Member' : `Edit Member #${editingMember?.id}`}
        </h2>
        <button 
          onClick={closeModals}
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
                Member ID<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter member ID"
                value={formData.memberId}
                onChange={(e) => handleInputChange('memberId', e.target.value)}
                type="number"
                min="5001"
                disabled={mode === 'edit'}
              />
              {memberIdError && <span style={styles.errorText}>{memberIdError}</span>}
              {mode === 'add' && !memberIdError && (
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Next available ID: {getNextAvailableMemberId()}
                </span>
              )}
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                First Name<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                autoCapitalize="words"
              />
              {lastNameError && <span style={styles.errorText}>{lastNameError}</span>}
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Email Address<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
                autoCapitalize="none"
                disabled={mode === 'edit'}
              />
              {emailError && <span style={styles.errorText}>{emailError}</span>}
            </div>
            
            {mode === 'add' && (
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Valid ID Front<span style={styles.requiredAsterisk}>*</span>
                </label>
                <div 
                  style={styles.fileUploadSection}
                  onClick={() => document.getElementById('validIdFront').click()}
                >
                  <input
                    id='validIdFront'
                    style={styles.fileInput}
                    type="file"
                    onChange={(e) => handleFileChange(e, setValidIdFrontFile)}
                    accept="image/*"
                  />
                  <p style={styles.fileUploadText}>
                    {validIdFrontFile ? 'Change file' : 'Click to upload'}
                  </p>
                  {validIdFrontFile && (
                    <p style={styles.fileName}>{validIdFrontFile.name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column */}
          <div>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Middle Name</label>
              <input
                style={styles.formInput}
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                autoCapitalize="words"
              />
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Phone Number<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter 11-digit contact number"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const numericText = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                  handleInputChange('phoneNumber', numericText);
                }}
                type="tel"
              />
              {phoneNumberError && <span style={styles.errorText}>{phoneNumberError}</span>}
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Government ID<span style={styles.requiredAsterisk}>*</span>
              </label>
              <select
                style={styles.formSelect}
                value={formData.governmentId}
                onChange={(e) => handleInputChange('governmentId', e.target.value)}
              >
                <option value="">Select Government ID</option>
                {governmentIdOptions.map((option) => (
                  <option key={option.key} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Current Balance</label>
              <input
                style={styles.formInput}
                type="number"
                step="0.01"
                placeholder="Enter current balance"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Initial balance (before investment is added)
              </span>
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Investment Amount</label>
              <input
                style={styles.formInput}
                type="number"
                step="0.01"
                placeholder="Enter investment amount"
                value={formData.investment}
                onChange={(e) => handleInputChange('investment', e.target.value)}
              />
              <span style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'block' }}>
                Will be added to balance and system Funds
              </span>
            </div>
            
            {mode === 'add' && (
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Selfie Photo<span style={styles.requiredAsterisk}>*</span>
                </label>
                <div 
                  style={styles.fileUploadSection}
                  onClick={() => document.getElementById('selfie').click()}
                >
                  <input
                    id='selfie'
                    style={styles.fileInput}
                    type="file"
                    onChange={(e) => handleFileChange(e, setSelfieFile)}
                    accept="image/*"
                  />
                  <p style={styles.fileUploadText}>
                    {selfieFile ? 'Change file' : 'Click to upload selfie'}
                  </p>
                  {selfieFile && (
                    <p style={styles.fileName}>{selfieFile.name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Required Fields */}
        <div style={styles.formGrid}>
          <div>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Date of Birth<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                type="date"
              />
            </div>
            
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Place of Birth<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter place of birth"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                autoCapitalize="words"
              />
            </div>
          </div>
          
          <div>
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Address<span style={styles.requiredAsterisk}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                autoCapitalize="words"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Existing Loans Section - ONLY FOR ADD MODE */}
        {mode === 'add' && (
  <div style={styles.loanSection}>
    <div style={styles.loanCheckbox}>
      <input
        type="checkbox"
        checked={existingLoans.length > 0}
        onChange={(e) => {
          if (e.target.checked) {
            // Only add one loan when checkbox is checked
            addNewLoan();
          } else {
            // Clear all loans when unchecked
            setExistingLoans([]);
            setPaymentTransactions([]);
          }
        }}
        style={{ cursor: 'pointer' }}
      />
      <label style={{ cursor: 'pointer', fontWeight: '600', color: '#1e3a8a' }}>
        <FaHandHoldingUsd style={{ marginRight: '8px' }} />
        Member has existing loans
      </label>
    </div>
    
    {existingLoans.length > 0 && (
      <>        
        <div style={styles.loansContainer}>
          {existingLoans.map((loan, index) => (
            <div key={loan.id} style={styles.loanCard}>
              <div style={styles.loanHeader}>
                <h4 style={styles.loanTitle}>Loan #{index + 1}</h4>
                {/* Always show remove button, even if there's only one loan */}
                <button
                  type="button"
                  style={styles.removeLoanButton}
                  onClick={() => removeLoan(loan.id)}
                >
                  <FaTimes />
                </button>
     
            </div>
            
            <div style={styles.loanFields}>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Loan Type<span style={styles.requiredAsterisk}>*</span>
                </label>
                <select
                  style={styles.formSelect}
                  value={loan.loanType}
                  onChange={(e) => updateLoanField(loan.id, 'loanType', e.target.value)}
                >
                  <option value="">Select Loan Type</option>
                  {loanTypeOptions.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Original Loan Amount<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Enter original loan amount"
                  value={loan.loanAmount}
                  onChange={(e) => updateLoanField(loan.id, 'loanAmount', e.target.value)}
                />
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Term (Months)<span style={styles.requiredAsterisk}>*</span>
                </label>
                <select
                  style={styles.formSelect}
                  value={loan.term}
                  onChange={(e) => updateLoanField(loan.id, 'term', e.target.value)}
                >
                  <option value="">Select Term</option>
                  {availableTerms.map((term) => (
                    <option key={term.key} value={term.key}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>
              

<div style={styles.formSection}>
  <label style={styles.formLabel}>
    Outstanding Balance<span style={styles.requiredAsterisk}>*</span>
  </label>
  <input
    style={styles.formInput}
    type="number"
    step="0.01"
    placeholder="Enter current remaining balance"
    value={loan.outstandingBalance}
    onChange={(e) => {
      // FIX: Directly update outstanding balance without triggering auto-calculation
      const newValue = e.target.value;
      setExistingLoans(prev => prev.map(l => {
        if (l.id === loan.id) {
          return { ...l, outstandingBalance: newValue };
        }
        return l;
      }));
    }}
    onFocus={(e) => {
      // FIX: Store current value to prevent auto-fill interference
      e.target.setAttribute('data-current-value', e.target.value);
    }}
    onBlur={(e) => {
      // FIX: Ensure manual input is preserved
      const manualValue = e.target.value;
      if (manualValue !== e.target.getAttribute('data-current-value')) {
        setExistingLoans(prev => prev.map(l => {
          if (l.id === loan.id) {
            return { ...l, outstandingBalance: manualValue };
          }
          return l;
        }));
      }
    }}
  />
  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
    Enter the ACTUAL current remaining balance (not auto-calculated)
  </span>
</div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Payments Made
                </label>
                <input
                  style={styles.formInput}
                  type="number"
                  placeholder="Number of payments completed"
                  value={loan.paymentsMade}
                  onChange={(e) => updateLoanField(loan.id, 'paymentsMade', e.target.value)}
                />
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Months Remaining
                </label>
                <input
                  style={styles.formInput}
                  type="number"
                  placeholder="Months left to complete"
                  value={loan.monthsRemaining}
                  onChange={(e) => updateLoanField(loan.id, 'monthsRemaining', e.target.value)}
                  readOnly
                />
                <span style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'block' }}>
                  Auto-calculated: Term - Payments Made
                </span>
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Loan Status
                </label>
                <select
                  style={styles.formSelect}
                  value={loan.status}
                  onChange={(e) => updateLoanField(loan.id, 'status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* ADD DISBURSEMENT FIELDS - Place this after the Loan Status field */}
<div style={styles.formSection}>
  <label style={styles.formLabel}>
    Disbursement Method<span style={styles.requiredAsterisk}>*</span>
  </label>
  <select
    style={styles.formSelect}
    value={loan.disbursement}
    onChange={(e) => updateLoanField(loan.id, 'disbursement', e.target.value)}
  >
    {disbursementOptions.map((option) => (
      <option key={option.key} value={option.key}>
        {option.label}
      </option>
    ))}
  </select>
</div>

{/* CONDITIONAL FIELDS BASED ON DISBURSEMENT TYPE */}
{loan.disbursement !== 'Cash' && (
  <>
    <div style={styles.formSection}>
      <label style={styles.formLabel}>
        Account Name<span style={styles.requiredAsterisk}>*</span>
      </label>
      <input
        style={styles.formInput}
        placeholder="Enter account holder name"
        value={loan.accountName}
        onChange={(e) => updateLoanField(loan.id, 'accountName', e.target.value)}
      />
    </div>
    
    <div style={styles.formSection}>
      <label style={styles.formLabel}>
        Account Number<span style={styles.requiredAsterisk}>*</span>
      </label>
      <input
        style={styles.formInput}
        placeholder={
          loan.disbursement === 'GCash' 
            ? 'Enter 11-digit GCash number' 
            : 'Enter 8-16 digit bank account number'
        }
        value={loan.accountNumber}
        onChange={(e) => updateLoanField(loan.id, 'accountNumber', e.target.value)}
        maxLength={loan.disbursement === 'GCash' ? 11 : 16}
      />
      {/* Validation Message */}
      {loan.accountNumber && (
        <span style={{
          fontSize: '11px', 
          color: isAccountNumberValid(loan.accountNumber, loan.disbursement) ? '#059669' : '#dc2626',
          marginTop: '4px',
          display: 'block'
        }}>
          {getAccountNumberValidationMessage(loan.accountNumber, loan.disbursement)}
        </span>
      )}
    </div>
    
    {/* BANK TYPE FIELD - ONLY FOR BANK DISBURSEMENT */}
    {loan.disbursement === 'Bank' && (
      <div style={styles.formSection}>
        <label style={styles.formLabel}>
          Bank Type<span style={styles.requiredAsterisk}>*</span>
        </label>
        <select
          style={styles.formSelect}
          value={loan.bankType}
          onChange={(e) => updateLoanField(loan.id, 'bankType', e.target.value)}
        >
          <option value="">Select Bank Type</option>
          {bankTypeOptions.map((bank) => (
            <option key={bank.key} value={bank.key}>
              {bank.label}
            </option>
          ))}
        </select>
      </div>
    )}
  </>
)}
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Date Approved
                </label>
                <input
                  style={styles.formInput}
                  type="date"
                  value={loan.dateApproved}
                  onChange={(e) => updateLoanField(loan.id, 'dateApproved', e.target.value)}
                />
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Interest Rate (%)
                </label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Auto-filled from loan type"
                  value={loan.interestRate}
                  readOnly
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Auto-filled based on loan type and term
                </span>
              </div>
              
              {/* Auto-calculated fields display */}
              {loan.totalMonthlyPayment > 0 && (
                <>
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Monthly Payment:</label>
                    <input
                      style={styles.formInput}
                      value={formatCurrency(loan.totalMonthlyPayment)}
                      readOnly
                    />
                  </div>
                  
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Total Interest:</label>
                    <input
                      style={styles.formInput}
                      value={formatCurrency(loan.totalInterest)}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        
        <button
          type="button"
          style={styles.addAnotherLoanButton}
          onClick={addNewLoan}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          Add Another Loan
        </button>
      </div>
      
      {/* Payment Transactions Section */}
      <div style={styles.loanSection}>
        <h4 style={{ margin: '0 0 16px 0', color: '#1e3a8a' }}>
          <FaReceipt style={{ marginRight: '8px' }} />
          Payment Transactions
        </h4>
        
        {paymentTransactions.map((payment, index) => (
          <div key={payment.id} style={styles.loanCard}>
            <div style={styles.loanHeader}>
              <h5 style={styles.loanTitle}>Payment #{index + 1}</h5>
              <button
                type="button"
                style={styles.removeLoanButton}
                onClick={() => removePaymentTransaction(payment.id)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.loanFields}>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Linked Loan<span style={styles.requiredAsterisk}>*</span>
                </label>
                <select
                  style={styles.formSelect}
                  value={payment.loanTransactionId}
                  onChange={(e) => updatePaymentTransactionField(payment.id, 'loanTransactionId', e.target.value)}
                >
                  <option value="">Select Loan</option>
                  {existingLoans.map((loan) => (
                    <option key={loan.transactionId} value={loan.transactionId}>
                      {loan.loanType} - {formatCurrency(loan.loanAmount)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Payment Amount<span style={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  style={styles.formInput}
                  type="number"
                  step="0.01"
                  placeholder="Enter payment amount"
                  value={payment.paymentAmount}
                  onChange={(e) => {
                    updatePaymentTransactionField(payment.id, 'paymentAmount', e.target.value);
                    
                    // Auto-calculate allocation when amount changes
                    const linkedLoan = existingLoans.find(loan => loan.transactionId === payment.loanTransactionId);
                    if (linkedLoan) {
                      const allocation = calculatePaymentAllocation(e.target.value, linkedLoan);
                      updatePaymentTransactionField(payment.id, 'penaltyPaid', allocation.penaltyPaid);
                      updatePaymentTransactionField(payment.id, 'interestPaid', allocation.interestPaid);
                      updatePaymentTransactionField(payment.id, 'principalPaid', allocation.principalPaid);
                      updatePaymentTransactionField(payment.id, 'excessPayment', allocation.excessPayment);
                    }
                  }}
                />
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Payment Date
                </label>
                <input
                  style={styles.formInput}
                  type="date"
                  value={payment.paymentDate}
                  onChange={(e) => updatePaymentTransactionField(payment.id, 'paymentDate', e.target.value)}
                />
              </div>
              
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  Payment Method
                </label>
                <select
                  style={styles.formSelect}
                  value={payment.paymentMethod}
                  onChange={(e) => updatePaymentTransactionField(payment.id, 'paymentMethod', e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="GCash">GCash</option>
                </select>
              </div>
              
              {/* Auto-calculated allocation display */}
              {payment.paymentAmount > 0 && (
                <>
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Interest Paid:</label>
                    <input
                      style={styles.formInput}
                      value={formatCurrency(payment.interestPaid)}
                      readOnly
                    />
                  </div>
                  
                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Principal Paid:</label>
                    <input
                      style={styles.formInput}
                      value={formatCurrency(payment.principalPaid)}
                      readOnly
                    />
                  </div>
                  
                  {payment.excessPayment > 0 && (
                    <div style={styles.formSection}>
                      <label style={styles.formLabel}>Excess Payment:</label>
                      <input
                        style={styles.formInput}
                        value={formatCurrency(payment.excessPayment)}
                        readOnly
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        
        <button
          type="button"
          style={styles.addAnotherLoanButton}
          onClick={addPaymentTransaction}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          Add Payment Transaction
        </button>
      </div>
              </>
            )}
          </div>
        )}
      </div>
      
      <div style={styles.modalActions}>
        <button
          style={{
            ...styles.actionButton,
            ...styles.secondaryButton
          }}
          onClick={closeModals}
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(uploading ? styles.disabledButton : {})
          }}
          onClick={mode === 'add' ? handleSubmitConfirmation : submitEditMember}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
              <span>{mode === 'add' ? 'Migrating...' : 'Updating...'}</span>
            </>
          ) : (
            <>
              <FaCheckCircle />
              <span>{mode === 'add' ? 'Migrate Member' : 'Update Member'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const noMatch = filteredData.length === 0;

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Data Migration</h1>
            <p style={styles.headerSubtitle}>
              Migrate existing member records into the system
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Left side */}
            <div style={styles.tabContainer}>
              <button
                style={{
                  ...styles.tabButton,
                  ...styles.activeTabButton
                }}
                className="hover-lift"
              >
                <FaUser style={styles.tabIcon} />
                <span>Migrated Members</span>
              </button>
            </div>

            {/* Search, Filter, Download - Right side */}
            <div style={styles.searchDownloadContainer}>
              {renderMemberFilter()}
              
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by name, email, or ID..."
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

          {noMatch ? (
            <div style={styles.noDataContainer}>
              <FaSearch style={styles.noDataIcon} />
              <p style={styles.noDataText}>No matches found for your search</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={styles.noDataContainer}>
              <FaUser style={styles.noDataIcon} />
              <p style={styles.noDataText}>No migrated members yet</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '8%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Contact</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Balance</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Investment</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loans</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Date Added</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(m => (
                    <tr key={m.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{m.id}</td>
                      <td style={styles.tableCell}>
                        <div style={{ fontWeight: '500' }}>
                          {m.firstName} {m.lastName}
                        </div>
                      </td>
                      <td style={styles.tableCell}>{m.email}</td>
                      <td style={styles.tableCell}>{m.phoneNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{toPeso(m.balance)}</td>
                      <td style={styles.tableCell}>{toPeso(m.investment)}</td>
                      <td style={styles.tableCell}>{toPeso(m.loans)}</td>
                      <td style={styles.tableCell}>{m.dateAdded || 'N/A'}</td>
                      <td style={styles.tableCell}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => openViewModal(m)}
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

        {/* Add Member Button */}
        <button 
          style={{
            ...styles.addMemberButton,
            ...(isHovered.addMember ? styles.addMemberButtonHover : {})
          }}
          onMouseEnter={() => handleMouseEnter('addMember')}
          onMouseLeave={() => handleMouseLeave('addMember')}
          onClick={openAddModal}
          className="hover-lift"
          title="Migrate New Member"
        >
          <FaPlus />
        </button>

        {/* Add Member Modal */}
        {addModalVisible && renderAddEditModal('add')}

        {/* Edit Member Modal */}
        {editModalVisible && renderAddEditModal('edit')}

        {/* View Member Modal */}
        {viewModalVisible && selectedMember && (
          <div style={styles.modalOverlay} onClick={closeModals}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaUser />
                  Member Details
                </h2>
                <button 
                  onClick={closeModals}
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
                        <span style={styles.fieldValue}>#{selectedMember.id}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>First Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.firstName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Middle Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.middleName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Last Name:</span>
                        <span style={styles.fieldValue}>{selectedMember.lastName || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date of Birth:</span>
                        <span style={styles.fieldValue}>
                          {selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Place of Birth:</span>
                        <span style={styles.fieldValue}>{selectedMember.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Address:</span>
                        <span style={styles.fieldValue}>{selectedMember.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Contact & Financial Information */}
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
                        <span style={styles.fieldValue}>{selectedMember.email || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>
                          <FaPhone />
                          Contact Number:
                        </span>
                        <span style={styles.fieldValue}>{selectedMember.phoneNumber || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Government ID:</span>
                        <span style={styles.fieldValue}>{selectedMember.governmentId || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={styles.financialCard}>
                      <h3 style={styles.sectionTitle}>
                        <FaMoneyBillWave />
                        Financial Information
                      </h3>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Current Balance:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.balance)}</span>
                      </div>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Investment:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.investment)}</span>
                      </div>
                      <div style={styles.financialItem}>
                        <span style={styles.financialLabel}>Loans:</span>
                        <span style={styles.financialValue}>{toPeso(selectedMember.loans)}</span>
                      </div>
                    </div>

                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        <FaCalendarAlt />
                        Account Information
                      </h3>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Date Added:</span>
                        <span style={styles.fieldValue}>{selectedMember.dateAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Time Added:</span>
                        <span style={styles.fieldValue}>{selectedMember.timeAdded || 'N/A'}</span>
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Status:</span>
                        <span style={styles.fieldValue}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(selectedMember.status === 'active' ? styles.statusActive : styles.statusInactive)
                          }}>
                            {selectedMember.status || 'active'}
                          </span>
                        </span>
                      </div>
                      {selectedMember.isMigration && (
                        <div style={styles.fieldGroup}>
                          <span style={styles.fieldLabel}>Migration:</span>
                          <span style={styles.fieldValue}>
                            <span style={{
                              ...styles.statusBadge,
                              background: '#dbeafe',
                              color: '#1e40af'
                            }}>
                              MIGRATED DATA
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton
                  }}
                  onClick={() => {
                    setViewModalVisible(false);
                    openEditModal(selectedMember);
                  }}
                >
                  <FaEdit />
                  Edit Member
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton,
                    ...(isProcessing ? styles.disabledButton : {})
                  }}
                  onClick={() => {
                    setPendingDelete(selectedMember);
                    setConfirmDeleteVisible(true);
                  }}
                  disabled={isProcessing}
                >
                  <FaTrash />
                  Delete Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        {confirmModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmModalVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f59e0b' }} />
              <p style={styles.modalText}>
                Are you sure you want to migrate this member? This will create their account with the provided data and send them login credentials.
              
                {formData.currentSavings && parseFloat(formData.currentSavings) > 0 && (
                  <><br/><strong>Current savings of {toPeso(formData.currentSavings)} will be added to system Savings.</strong></>
                )}
                {formData.hasExistingLoan && formData.loanAmount && (
                  <><br/><strong>Existing loan of {toPeso(formData.loanAmount)} for {formData.loanTerm} months will be created.</strong></>
                )}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryButton
                  }} 
                  onClick={submitAddMember}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Processing...' : 'Yes, Migrate'}
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.secondaryButton
                  }} 
                  onClick={() => setConfirmModalVisible(false)}
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmDeleteVisible(false)}>
            <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
              <p style={styles.modalText}>
                Are you sure you want to delete this member account? This action cannot be undone and will remove all associated data.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton
                  }} 
                  onClick={handleDeleteMember}
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
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#dc2626' }} />
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
      </div>
    </div>
  );
};

export default DataMigration;
