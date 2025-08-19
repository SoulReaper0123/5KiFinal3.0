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
import * as Keychain from 'react-native-keychain';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function VerifyCode({ route, navigation }) {
  const { email, password, verificationCode, fromBiometric } = route.params;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const nav = useNavigation();

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
    inputRefs.current[0]?.focus();
  }, []);

  // We don't need this function anymore since we're handling biometric setup in AppHome
  const promptBiometricSetup = () => {
    // Navigate to DrawerNav with parameters for biometric setup
    nav.reset({
      index: 0,
      routes: [{ 
        name: 'DrawerNav', 
        params: { 
          email, 
          password, 
          shouldPromptBiometric: true 
        } 
      }],
    });
  };

  const handleChange = (text, index) => {
    if (!/^\d?$/.test(text)) return;

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && text) {
      handleVerify();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
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
      if (fromBiometric) {
        // When using biometric login, ensure we pass the email to DrawerNav
        // We need to pass the same parameters as the regular login to ensure data is loaded
        console.log('Navigating to DrawerNav from biometric login with email:', email);
        nav.reset({
          index: 0,
          routes: [{ 
            name: 'DrawerNav', 
            params: { 
              email,
              // Don't pass shouldPromptBiometric since user already has biometrics set up
            } 
          }],
        });
      } else {
        // Navigate to DrawerNav with parameters for biometric setup
        // Make sure we're passing the shouldPromptBiometric flag
        console.log('Navigating to DrawerNav with shouldPromptBiometric=true');
        nav.reset({
          index: 0,
          routes: [{ 
            name: 'DrawerNav', 
            params: { 
              email, 
              password, 
              shouldPromptBiometric: true 
            } 
          }],
        });
      }
    } else {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
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
});