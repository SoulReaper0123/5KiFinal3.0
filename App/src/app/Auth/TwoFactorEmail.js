import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendVerificationCode } from '../../api';

export default function TwoFactorEmail({ route, navigation }) {
  const { email, password, fromBiometric } = route.params;

  const handleSendCode = () => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Immediately navigate to next screen
    navigation.navigate('VerifyCode', { 
      email,
      password,
      verificationCode,
      fromBiometric
    });

    // Then send email in background (no await)
    sendVerificationCode({
      email,
      verificationCode
    })
    .then(response => {
      if (!response.success) {
        console.error('Email sending failed:', response.message);
      }
    })
    .catch(error => {
      console.error('Email sending error:', error);
    });

    // Still keep console log for debugging
    console.log(`Verification code sent to ${email}: ${verificationCode}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.contentWrapper}>
        <View style={styles.logoWrapper}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subLabel}>We'll send a 6-digit code to your email</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
            <MaterialIcons name="lock" size={20} color="#666" />
          </View>

          <Text style={styles.instructions}>
            For your security, we'll send a 6-digit verification code to this email address.
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSendCode}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Send Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    paddingBottom: 150,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
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
  emailContainer: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F8F8F8',
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  instructions: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'left',
    lineHeight: 20,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    resizeMode: 'contain',
  },
});