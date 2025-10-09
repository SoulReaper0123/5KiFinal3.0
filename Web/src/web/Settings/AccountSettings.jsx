import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaCheckCircle, FaUser, FaShieldAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { ConfirmModal, SuccessModal } from '../components/Modals';

const formatFullName = (data = {}) => {
  const firstName = (data.firstName || '').trim();
  const middleName = (data.middleName || '').trim();
  const lastName = (data.lastName || '').trim();
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : (data.name || '').trim();
};

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [adminData, setAdminData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    name: ''
  });

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
  const [actionInProgress, setActionInProgress] = useState(false);

  // Confirmation modal state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) throw new Error('No admin ID found.');
        const db = getDatabase();
        const role = localStorage.getItem('userRole') || 'admin';
        const node = role === 'superadmin' ? 'Users/SuperAdmin' : role === 'coadmin' ? 'Users/CoAdmin' : 'Users/Admin';
        const adminRef = ref(db, `${node}/${adminId}`);
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const fallbackName = formatFullName(data);
          setAdminData({ ...data, name: fallbackName, role });
          setEditableData({
            firstName: data.firstName || '',
            middleName: data.middleName || '',
            lastName: data.lastName || '',
            contactNumber: data.contactNumber || '',
            name: fallbackName
          });
        } else {
          throw new Error('Admin data not found.');
        }
      } catch (fetchError) {
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    };

    const fetchMemberData = async () => {
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) return;
        const db = getDatabase();
        const memberRef = ref(db, `Members/${adminId}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          setMemberData(snapshot.val());
        }
      } catch (memberError) {
        console.error('Failed to fetch member data:', memberError);
      }
    };

    fetchAdminData();
    fetchMemberData();
  }, []);

  const handleEditChange = (field, value) => {
    setFormError('');
    setEditableData(prev => {
      const updated = { ...prev, [field]: value };
      if (['firstName', 'middleName', 'lastName'].includes(field)) {
        updated.name = formatFullName(updated);
      }
      return updated;
    });
  };

  const showConfirmModal = (message, onConfirm, onCancel = () => {}) => {
    setConfirmModalConfig({
      message,
      onConfirm: () => {
        setConfirmModalVisible(false);
        onConfirm();
      },
      onCancel: () => {
        setConfirmModalVisible(false);
        onCancel();
      }
    });
    setConfirmModalVisible(true);
  };

  const handleSaveChanges = async () => {
    try {
      setActionInProgress(true);
      const { firstName, middleName, lastName, name, contactNumber } = editableData;

      if (!firstName.trim() || !lastName.trim() || !contactNumber.trim()) {
        setFormError('First name, last name, and contact number are required.');
        return;
      }

      const adminId = localStorage.getItem('adminId');
      const role = localStorage.getItem('userRole') || 'admin';
      const db = getDatabase();
      const node = role === 'superadmin' ? 'Users/SuperAdmin' : role === 'coadmin' ? 'Users/CoAdmin' : 'Users/Admin';
      const updates = {
        [`${node}/${adminId}`]: {
          ...adminData,
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          name,
          contactNumber: contactNumber.trim(),
        },
        [`Members/${adminId}`]: {
          ...memberData,
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          name,
          contactNumber: contactNumber.trim(),
        }
      };

      await update(ref(db), updates);

      const updatedData = {
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        name,
        contactNumber: contactNumber.trim(),
      };

      setAdminData(prev => ({ ...prev, ...updatedData }));
      setMemberData(prev => ({ ...(prev || {}), ...updatedData }));
      setEditableData(prev => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setSuccessModalVisible(true);
    } catch (error) {
      setFormError('Failed to save changes.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSaveChangesWithConfirmation = () => {
    showConfirmModal(
      'Are you sure you want to save these changes to your profile?',
      handleSaveChanges,
      () => {
        // Cancel callback - do nothing
      }
    );
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
      setActionInProgress(true);
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
    } finally {
      setActionInProgress(false);
    }
  };

  const handleChangePasswordWithConfirmation = () => {
    showConfirmModal(
      'Are you sure you want to change your password?',
      handleChangePassword,
      () => {
        // Cancel callback - do nothing
      }
    );
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
        type="button"
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
      <div style={styles.errorContainer}>
        <h2 style={styles.errorHeading}>Error loading data</h2>
        <p style={styles.errorText}>{error.message}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorHeading}>Data Not Found</h2>
        <p style={styles.errorText}>Failed to load admin data.</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Enhanced Sidebar Navigation */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Account Management</h3>
        </div>
        <div style={styles.sidebarMenu}>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'account' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => setActiveSection('account')}
          >
            <FaUser style={styles.sidebarIcon} />
            <span style={styles.sidebarButtonText}>Account Information</span>
          </button>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'security' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => setActiveSection('security')}
          >
            <FaShieldAlt style={styles.sidebarIcon} />
            <span style={styles.sidebarButtonText}>Security Settings</span>
          </button>
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <div style={styles.contentArea}>
        <div style={styles.contentHeader}>
          <h2 style={styles.contentTitle}>
            {activeSection === 'account' && 'Account Information'}
            {activeSection === 'security' && 'Security Settings'}
          </h2>
          <div style={styles.contentSubtitle}>
            {activeSection === 'account' && 'Manage your personal information and contact details'}
            {activeSection === 'security' && 'Update your password and security preferences'}
          </div>
        </div>

        {/* Account Information Section */}
        {activeSection === 'account' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaUser style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Personal Information</h3>
                </div>
                {!isEditing ? (
                  <button 
                    style={styles.headerIconBtn} 
                    title="Edit Information" 
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save Changes"
                      onClick={handleSaveChangesWithConfirmation}
                      disabled={actionInProgress}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        setIsEditing(false);
                        setEditableData({
                          name: adminData.name || '',
                          contactNumber: adminData.contactNumber || ''
                        });
                        setFormError('');
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.cardContent}>
                {formError && (
                  <div style={styles.errorMessage}>
                    {formError}
                  </div>
                )}

                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Full Name</span>
                    <span style={styles.labelDescription}>Your complete name as displayed</span>
                  </label>
                  {isEditing ? (
                    <input
                      style={styles.input}
                      value={editableData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div style={styles.valueDisplay}>
                      <span style={styles.valueText}>{adminData.name}</span>
                    </div>
                  )}
                </div>

                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Email Address</span>
                    <span style={styles.labelDescription}>Your primary email for login</span>
                  </label>
                  <div style={styles.valueDisplay}>
                    <span style={styles.valueText}>{adminData.email}</span>
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Contact Number</span>
                    <span style={styles.labelDescription}>Your primary contact number</span>
                  </label>
                  {isEditing ? (
                    <input
                      style={styles.input}
                      value={editableData.contactNumber}
                      onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                      placeholder="Enter your contact number"
                    />
                  ) : (
                    <div style={styles.valueDisplay}>
                      <span style={styles.valueText}>{adminData.contactNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings Section */}
        {activeSection === 'security' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaShieldAlt style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Password & Security</h3>
                </div>
              </div>

              <div style={styles.cardContent}>
                <div style={styles.securitySection}>
                  <h4 style={styles.sectionSubtitle}>Password Management</h4>
                  <p style={styles.sectionDescription}>
                    Keep your account secure by regularly updating your password. 
                    Use a strong password with at least 8 characters.
                  </p>
                  
                  <div style={styles.actionButtonContainer}>
                    <button 
                      style={styles.primaryButton}
                      onClick={() => setChangePasswordVisible(true)}
                    >
                      <FaShieldAlt style={{ marginRight: 8 }} />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Change Password Modal */}
      {changePasswordVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.enhancedModal}>
            <h3 style={styles.enhancedModalTitle}>Change Password</h3>
            
            {passwordError && (
              <div style={styles.errorMessage}>
                {passwordError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={styles.modalLabel}>Current Password</label>
              {renderPasswordField('Enter current password', currentPassword, setCurrentPassword, 'current')}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.modalLabel}>New Password</label>
              {renderPasswordField('Enter new password', newPassword, setNewPassword, 'new')}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.modalLabel}>Confirm New Password</label>
              {renderPasswordField('Confirm new password', confirmPassword, setConfirmPassword, 'confirm')}
            </div>

            <div style={styles.enhancedModalButtons}>
              <button
                style={{
                  ...styles.enhancedModalBtnPrimary,
                  ...(actionInProgress && styles.disabledButton)
                }}
                onClick={handleChangePasswordWithConfirmation}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Updating...' : 'Update Password'}
              </button>
              <button
                style={{
                  ...styles.enhancedModalBtnSecondary,
                  ...(actionInProgress && styles.disabledButton)
                }}
                onClick={() => {
                  setChangePasswordVisible(false);
                  setPasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={actionInProgress}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        message={confirmModalConfig.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        iconColor="#3B82F6"
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={confirmModalConfig.onCancel}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
        okLabel="Continue"
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRight: '1px solid #e2e8f0',
    boxShadow: '4px 0 20px rgba(0,0,0,0.04)',
  },
  sidebarHeader: {
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f1f5f9'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#64748b',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    gap: '12px'
  },
  sidebarButtonActive: {
    backgroundColor: '#f0f7ff',
    color: '#1e40af',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
  },
  sidebarIcon: {
    fontSize: '18px',
    opacity: '0.8'
  },
  sidebarButtonText: {
    fontSize: '15px',
    fontWeight: '500'
  },
  contentArea: {
    flex: 1,
    padding: '32px',
    backgroundColor: '#f8fafc',
    minWidth: 0,
    overflow: 'auto',
  },
  contentHeader: {
    marginBottom: '32px'
  },
  contentTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em'
  },
  contentSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '400'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f8fafc'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardIcon: {
    fontSize: '24px',
    color: '#1e40af'
  },
  cardTitleText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1'
  },
  labelText: {
    fontSize: '15px',
    color: '#374151',
    fontWeight: '600'
  },
  labelDescription: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '400'
  },
  input: {
    flex: 1,
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff'
  },
  valueDisplay: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  valueText: {
    fontSize: '15px',
    color: '#374151',
    fontWeight: '500'
  },
  headerIconBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  securitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionSubtitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0'
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '0'
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px'
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 24px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
  },
  centeredModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  enhancedModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '450px',
    border: '1px solid #e2e8f0'
  },
  enhancedModalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1e293b',
    textAlign: 'center'
  },
  enhancedModalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px'
  },
  enhancedModalBtnPrimary: {
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    minWidth: '120px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  enhancedModalBtnSecondary: {
    padding: '14px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    minWidth: '120px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '2px solid #e2e8f0'
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none'
  },
  modalLabel: {
    fontWeight: 600,
    display: 'block',
    marginBottom: 8,
    color: '#374151',
    fontSize: '14px'
  },
  passwordField: {
    position: 'relative',
    width: '100%'
  },
  passwordInput: {
    width: '100%',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 45px 14px 16px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  },
  eyeIcon: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '16px',
    padding: '4px'
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fecaca',
    marginBottom: '16px'
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
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center',
  },
  errorHeading: {
    fontSize: '20px',
    color: '#ef4444',
    marginBottom: '12px',
    fontWeight: '600'
  },
  errorText: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '24px',
    maxWidth: '400px'
  },
  retryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  }
};

// Add CSS for animations
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .enhanced-modal-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .enhanced-modal-btn-secondary:hover:not(:disabled) {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }

  .enhanced-modal-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
document.head.appendChild(styleElement);

export default AccountSettings;