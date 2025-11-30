// utils/platformUtils.js
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Universal biometric check
export const checkBiometricSupport = async () => {
  // Always return false on web and mobile browsers
  if (Platform.OS === 'web') {
    return {
      hasHardware: false,
      isEnrolled: false,
      isSupported: false,
      error: 'Biometric authentication is not available in browser'
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    return {
      hasHardware,
      isEnrolled,
      isSupported: hasHardware && isEnrolled,
      error: null
    };
  } catch (error) {
    console.error('Biometric check error:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      isSupported: false,
      error: 'Unable to check biometric capabilities'
    };
  }
};

// Universal SecureStore with fallback
export const Storage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      // Fallback to localStorage for web
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('localStorage set error:', error);
        return false;
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
        return true;
      } catch (error) {
        console.error('SecureStore set error:', error);
        return false;
      }
    }
  },

  async getItem(key) {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage get error:', error);
        return null;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('SecureStore get error:', error);
        return null;
      }
    }
  },

  async deleteItem(key) {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('localStorage delete error:', error);
        return false;
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
        return true;
      } catch (error) {
        console.error('SecureStore delete error:', error);
        return false;
      }
    }
  }
};

// Universal biometric authentication
export const authenticateBiometric = async (options = {}) => {
  if (Platform.OS === 'web') {
    return {
      success: false,
      error: 'biometric_not_available',
      message: 'Biometric authentication is not available in browser'
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with biometrics',
      disableDeviceFallback: false, // Allow device fallback
      fallbackLabel: 'Use passcode', // Better fallback label
      ...options
    });

    return result;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return {
      success: false,
      error: 'authentication_failed',
      message: 'Biometric authentication failed'
    };
  }
};

// Check if we're in a mobile browser
export const isMobileBrowser = () => {
  return Platform.OS === 'web' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
