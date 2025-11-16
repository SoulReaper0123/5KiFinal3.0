import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Check for biometric login first
        const storedEmail = await SecureStore.getItemAsync('currentUserEmail');
        const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
        
        console.log('Stored credentials:', { storedEmail, biometricEnabled });
        
        if (storedEmail) {
          // User has stored credentials, consider them authenticated
          setUser({ 
            email: storedEmail,
            biometric: !!biometricEnabled 
          });
          setLoading(false);
          return;
        }

        // Fallback to Firebase auth state listener
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          console.log('Firebase auth state changed:', firebaseUser?.email);
          if (firebaseUser) {
            setUser({ 
              email: firebaseUser.email,
              uid: firebaseUser.uid,
              firebase: true
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData) => {
    console.log('Logging in user:', userData.email);
    setUser(userData);
    
    // Store email for persistence
    if (userData.email) {
      await SecureStore.setItemAsync('currentUserEmail', userData.email);
    }
  };

  const logout = async () => {
    console.log('Logging out user');
    setUser(null);
    await SecureStore.deleteItemAsync('currentUserEmail');
    await SecureStore.deleteItemAsync('biometricEnabled');
    await auth.signOut();
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
