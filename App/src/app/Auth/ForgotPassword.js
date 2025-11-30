import React, { useState, useEffect } from 'react';
import { Text, TextInput, View, TouchableOpacity, StyleSheet, Dimensions, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import CustomModal from '../../components/CustomModal';

const { width } = Dimensions.get('window');

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
        <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.contentWrapper}>
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subLabel}>Enter your email to receive a reset link</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { marginBottom: 6 }]}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="envelope" size={20} color="#666" style={styles.icon} />
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
            <MaterialIcons name="lock-clock" size={40} color="#1E3A5F" />
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
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
  },
  subLabel: {
    fontSize: 13,
    marginTop: 2,
    color: '#475569',
  },
  label: {
    fontSize: 15,
    color: '#0F172A',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#0F172A',
  },
  icon: {
    marginRight: 10,
  },
  primaryButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
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
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 20,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E3A5F',
    textAlign: 'center',
  },
});

export default ForgotPassword;
