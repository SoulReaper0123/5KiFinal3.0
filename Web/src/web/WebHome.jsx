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

  const isSmallScreen = windowWidth < 1024; // Adjust the width breakpoint as needed

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#F4F5F7',
      position: 'relative',
    },
    leftColumn: {
      flex: 1,
      backgroundColor: '#2D5783',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    },
    rightColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      backgroundColor: '#FFFFFF',
    },
    logo: {
      width: '300px',
      height: '300px',
      marginBottom: '20px',
      borderRadius: '150px',
      objectFit: 'contain',
    },
    welcomeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '20px',
    },
    welcomeTitle: {
      fontSize: '48px',
      color: '#FFFFFF',
      fontWeight: 'bold',
      marginBottom: '10px',
      textAlign: 'center',
    },
    welcomeSubtitle: {
      fontSize: '18px',
      color: '#FFFFFF',
      textAlign: 'center',
      maxWidth: '400px',
    },
    dashboardTitle: {
      fontSize: '42px',
      fontWeight: 'bold',
      color: '#001F3F',
      marginBottom: '10px',
      textAlign: 'center',
    },
    selectRoleText: {
      fontSize: '20px',
      color: '#001F3F',
      marginBottom: '30px',
    },
    superAdminButton: {
      backgroundColor: '#FFFFFF',
      border: '3px solid #2D5783',
      padding: '18px 40px',
      borderRadius: '50px',
      marginBottom: '20px',
      minWidth: '250px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    superAdminButtonText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#001F3F',
    },
    adminButton: {
      backgroundColor: '#2D5783',
      padding: '20px 40px',
      borderRadius: '50px',
      marginBottom: '20px',
      minWidth: '250px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    adminButtonText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#FFFFFF',
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
      padding: '20px',
    },
    overlayText: {
      color: '#FFFFFF',
      fontSize: '20px',
      textAlign: 'center',
      fontWeight: 'bold',
      maxWidth: '500px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Block UI for small screens */}
      {isSmallScreen && (
        <div style={styles.overlay}>
          <p style={styles.overlayText}>
            Please use a device with a larger screen.
          </p>
        </div>
      )}

      {/* Left column */}
      <div style={styles.leftColumn}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <div style={styles.welcomeContainer}>
          <h1 style={styles.welcomeTitle}>Welcome Back!</h1>
          <p style={styles.welcomeSubtitle}>
            Let's get back to managing with ease and efficiency!
          </p>
        </div>
      </div>

      {/* Right column */}
      <div style={styles.rightColumn}>
        <h1 style={styles.dashboardTitle}>Welcome to 5KI</h1>
        <p style={styles.selectRoleText}>Select your role</p>

        <button
          style={styles.superAdminButton}
          onClick={() => handleOnClick('/superadminlogin')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={styles.superAdminButtonText}>Super Admin</span>
        </button>

        <button
          style={styles.adminButton}
          onClick={() => handleOnClick('/adminlogin')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f456e';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2D5783';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={styles.adminButtonText}>Admin</span>
        </button>

        <button
          style={styles.adminButton}
          onClick={() => handleOnClick('/coadminlogin')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f456e';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2D5783';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={styles.adminButtonText}>Co-Admin</span>
        </button>
      </div>
    </div>
  );
};

export default WebHome;