import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { auth, database } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { 
  checkBiometricSupport, 
  Storage, 
  authenticateBiometric,
  isMobileBrowser 
} from './utils/platformUtils';

const { width, height } = Dimensions.get('window');

export default function AppLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [storedBiometricEmail, setStoredBiometricEmail] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalButtonText, setModalButtonText] = useState('OK');
  const [modalAction, setModalAction] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Invalid password confirm modal
  const [invalidPwdVisible, setInvalidPwdVisible] = useState(false);
  const [invalidPwdMessage, setInvalidPwdMessage] = useState('');
  
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const passwordInputRef = useRef(null);

  // Helper function to show modal
  const showModal = (title, message, type = 'info', buttonText = 'OK', action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalButtonText(buttonText);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalAction(null);
  };

  const handleModalButtonPress = () => {
    if (modalAction) {
      modalAction();
    }
    closeModal();
  };

  useEffect(() => {
    const backAction = () => {
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (isFocused) {
      checkForBiometricCredentials();
    }
  }, [isFocused]);

  const checkForBiometricCredentials = async () => {
    // Don't run biometric on web or mobile browsers
    if (Platform.OS === 'web' || isMobileBrowser()) {
      setShowBiometricOption(false);
      return;
    }

    try {
      const biometricSupport = await checkBiometricSupport();
      
      if (!biometricSupport.isSupported) {
        setShowBiometricOption(false);
        return;
      }

      const credentials = await Storage.getItem('biometricCredentials');
      
      if (credentials) {
        const { email: storedEmail } = JSON.parse(credentials);
        
        // Check if the user is still active before showing biometric option
        const userStatusInfo = await checkUserStatus(storedEmail);
        
        if (userStatusInfo.found && userStatusInfo.status === 'inactive') {
          // User is inactive, don't show biometric option and clear stored credentials
          await Storage.deleteItem('biometricCredentials');
          setShowBiometricOption(false);
          setStoredBiometricEmail('');
        } else {
          setShowBiometricOption(true);
          setStoredBiometricEmail(storedEmail);
          
          // Only pre-fill email if no email is currently entered
          if (!email) {
            setEmail(storedEmail);
          }
        }
      } else {
        setShowBiometricOption(false);
        setStoredBiometricEmail('');
      }
    } catch (error) {
      console.log('Biometric credentials check error:', error);
      setShowBiometricOption(false);
      setStoredBiometricEmail('');
    }
  };

  const handleBiometricLogin = async () => {
    // Don't run on web or mobile browsers
    if (Platform.OS === 'web' || isMobileBrowser()) {
      showModal(
        'Not Available',
        'Biometric login is only available in the mobile app. Please download our app from the app store.',
        'error',
        'OK'
      );
      return;
    }

    try {
      setLoading(true);
      
      const result = await authenticateBiometric({
        promptMessage: 'Authenticate with biometrics to login',
        disableDeviceFallback: false
      });

      if (result.success) {
        const credentials = await Storage.getItem('biometricCredentials');
        
        if (credentials) {
          const { email: biometricEmail, password: biometricPassword } = JSON.parse(credentials);
          
          // Check user status before proceeding
          const userStatusInfo = await checkUserStatus(biometricEmail);
          
          if (userStatusInfo.found && userStatusInfo.status === 'inactive') {
            showModal(
              'Account Inactive',
              'Your account has been deactivated. Please contact the administrator for assistance.',
              'error',
              'OK'
            );
            setLoading(false);
            return;
          }
          
          // Store current user email for session management
          await Storage.setItem('currentUserEmail', biometricEmail);
          console.log('Stored current user email for biometric login:', biometricEmail);
          
          // Navigate directly to TwoFactorEmail with proper parameters
          navigation.navigate('TwoFactorEmail', { 
            email: biometricEmail,
            password: biometricPassword,
            fromBiometric: true 
          });
        }
      } else {
        showModal(
          'Authentication Failed',
          result.message || 'Biometric authentication was cancelled or failed.',
          'error',
          'OK'
        );
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      showModal(
        'Authentication Failed',
        'Biometric authentication failed. Please try again or use email/password.',
        'error',
        'OK'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async (email) => {
    try {
      // Check in Members collection first
      const membersSnapshot = await database.ref('Members').once('value');
      const membersData = membersSnapshot.val() || {};
      
      // Find user by email in Members collection
      const memberEntry = Object.entries(membersData).find(([id, member]) => 
        member.email && member.email.toLowerCase() === email.toLowerCase()
      );
      
      if (memberEntry) {
        const [memberId, memberData] = memberEntry;
        return {
          found: true,
          status: memberData.status || 'active',
          role: memberData.role || 'member',
          id: memberId
        };
      }
      
      // If not found in Members, check in Users collections
      const usersSnapshot = await database.ref('Users').once('value');
      const usersData = usersSnapshot.val() || {};
      
      // Check in Admin collection
      if (usersData.Admin) {
        const adminEntry = Object.entries(usersData.Admin).find(([id, admin]) => 
          admin.email && admin.email.toLowerCase() === email.toLowerCase()
        );
        if (adminEntry) {
          const [adminId, adminData] = adminEntry;
          return {
            found: true,
            status: adminData.status || 'active',
            role: 'admin',
            id: adminId
          };
        }
      }
      
      // Check in CoAdmin collection
      if (usersData.CoAdmin) {
        const coAdminEntry = Object.entries(usersData.CoAdmin).find(([id, coAdmin]) => 
          coAdmin.email && coAdmin.email.toLowerCase() === email.toLowerCase()
        );
        if (coAdminEntry) {
          const [coAdminId, coAdminData] = coAdminEntry;
          return {
            found: true,
            status: coAdminData.status || 'active',
            role: 'coadmin',
            id: coAdminId
          };
        }
      }
      
      return {
        found: false,
        status: null,
        role: null,
        id: null
      };
    } catch (error) {
      console.error('Error checking user status:', error);
      return {
        found: false,
        status: null,
        role: null,
        id: null
      };
    }
  };

  const handleLogin = async () => {
    const currentEmail = email;
    
    if (!currentEmail || !password) {
      showModal(
        'Missing Information',
        'Please enter both your email and password to continue',
        'warning',
        'OK'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      showModal(
        'Check Your Email',
        'This doesn\'t look like a valid email address. Please check for typos (e.g., yourname@example.com)',
        'error',
        'OK'
      );
      return;
    }

    setLoading(true);

    try {
      // First check user status before attempting Firebase authentication
      const userStatusInfo = await checkUserStatus(currentEmail);
      
      if (userStatusInfo.found && userStatusInfo.status === 'inactive') {
        showModal(
          'Account Inactive',
          'Your account has been deactivated. Please contact the administrator for assistance.',
          'error',
          'OK'
        );
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, currentEmail, password);
      
      // Double-check status after successful authentication (in case it changed)
      const finalStatusCheck = await checkUserStatus(currentEmail);
      if (finalStatusCheck.found && finalStatusCheck.status === 'inactive') {
        // Sign out the user immediately if they're inactive
        await auth.signOut();
        showModal(
          'Account Inactive',
          'Your account has been deactivated. Please contact the administrator for assistance.',
          'error',
          'OK'
        );
        setLoading(false);
        return;
      }
      
      // Store current user email for session
      if (Platform.OS !== 'web') {
        await Storage.setItem('currentUserEmail', currentEmail);
      }
      
      navigation.navigate('TwoFactorEmail', { 
        email: currentEmail,
        password,
        fromBiometric: false 
      });
      
    } catch (error) {
      console.log('=== FIREBASE LOGIN ERROR DEBUG ===');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      let title = '';
      let message = '';
      let buttonText = 'OK';
      let action = null;

      const errorMessage = error.message?.toLowerCase() || '';
      const isCredentialError = errorMessage.includes('credential') || 
                               errorMessage.includes('password') || 
                               errorMessage.includes('invalid') ||
                               errorMessage.includes('wrong');

      if (error.code === 'auth/network-request-failed') {
        if (currentEmail && password) {
          title = 'Invalid Email or Password';
          message = 'Please check your email and password and try again.';
        } else {
          title = 'Network Error';
          message = 'Please check your internet connection and try again.';
        }
      } else {
        switch (error.code) {
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-login-credentials':
            title = 'Invalid Password';
            message = 'The password you entered is incorrect. Please try again.';
            setInvalidPwdMessage('The password you entered is incorrect. Please try again.');
            setInvalidPwdVisible(true);
            buttonText = null;
            action = null;
            break;

          case 'auth/user-not-found':
            title = 'Invalid Email';
            message = 'No account found with this email address. Please check your email or sign up.';
            buttonText = 'Sign Up';
            action = () => navigation.navigate('Register', { prefillEmail: currentEmail });
            break;

          case 'auth/invalid-email':
            title = 'Invalid Email';
            message = 'Please enter a valid email address (e.g., yourname@example.com)';
            break;

          case 'auth/too-many-requests':
            title = 'Too Many Attempts';
            message = 'For your security, login is temporarily blocked. Please try again later or reset your password.';
            buttonText = 'Reset Password';
            action = () => navigation.navigate('ForgotPassword', { email: currentEmail });
            break;

          case 'auth/user-disabled':
            title = 'Account Disabled';
            message = 'This account has been deactivated. Please contact support for assistance.';
            break;

          default:
            if (isCredentialError || (error.code && error.code.startsWith('auth/'))) {
              title = 'Invalid Email or Password';
              message = 'Please check your email and password and try again.';
            } else {
              title = 'Login Error';
              message = 'Something went wrong. Please try again.';
            }
        }
      }

      if (buttonText) {
        showModal(title, message, 'error', buttonText, action);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleEmailSubmit = () => {
    passwordInputRef.current && passwordInputRef.current.focus();
  };

  const handlePasswordSubmit = () => {
    if (email && password) {
      handleLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#2D5783' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />

            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.desc}>
              To keep connected with us, please log in with your personal info.
            </Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer} pointerEvents={loading ? 'none' : 'auto'}>
              <Icon name="envelope" size={20} color="#888" style={styles.envelopeIcon} />
              <TextInput
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={handleEmailSubmit}
                blurOnSubmit={false}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer} pointerEvents={loading ? 'none' : 'auto'}>
              <Icon name="lock" size={24} color="#888" style={styles.lockIcon} />
              <TextInput
                ref={passwordInputRef}
                placeholder="Enter password"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                style={styles.passwordInput}
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handlePasswordSubmit}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Icon name={isPasswordVisible ? 'eye' : 'eye-slash'} size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            {showBiometricOption && (
              <TouchableOpacity 
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <MaterialIcons name="fingerprint" size={24} color="white" />
                <Text style={styles.biometricButtonText}>
                  Use Fingerprint
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.registerRow}>
              <Text style={styles.promptText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleRegister} disabled={loading}>
                <Text style={styles.inlineRegisterText}> Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {loading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#4FE7AF" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        buttonText={modalButtonText || 'OK'}
        onButtonPress={handleModalButtonPress}
      />

      {/* Invalid Password Confirm Modal */}
      <CustomConfirmModal
        visible={invalidPwdVisible}
        onClose={() => setInvalidPwdVisible(false)}
        title="Invalid Password"
        message={invalidPwdMessage}
        type="error"
        cancelText="Close"
        confirmText="Reset Password"
        onCancel={() => setInvalidPwdVisible(false)}
        onConfirm={() => { 
          setInvalidPwdVisible(false); 
          navigation.navigate('ForgotPassword', { email }); 
        }}
      />

      {/* Exit Confirmation Modal */}
      <CustomConfirmModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Application?"
        message="Are you sure you want to exit?"
        type="warning"
        cancelText="No"
        confirmText="Yes"
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => BackHandler.exitApp()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1E3A5F',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    borderRadius: 100, 
    overflow: 'hidden',
    marginBottom: 40, 
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4FE7AF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    width: '60%',
  },
  biometricButtonText: {
    color: '#0C2C4A',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  desc: {
    fontSize: 13,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6F3',
    borderRadius: 12,
    backgroundColor: '#F7FAFF',
    marginBottom: 12,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.06)',
        borderStyle: 'solid',
      },
    }),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6F3',
    borderRadius: 12,
    backgroundColor: '#F7FAFF',
    marginBottom: 12,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.06)',
        borderStyle: 'solid',
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      },
    }),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      },
    }),
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  envelopeIcon: {
    paddingHorizontal: 7,
  },
  lockIcon: {
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: '#4FE7AF',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    width: '60%',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#0C2C4A',
    fontSize: 18,
    fontWeight: '700',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginEnd: 20,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 10,
  },
  promptText: {
    marginVertical: 10,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#2D5783',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  inlineRegisterText: {
    color: '#4FE7AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
