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
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

     
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.desc}>
      Enter your email and check for a reset link to get back in.
        </Text>

      {/* Email Label and Input */}
      <Text style={styles.label}>Email</Text>
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

      {/* Reset Password Button */}
      <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
        <Text style={styles.resetButtonText}>Send Link</Text>
      </TouchableOpacity>

      {/* Additional spacing to push the button up */}
      <View style={{ flex: 1 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C5282',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },

  title: {
    fontSize: 43,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 50, 
    marginTop: 150,
  },
  desc: {
    display: 'none', 
  },
  label: {
    display: 'none', 
  },
  inputContainer: {
    backgroundColor: '#E2E8F0', 
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginRight: 10,
  },
  resetButton: {
    backgroundColor: '#A7F3D0', 
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '60%',
    elevation: 2,
  },
  resetButtonText: {
    color: '#2F855A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default ForgotPassword;