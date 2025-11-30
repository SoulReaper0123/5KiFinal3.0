import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { 
  checkBiometricSupport, 
  Storage, 
  authenticateBiometric,
  isMobileBrowser 
} from '../Auth/utils/platformUtils';

const Settings = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmail, setCurrentEmail] = useState(email);
  
  // Modal states like Deposit screen
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('error');

  // Add this useEffect to listen for navigation params
useEffect(() => {
 const checkBiometricsOnFocus = async () => {
    // Don't run on web
    if (Platform.OS === 'web') {
      setBiometricsEnabled(false);
      return;
    }

    try {
      // Check if biometrics are enabled for this user
      const credentials = await SecureStore.getItemAsync('biometricCredentials');
      if (credentials && currentEmail) {
        const storedData = JSON.parse(credentials);
        if (storedData.email === currentEmail) {
          setBiometricsEnabled(true);
        } else {
          setBiometricsEnabled(false);
        }
      } else {
        setBiometricsEnabled(false);
      }
    } catch (error) {
      console.error('Biometric check error:', error);
      setBiometricsEnabled(false);
    }
  };

  // Check when screen comes into focus
  const unsubscribe = navigation.addListener('focus', () => {
    checkBiometricsOnFocus();
  });

  // Also check when we receive refresh params
  if (route.params?.refreshBiometrics) {
    checkBiometricsOnFocus();
    // Clear the params to avoid repeated refreshes
    navigation.setParams({ refreshBiometrics: undefined });
  }

  return unsubscribe;
}, [navigation, currentEmail, route.params]);

  // ← UPDATE the getEmail function to add platform check:
  useEffect(() => {
    const getEmail = async () => {
      if (!email) {
        try {
          // Only use SecureStore on native platforms
          if (Platform.OS !== 'web') {
            const storedEmail = await SecureStore.getItemAsync('currentUserEmail');
            if (storedEmail) {
              setCurrentEmail(storedEmail);
            }
          }
        } catch (error) {
          console.error('Error getting email from SecureStore:', error);
        }
      } else {
        setCurrentEmail(email);
      }
    };

    getEmail();
  }, [email]);

  useEffect(() => {
const checkBiometrics = async () => {
  // Disable biometric features on web and mobile browsers
  if (Platform.OS === 'web' || isMobileBrowser()) {
    setBiometricsAvailable(false);
    setBiometricsEnabled(false);
    return;
  }

  try {
    const biometricSupport = await checkBiometricSupport();
    
    setBiometricsAvailable(biometricSupport.isSupported);
    
    // Check if biometrics are enabled for this user
    const credentials = await Storage.getItem('biometricCredentials');
    if (credentials && currentEmail) {
      const storedData = JSON.parse(credentials);
      if (storedData.email === currentEmail) {
        setBiometricsEnabled(true);
      }
    }
  } catch (error) {
    console.error('Biometric check error:', error);
  }
};
    
    checkBiometrics();
    
    // Get current authenticated user
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    }
  }, [currentEmail]);

   const enableBiometrics = async () => {
    // Don't run on web
    if (Platform.OS === 'web') {
      setModalMessage('Fingerprint login is not available on web browser');
      setModalType('error');
      setModalVisible(true);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        setModalMessage('Your device does not support biometric authentication or you have not set up fingerprints in your device settings.');
        setModalType('error');
        setModalVisible(true);
        return;
      }
      
      navigation.navigate('BiometricSetup', { 
        email: currentEmail,
        fromHome: false 
      });
      
    } catch (error) {
      console.error('Enable biometrics error:', error);
      setModalMessage('Could not enable fingerprint login');
      setModalType('error');
      setModalVisible(true);
    }
  };

  // ← UPDATE disableBiometrics function:
  const disableBiometrics = async () => {
    // Don't run on web
    if (Platform.OS === 'web') {
      setModalMessage('Fingerprint login is not available on web browser');
      setModalType('error');
      setModalVisible(true);
      return;
    }

    try {
      await SecureStore.deleteItemAsync('biometricCredentials');
      setBiometricsEnabled(false);
      setModalMessage('Fingerprint login has been disabled');
      setModalType('success');
      setModalVisible(true);
    } catch (error) {
      console.error('Disable biometrics error:', error);
      setModalMessage('Could not disable fingerprint login');
      setModalType('error');
      setModalVisible(true);
    }
  };

  // ← UPDATE testFingerprint function:
const testFingerprint = async () => {
  // Don't run on web or mobile browsers
  if (Platform.OS === 'web' || isMobileBrowser()) {
    setModalMessage('Fingerprint testing is only available in the mobile app.');
    setModalType('error');
    setModalVisible(true);
    return;
  }

  try {
    const result = await authenticateBiometric({
      promptMessage: 'Test your fingerprint',
      fallbackLabel: 'Use passcode instead'
    });

    if (result.success) {
      setModalMessage('Fingerprint authentication test passed!');
      setModalType('success');
      setModalVisible(true);
    } else {
      setModalMessage(result.message || 'Fingerprint authentication test failed. Please try again.');
      setModalType('error');
      setModalVisible(true);
    }
  } catch (error) {
    console.error('Fingerprint test error:', error);
    setModalMessage('Could not test fingerprint authentication');
    setModalType('error');
    setModalVisible(true);
  }
};
  // Toggle fingerprint login
  const toggleFingerprint = async (value) => {
    if (value) {
      await enableBiometrics();
    } else {
      await disableBiometrics();
    }
  };

  // Change Password Functions
  const handleChangePassword = () => {
    setChangePasswordModal(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const validatePassword = (password) => {
    // Minimum 8 characters only - no special requirements
    return password.length >= 8;
  };

  const handlePasswordSubmit = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      setErrorModalVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match');
      setErrorModalVisible(true);
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMessage('Password must be at least 8 characters long');
      setErrorModalVisible(true);
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from current password');
      setErrorModalVisible(true);
      return;
    }

    // Show confirmation modal
    setConfirmModalVisible(true);
  };

  const submitPasswordChange = async () => {
    // Close the change password modal first so loading overlay is visible
    setChangePasswordModal(false);
    setConfirmModalVisible(false);
    setChangingPassword(true);

    try {
      // Check if user is authenticated
      if (!currentUser) {
        setErrorMessage('No user is currently authenticated. Please log in again.');
        setErrorModalVisible(true);
        setChangingPassword(false);
        return;
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password in Firebase Authentication
      await updatePassword(currentUser, passwordData.newPassword);

      // Show success modal
      setSuccessModalVisible(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error) {
      console.error('Password change error:', error);
      
      // Handle specific Firebase auth errors - FIXED ERROR CODE CHECKING
      let errorMsg = 'Failed to change password. Please try again.';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'New password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMsg = 'For security reasons, please log in again before changing your password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection and try again.';
      }
      
      setErrorMessage(errorMsg);
      setErrorModalVisible(true);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
  };

  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header with centered title and left back button using invisible spacers */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerSide} onPress={() => {
              const parent = navigation.getParent();
              if (parent && parent.openDrawer) {
                parent.openDrawer();
              } else {
                navigation.goBack();
              }
            }}>
              <MaterialIcons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            {/* Right spacer to balance the back button width */}
            <View style={styles.headerSide} />
          </View>

          <View style={styles.content}>
            {/* Security Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>
              
              {/* Change Password */}
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={handleChangePassword}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="lock-closed" size={24} color="#2D5783" />
                  <Text style={styles.settingText}>Change Password</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
              
              {/* Fingerprint Login */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="finger-print" size={24} color="#2D5783" />
                  <View>
                    <Text style={styles.settingText}>Fingerprint Login</Text>
                    <Text style={styles.settingSubtext}>
                      {biometricsAvailable 
                        ? 'Use your fingerprint for faster login'
                        : 'Biometrics not available on this device'
                      }
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={toggleFingerprint}
                  disabled={!biometricsAvailable}
                  trackColor={{ false: "#ccc", true: "#2D5783" }}
                  thumbColor={biometricsEnabled ? "#4FE7AF" : "#f4f3f4"}
                />
              </View>

              {/* Test Fingerprint Button */}
              {biometricsEnabled && (
                <TouchableOpacity 
                  style={[styles.settingRow, styles.testButton]}
                  onPress={testFingerprint}
                >
                  <View style={styles.settingInfo}>
                    <Ionicons name="checkmark-circle" size={24} color="#4FE7AF" />
                    <Text style={styles.settingText}>Test Fingerprint</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              
              <View style={styles.aboutInfo}>
                <Text style={styles.appName}>5KI Banking App</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appCopyright}>© 2025 5KI Banking. All rights reserved.</Text>
              </View>
            </View>
          </View>

          {/* Custom Confirmation Modal - Same as Deposit */}
          <CustomConfirmModal
            visible={confirmModalVisible}
            onClose={() => setConfirmModalVisible(false)}
            title="Confirm Password Change"
            message="Are you sure you want to change your password? This action cannot be undone."
            type="info"
            cancelText="Cancel"
            confirmText="Confirm"
            onCancel={() => setConfirmModalVisible(false)}
            onConfirm={submitPasswordChange}
          />

          {/* Success Modal - Using CustomModal */}
          <CustomModal
            visible={successModalVisible}
            onClose={handleSuccessOk}
            message="Password changed successfully!"
            type="success"
          />

          {/* Error Modal - Using CustomModal */}
          <CustomModal
            visible={errorModalVisible}
            onClose={handleErrorOk}
            message={errorMessage}
            type="error"
          />

          {/* Custom Modal for general messages */}
          <CustomModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            message={modalMessage}
            type={modalType}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={changePasswordModal}
        onRequestClose={() => !changingPassword && setChangePasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleLarge}>Change Password</Text>
              <TouchableOpacity 
                onPress={() => setChangePasswordModal(false)} 
                style={styles.modalCloseBtn}
                disabled={changingPassword}
              >
                <MaterialIcons name="close" size={22} color="#2D5783" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalInner}>
              <Text style={styles.modalSubtitle}>
                Enter your current password and set a new password for your account.
              </Text>

              <View style={styles.fieldRow}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!changingPassword}
                />
                <Text style={styles.passwordHint}>
                  Must be at least 8 characters long
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  onPress={() => setChangePasswordModal(false)} 
                  style={[styles.modalActionButton, styles.cancelButton]}
                  disabled={changingPassword}
                >
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handlePasswordSubmit} 
                  style={[styles.modalActionButton, styles.saveButton]}
                  disabled={changingPassword}
                >
                  <Text style={styles.modalActionText}>
                    Change Password
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 👇 LOADING OVERLAY - NOW AT ROOT LEVEL WITH HIGHEST Z-INDEX 👇 */}
      {changingPassword && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Changing Password...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  // Header styles for centered title with left back button
  headerRow: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D5783',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  settingSubtext: {
    marginLeft: 10,
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  aboutInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2D5783',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FBFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  modalTitleLarge: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5783',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
  },
  modalInner: {
    padding: 16,
    paddingBottom: 28,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E6EEF6',
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButton: {
    backgroundColor: '#2D5783',
  },
  // Loading Overlay - FIXED: Now at root level with highest z-index
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Highest possible z-index
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#2C5282',
  },
});

export default Settings;
