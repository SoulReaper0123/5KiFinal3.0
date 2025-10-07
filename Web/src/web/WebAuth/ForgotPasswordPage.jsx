import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaCheckCircle, FaLock } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { auth } from '../../../../Database/firebaseConfig';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
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

  // Enhanced professional styles matching banking design
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F8FAFC',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    leftSection: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      padding: '60px 80px',
      position: 'relative',
    },
    leftSectionWrapper: {
      width: '100%',
      maxWidth: '440px',
    },
    titleBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: '32px',
    },
    formBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    errorContainer: {
      height: '40px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: '12px',
   
    },
    errorText: {
      color: '#DC2626',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
    },
    successText: {
      color: '#10B981',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: '#F0FDF4',
      border: '1px solid #BBF7D0',
      borderRadius: '12px',
      padding: '12px 16px',
      width: '100%',
    },
    rightSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      padding: '60px 80px',
      position: 'relative',
      overflow: 'hidden',
    },
    rightSectionOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.3) 0%, rgba(30, 58, 138, 0.2) 100%)',
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 8px 0',
      background: 'linear-gradient(135deg, #1E293B 0%, #3B82F6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748B',
      margin: 0,
      fontWeight: '500',
    },
    inputGroup: {
      width: '100%',
      marginBottom: '20px',
    },
    inputLabel: {
      color: '#374151',
      fontSize: '14px',
      marginBottom: '8px',
      fontWeight: '600',
      display: 'block',
    },
    required: {
      color: '#DC2626',
    },
    inputContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '2px solid #E5E7EB',
      width: '100%',
      height: '56px',
      padding: '0 16px',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    inputContainerFocused: {
      borderColor: '#3B82F6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    iconWrapper: {
      width: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12px',
      color: '#6B7280',
    },
    input: {
      flex: 1,
      fontSize: '16px',
      color: '#111827',
      height: '100%',
      padding: 0,
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      fontWeight: '500',
    },
    inputPlaceholder: {
      color: '#9CA3AF',
      fontWeight: '400',
    },
    button: {
      padding: '16px 32px',
      borderRadius: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      cursor: 'pointer',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    submitButton: {
      background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
    },
    submitButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      backdropFilter: 'blur(10px)',
      marginTop: '40px',
      padding: '14px 28px',
      width: 'auto',
      minWidth: '200px',
    },
    backButtonHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 0.2)',
    },
    buttonText: {
      color: 'inherit',
      fontWeight: '600',
    },
    welcomeTitle: {
      fontSize: '48px',
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: '16px',
      textAlign: 'center',
      lineHeight: 1.1,
      zIndex: 2,
    },
    welcomeSubtitle: {
      fontSize: '18px',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginBottom: '32px',
      lineHeight: 1.6,
      maxWidth: '400px',
      zIndex: 2,
      fontWeight: '400',
    },
    securityBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: '12px 20px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginTop: '40px',
      zIndex: 2,
    },
    securityText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '14px',
      fontWeight: '500',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      padding: '20px',
    },
    modalCardSmall: {
      width: '400px',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      textAlign: 'center',
      border: '1px solid #F1F5F9',
    },
    confirmIcon: {
      marginBottom: '20px',
      fontSize: '48px',
    },
    modalText: {
      fontSize: '16px',
      marginBottom: '24px',
      textAlign: 'center',
      color: '#475569',
      lineHeight: '1.6',
      fontWeight: '500',
    },
    modalEmail: {
      fontWeight: '600',
      color: '#1E293B',
      backgroundColor: '#F8FAFC',
      padding: '8px 12px',
      borderRadius: '8px',
      margin: '8px 0',
    },
    actionButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      minWidth: '100px',
      outline: 'none',
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#64748B',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
    },
    spinner: {
      border: '3px solid rgba(59, 130, 246, 0.3)',
      borderTop: '3px solid #3B82F6',
      borderRadius: '50%',
      width: '48px',
      height: '48px',
      animation: 'spin 1s linear infinite',
    },
    loadingText: {
      color: '#FFFFFF',
      marginTop: '16px',
      fontSize: '16px',
      fontWeight: '500',
    },
  };

  // Button Component with hover states
  const Button = ({ 
    style, 
    hoverStyle, 
    onClick, 
    disabled, 
    children, 
    icon,
    type = 'button'
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        style={{
          ...style,
          ...(isHovered && !disabled ? hoverStyle : {})
        }}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type={type}
      >
        {icon && <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </button>
    );
  };

  return (
    <div style={styles.container}>
      {/* Left Section - Reset Form */}
      <div style={styles.leftSection}>
        <div style={styles.leftSectionWrapper}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Enter your email to receive a secure reset link</p>
          </div>

          <div style={styles.formBlock}>
            {/* Error/Success message */}
            <div style={styles.errorContainer}>
              {error && <p style={styles.errorText}>{error}</p>}
              {message && (
                <p style={styles.successText}>
                  <FaCheckCircle size={16} />
                  {message}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                Email Address <span style={styles.required}>*</span>
              </label>
              <div style={{
                ...styles.inputContainer,
                ...(focusedInput === 'email' ? styles.inputContainerFocused : {})
              }}>
                <div style={styles.iconWrapper}>
                  <FaEnvelope size={16} />
                </div>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="admin@5kibanking.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              style={{ ...styles.button, ...styles.submitButton }}
              hoverStyle={styles.submitButtonHover}
              onClick={handlePasswordReset}
              disabled={isProcessing}
              icon={isProcessing ? null : <FaLock />}
            >
              {isProcessing ? 'Sending Reset Link...' : 'Send Secure Reset Link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Section - Welcome Content */}
      <div style={styles.rightSection}>
        <div style={styles.rightSectionOverlay} />
        <h1 style={styles.welcomeTitle}>Forgot Your Password?</h1>
        <p style={styles.welcomeSubtitle}>
          Don't worry! We'll send you a secure password reset link to your email address. 
          Follow the instructions in the email to regain access to your account.
        </p>
        
        <div style={styles.securityBadge}>
          <FaLock size={16} color="rgba(255, 255, 255, 0.9)" />
          <span style={styles.securityText}>Banking-Grade Security</span>
        </div>

        <Button
          style={{ ...styles.button, ...styles.backButton }}
          hoverStyle={styles.backButtonHover}
          onClick={() => navigate('/')}
          icon={<FaArrowLeft />}
        >
          Back to Home
        </Button>
      </div>

      {/* Confirmation Modal */}
      {confirmVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <button 
              style={styles.closeButton}
              onClick={() => setConfirmVisible(false)}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FiAlertCircle />
            </button>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#3B82F6' }} />
            <p style={styles.modalText}>
              Are you sure you want to send a password reset link to:
            </p>
            <div style={styles.modalEmail}>{email}</div>
            <p style={styles.modalText}>
              This will send a secure reset link to your email address.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                }} 
                hoverStyle={{ backgroundColor: '#2563EB' }}
                onClick={handleConfirmReset}
              >
                <FaCheckCircle style={{ marginRight: '6px' }} />
                Yes, Send Link
              </Button>
              <Button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#6B7280',
                  color: '#fff',
                }} 
                hoverStyle={{ backgroundColor: '#4B5563' }}
                onClick={() => setConfirmVisible(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <button 
              style={styles.closeButton}
              onClick={() => {
                setSuccessVisible(false);
                setEmail('');
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FiAlertCircle />
            </button>
            <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10B981' }} />
            <p style={styles.modalText}>
              Password reset email sent successfully!
            </p>
            <p style={{...styles.modalText, fontSize: '14px', color: '#64748B'}}>
              Please check your inbox and follow the instructions to reset your password. 
              The link will expire in 1 hour for security reasons.
            </p>
            <Button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#10B981',
                color: '#fff',
              }} 
              hoverStyle={{ backgroundColor: '#059669' }}
              onClick={() => {
                setSuccessVisible(false);
                setEmail('');
              }}
            >
              <FaCheckCircle style={{ marginRight: '6px' }} />
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div style={styles.modalOverlay}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Sending secure reset link...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;