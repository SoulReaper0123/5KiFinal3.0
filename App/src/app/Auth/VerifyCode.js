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
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { sendVerificationCode } from '../../api';

const { width, height } = Dimensions.get('window');

export default function VerifyCode({ route, navigation }) {
  const { email, password, verificationCode, fromBiometric } = route.params;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [expectedCode, setExpectedCode] = useState(verificationCode);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputRefs = useRef([]);
  const nav = useNavigation();

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
    inputRefs.current[0]?.focus();
  }, []);

  // countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

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

    if (code === expectedCode) {
      // Prefer DrawerNav; if it fails, fallback to AppHomeStandalone
      try {
        navigation.reset({
          index: 0,
          routes: [{
            name: 'DrawerNav',
            params: fromBiometric
              ? { email }
              : { email, password, shouldPromptBiometric: true },
          }],
        });
      } catch (e) {
        console.warn('DrawerNav navigation failed, falling back to AppHomeStandalone:', e);
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppHomeStandalone', params: { email, password, shouldPromptBiometric: !fromBiometric } }],
        });
      }
    } else {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(newCode);
      setSecondsLeft(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      await sendVerificationCode({ email, verificationCode: newCode });
      Alert.alert('Code sent', 'A new verification code has been emailed to you.');
    } catch (e) {
      console.error('Resend code error:', e);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? height * 0.08 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialIcons name="arrow-back" size={width * 0.065} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          <View style={styles.logoWrapper}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />
          </View>

          <View style={{ marginBottom: height * 0.02 }}>
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

            {/* Countdown */}
            <Text style={styles.countdownText}>
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'You can resend a new code now.'}
            </Text>

            {/* Continue */}
            <TouchableOpacity
              style={[styles.primaryButton, digits.join('').length < 6 && styles.disabledButton]}
              onPress={handleVerify}
              disabled={digits.join('').length < 6}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            {/* Resend */}
            <TouchableOpacity
              style={[styles.resendButton, secondsLeft > 0 && styles.disabledButton]}
              onPress={handleResend}
              disabled={secondsLeft > 0}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
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
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.06,
    paddingBottom: height * 0.06,
  },
  headerBack: {
    alignSelf: 'flex-start',
    padding: width * 0.02,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: height * 0.03,
    justifyContent: 'center',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  subLabel: {
    fontSize: width * 0.035,
    marginTop: height * 0.002,
    color: '#475569',
    alignSelf: 'stretch',
    lineHeight: width * 0.045,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.03,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: 420,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    width: '100%',
    marginTop: height * 0.01,
    marginBottom: height * 0.015,
    gap: width * 0.02,
  },
  codeInput: {
    flex: 1,
    minWidth: width * 0.1,
    maxWidth: width * 0.14,
    height: height * 0.07,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: width * 0.05,
    color: '#0F172A',
  },
  countdownText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: width * 0.035,
    marginBottom: height * 0.015,
  },
  primaryButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: height * 0.018,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    minHeight: height * 0.06,
    justifyContent: 'center',
  },
  resendButton: {
    marginTop: height * 0.015,
    paddingVertical: height * 0.015,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#0F172A',
    minHeight: height * 0.055,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  resendButtonText: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  contentWrapper: {
    justifyContent: 'center',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: height * 0.05,
    width: '100%',
  },
  logoWrapper: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 4,
    borderColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: height * 0.03,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    resizeMode: 'contain',
  },
});
