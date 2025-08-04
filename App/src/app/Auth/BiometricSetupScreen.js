import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BiometricSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { email, password } = route.params;

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (!compatible || !enrolled) {
      setError('Biometric authentication not available or not set up on this device');
      return;
    }

    const typeMap = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: 'Fingerprint',
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: 'Face ID',
    };

    setBiometricType(typeMap[types[0]] || 'Biometric');
  };

  const setupBiometrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Register your ${biometricType} for future logins`,
        disableDeviceFallback: true,
      });

      if (result.success) {
        await Keychain.setGenericPassword(email, password, {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
          authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
        });
        navigation.goBack();
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Biometric setup error:', err);
      setError('An error occurred during setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const skipSetup = () => {
    navigation.goBack();
  };

  // Choose appropriate icon based on biometric type
  const getBiometricIcon = () => {
    switch(biometricType) {
      case 'Fingerprint':
        return 'fingerprint';
      case 'Face ID':
        return 'face';
      default:
        return 'security';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Replace Image with Material Icon */}
        <MaterialIcons 
          name={getBiometricIcon()} 
          size={120} 
          color="#4FE7AF" 
          style={styles.icon} 
        />
        
        <Text style={styles.title}>Enable {biometricType} Login</Text>
        
        <Text style={styles.description}>
          You can use your {biometricType} to securely log in to your account without entering your password each time.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={setupBiometrics}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Set Up {biometricType}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={skipSetup}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4FE7AF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});