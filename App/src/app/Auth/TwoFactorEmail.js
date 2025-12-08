import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendVerificationCode } from '../../api';

const { width, height } = Dimensions.get('window');

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
        <MaterialIcons name="arrow-back" size={width * 0.07} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.contentWrapper}>
        <View style={styles.logoWrapper}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        </View>

        <View style={{ marginBottom: height * 0.02 }}>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subLabel}>We'll send a 6-digit code to your email</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
            <MaterialIcons name="lock" size={width * 0.05} color="#666" />
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
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    paddingBottom: height * 0.15,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: height * 0.01,
    marginTop: height * 0.03,
    padding: width * 0.02,
    borderRadius: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
    marginBottom: height * 0.005,
  },
  subLabel: {
    fontSize: width * 0.035,
    marginTop: height * 0.002,
    color: '#475569',
    lineHeight: width * 0.045,
  },
  emailContainer: {
    width: '100%',
    height: height * 0.065,
    minHeight: 55,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    backgroundColor: '#F8F8F8',
    marginBottom: height * 0.03,
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
    fontSize: width * 0.04,
    color: '#333',
    marginRight: width * 0.03,
  },
  instructions: {
    color: '#475569',
    fontSize: width * 0.037,
    marginBottom: height * 0.02,
    textAlign: 'left',
    lineHeight: width * 0.05,
    width: '100%',
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
  primaryButtonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
