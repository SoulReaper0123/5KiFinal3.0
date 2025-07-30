import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({ name: '', contactNumber: '' });

  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false, new: false, confirm: false
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) throw new Error('No admin ID found.');
        const db = getDatabase();
        const adminRef = ref(db, `Users/Admin/${adminId}`);
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setAdminData(data);
          setEditableData({
            name: data.name || '',
            contactNumber: data.contactNumber || ''
          });
        } else throw new Error('Admin data not found.');
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleEditChange = (field, value) => {
    setFormError('');
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const { name, contactNumber } = editableData;
      if (!name || !contactNumber) {
        setFormError('All fields must be filled out.');
        return;
      }

      const adminId = localStorage.getItem('adminId');
      const db = getDatabase();
      const adminRef = ref(db, `Users/Admin/${adminId}`);
      await update(adminRef, editableData);
      setAdminData(prev => ({ ...prev, ...editableData }));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setSuccessModalVisible(true);
    } catch (error) {
      setFormError('Failed to save changes.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill out all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setChangePasswordVisible(false);
      setSuccessMessage('Password updated successfully!');
      setSuccessModalVisible(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Current password is incorrect.');
    }
  };

  const renderPasswordField = (label, value, setter, toggleKey) => (
    <div className="password-field">
      <input
        type={showPassword[toggleKey] ? "text" : "password"}
        className="input"
        placeholder={label}
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
      <button
        className="eye-icon"
        onClick={() => setShowPassword(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
      >
        {showPassword[toggleKey] ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-view">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <p className="error-text">Error: {String(error)}</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="error-box">
        <p className="error-text">Failed to load admin data.</p>
      </div>
    );
  }

  return (
    <div className="account-settings">
      <div className="main-container">
        <h1 className="header-text">Account Settings</h1>

        <div className="content-container">
          {/* Sidebar */}
          <div className="sidebar">
            <button
              className={`sidebar-button ${activeSection === 'account' ? 'active' : ''}`}
              onClick={() => setActiveSection('account')}
            >
              <span className="sidebar-button-text">Account Information</span>
            </button>

            <button
              className={`sidebar-button ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <span className="sidebar-button-text">Security Settings</span>
            </button>
          </div>

          {/* Content */}
          <div className="content-area">
            {activeSection === 'account' && (
              <div className="section-container">
                <h2 className="section-header">Account Information</h2>
                {formError !== '' && <p className="form-error">{formError}</p>}

                <div className="card">
                  <label className="label">Name:</label>
                  {isEditing ? (
                    <input
                      className="input"
                      value={editableData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                    />
                  ) : (
                    <p className="value-text">{adminData.name}</p>
                  )}
                </div>

                <div className="card">
                  <label className="label">Email:</label>
                  <p className="value-text">{adminData.email}</p>
                </div>

                <div className="card">
                  <label className="label">Contact Number:</label>
                  {isEditing ? (
                    <input
                      className="input"
                      value={editableData.contactNumber}
                      onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                    />
                  ) : (
                    <p className="value-text">{adminData.contactNumber}</p>
                  )}
                </div>

                <div className="button-row">
                  {isEditing ? (
                    <>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditableData({
                            name: adminData.name || '',
                            contactNumber: adminData.contactNumber || ''
                          });
                          setFormError('');
                        }}
                      >
                        <span className="btn-text">Cancel</span>
                      </button>
                      <button className="save-btn" onClick={handleSaveChanges}>
                        <span className="btn-text">Save Changes</span>
                      </button>
                    </>
                  ) : (
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                      <span className="btn-text">Edit Information</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="section-container">
                <h2 className="section-header">Security Settings</h2>
                <button 
                  className="change-pass-btn" 
                  onClick={() => setChangePasswordVisible(true)}
                >
                  <span className="btn-text">Change Password</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {changePasswordVisible && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button 
              onClick={() => {
                setChangePasswordVisible(false);
                setPasswordError('');
              }} 
              className="close-button"
            >
              <AiOutlineClose />
            </button>
            <h2 className="modal-title">Change Password</h2>
            
            {renderPasswordField('Current Password', currentPassword, setCurrentPassword, 'current')}
            {renderPasswordField('New Password', newPassword, setNewPassword, 'new')}
            {renderPasswordField('Confirm Password', confirmPassword, setConfirmPassword, 'confirm')}
            
            {passwordError !== '' && <p className="form-error">{passwordError}</p>}

            <div className="modal-button-container">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setChangePasswordVisible(false);
                  setPasswordError('');
                }}
              >
                <span className="cancel-button-text">Cancel</span>
              </button>
              <button 
                className="confirm-button" 
                onClick={handleChangePassword}
              >
                <span className="confirm-button-text">Update Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalVisible && (
        <div className="modal-overlay">
          <div className="modal-card-small">
            <FaCheckCircle className="confirm-icon" />
            <p className="modal-text">{successMessage}</p>
            <button
              className="confirm-btn"
              onClick={() => setSuccessModalVisible(false)}
            >
              <span className="button-text">OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS Styles
const styles = `
  .account-settings {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #F5F5F5;
  }

  .main-container {
    flex: 1;
    padding: 10px;
    margin-top: 70px;
  }

  .header-text {
    font-weight: bold;
    font-size: 2.5rem;
    margin-bottom: 10px;
    margin-left: 25px;
    margin-right: 25px;
  }

  .content-container {
    display: flex;
    flex: 1;
    margin: 0 25px;
  }

  .sidebar {
    width: 200px;
    background-color: #D9D9D9;
    border-radius: 10px;
    padding: 10px;
    margin-right: 20px;
  }

  .sidebar-button {
    padding: 15px 10px;
    border-radius: 5px;
    margin-bottom: 5px;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .sidebar-button.active {
    background-color: #2D5783;
  }

  .sidebar-button-text {
    font-size: 1rem;
    color: #333;
  }

  .sidebar-button.active .sidebar-button-text {
    color: #fff;
    font-weight: bold;
  }

  .content-area {
    flex: 1;
    padding-bottom: 20px;
    overflow-y: auto;
  }

  .section-container {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .section-header {
    font-size: 1.375rem;
    font-weight: bold;
    margin-bottom: 20px;
    color: #001F3F;
  }

  .card {
    margin-bottom: 15px;
  }

  .label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #001F3F;
    display: block;
  }

  .value-text {
    font-size: 1rem;
    padding: 8px 0;
  }

  .input {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 10px;
    margin-top: 5px;
    background-color: #fff;
    width: 100%;
    box-sizing: border-box;
  }

  .input:disabled {
    background-color: #f5f5f5;
    color: #666;
  }

  .button-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    gap: 10px;
  }

  .edit-btn, .save-btn, .change-pass-btn, .cancel-btn {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  .edit-btn {
    background-color: #2D5783;
  }

  .save-btn {
    background-color: #4CAF50;
  }

  .cancel-btn {
    background-color: #ccc;
  }

  .change-pass-btn {
    background-color: #F59E0B;
  }

  .btn-text {
    color: #fff;
    text-align: center;
    font-weight: bold;
    font-size: 0.875rem;
  }

  .form-error {
    color: red;
    margin: 10px 0;
    text-align: center;
  }

  .error-box {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .error-text {
    color: red;
    font-size: 1rem;
    text-align: center;
  }

  .password-field {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    position: relative;
  }

  .eye-icon {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    color: #555;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-container {
    background-color: #f9f9f9;
    border-radius: 10px;
    padding: 20px;
    width: 35%;
    max-width: 500px;
    position: relative;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 20px;
    color: #001F3F;
    text-align: center;
  }

  .modal-description {
    margin-bottom: 20px;
    text-align: center;
    color: #333;
  }

  .modal-button-container {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }

  .cancel-button, .confirm-button {
    padding: 12px;
    border-radius: 8px;
    width: 48%;
    text-align: center;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  .cancel-button {
    background-color: #ccc;
  }

  .confirm-button {
    background-color: #2D5783;
    color: #fff;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    padding: 5px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .modal-card-small {
    background-color: #D9D9D9;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 35%;
    max-width: 400px;
  }

  .confirm-icon {
    margin-bottom: 15px;
    font-size: 30px;
    color: #4CAF50;
  }

  .modal-text {
    font-size: 1rem;
    margin-bottom: 20px;
    text-align: center;
  }

  .confirm-btn {
    background-color: #2D5783;
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: #fff;
    font-weight: bold;
  }

  .loading-view {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .spinner {
    border: 4px solid rgba(0, 31, 63, 0.1);
    border-radius: 50%;
    border-top: 4px solid #001F3F;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 800px) {
    .content-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      margin-right: 0;
      margin-bottom: 20px;
    }

    .modal-container, .modal-card-small {
      width: 90%;
    }
  }
`;

// Add styles to the document
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default AccountSettings;