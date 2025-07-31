import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaUserCircle, 
  FaSignOutAlt,
  FaFileUpload,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { 
  GoSidebarCollapse,
  GoSidebarExpand
} from 'react-icons/go';
import { RiAdminLine } from 'react-icons/ri';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import Register from './Sidebar/Registrations/Register';
import Admins from './Sidebar/Admins';
import DataMigration from './Sidebar/DataMigration';
import logo from '../../../assets/logo.png';
import { useAuth } from '../web/WebAuth/AuthContext';

const SuperAdminHome = () => {
  const [activeSection, setActiveSection] = useState('admins');
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isSmallScreen = windowWidth < 1024;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSection = async () => {
      const savedSection = localStorage.getItem('superAdminActiveSection');
      if (savedSection) {
        setActiveSection(savedSection);
      }
    };
    loadSection();
  }, []);

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    await localStorage.setItem('superAdminActiveSection', section);
    setIsDropdownVisible(false);
  };

  const toggleSidebar = () => {
    setSidebarWidth(isCollapsed ? 280 : 60);
    setIsCollapsed(!isCollapsed);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dataMigration': return <DataMigration setShowSplash={setShowSplash} />;
      case 'admins': return <Admins setShowSplash={setShowSplash} />;
      default: return <Register />;
    }
  };

  const isActive = (section) => activeSection === section;

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem('superAdminActiveSection');
      logout();
      navigate('/');
    }, 1500);
  };

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  const handleAdminIconPress = () => {
    navigate('/settings');
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'relative',
    },
    sidebar: {
      width: `${sidebarWidth}px`,
      backgroundColor: isCollapsed ? '#F5F5F5' : '#2D5783',
      padding: '20px 0',
      transition: 'width 0.3s ease, background-color 0.3s ease',
      overflow: 'hidden',
      position: 'relative',
      height: '100%',
    },
    scrollContainer: {
      paddingBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      overflowY: 'auto',
    },
    toggleButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: isCollapsed ? '#000000' : '#FFFFFF',
      fontSize: '32px',
      padding: '0',
      margin: '0',
      outline: 'none',
    },
    adminContainer: {
      alignItems: 'center',
      marginBottom: '20px',
      marginTop: '40px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },
    adminImage: {
      width: '80px',
      height: '80px',
      borderRadius: '40px',
      marginBottom: '10px',
    },
    button: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      height: '48px',
      paddingLeft: '30px',
      paddingRight: '10px',
      marginBottom: '5px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      backgroundColor: 'transparent',
    },
    activeButton: {
      backgroundColor: '#F5F5F5',
      borderRadius: '0',
      border: 'none',
      outline: 'none',
    },
    iconContainer: {
      width: '40px',
      height: '40px',
      marginRight: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'default',
    },
    icon: {
      fontSize: '28px',
      color: '#fff',
      display: 'inline-block',
      fontStyle: 'normal',
    },
    activeIcon: {
      fontSize: '28px',
      color: '#000',
      display: 'inline-block',
      fontStyle: 'normal',
    },
    buttonText: {
      fontSize: '16px',
      color: '#ffffff',
      marginRight: '20px',
      fontWeight: 'normal',
      cursor: 'pointer',
    },
    activeButtonText: {
      color: '#000000',
      fontWeight: 'normal',
      marginLeft: '5px',
      fontSize: '18px',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      height: '100vh',
    },
    dropdownWrapper: {
      position: 'absolute',
      top: '40px',
      right: '50px',
      zIndex: 1000,
    },
    dropdownContainer: {
      backgroundColor: 'white',
      borderRadius: '25px',
      border: '1px solid #ddd',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      width: '100%', 
    },
    dropdownButton: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '6px 10px',
      cursor: 'pointer',
    },
    profileIconContainer: {
      backgroundColor: '#f0f0f0',
      borderRadius: '20px', 
      width: '35px',
      height: '35px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
    },
    dropdownTextContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '5px',
      cursor: 'pointer',
    },
    dropdownText: {
      color: 'black',
      fontSize: '16px',
      marginRight: '8px',
      fontWeight: 'normal',
    },
    dropdownMenu: {
      backgroundColor: 'white',
      borderTop: '1px solid #eee',
    },
    dropdownItem: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer',
    },
    dropdownItemText: {
      color: '#333',
      fontSize: '14px',
      fontWeight: 'normal',
    },
    fullOverlay: {
      position: 'fixed',
      zIndex: 9999,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    centeredModal: {
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
    },
    spinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#2D5783',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      animation: 'spin 1s linear infinite'
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
    splashOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      flexDirection: 'column',
    },
    splashText: {
      color: '#fff',
      marginTop: '20px',
      fontSize: '16px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <button 
          style={styles.toggleButton} 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand /> }
        </button>

        {!isCollapsed && (
          <div style={styles.scrollContainer}>
            <div style={styles.adminContainer}>
              <img src={logo} alt="Admin" style={styles.adminImage} />
            </div>

            <button
              onClick={() => handleSectionChange('admins')}
              style={isActive('admins') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <RiAdminLine 
                  style={isActive('admins') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('admins') ? styles.activeButtonText : styles.buttonText}>
                Admins
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('dataMigration')}
              style={isActive('dataMigration') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <FaFileUpload 
                  style={isActive('dataMigration') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('dataMigration') ? styles.activeButtonText : styles.buttonText}>
                Data Migration
              </span>
            </button>
          </div>
        )}
      </div>

      <div style={styles.content}>
        {renderSection()}
      </div>

      <div style={styles.dropdownWrapper}>
        <div style={styles.dropdownContainer}>
          <div style={styles.dropdownButton}>
            <div onClick={handleAdminIconPress} style={styles.profileIconContainer}>
              <FaUserCircle size={36} color="#000" />
            </div>
            <div onClick={toggleDropdown} style={styles.dropdownTextContainer}>
              <span style={styles.dropdownText}>SuperAdmin</span>
              {isDropdownVisible ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
            </div>
          </div>

          {isDropdownVisible && (
            <div style={styles.dropdownMenu}>
              <div 
                onClick={() => {
                  setLogoutModalVisible(true);
                  setIsDropdownVisible(false);
                }} 
                style={styles.dropdownItem}
              >
                <FaSignOutAlt size={22} style={{ marginRight: '10px' }} />
                <span style={styles.dropdownItemText}>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSmallScreen && (
        <div style={styles.fullOverlay}>
          <span style={styles.overlayText}>Please use a device with a larger screen.</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={handleLogout}
              >
                Yes
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
                }} 
                onClick={() => setLogoutModalVisible(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {/* Loading Spinner */}
      {showSplash && (
        <div style={styles.splashOverlay}>
          <div style={styles.spinner}></div>
          <span style={styles.splashText}>Please wait...</span>
        </div>
      )}
    </div>
  );
};

export default SuperAdminHome;