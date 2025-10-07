import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../../../Database/firebaseConfig';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const storedUser = localStorage.getItem('user');
          
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Ensure the user object has a role property
            if (!parsedUser.role) {
              parsedUser.role = 'user'; // Default role if none is set
            }
            setUser(parsedUser);
          } else {
            // Fallback if no user data is stored, but firebase is logged in
            setUser({ 
              email: firebaseUser.email,
              role: 'user' // Default role
            });
          }
        } catch (error) {
          console.log("Error retrieving user from storage:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (userData) => {
    // Ensure the userData has a role property
    if (!userData.role) {
      userData.role = 'user'; // Default role
    }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
};