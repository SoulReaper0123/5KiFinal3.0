import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BiometricSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { email, password } = route.params;

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware) {
        setError('Fingerprint scanner not available on this device');
        return;
      }
      
      if (!isEnrolled) {
        setError('No fingerprints registered on this device. Please set up fingerprints in your device settings.');
        return;
      }
    } catch (err) {
      console.error('Biometric check error:', err);
      setError('Unable to check biometric capabilities');
    }
  };

  const setupBiometrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your fingerprint to enable login',
        disableDeviceFallback: true,
        fallbackLabel: '',
      });

      if (result.success) {
        await SecureStore.setItemAsync(
          'biometricCredentials',
          JSON.stringify({ email, password })
        );
        Alert.alert(
          'Success', 
          'Fingerprint login has been enabled!',
          [{ text: 'OK', onPress: () => navigation.navigate('DrawerNav', { email })}]
        );
      } else {
        setError('Fingerprint authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Biometric setup error:', err);
      setError('An error occurred during setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const skipSetup = () => {
    navigation.navigate('DrawerNav', { email });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons 
          name="fingerprint" 
          size={120} 
          color="#4FE7AF" 
          style={styles.icon} 
        />
        
        <Text style={styles.title}>Enable Fingerprint Login</Text>
        
        <Text style={styles.description}>
          You can use your fingerprint to securely log in to your account without entering your password each time.
        </Text>

        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={setupBiometrics}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Set Up Fingerprint</Text>
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
    paddingHorizontal: 20,
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