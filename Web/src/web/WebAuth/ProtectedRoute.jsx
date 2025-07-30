import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/'); // Redirect to home page
      } else if (requiredRole && user.role !== requiredRole) {
        navigate('/'); // Redirect to home if role is not allowed
      }
    }
  }, [user, loading, navigate, requiredRole]);



  return <>{children}</>;
};

export default ProtectedRoute;