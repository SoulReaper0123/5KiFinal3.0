import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { auth } from '../../../../Database/firebaseConfig';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setError('Error: Could not send password reset email');
      console.error(error);
    }
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      position: 'relative',
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      marginBottom: '30px',
      color: '#333',
    },
    input: {
      width: '80%',
      padding: '12px',
      fontSize: '16px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginBottom: '25px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    button: {
      backgroundColor: '#001F3F',
      padding: '16px',
      borderRadius: '10px',
      width: '80%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    buttonText: {
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold',
    },
    errorText: {
      color: 'red',
      fontSize: '16px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    successText: {
      color: 'green',
      fontSize: '16px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    backButton: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'transparent',
      border: '1px solid #4FE7AF',
      borderRadius: '10px',
      padding: '10px 15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
  };

  return (
    <div style={styles.container}>
      {/* Back Button with Arrow Icon */}
      <button 
        style={styles.backButton}
        onClick={() => navigate('/adminlogin')}
      >
        <FaArrowLeft size={24} color="#4FE7AF" />
      </button>

      <h1 style={styles.title}>Forgot Password</h1>
      {error && <p style={styles.errorText}>{error}</p>}
      {message && <p style={styles.successText}>{message}</p>}

      <input
        style={styles.input}
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoCapitalize="none"
      />

      <button style={styles.button} onClick={handlePasswordReset}>
        <span style={styles.buttonText}>Submit</span>
      </button>
    </div>
  );
};

export default ForgotPasswordPage;