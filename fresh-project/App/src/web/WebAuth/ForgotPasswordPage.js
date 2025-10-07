import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom'; // Ensure you're using React Router for web navigation
import { auth } from '../../firebaseConfig'; // Ensure these imports are correct
import { Ionicons } from '@expo/vector-icons'; // Importing the Ionicons icon set

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setError('Error: Could not send password reset email');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button with Arrow Icon */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigate('/adminlogin')}
      >
        <Ionicons name="arrow-back" size={24} color="#4FE7AF" />
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {message && <Text style={styles.successText}>{message}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '80%',
    padding: 12,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 25,
    backgroundColor: '#fff',
    elevation: 3,
  },
  button: {
    backgroundColor: '#001F3F',
    padding: 16,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 3,
  },
});

export default ForgotPasswordPage;
