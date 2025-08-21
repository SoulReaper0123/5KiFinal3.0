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
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import CustomModal from '../../components/CustomModal';

const { width, height } = Dimensions.get('window');

export default function AppLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalButtonText, setModalButtonText] = useState('OK');
  const [modalAction, setModalAction] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  
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
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        setShowBiometricOption(false);
        return;
      }

      const credentials = await SecureStore.getItemAsync('biometricCredentials');
      
      if (credentials) {
        const { email } = JSON.parse(credentials);
        
        // Check if the user is still active before showing biometric option
        const userStatusInfo = await checkUserStatus(email);
        
        if (userStatusInfo.found && userStatusInfo.status === 'inactive') {
          // User is inactive, don't show biometric option and clear stored credentials
          await SecureStore.deleteItemAsync('biometricCredentials');
          setShowBiometricOption(false);
          setEmail('');
        } else {
          setShowBiometricOption(true);
          setEmail(email);
        }
      } else {
        setShowBiometricOption(false);
      }
    } catch (error) {
      console.log('SecureStore error:', error);
      setShowBiometricOption(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics to login',
        disableDeviceFallback: true,
        fallbackLabel: '',
      });

      if (result.success) {
        const credentials = await SecureStore.getItemAsync('biometricCredentials');
        
        if (credentials) {
          const { email, password } = JSON.parse(credentials);
          
          // Check user status before proceeding
          const userStatusInfo = await checkUserStatus(email);
          
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
          
          // We can't modify auth.currentUser directly, so we'll use SecureStore
          // to store the current user email for the session
          try {
            // Store the current user email in SecureStore for the session
            await SecureStore.setItemAsync('currentUserEmail', email);
            console.log('Stored current user email in SecureStore:', email);
          } catch (error) {
            console.error('Error storing current user email:', error);
          }
          
          navigation.navigate('TwoFactorEmail', { 
            email,
            password,
            fromBiometric: true 
          });
          setEmail('');
          setPassword('');
        }
      }
    } catch (error) {
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
          status: memberData.status || 'active', // Default to active if status not set
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
    if (!email || !password) {
      showModal(
        'Missing Information',
        'Please enter both your email and password to continue',
        'warning',
        'OK'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      const userStatusInfo = await checkUserStatus(email);
      
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

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Double-check status after successful authentication (in case it changed)
      const finalStatusCheck = await checkUserStatus(email);
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
      
      navigation.navigate('TwoFactorEmail', { 
        email,
        password,
        fromBiometric: false 
      });
      setEmail('');
      setPassword('');
    } catch (error) {
      console.log('=== FIREBASE LOGIN ERROR DEBUG ===');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error name:', error.name);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      console.log('Error keys:', Object.keys(error));
      console.log('=====================================');
      
      let title = '';
      let message = '';
      let buttonText = 'OK';
      let action = null;

      // Check if error message contains credential-related keywords
      const errorMessage = error.message?.toLowerCase() || '';
      const isCredentialError = errorMessage.includes('credential') || 
                               errorMessage.includes('password') || 
                               errorMessage.includes('invalid') ||
                               errorMessage.includes('wrong');

      // Special handling for network errors that might actually be auth errors
      if (error.code === 'auth/network-request-failed') {
        // If user entered credentials, it's likely an auth issue disguised as network issue
        if (email && password) {
          console.log('Network error with credentials - treating as auth error');
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
          case 'auth/invalid-user-token':
          case 'auth/user-token-expired':
            title = 'Invalid Password';
            message = 'The password you entered is incorrect. Please try again.';
            buttonText = 'Reset Password';
            action = () => navigation.navigate('ForgotPassword', { email });
            break;

          case 'auth/user-not-found':
            title = 'Invalid Email';
            message = 'No account found with this email address. Please check your email or sign up.';
            buttonText = 'Sign Up';
            action = () => navigation.navigate('Register', { prefillEmail: email });
            break;

          case 'auth/invalid-email':
            title = 'Invalid Email';
            message = 'Please enter a valid email address (e.g., yourname@example.com)';
            break;

          case 'auth/too-many-requests':
            title = 'Too Many Attempts';
            message = 'For your security, login is temporarily blocked. Please try again later or reset your password.';
            buttonText = 'Reset Password';
            action = () => navigation.navigate('ForgotPassword', { email });
            break;

          case 'auth/user-disabled':
            title = 'Account Disabled';
            message = 'This account has been deactivated. Please contact support for assistance.';
            break;

          case 'auth/weak-password':
            title = 'Invalid Password';
            message = 'The password you entered is incorrect. Please try again.';
            break;

          default:
            // Check if it's a credential-related error based on message content
            if (isCredentialError || (error.code && error.code.startsWith('auth/'))) {
              title = 'Invalid Email or Password';
              message = 'Please check your email and password and try again.';
            } else {
              title = 'Login Error';
              message = 'Something went wrong. Please try again.';
            }
        }
      }

      showModal(title, message, 'error', buttonText, action);
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
        buttonText={modalButtonText}
        onButtonPress={handleModalButtonPress}
      />

      {/* Exit Confirmation Modal */}
      <CustomModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Application?"
        message="Are you sure you want to exit?"
        type="warning"
        buttonText="Exit"
        onButtonPress={() => BackHandler.exitApp()}
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
    backgroundColor: '#2D5783',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4FE7AF',
    width: 50,
    height: 50,
    borderRadius: 25,
    marginVertical: 10,
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
    borderColor: 'black',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#001F3F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '50%',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
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