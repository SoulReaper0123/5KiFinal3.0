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
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Two-Factor Authentication</Text>
        
        {/* Email Display */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
            {email}
          </Text>
          <MaterialIcons name="lock" size={20} color="#666" />
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          For your security, we'll send a 6-digit verification code to this email address.
        </Text>
        
        {/* Send Code Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSendCode}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Send Code</Text>
        </TouchableOpacity>
      </View>
    </View>
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
});