import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../../../Database/firebaseConfig';
import { ref, get } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from './AuthContext';

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
  eyeWrapper: {
    width: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: '15px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  forgotPasswordText: {
    color: '#001F3F',
    fontSize: '16px',
    textDecoration: 'underline'
  },
  button: {
    padding: '12px 20px',
    borderRadius: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'auto',
    width: '40%',
    cursor: 'pointer',
    border: 'none',
    fontSize: '18px',
    fontWeight: '600'
  },
  loginButton: {
    backgroundColor: '#001F3F',
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
  overlay: {
    position: 'absolute',
    zIndex: 999,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
    maxWidth: '500px'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#2D5783',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    animation: 'spin 1s linear infinite'
  }
};

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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
          <p style={styles.overlayText}>
            Please use a device with a larger screen to access this page.
          </p>
        </div>
      )}

      {/* Left Section */}
      <div style={styles.leftSection}>
        <div style={styles.leftSectionWrapper}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Sign in</h1>
            <p style={styles.subtitle}>Input your own credentials</p>
          </div>

          <div style={styles.formBlock}>
            {/* Error message container with fixed height */}
            <div style={styles.errorContainer}>
              {error && <p style={styles.errorText}>{error}</p>}
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
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  onKeyPress={handleKeyPress}
                />
                <div style={styles.rightIconSpacer} />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Password <span style={styles.required}>*</span></label>
              <div style={styles.inputContainer}>
                <div style={styles.iconWrapper}>
                  <FaLock size={20} color="#001F3F" />
                </div>
                <input
                  style={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholderTextColor="#999"
                  autoComplete="off"
                  onKeyPress={handleKeyPress}
                />
                <button
                  style={styles.eyeWrapper}
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <FaEye size={20} color="#001F3F" />
                  ) : (
                    <FaEyeSlash size={20} color="#001F3F" />
                  )}
                </button>
              </div>
            </div>

            <button style={styles.forgotPasswordButton} onClick={handleForgotPassword} type="button">
              <span style={styles.forgotPasswordText}>Forgot Password?</span>
            </button>

            <button
              style={{ ...styles.button, ...styles.loginButton }}
              onClick={handleLogin}
              disabled={loading}
              type="button"
            >
              <span style={styles.buttonText}>Log In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        <h1 style={styles.welcomeTitle}>Hello, Admin!</h1>
        <p style={styles.welcomeSubtitle}>
          To keep connected, please log in with your personal info.
        </p>
        <button
          style={{ ...styles.button, ...styles.backButton }}
          onClick={() => navigate('/')}
          type="button"
        >
          <span style={styles.buttonText}>Go back to home</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;