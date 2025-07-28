import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendVerificationCode } from '../../api';

export default function TwoFactorEmail({ navigation }) {
  const [email, setEmail] = useState('');
/*
 const handleSendCode = async () => {
  if (!email) {
    Alert.alert('Error', 'Please enter your email');
    return;
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendVerificationCode(email, verificationCode);

    Alert.alert('Code Sent', 'A 6-digit verification code has been sent to your email.');

    navigation.navigate('VerifyCode', { email, verificationCode });
  } catch (error) {
    Alert.alert('Error', 'Failed to send verification code. Please try again.');
  }
};
*/
const handleSendCode = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Verification code sent to ${email}: ${verificationCode}`);

    Alert.alert('Code Sent', `A 6-digit verification code has been sent to your email.`);

    navigation.navigate('VerifyCode', { email, verificationCode });
  };


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
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={handleSendCode}>
        <Text style={styles.buttonText}>Send Code</Text>
      </TouchableOpacity>
    </View>
  );
}

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
