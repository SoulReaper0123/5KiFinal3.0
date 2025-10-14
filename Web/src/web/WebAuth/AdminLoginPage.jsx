import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../../../Database/firebaseConfig';
import { ref, get } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserShield, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from './AuthContext';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [focusedInput, setFocusedInput] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const isSmallScreen = windowWidth < 1024;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const adminRef = ref(database, 'Users/Admin');
      const snapshot = await get(adminRef);
      const admins = snapshot.val();

      let matchedAdmin = null;
      for (const key in admins) {
        if (admins[key].uid === user.uid) {
          matchedAdmin = admins[key];
          break;
        }
      }

      if (matchedAdmin && matchedAdmin.role === 'admin') {
        localStorage.setItem('adminId', matchedAdmin.id);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        login(matchedAdmin);
        navigate('/adminhome');
      } else {
        throw new Error('Access denied. You are not an Admin.');
      }
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Enhanced professional styles for banking login
  const styles = {
    container: {
      display: 'flex',
      flexDirection: isSmallScreen ? 'column' : 'row',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F8FAFC',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    leftSection: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      padding: isSmallScreen ? '40px 24px' : '60px 80px',
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
      padding: '8px 16px',
    },
    errorText: {
      color: '#DC2626',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
    },
    rightSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #1E3A5F 0%, #2D5783 100%)',
      padding: isSmallScreen ? '60px 24px' : '60px 80px',
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
      fontSize: isSmallScreen ? '32px' : '42px',
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
    inputplaceholder: {
      color: '#9CA3AF',
      fontWeight: '400',
    },
    eyeWrapper: {
      width: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: '#6B7280',
      transition: 'color 0.2s ease',
    },
    eyeWrapperHover: {
      color: '#374151',
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: '24px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontSize: '14px',
      fontWeight: '600',
      color: '#3B82F6',
      textDecoration: 'none',
      transition: 'color 0.2s ease',
    },
    forgotPasswordButtonHover: {
      color: '#1D4ED8',
      textDecoration: 'underline',
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
    loginButton: {
      background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
    },
    loginButtonHover: {
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
      fontSize: isSmallScreen ? '36px' : '48px',
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: '16px',
      textAlign: 'center',
      lineHeight: 1.1,
      zIndex: 2,
    },
    welcomeSubtitle: {
      fontSize: isSmallScreen ? '16px' : '18px',
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
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backdropFilter: 'blur(8px)',
    },
    overlayContent: {
      textAlign: 'center',
      maxWidth: '500px',
    },
    overlayIcon: {
      fontSize: '64px',
      color: '#3B82F6',
      marginBottom: '24px',
    },
    overlayTitle: {
      color: '#FFFFFF',
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '16px',
    },
    overlayText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '16px',
      lineHeight: 1.6,
      marginBottom: '0',
    },
    loadingOverlay: {
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
    },
    spinner: {
      border: '3px solid rgba(255, 255, 255, 0.3)',
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
    adminFeatures: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginTop: '32px',
      zIndex: 2,
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '14px',
    },
    featureIcon: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
  };

  // Reusable Button Component with hover states
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

  // Add the animation to the head of the document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.container}>
      {isSmallScreen && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayIcon}>💻</div>
            <h2 style={styles.overlayTitle}>Desktop Experience Required</h2>
            <p style={styles.overlayText}>
              For security reasons and optimal functionality, please access the Admin portal from a desktop or tablet device.
            </p>
          </div>
        </div>
      )}

      {/* Left Section - Login Form */}
      <div style={styles.leftSection}>
        <div style={styles.leftSectionWrapper}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Admin Portal</h1>
            <p style={styles.subtitle}>Enter your secure credentials to continue</p>
          </div>

          <div style={styles.formBlock}>
            {/* Error message */}
            <div style={styles.errorContainer}>
              {error && <p style={styles.errorText}>{error}</p>}
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
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                Password <span style={styles.required}>*</span>
              </label>
              <div style={{
                ...styles.inputContainer,
                ...(focusedInput === 'password' ? styles.inputContainerFocused : {})
              }}>
                <div style={styles.iconWrapper}>
                  <FaLock size={16} />
                </div>
                <input
                  style={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                />
                <button
                  style={styles.eyeWrapper}
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <button 
              style={styles.forgotPasswordButton}
              onClick={handleForgotPassword}
              type="button"
              onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3B82F6'}
            >
              Forgot Password?
            </button>

            {/* Login Button */}
            <Button
              style={{ ...styles.button, ...styles.loginButton }}
              hoverStyle={styles.loginButtonHover}
              onClick={handleLogin}
              disabled={loading}
              icon={loading ? null : <FaUserShield />}
            >
              {loading ? 'Signing In...' : 'Admin Login'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Section - Welcome Content */}
      <div style={styles.rightSection}>
        <div style={styles.rightSectionOverlay} />
        <h1 style={styles.welcomeTitle}>Welcome Back, Admin</h1>
        <p style={styles.welcomeSubtitle}>
          Access your administrative dashboard to manage loan applications, 
          monitor customer accounts, and oversee daily banking operations.
        </p>
        
        <div style={styles.adminFeatures}>
          <div style={styles.featureItem}>
            <FaUserShield style={styles.featureIcon} size={16} />
            <span>Loan Application Management</span>
          </div>
          <div style={styles.featureItem}>
            <FaUserShield style={styles.featureIcon} size={16} />
            <span>Customer Account Oversight</span>
          </div>
          <div style={styles.featureItem}>
            <FaUserShield style={styles.featureIcon} size={16} />
            <span>Transaction Monitoring</span>
          </div>
        </div>

        <div style={styles.securityBadge}>
          <FaLock size={16} color="rgba(255, 255, 255, 0.9)" />
          <span style={styles.securityText}>Banking-Grade Security Enabled</span>
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

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Authenticating Admin Access...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;