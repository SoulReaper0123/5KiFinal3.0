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
        style={styles.passwordInput}
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
    <div style={styles.pageContainer}>
      <div style={styles.headerContainer}>
        <h1 style={styles.headerText}>Account Settings</h1>
      </div>

      <div style={styles.container}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'account' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => setActiveSection('account')}
          >
            <span style={styles.sidebarButtonText}>Account Information</span>
          </button>

          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'security' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => setActiveSection('security')}
          >
            <span style={styles.sidebarButtonText}>Security Settings</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          {activeSection === 'account' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Account Information</h2>
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
                  <span style={styles.valueText}>{adminData.name}</span>
                )}
              </div>

              <div style={styles.inputRow}>
                <label style={styles.label}>Email:</label>
                <span style={styles.valueText}>{adminData.email}</span>
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
                  <span style={styles.valueText}>{adminData.contactNumber}</span>
                )}
              </div>

              <div style={styles.buttonRow}>
                {isEditing ? (
                  <>
                    <button 
                      style={styles.cancelButton} 
                      onClick={() => {
                        setIsEditing(false);
                        setEditableData({
                          name: adminData.name || '',
                          contactNumber: adminData.contactNumber || ''
                        });
                        setFormError('');
                      }}
                    >
                      <span style={styles.buttonText}>Cancel</span>
                    </button>
                    <button style={styles.saveButton} onClick={handleSaveChanges}>
                      <span style={styles.buttonText}>Save Changes</span>
                    </button>
                  </>
                ) : (
                  <button style={styles.editButton} onClick={() => setIsEditing(true)}>
                    <span style={styles.buttonText}>Edit Information</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Security Settings</h2>
              <button 
                style={styles.changePasswordButton} 
                onClick={() => setChangePasswordVisible(true)}
              >
                <span style={styles.buttonText}>Change Password</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {changePasswordVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <button 
              onClick={() => {
                setChangePasswordVisible(false);
                setPasswordError('');
              }} 
              style={styles.closeButton}
            >
              <AiOutlineClose />
            </button>
            <h2 style={styles.modalTitle}>Change Password</h2>
            
            {renderPasswordField('Current Password', currentPassword, setCurrentPassword, 'current')}
            {renderPasswordField('New Password', newPassword, setNewPassword, 'new')}
            {renderPasswordField('Confirm Password', confirmPassword, setConfirmPassword, 'confirm')}
            
            {passwordError !== '' && <p style={styles.formError}>{passwordError}</p>}

            <div style={styles.modalButtonContainer}>
              <button 
                style={styles.modalCancelButton} 
                onClick={() => {
                  setChangePasswordVisible(false);
                  setPasswordError('');
                }}
              >
                <span style={styles.buttonText}>Cancel</span>
              </button>
              <button 
                style={styles.modalConfirmButton} 
                onClick={handleChangePassword}
              >
                <span style={styles.buttonText}>Update Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.successModalContainer}>
            <FaCheckCircle style={styles.confirmIcon} />
            <p style={styles.modalText}>{successMessage}</p>
            <button
              style={styles.modalConfirmButton}
              onClick={() => setSuccessModalVisible(false)}
            >
              <span style={styles.buttonText}>OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    padding: '10px',
    marginTop: '70px',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: '40px',
    marginBottom: '10px',
    marginLeft: '25px',
    marginRight: '25px',
  },
  container: {
    display: 'flex',
    minHeight: 'calc(100vh - 150px)',
    backgroundColor: '#f5f7fa',
    margin: '0 25px',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRight: '1px solid #e0e0e0',
    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
    borderRadius: '10px 0 0 10px',
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
    marginBottom: '5px',
  },
  sidebarButtonActive: {
    backgroundColor: '#f0f7ff',
    color: '#2D5783',
    fontWeight: '500',
    borderLeft: '3px solid #2D5783',
  },
  sidebarButtonText: {
    fontSize: '14px',
  },
  contentArea: {
    flex: 1,
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '0 10px 10px 0',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#2D5783',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
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
  valueText: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
    padding: '10px 0',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
    gap: '10px',
  },
  editButton: {
    backgroundColor: '#2D5783',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  changePasswordButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  buttonText: {
    fontSize: '0.875rem',
  },
  formError: {
    color: '#dc3545',
    fontSize: '0.875rem',
    marginBottom: '10px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '30px',
    width: '90%',
    maxWidth: '400px',
    position: 'relative',
  },
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '30px',
    width: '90%',
    maxWidth: '300px',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#001F3F',
    textAlign: 'center',
  },
  passwordField: {
    position: 'relative',
    marginBottom: '15px',
  },
  passwordInput: {
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '10px 45px 10px 10px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  eyeIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    fontSize: '1rem',
  },
  modalButtonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
    gap: '10px',
  },
  modalCancelButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    backgroundColor: '#6c757d',
    color: '#fff',
  },
  modalConfirmButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    backgroundColor: '#007bff',
    color: '#fff',
  },
  confirmIcon: {
    fontSize: '3rem',
    color: '#28a745',
    marginBottom: '15px',
  },
  modalText: {
    fontSize: '1rem',
    marginBottom: '20px',
    color: '#333',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2D5783',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '1.125rem',
    textAlign: 'center',
  },
};

export default AccountSettings;