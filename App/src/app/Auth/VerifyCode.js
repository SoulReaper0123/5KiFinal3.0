import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function TwoFactorEmail({ navigation }) {
  const [email, setEmail] = useState('');

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

export default function VerifyCode({ route, navigation }) {
  const { email, verificationCode } = route.params;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, 6);
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (text, index) => {
    // Only allow single digit input
    if (!/^\d?$/.test(text)) return;

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    // Auto-focus next input if digit was entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if last digit was entered
    if (index === 5 && text) {
      handleVerify();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
    // Handle backspace to move to previous input
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length < 6) return;

    if (code === verificationCode) {
      Alert.alert('Success', 'Verification successful!');
      navigation.navigate('DrawerNav', { email });
    } else {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      // Reset all inputs and focus first one
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      <Text style={styles.infoText}>
        A 6-digit verification code has been sent to your email. Please enter the code to continue.
      </Text>
      
      <View style={styles.codeInputContainer}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={el => inputRefs.current[index] = el}
            style={styles.codeInput}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, digits.join('').length < 6 && styles.disabledButton]}
        onPress={handleVerify}
        disabled={digits.join('').length < 6}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
  infoText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '80%',
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 65,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '50%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
});