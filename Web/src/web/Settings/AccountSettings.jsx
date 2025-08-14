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
    <div style={styles.passwordField}>
      <input
        type={showPassword[toggleKey] ? "text" : "password"}
        style={styles.input}
        placeholder={label}
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
      <button
        style={styles.eyeIcon}
        onClick={() => setShowPassword(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
      >
        {showPassword[toggleKey] ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        <p style={styles.errorText}>Error: {String(error)}</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div style={styles.errorBox}>
        <p style={styles.errorText}>Failed to load admin data.</p>
      </div>
    );
  }

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Account Settings</h2>

        <div style={styles.container}>
          {/* Sidebar Navigation - Updated to match SystemSettings */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarMenu}>
              <button
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'account' ? styles.sidebarButtonActive : {})
                }}
                onClick={() => setActiveSection('account')}
              >
                Account Information
              </button>
              <button
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'security' ? styles.sidebarButtonActive : {})
                }}
                onClick={() => setActiveSection('security')}
              >
                Security Settings
              </button>
            </div>
          </div>

          {/* Main Content Area - Updated to match SystemSettings */}
          <div style={styles.contentArea}>
            <h2 style={styles.contentTitle}>
              {activeSection === 'account' && 'Account Information'}
              {activeSection === 'security' && 'Security Settings'}
            </h2>

            {/* Account Information Section */}
            {activeSection === 'account' && (
              <div style={styles.section}>
                {formError !== '' && <p style={styles.formError}>{formError}</p>}

                <div style={styles.inputRow}>
                  <label style={styles.label}>Name:</label>
                  {isEditing ? (
                    <input
                      style={styles.input}
                      value={editableData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                    />
                  ) : (
                    <span style={styles.staticText}>{adminData.name}</span>
                  )}
                </div>

                <div style={styles.inputRow}>
                  <label style={styles.label}>Email:</label>
                  <span style={styles.staticText}>{adminData.email}</span>
                </div>

                <div style={styles.inputRow}>
                  <label style={styles.label}>Contact Number:</label>
                  {isEditing ? (
                    <input
                      style={styles.input}
                      value={editableData.contactNumber}
                      onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                    />
                  ) : (
                    <span style={styles.staticText}>{adminData.contactNumber}</span>
                  )}
                </div>

                <div style={styles.buttonRow}>
                  {isEditing ? (
                    <>
                      <button 
                        style={styles.cancelBtn} 
                        onClick={() => {
                          setIsEditing(false);
                          setEditableData({
                            name: adminData.name || '',
                            contactNumber: adminData.contactNumber || ''
                          });
                          setFormError('');
                        }}
                      >
                        Cancel
                      </button>
                      <button style={styles.saveBtn} onClick={handleSaveChanges}>
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
                      Edit Information
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Security Settings Section */}
            {activeSection === 'security' && (
              <div style={styles.section}>
                <button 
                  style={styles.changePassBtn} 
                  onClick={() => setChangePasswordVisible(true)}
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {changePasswordVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button 
              onClick={() => {
                setChangePasswordVisible(false);
                setPasswordError('');
              }} 
              style={styles.closeButton}
            >
              <AiOutlineClose />
            </button>
            <h3 style={styles.modalTitle}>Change Password</h3>
            
            {renderPasswordField('Current Password', currentPassword, setCurrentPassword, 'current')}
            {renderPasswordField('New Password', newPassword, setNewPassword, 'new')}
            {renderPasswordField('Confirm Password', confirmPassword, setConfirmPassword, 'confirm')}
            
            {passwordError !== '' && <p style={styles.formError}>{passwordError}</p>}

            <div style={styles.modalButtons}>
              <button 
                style={styles.modalBtnCancel} 
                onClick={() => {
                  setChangePasswordVisible(false);
                  setPasswordError('');
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.modalBtnConfirm} 
                onClick={handleChangePassword}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaCheckCircle style={styles.confirmIcon} />
            <p style={styles.modalText}>{successMessage}</p>
            <button
              style={styles.confirmBtn}
              onClick={() => setSuccessModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRight: '1px solid #e0e0e0',
    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  sidebarButton: {
    display: 'block',
    width: '100%',
    padding: '12px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  sidebarButtonActive: {
    backgroundColor: '#f0f7ff',
    color: '#2D5783',
    fontWeight: '500',
    borderLeft: '3px solid #2D5783',
  },
  contentArea: {
    flex: 1,
    padding: '30px',
    backgroundColor: '#fff',
  },
  contentTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '25px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  section: {
    marginBottom: '30px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    width: '200px',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  staticText: {
    fontSize: '14px',
    color: '#333',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
    gap: '10px',
  },
  editBtn: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    color: '#333',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  changePassBtn: {
    backgroundColor: '#F59E0B',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  formError: {
    color: 'red',
    margin: '10px 0',
    textAlign: 'center',
  },
  errorBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  errorText: {
    color: 'red',
    fontSize: '1rem',
    textAlign: 'center',
  },
  passwordField: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#555',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  },
  modalContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    padding: '20px',
    width: '35%',
    maxWidth: '500px',
    position: 'relative',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2D5783',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  modalBtnCancel: {
    backgroundColor: '#f1f5f9',
    color: '#555',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
  },
  modalBtnConfirm: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: '10',
    padding: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  modalCardSmall: {
    backgroundColor: '#D9D9D9',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '35%',
    maxWidth: '400px',
  },
  confirmIcon: {
    marginBottom: '15px',
    fontSize: '30px',
    color: '#4CAF50',
  },
  modalText: {
    fontSize: '1rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: '#2D5783',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderLeftColor: '#2D5783',
    animation: 'spin 1s linear infinite',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  }
};

export default AccountSettings;