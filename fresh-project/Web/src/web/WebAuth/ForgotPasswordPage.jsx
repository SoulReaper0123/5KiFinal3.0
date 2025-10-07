import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { auth } from '../../../../Database/firebaseConfig';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setConfirmVisible(true);
  };

  const handleConfirmReset = async () => {
    setConfirmVisible(false);
    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      await auth.sendPasswordResetEmail(email);
      setMessage('Password reset email sent! Please check your inbox.');
      setSuccessVisible(true);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not send password reset email. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePasswordReset();
    }
  };

  // Styles matching your AdminLoginPage
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      position: 'relative'
    },
    leftSection: {
      flex: 3,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: '0 60px'
    },
    leftSectionWrapper: {
      width: '100%',
      maxWidth: '400px'
    },
    titleBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: '20px'
    },
    formBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    },
    errorContainer: {
      height: '30px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '5px'
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      fontSize: '14px'
    },
    successText: {
      color: '#10b981',
      fontSize: '14px',
      margin: '0.5rem 0 1rem',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    rightSection: {
      flex: 2,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#2D5783',
      padding: '40px'
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#001F3F',
      margin: 0
    },
    subtitle: {
      fontSize: '15px',
      color: '#555',
      margin: 0
    },
    inputGroup: {
      width: '100%',
      marginBottom: '12px'
    },
    inputLabel: {
      color: '#001F3F',
      fontSize: '16px',
      marginBottom: '4px',
      fontWeight: '500'
    },
    required: {
      color: 'red'
    },
    inputContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: '10px',
      border: '1px solid #ddd',
      width: '100%',
      height: '50px',
      padding: '0 10px',
      overflow: 'hidden'
    },
    iconWrapper: {
      width: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '10px'
    },
    input: {
      flex: 1,
      fontSize: '16px',
      color: '#000',
      height: '100%',
      padding: 0,
      border: 'none',
      outline: 'none'
    },
    rightIconSpacer: {
      width: '24px'
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: '15px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0
    },
    button: {
      padding: '12px 20px',
      borderRadius: '15px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 'auto',
      width: 'auto',
      cursor: 'pointer',
      border: 'none',
      fontSize: '18px',
      fontWeight: '600'
    },
    submitButton: {
      backgroundColor: '#001F3F',
      width: '40%',
      color: 'white'
    },
    backButton: {
      backgroundColor: 'transparent',
      border: '1px solid #FFFFFF',
      marginTop: '50px',
      padding: '12px 30px',
      whiteSpace: 'nowrap',
      color: 'white'
    },
    buttonText: {
      color: 'white',
      whiteSpace: 'nowrap'
    },
    welcomeTitle: {
      fontSize: '60px',
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: '10px',
      textAlign: 'center'
    },
    welcomeSubtitle: {
      fontSize: '20px',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '20px',
      lineHeight: '24px',
      maxWidth: '80%'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalCardSmall: {
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      textAlign: 'center'
    },
    confirmIcon: {
      marginBottom: '12px',
      fontSize: '32px'
    },
    modalText: {
      fontSize: '14px',
      marginBottom: '16px',
      textAlign: 'center',
      color: '#333',
      lineHeight: '1.4'
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s',
      minWidth: '100px',
      outline: 'none',
      '&:focus': {
        outline: 'none',
        boxShadow: 'none'
      }
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      cursor: 'pointer',
      fontSize: '18px',
      color: 'grey',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '4px',
      outline: 'none',
      '&:focus': {
        outline: 'none',
        boxShadow: 'none'
      }
    },
    spinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#2D5783',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      animation: 'spin 1s linear infinite'
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Section */}
      <div style={styles.leftSection}>
        <div style={styles.leftSectionWrapper}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Enter your email to receive a reset link</p>
          </div>

          <div style={styles.formBlock}>
            {/* Error message container with fixed height */}
            <div style={styles.errorContainer}>
              {error && <p style={styles.errorText}>{error}</p>}
              {message && (
                <p style={styles.successText}>
                  <FaCheckCircle size={16} />
                  {message}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email <span style={styles.required}>*</span></label>
              <div style={styles.inputContainer}>
                <div style={styles.iconWrapper}>
                  <FaEnvelope size={18} color="#001F3F" />
                </div>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  autoCapitalize="none"
                />
                <div style={styles.rightIconSpacer} />
              </div>
            </div>

            <button
              style={{ ...styles.button, ...styles.submitButton }}
              onClick={handlePasswordReset}
              disabled={isProcessing}
            >
              <span style={styles.buttonText}>
                {isProcessing ? 'Sending...' : 'Send Reset Link'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        <h1 style={styles.welcomeTitle}>Forgot Password?</h1>
        <p style={styles.welcomeSubtitle}>
          No worries! We'll send you instructions to reset your password.
        </p>
        <button
          style={{ ...styles.button, ...styles.backButton }}
          onClick={() => navigate('/')}
        > 
          <span style={styles.buttonText}>Back to Home</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to send a password reset link to {email}?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={handleConfirmReset}
              >
                Yes
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
                }} 
                onClick={() => setConfirmVisible(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
            <p style={styles.modalText}>Password reset email sent successfully!</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={() => {
                setSuccessVisible(false);
                setEmail('');
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Processing Overlay (no modal, just overlay like logout) */}
      {isProcessing && (
        <div style={styles.modalOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;