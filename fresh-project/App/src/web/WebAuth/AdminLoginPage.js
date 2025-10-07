import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, database } from '../../firebaseConfig'; 
import Icon from 'react-native-vector-icons/FontAwesome'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const adminRef = database.ref('Users/Admin');
      const snapshot = await adminRef.once('value');
      const admins = snapshot.val();

      let matchedAdmin = null;
      for (const key in admins) {
        if (admins[key].uid === user.uid) {
          matchedAdmin = admins[key];
          break;
        }
      }

      if (matchedAdmin && matchedAdmin.role === 'admin') {
        setLoading(false);
        await AsyncStorage.setItem('adminId', matchedAdmin.id);
        navigate('/adminhome');
      } else {
        setLoading(false);
        setError('Access denied. You are not an Admin.');
      }

    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/user-not-found') {
        setError('Credentials not found.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Password does not match.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email.');
      } else {
        setError('Invalid Credentials. Please try again.');
      }
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>Sign in Account</Text>
        <Text style={styles.subtitle}>Input your credentials</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

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

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#001F3F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="#001F3F" />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Button */}
        <TouchableOpacity 
          style={styles.forgotPasswordButton} 
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.loginButton]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.welcomeTitle}>Hello, Admin!</Text>
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
    height: '100%',
  },
  rightSection: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001F3F',
    padding: 20,
    height: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
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
    flex: 1,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
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
    maxWidth: 220,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#001F3F',
    borderRadius: 15,
    padding: 16,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4FE7AF',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end', // Aligns to the right
    marginBottom: 20, // Space between the password input and login button
    marginEnd: 210,
  },
  forgotPasswordText: {
    color: '#001F3F',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default AdminLoginPage;
