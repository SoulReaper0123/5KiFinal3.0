import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendVerificationCode } from '../../api'; // Update path as needed

export default function TwoFactorEmail({ route, navigation }) {
  const email = route.params?.email || '';
  const firstName = route.params?.firstName || '';
  const [isLoading, setIsLoading] = useState(false);

const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    setIsLoading(true);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`[DEBUG] Generated verification code: ${verificationCode}`);
    console.log(`[DEBUG] Attempting to send to email: ${email}`);

    // Show loading for minimum 500ms before navigating
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('VerifyCode', { 
        email,
        verificationCode,
        lockedEmail: email,
        lockedCode: verificationCode 
      });

      // Run API in background after navigation
      sendVerificationCode({
        email,
        firstName,
        verificationCode
      })
      .then(() => console.log('Email sent successfully'))
      .catch(error => console.error('Failed to send email:', error));
    }, 500); // Minimum loading duration
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        {/* Back Button - Disabled during loading */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => !isLoading && navigation.goBack()}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <MaterialIcons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          
          <View style={styles.emailContainer}>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
            <MaterialIcons name="lock" size={20} color="#666" />
          </View>

          <Text style={styles.instructions}>
            For your security, we'll send a 6-digit verification code to this email address.
            The code will expire in 10 minutes.
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSendCode}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Send Code</Text>
          </TouchableOpacity>

          {/* Overlay to disable interaction while loading */}
          {isLoading && (
            <TouchableWithoutFeedback>
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 25,
    zIndex: 1,
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: 40,
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
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
    width: '100%',
  },
  button: {
    backgroundColor: '#A8D5BA',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 100,
  },
});