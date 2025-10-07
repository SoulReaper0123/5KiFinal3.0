import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, database } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome for icons

const SuperAdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    setLoading(true); // Start loading
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const snapshot = await database.ref(`SuperAdmin/${user.uid}`).once('value');
      const userData = snapshot.val();

      if (userData && userData.role === 'superadmin') {
        setLoading(false); // Stop loading before navigating
        navigate('/superadminhome');
      } else {
        setLoading(false); // Stop loading on access denied
        setError('Access denied. You are not a Super Admin.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false); // Stop loading on error
      if (error.code === 'auth/user-not-found') {
        setError('Credentials not found.'); // Updated message
      } else if (error.code === 'auth/wrong-password') {
        setError('Password does not match.'); // Updated message
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email.'); // New error for invalid email format
      } else {
        setError('Invalid Credentials. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Left section for login form */}
      <View style={styles.leftSection}>
        <Text style={styles.title}>Sign in Account</Text>
        <Text style={styles.subtitle}>Input your credentials</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Email Input with Icon */}
        <View style={styles.inputContainer}>
          <Icon name="envelope" size={20} color="#001F3F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>

        {/* Password Input with Icon */}
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#001F3F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword} // Toggle password visibility
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.loginButton]} 
          onPress={handleLogin}
          disabled={loading} // Disable button while loading
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>

      {/* Right section for welcome message */}
      <View style={styles.rightSection}>
        <Text style={styles.welcomeTitle}>Hello,</Text>
        <Text style={styles.welcomeTitle}>Super Admin!</Text>
        <Text style={styles.welcomeSubtitle}>
          To keep connected, please log in with your personal info.
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => navigate('/')}
        >
          <Text style={styles.buttonText}>Go back to home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    height: '100%', // Ensure full height
  },
  rightSection: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001F3F', // Background color for the right section
    padding: 20,
    height: '100%', // Ensure full height
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#001F3F',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row', // For icon and input alignment
    alignItems: 'center', // Center the items vertically
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    maxWidth: 400,
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1, // Allow input to take remaining space
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    maxWidth: 220, // Button width limit
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#001F3F', // Set same color as the right section
    borderRadius: 15,
    marginTop: 20,
    padding: 16,
  },
  backButton: {
    backgroundColor: 'transparent', // Make the button transparent
    borderWidth: 1, // Optional: Add a border if you want
    borderColor: '#4FE7AF', // Optional: Color of the border
    marginTop: 50,
    borderRadius: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  welcomeTitle: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 25,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default SuperAdminLoginPage;