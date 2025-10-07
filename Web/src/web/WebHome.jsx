import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import the logo image
import logo from '../../../assets/logo.png'; // Make sure this path is correct

const WebHome = () => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOnClick = (page) => {
    navigate(page);
  };

  const isSmallScreen = windowWidth < 1024;

  // Enhanced professional styles for banking/loan services
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
    leftColumn: {
      flex: 1.2,
      background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden',
    },
    leftColumnOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.4) 0%, rgba(30, 58, 138, 0.2) 100%)',
    },
    rightColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isSmallScreen ? '60px 20px' : '60px 40px',
      backgroundColor: '#FFFFFF',
      boxShadow: isSmallScreen ? 'none' : '-8px 0px 32px rgba(0, 0, 0, 0.04)',
    },
    logo: {
      width: isSmallScreen ? '120px' : '160px',
      height: isSmallScreen ? '120px' : '160px',
      marginBottom: '24px',
      borderRadius: '20px',
      objectFit: 'contain',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 2,
    },
    welcomeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '20px',
      zIndex: 2,
      textAlign: 'center',
    },
    welcomeTitle: {
      fontSize: isSmallScreen ? '32px' : '48px',
      color: '#FFFFFF',
      fontWeight: '700',
      marginBottom: '16px',
      textAlign: 'center',
      lineHeight: 1.1,
    },
    welcomeSubtitle: {
      fontSize: isSmallScreen ? '16px' : '18px',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      maxWidth: '400px',
      lineHeight: 1.6,
      fontWeight: '400',
    },
    bankingFeatures: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '16px',
      marginTop: '40px',
      zIndex: 2,
    },
    featurePill: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      color: '#FFFFFF',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    dashboardTitle: {
      fontSize: isSmallScreen ? '32px' : '42px',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '12px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #1E293B 0%, #3B82F6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    selectRoleText: {
      fontSize: isSmallScreen ? '16px' : '18px',
      color: '#64748B',
      marginBottom: '40px',
      textAlign: 'center',
      fontWeight: '500',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      maxWidth: '320px',
    },
    superAdminButton: {
      backgroundColor: '#FFFFFF',
      border: '2px solid #3B82F6',
      padding: '18px 32px',
      borderRadius: '16px',
      minWidth: '280px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
      position: 'relative',
      overflow: 'hidden',
    },
    superAdminButtonHover: {
      backgroundColor: '#3B82F6',
      transform: 'translateY(-2px)',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.1)',
    },
    superAdminButtonText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#3B82F6',
      transition: 'color 0.3s ease',
    },
    superAdminButtonTextHover: {
      color: '#FFFFFF',
    },
    adminButton: {
      backgroundColor: '#3B82F6',
      padding: '20px 32px',
      borderRadius: '16px',
      minWidth: '280px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
      position: 'relative',
      overflow: 'hidden',
    },
    adminButtonHover: {
      backgroundColor: '#1D4ED8',
      transform: 'translateY(-2px)',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
    },
    adminButtonText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#FFFFFF',
    },
    coAdminButton: {
      backgroundColor: '#1E293B',
      padding: '20px 32px',
      borderRadius: '16px',
      minWidth: '280px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.2), 0 2px 4px -1px rgba(30, 41, 59, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    },
    coAdminButtonHover: {
      backgroundColor: '#0F172A',
      transform: 'translateY(-2px)',
      boxShadow: '0 20px 25px -5px rgba(30, 41, 59, 0.3), 0 10px 10px -5px rgba(30, 41, 59, 0.2)',
    },
    coAdminButtonText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#FFFFFF',
    },
    buttonIcon: {
      marginRight: '12px',
      fontSize: '20px',
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
  };

  // Button component with hover state
  const Button = ({ 
    style, 
    hoverStyle, 
    textStyle, 
    textHoverStyle, 
    onClick, 
    children, 
    icon 
  }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <button
        style={{
          ...style,
          ...(isHovered ? hoverStyle : {})
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {icon && <span style={styles.buttonIcon}>{icon}</span>}
        <span style={{
          ...textStyle,
          ...(isHovered ? textHoverStyle : {})
        }}>
          {children}
        </span>
      </button>
    );
  };

  return (
    <div style={styles.container}>
      {/* Block UI for small screens */}
      {isSmallScreen && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayIcon}>📱</div>
            <h2 style={styles.overlayTitle}>Optimized for Larger Screens</h2>
            <p style={styles.overlayText}>
              For the best experience, please access this dashboard from a desktop or tablet device with a larger screen.
            </p>
          </div>
        </div>
      )}

      {/* Left column */}
      <div style={styles.leftColumn}>
        <div style={styles.leftColumnOverlay} />
        <img src={logo} alt="5KI Banking Logo" style={styles.logo} />
        <div style={styles.welcomeContainer}>
          <h1 style={styles.welcomeTitle}>Welcome to 5KI Banking</h1>
          <p style={styles.welcomeSubtitle}>
            Streamline your loan management process with our comprehensive banking solutions. 
            Secure, efficient, and designed for financial excellence.
          </p>
        </div>
        
        <div style={styles.bankingFeatures}>
          <div style={styles.featurePill}>🔒 Secure Access</div>
          <div style={styles.featurePill}>📊 Loan Management</div>
          <div style={styles.featurePill}>⚡ Real-time Analytics</div>
        </div>
      </div>

      {/* Right column */}
      <div style={styles.rightColumn}>
        <h1 style={styles.dashboardTitle}>Admin Portal</h1>
        <p style={styles.selectRoleText}>Select your role to continue</p>

        <div style={styles.buttonContainer}>
          <Button
            style={styles.superAdminButton}
            hoverStyle={styles.superAdminButtonHover}
            textStyle={styles.superAdminButtonText}
            textHoverStyle={styles.superAdminButtonTextHover}
            onClick={() => handleOnClick('/superadminlogin')}
            icon="👑"
          >
            Super Admin
          </Button>

          <Button
            style={styles.adminButton}
            hoverStyle={styles.adminButtonHover}
            textStyle={styles.adminButtonText}
            onClick={() => handleOnClick('/adminlogin')}
            icon="⚡"
          >
            Admin
          </Button>

          <Button
            style={styles.coAdminButton}
            hoverStyle={styles.coAdminButtonHover}
            textStyle={styles.coAdminButtonText}
            onClick={() => handleOnClick('/coadminlogin')}
            icon="👥"
          >
            Co-Admin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WebHome;