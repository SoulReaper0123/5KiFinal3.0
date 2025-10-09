import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaDownload, FaFilter, FaChevronLeft, FaChevronRight, FaPlus, FaSave, FaTimes, FaCheckCircle, FaUser, FaUserCheck, FaUserTimes, FaEye, FaEdit } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { FiAlertCircle } from 'react-icons/fi';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendMemberCredentialsEmail } from '../../../../Server/api';
import ExcelJS from 'exceljs';

// Options (match Register.jsx)
const genderOptions = [
  { key: 'Male', label: 'Male' },
  { key: 'Female', label: 'Female' }
];

const civilStatusOptions = [
  { key: 'Single', label: 'Single' },
  { key: 'Married', label: 'Married' },
  { key: 'Widowed', label: 'Widowed' },
  { key: 'Separated', label: 'Separated' }
];

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
    overflowY: 'auto'
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
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonHover: {
    backgroundColor: '#f1f5f9',
    color: '#374151'
  },
  modalContent: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
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
  modalActions: {
    padding: '24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  primaryButtonHover: {
    backgroundColor: '#1e3a8a'
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap'
  },
  secondaryButtonHover: {
    backgroundColor: '#4b5563'
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
  // Updated table styles to match Registrations component
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
  }
};

const emptyForm = {
  email: '',
  phoneNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  civilStatus: '',
  age: '',
  dateOfBirth: '',
  placeOfBirth: '',
  address: '',
  governmentId: '',
  registrationFee: '',
  balance: '',
  loans: ''
};

const MembersManagement = () => {
  // Data
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRegistrationFee, setMinRegistrationFee] = useState(5000);

  // Pagination
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);

  // Add/Edit modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Files
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [validIdBackFile, setValidIdBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);

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
  const [pendingAction, setPendingAction] = useState(null);

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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await database.ref('Members').once('value');
      const data = snap.val() || {};
      const list = Object.values(data).sort((a, b) => Number(a.id) - Number(b.id));
      setMembers(list);
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to load members');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const feeSnap = await database.ref('Settings/RegistrationMinimumFee').once('value');
        const val = feeSnap.val();
        const num = parseFloat(val);
        if (!isNaN(num)) setMinRegistrationFee(num);
      } catch (_) {}

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
      link.download = `Members.xlsx`;
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

  const openAddModal = () => {
    setFormData({ ...emptyForm, registrationFee: String(minRegistrationFee) });
    setValidIdFrontFile(null);
    setValidIdBackFile(null);
    setSelfieFile(null);
    setSelfieWithIdFile(null);
    setProofOfPaymentFile(null);
    setAddModalVisible(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      firstName: member.firstName || '',
      middleName: member.middleName || '',
      lastName: member.lastName || '',
      gender: member.gender || '',
      civilStatus: member.civilStatus || '',
      age: member.age || '',
      dateOfBirth: member.dateOfBirth || '',
      placeOfBirth: member.placeOfBirth || '',
      address: member.address || '',
      governmentId: member.governmentId || '',
      registrationFee: String(member.registrationFee ?? minRegistrationFee),
      balance: String(member.balance ?? 0),
      loans: String(member.loans ?? 0)
    });
    setValidIdFrontFile(null);
    setValidIdBackFile(null);
    setSelfieFile(null);
    setSelfieWithIdFile(null);
    setProofOfPaymentFile(null);
    setEditModalVisible(true);
  };

  const closeModals = () => {
    setAddModalVisible(false);
    setEditModalVisible(false);
    setEditingMember(null);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const getNextMemberId = async () => {
    const membersSnap = await database.ref('Members').once('value');
    const membersData = membersSnap.val() || {};
    const existingIds = Object.keys(membersData).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    let newId = 5001;
    for (const id of existingIds) {
      if (id === newId) newId++;
      else if (id > newId) break;
    }
    return newId;
  };

  const validateAddFields = () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phoneNumber || 
        !formData.placeOfBirth || !formData.gender || !formData.dateOfBirth || !formData.address || 
        !formData.age || !formData.civilStatus || !formData.governmentId) {
      setErrorMessage('Please complete all required fields.');
      setErrorModalVisible(true);
      return false;
    }
    if (!validIdFrontFile || !validIdBackFile || !selfieFile || !selfieWithIdFile || !proofOfPaymentFile) {
      setErrorMessage('Please upload all required images/documents.');
      setErrorModalVisible(true);
      return false;
    }
    const amt = parseFloat(formData.registrationFee);
    if (isNaN(amt) || amt < parseFloat(minRegistrationFee)) {
      setErrorMessage(`Minimum registration fee is ₱${minRegistrationFee.toFixed(2)}`);
      setErrorModalVisible(true);
      return false;
    }
    return true;
  };

  const handleSubmitConfirmation = () => {
    if (!validateAddFields()) return;
    setPendingAction('add');
    setConfirmModalVisible(true);
  };

  const submitAddMember = async () => {
    setConfirmModalVisible(false);
    setUploading(true);

    try {
      const password = generateRandomPassword();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
      const userId = userCredential.user.uid;

      const newId = await getNextMemberId();

      const now = new Date();
      const dateAdded = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeAdded = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // Upload images
      const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newId}/valid_id_front_${Date.now()}`);
      const validIdBackUrl = await uploadImageToStorage(validIdBackFile, `member_docs/${newId}/valid_id_back_${Date.now()}`);
      const selfieUrl = await uploadImageToStorage(selfieFile, `member_docs/${newId}/selfie_${Date.now()}`);
      const selfieWithIdUrl = await uploadImageToStorage(selfieWithIdFile, `member_docs/${newId}/selfie_with_id_${Date.now()}`);
      const proofOfPaymentUrl = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${newId}/registration_payment_proof_${Date.now()}`);

      const memberData = {
        id: newId,
        authUid: userId,
        email: formData.email,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        civilStatus: formData.civilStatus,
        age: formData.age,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        address: formData.address,
        governmentId: formData.governmentId,
        dateAdded,
        timeAdded,
        status: 'active',
        balance: 0.0,
        loans: 0.0,
        validIdFront: validIdFrontUrl,
        validIdBack: validIdBackUrl,
        selfie: selfieUrl,
        selfieWithId: selfieWithIdUrl,
        registrationFee: parseFloat(formData.registrationFee || minRegistrationFee),
        registrationPaymentProof: proofOfPaymentUrl
      };

      await database.ref(`Members/${newId}`).set(memberData);

      await sendMemberCredentialsEmail({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        password,
        memberId: memberData.id,
        dateAdded: memberData.dateAdded
      });

      setSuccessMessage('Member added successfully!');
      setSuccessModalVisible(true);
      closeModals();
      await fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorMessage(error.message || 'Failed to add member');
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
        gender: formData.gender || '',
        civilStatus: formData.civilStatus || '',
        age: formData.age || '',
        dateOfBirth: formData.dateOfBirth || '',
        placeOfBirth: formData.placeOfBirth || '',
        address: formData.address || '',
        governmentId: formData.governmentId || '',
        registrationFee: parseFloat(formData.registrationFee || editingMember.registrationFee || 0),
        balance: parseFloat(formData.balance || editingMember.balance || 0),
        loans: parseFloat(formData.loans || editingMember.loans || 0)
      };

      if (validIdFrontFile) updates.validIdFront = await uploadImageToStorage(validIdFrontFile, `member_docs/${id}/valid_id_front_${Date.now()}`);
      if (validIdBackFile) updates.validIdBack = await uploadImageToStorage(validIdBackFile, `member_docs/${id}/valid_id_back_${Date.now()}`);
      if (selfieFile) updates.selfie = await uploadImageToStorage(selfieFile, `member_docs/${id}/selfie_${Date.now()}`);
      if (selfieWithIdFile) updates.selfieWithId = await uploadImageToStorage(selfieWithIdFile, `member_docs/${id}/selfie_with_id_${Date.now()}`);
      if (proofOfPaymentFile) updates.registrationPaymentProof = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${id}/registration_payment_proof_${Date.now()}`);

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

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
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

  const renderModal = (mode) => (
    <div style={styles.modalOverlay} onClick={closeModals}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{mode === 'add' ? 'Register New Member' : `Edit Member #${editingMember?.id}`}</h2>
          <button 
            onClick={closeModals}
            style={{
              ...styles.closeButton,
              ...(isHovered.closeModal ? styles.closeButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('closeModal')}
            onMouseLeave={() => handleMouseLeave('closeModal')}
          >
            <AiOutlineClose />
          </button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.formGrid}>
            {/* Left Column */}
            <div>
              {mode === 'add' ? (
                <>
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
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Phone Number<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Enter phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      type="tel"
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Gender<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      style={styles.formSelect}
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      {genderOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Valid ID Front<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div 
                      style={{
                        ...styles.fileUploadSection,
                        ...(isHovered.validIdFront ? styles.fileUploadSectionHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('validIdFront')}
                      onMouseLeave={() => handleMouseLeave('validIdFront')}
                      onClick={() => document.getElementById('validIdFront').click()}
                    >
                      <input
                        id="validIdFront"
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
                </>
              ) : (
                <>
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
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Email</label>
                    <input
                      disabled
                      style={styles.formInput}
                      value={formData.email}
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Phone Number
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Enter phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      type="tel"
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Gender
                    </label>
                    <select
                      style={styles.formSelect}
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      {genderOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Replace Valid ID Front</label>
                    <div 
                      style={{
                        ...styles.fileUploadSection,
                        ...(isHovered.validIdFront ? styles.fileUploadSectionHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('validIdFront')}
                      onMouseLeave={() => handleMouseLeave('validIdFront')}
                      onClick={() => document.getElementById('validIdFront').click()}
                    >
                      <input
                        id="validIdFront"
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
                </>
              )}
            </div>

            {/* Right Column */}
            <div>
              {mode === 'add' ? (
                <>
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
                      Civil Status<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      style={styles.formSelect}
                      value={formData.civilStatus}
                      onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                    >
                      <option value="">Select Civil Status</option>
                      {civilStatusOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                    <label style={styles.formLabel}>
                      Registration Fee<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder={`Minimum ${toPeso(minRegistrationFee)}`}
                      value={formData.registrationFee}
                      onChange={(e) => handleInputChange('registrationFee', e.target.value)}
                      type="number"
                      min={minRegistrationFee}
                      step="0.01"
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>
                      Valid ID Back<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div 
                      style={{
                        ...styles.fileUploadSection,
                        ...(isHovered.validIdBack ? styles.fileUploadSectionHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('validIdBack')}
                      onMouseLeave={() => handleMouseLeave('validIdBack')}
                      onClick={() => document.getElementById('validIdBack').click()}
                    >
                      <input
                        id="validIdBack"
                        style={styles.fileInput}
                        type="file"
                        onChange={(e) => handleFileChange(e, setValidIdBackFile)}
                        accept="image/*"
                      />
                      <p style={styles.fileUploadText}>
                        {validIdBackFile ? 'Change file' : 'Click to upload'}
                      </p>
                      {validIdBackFile && (
                        <p style={styles.fileName}>{validIdBackFile.name}</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                    <label style={styles.formLabel}>Civil Status</label>
                    <select
                      style={styles.formSelect}
                      value={formData.civilStatus}
                      onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                    >
                      <option value="">Select Civil Status</option>
                      {civilStatusOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Government ID</label>
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
                    <label style={styles.formLabel}>Registration Fee</label>
                    <input
                      style={styles.formInput}
                      type="number"
                      step="0.01"
                      value={formData.registrationFee}
                      onChange={(e) => handleInputChange('registrationFee', e.target.value)}
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Balance</label>
                    <input
                      style={styles.formInput}
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => handleInputChange('balance', e.target.value)}
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Loans</label>
                    <input
                      style={styles.formInput}
                      type="number"
                      step="0.01"
                      value={formData.loans}
                      onChange={(e) => handleInputChange('loans', e.target.value)}
                    />
                  </div>

                  <div style={styles.formSection}>
                    <label style={styles.formLabel}>Replace Valid ID Back</label>
                    <div 
                      style={{
                        ...styles.fileUploadSection,
                        ...(isHovered.validIdBack ? styles.fileUploadSectionHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('validIdBack')}
                      onMouseLeave={() => handleMouseLeave('validIdBack')}
                      onClick={() => document.getElementById('validIdBack').click()}
                    >
                      <input
                        id="validIdBack"
                        style={styles.fileInput}
                        type="file"
                        onChange={(e) => handleFileChange(e, setValidIdBackFile)}
                        accept="image/*"
                      />
                      <p style={styles.fileUploadText}>
                        {validIdBackFile ? 'Change file' : 'Click to upload'}
                      </p>
                      {validIdBackFile && (
                        <p style={styles.fileName}>{validIdBackFile.name}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Required Fields for Add */}
          {mode === 'add' && (
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
                    Age<span style={styles.requiredAsterisk}>*</span>
                  </label>
                  <input
                    style={styles.formInput}
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    type="number"
                  />
                </div>

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
          )}

          {/* Additional Required Fields for Edit */}
          {mode === 'edit' && (
            <div style={styles.formGrid}>
              <div>
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>Date of Birth</label>
                  <input
                    style={styles.formInput}
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    type="date"
                  />
                </div>

                <div style={styles.formSection}>
                  <label style={styles.formLabel}>Place of Birth</label>
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
                  <label style={styles.formLabel}>Age</label>
                  <input
                    style={styles.formInput}
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    type="number"
                  />
                </div>

                <div style={styles.formSection}>
                  <label style={styles.formLabel}>Address</label>
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
          )}

          {/* Additional File Uploads */}
          <div style={styles.formGrid}>
            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  {mode === 'add' ? 'Selfie Photo' : 'Replace Selfie'}<span style={mode === 'add' ? styles.requiredAsterisk : {}}>{mode === 'add' ? '*' : ''}</span>
                </label>
                <div 
                  style={{
                    ...styles.fileUploadSection,
                    ...(isHovered.selfie ? styles.fileUploadSectionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('selfie')}
                  onMouseLeave={() => handleMouseLeave('selfie')}
                  onClick={() => document.getElementById('selfie').click()}
                >
                  <input
                    id="selfie"
                    style={styles.fileInput}
                    type="file"
                    onChange={(e) => handleFileChange(e, setSelfieFile)}
                    accept="image/*"
                  />
                  <p style={styles.fileUploadText}>
                    {selfieFile ? 'Change file' : `Click to upload ${mode === 'add' ? 'selfie' : 'replace selfie'}`}
                  </p>
                  {selfieFile && (
                    <p style={styles.fileName}>{selfieFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div style={styles.formSection}>
                <label style={styles.formLabel}>
                  {mode === 'add' ? 'Selfie with ID' : 'Replace Selfie with ID'}<span style={mode === 'add' ? styles.requiredAsterisk : {}}>{mode === 'add' ? '*' : ''}</span>
                </label>
                <div 
                  style={{
                    ...styles.fileUploadSection,
                    ...(isHovered.selfieWithId ? styles.fileUploadSectionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('selfieWithId')}
                  onMouseLeave={() => handleMouseLeave('selfieWithId')}
                  onClick={() => document.getElementById('selfieWithId').click()}
                >
                  <input
                    id="selfieWithId"
                    style={styles.fileInput}
                    type="file"
                    onChange={(e) => handleFileChange(e, setSelfieWithIdFile)}
                    accept="image/*"
                  />
                  <p style={styles.fileUploadText}>
                    {selfieWithIdFile ? 'Change file' : `Click to upload ${mode === 'add' ? 'selfie with ID' : 'replace selfie with ID'}`}
                  </p>
                  {selfieWithIdFile && (
                    <p style={styles.fileName}>{selfieWithIdFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Payment */}
          {mode === 'add' && (
            <div style={styles.formSection}>
              <label style={styles.formLabel}>
                Proof of Payment<span style={styles.requiredAsterisk}>*</span>
              </label>
              <div 
                style={{
                  ...styles.fileUploadSection,
                  ...(isHovered.proofOfPayment ? styles.fileUploadSectionHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('proofOfPayment')}
                onMouseLeave={() => handleMouseLeave('proofOfPayment')}
                onClick={() => document.getElementById('proofOfPayment').click()}
              >
                <input
                  id="proofOfPayment"
                  style={styles.fileInput}
                  type="file"
                  onChange={(e) => handleFileChange(e, setProofOfPaymentFile)}
                  accept="image/*,application/pdf"
                />
                <p style={styles.fileUploadText}>
                  {proofOfPaymentFile ? 'Change file' : 'Click to upload proof of payment'}
                </p>
                {proofOfPaymentFile && (
                  <p style={styles.fileName}>{proofOfPaymentFile.name}</p>
                )}
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <div style={styles.formSection}>
              <label style={styles.formLabel}>Replace Proof of Payment</label>
              <div 
                style={{
                  ...styles.fileUploadSection,
                  ...(isHovered.proofOfPayment ? styles.fileUploadSectionHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('proofOfPayment')}
                onMouseLeave={() => handleMouseLeave('proofOfPayment')}
                onClick={() => document.getElementById('proofOfPayment').click()}
              >
                <input
                  id="proofOfPayment"
                  style={styles.fileInput}
                  type="file"
                  onChange={(e) => handleFileChange(e, setProofOfPaymentFile)}
                  accept="image/*,application/pdf"
                />
                <p style={styles.fileUploadText}>
                  {proofOfPaymentFile ? 'Change file' : 'Click to upload replacement proof of payment'}
                </p>
                {proofOfPaymentFile && (
                  <p style={styles.fileName}>{proofOfPaymentFile.name}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.modalActions}>
          <button
            style={{
              ...styles.secondaryButton,
              ...(isHovered.cancelButton ? styles.secondaryButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('cancelButton')}
            onMouseLeave={() => handleMouseLeave('cancelButton')}
            onClick={closeModals}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.primaryButton,
              ...(isHovered.submitButton ? styles.primaryButtonHover : {})
            }}
            onMouseEnter={() => handleMouseEnter('submitButton')}
            onMouseLeave={() => handleMouseLeave('submitButton')}
            onClick={mode === 'add' ? handleSubmitConfirmation : submitEditMember}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div style={{...styles.spinner, width: '16px', height: '16px', borderWidth: '2px'}}></div>
                <span>{mode === 'add' ? 'Adding Member...' : 'Updating Member...'}</span>
              </>
            ) : (
              <>
                <FaCheckCircle />
                <span>{mode === 'add' ? 'Add Member' : 'Update Member'}</span>
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
            <h1 style={styles.headerText}>Members Management</h1>
            <p style={styles.headerSubtitle}>
              Manage all member accounts, balances, and information in one place
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
                <span>All Members</span>
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
              <p style={styles.noDataText}>No members available</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Contact</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Balance</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Loans</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Date Added</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Status</th>
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
                      <td style={styles.tableCell}>{m.phoneNumber || m.contactNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{toPeso(m.balance)}</td>
                      <td style={styles.tableCell}>{toPeso(m.loans)}</td>
                      <td style={styles.tableCell}>{m.dateAdded || m.dateApproved || 'N/A'}</td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(m.status === 'active' ? styles.statusActive : styles.statusInactive)
                        }}>
                          {m.status || 'active'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => openEditModal(m)}
                        >
                          <FaEdit />
                          Edit
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
        >
          <FaPlus />
        </button>

        {/* Add Member Modal */}
        {addModalVisible && renderModal('add')}

        {/* Edit Member Modal */}
        {editModalVisible && renderModal('edit')}

        {/* Confirmation Modal */}
        {confirmModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setConfirmModalVisible(false)}>
            <div style={{...styles.modalCard, maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Confirm Registration</h2>
              </div>
              <div style={{padding: '24px', textAlign: 'center'}}>
                <FiAlertCircle style={{fontSize: '48px', color: '#f59e0b', marginBottom: '16px'}} />
                <p style={{margin: '0 0 24px 0', color: '#64748b'}}>
                  Are you sure you want to register this new member? This action cannot be undone.
                </p>
              </div>
              <div style={styles.modalActions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setConfirmModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  style={styles.primaryButton}
                  onClick={submitAddMember}
                >
                  Confirm Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModalVisible && (
          <div style={styles.modalOverlay} onClick={handleSuccessOk}>
            <div style={{...styles.modalCard, maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
              <div style={{padding: '24px', textAlign: 'center'}}>
                <FaCheckCircle style={{fontSize: '48px', color: '#059669', marginBottom: '16px'}} />
                <h2 style={{...styles.modalTitle, marginBottom: '12px'}}>Success!</h2>
                <p style={{margin: '0 0 24px 0', color: '#64748b'}}>
                  {successMessage}
                </p>
                <button
                  style={styles.primaryButton}
                  onClick={handleSuccessOk}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setErrorModalVisible(false)}>
            <div style={{...styles.modalCard, maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
              <div style={{padding: '24px', textAlign: 'center'}}>
                <FiAlertCircle style={{fontSize: '48px', color: '#dc2626', marginBottom: '16px'}} />
                <h2 style={{...styles.modalTitle, marginBottom: '12px'}}>Error</h2>
                <p style={{margin: '0 0 24px 0', color: '#64748b'}}>
                  {errorMessage}
                </p>
                <button
                  style={styles.primaryButton}
                  onClick={() => setErrorModalVisible(false)}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersManagement;