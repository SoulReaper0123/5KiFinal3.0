import React, { useState, useEffect } from 'react';
import {
  FaSearch,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { getDatabase, ref, onValue, set, remove } from 'firebase/database';
import {
  getAuth,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import ExcelJS from 'exceljs';

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

const CoAdmins = ({ setShowSplash }) => {
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
  const pageSize = 10;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isSmallScreen = windowWidth < 800;

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
      .create-button {
        background-color: #2D5783;
        padding: 10px 20px;
        border-radius: 30px;
        color: #fff;
        border: none;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
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
      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #001F3F;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .table-container {
        width: 100%;
        overflow-x: auto;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table-header {
        background-color: #2D5783;
        color: #fff;
        height: 50px;
      }
      .table-header-cell {
        padding: 10px;
        text-align: center;
        font-weight: bold;
      }
      .table-row {
        height: 50px;
        cursor: pointer;
      }
      .table-row:nth-child(even) {
        background-color: #f9f9f9;
      }
      .table-row:hover {
        background-color: #f0f0f0;
      }
      .table-cell {
        padding: 10px;
        text-align: center;
        vertical-align: middle;
      }
      .view-button {
        background-color: #5A8DB8;
        padding: 5px 10px;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
      }
      .centered-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-card {
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        width: ${isSmallScreen ? '90%' : '35%'};
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
      }
      .modal-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 20px;
        color: #001F3F;
        text-align: center;
      }
      .modal-label {
        font-weight: 600;
        margin-bottom: 5px;
        color: #001F3F;
        display: block;
      }
      .modal-input {
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 10px;
        font-size: 16px;
        margin-bottom: 5px;
      }
      .error-text {
        color: red;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .modal-button-container {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 20px;
      }
      .cancel-button {
        background-color: #ccc;
        padding: 12px;
        border-radius: 8px;
        border: none;
        color: #333;
        font-weight: bold;
        cursor: pointer;
        flex: 1;
      }
      .add-button {
        background-color: #2D5783;
        padding: 12px;
        border-radius: 8px;
        border: none;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        flex: 1;
      }
      .required {
        color: red;
      }
      .small-modal-card {
        width: 300px;
        height: 200px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .confirm-icon {
        align-self: center;
        margin-bottom: 10px;
        font-size: 30px;
      }
      .modal-text {
        font-size: 14px;
        margin-bottom: 20px;
        text-align: center;
      }
      .cancel-btn {
        background-color: #f44336;
        width: 100px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        margin: 0 10px;
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
      .confirm-btn {
        background-color: #4CAF50;
        width: 100px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        margin: 0 10px;
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
      .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
      }
      .modal-detail-text {
        font-size: 14px;
        margin-bottom: 10px;
        color: #333;
      }
      .action-buttons-container {
        margin-top: 20px;
      }
      .delete-button {
        background-color: #f44336;
        padding: 12px;
        border-radius: 8px;
        border: none;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [isSmallScreen]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const adminRef = ref(db, 'Users/CoAdmin');
    return onValue(adminRef, snapshot => {
      const data = snapshot.val() || {};
      const loaded = Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      }));
      setAdmins(loaded);
      setLoading(false);
    });
  }, []);

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdminModal = (admin) => {
    setSelectedAdmin(admin);
    setAdminModalVisible(true);
  };

  const closeAdminModal = () => {
    setAdminModalVisible(false);
    setSelectedAdmin(null);
  };

  const validateFields = () => {
    let isValid = true;
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: ''
    };
    
    if (!firstName) {
      errors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!lastName) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    }
    
    if (!contactNumber) {
      errors.contactNumber = 'Contact number is required';
      isValid = false;
    } else if (!/^\d+$/.test(contactNumber)) {
      errors.contactNumber = 'Contact number must be numeric';
      isValid = false;
    }
    
    setFirstNameError(errors.firstName);
    setLastNameError(errors.lastName);
    setEmailError(errors.email);
    setContactNumberError(errors.contactNumber);
    
    return isValid;
  };

  const onPressAdd = async () => {
    if (!validateFields()) {
      return;
    }

    const auth = getAuth();
    const emailUsed = admins.some(a => a.email === email);
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (emailUsed || (signInMethods && signInMethods.length > 0)) {
      setEmailError('Email already in use.');
      return;
    }

    setPendingAdd({ firstName, middleName, lastName, email, contactNumber });
    setConfirmAddVisible(true);
  };

  const handleAddAdmin = async () => {
    setConfirmAddVisible(false);
    setIsProcessing(true);

    try {
      const { firstName, middleName, lastName, email, contactNumber } = pendingAdd;
      const password = generateRandomPassword();
      const auth = getAuth();

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      
      const highest = admins.length > 0
        ? Math.max(...admins.map(a => parseInt(a.id.replace('admin', '') || '0', 10))) : 0;
      const newID = 'admin' + (highest + 1);
      const dateAdded = new Date().toLocaleString();

      await set(ref(getDatabase(), 'Users/Admin/' + newID), {
        id: newID,
        uid,
        name: `${firstName} ${middleName} ${lastName}`,
        email,
        contactNumber,
        dateAdded,
        role: 'admin',
        password
      });

      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');
      
      setSuccessMessage('Admin added to database successfully!');
      setSuccessVisible(true);
    } catch (e) {
      console.error('Error adding admin:', e);
      setErrorMessage(e.message || 'Failed to add admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdmin = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);

    try {
      const admin = pendingDelete;
      const db = getDatabase();
      
      await remove(ref(db, 'Users/Admin/' + admin.id));

      setSuccessMessage('Admin removed from database successfully!');
      setSuccessVisible(true);
    } catch (e) {
      console.error('Error deleting admin:', e);
      setErrorMessage(e.message || 'Failed to delete admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Co-Admins');

      // Add headers
      worksheet.addRow(['ID', 'Name', 'Email', 'Contact Number', 'Date Added']);

      // Add data
      admins.forEach(admin => {
        worksheet.addRow([
          admin.id,
          admin.name,
          admin.email,
          admin.contactNumber,
          admin.dateAdded
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasErrors = firstNameError || lastNameError || emailError || contactNumberError;
  const totalPages = Math.ceil(filteredAdmins.length / pageSize);
  const paginatedData = filteredAdmins.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Co-Admins</h2>

        <div className="top-controls">
          <button 
            className="create-button"
            onClick={() => setModalVisible(true)}
          >
            Create New Admin
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

        {filteredAdmins.length > 0 && (
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
          {filteredAdmins.length === 0 ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="table-header">
                    <th className="table-header-cell">ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Date Added</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(admin => (
                    <tr key={admin.id} className="table-row">
                      <td className="table-cell">{admin.id}</td>
                      <td className="table-cell">{admin.name}</td>
                      <td className="table-cell">{admin.email}</td>
                      <td className="table-cell">{admin.contactNumber}</td>
                      <td className="table-cell">{admin.dateAdded}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => openAdminModal(admin)}
                          className="view-button"
                        >
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

        {/* New Admin Modal */}
        {modalVisible && (
          <div className="centered-modal">
            <div className="modal-card">
              <button onClick={() => setModalVisible(false)} className="close-button">
                <FaTimes />
              </button>
              <h2 className="modal-title">New Admin</h2>
              
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="modal-label">
                    First Name
                    <span className="required"> *</span>
                  </label>
                  <input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="modal-input"
                  />
                  {firstNameError && <div className="error-text">{firstNameError}</div>}
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label className="modal-label">
                    Middle Name
                  </label>
                  <input
                    placeholder="Middle Name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="modal-input"
                  />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label className="modal-label">
                    Last Name
                    <span className="required"> *</span>
                  </label>
                  <input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="modal-input"
                  />
                  {lastNameError && <div className="error-text">{lastNameError}</div>}
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label className="modal-label">
                    Email
                    <span className="required"> *</span>
                  </label>
                  <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modal-input"
                    type="email"
                  />
                  {emailError && <div className="error-text">{emailError}</div>}
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label className="modal-label">
                    Contact Number
                    <span className="required"> *</span>
                  </label>
                  <input
                    placeholder="Contact Number"
                    value={contactNumber}
                    onChange={(e) => {
                      const numericText = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                      setContactNumber(numericText);
                    }}
                    className="modal-input"
                    type="tel"
                  />
                  {contactNumberError && <div className="error-text">{contactNumberError}</div>}
                </div>

                {hasErrors && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="error-text" style={{ textAlign: 'center' }}>Fill all required fields</div>
                  </div>
                )}

                <div className="modal-button-container">
                  <button 
                    className="add-button" 
                    onClick={onPressAdd}
                  >
                    Add Admin
                  </button>
                  <button 
                    className="cancel-button" 
                    onClick={() => setModalVisible(false)}
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
          <div className="centered-modal">
            <div className="modal-card">
              <button onClick={closeAdminModal} className="close-button">
                <FaTimes />
              </button>
              <div>
                <h2 className="modal-title">Admin Details</h2>
                {selectedAdmin && [
                  ['ID', selectedAdmin.id],
                  ['Name', selectedAdmin.name],
                  ['Email', selectedAdmin.email],
                  ['Contact Number', selectedAdmin.contactNumber],
                  ['Date Added', selectedAdmin.dateAdded],
                ].map(([label, value]) => (
                  <div key={label} className="modal-detail-text">
                    <strong>{label}:</strong> {value || 'N/A'}
                  </div>
                ))}
                <div className="action-buttons-container">
                  <button
                    className="delete-button"
                    onClick={() => {
                      setPendingDelete(selectedAdmin);
                      setConfirmDeleteVisible(true);
                      closeAdminModal();
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
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaExclamationCircle className="confirm-icon" style={{ color: '#faad14' }} />
              <p className="modal-text">Are you sure you want to ADD this admin?</p>
              <div style={{ display: 'flex' }}>
                <button className="confirm-btn" onClick={handleAddAdmin}>
                  Yes
                </button>
                <button className="cancel-btn" onClick={() => setConfirmAddVisible(false)}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaExclamationCircle className="confirm-icon" style={{ color: '#faad14' }} />
              <p className="modal-text">Are you sure you want to DELETE this admin?</p>
              <div style={{ display: 'flex' }}>
                <button className="confirm-btn" onClick={handleDeleteAdmin}>
                  Yes
                </button>
                <button className="cancel-btn" onClick={() => setConfirmDeleteVisible(false)}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FaCheckCircle className="confirm-icon" style={{ color: '#4CAF50' }} />
              <p className="modal-text">{successMessage}</p>
              <button className="confirm-btn" onClick={() => {
                setSuccessVisible(false);
                setPendingAdd(null);
                setPendingDelete(null);
              }}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModalVisible && (
          <div className="centered-modal">
            <div className="small-modal-card">
              <FiAlertCircle className="confirm-icon" style={{ color: '#f44336' }} />
              <p className="modal-text">{errorMessage}</p>
              <button className="cancel-btn" onClick={() => setErrorModalVisible(false)}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {isProcessing && (
          <div className="centered-modal">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoAdmins;