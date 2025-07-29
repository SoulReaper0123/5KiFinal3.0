import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TwoFactorEmail({ route, navigation }) {
  // Email comes from previous screen and CANNOT be edited
  const email = route.params?.email || '';

  const handleSendCode = () => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production: Actually send this code via your email service
    console.log(`Verification code sent to ${email}: ${verificationCode}`);
    
    navigation.navigate('VerifyCode', { 
      email,
      verificationCode,
      // Lock these values so they can't be modified
      lockedEmail: email,
      lockedCode: verificationCode 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Required</Text>
      
      <View style={styles.emailDisplay}>
        <Text style={styles.emailText}>{email}</Text>
        <MaterialIcons name="lock" size={20} color="gray" />
      </View>

      <Text style={styles.instructions}>
        We'll send a 6-digit code to this email address.
      </Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSendCode}
      >
        <Text style={styles.buttonText}>Send Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Two-Factor Authentication</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSendCode}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// Keep your existing styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D5783',
    padding: 20,
  },
 backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginTop: -100,
    marginBottom: 80,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
  },
});