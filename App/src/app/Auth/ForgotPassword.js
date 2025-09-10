import React, { useState, useEffect } from 'react';
import { Text, TextInput, View, TouchableOpacity, StyleSheet, Dimensions, Alert, Image, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sendPasswordResetEmail } from 'firebase/auth'; // Import the Firebase function
import { auth } from '../../firebaseConfig'; // Import Firebase configuration
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');

  // Handle the Android back button press
  useEffect(() => {
    const backAction = () => {
      navigation.goBack(); // Navigate back to the login page when the back button is pressed
      return true; // Returning true prevents the default behavior (exiting the app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); // Clean up the event listener
  }, [navigation]);

  const handleResetPassword = async () => {
  if (!email) {
    Alert.alert('Missing Email', 'Please enter your email address to reset your password.');
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address in the format email@domain.com.');
    return;
  }

    try {
      await sendPasswordResetEmail(auth, email); // Send reset password email using Firebase
      Alert.alert('Success', 'Password reset instructions have been sent to your email.');
      navigation.navigate('Login'); // Navigate back to the login page after successful reset
    } catch (error) {
      Alert.alert('Error', error.message);
    }
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
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
            <Text style={styles.primaryButtonText}>Send Link</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
});


export default ForgotPassword;