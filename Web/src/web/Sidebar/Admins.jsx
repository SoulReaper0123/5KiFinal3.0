import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database, auth } from '../../../../Database/firebaseConfig';
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
  }
};

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');
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
        const snapshot = await database.ref('Users/Admin').once('value');
        const data = snapshot.val() || {};
        const adminList = Object.entries(data).map(([id, admin]) => ({
          id,
          ...admin
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
        admin.name.toLowerCase().includes(searchLower) ||
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
    
    // Get all existing IDs from both Admin and Member
    const adminIds = Object.keys(adminsData).map(id => parseInt(id));
    const memberIds = Object.keys(membersData).map(id => parseInt(id));
    const allIds = [...adminIds, ...memberIds];
    
    // If no IDs exist, start with 5001
    if (allIds.length === 0) {
      return 5001;
    }
    
    // Find the first available ID starting from 5001
    for (let i = 5001; i <= 9999; i++) {
      if (!allIds.includes(i)) {
        return i;
      }
    }
    
    // If all IDs up to 9999 are taken (unlikely), start from 5001 again
    return 5001;
  } catch (error) {
    console.error('Error getting next ID:', error);
    return 5001; // Fallback to 5001 if error
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
    
    // Check if email already exists in our admins list
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
      contactNumber
    });
    setConfirmAddVisible(true);
  };

 const handleAddAdmin = async () => {
    setConfirmAddVisible(false);
    setIsProcessing(true);

    try {
      const password = generateRandomPassword();
      const newId = await getNextId();
      const dateAdded = new Date().toLocaleString();
      const name = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();

      // Create user in Firebase Authentication with the generated password
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update the user's display name
      await userCredential.user.updateProfile({
        displayName: name
      });

      // Set the password explicitly (though createUserWithEmailAndPassword already sets it)
      // This ensures the password is set correctly
      await auth.currentUser.updatePassword(password);
      
      // Send email verification
      await auth.currentUser.sendEmailVerification();

      // Add admin data with numeric ID
      await database.ref(`Users/Admin/${newId}`).set({
        id: newId,
        name,
        email,
        contactNumber,
        dateAdded,
        role: 'admin',
        uid: userCredential.user.uid,
        // Store the initial password (optional, only if needed for reference)
        initialPassword: password
      });

      // Add corresponding member data with same numeric ID
      await database.ref(`Members/${newId}`).set({
        id: newId,
        name,
        email,
        contactNumber,
        dateAdded,
        role: 'admin',
        status: 'active',
        uid: userCredential.user.uid
      });

      // Store the pending admin data with the password for the success handler
      setPendingAdd({
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        password // Include the password here
      });

      setSuccessMessage(`Admin account created successfully!`);
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

    // First delete the admin record
    await database.ref(`Users/Admin/${idToDelete}`).remove();
    
    // Then delete the corresponding member record if it exists
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
      const worksheet = workbook.addWorksheet('Admins');

      const headers = ['ID', 'Name', 'Email', 'Contact Number', 'Date Added'];
      worksheet.addRow(headers);

      filteredData.forEach(admin => {
        const row = [
          admin.id,
          admin.name,
          admin.email,
          admin.contactNumber,
          admin.dateAdded
        ];
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
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
      const nameParts = pendingAdd.name ? 
        pendingAdd.name.split(' ') : 
        `${pendingAdd.firstName} ${pendingAdd.middleName} ${pendingAdd.lastName}`.split(' ');
      
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      // Send the actual password that was set in Firebase Auth
      sendAdminCredentialsEmail({
        email: pendingAdd.email,
        password: pendingAdd.password, // Use the actual password that was set
        firstName,
        middleName,
        lastName
      }).catch(error => console.error('Error sending admin credentials email:', error));
      
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');
      setModalVisible(false);
    } 
    else if (pendingDelete) {
      const nameParts = pendingDelete.name ? 
        pendingDelete.name.split(' ') : 
        `${pendingDelete.firstName || ''} ${pendingDelete.middleName || ''} ${pendingDelete.lastName || ''}`.split(' ');
      
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      sendAdminDeleteData({
        email: pendingDelete.email,
        firstName,
        middleName,
        lastName
      }).catch(error => console.error('Error sending admin delete notification:', error));
    }

    setPendingAdd(null);
    setPendingDelete(null);
    
    const fetchAdmins = async () => {
      try {
        const snapshot = await database.ref('Users/Admin').once('value');
        const data = snapshot.val() || {};
        const adminList = Object.entries(data).map(([id, admin]) => ({
          id,
          ...admin
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
        <h2 className="header-text">Admins</h2>

        <div className="top-controls">
          <button
            onClick={() => setModalVisible(true)}
            className="create-button"
          >
            <span className="create-button-text">Create New Admin</span>
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
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Name</th>
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
                      <td style={styles.tableCell}>{admin.name}</td>
                      <td style={styles.tableCell}>{admin.email}</td>
                      <td style={styles.tableCell}>{admin.contactNumber || 'N/A'}</td>
                      <td style={styles.tableCell}>{admin.dateAdded}</td>
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
            <div className="modal-container">
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
              <h3 className="modal-title">New Admin</h3>
              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">
                    First Name<span className="required-asterisk">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoCapitalize="words"
                  />
                  {firstNameError && <span className="error-text">{firstNameError}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input
                    className="form-input"
                    placeholder="Middle Name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    autoCapitalize="words"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Last Name<span className="required-asterisk">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoCapitalize="words"
                  />
                  {lastNameError && <span className="error-text">{lastNameError}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email<span className="required-asterisk">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoCapitalize="none"
                  />
                  {emailError && <span className="error-text">{emailError}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contact Number<span className="required-asterisk">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="Contact Number (11 digits)"
                    value={contactNumber}
                    onChange={(e) => {
                      const numericText = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                      setContactNumber(numericText);
                    }}
                    type="tel"
                  />
                  {contactNumberError && <span className="error-text">{contactNumberError}</span>}
                </div>

                <div className="modal-button-container">
                  <button className="modal-submit-button" onClick={onPressAdd}>
                    Add Admin
                  </button>
                  <button
                    className="modal-cancel-button"
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
            <div className="modal-container">
              <button 
                onClick={() => setAdminModalVisible(false)} 
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <div className="modal-content">
                <h3 className="modal-title">Admin Details</h3>
                <div className="form-group">
                  <label className="form-label">ID:</label>
                  <p>{selectedAdmin?.id || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Name:</label>
                  <p>{selectedAdmin?.name || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address:</label>
                  <p>{selectedAdmin?.email || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number:</label>
                  <p>{selectedAdmin?.contactNumber || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Date Added:</label>
                  <p>{selectedAdmin?.dateAdded || 'N/A'}</p>
                </div>
                <div className="action-buttons-container">
                  <button
                    className="delete-button"
                    onClick={() => {
                      setPendingDelete(selectedAdmin);
                      setConfirmDeleteVisible(true);
                      setAdminModalVisible(false);
                    }}
                  >
                    Delete Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        {confirmAddVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
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
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
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

export default Admins;