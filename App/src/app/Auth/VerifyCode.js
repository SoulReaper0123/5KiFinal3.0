import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.contentWrapper}>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subLabel}>We sent a 6-digit code to your email</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.codeInputContainer}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={el => (inputRefs.current[index] = el)}
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
              style={[styles.primaryButton, digits.join('').length < 6 && styles.disabledButton]}
              onPress={handleVerify}
              disabled={digits.join('').length < 6}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
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
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  codeInput: {
    flex: 1, // allow boxes to shrink to fit small screens
    minWidth: 40,
    maxWidth: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 18,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});