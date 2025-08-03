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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

export default function AppLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit Application?', 'Are you sure you want to exit?', [
        { text: 'Cancel', onPress: () => null, style: 'cancel' },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Missing Information', 'Please enter both your email and password to continue');
    return;
  }

  // Friendly email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Alert.alert(
      'Check Your Email',
      'This doesn\'t look like a valid email address. Please check for typos (e.g., yourname@example.com)'
    );
    return;
  }

  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    navigation.navigate('TwoFactorEmail', { email });
  } catch (error) {
    let title = '';
    let message = '';
    let buttons = [{ text: 'OK' }];

    switch (error.code) {
      case 'auth/wrong-password':
        title = 'Incorrect Password';
        message = 'The password you entered is incorrect. Please try again.';
        buttons = [
          { text: 'Try Again' },
          { 
            text: 'Reset Password', 
            onPress: () => navigation.navigate('ForgotPassword', { email }) 
          }
        ];
        break;

      case 'auth/user-not-found':
        title = 'Account Not Found';
        message = `No account found with ${email}. Would you like to sign up instead?`;
        buttons = [
          { text: 'Try Different Email' },
          { 
            text: 'Sign Up', 
            onPress: () => navigation.navigate('Register', { prefillEmail: email }) 
          }
        ];
        break;

      case 'auth/invalid-email':
        title = 'Invalid Email';
        message = 'Please enter a complete email address (e.g., yourname@example.com)';
        break;

      case 'auth/too-many-requests':
        title = 'Too Many Attempts';
        message = 'For your security, login is temporarily blocked. Please try again later or reset your password.';
        buttons = [
          { text: 'OK' },
          { 
            text: 'Reset Password', 
            onPress: () => navigation.navigate('ForgotPassword', { email }) 
          }
        ];
        break;

      case 'auth/user-disabled':
        title = 'Account Disabled';
        message = 'This account has been deactivated. Please contact support for assistance.';
        break;

      case 'auth/network-request-failed':
        title = 'Connection Error';
        message = 'Unable to connect to our servers. Please check your internet connection and try again.';
        break;

      default:
        title = 'Login Error';
        message = 'We encountered an unexpected error. Please try again.';
    }

    Alert.alert(title, message, buttons);
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

            <View style={styles.registerRow}>
              <Text style={styles.promptText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleRegister} disabled={loading}>
                <Text style={styles.inlineRegisterText}> Sign Up</Text>
              </TouchableOpacity>
            </View>


            {/* Overlay to disable interaction while loading */}
            {loading && (
              <TouchableWithoutFeedback>
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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