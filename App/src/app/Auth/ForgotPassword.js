import React, { useState, useEffect } from 'react';
import { 
  Text, 
  TextInput, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  BackHandler, 
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import CustomModal from '../../components/CustomModal';

const { width, height } = Dimensions.get('window');

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle the Android back button press
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address to reset your password.');
      setErrorModalVisible(true);
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address in the format email@domain.com.');
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase auth errors
      let errorMsg = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'The email address is not valid.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many attempts. Please try again later.';
      }
      
      setErrorMessage(errorMsg);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    navigation.navigate('Login');
  };

  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={width * 0.075} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.contentWrapper}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subLabel}>Enter your email to receive a reset link</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="envelope" size={width * 0.05} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending...' : 'Send Link'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Modal */}
      <CustomModal
        visible={successModalVisible}
        onClose={handleSuccessOk}
        message="Password reset instructions have been sent to your email. Please check your inbox and follow the link to reset your password."
        type="success"
      />

      {/* Error Modal */}
      <CustomModal
        visible={errorModalVisible}
        onClose={handleErrorOk}
        message={errorMessage}
        type="error"
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <MaterialIcons name="lock-clock" size={width * 0.1} color="#1E3A5F" />
            <Text style={styles.loadingText}>Sending reset link...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    paddingBottom: height * 0.04,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
    left: width * 0.04,
    zIndex: 10,
    padding: width * 0.02,
  },
  titleContainer: {
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
  },
  subLabel: {
    fontSize: width * 0.035,
    marginTop: height * 0.005,
    color: '#475569',
    lineHeight: width * 0.045,
  },
  label: {
    fontSize: width * 0.04,
    color: '#0F172A',
    marginBottom: height * 0.01,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: height * 0.065,
  },
  input: {
    flex: 1,
    fontSize: width * 0.045,
    color: '#0F172A',
    paddingVertical: height * 0.015,
  },
  icon: {
    marginRight: width * 0.03,
  },
  primaryButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    width: '100%',
    minHeight: height * 0.065,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: height * 0.08,
  },
  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: width * 0.08,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 20,
    minWidth: width * 0.5,
    maxWidth: width * 0.8,
  },
  loadingText: {
    marginTop: height * 0.02,
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#1E3A5F',
    textAlign: 'center',
  },
});

export default ForgotPassword;
