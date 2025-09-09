import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimes,
  FaExclamationCircle
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendCoAdminCredentialsEmail, sendCoAdminDeleteData } from '../../../../Server/api';

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

// Helper function to format date as "Month Day, Year"
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to format time as "HH:MM:SS"
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const styles = {
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
    '&:nth-child(even)': {
      backgroundColor: '#f5f5f5'
    },
    '&:nth-child(odd)': {
      backgroundColor: '#ddd'
    }
  },
  tableCell: {
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #ddd',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  viewText: {
    color: '#2D5783',
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
    '&:hover': {
      color: '#1a3d66'
    },
    outline: 'none',
    '&:focus': {
      outline: 'none'
    }
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
  modalCardSmall: {
    width: '300px',
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
  confirmIcon: {
    marginBottom: '12px',
    fontSize: '32px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    color: '#333',
    lineHeight: '1.4'
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
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#2D5783',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
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
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
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
  modalContent: {
    paddingBottom: '12px',
    overflowY: 'auto',
    flex: 1
  },
  modalHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#2D5783',
    textAlign: 'center'
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
  bottomButtons: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eee'
  },
  deleteButton: {
    backgroundColor: '#f44336',
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: '0.7'
  },
  formColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    flex: 1
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '20px',
    width: '100%'
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: '5px',
    display: 'block',
    fontSize: '14px',
    color: '#333'
  },
  requiredAsterisk: {
    color: 'red',
    marginLeft: '3px'
  },
  formInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontSize: '14px'
  },
  formSelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    fontSize: '14px'
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px'
  },
  fileInputLabel: {
    display: 'block',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '14px',
    color: '#495057'
  },
  fileInput: {
    display: 'none'
  }
};

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

const CoAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [governmentId, setGovernmentId] = useState('');
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [validIdBackFile, setValidIdBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [civilStatusError, setCivilStatusError] = useState('');
  const [placeOfBirthError, setPlaceOfBirthError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [governmentIdError, setGovernmentIdError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmAddVisible, setConfirmAddVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .safe-area-view {
        flex: 1;
        background-color: #F5F5F5;
        height: 100%;
        width: 100%;
        overflow: auto;
      }
      .main-container {
        flex: 1;
      }
      .header-text {
        font-weight: bold;
        font-size: 40px;
        margin-bottom: 10px;
        margin-left: 25px;
        margin-right: 25px;
        margin-top: 100px;
      }
      .top-controls {
        display: flex;
        justify-content: space-between;
        margin: 0 25px;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-download-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-bar {
        display: flex;
        border: 1px solid #ccc;
        border-radius: 25px;
        background-color: #fff;
        padding: 0 10px;
        align-items: center;
        height: 40px;
        width: 250px;
      }
      .search-input {
        height: 36px;
        width: 100%;
        font-size: 16px;
        padding-left: 8px;
        border: none;
        outline: none;
        background: transparent;
      }
      .search-icon {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
      }
      .download-icon {
        padding: 6px;
        background: none;
        border: none;
        cursor: pointer;
        color: #2D5783;
      }
      .create-button {
        background-color: #2D5783;
        padding: 0 16px;
        border-radius: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border: none;
        cursor: pointer;
      }
      .create-button-text {
        color: #fff;
        font-size: 14px;
        font-weight: bold;
      }
      .pagination-container {
        display: flex;
        justify-content: flex-end;
        margin: 0 25px;
        margin-top: 10px;
        align-items: center;
      }
      .pagination-info {
        font-size: 12px;
        margin-right: 10px;
        color: #333;
      }
      .pagination-button {
        padding: 0;
        background-color: #2D5783;
        border-radius: 5px;
        margin: 0 3px;
        color: white;
        border: none;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .pagination-button svg {
        font-size: 10px;
        display: block;
        margin: 0 auto;
      }
      .disabled-button {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .data-container {
        flex: 1;
        margin: 0 25px;
        margin-top: 10px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .no-match-text {
        text-align: center;
        margin-top: 20px;
        font-size: 16px;
        color: #666;
      }
      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .modal-container {
        width: 500px;
        height: 650px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        position: relative;
        overflow-x: hidden;
      }
      @media (max-width: 800px) {
        .modal-container {
            width: 90%;
            max-width: 90%;
            height: auto;
            max-height: 90vh;
        }
      }
      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #2D5783;
        text-align: center;
      }
      .modal-content {
        padding-bottom: 20px;
        height: calc(100% - 100px);
        display: flex;
        flex-direction: column;
      }
      .form-group {
        margin-bottom: 20px;
        width: 100%;
      }
      .form-label {
        font-weight: 600;
        margin-bottom: 5px;
        display: block;
      }
      .required-asterisk {
        color: red;
        margin-left: 3px;
      }
      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-sizing: border-box;
      }
      .error-text {
        color: red;
        font-size: 12px;
        margin-top: 5px;
      }
      .modal-button-container {
        display: flex;
        justify-content: space-between;
        margin-top: auto;
        width: 100%;
        padding-top: 20px;
      }
      .modal-submit-button {
        background-color: #2D5783;
        color: white;
        padding: 10px;
        border: none;
        border-radius: 5px;
        width: 48%;
        cursor: pointer;
        font-weight: bold;
      }
      .modal-cancel-button {
        background-color: #ccc;
        padding: 10px;
        border: none;
        border-radius: 5px;
        width: 48%;
        cursor: pointer;
        font-weight: bold;
      }
      .confirm-modal-card {
        width: 300px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        overflow: hidden;
      }
      .action-buttons-container {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        width: 100%;
      }
      .delete-button {
        background-color: #f44336;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
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
        const snapshot = await database.ref('Users/CoAdmin').once('value');
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
      const adminsSnapshot = await database.ref('Users/CoAdmin').once('value');
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

  const handleDateChange = (date) => {
    setDateOfBirth(date);
    
    // Calculate accurate age considering full date
    const today = new Date();
    const birthDate = new Date(date);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    
    // Check if birthday hasn't occurred this year yet
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    setAge(calculatedAge);
  };

  const handleFileChange = (e, setFileFunction) => {
    const file = e.target.files[0];
    if (file) {
      setFileFunction(file);
    }
  };

  const uploadImageToStorage = async (file, path) => {
    try {
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
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

  const onPressAdd = async () => {
    if (!validateFields()) return;
    
    const emailExists = admins.some(admin => admin.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      setEmailError('Email address is already in use');
      return;
    }

    setPendingAdd({
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
      gender,
      civilStatus,
      placeOfBirth,
      address,
      age,
      dateOfBirth,
      governmentId,
      validIdFrontFile,
      validIdBackFile,
      selfieFile,
      selfieWithIdFile
    });
    setConfirmAddVisible(true);
  };

  const handleAddAdmin = async () => {
    setConfirmAddVisible(false);
    setIsProcessing(true);

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

      await database.ref(`Users/CoAdmin/${newId}`).set({
        id: newId,
        firstName,
        middleName: middleName || '',
        lastName,
        email,
        contactNumber,
        dateAdded,
        timeAdded,
        role: 'coadmin',
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
        role: 'coadmin',
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

      setSuccessMessage(`Co Admin account created successfully!`);
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error adding admin:', error);
      setErrorMessage(error.message || 'Failed to add admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdmin = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);

    try {
      const idToDelete = pendingDelete.id;

      await database.ref(`Users/CoAdmin/${idToDelete}`).remove();
      await database.ref(`Members/${idToDelete}`).remove();

      setSuccessMessage(`Admin account deleted successfully!`);
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error deleting admin:', error);
      setErrorMessage(error.message || 'Failed to delete admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
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
      const worksheet = workbook.addWorksheet('CoAdmins');

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
      link.download = 'CoAdmins.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Data exported successfully!');
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
  
    if (pendingAdd) {
      // Send credentials email
      sendCoAdminCredentialsEmail({
        email: pendingAdd.email,
        password: pendingAdd.password,
        firstName: pendingAdd.firstName,
        middleName: pendingAdd.middleName,
        lastName: pendingAdd.lastName
      }).catch(error => console.error('Error sending co-admin credentials email:', error));
      
      // Reset all form fields like in Admins.jsx and close modal
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');
      setGender('');
      setCivilStatus('');
      setPlaceOfBirth('');
      setAddress('');
      setAge('');
      setDateOfBirth(new Date());

      setGovernmentId('');
      setValidIdFrontFile(null);
      setValidIdBackFile(null);
      setSelfieFile(null);
      setSelfieWithIdFile(null);
      setModalVisible(false);
    } 
    else if (pendingDelete) {
      sendCoAdminDeleteData({
        email: pendingDelete.email,
        firstName: pendingDelete.firstName || '',
        middleName: pendingDelete.middleName || '',
        lastName: pendingDelete.lastName || ''
      }).catch(error => console.error('Error sending co-admin delete notification:', error));
    }

    setPendingAdd(null);
    setPendingDelete(null);
    
    // Refresh the list after action completes
    const fetchAdmins = async () => {
      try {
        const snapshot = await database.ref('Users/CoAdmin').once('value');
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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div className="loading-container">
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Co-Admins</h2>

        <div className="top-controls">
          <button
            onClick={() => setModalVisible(true)}
            className="create-button"
          >
            <span className="create-button-text">Create New Co-Admin</span>
          </button>

          <div className="search-download-container">
            <div className="search-bar">
              <input
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-icon">
                <FaSearch />
              </button>
            </div>
            <button onClick={handleDownload} className="download-icon">
              <FaDownload />
            </button>
          </div>
        </div>

        {!noMatch && filteredData.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">{`Page ${currentPage + 1} of ${totalPages}`}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className={`pagination-button ${currentPage === 0 ? 'disabled-button' : ''}`}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
              className={`pagination-button ${currentPage === totalPages - 1 ? 'disabled-button' : ''}`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="data-container">
          {noMatch ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>ID</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>First Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Middle Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Last Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Email Address</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Contact Number</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Added</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((admin) => (
                    <tr key={admin.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{admin.id}</td>
                      <td style={styles.tableCell}>{admin.firstName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.middleName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.lastName || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.email}</td>
                      <td style={styles.tableCell}>{admin.contactNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.dateAdded || 'N/A'}</td>
                      <td style={styles.tableCell}>
                        <span 
                          style={styles.viewText} 
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setAdminModalVisible(true);
                          }}
                        >
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Admin Modal */}
        {modalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button 
                onClick={() => {
                  setModalVisible(false);
                  setFirstName('');
                  setMiddleName('');
                  setLastName('');
                  setEmail('');
                  setContactNumber('');
                }} 
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>New Co-Admin</h2>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.formColumn}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      First Name<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoCapitalize="words"
                    />
                    {firstNameError && <span style={styles.errorText}>{firstNameError}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Middle Name</label>
                    <input
                      style={styles.formInput}
                      placeholder="Middle Name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      autoCapitalize="words"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Last Name<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoCapitalize="words"
                    />
                    {lastNameError && <span style={styles.errorText}>{lastNameError}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Email<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoCapitalize="none"
                    />
                    {emailError && <span style={styles.errorText}>{emailError}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Contact Number<span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      style={styles.formInput}
                      placeholder="Contact Number (11 digits)"
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



                <div style={styles.bottomButtons}>
                  <button 
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#2D5783',
                      color: '#FFF'
                    }}
                    onClick={onPressAdd}
                  >
                    Add Co-Admin
                  </button>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#6c757d',
                      color: '#FFF'
                    }}
                    onClick={() => {
                      setModalVisible(false);
                      setFirstName('');
                      setMiddleName('');
                      setLastName('');
                      setEmail('');
                      setContactNumber('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Details Modal */}
        {adminModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button 
                onClick={() => setAdminModalVisible(false)} 
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Co-Admin Details</h2>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.columns}>
                  <div style={styles.leftColumn}>
                    <div style={styles.sectionTitle}>Personal Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>ID:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.id || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>First Name:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.firstName || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Middle Name:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.middleName || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Last Name:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.lastName || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Gender:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.gender || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Civil Status:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.civilStatus || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date of Birth:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.dateOfBirth || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Age:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.age || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Place of Birth:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.placeOfBirth || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Address:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.address || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div style={styles.rightColumn}>
                    <div style={styles.sectionTitle}>Contact Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Email:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.email || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Contact Number:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.contactNumber || 'N/A'}</span>
                    </div>
                    
                    <div style={styles.sectionTitle}>Account Information</div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Date Added:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.dateAdded || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Time Added:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.timeAdded || 'N/A'}</span>
                    </div>
                    <div style={styles.compactField}>
                      <span style={styles.fieldLabel}>Government ID:</span>
                      <span style={styles.fieldValue}>{selectedAdmin?.governmentId || 'N/A'}</span>
                    </div>
                    
                    <div style={styles.sectionTitle}>Uploaded Documents</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                      {selectedAdmin?.validIdFront && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>Valid ID Front</span>
                          <img 
                            src={selectedAdmin.validIdFront} 
                            alt="Valid ID Front" 
                            style={{ width: '100px', height: '100px', borderRadius: '4px', border: '1px solid #ddd', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                      {selectedAdmin?.validIdBack && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>Valid ID Back</span>
                          <img 
                            src={selectedAdmin.validIdBack} 
                            alt="Valid ID Back" 
                            style={{ width: '100px', height: '100px', borderRadius: '4px', border: '1px solid #ddd', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                      {selectedAdmin?.selfie && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>Selfie</span>
                          <img 
                            src={selectedAdmin.selfie} 
                            alt="Selfie" 
                            style={{ width: '100px', height: '100px', borderRadius: '4px', border: '1px solid #ddd', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                      {selectedAdmin?.selfieWithId && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>Selfie with ID</span>
                          <img 
                            src={selectedAdmin.selfieWithId} 
                            alt="Selfie with ID" 
                            style={{ width: '100px', height: '100px', borderRadius: '4px', border: '1px solid #ddd', objectFit: 'cover', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div style={styles.bottomButtons}>
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
                  Delete Co-Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        {confirmAddVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
              <p style={styles.modalText}>Are you sure you want to add this admin?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#2D5783',
                    color: '#fff'
                  }} 
                  onClick={handleAddAdmin}
                >
                  Yes
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#f44336',
                    color: '#fff'
                  }} 
                  onClick={() => setConfirmAddVisible(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
              <p style={styles.modalText}>Are you sure you want to delete this admin?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#2D5783',
                    color: '#fff'
                  }} 
                  onClick={handleDeleteAdmin}
                >
                  Yes
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#f44336',
                    color: '#fff'
                  }} 
                  onClick={() => setConfirmDeleteVisible(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
              <p style={styles.modalText}>{successMessage}</p>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={handleSuccessOk}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
              <p style={styles.modalText}>{errorMessage}</p>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={() => setErrorModalVisible(false)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <div style={styles.centeredModal}>
            <div style={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoAdmins;  