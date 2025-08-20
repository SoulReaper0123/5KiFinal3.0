import { initializeAppCheck, getToken } from 'firebase/app-check';
import { app } from './firebaseConfig'; // Use the shared app instance

// Initialize App Check
let appCheck;

export const initializeAppCheckForApp = () => {
  try {
    // Skip App Check initialization in development for React Native
    // App Check is primarily for web and can be complex to set up for mobile
    if (__DEV__) {
      console.log('App Check skipped in development mode for React Native');
      return null;
    }

    // In production, you would implement proper App Check
    // For now, we'll skip it to focus on getting the AI working
    console.log('App Check not configured for production yet');
    return null;
  } catch (error) {
    console.error('Error initializing App Check:', error);
    return null;
  }
};

export const getAppCheckToken = async () => {
  try {
    if (!appCheck) {
      console.warn('App Check not initialized');
      return null;
    }
    
    const appCheckTokenResponse = await getToken(appCheck);
    return appCheckTokenResponse.token;
  } catch (error) {
    console.error('Error getting App Check token:', error);
    return null;
  }
};

export { appCheck };