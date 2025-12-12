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
  FaReceipt  ,
  FaExchangeAlt,
  FaDatabase,
  FaClock
} from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { FiAlertCircle } from 'react-icons/fi';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,  
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider  } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  sendMemberCredentialsEmail, 
  sendMemberDeleteData,
  sendAdminCredentialsEmail,    
  sendCoAdminCredentialsEmail  
} from '../../../../Server/api';
import ExcelJS from 'exceljs';

// Options
const governmentIdOptions = [
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Drivers License' },
  { key: 'other', label: 'Others' } 
];

// Function to update email in Firebase Auth
const updateFirebaseEmail = async (currentEmail, newEmail, password) => {
  try {
    const user = auth.currentUser;
    
    // If no user is logged in (shouldn't happen in admin context), throw error
    if (!user) {
      throw new Error('No user logged in');
    }
    
    // First, reauthenticate with current credentials
    // For admin context, we need to sign in with the user's current credentials
    const credential = EmailAuthProvider.credential(currentEmail, password);
    await reauthenticateWithCredential(user, credential);
    
    // Then update the email
    await updateEmail(user, newEmail);
    
    return true;
  } catch (error) {
    console.error('Error updating Firebase email:', error);
    throw new Error('Failed to update email in authentication system: ' + error.message);
  }
};

// Add this helper function for generating 6-digit IDs
const generateSixDigitId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

const createMigrationTransaction = async (memberId, memberData, loansArray, paymentsArray) => {
  try {
    const now = new Date();
    // ONLY 6 DIGITS, NO PREFIX
    const transactionId = generateSixDigitId();
    
    const transactionRecord = {
      transactionId, // 6-digit number only
      type: 'migration',
      amount: parseFloat(memberData.balance) || 0,
      investment: parseFloat(memberData.investment) || 0,
      savings: parseFloat(memberData.currentSavings) || 0,
      dateAdded: memberData.dateAdded,
      timeAdded: formatTime(now),
      dateApproved: formatDate(now),
      approvedTime: formatTime(now),
      timestamp: now.getTime(),
      status: 'approved',
      memberId: parseInt(memberId),
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      description: 'Member data migration',
      totalLoans: loansArray.length, 
      totalPayments: paymentsArray.length, 
      isMigration: true
    };
    
    await database.ref(`Transactions/Registrations/${memberId}/${transactionId}`).set(transactionRecord);
    await database.ref(`Transactions/Migrations/${memberId}/${transactionId}`).set(transactionRecord);
    
  } catch (error) {
    console.error('Error creating migration transaction:', error);
    throw error;
  }
};

// Update createMemberRegistrationTransaction function
const createMemberRegistrationTransaction = async (memberId, memberData) => {
  try {
    const now = new Date();
    // ONLY 6 DIGITS, NO PREFIX
    const transactionId = generateSixDigitId();
    
    const registrationRecord = {
      transactionId, // 6-digit number only
      type: 'registration',
      amount: parseFloat(memberData.balance) || 0,
      investment: parseFloat(memberData.investment) || 0,
      savings: parseFloat(memberData.currentSavings) || 0,
      memberId: parseInt(memberId),
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      dateApproved: formatDate(now),
      approvedTime: formatTime(now),
      timestamp: now.getTime(),
      status: 'approved',
      description: 'Member registration migration',
      isMigration: true
    };
    
    await database.ref(`Transactions/Registrations/${memberId}/${transactionId}`).set(registrationRecord);
    
    return registrationRecord;
    
  } catch (error) {
    console.error('Error creating registration transaction:', error);
    throw error;
  }
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
  },
  loansViewSection: {
  marginTop: '24px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'hidden'
},
loansViewHeader: {
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  padding: '16px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
},
loansViewTitle: {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e3a8a',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
},
loansTable: {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
},
loansTableHeader: {
  backgroundColor: '#f1f5f9',
  borderBottom: '2px solid #e2e8f0'
},
loansTableCell: {
  padding: '12px 8px',
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'left'
},
loansTableRow: {
  '&:hover': {
    backgroundColor: '#f8fafc'
  }
},
emptyState: {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#64748b'
},
emptyIcon: {
  fontSize: '32px',
  marginBottom: '12px',
  color: '#d1d5db'
},
summaryCard: {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px'
},
summaryItem: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #e2e8f0'
},
summaryLabel: {
  fontSize: '14px',
  color: '#64748b',
  fontWeight: '500'
},
summaryValue: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af'
}
};

// Add role options constant near other options (around line 150)
const roleOptions = [
  { key: 'member', label: 'Member' },
  { key: 'admin', label: 'Administrator' },
  { key: 'coadmin', label: 'Co-Admin' }
];

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
  loanTerm: '',
 userRole: 'member'
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

// Add these with your other state declarations
const [isOtherGovernmentId, setIsOtherGovernmentId] = useState(false);
const [otherGovernmentId, setOtherGovernmentId] = useState('');

const [emailChangeModalVisible, setEmailChangeModalVisible] = useState(false);
const [emailChangeInfo, setEmailChangeInfo] = useState(null);

const [loanCalculations, setLoanCalculations] = useState({});

// Add these with your other state declarations
const [viewMemberLoans, setViewMemberLoans] = useState([]);
const [viewMemberPayments, setViewMemberPayments] = useState([]);
const [viewLoading, setViewLoading] = useState(false);

// Add these to your state declarations
const [idChangeInfo, setIdChangeInfo] = useState(null);
const [idChangeModalVisible, setIdChangeModalVisible] = useState(false);
const [updatingInProgress, setUpdatingInProgress] = useState(false);
const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0, message: '' });

// Add with your other state declarations
const [emailChangeLoading, setEmailChangeLoading] = useState(false);
const [idChangeLoading, setIdChangeLoading] = useState(false);
// Function to check if ID change affects any records
const checkIdChangeImpact = async (memberId, newId) => {
  try {
    const impact = {
      loans: 0,
      payments: 0,
      transactions: 0,
      hasImpact: false
    };
    
    // Check loans
    const loanCollections = ['CurrentLoans', 'ApprovedLoans', 'PaidLoans'];
    for (const collection of loanCollections) {
      const loansRef = database.ref(`Loans/${collection}/${memberId}`);
      const snapshot = await loansRef.once('value');
      if (snapshot.exists()) {
        impact.loans += Object.keys(snapshot.val()).length;
      }
    }
    
    // Check payments
    const paymentCollections = ['ApprovedPayments', 'PendingPayments'];
    for (const collection of paymentCollections) {
      const paymentsRef = database.ref(`Payments/${collection}/${memberId}`);
      const snapshot = await paymentsRef.once('value');
      if (snapshot.exists()) {
        impact.payments += Object.keys(snapshot.val()).length;
      }
    }
    
    // Check transactions
    const transactionTypes = ['Loans', 'Payments', 'Registrations', 'Migrations'];
    for (const type of transactionTypes) {
      const transactionsRef = database.ref(`Transactions/${type}/${memberId}`);
      const snapshot = await transactionsRef.once('value');
      if (snapshot.exists()) {
        impact.transactions += Object.keys(snapshot.val()).length;
      }
    }
    
    impact.hasImpact = (impact.loans + impact.payments + impact.transactions) > 0;
    return impact;
    
  } catch (error) {
    console.error('Error checking ID change impact:', error);
    throw error;
  }
};

// Function to move data from old ID to new ID
const moveMemberData = async (oldId, newId, memberData) => {
  try {
    setUpdatingInProgress(true);
    const totalSteps = 7;
    let currentStep = 0;
    
    // Step 1: Create new member record
    setUpdateProgress({ current: ++currentStep, total: totalSteps, message: 'Creating new member record...' });
    await database.ref(`Members/${newId}`).set(memberData);
    
    // Step 2: Move loans
    const loanCollections = ['CurrentLoans', 'ApprovedLoans', 'PaidLoans', 'RejectedLoans'];
    for (const collection of loanCollections) {
      setUpdateProgress({ current: ++currentStep, total: totalSteps, message: `Moving ${collection}...` });
      
      const oldLoansRef = database.ref(`Loans/${collection}/${oldId}`);
      const snapshot = await oldLoansRef.once('value');
      
      if (snapshot.exists()) {
        const loansData = snapshot.val();
        
        // Copy to new location
        await database.ref(`Loans/${collection}/${newId}`).set(loansData);
        
        // Update ID in each loan record
        const updates = {};
        Object.keys(loansData).forEach(loanId => {
          updates[`${loanId}/id`] = parseInt(newId);
          updates[`${loanId}/memberId`] = parseInt(newId);
        });
        
        if (Object.keys(updates).length > 0) {
          await database.ref(`Loans/${collection}/${newId}`).update(updates);
        }
        
        // Remove from old location
        await oldLoansRef.remove();
      }
    }
    
    // Step 3: Move payments
    const paymentCollections = ['ApprovedPayments', 'PendingPayments', 'RejectedPayments'];
    for (const collection of paymentCollections) {
      setUpdateProgress({ current: ++currentStep, total: totalSteps, message: `Moving ${collection}...` });
      
      const oldPaymentsRef = database.ref(`Payments/${collection}/${oldId}`);
      const snapshot = await oldPaymentsRef.once('value');
      
      if (snapshot.exists()) {
        const paymentsData = snapshot.val();
        
        // Copy to new location
        await database.ref(`Payments/${collection}/${newId}`).set(paymentsData);
        
        // Update ID in each payment record
        const updates = {};
        Object.keys(paymentsData).forEach(paymentId => {
          updates[`${paymentId}/id`] = parseInt(newId);
          updates[`${paymentId}/memberId`] = parseInt(newId);
        });
        
        if (Object.keys(updates).length > 0) {
          await database.ref(`Payments/${collection}/${newId}`).update(updates);
        }
        
        // Remove from old location
        await oldPaymentsRef.remove();
      }
    }
    
    // Step 4: Move transactions
    const transactionTypes = ['Loans', 'Payments', 'Registrations', 'Migrations', 'Withdrawals', 'Deposits'];
    for (const type of transactionTypes) {
      setUpdateProgress({ current: ++currentStep, total: totalSteps, message: `Moving ${type} transactions...` });
      
      const oldTransactionsRef = database.ref(`Transactions/${type}/${oldId}`);
      const snapshot = await oldTransactionsRef.once('value');
      
      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        
        // Copy to new location
        await database.ref(`Transactions/${type}/${newId}`).set(transactionsData);
        
        // Update ID in each transaction
        const updates = {};
        Object.keys(transactionsData).forEach(transactionId => {
          updates[`${transactionId}/memberId`] = parseInt(newId);
        });
        
        if (Object.keys(updates).length > 0) {
          await database.ref(`Transactions/${type}/${newId}`).update(updates);
        }
        
        // Remove from old location
        await oldTransactionsRef.remove();
      }
    }
    
    // Step 5: Update role collections if applicable
 setUpdateProgress({ current: ++currentStep, total: totalSteps, message: 'Updating role collections...' });
const role = memberData.role || 'member';

if (role === 'admin') {
  const adminRef = database.ref(`Users/Admin/${oldId}`);
  const adminSnapshot = await adminRef.once('value');
  if (adminSnapshot.exists()) {
    const adminData = adminSnapshot.val();
    adminData.id = parseInt(newId);
    // Also update UID if it was changed during email update
    if (memberData.authUid) {
      adminData.uid = memberData.authUid;
    }
    if (memberData.email) {
      adminData.email = memberData.email;
    }
    await database.ref(`Users/Admin/${newId}`).set(adminData);
    await adminRef.remove();
  }
} else if (role === 'coadmin') {
  const coadminRef = database.ref(`Users/CoAdmin/${oldId}`);
  const coadminSnapshot = await coadminRef.once('value');
  if (coadminSnapshot.exists()) {
    const coadminData = coadminSnapshot.val();
    coadminData.id = parseInt(newId);
    // Also update UID if it was changed during email update
    if (memberData.authUid) {
      coadminData.uid = memberData.authUid;
    }
    if (memberData.email) {
      coadminData.email = memberData.email;
    }
    await database.ref(`Users/CoAdmin/${newId}`).set(coadminData);
    await coadminRef.remove();
  }
}
    
    // Step 6: Remove old member record
    setUpdateProgress({ current: ++currentStep, total: totalSteps, message: 'Removing old records...' });
    await database.ref(`Members/${oldId}`).remove();
    
    // Step 7: Update local state
    setUpdateProgress({ current: ++currentStep, total: totalSteps, message: 'Finalizing...' });
    
    return { success: true, newId: parseInt(newId) };
    
  } catch (error) {
    console.error('Error moving member data:', error);
    throw error;
  } finally {
    setUpdatingInProgress(false);
    setUpdateProgress({ current: 0, total: 0, message: '' });
  }
};

// UPDATED: Function to validate member ID
const validateMemberId = (newId, oldId) => {
  // Allow empty input for editing
  if (newId.trim() === '') {
    return { valid: false, error: 'Member ID is required' };
  }
  
  // Parse the ID
  const idNum = parseInt(newId);
  
  // Check if it's a valid number
  if (isNaN(idNum)) {
    return { valid: false, error: 'Member ID must be a number' };
  }
  
  // Check if it meets minimum requirement
  if (idNum < 5001) {
    return { valid: false, error: 'Member ID must be a number starting from 5001' };
  }
  
  // Check if new ID already exists (excluding current member)
  const idExists = members.some(member => 
    member.id === idNum && member.id !== parseInt(oldId)
  );
  
  if (idExists) {
    return { valid: false, error: `Member ID ${idNum} is already taken` };
  }
  
  return { valid: true, error: '' };
};

// UPDATED: Empty loan template with due date
const emptyLoan = {
  id: Date.now().toString(),
  loanType: '',
  loanAmount: '',
  term: '',
  outstandingBalance: '',
  monthsRemaining: '',
  paymentsMade: 0,
  status: 'approved',
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
  transactionId: '', // Will be generated when saved
  dueDate: '' // Add due date field
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
    
    // Get processing fee - IMPORTANT: This is what we need
    const processingFeeValue = settings.ProcessingFee || 0;
    
    setLoanTypeOptions(types);
    setInterestRatesByType(loanTypes);
    setProcessingFee(parseFloat(processingFeeValue)); // Set the processing fee
    
    return { loanTypes, processingFee: processingFeeValue };
  } catch (error) {
    console.error('Error fetching loan settings:', error);
    // Set default values
    setLoanTypeOptions([
      { key: 'Regular Loan', label: 'Regular Loan' },
      { key: 'Quick Cash', label: 'Quick Cash' }
    ]);
    setProcessingFee(0); // Default to 0 if error
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
    status: 'approved',
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

// Update loan field with proper due date formatting
const updateLoanField = (loanId, field, value) => {
  setExistingLoans(prev => prev.map(loan => {
    if (loan.id === loanId) {
      const updatedLoan = { ...loan, [field]: value };
      
      // Auto-calculate when relevant fields change
      if (field === 'loanType') {
        // Reset term when loan type changes
        updatedLoan.term = '';
        updatedLoan.interestRate = 0;
        updatedLoan.interestRateDecimal = 0;
        
        // Update available terms for this loan type
        const termsForType = interestRatesByType[value] || {};
        const terms = Object.keys(termsForType)
          .sort((a, b) => Number(a) - Number(b))
          .map(term => ({
            key: term,
            label: `${term} ${term === '1' ? 'Month' : 'Months'}`,
            interestRate: (Number(termsForType[term]) || 0)
          }));
        
        setAvailableTerms(terms);
      }
      
      // Calculate interest rate when term is selected
      if (field === 'term' && updatedLoan.loanType) {
        const termsForType = interestRatesByType[updatedLoan.loanType] || {};
        updatedLoan.interestRate = Number(termsForType[value]) || 0;
        updatedLoan.interestRateDecimal = updatedLoan.interestRate / 100;
      }
      
      // Calculate months remaining when term or payments made changes
      if (field === 'term' || field === 'paymentsMade') {
        const term = parseInt(updatedLoan.term) || 0;
        const paymentsMade = parseInt(updatedLoan.paymentsMade) || 0;
        updatedLoan.monthsRemaining = Math.max(0, term - paymentsMade);
        
        // Also update due date
        if (updatedLoan.dateApproved) {
          const approvalDate = new Date(updatedLoan.dateApproved);
          const dueDate = new Date(approvalDate);
          dueDate.setMonth(dueDate.getMonth() + paymentsMade + 1);
          updatedLoan.dueDate = formatDate(dueDate);
        }
      }
      
      // Calculate due date when dateApproved changes
      if (field === 'dateApproved') {
        const approvalDate = new Date(value || new Date());
        const paymentsMade = parseInt(updatedLoan.paymentsMade) || 0;
        const termMonths = parseInt(updatedLoan.term) || 0;
        const remainingMonths = Math.max(0, termMonths - paymentsMade);
        
        if (remainingMonths > 0) {
          const dueDate = new Date(approvalDate);
          dueDate.setMonth(dueDate.getMonth() + paymentsMade + 1);
          updatedLoan.dueDate = formatDate(dueDate); // Use formatDate() for consistency
        } else if (parseFloat(updatedLoan.outstandingBalance) <= 0) {
          updatedLoan.dueDate = 'Paid';
        } else {
          updatedLoan.dueDate = '';
        }
      }
      
      // Perform full calculation when loan amount, term, or interest rate changes
      if (['loanAmount', 'term', 'interestRate'].includes(field)) {
        const loanAmount = parseFloat(updatedLoan.loanAmount) || 0;
        const termMonths = parseInt(updatedLoan.term) || 0;
        const interestRate = parseFloat(updatedLoan.interestRate) || 0;
        const interestRateDecimal = interestRate / 100;
        const paymentsMade = parseInt(updatedLoan.paymentsMade) || 0;
        const outstandingBalance = parseFloat(updatedLoan.outstandingBalance) || 0;
        
        if (loanAmount > 0 && termMonths > 0 && interestRate > 0) {
          // Calculate like web approval
          const interestPerTerm = Math.round(loanAmount * interestRateDecimal * 100) / 100;
          const totalInterest = Math.round(interestPerTerm * termMonths * 100) / 100;
          const totalTermPayment = Math.round((loanAmount + totalInterest) * 100) / 100;
          const totalMonthlyPayment = Math.round(totalTermPayment / termMonths * 100) / 100;
          const monthlyPrincipal = Math.round(loanAmount / termMonths * 100) / 100;
          const releaseAmount = Math.max(0, Math.round((loanAmount - processingFee) * 100) / 100);
          
          // Calculate amount paid based on outstanding balance
          const amountPaid = Math.max(0, totalTermPayment - outstandingBalance);
          
          // Calculate interest paid so far (based on payments made)
          const interestPaidSoFar = Math.min(
            totalInterest, 
            Math.round(paymentsMade * interestPerTerm * 100) / 100
          );
          
          // Calculate principal paid so far
          const principalPaidSoFar = Math.max(0, amountPaid - interestPaidSoFar);
          
          // Calculate months remaining
          const monthsRemaining = Math.max(0, termMonths - paymentsMade);
          
          // Update all calculated fields
          updatedLoan.interestPerTerm = interestPerTerm;
          updatedLoan.totalInterest = totalInterest;
          updatedLoan.totalTermPayment = totalTermPayment;
          updatedLoan.totalMonthlyPayment = totalMonthlyPayment;
          updatedLoan.monthlyPrincipal = monthlyPrincipal;
          updatedLoan.monthlyPayment = monthlyPrincipal; // Fixed: equals monthlyPrincipal (not including interest)
          updatedLoan.processingFee = Math.round(processingFee * 100) / 100;
          updatedLoan.releaseAmount = releaseAmount;
          updatedLoan.amountPaid = amountPaid;
          updatedLoan.interestPaid = interestPaidSoFar;
          updatedLoan.principalPaid = principalPaidSoFar;
          updatedLoan.monthsRemaining = monthsRemaining;
          
          // Auto-calculate due date if we have dateApproved
          if (updatedLoan.dateApproved && monthsRemaining > 0) {
            const approvalDate = new Date(updatedLoan.dateApproved);
            const dueDate = new Date(approvalDate);
            dueDate.setMonth(dueDate.getMonth() + paymentsMade + 1);
            updatedLoan.dueDate = formatDate(dueDate);
          }
        }
      }
      
      // When outstanding balance changes, recalculate amount paid and principal paid
      if (field === 'outstandingBalance') {
        const loanAmount = parseFloat(updatedLoan.loanAmount) || 0;
        const termMonths = parseInt(updatedLoan.term) || 0;
        const interestRate = parseFloat(updatedLoan.interestRate) || 0;
        const interestRateDecimal = interestRate / 100;
        const paymentsMade = parseInt(updatedLoan.paymentsMade) || 0;
        const outstandingBalance = parseFloat(value) || 0;
        
        if (loanAmount > 0 && termMonths > 0 && interestRate > 0) {
          const interestPerTerm = Math.round(loanAmount * interestRateDecimal * 100) / 100;
          const totalInterest = Math.round(interestPerTerm * termMonths * 100) / 100;
          const totalTermPayment = Math.round((loanAmount + totalInterest) * 100) / 100;
          
          // Recalculate amount paid based on new outstanding balance
          const amountPaid = Math.max(0, totalTermPayment - outstandingBalance);
          
          // Recalculate interest paid
          const interestPaidSoFar = Math.min(
            totalInterest, 
            Math.round(paymentsMade * interestPerTerm * 100) / 100
          );
          
          // Recalculate principal paid
          const principalPaidSoFar = Math.max(0, amountPaid - interestPaidSoFar);
          
          updatedLoan.amountPaid = amountPaid;
          updatedLoan.interestPaid = interestPaidSoFar;
          updatedLoan.principalPaid = principalPaidSoFar;
          
          // Update total calculations
          updatedLoan.interestPerTerm = interestPerTerm;
          updatedLoan.totalInterest = totalInterest;
          updatedLoan.totalTermPayment = totalTermPayment;
          updatedLoan.totalMonthlyPayment = Math.round(totalTermPayment / termMonths * 100) / 100;
          updatedLoan.monthlyPrincipal = Math.round(loanAmount / termMonths * 100) / 100;
          updatedLoan.monthlyPayment = updatedLoan.monthlyPrincipal; // Fixed: equals monthlyPrincipal
        }
      }
      
      // Validate outstanding balance doesn't exceed loan amount
      if (field === 'outstandingBalance') {
        const loanAmount = parseFloat(updatedLoan.loanAmount) || 0;
        const outstanding = parseFloat(value) || 0;
        
        if (outstanding > loanAmount) {
          // Reset to loan amount if it exceeds
          updatedLoan.outstandingBalance = loanAmount;
          
          // Show error message
          setErrorMessage(`Outstanding balance cannot exceed original loan amount. Reset to ${formatCurrency(loanAmount)}`);
          setErrorModalVisible(true);
        }
      }
      
      // Validate account number based on disbursement type
      if (field === 'accountNumber' && updatedLoan.disbursement !== 'Cash') {
        const cleanValue = validateAccountNumber(value, updatedLoan.disbursement);
        updatedLoan.accountNumber = cleanValue;
      }
      
      // Validate bank type is required for Bank disbursement
      if (field === 'disbursement' && value === 'Bank' && !updatedLoan.bankType) {
        // Auto-select first bank type
        if (bankTypeOptions.length > 0) {
          updatedLoan.bankType = bankTypeOptions[0].key;
        }
      }
      
      // Update due date format if it's in YYYY-MM-DD format
      if (updatedLoan.dueDate && updatedLoan.dueDate.includes('-') && updatedLoan.dueDate.length === 10) {
        try {
          const [year, month, day] = updatedLoan.dueDate.split('-');
          const date = new Date(year, month - 1, day);
          updatedLoan.dueDate = formatDate(date);
        } catch (error) {
          console.error('Error formatting due date:', error);
        }
      }
      
      return updatedLoan;
    }
    return loan;
  }));
};


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
    
    // IMPORTANT: Calculate release amount (loan amount minus processing fee)
    const releaseAmount = Math.max(0, amount - processingFee);
    
    // Calculate interest paid based on payments made
    const interestPaidSoFar = Math.min(totalInterest, (paymentsMade * interestPerTerm));
    
    // NEVER auto-calculate outstanding balance for migration
    const outstandingBalance = parseFloat(loan.outstandingBalance) || totalTermPayment;
    
    return {
      ...loan,
      interestPerTerm: Math.round(interestPerTerm * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalTermPayment: Math.round(totalTermPayment * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      monthlyPrincipal: Math.round(monthlyPrincipal * 100) / 100,
      interestPaid: Math.round(interestPaidSoFar * 100) / 100,
      // NEW: Add processing fee calculations
      processingFee: Math.round(processingFee * 100) / 100,
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      // CRITICAL: Always use manual outstanding balance without recalculation
      outstandingBalance: outstandingBalance,
      // Auto-calculate months remaining only
      monthsRemaining: Math.max(0, termMonths - paymentsMade)
    };
  }
  
  // Return loan with processing fee even if not fully calculated
  return {
    ...loan,
    processingFee: Math.round(processingFee * 100) / 100,
    releaseAmount: Math.max(0, (parseFloat(loan.loanAmount) || 0) - processingFee)
  };
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
// UPDATED: Function to update payment transaction field with auto-calculation
const updatePaymentTransactionField = (paymentId, field, value) => {
  setPaymentTransactions(prev => prev.map(payment => {
    if (payment.id === paymentId) {
      const updatedPayment = { ...payment, [field]: value };
      
      // Auto-calculate allocation when amount or loan changes
      if ((field === 'paymentAmount' || field === 'loanTransactionId') && 
          updatedPayment.loanTransactionId) {
        
        const linkedLoan = existingLoans.find(loan => 
          loan.transactionId === updatedPayment.loanTransactionId
        );
        
        if (linkedLoan && updatedPayment.paymentAmount) {
          const allocation = calculatePaymentAllocation(
            updatedPayment.paymentAmount, 
            linkedLoan
          );
          
          updatedPayment.penaltyPaid = allocation.penaltyPaid;
          updatedPayment.interestPaid = allocation.interestPaid;
          updatedPayment.principalPaid = allocation.principalPaid;
          updatedPayment.excessPayment = allocation.excessPayment;
        }
      }
      
      return updatedPayment;
    }
    return payment;
  }));
};

// NEW: Function to calculate due date
const calculateDueDate = (approvalDate, termMonths) => {
  const date = new Date(approvalDate);
  date.setMonth(date.getMonth() + termMonths);
  return formatDate(date);
};

const calculatePaymentAllocation = (paymentAmount, linkedLoan) => {
  if (!linkedLoan) return { penaltyPaid: 0, interestPaid: 0, principalPaid: 0, excessPayment: 0 };
  
  const amount = parseFloat(paymentAmount) || 0;
  
  // Get loan values
  const outstandingBalance = parseFloat(linkedLoan.outstandingBalance) || 
                           parseFloat(linkedLoan.remainingBalance) || 0;
  const interestPerTerm = parseFloat(linkedLoan.interestPerTerm) || 
                         (parseFloat(linkedLoan.interest) || 0);
  const totalInterest = parseFloat(linkedLoan.totalInterest) || 0;
  const interestPaidSoFar = parseFloat(linkedLoan.interestPaid) || 0;
  
  // Calculate remaining interest
  const remainingInterest = Math.max(0, totalInterest - interestPaidSoFar);
  
  // Calculate current principal
  const currentPrincipal = Math.max(0, outstandingBalance - remainingInterest);
  
  // Check for overdue penalty
  let penaltyDue = 0;
  if (linkedLoan.status === 'overdue' && linkedLoan.overdueDays) {
    penaltyDue = linkedLoan.overdueDays * 100; // ₱100 per day
  }
  
  // Allocate payment (WEB-CONSISTENT LOGIC)
  const penaltyPaid = Math.min(amount, penaltyDue);
  const remainingAfterPenalty = amount - penaltyPaid;
  
  // Allocate to interest (current month's interest)
  const interestPaid = Math.min(remainingAfterPenalty, interestPerTerm);
  const remainingAfterInterest = remainingAfterPenalty - interestPaid;
  
  // Allocate to principal
  const principalPaid = Math.min(remainingAfterInterest, currentPrincipal);
  const remainingAfterPrincipal = remainingAfterInterest - principalPaid;
  
  // Excess payment
  const excessPayment = Math.max(0, remainingAfterPrincipal);
  
  return {
    penaltyPaid: Math.round(penaltyPaid * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
    principalPaid: Math.round(principalPaid * 100) / 100,
    excessPayment: Math.round(excessPayment * 100) / 100
  };
};

// Helper function to format loan status with colors
const getLoanStatusBadge = (status) => {
  switch(status?.toLowerCase()) {
    case 'active':
      return <span style={{ ...styles.statusBadge, background: '#d1fae5', color: '#065f46' }}>Active</span>;
    case 'paid':
      return <span style={{ ...styles.statusBadge, background: '#dcfce7', color: '#166534' }}>Paid</span>;
    case 'overdue':
      return <span style={{ ...styles.statusBadge, background: '#fee2e2', color: '#991b1b' }}>Overdue</span>;
    case 'approved':
      return <span style={{ ...styles.statusBadge, background: '#dbeafe', color: '#1e40af' }}>Approved</span>;
    default:
      return <span style={{ ...styles.statusBadge, background: '#f3f4f6', color: '#374151' }}>{status || 'Unknown'}</span>;
  }
};

// Helper function to format payment status
const getPaymentStatusBadge = (status) => {
  switch(status?.toLowerCase()) {
    case 'approved':
      return <span style={{ ...styles.statusBadge, background: '#d1fae5', color: '#065f46' }}>Approved</span>;
    case 'pending':
      return <span style={{ ...styles.statusBadge, background: '#fef3c7', color: '#92400e' }}>Pending</span>;
    case 'rejected':
      return <span style={{ ...styles.statusBadge, background: '#fee2e2', color: '#991b1b' }}>Rejected</span>;
    default:
      return <span style={{ ...styles.statusBadge, background: '#f3f4f6', color: '#374151' }}>{status || 'Unknown'}</span>;
  }
};

// Helper function to format date for display
const formatDisplayDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    if (dateString.includes(' at ')) {
      return dateString; // Already formatted
    }
    const date = new Date(dateString);
    return formatDate(date);
  } catch (error) {
    return dateString;
  }
};




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

const validateLoans = () => {
  for (const loan of existingLoans) {
    // Check required fields
    if (!loan.loanType || !loan.loanAmount || !loan.term) {
      setErrorMessage('Please fill Loan Type, Amount, and Term for all loans');
      setErrorModalVisible(true);
      return false;
    }
    
    const loanAmount = parseFloat(loan.loanAmount) || 0;
    const outstanding = parseFloat(loan.outstandingBalance) || 0;
    
    // Basic validation
    if (loanAmount <= 0) {
      setErrorMessage('Loan amount must be greater than 0');
      setErrorModalVisible(true);
      return false;
    }
    
    if (outstanding < 0) {
      setErrorMessage('Outstanding balance cannot be negative');
      setErrorModalVisible(true);
      return false;
    }
    
    // Validate disbursement fields
    if (loan.disbursement !== 'Cash') {
      if (!loan.accountName || !loan.accountNumber) {
        setErrorMessage(`Account Name and Account Number required for ${loan.disbursement} disbursement`);
        setErrorModalVisible(true);
        return false;
      }
      
      // Account number validation
      const cleanAccountNumber = (loan.accountNumber || '').replace(/\D/g, '');
      if (loan.disbursement === 'GCash' && cleanAccountNumber.length !== 11) {
        setErrorMessage('GCash number must be 11 digits');
        setErrorModalVisible(true);
        return false;
      }
      
      if (loan.disbursement === 'Bank' && (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 16)) {
        setErrorMessage('Bank account must be 8-16 digits');
        setErrorModalVisible(true);
        return false;
      }
      
      // Bank type validation
      if (loan.disbursement === 'Bank' && !loan.bankType) {
        setErrorMessage('Bank Type is required for Bank disbursement');
        setErrorModalVisible(true);
        return false;
      }
    }
  }
  
  // Validate payments
  for (const payment of paymentTransactions) {
    if (payment.loanTransactionId && payment.paymentAmount) {
      const paymentAmount = parseFloat(payment.paymentAmount) || 0;
      
      if (paymentAmount <= 0) {
        setErrorMessage('Payment amount must be greater than 0');
        setErrorModalVisible(true);
        return false;
      }
      
      // Check if linked loan exists
      const linkedLoan = existingLoans.find(loan => loan.transactionId === payment.loanTransactionId);
      if (!linkedLoan) {
        setErrorMessage(`Payment references non-existent loan: ${payment.loanTransactionId}`);
        setErrorModalVisible(true);
        return false;
      }
    }
  }
  
  return true;
};

const validateEditFields = () => {
  let isValid = true;
  setEmailError('');
  setFirstNameError('');
  setLastNameError('');
  setPhoneNumberError('');

  // Basic validations
  if (!formData.email.trim()) {
    setEmailError('Email is required');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    setEmailError('Invalid email format');
    isValid = false;
  } else if (formData.email !== editingMember?.email) {
    // Check if new email already exists in other members
    const emailExists = members.some(member => 
      member.id !== editingMember?.id && 
      member.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (emailExists) {
      setEmailError('Email address is already in use by another member');
      isValid = false;
    }
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

  // Validate loans if any
  if (existingLoans.length > 0) {
    for (const loan of existingLoans) {
      if (!loan.loanType || !loan.loanAmount || !loan.term) {
        setErrorMessage('Please fill Loan Type, Amount, and Term for all loans');
        setErrorModalVisible(true);
        isValid = false;
        break;
      }
      
      const loanAmount = parseFloat(loan.loanAmount) || 0;
      const outstanding = parseFloat(loan.outstandingBalance) || 0;
      
      if (loanAmount <= 0) {
        setErrorMessage('Loan amount must be greater than 0');
        setErrorModalVisible(true);
        isValid = false;
        break;
      }
      
      if (outstanding > loanAmount) {
        setErrorMessage(`Outstanding balance cannot be greater than original loan amount for ${loan.loanType}`);
        setErrorModalVisible(true);
        isValid = false;
        break;
      }
    }
  }

  // Validate payments if any
  if (paymentTransactions.length > 0) {
    for (const payment of paymentTransactions) {
      if (payment.loanTransactionId && payment.paymentAmount) {
        const paymentAmount = parseFloat(payment.paymentAmount) || 0;
        
        if (paymentAmount <= 0) {
          setErrorMessage('Payment amount must be greater than 0');
          setErrorModalVisible(true);
          isValid = false;
          break;
        }
        
        // Check if linked loan exists in our current list
        const linkedLoan = existingLoans.find(loan => loan.transactionId === payment.loanTransactionId);
        if (!linkedLoan) {
          setErrorMessage(`Payment references non-existent loan: ${payment.loanTransactionId}`);
          setErrorModalVisible(true);
          isValid = false;
          break;
        }
      }
    }
  }

  return isValid;
};

const updateLoanAfterPayment = async (memberId, loanTransactionId, paymentData, linkedLoan) => {
  try {
    // Get current loan from database
    const loanRef = database.ref(`Loans/CurrentLoans/${memberId}/${loanTransactionId}`);
    const loanSnap = await loanRef.once('value');
    let currentLoan = loanSnap.val();
    
    // If not in CurrentLoans, check ApprovedLoans
    if (!currentLoan) {
      const approvedLoanSnap = await database.ref(`Loans/ApprovedLoans/${memberId}/${loanTransactionId}`).once('value');
      currentLoan = approvedLoanSnap.val();
      
      if (!currentLoan) {
        console.error(`Loan ${loanTransactionId} not found`);
        return;
      }
      
      // Create in CurrentLoans
      await loanRef.set(currentLoan);
    }
    
    // Parse payment allocation
    const principalPaid = parseFloat(paymentData.principalPaid) || 0;
    const interestPaid = parseFloat(paymentData.interestPaid) || 0;
    const penaltyPaid = parseFloat(paymentData.penaltyPaid) || 0;
    const paymentAmount = parseFloat(paymentData.amountToBePaid || paymentData.paymentAmount) || 0;
    
    // Get current values
    const currentOutstanding = parseFloat(currentLoan.outstandingBalance) || 
                              parseFloat(currentLoan.remainingBalance) || 0;
    const currentPaymentsMade = parseInt(currentLoan.paymentsMade) || 0;
    const currentAmountPaid = parseFloat(currentLoan.amountPaid) || 0;
    const currentInterestPaid = parseFloat(currentLoan.interestPaid) || 0;
    const currentPrincipalPaid = parseFloat(currentLoan.principalPaid) || 0;
    
    // Calculate new values (WEB-CONSISTENT)
    const newOutstanding = Math.max(0, currentOutstanding - principalPaid);
    const newPaymentsMade = currentPaymentsMade + 1; // Increment for each payment
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newInterestPaid = currentInterestPaid + interestPaid;
    const newPrincipalPaid = currentPrincipalPaid + principalPaid;
    
    // Calculate months remaining
    const termMonths = parseInt(currentLoan.term) || 0;
    const newMonthsRemaining = Math.max(0, termMonths - newPaymentsMade);
    
    // Calculate new due date
    const approvalDate = new Date(currentLoan.dateApproved || Date.now());
    let newDueDate;
    
    if (newMonthsRemaining > 0) {
      newDueDate = new Date(approvalDate);
      newDueDate.setMonth(newDueDate.getMonth() + newMonthsRemaining);
    } else {
      newDueDate = 'Paid';
    }
    
    // Prepare updates
    const updates = {
      outstandingBalance: Math.round(newOutstanding * 100) / 100,
      remainingBalance: Math.round(newOutstanding * 100) / 100,
      paymentsMade: newPaymentsMade,
      monthsRemaining: newMonthsRemaining,
      amountPaid: Math.round(newAmountPaid * 100) / 100,
      interestPaid: Math.round(newInterestPaid * 100) / 100,
      principalPaid: Math.round(newPrincipalPaid * 100) / 100,
      lastPaymentDate: formatDate(new Date(paymentData.paymentDate || Date.now())),
      lastPaymentTime: paymentData.paymentTime || formatTime(new Date()),
      lastPaymentAmount: Math.round(paymentAmount * 100) / 100,
      totalPenaltyPaid: (parseFloat(currentLoan.totalPenaltyPaid) || 0) + penaltyPaid,
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date())
    };
    
    // Add due date if calculated
    if (newDueDate instanceof Date) {
      updates.dueDate = formatDate(newDueDate);
    } else {
      updates.dueDate = newDueDate;
    }
    
    // Check if loan is fully paid
    if (newOutstanding <= 0.01) { // Allow small rounding differences
      updates.status = 'paid';
      updates.dateCompleted = formatDate(new Date());
      updates.timeCompleted = formatTime(new Date());
      updates.dueDate = 'Paid';
      
      // Move to PaidLoans
      const paidLoanData = {
        ...currentLoan,
        ...updates
      };
      
      await database.ref(`Loans/PaidLoans/${memberId}/${loanTransactionId}`).set(paidLoanData);
      
      // Remove from CurrentLoans
      await loanRef.remove();
      
      console.log(`Loan ${loanTransactionId} fully paid, moved to PaidLoans`);
    } else {
      // Update CurrentLoans
      await loanRef.update(updates);
      
      console.log(`Updated loan ${loanTransactionId} after payment`);
    }
    
    // Update Transactions record
    await database.ref(`Transactions/Loans/${memberId}/${loanTransactionId}`).update(updates);
    
    // Update Member's loan record
    await database.ref(`Members/${memberId}/loans/${loanTransactionId}`).update(updates);
    
  } catch (error) {
    console.error('Error updating loan after payment:', error);
    throw error;
  }
};

// Generate a transaction ID
const generateTransactionId = (prefix) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Update an existing loan
const updateExistingLoan = async (memberId, loanData) => {
  try {
    const now = new Date();
    
    // Prepare updated loan data
    const updatedLoan = {
      loanType: loanData.loanType,
      term: parseInt(loanData.term) || 0,
      loanAmount: parseFloat(loanData.loanAmount) || 0,
      outstandingBalance: parseFloat(loanData.outstandingBalance) || 0,
      remainingBalance: parseFloat(loanData.outstandingBalance) || 0,
      paymentsMade: parseInt(loanData.paymentsMade) || 0,
      monthsRemaining: parseInt(loanData.monthsRemaining) || 0,
      status: loanData.status || 'active',
      dateModified: formatDate(now),
      timeModified: formatTime(now),
      disbursement: loanData.disbursement || 'Cash',
      accountName: loanData.accountName || '',
      accountNumber: loanData.accountNumber || '',
      bankType: loanData.bankType || ''
    };
    
    // Update in all locations
    const collections = ['ApprovedLoans', 'CurrentLoans'];
    
    for (const collection of collections) {
      const ref = database.ref(`Loans/${collection}/${memberId}/${loanData.transactionId}`);
      await ref.update(updatedLoan);
    }
    
    // Update in Transactions
    await database.ref(`Transactions/Loans/${memberId}/${loanData.transactionId}`).update(updatedLoan);
    
    // Update in Member record
    await database.ref(`Members/${memberId}/loans/${loanData.transactionId}`).update(updatedLoan);
    
    console.log(`Updated existing loan ${loanData.transactionId}`);
    
    return true;
  } catch (error) {
    console.error('Error updating existing loan:', error);
    throw error;
  }
};

// Update an existing payment
const updateExistingPayment = async (memberId, paymentData) => {
  try {
    const now = new Date();
    
    // Prepare updated payment data
    const updatedPayment = {
      amountToBePaid: parseFloat(paymentData.paymentAmount) || 0,
      selectedLoanId: paymentData.loanTransactionId,
      paymentOption: paymentData.paymentMethod || 'Cash',
      accountName: paymentData.accountName || '',
      accountNumber: paymentData.accountNumber || '',
      bankType: paymentData.bankType || '',
      penalty: parseFloat(paymentData.penaltyPaid) || 0,
      penaltyPaid: parseFloat(paymentData.penaltyPaid) || 0,
      interestPaid: parseFloat(paymentData.interestPaid) || 0,
      principalPaid: parseFloat(paymentData.principalPaid) || 0,
      excessPayment: parseFloat(paymentData.excessPayment) || 0,
      dateModified: formatDate(now),
      timeModified: formatTime(now)
    };
    
    // Update in ApprovedPayments
    await database.ref(`Payments/ApprovedPayments/${memberId}/${paymentData.transactionId}`)
      .update(updatedPayment);
    
    // Update in Transactions
    await database.ref(`Transactions/Payments/${memberId}/${paymentData.transactionId}`)
      .update(updatedPayment);
    
    console.log(`Updated existing payment ${paymentData.transactionId}`);
    
    return true;
  } catch (error) {
    console.error('Error updating existing payment:', error);
    throw error;
  }
};

const updateLoansAndPayments = async (memberId) => {
  try {
    console.log(`Processing loans and payments update for member ${memberId}`);
    
    // Track what we need to update
    const loansToUpdate = [];
    const paymentsToUpdate = [];
    
    // STEP 1: Process existing loans (update them)
    for (const loan of existingLoans) {
      if (!loan.loanType || !loan.loanAmount || !loan.term) continue;
      
      // Check if this is an existing loan (has transactionId)
      const isExistingLoan = loan.transactionId && loan.transactionId.startsWith('LOAN-');
      
      if (isExistingLoan) {
        // UPDATE existing loan
        loansToUpdate.push({
          type: 'update',
          loanData: loan,
          transactionId: loan.transactionId
        });
      } else {
        // ADD new loan
        loansToUpdate.push({
          type: 'add',
          loanData: loan,
          transactionId: loan.transactionId || generateTransactionId('LOAN')
        });
      }
    }
    
    // STEP 2: Process payments
    for (const payment of paymentTransactions) {
      if (!payment.loanTransactionId || !payment.paymentAmount) continue;
      
      const isExistingPayment = payment.transactionId && payment.transactionId.startsWith('PAY-');
      
      if (isExistingPayment) {
        // UPDATE existing payment
        paymentsToUpdate.push({
          type: 'update',
          paymentData: payment,
          transactionId: payment.transactionId
        });
      } else {
        // ADD new payment
        paymentsToUpdate.push({
          type: 'add',
          paymentData: payment,
          transactionId: payment.transactionId || generateTransactionId('PAY')
        });
      }
    }
    
    // STEP 3: Execute updates
    // Update existing loans
    for (const loanUpdate of loansToUpdate.filter(l => l.type === 'update')) {
      await updateExistingLoan(memberId, loanUpdate.loanData);
    }
    
    // Add new loans
    for (const loanUpdate of loansToUpdate.filter(l => l.type === 'add')) {
      await createLoanRecord(memberId, loanUpdate.loanData);
    }
    
    // Update existing payments
    for (const paymentUpdate of paymentsToUpdate.filter(p => p.type === 'update')) {
      await updateExistingPayment(memberId, paymentUpdate.paymentData);
    }
    
    // Add new payments
    for (const paymentUpdate of paymentsToUpdate.filter(p => p.type === 'add')) {
      const linkedLoan = existingLoans.find(loan => 
        loan.transactionId === paymentUpdate.paymentData.loanTransactionId
      );
      if (linkedLoan) {
        await createPaymentRecord(memberId, paymentUpdate.paymentData, linkedLoan);
      }
    }
    
    // STEP 4: Recalculate total loans amount
    if (loansToUpdate.length > 0) {
      const totalLoansAmount = existingLoans.reduce((sum, loan) => {
        return sum + (parseFloat(loan.loanAmount) || 0);
      }, 0);
      
      await database.ref(`Members/${memberId}/loans`).set(Math.round(totalLoansAmount * 100) / 100);
    }
    
    console.log(`Updated ${loansToUpdate.length} loans and ${paymentsToUpdate.length} payments for member ${memberId}`);
    
    return {
      success: true,
      loansUpdated: loansToUpdate.filter(l => l.type === 'update').length,
      loansAdded: loansToUpdate.filter(l => l.type === 'add').length,
      paymentsUpdated: paymentsToUpdate.filter(p => p.type === 'update').length,
      paymentsAdded: paymentsToUpdate.filter(p => p.type === 'add').length
    };
    
  } catch (error) {
    console.error('Error updating loans and payments:', error);
    throw error;
  }
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

  // ✅ ADDED: Additional validation for admin/coadmin roles
  if (formData.userRole === 'admin' || formData.userRole === 'coadmin') {
    // Fetch existing admins and coadmins to check for email duplicates
    const fetchAdminUsers = async () => {
      try {
        // Check in Admin collection
        const adminSnap = await database.ref('Users/Admin').once('value');
        const adminsData = adminSnap.val() || {};
        const adminEmails = Object.values(adminsData).map(admin => admin.email?.toLowerCase());
        
        // Check in CoAdmin collection
        const coadminSnap = await database.ref('Users/CoAdmin').once('value');
        const coadminsData = coadminSnap.val() || {};
        const coadminEmails = Object.values(coadminsData).map(coadmin => coadmin.email?.toLowerCase());
        
        const allAdminEmails = [...adminEmails, ...coadminEmails];
        return allAdminEmails;
      } catch (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }
    };
    
    // Check if email already exists as admin/coadmin
    fetchAdminUsers().then(adminEmails => {
      if (adminEmails.includes(formData.email.toLowerCase())) {
        setEmailError(`This email is already registered as an administrator`);
        isValid = false;
      }
    });
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

      setIsOtherGovernmentId(false);
  setOtherGovernmentId('');
  
  if (loanTypeOptions.length > 0) {
        updateAvailableTerms(loanTypeOptions[0].key);
    }
  };

const openViewModal = async (member) => {
  setSelectedMember(member);
  setViewLoading(true);
  setViewModalVisible(true);
  
  try {
    const memberId = member.id;
    
    // Reset previous data
    setViewMemberLoans([]);
    setViewMemberPayments([]);
    
    // Fetch loans from all collections
    const loanCollections = ['CurrentLoans', 'ApprovedLoans', 'PaidLoans'];
    let allLoans = [];
    
    for (const collection of loanCollections) {
      try {
        const loansSnap = await database.ref(`Loans/${collection}/${memberId}`).once('value');
        const loansData = loansSnap.val() || {};
        
        if (loansData && typeof loansData === 'object') {
          const loansArray = Object.values(loansData).map(loan => ({
            ...loan,
            collection: collection // Track which collection it came from
          }));
          allLoans = [...allLoans, ...loansArray];
        }
      } catch (error) {
        console.log(`No loans found in ${collection}:`, error);
      }
    }
    
    // Remove duplicates by transactionId
    const uniqueLoans = [];
    const seenLoanIds = new Set();
    
    allLoans.forEach(loan => {
      if (loan.transactionId && !seenLoanIds.has(loan.transactionId)) {
        seenLoanIds.add(loan.transactionId);
        uniqueLoans.push(loan);
      }
    });
    
    setViewMemberLoans(uniqueLoans);
    
    // Fetch payments from all collections
    const paymentCollections = ['ApprovedPayments', 'PendingPayments'];
    let allPayments = [];
    
    for (const collection of paymentCollections) {
      try {
        const paymentsSnap = await database.ref(`Payments/${collection}/${memberId}`).once('value');
        const paymentsData = paymentsSnap.val() || {};
        
        if (paymentsData && typeof paymentsData === 'object') {
          const paymentsArray = Object.values(paymentsData).map(payment => ({
            ...payment,
            collection: collection
          }));
          allPayments = [...allPayments, ...paymentsArray];
        }
      } catch (error) {
        console.log(`No payments found in ${collection}:`, error);
      }
    }
    
    // Also check Transactions/Payments
    try {
      const transactionsSnap = await database.ref(`Transactions/Payments/${memberId}`).once('value');
      const transactionsData = transactionsSnap.val() || {};
      
      if (transactionsData && typeof transactionsData === 'object') {
        const transactionsArray = Object.values(transactionsData);
        allPayments = [...allPayments, ...transactionsArray];
      }
    } catch (error) {
      console.log('No payments in transactions:', error);
    }
    
    // Remove duplicate payments
    const uniquePayments = [];
    const seenPaymentIds = new Set();
    
    allPayments.forEach(payment => {
      if (payment.transactionId && !seenPaymentIds.has(payment.transactionId)) {
        seenPaymentIds.add(payment.transactionId);
        uniquePayments.push(payment);
      }
    });
    
    setViewMemberPayments(uniquePayments);
    
  } catch (error) {
    console.error('Error fetching loans and payments:', error);
    setErrorMessage('Failed to load loan and payment details');
    setErrorModalVisible(true);
  } finally {
    setViewLoading(false);
  }
};

const openEditModal = async (member) => {
  try {
    setEditingMember(member);
    
    // Set basic form data
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
      userRole: member.role || 'member',
      hasExistingLoan: false
    });

    // RESET loans and payments first
    setExistingLoans([]);
    setPaymentTransactions([]);

    // Load existing loans - Check all possible locations
    const loanCollections = ['CurrentLoans', 'ApprovedLoans', 'PaidLoans'];
    let allLoans = [];
    
    for (const collection of loanCollections) {
      try {
        const loansSnap = await database.ref(`Loans/${collection}/${member.id}`).once('value');
        const loansData = loansSnap.val() || {};
        
        if (loansData && typeof loansData === 'object') {
          const loansArray = Object.values(loansData);
          allLoans = [...allLoans, ...loansArray];
        }
      } catch (error) {
        console.log(`No loans found in ${collection}:`, error);
      }
    }

    // Also check member's own loans
    try {
      const memberLoansSnap = await database.ref(`Members/${member.id}/loans`).once('value');
      const memberLoansData = memberLoansSnap.val() || {};
      
      if (memberLoansData && typeof memberLoansData === 'object') {
        const memberLoansArray = Object.values(memberLoansData);
        allLoans = [...allLoans, ...memberLoansArray];
      }
    } catch (error) {
      console.log('No loans in member record:', error);
    }

    // Remove duplicates by transactionId
    const uniqueLoans = [];
    const seenIds = new Set();
    
    allLoans.forEach(loan => {
      if (loan.transactionId && !seenIds.has(loan.transactionId)) {
        seenIds.add(loan.transactionId);
        uniqueLoans.push(loan);
      }
    });

    // Transform loan data to match our format
    const formattedLoans = uniqueLoans.map((loan, index) => {
      // Parse numeric values
      const originalLoanAmount = parseFloat(loan.loanAmount) || 0;
      const termMonths = parseInt(loan.term) || 0;
      const interestRate = parseFloat(loan.interestRate) || 0;
      const interestRateDecimal = interestRate / 100;
      const paymentsMade = parseInt(loan.paymentsMade) || 0;
      const outstandingBalance = parseFloat(loan.outstandingBalance || loan.remainingBalance) || 0;
      
      // Calculate basic values
      const interestPerTerm = Math.round(originalLoanAmount * interestRateDecimal * 100) / 100;
      const totalInterest = Math.round(interestPerTerm * termMonths * 100) / 100;
      const totalTermPayment = Math.round((originalLoanAmount + totalInterest) * 100) / 100;
      const totalMonthlyPayment = Math.round(totalTermPayment / termMonths * 100) / 100;
      const monthlyPrincipal = Math.round(originalLoanAmount / termMonths * 100) / 100;
      
      // Calculate interest paid so far
      const interestPaid = Math.min(totalInterest, Math.round(paymentsMade * interestPerTerm * 100) / 100);
      const principalPaid = Math.max(0, totalTermPayment - outstandingBalance - interestPaid);
      
      // Calculate months remaining
      const monthsRemaining = Math.max(0, termMonths - paymentsMade);

      // Calculate due date
      const baseDate = loan.dateApproved || loan.dateApplied || new Date();
      const approvalDate = new Date(baseDate);
      const dueDate = new Date(approvalDate);
      dueDate.setMonth(dueDate.getMonth() + monthsRemaining);

      return {
        id: loan.transactionId || `loan-${Date.now()}-${index}`,
        transactionId: loan.transactionId || `LOAN-${Date.now()}-${index}`,
        loanType: loan.loanType || '',
        loanAmount: originalLoanAmount.toString(),
        term: termMonths.toString(),
        outstandingBalance: outstandingBalance.toString(),
        paymentsMade: paymentsMade.toString(),
        monthsRemaining: monthsRemaining.toString(),
        status: loan.status || 'active',
        dateApproved: loan.dateApproved ? 
                      (typeof loan.dateApproved === 'string' ? loan.dateApproved.split(' ')[0] : loan.dateApproved) : 
                      new Date().toISOString().split('T')[0],
        interestRate: interestRate.toString(),
        interestRateDecimal: interestRateDecimal,
        interestPerTerm: interestPerTerm,
        totalInterest: totalInterest,
        totalTermPayment: totalTermPayment,
        totalMonthlyPayment: totalMonthlyPayment,
        monthlyPrincipal: monthlyPrincipal,
        disbursement: loan.disbursement || 'Cash',
        accountName: loan.accountName || '',
        accountNumber: loan.accountNumber || '',
        bankType: loan.bankType || '',
        interestPaid: interestPaid,
        principalPaid: principalPaid,
        amountPaid: (principalPaid + interestPaid),
        processingFee: parseFloat(loan.processingFee) || 0,
        releaseAmount: parseFloat(loan.releaseAmount) || 0,
        dueDate: loan.dueDate || formatDate(dueDate)
      };
    });
    
    setExistingLoans(formattedLoans);

    // Update available terms if we have loans
    if (formattedLoans.length > 0 && formattedLoans[0].loanType) {
      const { loanTypes } = await fetchLoanSettings();
      updateAvailableTerms(formattedLoans[0].loanType, loanTypes);
    }
    
    // Load existing payment transactions
    const paymentCollections = ['ApprovedPayments', 'PendingPayments'];
    let allPayments = [];
    
    for (const collection of paymentCollections) {
      try {
        const paymentsSnap = await database.ref(`Payments/${collection}/${member.id}`).once('value');
        const paymentsData = paymentsSnap.val() || {};
        
        if (paymentsData && typeof paymentsData === 'object') {
          const paymentsArray = Object.values(paymentsData);
          allPayments = [...allPayments, ...paymentsArray];
        }
      } catch (error) {
        console.log(`No payments found in ${collection}:`, error);
      }
    }

    // Also check Transactions/Payments
    try {
      const transactionsPaymentsSnap = await database.ref(`Transactions/Payments/${member.id}`).once('value');
      const transactionsData = transactionsPaymentsSnap.val() || {};
      
      if (transactionsData && typeof transactionsData === 'object') {
        const transactionsArray = Object.values(transactionsData);
        allPayments = [...allPayments, ...transactionsArray];
      }
    } catch (error) {
      console.log('No payments in transactions:', error);
    }

    // Remove duplicate payments
    const uniquePayments = [];
    const seenPaymentIds = new Set();
    
    allPayments.forEach(payment => {
      if (payment.transactionId && !seenPaymentIds.has(payment.transactionId)) {
        seenPaymentIds.add(payment.transactionId);
        uniquePayments.push(payment);
      }
    });

    const formattedPayments = uniquePayments.map((payment, index) => {
      // Parse date
      let paymentDate = new Date().toISOString().split('T')[0];
      let paymentTime = formatTime(new Date());
      
      if (payment.dateApplied) {
        const dateParts = payment.dateApplied.split(' at ');
        if (dateParts.length === 2) {
          paymentDate = dateParts[0];
          paymentTime = dateParts[1];
        } else if (payment.dateApplied.includes('T')) {
          paymentDate = payment.dateApplied.split('T')[0];
        }
      } else if (payment.dateApproved) {
        paymentDate = payment.dateApproved;
      }

      return {
        id: payment.transactionId || `payment-${Date.now()}-${index}`,
        transactionId: payment.transactionId,
        loanTransactionId: payment.selectedLoanId || '',
        paymentDate: paymentDate,
        paymentTime: paymentTime,
        paymentAmount: String(payment.amountToBePaid || payment.paymentAmount || 0),
        paymentMethod: payment.paymentOption || 'Cash',
        accountName: payment.accountName || '',
        accountNumber: payment.accountNumber || '',
        bankType: payment.bankType || '',
        proofOfPaymentUrl: payment.proofOfPaymentUrl || payment.proofOfPayment || null,
        status: payment.status || 'approved',
        penaltyPaid: parseFloat(payment.penaltyPaid || payment.penalty || 0),
        interestPaid: parseFloat(payment.interestPaid || 0),
        principalPaid: parseFloat(payment.principalPaid || 0),
        excessPayment: parseFloat(payment.excessPayment || 0)
      };
    });
    
    setPaymentTransactions(formattedPayments);
    
    setValidIdFrontFile(null);
    setSelfieFile(null);
    setEditModalVisible(true);
    
    // Check if governmentId is "Others"
    const govId = member.governmentId || '';
    setIsOtherGovernmentId(govId === 'Others');
    if (govId !== 'Others' && !governmentIdOptions.some(opt => opt.label === govId)) {
      setIsOtherGovernmentId(true);
      setOtherGovernmentId(govId);
      handleInputChange('governmentId', govId);
    }
    
  } catch (error) {
    console.error('Error opening edit modal:', error);
    setErrorMessage('Failed to load member data for editing');
    setErrorModalVisible(true);
  }
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
const handleEmailUpdate = async (oldEmail, newEmail, memberId, memberData, formData) => {
  setEmailChangeLoading(true);
  try {
    if (oldEmail.toLowerCase() === newEmail.toLowerCase()) {
      return { success: true, password: null };
    }
    
    // Check if new email already exists in members
    const emailExistsInMembers = members.some(member => 
      member.id !== memberId && 
      member.email.toLowerCase() === newEmail.toLowerCase()
    );
    
    if (emailExistsInMembers) {
      throw new Error('Email address is already in use by another member');
    }
    
    // Check if email exists in admin/coadmin collections
    const isAdminOrCoadmin = memberData.role === 'admin' || memberData.role === 'coadmin';
    if (isAdminOrCoadmin) {
      const emailExistsInAdmins = await checkEmailInAdminCollections(newEmail, memberId);
      if (emailExistsInAdmins) {
        throw new Error('Email address is already in use by another administrator');
      }
    }
    
    // Generate new password
    const newPassword = generateRandomPassword();
    
    // Create new Firebase user
    const newUserCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    const newUid = newUserCredential.user.uid;
    
    // STEP 1: Update member record with new email and UID
    await database.ref(`Members/${memberId}`).update({
      email: newEmail,
      authUid: newUid,
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date())
    });
    
    // STEP 2: Update role-specific collection if admin/coadmin
    if (memberData.role === 'admin') {
      await database.ref(`Users/Admin/${memberId}`).update({
        email: newEmail,
        uid: newUid,
        dateModified: formatDate(new Date()),
        timeModified: formatTime(new Date())
      });
    } else if (memberData.role === 'coadmin') {
      await database.ref(`Users/CoAdmin/${memberId}`).update({
        email: newEmail,
        uid: newUid,
        dateModified: formatDate(new Date()),
        timeModified: formatTime(new Date())
      });
    }
    
    // STEP 3: Update all other records with new email
    await updateAllRecordsWithNewEmail(memberId, oldEmail, newEmail, formData.firstName, formData.lastName);
    
    // STEP 4: Mark old user for cleanup
    await markOldUserForDeletion(memberData.authUid, oldEmail, memberId);
    
    // Store pending add for email notification
    setPendingAdd({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: newEmail,
      oldEmail: oldEmail,
      password: newPassword,
      memberId: memberId,
      dateAdded: memberData.dateAdded,
      role: memberData.role || 'member',
      roleDisplay: memberData.role === 'admin' ? 'Administrator' : 
                  memberData.role === 'coadmin' ? 'Co-Admin' : 'Member',
      isEmailUpdate: true
    });
    
    return { 
      success: true, 
      password: newPassword,
      newUid: newUid
    };
    
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  } finally {
    setEmailChangeLoading(false);
  }
};

// Add this helper function
const markOldUserForDeletion = async (oldUid, oldEmail, memberId) => {
  try {
    // Store old user info for cleanup (can be processed by Cloud Function later)
    await database.ref(`UserCleanup/${oldUid}`).set({
      email: oldEmail,
      memberId: memberId,
      timestamp: new Date().toISOString(),
      reason: 'Email update during migration edit'
    });
    
    console.log(`Marked old user ${oldEmail} (UID: ${oldUid}) for cleanup`);
  } catch (error) {
    console.error('Error marking old user for deletion:', error);
    // Continue anyway - don't block the process
  }
};

const updateMemberReferences = async (memberId, newUid, newEmail, formData) => {
  try {
    // Get current member data
    const memberRef = database.ref(`Members/${memberId}`);
    
    // Prepare updated data
    const updatedData = {
      authUid: newUid,
      email: newEmail,
      phoneNumber: formData.phoneNumber || '',
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date()),
      role: formData.userRole || 'member'
    };
    
    // Update member data
    await memberRef.update(updatedData);
    
    console.log('Updated member references with new email and UID');
    return true;
  } catch (error) {
    console.error('Error updating member references:', error);
    throw error;
  }
};



const checkEmailInAdminCollections = async (email, memberId) => {
  try {
    // Get all admin and coadmin users
    const [adminSnap, coadminSnap] = await Promise.all([
      database.ref('Users/Admin').once('value'),
      database.ref('Users/CoAdmin').once('value')
    ]);
    
    const adminsData = adminSnap.val() || {};
    const coadminsData = coadminSnap.val() || {};
    
    // Combine all admin users
    const allAdminUsers = { ...adminsData, ...coadminsData };
    
    // Check if email exists in any admin user (excluding current member)
    for (const [id, adminData] of Object.entries(allAdminUsers)) {
      if (id !== memberId.toString() && 
          adminData.email && 
          adminData.email.toLowerCase() === email.toLowerCase()) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin collections:', error);
    return false;
  }
};


// Helper function to update member with new UID
const updateMemberWithNewUID = async (memberId, oldUid, newUid, newEmail, formData) => {
  try {
    // Get current member data
    const memberRef = database.ref(`Members/${memberId}`);
    const memberSnap = await memberRef.once('value');
    const currentData = memberSnap.val() || {};
    
    // Prepare updated data
    const updatedData = {
      ...currentData,
      authUid: newUid,
      email: newEmail,
      phoneNumber: formData.phoneNumber || currentData.phoneNumber,
      firstName: formData.firstName || currentData.firstName,
      lastName: formData.lastName || currentData.lastName,
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date()),
      role: formData.userRole || currentData.role || 'member'
    };
    
    // Update member data
    await memberRef.update(updatedData);
    
    // Update all loan records with new email
    await updateLoanRecordsWithNewEmail(memberId, newEmail, formData.firstName, formData.lastName);
    
    // Update all payment records with new email
    await updatePaymentRecordsWithNewEmail(memberId, newEmail, formData.firstName, formData.lastName);
    
    // Update all transaction records
    await updateTransactionRecordsWithNewEmail(memberId, newEmail);
    
    return true;
  } catch (error) {
    console.error('Error updating member with new UID:', error);
    throw error;
  }
};

// Helper function to update loan records
const updateLoanRecordsWithNewEmail = async (memberId, newEmail, firstName, lastName) => {
  try {
    const loanCollections = ['ApprovedLoans', 'CurrentLoans', 'PaidLoans'];
    
    for (const collection of loanCollections) {
      const loansRef = database.ref(`Loans/${collection}/${memberId}`);
      const loansSnap = await loansRef.once('value');
      const loans = loansSnap.val() || {};
      
      const updates = {};
      for (const [loanId, loanData] of Object.entries(loans)) {
        updates[`${loanId}/email`] = newEmail;
        updates[`${loanId}/firstName`] = firstName;
        updates[`${loanId}/lastName`] = lastName;
      }
      
      if (Object.keys(updates).length > 0) {
        await loansRef.update(updates);
      }
    }
    
    // Update Transactions/Loans
    const transactionsLoansRef = database.ref(`Transactions/Loans/${memberId}`);
    const transactionsSnap = await transactionsLoansRef.once('value');
    const transactions = transactionsSnap.val() || {};
    
    const transactionUpdates = {};
    for (const [transactionId, transactionData] of Object.entries(transactions)) {
      transactionUpdates[`${transactionId}/email`] = newEmail;
      transactionUpdates[`${transactionId}/firstName`] = firstName;
      transactionUpdates[`${transactionId}/lastName`] = lastName;
    }
    
    if (Object.keys(transactionUpdates).length > 0) {
      await transactionsLoansRef.update(transactionUpdates);
    }
    
    console.log('Updated loan records with new email');
  } catch (error) {
    console.error('Error updating loan records:', error);
  }
};

// Helper function to update payment records
const updatePaymentRecordsWithNewEmail = async (memberId, newEmail, firstName, lastName) => {
  try {
    // Update ApprovedPayments
    const paymentsRef = database.ref(`Payments/ApprovedPayments/${memberId}`);
    const paymentsSnap = await paymentsRef.once('value');
    const payments = paymentsSnap.val() || {};
    
    const paymentUpdates = {};
    for (const [paymentId, paymentData] of Object.entries(payments)) {
      paymentUpdates[`${paymentId}/email`] = newEmail;
      paymentUpdates[`${paymentId}/firstName`] = firstName;
      paymentUpdates[`${paymentId}/lastName`] = lastName;
    }
    
    if (Object.keys(paymentUpdates).length > 0) {
      await paymentsRef.update(paymentUpdates);
    }
    
    // Update Transactions/Payments
    const transactionsPaymentsRef = database.ref(`Transactions/Payments/${memberId}`);
    const transactionsSnap = await transactionsPaymentsRef.once('value');
    const transactions = transactionsSnap.val() || {};
    
    const transactionUpdates = {};
    for (const [transactionId, transactionData] of Object.entries(transactions)) {
      transactionUpdates[`${transactionId}/email`] = newEmail;
      transactionUpdates[`${transactionId}/firstName`] = firstName;
      transactionUpdates[`${transactionId}/lastName`] = lastName;
    }
    
    if (Object.keys(transactionUpdates).length > 0) {
      await transactionsPaymentsRef.update(transactionUpdates);
    }
    
    console.log('Updated payment records with new email');
  } catch (error) {
    console.error('Error updating payment records:', error);
  }
};

// Helper function to update transaction records
const updateTransactionRecordsWithNewEmail = async (memberId, newEmail) => {
  try {
    const transactionTypes = ['Registrations', 'Migrations'];
    
    for (const type of transactionTypes) {
      const transactionsRef = database.ref(`Transactions/${type}/${memberId}`);
      const transactionsSnap = await transactionsRef.once('value');
      const transactions = transactionsSnap.val() || {};
      
      const updates = {};
      for (const [transactionId, transactionData] of Object.entries(transactions)) {
        updates[`${transactionId}/email`] = newEmail;
      }
      
      if (Object.keys(updates).length > 0) {
        await transactionsRef.update(updates);
      }
    }
    
    console.log('Updated transaction records with new email');
  } catch (error) {
    console.error('Error updating transaction records:', error);
  }
};

// Helper function to delete old Firebase account
const deleteOldFirebaseAccount = async (oldUid) => {
  try {
    // This requires Cloud Functions for security
    // For now, we'll mark the old UID as inactive
    console.log(`Old Firebase account marked for deletion (UID: ${oldUid})`);
    console.log('Note: Implement Cloud Function to delete old Firebase users');
    
    // Alternative approach: Sign in with admin privileges
    try {
      // Try to delete using the Firebase Admin SDK (requires Cloud Functions)
      // For now, we'll just log this
      await database.ref(`InactiveUsers/${oldUid}`).set({
        deletedAt: new Date().toISOString(),
        reason: 'Email updated'
      });
      
      console.log(`Marked old UID ${oldUid} as inactive`);
    } catch (deleteError) {
      console.warn('Could not delete old Firebase user automatically:', deleteError);
      console.log('Old user account will need to be cleaned up manually');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteOldFirebaseAccount:', error);
    // Don't throw - we want to continue even if deletion fails
    return false;
  }
};

const updateRoleCollections = async (memberId, oldRole, newRole, newEmail, newUid) => {
  try {
    // Remove from old role collection
    if (oldRole === 'admin') {
      await database.ref(`Users/Admin/${memberId}`).remove();
    } else if (oldRole === 'coadmin') {
      await database.ref(`Users/CoAdmin/${memberId}`).remove();
    }
    
    // Add to new role collection
    if (newRole === 'admin') {
      const adminData = {
        id: memberId,
        uid: newUid,
        email: newEmail,
        role: 'admin',
        dateAdded: formatDate(new Date()),
        timeAdded: formatTime(new Date())
      };
      await database.ref(`Users/Admin/${memberId}`).set(adminData);
    } else if (newRole === 'coadmin') {
      const coadminData = {
        id: memberId,
        uid: newUid,
        email: newEmail,
        role: 'coadmin',
        dateAdded: formatDate(new Date()),
        timeAdded: formatTime(new Date())
      };
      await database.ref(`Users/CoAdmin/${memberId}`).set(coadminData);
    }
    
    console.log(`Updated role from ${oldRole} to ${newRole}`);
    return true;
  } catch (error) {
    console.error('Error updating role collections:', error);
    throw error;
  }
};

const markOldAccountForCleanup = async (oldUid, oldEmail) => {
  try {
    // Create a record of old account for cleanup (same as other roles)
    await database.ref(`OldAccounts/${oldUid}`).set({
      email: oldEmail,
      uid: oldUid,
      deletedAt: formatDate(new Date()),
      deletedTime: formatTime(new Date()),
      reason: 'Email updated during migration edit'
    });
    
    console.log(`Marked old account ${oldEmail} (UID: ${oldUid}) for cleanup`);
    return true;
  } catch (error) {
    console.error('Error marking old account for cleanup:', error);
    // Don't throw - we want to continue even if this fails
    return false;
  }
};

const updateEmailInCollection = async (collectionPath, newEmail, firstName, lastName) => {
  try {
    const ref = database.ref(collectionPath);
    const snapshot = await ref.once('value');
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const updates = {};
    const data = snapshot.val();
    
    // Handle both object and array-like structures
    if (typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key] === 'object') {
          updates[`${key}/email`] = newEmail;
          if (firstName) updates[`${key}/firstName`] = firstName;
          if (lastName) updates[`${key}/lastName`] = lastName;
        }
      });
    }
    
    if (Object.keys(updates).length > 0) {
      await ref.update(updates);
      console.log(`Updated ${Object.keys(updates).length} records in ${collectionPath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating ${collectionPath}:`, error);
    return false;
  }
};

// FIXED: Function to update all related records with new email
const updateAllRecordsWithNewEmail = async (memberId, oldEmail, newEmail, firstName, lastName) => {
  try {
    console.log(`Updating all records for member ${memberId} from ${oldEmail} to ${newEmail}`);
    
    // 1. Update member's own record
    await database.ref(`Members/${memberId}`).update({
      email: newEmail,
      firstName: firstName,
      lastName: lastName
    });
    
    // 2. Update loans in member's record
    await updateRecordsInPath(`Members/${memberId}/loans`, newEmail, firstName, lastName);
    
    // 3. Update in all loan collections
    const loanCollections = ['ApprovedLoans', 'CurrentLoans', 'PaidLoans', 'RejectedLoans'];
    for (const collection of loanCollections) {
      await updateRecordsInPath(`Loans/${collection}/${memberId}`, newEmail, firstName, lastName);
    }
    
    // 4. Update in all payment collections
    const paymentCollections = ['ApprovedPayments', 'PendingPayments', 'RejectedPayments'];
    for (const collection of paymentCollections) {
      await updateRecordsInPath(`Payments/${collection}/${memberId}`, newEmail, firstName, lastName);
    }
    
    // 5. Update in all transaction collections
    const transactionCollections = ['Loans', 'Payments', 'Registrations', 'Migrations', 'Withdrawals', 'Deposits'];
    for (const collection of transactionCollections) {
      await updateRecordsInPath(`Transactions/${collection}/${memberId}`, newEmail, firstName, lastName);
    }
    
    // 6. Update in Admin/CoAdmin collections if applicable
    const userRole = formData.userRole || 'member';
    if (userRole === 'admin') {
      await database.ref(`Users/Admin/${memberId}`).update({
        email: newEmail,
        firstName: firstName,
        lastName: lastName
      });
    } else if (userRole === 'coadmin') {
      await database.ref(`Users/CoAdmin/${memberId}`).update({
        email: newEmail,
        firstName: firstName,
        lastName: lastName
      });
    }
    
    console.log('All records updated with new email');
    return true;
    
  } catch (error) {
    console.error('Error updating records with new email:', error);
    throw error;
  }
};

// Helper function to update records in a specific path
const updateRecordsInPath = async (path, newEmail, firstName, lastName) => {
  try {
    const ref = database.ref(path);
    const snapshot = await ref.once('value');
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const updates = {};
    const data = snapshot.val();
    
    // Handle object structure
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        const record = data[key];
        
        if (record && typeof record === 'object') {
          // Update email field (could be 'email', 'memberEmail', 'emailAddress')
          if (record.email !== undefined) {
            updates[`${key}/email`] = newEmail;
          }
          if (record.memberEmail !== undefined) {
            updates[`${key}/memberEmail`] = newEmail;
          }
          if (record.emailAddress !== undefined) {
            updates[`${key}/emailAddress`] = newEmail;
          }
          
          // Update name fields
          if (firstName && record.firstName !== undefined) {
            updates[`${key}/firstName`] = firstName;
          }
          if (lastName && record.lastName !== undefined) {
            updates[`${key}/lastName`] = lastName;
          }
          if (firstName && lastName && record.fullName !== undefined) {
            updates[`${key}/fullName`] = `${firstName} ${lastName}`;
          }
          if (firstName && lastName && record.name !== undefined) {
            updates[`${key}/name`] = `${firstName} ${lastName}`;
          }
          
          // Update memberName if it exists
          if (firstName && lastName && record.memberName !== undefined) {
            updates[`${key}/memberName`] = `${firstName} ${lastName}`;
          }
        }
      });
    }
    
    if (Object.keys(updates).length > 0) {
      await ref.update(updates);
      console.log(`Updated ${Object.keys(updates).length / 3} records in ${path}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    return false;
  }
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


const submitAddMember = async () => {
  setConfirmModalVisible(false);
  setUploading(true);
  setIsProcessing(true);
  
  try {
    // Validate loans and payments
    if (existingLoans.length > 0 && !validateLoans()) {
      return;
    }
    
    // --- STEP 1: CREATE MEMBER ACCOUNT ---
    const password = generateRandomPassword();
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
    const userId = userCredential.user.uid;
    
    const newId = parseInt(formData.memberId);
    
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateAdded = formatDate(oneYearAgo);
    const timeAdded = formatTime(now);
    
    // Upload documents (for new members)
    const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newId}/valid_id_front_${Date.now()}`);
    const selfieUrl = await uploadImageToStorage(selfieFile, `member_docs/${newId}/selfie_${Date.now()}`);
    
    // Parse financials
    const investment = parseFloat(formData.investment || 0);
    const currentSavings = parseFloat(formData.currentSavings || 0);
    const balance = parseFloat(formData.balance || 0);
    
    // Create member data
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
      status: 'approved',
      balance: Math.round(balance * 100) / 100,
      investment: Math.round(investment * 100) / 100,
      currentSavings: Math.round(currentSavings * 100) / 100,
      loans: 0, // Will be updated by migration
      validIdFront: validIdFrontUrl,
      selfie: selfieUrl,
      initialPassword: password,
      isMigration: true,
      role: formData.userRole || 'member'
    };
    
    // Save member data
    if (formData.userRole === 'admin') {
      await database.ref(`Users/Admin/${newId}`).set({ ...memberData, uid: userId });
    } else if (formData.userRole === 'coadmin') {
      await database.ref(`Users/CoAdmin/${newId}`).set({ ...memberData, uid: userId });
    }
    
    await database.ref(`Members/${newId}`).set(memberData);
    
    // --- STEP 2: UPDATE SYSTEM FINANCIALS ---
    
    // Add investment to system funds
    if (investment > 0) {
      const fundsRef = database.ref('Settings/Funds');
      const newFunds = parseFloat((await fundsRef.once('value')).val() || 0) + investment;
      await fundsRef.set(Math.round(newFunds * 100) / 100);
      
      // Record in funds history
      await database.ref(`Settings/FundsHistory/${now.toISOString().replace(/[.#$[\]]/g, '_')}`)
        .set(Math.round(newFunds * 100) / 100);
    }
    
    // Add current savings to system savings
    if (currentSavings > 0) {
      const savingsRef = database.ref('Settings/Savings');
      const currentSavingsAmount = parseFloat((await savingsRef.once('value')).val() || 0);
      const newSavings = currentSavingsAmount + currentSavings;
      await savingsRef.set(Math.round(newSavings * 100) / 100);
      
      // Update savings history
      const dateKey = now.toISOString().split('T')[0];
      const savingsHistoryRef = database.ref('Settings/SavingsHistory');
      const currentDaySavings = parseFloat((await savingsHistoryRef.child(dateKey).once('value')).val()) || 0;
      
      await savingsHistoryRef.child(dateKey)
        .set(Math.round((currentDaySavings + currentSavings) * 100) / 100);
    }
    
    // --- STEP 3: MIGRATE LOANS AND PAYMENTS ---
    if (existingLoans.length > 0) {
      const migrationResult = await migrateLoansAndPayments(newId);
      
      console.log('Migration result:', migrationResult);
      
      // Update member's loans total
      await database.ref(`Members/${newId}/loans`).set(migrationResult.totalLoansAmount || 0);
    }
    
    // --- STEP 4: CREATE TRANSACTION RECORD ---
    await createMigrationTransaction(newId, memberData, existingLoans, paymentTransactions);
    
    // --- STEP 5: SEND EMAIL CREDENTIALS ---
    setPendingAdd({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: password,
      memberId: newId,
      dateAdded: dateAdded,
      role: formData.userRole || 'member'
    });
    
    // --- STEP 6: SUCCESS MESSAGE ---
    let successMsg = 'Member migrated successfully!';
    
    if (existingLoans.length > 0) {
      successMsg += ` ${existingLoans.length} loan(s) and ${paymentTransactions.length} payment(s) processed.`;
    }
    
    setSuccessMessage(successMsg);
    setSuccessModalVisible(true);
    
    // Close modal and refresh
    closeModals();
    await fetchMembers();
    
  } catch (error) {
    console.error('Error in member migration:', error);
    setErrorMessage(error.message || 'Failed to migrate member');
    setErrorModalVisible(true);
  } finally {
    setUploading(false);
    setIsProcessing(false);
  }
};


// Helper function: createMemberRegistrationTransaction
const createMemberRegistrationTransaction = async (memberId, memberData) => {
  try {
    const now = new Date();
    const transactionId = `REG-MIG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const registrationRecord = {
      transactionId,
      type: 'registration',
      amount: parseFloat(memberData.balance) || 0,
      investment: parseFloat(memberData.investment) || 0,
      savings: parseFloat(memberData.currentSavings) || 0,
      memberId: parseInt(memberId),
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      dateApproved: formatDate(now),
      approvedTime: formatTime(now),
      timestamp: now.getTime(),
      status: 'approved',
      description: 'Member registration migration',
      isMigration: true
    };
    
    // Save to Transactions/Registrations
    await database.ref(`Transactions/Registrations/${memberId}/${transactionId}`).set(registrationRecord);
    
    console.log(`Created registration transaction ${transactionId} for member ${memberId}`);
    return registrationRecord;
    
  } catch (error) {
    console.error('Error creating registration transaction:', error);
    throw error;
  }
};

const migrateLoansAndPayments = async (memberId) => {
  try {
    console.log(`Starting migration for member ${memberId}`);
    
    let totalLoansAmount = 0;
    let totalProcessingFees = 0;
    let totalInterestForYields = 0;
    
    // STEP 1: CREATE ALL LOANS
    const loanResults = [];
    
    for (const loan of existingLoans) {
      if (loan.loanType && loan.loanAmount && loan.term) {
        console.log(`Creating loan: ${loan.loanType} - ${loan.loanAmount}`);
        
        const loanResult = await createLoanRecord(memberId, loan);
        loanResults.push(loanResult);
        
        totalLoansAmount += parseFloat(loan.loanAmount);
        totalProcessingFees += parseFloat(loanResult.calculations.processingFee || 0);
      }
    }
    
    // STEP 2: ADD PROCESSING FEES TO SYSTEM SAVINGS
    if (totalProcessingFees > 0) {
      const savingsRef = database.ref('Settings/Savings');
      const currentSavings = parseFloat((await savingsRef.once('value')).val()) || 0;
      const newSavings = currentSavings + totalProcessingFees;
      
      await savingsRef.set(Math.round(newSavings * 100) / 100);
    }
    
    // STEP 3: CREATE PAYMENTS
    for (const payment of paymentTransactions) {
      if (payment.loanTransactionId && payment.paymentAmount) {
        console.log(`Processing payment for loan ${payment.loanTransactionId}: ${payment.paymentAmount}`);
        
        const linkedLoan = existingLoans.find(loan => 
          loan.transactionId === payment.loanTransactionId
        );
        
        if (linkedLoan) {
          // Create payment record
          const paymentResult = await createPaymentRecord(memberId, payment, linkedLoan);
          
          // CRITICAL FIX: Sync CurrentLoans after payment
          await syncCurrentLoansWithApprovedLoans(memberId, payment.loanTransactionId);
          
          totalInterestForYields += parseFloat(paymentResult.allocation.interestPaid) || 0;
        }
      }
    }
    
    // STEP 4: ADD ACCUMULATED INTEREST TO YIELDS
    if (totalInterestForYields > 0) {
      await addInterestToYields(totalInterestForYields);
    }
    
    // STEP 5: Update member's total loans amount
    if (totalLoansAmount > 0) {
      await database.ref(`Members/${memberId}/loans`).set(Math.round(totalLoansAmount * 100) / 100);
    }
    
    return {
      success: true,
      loansCreated: loanResults.length,
      totalLoansAmount,
      totalProcessingFees,
      totalInterestForYields
    };
    
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  }
};

const addInterestToYields = async (interestAmount) => {
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    
    // Get current yields
    const yieldsRef = database.ref('Settings/Yields');
    const yieldsSnap = await yieldsRef.once('value');
    let currentYields = parseFloat(yieldsSnap.val()) || 0;
    
    // Add interest
    currentYields = Math.round((currentYields + interestAmount) * 100) / 100;
    await yieldsRef.set(currentYields);
    
    // Update yields history
    const yieldsHistoryRef = database.ref('Settings/YieldsHistory');
    const dateYieldsSnap = await yieldsHistoryRef.child(dateKey).once('value');
    let dateYields = parseFloat(dateYieldsSnap.val()) || 0;
    
    dateYields = Math.round((dateYields + interestAmount) * 100) / 100;
    await yieldsHistoryRef.child(dateKey).set(dateYields);
    
    console.log(`Added ${formatCurrency(interestAmount)} to yields. Total: ${formatCurrency(currentYields)}`);
    
    return true;
  } catch (error) {
    console.error('Error adding to yields:', error);
    throw error;
  }
};

const calculateActualDueDate = (approvalDate, remainingMonths) => {
    if (!approvalDate) return '';

    try {
        const date = new Date(approvalDate);
        
        // If there are no remaining months, the loan is paid
        if (remainingMonths <= 0) return 'Paid'; 

        // Get the day of the month for consistency
        const dayOfMonth = date.getDate();

        // Add the remaining months to the original date
        let newDueDate = new Date(date);
        newDueDate.setMonth(newDueDate.getMonth() + remainingMonths);

        // Handle month-end issues (e.g., setting the date of a 31-day month to a 30-day month)
        if (newDueDate.getDate() !== dayOfMonth) {
            newDueDate.setDate(0); // Set to the last day of the preceding month
        }
        
        return formatDate(newDueDate);
    } catch (error) {
        console.error('Error calculating actual due date:', error);
        return 'N/A';
    }
};

const syncCurrentLoansWithApprovedLoans = async (memberId, loanTransactionId) => {
  try {
    // Get the correct loan data from ApprovedLoans
    const approvedLoanSnap = await database.ref(`Loans/ApprovedLoans/${memberId}/${loanTransactionId}`).once('value');
    const approvedLoan = approvedLoanSnap.val();
    
    if (!approvedLoan) {
      console.error(`Loan ${loanTransactionId} not found in ApprovedLoans`);
      return;
    }
    
    // FIX: Ensure dueDate format is consistent
    if (approvedLoan.dueDate && approvedLoan.dueDate.includes('-')) {
      // Convert YYYY-MM-DD to May 5, 2025 format
      const dateParts = approvedLoan.dueDate.split('-');
      if (dateParts.length === 3) {
        const [year, month, day] = dateParts;
        const date = new Date(year, month - 1, day);
        approvedLoan.dueDate = formatDate(date);
      }
    }
    
    // Copy exact same data to CurrentLoans
    await database.ref(`Loans/CurrentLoans/${memberId}/${loanTransactionId}`).set(approvedLoan);
    
    console.log(`Synced CurrentLoans with ApprovedLoans for loan ${loanTransactionId}`);
    
  } catch (error) {
    console.error('Error syncing CurrentLoans:', error);
  }
};

const createLoanRecord = async (memberId, loanData) => {
  try {
    const now = new Date();
    
    // Parse all values
    const originalLoanAmount = parseFloat(loanData.loanAmount) || 0;
    const termMonths = parseInt(loanData.term) || 0;
    const interestRatePercentage = parseFloat(loanData.interestRate) || 0;
    const interestRateDecimal = interestRatePercentage / 100;
    const paymentsMade = parseInt(loanData.paymentsMade) || 0;
    const processingFee = parseFloat(loanData.processingFee) || 
                         parseFloat(formData.processingFee) || 
                         parseFloat(processingFee) || 0;
    
    // --- CALCULATIONS ---
    const interestPerTerm = Math.round(originalLoanAmount * interestRateDecimal * 100) / 100;
    const totalInterest = Math.round(interestPerTerm * termMonths * 100) / 100;
    const totalTermPayment = Math.round((originalLoanAmount + totalInterest) * 100) / 100;
    const monthlyPrincipal = Math.round(originalLoanAmount / termMonths * 100) / 100;
    const totalMonthlyPayment = Math.round(totalTermPayment / termMonths * 100) / 100;
    const releaseAmount = Math.max(0, Math.round((originalLoanAmount - processingFee) * 100) / 100);
    
    // Use manual outstanding balance from form
    const outstandingBalance = parseFloat(loanData.outstandingBalance) || totalTermPayment;
    
    // Calculate amount paid correctly
    const amountPaid = totalTermPayment - outstandingBalance;
    
    // Calculate interest paid based on payments made
    const interestPaidSoFar = Math.min(
      totalInterest, 
      Math.round(paymentsMade * interestPerTerm * 100) / 100
    );
    
    // Calculate principal paid correctly
    const principalPaidSoFar = Math.max(0, amountPaid - interestPaidSoFar);
    
    // Calculate remaining months
    const remainingMonths = Math.max(0, termMonths - paymentsMade);
    
    // CRITICAL FIX: dueDate format should match dateApproved format
    let dueDate = 'N/A';
    const approvalDate = new Date(loanData.dateApproved || now);
    
    if (remainingMonths <= 0) {
      dueDate = 'Paid';
    } else if (paymentsMade > 0) {
      // Payments have been made
      const paymentsForThisLoan = paymentTransactions.filter(payment => 
        payment.loanTransactionId === loanData.transactionId
      );
      
      if (paymentsForThisLoan.length > 0) {
        const sortedPayments = paymentsForThisLoan.sort((a, b) => 
          new Date(b.paymentDate) - new Date(a.paymentDate)
        );
        
        const lastPaymentDate = new Date(sortedPayments[0].paymentDate);
        const nextDueDate = new Date(lastPaymentDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // FIX: Use same format as dateApproved (May 5, 2025)
        dueDate = formatDate(nextDueDate);
      } else {
        const nextDueDate = new Date(approvalDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + paymentsMade);
        
        // FIX: Use same format as dateApproved
        dueDate = formatDate(nextDueDate);
      }
    } else {
      const firstDueDate = new Date(approvalDate);
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
      
      // FIX: Use same format as dateApproved
      dueDate = formatDate(firstDueDate);
    }
    
    // Generate transaction ID
    const transactionId = loanData.transactionId || 
                         Math.floor(100000 + Math.random() * 900000).toString();
    
    // Format dates consistently
    const formattedApprovalDate = loanData.dateApproved ? 
                                 new Date(loanData.dateApproved) : now;
    
    // --- PREPARE LOAN RECORD ---
    const loanRecord = {
      // Basic Information
      transactionId,
      id: memberId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      
      // Loan Details
      loanType: loanData.loanType,
      term: termMonths,
      loanAmount: Math.round(originalLoanAmount * 100) / 100,
      
      // Financial Calculations
      interestRate: interestRatePercentage,
      interest: Math.round(interestPerTerm * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      monthlyPrincipal: Math.round(monthlyPrincipal * 100) / 100,
      monthlyPayment: Math.round(monthlyPrincipal * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      totalTermPayment: Math.round(totalTermPayment * 100) / 100,
      
      // Processing Fee
      processingFee: Math.round(processingFee * 100) / 100,
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      
      // Current State
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      remainingBalance: Math.round(outstandingBalance * 100) / 100,
      paymentsMade: paymentsMade,
      monthsRemaining: remainingMonths,
      amountPaid: Math.round(amountPaid * 100) / 100,
      interestPaid: Math.round(interestPaidSoFar * 100) / 100,
      principalPaid: Math.round(principalPaidSoFar * 100) / 100,
      
      // Dates - ALL CONSISTENT FORMAT
      dateApplied: `${formatDate(formattedApprovalDate)} at ${formatTime(formattedApprovalDate)}`,
      dateApproved: formatDate(formattedApprovalDate),
      timeApproved: formatTime(formattedApprovalDate),
      timestamp: formattedApprovalDate.getTime(),
      
      // FIX: dueDate uses same format as dateApproved
      dueDate: dueDate,
      
      // Disbursement Information
      disbursement: loanData.disbursement || 'Cash',
      accountName: loanData.accountName || '',
      accountNumber: loanData.accountNumber || '',
      bankType: loanData.bankType || '',
      
      // Status
      status: 'approved',
      
      // Migration Flag
      isMigration: true,
      isExistingLoan: true
    };
    
    // Add completion date if fully paid
    if (outstandingBalance <= 0) {
      loanRecord.status = 'paid';
      loanRecord.dateCompleted = formatDate(now);
      loanRecord.timeCompleted = formatTime(now);
      loanRecord.dueDate = 'Paid';
    }
    
    // --- SAVE TO DATABASE ---
    
    // 1. Save to ApprovedLoans
    await database.ref(`Loans/ApprovedLoans/${memberId}/${transactionId}`).set(loanRecord);
    
    // 2. Save to CurrentLoans if not fully paid
    if (loanRecord.status === 'approved' && outstandingBalance > 0) {
      await database.ref(`Loans/CurrentLoans/${memberId}/${transactionId}`).set(loanRecord);
    } else if (loanRecord.status === 'paid') {
      await database.ref(`Loans/PaidLoans/${memberId}/${transactionId}`).set(loanRecord);
    }
    
    // 3. Save to Transactions
    await database.ref(`Transactions/Loans/${memberId}/${transactionId}`).set({
      ...loanRecord,
      label: 'Loan',
      type: 'Loans'
    });
    
    // 4. Save to Member's loans
    await database.ref(`Members/${memberId}/loans/${transactionId}`).set(loanRecord);
    
    console.log(`Created loan record ${transactionId}:`);
    console.log('- dateApproved:', loanRecord.dateApproved);
    console.log('- dueDate:', loanRecord.dueDate);
    
    return {
      transactionId,
      loanRecord,
      calculations: {
        originalLoanAmount,
        processingFee,
        releaseAmount,
        totalTermPayment,
        totalMonthlyPayment,
        interestPerTerm,
        totalInterest,
        dueDate
      }
    };
    
  } catch (error) {
    console.error('Error creating loan record:', error);
    throw new Error(`Failed to create loan record: ${error.message}`);
  }
};

const updateCurrentLoanFromPayment = async (memberId, loanTransactionId, paymentData, linkedLoan) => {
  try {
    // Get current loan from CurrentLoans
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${memberId}/${loanTransactionId}`);
    const loanSnap = await currentLoanRef.once('value');
    let currentLoan = loanSnap.val();
    
    if (!currentLoan) {
      console.log(`Loan ${loanTransactionId} not found in CurrentLoans`);
      
      // Try to get from ApprovedLoans to create in CurrentLoans
      const approvedLoanSnap = await database.ref(`Loans/ApprovedLoans/${memberId}/${loanTransactionId}`).once('value');
      currentLoan = approvedLoanSnap.val();
      
      if (!currentLoan) {
        console.error(`Loan ${loanTransactionId} not found anywhere`);
        return;
      }
      
      // Create in CurrentLoans using ApprovedLoans data
      await currentLoanRef.set(currentLoan);
      console.log(`Created loan ${loanTransactionId} in CurrentLoans from ApprovedLoans`);
    }
    
    // Parse payment amounts
    const paymentAmount = parseFloat(paymentData.paymentAmount) || 0;
    const principalPaid = parseFloat(paymentData.principalPaid) || 0;
    const interestPaid = parseFloat(paymentData.interestPaid) || 0;
    const penaltyPaid = parseFloat(paymentData.penaltyPaid) || 0;
    
    // Get current values from CurrentLoans
    const currentLoanAmount = parseFloat(currentLoan.loanAmount) || 0;
    const currentOutstanding = parseFloat(currentLoan.outstandingBalance) || 
                               parseFloat(currentLoan.remainingBalance) || 0;
    
    const currentAmountPaid = parseFloat(currentLoan.amountPaid) || 0;
    const currentInterestPaid = parseFloat(currentLoan.interestPaid) || 0;
    const currentPrincipalPaid = parseFloat(currentLoan.principalPaid) || 0;
    const currentPaymentsMade = parseInt(currentLoan.paymentsMade) || 0;
    
    // Calculate new values
    const newLoanAmount = Math.max(0, currentLoanAmount - principalPaid);
    const newOutstanding = Math.max(0, currentOutstanding - principalPaid);
    const newAmountPaid = currentAmountPaid + paymentAmount;
    const newInterestPaid = currentInterestPaid + interestPaid;
    const newPrincipalPaid = currentPrincipalPaid + principalPaid;
    
    // CRITICAL: Do NOT increment paymentsMade for migration payments
    const newPaymentsMade = currentPaymentsMade; // Don't increment!
    
    // Calculate months remaining
    const totalTerm = parseInt(currentLoan.term) || 0;
    const newMonthsRemaining = Math.max(0, totalTerm - newPaymentsMade);
    
    // CRITICAL FIX: DO NOT recalculate interest! Use the ORIGINAL interest from ApprovedLoans
    // Get the original loan data from ApprovedLoans
    const approvedLoanSnap = await database.ref(`Loans/ApprovedLoans/${memberId}/${loanTransactionId}`).once('value');
    const approvedLoan = approvedLoanSnap.val();
    
    // Use ORIGINAL values from ApprovedLoans
    const originalInterest = parseFloat(approvedLoan.interest) || 0; // FIXED monthly interest
    const originalMonthlyPrincipal = parseFloat(approvedLoan.monthlyPrincipal) || 0;
    const originalMonthlyPayment = parseFloat(approvedLoan.monthlyPayment) || 0;
    const originalTotalMonthlyPayment = parseFloat(approvedLoan.totalMonthlyPayment) || 0;
    
    // Calculate new due date
    const baseApprovalDate = linkedLoan?.dateApproved || currentLoan.dateApproved;
    const newDueDate = calculateActualDueDate(baseApprovalDate, newMonthsRemaining);

    // Prepare updates for CurrentLoans ONLY
    const updates = {
      // Update loan amount (principal remaining)
      loanAmount: Math.round(newLoanAmount * 100) / 100,
      
      // Update balances
      outstandingBalance: Math.round(newOutstanding * 100) / 100,
      remainingBalance: Math.round(newOutstanding * 100) / 100,
      amountPaid: Math.round(newAmountPaid * 100) / 100,
      interestPaid: Math.round(newInterestPaid * 100) / 100,
      principalPaid: Math.round(newPrincipalPaid * 100) / 100,
      
      paymentsMade: newPaymentsMade,
      monthsRemaining: newMonthsRemaining,
      dueDate: newDueDate, 
      
      // CRITICAL: Use ORIGINAL values from ApprovedLoans (do NOT recalculate!)
      monthlyPrincipal: originalMonthlyPrincipal,
      monthlyPayment: originalMonthlyPayment,
      totalMonthlyPayment: originalTotalMonthlyPayment,
      interest: originalInterest, // Keep the same interest as ApprovedLoans
      
      // Update timestamps
      lastPaymentDate: paymentData.paymentDate || formatDate(new Date()),
      lastPaymentTime: paymentData.paymentTime || formatTime(new Date()),
      lastPaymentAmount: Math.round(paymentAmount * 100) / 100,
      totalPenaltyPaid: (parseFloat(currentLoan.totalPenaltyPaid) || 0) + penaltyPaid,
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date())
    };
    
    // Check if loan is fully paid
    if (newOutstanding <= 0.01) {
      updates.status = 'paid';
      updates.dateCompleted = formatDate(new Date());
      updates.timeCompleted = formatTime(new Date());
      updates.loanAmount = 0;
      updates.monthlyPayment = 0;
      updates.totalMonthlyPayment = 0;
      updates.interest = 0;
      updates.dueDate = 'Paid';
      
      // Move to PaidLoans
      const paidLoanData = {
        ...currentLoan,
        ...updates
      };
      
      await database.ref(`Loans/PaidLoans/${memberId}/${loanTransactionId}`).set(paidLoanData);
      
      // Remove from CurrentLoans
      await currentLoanRef.remove();
      
      console.log(`Loan ${loanTransactionId} fully paid, moved to PaidLoans`);
    } else {
      // Update CurrentLoans
      await currentLoanRef.update(updates);
    }
    
    console.log(`Updated CurrentLoans: 
      Loan Amount: ${newLoanAmount}, 
      Outstanding: ${newOutstanding},
      Interest (fixed): ${originalInterest},
      Payments Made: ${newPaymentsMade},
      New Due Date: ${newDueDate}`);
    
  } catch (error) {
    console.error('Error updating CurrentLoans from payment:', error);
    throw error;
  }
};

const updateCurrentLoanAfterPayment = async (memberId, loanTransactionId, paymentData, linkedLoan) => {
  try {
    // Get current loan from CurrentLoans
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${memberId}/${loanTransactionId}`);
    const loanSnap = await currentLoanRef.once('value');
    const currentLoan = loanSnap.val();
    
    if (!currentLoan) {
      console.log(`Loan ${loanTransactionId} not found in CurrentLoans, skipping update`);
      return;
    }
    
    // Get original data from ApprovedLoans
    const approvedLoanSnap = await database.ref(`Loans/ApprovedLoans/${memberId}/${loanTransactionId}`).once('value');
    const approvedLoan = approvedLoanSnap.val();
    
    const paymentAmount = parseFloat(paymentData.amountToBePaid) || 0;
    const principalPaid = parseFloat(paymentData.principalPaid) || 0;
    const interestPaid = parseFloat(paymentData.interestPaid) || 0;
    const penaltyPaid = parseFloat(paymentData.penaltyPaid) || 0;
    
    // Calculate new outstanding balance
    const currentOutstanding = parseFloat(currentLoan.outstandingBalance) || parseFloat(currentLoan.remainingBalance) || 0;
    const newOutstanding = Math.max(0, currentOutstanding - principalPaid);
    
    // Calculate new amounts paid
    const currentAmountPaid = parseFloat(currentLoan.amountPaid) || 0;
    const newAmountPaid = currentAmountPaid + paymentAmount;
    
    const currentInterestPaid = parseFloat(currentLoan.interestPaid) || 0;
    const newInterestPaid = currentInterestPaid + interestPaid;
    
    const currentPrincipalPaid = parseFloat(currentLoan.principalPaid) || 0;
    const newPrincipalPaid = currentPrincipalPaid + principalPaid;
    
    // Calculate new payments made (Standard operation increments by 1)
    const currentPaymentsMade = parseInt(currentLoan.paymentsMade) || 0;
    const newPaymentsMade = currentPaymentsMade + 1;
    
    // Calculate months remaining
    const totalTerm = parseInt(currentLoan.term) || 0;
    const newMonthsRemaining = Math.max(0, totalTerm - newPaymentsMade);

    // Calculate new due date
    const baseApprovalDate = linkedLoan?.dateApproved || currentLoan.dateApproved;
    const newDueDate = calculateActualDueDate(baseApprovalDate, newMonthsRemaining);

    // Prepare updates for CurrentLoans
    const updates = {
      outstandingBalance: Math.round(newOutstanding * 100) / 100,
      remainingBalance: Math.round(newOutstanding * 100) / 100,
      amountPaid: Math.round(newAmountPaid * 100) / 100,
      interestPaid: Math.round(newInterestPaid * 100) / 100,
      principalPaid: Math.round(newPrincipalPaid * 100) / 100,
      paymentsMade: newPaymentsMade,
      monthsRemaining: newMonthsRemaining,
      dueDate: newDueDate,
      
      // CRITICAL: Keep ORIGINAL values from ApprovedLoans
      interest: parseFloat(approvedLoan.interest) || 0, // Fixed monthly interest
      monthlyPrincipal: parseFloat(approvedLoan.monthlyPrincipal) || 0,
      monthlyPayment: parseFloat(approvedLoan.monthlyPayment) || 0,
      totalMonthlyPayment: parseFloat(approvedLoan.totalMonthlyPayment) || 0,
      
      lastPaymentDate: formatDate(new Date()),
      lastPaymentTime: formatTime(new Date()),
      lastPaymentAmount: Math.round(paymentAmount * 100) / 100,
      totalPenaltyPaid: (parseFloat(currentLoan.totalPenaltyPaid) || 0) + penaltyPaid
    };
    
    // Check if loan is fully paid
    if (newOutstanding <= 0) {
      updates.status = 'paid';
      updates.dateCompleted = formatDate(new Date());
      updates.timeCompleted = formatTime(new Date());
      
      // Move to PaidLoans
      const paidLoanData = {
        ...currentLoan,
        ...updates
      };
      
      await database.ref(`Loans/PaidLoans/${memberId}/${loanTransactionId}`).set(paidLoanData);
      
      // Remove from CurrentLoans
      await currentLoanRef.remove();
      
      console.log(`Loan ${loanTransactionId} fully paid, moved to PaidLoans`);
    } else {
      // Update CurrentLoans
      await currentLoanRef.update(updates);
      console.log(`Updated CurrentLoans for loan ${loanTransactionId}`);
    }
    
    // Also update the loan in Transactions/Loans
    await database.ref(`Transactions/Loans/${memberId}/${loanTransactionId}`).update(updates);
    
    // Update member's loan record
    await database.ref(`Members/${memberId}/loans/${loanTransactionId}`).update(updates);
    
  } catch (error) {
    console.error('Error updating CurrentLoans after payment:', error);
    throw error;
  }
};


const createPaymentRecord = async (memberId, paymentData, linkedLoan) => {
  try {
    const now = new Date();
    const transactionId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Parse payment amounts
    const paymentAmount = parseFloat(paymentData.paymentAmount) || 0;
    
    // Use provided allocation or calculate it
    let penaltyPaid = parseFloat(paymentData.penaltyPaid) || 0;
    let interestPaid = parseFloat(paymentData.interestPaid) || 0;
    let principalPaid = parseFloat(paymentData.principalPaid) || 0;
    let excessPayment = parseFloat(paymentData.excessPayment) || 0;
    
    // If not provided, calculate allocation
    if (!paymentData.interestPaid && !paymentData.principalPaid && linkedLoan) {
      const outstandingBalance = parseFloat(linkedLoan.outstandingBalance) || 
                                parseFloat(linkedLoan.remainingBalance) || 0;
      
      const allocation = calculatePaymentAllocation(paymentAmount, linkedLoan);
      penaltyPaid = allocation.penaltyPaid;
      interestPaid = allocation.interestPaid;
      principalPaid = allocation.principalPaid;
      excessPayment = allocation.excessPayment;
    }
    
    // Parse payment date
    let paymentDate = new Date(paymentData.paymentDate || now);
    let paymentTime = paymentData.paymentTime || formatTime(now);
    
    // Update the linked loan's due date - with correct format
    if (linkedLoan && linkedLoan.transactionId) {
      // Calculate new due date for the loan
      const nextDueDate = new Date(paymentDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      
      // FIX: Use formatDate() for dueDate
      await database.ref(`Loans/CurrentLoans/${memberId}/${linkedLoan.transactionId}`).update({
        dueDate: formatDate(nextDueDate), // FIXED: Use formatDate()
        lastPaymentDate: formatDate(paymentDate),
        lastPaymentTime: paymentTime
      });
    }
    
    // Prepare payment record
    const paymentRecord = {
      transactionId,
      id: memberId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      
      // Payment Details
      amountToBePaid: Math.round(paymentAmount * 100) / 100,
      paymentOption: paymentData.paymentMethod || 'Cash',
      accountName: paymentData.accountName || '',
      accountNumber: paymentData.accountNumber || '',
      bankType: paymentData.bankType || '',
      proofOfPaymentUrl: paymentData.proofOfPaymentUrl || null,
      
      // Allocation Breakdown
      penalty: Math.round(penaltyPaid * 100) / 100,
      penaltyPaid: Math.round(penaltyPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      excessPayment: Math.round(excessPayment * 100) / 100,
      
      // Linked Loan
      selectedLoanId: paymentData.loanTransactionId,
      
      // Dates - All consistent format
      dateApplied: `${formatDate(paymentDate)} at ${paymentTime}`,
      dateApproved: formatDate(paymentDate),
      timeApproved: paymentTime,
      timestamp: paymentDate.getTime(),
      
      // Status
      status: 'approved',
      
      // Migration Flags
      isMigration: true,
      isExistingPayment: true
    };
    
    // --- SAVE TO DATABASE ---
    
    // 1. Save to ApprovedPayments
    await database.ref(`Payments/ApprovedPayments/${memberId}/${transactionId}`).set(paymentRecord);
    
    // 2. Save to Transactions
    await database.ref(`Transactions/Payments/${memberId}/${transactionId}`).set({
      ...paymentRecord,
      label: 'Payment',
      type: 'Payments'
    });
    
    return {
      transactionId,
      paymentRecord,
      allocation: {
        penaltyPaid,
        interestPaid,
        principalPaid,
        excessPayment
      }
    };
    
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw new Error(`Failed to create payment record: ${error.message}`);
  }
};
const submitEditMember = async (skipEmailConfirmation = false) => {
  if (!editingMember) return;
  
  // Clear previous errors
  setEmailError('');
  setFirstNameError('');
  setLastNameError('');
  setPhoneNumberError('');
  setMemberIdError('');
  
  // Validate basic fields first
  if (!formData.firstName.trim()) {
    setFirstNameError('First name is required');
    return;
  }
  
  if (!formData.lastName.trim()) {
    setLastNameError('Last name is required');
    return;
  }
  
  if (!formData.email.trim()) {
    setEmailError('Email is required');
    return;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    setEmailError('Invalid email format');
    return;
  }
  
  if (!formData.phoneNumber.trim()) {
    setPhoneNumberError('Contact number is required');
    return;
  } else if (!/^\d{11}$/.test(formData.phoneNumber)) {
    setPhoneNumberError('Contact number must be exactly 11 digits');
    return;
  }
  
  // Check if ID is being changed
  const isIdChanged = formData.memberId !== editingMember.id.toString();
  
  if (isIdChanged) {
    // Validate new ID
    const validation = validateMemberId(formData.memberId, editingMember.id);
    if (!validation.valid) {
      setMemberIdError(validation.error);
      return;
    }
    
    // Check impact of ID change
    try {
      const impact = await checkIdChangeImpact(editingMember.id, formData.memberId);
      setIdChangeInfo({
        oldId: editingMember.id,
        newId: parseInt(formData.memberId),
        impact,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isEmailChanged: formData.email !== editingMember.email
      });
      setIdChangeModalVisible(true);
      return;
    } catch (error) {
      console.error('Error checking ID change impact:', error);
      setErrorMessage('Failed to check ID change impact. Please try again.');
      setErrorModalVisible(true);
      return;
    }
  }
  
  // If ID not changed, check if email is being changed
  const isEmailChanged = formData.email !== editingMember.email;
  
  if (isEmailChanged && !skipEmailConfirmation) {
    setEmailChangeInfo({
      oldEmail: editingMember.email,
      newEmail: formData.email,
      memberId: editingMember.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.userRole || 'member'
    });
    setEmailChangeModalVisible(true);
    return;
  }
  
  // If neither ID nor email changed, or skipping confirmation, proceed with update
  await processMemberUpdate(editingMember.id, false);
};

const processMemberUpdate = async (memberId, isIdChanged = false) => {
  setUploading(true);
  setIsProcessing(true);
  
  try {
    const now = new Date();
    const newMemberId = isIdChanged ? parseInt(formData.memberId) : memberId;
    const isEmailChanged = formData.email !== editingMember.email;
    
    let emailUpdateResult = null;
    let newUid = editingMember.authUid;
    
    // STEP 1: Handle email update if changed
    if (isEmailChanged) {
      emailUpdateResult = await handleEmailUpdate(
        editingMember.email,
        formData.email,
        newMemberId,
        editingMember,
        formData
      );
      
      if (emailUpdateResult?.newUid) {
        newUid = emailUpdateResult.newUid;
      }
    }
    
    // STEP 2: Prepare member data updates
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
      currentSavings: parseFloat(formData.currentSavings || editingMember.currentSavings || 0),
      dateModified: formatDate(now),
      timeModified: formatTime(now),
      role: formData.userRole || 'member'
    };
    
    // Add email and UID if changed
    if (isEmailChanged) {
      updates.email = formData.email;
      updates.authUid = newUid;
    }
    
    // STEP 3: Update member record
    await database.ref(`Members/${newMemberId}`).update(updates);
    
    // STEP 4: If email changed, update all records
    if (isEmailChanged) {
      await updateAllRecordsWithNewEmail(
        newMemberId,
        editingMember.email,
        formData.email,
        formData.firstName,
        formData.lastName
      );
    }
    
    // STEP 5: Update role-specific collections
    const userRole = formData.userRole || 'member';
    const oldRole = editingMember.role || 'member';
    
    if (userRole !== oldRole || isEmailChanged) {
      // Remove from old role collection if role changed or email changed
      if (oldRole === 'admin') {
        await database.ref(`Users/Admin/${editingMember.id}`).remove();
      } else if (oldRole === 'coadmin') {
        await database.ref(`Users/CoAdmin/${editingMember.id}`).remove();
      }
      
      // Add to new role collection
      if (userRole === 'admin') {
        await database.ref(`Users/Admin/${newMemberId}`).set({
          id: newMemberId,
          uid: newUid,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          role: 'admin',
          dateModified: formatDate(now),
          timeModified: formatTime(now)
        });
      } else if (userRole === 'coadmin') {
        await database.ref(`Users/CoAdmin/${newMemberId}`).set({
          id: newMemberId,
          uid: newUid,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          role: 'coadmin',
          dateModified: formatDate(now),
          timeModified: formatTime(now)
        });
      }
    }
    
    // STEP 6: Handle loans and payments
    await updateLoansAndPayments(newMemberId);
    
    // STEP 7: Upload new images if provided
    if (validIdFrontFile) {
      const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newMemberId}/valid_id_front_${Date.now()}`);
      await database.ref(`Members/${newMemberId}`).update({ validIdFront: validIdFrontUrl });
    }
    
    if (selfieFile) {
      const selfieUrl = await uploadImageToStorage(selfieFile, `member_docs/${newMemberId}/selfie_${Date.now()}`);
      await database.ref(`Members/${newMemberId}`).update({ selfie: selfieUrl });
    }
    
    // STEP 8: Prepare success message
    let successMsg = 'Member updated successfully!';
    let roleDisplay = userRole === 'admin' ? 'Administrator' : 
                     userRole === 'coadmin' ? 'Co-Admin' : 'Member';
    
    if (isEmailChanged && emailUpdateResult?.password) {
      successMsg = `${roleDisplay} updated successfully! New login credentials have been sent to ${formData.email}`;
      
      // Store pending add for email notification
      setPendingAdd({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        oldEmail: editingMember.email,
        password: emailUpdateResult.password,
        memberId: newMemberId,
        dateAdded: editingMember.dateAdded,
        role: userRole,
        isEmailUpdate: true,
        roleDisplay: roleDisplay
      });
    } else if (userRole !== oldRole) {
      successMsg = `${roleDisplay} updated successfully! Role changed from ${oldRole} to ${userRole}.`;
    }
    
    // Add loan/payment update info
    if (existingLoans.length > 0 || paymentTransactions.length > 0) {
      successMsg += ` Loans and payments have been updated.`;
    }
    
    setSuccessMessage(successMsg);
    setSuccessModalVisible(true);
    
    // Close modal and refresh
    closeModals();
    await fetchMembers();
    
  } catch (error) {
    console.error('Error updating member:', error);
    setErrorMessage(error.message || 'Failed to update member');
    setErrorModalVisible(true);
  } finally {
    setUploading(false);
    setIsProcessing(false);
  }
};

const handleIdChange = async () => {
  if (!idChangeInfo || !editingMember) {
    setErrorMessage('Cannot change ID: Member information is missing.');
    setErrorModalVisible(true);
    return;
  }
  
  setIdChangeLoading(true);
  
  try {
    // Get current member data
    const memberRef = database.ref(`Members/${idChangeInfo.oldId}`);
    const memberSnap = await memberRef.once('value');
    const currentData = memberSnap.val();
    
    if (!currentData) {
      throw new Error('Member data not available. Please close and reopen the edit modal.');
    }
    
    // Prepare updated member data with new ID
    const updatedMemberData = {
      ...currentData,
      id: idChangeInfo.newId,
      email: idChangeInfo.email || currentData.email,
      firstName: idChangeInfo.firstName || currentData.firstName,
      lastName: idChangeInfo.lastName || currentData.lastName,
      dateModified: formatDate(new Date()),
      timeModified: formatTime(new Date())
    };
    
    // Update email if it was also changed
    if (idChangeInfo.isEmailChanged) {
      const emailUpdateResult = await handleEmailUpdate(
        editingMember.email,
        idChangeInfo.email,
        idChangeInfo.newId,
        currentData,
        formData
      );
      
      if (emailUpdateResult.newUid) {
        updatedMemberData.authUid = emailUpdateResult.newUid;
      }
    }
    
    // Move all data from old ID to new ID
    const moveResult = await moveMemberData(
      idChangeInfo.oldId, 
      idChangeInfo.newId, 
      updatedMemberData
    );
    
    if (moveResult.success) {
      setSuccessMessage(`Member ID successfully changed from #${idChangeInfo.oldId} to #${idChangeInfo.newId}`);
      setSuccessModalVisible(true);
      
      // Close modals and refresh
      setIdChangeModalVisible(false);
      setIdChangeInfo(null);
      closeModals();
      await fetchMembers();
    }
    
  } catch (error) {
    console.error('Error changing member ID:', error);
    setErrorMessage(`Failed to change member ID: ${error.message}`);
    setErrorModalVisible(true);
  } finally {
    setIdChangeLoading(false);
  }
};

// Delete a loan and all associated payments
const deleteLoanAndPayments = async (memberId, loanTransactionId) => {
  try {
    // Get all payment transactions for this loan
    const paymentsRef = database.ref(`Payments/ApprovedPayments/${memberId}`);
    const paymentsSnap = await paymentsRef.once('value');
    const paymentsData = paymentsSnap.val() || {};
    
    // Find and delete payments for this loan
    const paymentIdsToDelete = [];
    for (const [paymentId, payment] of Object.entries(paymentsData)) {
      if (payment.selectedLoanId === loanTransactionId) {
        paymentIdsToDelete.push(paymentId);
      }
    }
    
    // Delete payments
    for (const paymentId of paymentIdsToDelete) {
      await database.ref(`Payments/ApprovedPayments/${memberId}/${paymentId}`).remove();
      await database.ref(`Transactions/Payments/${memberId}/${paymentId}`).remove();
    }
    
    // Delete loan from all collections
    const loanCollections = ['ApprovedLoans', 'CurrentLoans', 'PaidLoans'];
    for (const collection of loanCollections) {
      await database.ref(`Loans/${collection}/${memberId}/${loanTransactionId}`).remove();
    }
    
    // Delete from Transactions
    await database.ref(`Transactions/Loans/${memberId}/${loanTransactionId}`).remove();
    
    // Delete from Member record
    await database.ref(`Members/${memberId}/loans/${loanTransactionId}`).remove();
    
    console.log(`Deleted loan ${loanTransactionId} and ${paymentIdsToDelete.length} associated payments`);
    
    return true;
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

// Delete a payment
const deletePayment = async (memberId, paymentTransactionId) => {
  try {
    // Get payment data to find linked loan
    const paymentRef = database.ref(`Payments/ApprovedPayments/${memberId}/${paymentTransactionId}`);
    const paymentSnap = await paymentRef.once('value');
    const payment = paymentSnap.val();
    
    // Delete payment
    await paymentRef.remove();
    await database.ref(`Transactions/Payments/${memberId}/${paymentTransactionId}`).remove();
    
    console.log(`Deleted payment ${paymentTransactionId}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
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
  
  if (pendingAdd) {
    const emailData = {
      firstName: pendingAdd.firstName,
      lastName: pendingAdd.lastName,
      email: pendingAdd.email,
      password: pendingAdd.password,
      memberId: pendingAdd.memberId,
      dateAdded: pendingAdd.dateAdded,
      role: pendingAdd.role || 'member'
    };
    
    // Handle email update (when email was changed)
    if (pendingAdd.isEmailUpdate) {
      console.log(`Sending ${pendingAdd.roleDisplay} credentials to ${pendingAdd.email} after email update`);
      
      // Send email based on role
      if (pendingAdd.role === 'admin') {
        sendAdminCredentialsEmail(emailData).then(() => {
          console.log('Admin credentials email sent successfully after update');
        }).catch(error => {
          console.error('Error sending admin credentials email after update:', error);
        });
      } else if (pendingAdd.role === 'coadmin') {
        sendCoAdminCredentialsEmail(emailData).then(() => {
          console.log('Co-admin credentials email sent successfully after update');
        }).catch(error => {
          console.error('Error sending co-admin credentials email after update:', error);
        });
      } else {
        // For regular members
        sendMemberCredentialsEmail(emailData).then(() => {
          console.log('Member credentials email sent successfully after update');
        }).catch(error => {
          console.error('Error sending member credentials email after update:', error);
        });
      }
    }
    // Handle new member migration (from add modal)
    else {
      console.log(`Sending new ${pendingAdd.roleDisplay} credentials to ${pendingAdd.email}`);
      
      if (pendingAdd.role === 'admin') {
        sendAdminCredentialsEmail(emailData).then(() => {
          console.log('Admin credentials email sent successfully for new migration');
        }).catch(error => {
          console.error('Error sending admin credentials email for new migration:', error);
        });
      } else if (pendingAdd.role === 'coadmin') {
        sendCoAdminCredentialsEmail(emailData).then(() => {
          console.log('Co-admin credentials email sent successfully for new migration');
        }).catch(error => {
          console.error('Error sending co-admin credentials email for new migration:', error);
        });
      } else {
        // For regular members
        sendMemberCredentialsEmail(emailData).then(() => {
          console.log('Member credentials email sent successfully for new migration');
        }).catch(error => {
          console.error('Error sending member credentials email for new migration:', error);
        });
      }
    }
    
    setPendingAdd(null);
  }
  
  // Send delete notification after successful deletion
  if (pendingDelete) {
    sendMemberDeleteData({
      email: pendingDelete.email,
      firstName: pendingDelete.firstName || '',
      lastName: pendingDelete.lastName || '',
      memberId: pendingDelete.id,
      role: pendingDelete.role || 'member'
    }).then(() => {
      console.log('Member delete notification sent successfully');
    }).catch(error => {
      console.error('Error sending member delete notification:', error);
    });
    
    setViewModalVisible(false);
    setSelectedMember(null);
    setPendingDelete(null);
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
    style={{
      ...styles.formInput,
      borderColor: formData.memberId !== editingMember?.id?.toString() ? '#3b82f6' : '#d1d5db',
      backgroundColor: formData.memberId !== editingMember?.id?.toString() ? '#f0f9ff' : '#fff'
    }}
    placeholder="Enter member ID (5001+)"
    value={formData.memberId}
    onChange={(e) => {
      // Allow any input, but validate on blur
      const newId = e.target.value;
      setMemberIdError('');
      handleInputChange('memberId', newId);
    }}
    onBlur={(e) => {
      // Validate only when user leaves the field
      const newId = e.target.value;
      const validation = validateMemberId(newId, editingMember?.id);
      
      if (!validation.valid) {
        setMemberIdError(validation.error);
      }
    }}
    type="text"  // CHANGED from "number" to "text"
    inputMode="numeric"  // Shows numeric keyboard on mobile
    pattern="[0-9]*"    // Allows only numbers
  />
  {memberIdError && <span style={styles.errorText}>{memberIdError}</span>}
  
  {/* Show warning if ID is being changed */}
  {mode === 'edit' && formData.memberId !== editingMember?.id?.toString() && !memberIdError && (
    <span style={{ 
      fontSize: '12px', 
      color: '#d97706', 
      marginTop: '4px', 
      display: 'block',
      fontWeight: '500'
    }}>
      ⚠️ Changing Member ID will update all related records
    </span>
  )}
  
  {/* Helper text */}
  {!memberIdError && (
    <span style={{ 
      fontSize: '11px', 
      color: '#64748b', 
      marginTop: '4px', 
      display: 'block' 
    }}>
      Enter numbers only (5001 and above)
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
  />
  {emailError && <span style={styles.errorText}>{emailError}</span>}
  {mode === 'edit' && formData.email !== editingMember?.email && !emailError && (
    <span style={{ 
      fontSize: '12px', 
      color: '#3b82f6', 
      marginTop: '4px', 
      display: 'block',
      fontWeight: '500'
    }}>
      ⚠️ Changing email will create new login credentials
    </span>
  )}
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
    onChange={(e) => {
      const selectedValue = e.target.value;
      const isOther = selectedValue === 'Others';
      setIsOtherGovernmentId(isOther);
      
      if (isOther) {
        // When "Others" is selected, clear the custom input and set the base value
        setOtherGovernmentId('');
        handleInputChange('governmentId', 'Others');
      } else {
        // For regular options, set the selected value directly
        handleInputChange('governmentId', selectedValue);
        setOtherGovernmentId('');
      }
    }}
  >
    <option value="">Select Government ID</option>
    {governmentIdOptions.map((option) => (
      <option key={option.key} value={option.label}>
        {option.label}
      </option>
    ))}
  </select>
  
  {/* Show custom input when "Others" is selected */}
  {isOtherGovernmentId && (
    <div style={{ marginTop: '8px' }}>
      <input
        style={styles.formInput}
        placeholder="Please specify your Government ID"
        value={otherGovernmentId}
        onChange={(e) => {
          const customValue = e.target.value;
          setOtherGovernmentId(customValue);
          // Update the main governmentId with the custom value
          handleInputChange('governmentId', customValue || 'Others');
        }}
      />
    </div>
  )}
</div>
            
<div style={styles.formSection}>
  <label style={styles.formLabel}>Current Balance</label>
  <input
    style={styles.formInput}
    placeholder="Enter current balance"
    value={formData.balance}
    onChange={(e) => {
      // Only allow numbers and one decimal point
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        handleInputChange('balance', value);
      }
    }}
    type="text"
    inputMode="decimal"
  />
  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
    Initial balance
  </span>
</div>
            
<div style={styles.formSection}>
  <label style={styles.formLabel}>Investment Amount</label>
  <input
    style={styles.formInput}
    placeholder="Enter investment amount"
    value={formData.investment}
    onChange={(e) => {
      // Only allow numbers and one decimal point
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        handleInputChange('investment', value);
      }
    }}
    type="text"
    inputMode="decimal"
  />
  <span style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'block' }}>
    Will be added to balance and system Funds
  </span>
</div>

<div style={styles.formSection}>
  <label style={styles.formLabel}>
    User Role<span style={styles.requiredAsterisk}>*</span>
  </label>
  <select
    style={styles.formSelect}
    value={formData.userRole}
    onChange={(e) => handleInputChange('userRole', e.target.value)}
  >
    {roleOptions.map((role) => (
      <option key={role.key} value={role.key}>
        {role.label}
      </option>
    ))}
  </select>
  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
    {formData.userRole === 'admin' ? 'Full system administrator access' : 
     formData.userRole === 'coadmin' ? 'Limited administrative access' : 
     'Regular member access only'}
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
        {(mode === 'add' || mode === 'edit') && (
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
        <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <FaMoneyBillWave style={{ color: '#d97706', marginRight: '8px' }} />
        <span style={{ fontWeight: '600', color: '#92400e' }}>
          Processing Fee Information
        </span>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px',
        fontSize: '13px' 
      }}>
        <div>
          <span style={{ color: '#64748b' }}>System Processing Fee:</span>
          <span style={{ fontWeight: '600', color: '#dc2626', marginLeft: '8px' }}>
            {formatCurrency(processingFee)}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Applied per loan:</span>
          <span style={{ fontWeight: '600', color: '#059669', marginLeft: '8px' }}>
            Yes
          </span>
        </div>
      </div>
      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#92400e',
        fontStyle: 'italic' 
      }}>
        Note: Processing fee is automatically deducted from each loan amount. The member receives the release amount.
      </div>
    </div>
        <div style={styles.loansContainer}>
          {existingLoans.map((loan, index) => (
            <div key={loan.id} style={styles.loanCard}>
              <div style={styles.loanHeader}>
                <h4 style={styles.loanTitle}>Loan #{index + 1}</h4>
              
<button
      type="button"
      style={styles.removeLoanButton}
      onClick={() => removeLoan(loan.id)}
      title="Remove this loan entry"
    >
      <FaTimes />
      <span style={{ marginLeft: '4px' }}></span>
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
      onChange={(e) => {
                      updateLoanField(loan.id, 'loanType', e.target.value);
                      updateAvailableTerms(e.target.value);
                  }}
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
    placeholder="Enter original loan amount"
    value={loan.loanAmount}
    onChange={(e) => {
      // Only allow numbers and one decimal point - SAME AS DEPOSITS COMPONENT
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        updateLoanField(loan.id, 'loanAmount', value);
      }
    }}
    type="text"
    inputMode="decimal"
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
    placeholder="Enter current remaining balance"
    value={loan.outstandingBalance}
    onChange={(e) => {
      // FIX: Direct validation for outstanding balance
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        setExistingLoans(prev => prev.map(l => {
          if (l.id === loan.id) {
            return { ...l, outstandingBalance: value };
          }
          return l;
        }));
      }
    }}
    onFocus={(e) => {
      e.target.setAttribute('data-current-value', e.target.value);
    }}
    onBlur={(e) => {
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
    type="text"
    inputMode="decimal"
  />
  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
    Enter the ACTUAL current remaining balance
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
      <label style={styles.formLabel}>Processing Fee:</label>
      <input
        style={styles.formInput}
        value={formatCurrency(loan.processingFee || processingFee)}
        readOnly
      />
      <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
        Deducted from loan amount
      </span>
    </div>
    
    <div style={styles.formSection}>
      <label style={styles.formLabel}>Release Amount:</label>
      <input
        style={styles.formInput}
        value={formatCurrency(loan.releaseAmount || Math.max(0, (parseFloat(loan.loanAmount) || 0) - processingFee))}
        readOnly
      />
      <span style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'block' }}>
        Amount member actually receives
      </span>
    </div>
    
    <div style={styles.formSection}>
      <label style={styles.formLabel}>Total to Pay:</label>
      <input
        style={styles.formInput}
        value={formatCurrency(loan.totalTermPayment)}
        readOnly
      />
      <span style={{ fontSize: '11px', color: '#1e3a8a', marginTop: '4px', display: 'block' }}>
        Loan + Interest ({loan.interestRate}%)
      </span>
    </div>
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
              
{/* Payment Amount Field */}
<div style={styles.formSection}>
  <label style={styles.formLabel}>
    Payment Amount<span style={styles.requiredAsterisk}>*</span>
  </label>
  <input
    style={styles.formInput}
    placeholder="Enter payment amount"
    value={payment.paymentAmount}
    onChange={(e) => {
      // Only allow numbers and one decimal point
      const value = e.target.value;
      const regex = /^(\d+\.?\d*|\.\d+)$/;
      if (value === '' || regex.test(value)) {
        updatePaymentTransactionField(payment.id, 'paymentAmount', value);
        
        // Auto-calculate allocation when amount changes
        const linkedLoan = existingLoans.find(loan => loan.transactionId === payment.loanTransactionId);
        if (linkedLoan) {
          const allocation = calculatePaymentAllocation(value, linkedLoan);
          updatePaymentTransactionField(payment.id, 'penaltyPaid', allocation.penaltyPaid);
          updatePaymentTransactionField(payment.id, 'interestPaid', allocation.interestPaid);
          updatePaymentTransactionField(payment.id, 'principalPaid', allocation.principalPaid);
          updatePaymentTransactionField(payment.id, 'excessPayment', allocation.excessPayment);
        }
      }
    }}
    type="text"
    inputMode="decimal"
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
  onClick={mode === 'add' ? handleSubmitConfirmation : () => submitEditMember()}
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
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Email</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Balance</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Investment</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loans</th>
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
                      <td style={styles.tableCell}>{toPeso(m.balance)}</td>
                      <td style={styles.tableCell}>{toPeso(m.investment)}</td>
                      <td style={styles.tableCell}>{toPeso(m.loans)}</td>
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
          Member Details #{selectedMember.id}
        </h2>
        <button 
          onClick={closeModals}
          style={styles.closeButton}
        >
          <AiOutlineClose />
        </button>
      </div>
      
      <div style={styles.modalContent}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total Loans:</span>
              <span style={styles.summaryValue}>{viewMemberLoans.length}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total Amount:</span>
              <span style={styles.summaryValue}>
                {formatCurrency(viewMemberLoans.reduce((sum, loan) => sum + (parseFloat(loan.loanAmount) || 0), 0))}
              </span>
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Active Loans:</span>
              <span style={styles.summaryValue}>
                {viewMemberLoans.filter(loan => loan.status === 'active' || loan.status === 'approved').length}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Paid Loans:</span>
              <span style={styles.summaryValue}>
                {viewMemberLoans.filter(loan => loan.status === 'paid').length}
              </span>
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total Payments:</span>
              <span style={styles.summaryValue}>{viewMemberPayments.length}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total Paid:</span>
              <span style={styles.summaryValue}>
                {formatCurrency(viewMemberPayments.reduce((sum, payment) => sum + (parseFloat(payment.amountToBePaid || payment.paymentAmount) || 0), 0))}
              </span>
            </div>
          </div>
        </div>
        
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
                <span style={styles.fieldValue}>{selectedMember.phoneNumber || selectedMember.contactNumber || 'N/A'}</span>
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
        
        {/* Loans Section */}
        <div style={styles.loansViewSection}>
          <div style={styles.loansViewHeader}>
            <h3 style={styles.loansViewTitle}>
              <FaHandHoldingUsd />
              Loan Records ({viewMemberLoans.length})
            </h3>
            {viewLoading && (
              <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
            )}
          </div>
          
          {viewLoading ? (
            <div style={styles.emptyState}>
              <FaSpinner style={{ ...styles.emptyIcon, animation: 'spin 1s linear infinite' }} />
              <p>Loading loans...</p>
            </div>
          ) : viewMemberLoans.length === 0 ? (
            <div style={styles.emptyState}>
              <FaHandHoldingUsd style={styles.emptyIcon} />
              <p>No loan records found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', padding: '16px' }}>
              <table style={styles.loansTable}>
                <thead>
                  <tr style={styles.loansTableHeader}>
                    <th style={styles.loansTableCell}>Loan Type</th>
                    <th style={styles.loansTableCell}>Amount</th>
                    <th style={styles.loansTableCell}>Term</th>
                    <th style={styles.loansTableCell}>Balance</th>
                    <th style={styles.loansTableCell}>Status</th>
                    <th style={styles.loansTableCell}>Due Date</th>
                    <th style={styles.loansTableCell}>Date Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {viewMemberLoans.map((loan, index) => (
                    <tr key={loan.transactionId || index} style={styles.loansTableRow}>
                      <td style={styles.loansTableCell}>
                        <strong>{loan.loanType || 'N/A'}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          ID: {loan.transactionId?.substring(0, 8) || 'N/A'}
                        </div>
                      </td>
                      <td style={styles.loansTableCell}>
                        {formatCurrency(loan.loanAmount)}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Monthly: {formatCurrency(loan.monthlyPayment || loan.totalMonthlyPayment)}
                        </div>
                      </td>
                      <td style={styles.loansTableCell}>
                        {loan.term || 'N/A'} months
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Paid: {loan.paymentsMade || 0}/{loan.term || 'N/A'}
                        </div>
                      </td>
                      <td style={styles.loansTableCell}>
                        {formatCurrency(loan.outstandingBalance || loan.remainingBalance)}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Paid: {formatCurrency(loan.amountPaid || 0)}
                        </div>
                      </td>
                      <td style={styles.loansTableCell}>
                        {getLoanStatusBadge(loan.status)}
                        {loan.collection && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            ({loan.collection})
                          </div>
                        )}
                      </td>
                      <td style={styles.loansTableCell}>
                        {loan.dueDate || 'N/A'}
                      </td>
                      <td style={styles.loansTableCell}>
                        {formatDisplayDate(loan.dateApproved)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Payments Section */}
        <div style={{ ...styles.loansViewSection, marginTop: '16px' }}>
          <div style={styles.loansViewHeader}>
            <h3 style={styles.loansViewTitle}>
              <FaReceipt />
              Payment Records ({viewMemberPayments.length})
            </h3>
          </div>
          
          {viewLoading ? (
            <div style={styles.emptyState}>
              <FaSpinner style={{ ...styles.emptyIcon, animation: 'spin 1s linear infinite' }} />
              <p>Loading payments...</p>
            </div>
          ) : viewMemberPayments.length === 0 ? (
            <div style={styles.emptyState}>
              <FaReceipt style={styles.emptyIcon} />
              <p>No payment records found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', padding: '16px' }}>
              <table style={styles.loansTable}>
                <thead>
                  <tr style={styles.loansTableHeader}>
                    <th style={styles.loansTableCell}>Transaction ID</th>
                    <th style={styles.loansTableCell}>Amount</th>
                    <th style={styles.loansTableCell}>Loan ID</th>
                    <th style={styles.loansTableCell}>Method</th>
                    <th style={styles.loansTableCell}>Date</th>
                    <th style={styles.loansTableCell}>Status</th>
                    <th style={styles.loansTableCell}>Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {viewMemberPayments.map((payment, index) => (
                    <tr key={payment.transactionId || index} style={styles.loansTableRow}>
                      <td style={styles.loansTableCell}>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {payment.transactionId?.substring(0, 12) || 'N/A'}
                        </div>
                      </td>
                      <td style={styles.loansTableCell}>
                        <strong>{formatCurrency(payment.amountToBePaid || payment.paymentAmount)}</strong>
                      </td>
                      <td style={styles.loansTableCell}>
                        {payment.selectedLoanId ? (
                          <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {payment.selectedLoanId.substring(0, 10)}...
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td style={styles.loansTableCell}>
                        {payment.paymentOption || payment.paymentMethod || 'Cash'}
                      </td>
                      <td style={styles.loansTableCell}>
                        {formatDisplayDate(payment.dateApplied || payment.dateApproved)}
                        {payment.timeApproved && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {payment.timeApproved}
                          </div>
                        )}
                      </td>
                      <td style={styles.loansTableCell}>
                        {getPaymentStatusBadge(payment.status)}
                      </td>
                      <td style={styles.loansTableCell}>
                        <div style={{ fontSize: '11px' }}>
                          <div>Principal: {formatCurrency(payment.principalPaid || 0)}</div>
                          <div>Interest: {formatCurrency(payment.interestPaid || 0)}</div>
                          {payment.penaltyPaid > 0 && (
                            <div>Penalty: {formatCurrency(payment.penaltyPaid)}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

            {/* Update Progress Modal - ADD THIS BEFORE ERROR MODAL */}
{updatingInProgress && (
  <div style={styles.modalOverlay}>
    <div style={{
      ...styles.modalCardSmall,
      width: '400px',
      maxWidth: '90vw'
    }}>
      <FaSpinner style={{ 
        ...styles.confirmIcon, 
        color: '#3b82f6',
        animation: 'spin 1s linear infinite'
      }} />
      <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Updating Records</h2>
      
      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        backgroundColor: '#e5e7eb', 
        borderRadius: '10px', 
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(updateProgress.current / updateProgress.total) * 100}%`,
          height: '10px',
          backgroundColor: '#3b82f6',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
      
      {/* Progress Text */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>Step {updateProgress.current} of {updateProgress.total}</span>
        <div style={{ fontWeight: '600', color: '#1e40af', fontSize: '14px' }}>
          {updateProgress.message}
        </div>
      </div>
      
      <p style={{ ...styles.modalText, fontSize: '12px', color: '#6b7280' }}>
        Please wait while we update all records. This may take a moment...
      </p>
    </div>
  </div>
)}
          </div>
        )}

{emailChangeModalVisible && emailChangeInfo && (
  <div style={styles.modalOverlay} onClick={() => !emailChangeLoading && setEmailChangeModalVisible(false)}>
    <div style={styles.modalCardSmall} onClick={(e) => e.stopPropagation()}>
      {emailChangeLoading ? (
        <>
          <FaSpinner style={{ 
            ...styles.confirmIcon, 
            color: '#3b82f6',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Updating Email</h2>
          <p style={styles.modalText}>
            Processing email change...
            <br />
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Creating new account and updating records
            </span>
          </p>
        </>
      ) : (
        <>
          <FiAlertCircle style={{ ...styles.confirmIcon, color: '#3b82f6' }} />
          <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Update Email Address</h2>
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>Current Email:</span>
              <div style={{ color: '#dc2626', fontWeight: '500' }}>{emailChangeInfo.oldEmail}</div>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#64748b' }}>New Email:</span>
              <div style={{ color: '#059669', fontWeight: '500' }}>{emailChangeInfo.newEmail}</div>
            </div>
          </div>
          <p style={{ ...styles.modalText, textAlign: 'left', fontSize: '13px' }}>
            <strong>This will:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Create new login credentials</li>
              <li><strong>Send new password to {emailChangeInfo.newEmail}</strong></li>
              <li>Update all records with new email</li>
              <li>Mark old account ({emailChangeInfo.oldEmail}) for deletion</li>
              <li>Member role: <strong>{emailChangeInfo.role || 'member'}</strong></li>
            </ul>
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button 
              style={{
                ...styles.actionButton,
                background: '#3b82f6',
                color: 'white',
                flex: 1
              }}
              onClick={() => {
                setEmailChangeModalVisible(false);
                submitEditMember(true);
              }}
            >
              Update & Send Credentials
            </button>
            <button 
              style={{
                ...styles.actionButton,
                background: '#6b7280',
                color: 'white',
                flex: 1
              }}
              onClick={() => {
                setEmailChangeModalVisible(false);
                // Keep old email in form
                setFormData(prev => ({
                  ...prev,
                  email: emailChangeInfo.oldEmail
                }));
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

{idChangeModalVisible && idChangeInfo && (
  <div style={styles.modalOverlay} onClick={() => !idChangeLoading && !updatingInProgress && setIdChangeModalVisible(false)}>
    <div style={{
      ...styles.modalCardSmall,
      width: '450px',
      maxWidth: '90vw'
    }} onClick={(e) => e.stopPropagation()}>
      {idChangeLoading || updatingInProgress ? (
        <>
          <FaSpinner style={{ 
            ...styles.confirmIcon, 
            color: '#d97706',
            animation: 'spin 1s linear infinite',
            fontSize: '32px'
          }} />
          <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
            {updatingInProgress ? 'Updating Records...' : 'Processing ID Change...'}
          </h2>
          
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fde68a', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', color: '#92400e' }}>From:</span>
              <div style={{ color: '#dc2626', fontWeight: '600', fontSize: '16px' }}>
                #{idChangeInfo.oldId}
              </div>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#92400e' }}>To:</span>
              <div style={{ color: '#059669', fontWeight: '600', fontSize: '16px' }}>
                #{idChangeInfo.newId}
              </div>
            </div>
          </div>
          
          {updatingInProgress && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              {/* Progress Bar */}
              <div style={{ 
                width: '100%', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '10px', 
                marginBottom: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(updateProgress.current / updateProgress.total) * 100}%`,
                  height: '10px',
                  backgroundColor: '#d97706',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              
              {/* Progress Text */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#92400e',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Step {updateProgress.current} of {updateProgress.total}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#1e40af',
                  fontWeight: '600'
                }}>
                  {updateProgress.message}
                </div>
              </div>
              
              {/* Impact Summary */}
              {idChangeInfo.impact.hasImpact && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b' }}>Loans</div>
                      <div style={{ color: '#1e40af', fontWeight: '600' }}>{idChangeInfo.impact.loans}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b' }}>Payments</div>
                      <div style={{ color: '#1e40af', fontWeight: '600' }}>{idChangeInfo.impact.payments}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b' }}>Transactions</div>
                      <div style={{ color: '#1e40af', fontWeight: '600' }}>{idChangeInfo.impact.transactions}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <p style={{ 
            ...styles.modalText, 
            fontSize: '13px', 
            color: '#64748b',
            textAlign: 'center'
          }}>
            {updatingInProgress ? (
              'Please wait while we update all records. This may take a moment...'
            ) : (
              'Preparing to change Member ID...'
            )}
          </p>
        </>
      ) : (
        <>
          <FiAlertCircle style={{ 
            ...styles.confirmIcon, 
            color: '#d97706',
            fontSize: '32px'
          }} />
          <h2 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Change Member ID</h2>
          
          {/* ID Change Summary */}
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fde68a', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ color: '#92400e', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                  Current ID
                </div>
                <div style={{ 
                  color: '#dc2626', 
                  fontWeight: '700', 
                  fontSize: '20px',
                  padding: '8px 16px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  border: '2px solid #fecaca'
                }}>
                  #{idChangeInfo.oldId}
                </div>
              </div>
              
              <div style={{ color: '#64748b', fontSize: '20px' }}>→</div>
              
              <div>
                <div style={{ color: '#92400e', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                  New ID
                </div>
                <div style={{ 
                  color: '#059669', 
                  fontWeight: '700', 
                  fontSize: '20px',
                  padding: '8px 16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  border: '2px solid #bbf7d0'
                }}>
                  #{idChangeInfo.newId}
                </div>
              </div>
            </div>
            
            {/* Email Change Warning */}
            {idChangeInfo.isEmailChanged && (
              <div style={{ 
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <FaEnvelope style={{ color: '#3b82f6' }} />
                  <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>
                    Email will also be updated
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  From: {editingMember.email} → To: {idChangeInfo.email}
                </div>
              </div>
            )}
          </div>
          
          {/* Impact Summary */}
          {idChangeInfo.impact.hasImpact ? (
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                color: '#0369a1',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaDatabase />
                Records to be Moved
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}>
                    Loans
                  </div>
                  <div style={{ 
                    color: '#1e40af', 
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {idChangeInfo.impact.loans}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}>
                    Payments
                  </div>
                  <div style={{ 
                    color: '#1e40af', 
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {idChangeInfo.impact.payments}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}>
                    Transactions
                  </div>
                  <div style={{ 
                    color: '#1e40af', 
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {idChangeInfo.impact.transactions}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}>
                    Total
                  </div>
                  <div style={{ 
                    color: '#dc2626', 
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {idChangeInfo.impact.loans + idChangeInfo.impact.payments + idChangeInfo.impact.transactions}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b',
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                All records will be moved to new ID
              </div>
            </div>
          ) : (
            <div style={{ 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#d1fae5',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <FaCheckCircle style={{ color: '#059669' }} />
                <span style={{ color: '#065f46', fontWeight: '600', fontSize: '14px' }}>
                  No Existing Records Found
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#065f46', textAlign: 'center' }}>
                Only member profile will be updated. No loans, payments, or transactions to move.
              </div>
            </div>
          )}
          
          {/* Warning Message */}
          <div style={{ 
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '8px'
            }}>
              <FiAlertCircle style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ color: '#92400e', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                  Important Information
                </div>
                <ul style={{ 
                  margin: '0', 
                  paddingLeft: '16px',
                  fontSize: '12px',
                  color: '#92400e',
                  lineHeight: '1.5'
                }}>
                  <li>All member data will be moved to new ID #{idChangeInfo.newId}</li>
                  <li>All related records (loans, payments, transactions) will be updated</li>
                  <li>Old ID #{idChangeInfo.oldId} will be removed from the system</li>
                  {idChangeInfo.isEmailChanged && (
                    <li>New login credentials will be sent to {idChangeInfo.email}</li>
                  )}
                  <li><strong>This process cannot be undone</strong></li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginTop: '16px'
          }}>
            <button 
              style={{
                ...styles.actionButton,
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                color: 'white',
                flex: 1,
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onClick={handleIdChange}
              disabled={idChangeLoading || updatingInProgress}
            >
              <FaExchangeAlt style={{ marginRight: '8px' }} />
              Change ID Now
            </button>
            
            <button 
              style={{
                ...styles.actionButton,
                background: '#6b7280',
                color: 'white',
                flex: 1,
                padding: '12px 24px',
                fontSize: '14px'
              }}
              onClick={() => {
                setIdChangeModalVisible(false);
                setIdChangeInfo(null);
                // Reset to old ID
                setFormData(prev => ({
                  ...prev,
                  memberId: editingMember.id.toString()
                }));
              }}
              disabled={idChangeLoading || updatingInProgress}
            >
              <FaTimes style={{ marginRight: '8px' }} />
              Cancel
            </button>
          </div>
          
          {/* Progress Estimate */}
          <div style={{ 
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FaClock style={{ fontSize: '10px' }} />
              <span>Estimated time: {idChangeInfo.impact.hasImpact ? '30-60 seconds' : '5-10 seconds'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default DataMigration;
