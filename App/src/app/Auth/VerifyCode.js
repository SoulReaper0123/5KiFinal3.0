import React, { useState, useRef } from 'react';
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

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Simulate sending the code via email
    console.log(`Verification code sent to ${email}: ${verificationCode}`);

    // Show an alert to the user
    Alert.alert('Code Sent', `A 6-digit verification code has been sent to your email.`);

    // Navigate to the VerifyCode screen and pass the code as a parameter
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
  const [inputCode, setInputCode] = useState('');
  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return; // Only allow digits

    let newCode = inputCode.split('');
    newCode[index] = text[text.length - 1] || '';
    newCode = newCode.join('').slice(0, 6);

    setInputCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1].current.focus();
    }
    if (!text && index > 0) {
      inputRefs.current[index - 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !inputCode[index] && index > 0) {
      inputRefs.current[index - 1].current.focus();
    }
  };

  const handleVerifyCode = () => {
    if (inputCode === verificationCode) {
      Alert.alert('Success', 'Verification successful!');
      navigation.navigate('DrawerNav', { email }); // Navigate to the main app screen
    } else {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
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
        {Array(6)
          .fill()
          .map((_, index) => (
            <TextInput
              key={index}
              ref={inputRefs.current[index]}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="numeric"
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              value={inputCode[index] || ''}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          ))}
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          inputCode.length < 6 && { opacity: 0.5 },
        ]}
        onPress={handleVerifyCode}
        disabled={inputCode.length < 6}
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