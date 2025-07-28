import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaFileUpload, 
  FaChevronDown, 
  FaBars, 
  FaTimes,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import Register from './Sidebar/Registrations/Register';
import Admins from './Sidebar/Admins';
import DataMigration from './Sidebar/DataMigration';
import logo from '../../../assets/logo.png'; 

const SuperAdminHome = () => {
  const [activeSection, setActiveSection] = useState('admins');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSection = async () => {
      try {
        const savedSection = localStorage.getItem('superAdminActiveSection');
        if (savedSection) setActiveSection(savedSection);
      } catch (error) {
        console.error('Error loading section from storage:', error);
      }
    };
    loadSection();
  }, []);

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    try {
      localStorage.setItem('superAdminActiveSection', section);
    } catch (error) {
      console.error('Error saving section to storage:', error);
    }
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const renderSection = () => {
    switch (activeSection) {
      case 'dataMigration': return <DataMigration setShowSplash={setShowSplash} />;
      case 'admins': return <Admins setShowSplash={setShowSplash} />;
      default: return <Register />;
    }
  };

  const isActive = (section) => activeSection === section;

  const confirmLogout = () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        localStorage.removeItem('superAdminActiveSection');
      } catch (error) {
        console.error('Error clearing section on logout:', error);
      }
      setLoading(false);
      navigate('/');
    }, 2000);
  };

  const handleLogout = () => setModalVisible(true);
  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      position: 'relative',
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#2D5783',
      padding: '10px',
      borderRight: '2px solid #ddd',
      transition: 'width 0.3s ease',
    },
    sidebarCollapsed: {
      width: '60px',
      alignItems: 'center',
    },
    toggleButton: {
      alignSelf: 'flex-end',
      marginBottom: '10px',
      padding: '5px',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      color: '#fff',
    },
    adminContainer: {
      alignItems: 'center',
      marginBottom: '20px',
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
      padding: '20px 10px',
      background: 'none',
      border: 'none',
      width: '100%',
      cursor: 'pointer',
    },
    activeButton: {
      backgroundColor: '#edf8e9',
      paddingLeft: '20px',
      paddingRight: '10px',
    },
    buttonText: {
      fontSize: '16px',
      color: '#ffffff',
      marginLeft: '15px',
    },
    activeButtonText: {
      color: '#000000',
      fontSize: '16px',
    },
    content: {
      flex: 1,
      overflow: 'auto',
    },
    dropdownContainer: {
      position: 'absolute',
      top: '20px',
      right: '60px',
      zIndex: 1000,
    },
    dropdownButton: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: '5px',
      borderRadius: '50px',
      justifyContent: 'center',
      border: '1px solid #ddd',
      cursor: 'pointer',
    },
    circle: {
      width: '30px',
      height: '30px',
      borderRadius: '15px',
      backgroundColor: 'green',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '18px',
    },
    adminTextContainer: {
      marginLeft: '10px',
      padding: '5px 10px',
    },
    dropdownText: {
      color: 'black',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    dropdownMenu: {
      backgroundColor: '#2D5783',
      padding: '10px 0',
      marginTop: '5px',
      borderRadius: '5px',
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      cursor: 'pointer',
    },
    dropdownItemText: {
      color: '#fff',
      fontSize: '16px',
      marginLeft: '10px',
    },
    modalContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1001,
    },
    modalContent: {
      width: '35%',
      height: '35%',
      padding: '80px',
      backgroundColor: 'white',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
    },
    modalText: {
      fontSize: '20px',
      marginBottom: '50px',
      textAlign: 'center',
    },
    modalButtons: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      backgroundColor: '#001F3F',
      padding: '10px',
      borderRadius: '5px',
      margin: '0 5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
    },
    confirmButton: {
      backgroundColor: '#8E0B16',
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: '16px',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    loadingSpinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#001F3F',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      animation: 'spin 1s linear infinite',
    },
    loadingText: {
      marginTop: '10px',
      fontSize: '16px',
    },
    fullScreenOverlay: {
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
    },
    loadingOverlayText: {
      color: '#fff',
      marginTop: '12px',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={{...styles.sidebar, ...(isCollapsed && styles.sidebarCollapsed)}}>
        <button style={styles.toggleButton} onClick={toggleSidebar}>
          {isCollapsed ? <FaBars size={24} /> : <FaTimes size={24} />}
        </button>

        {!isCollapsed && (
          <>
            <div style={styles.adminContainer}>
              <img src={logo} alt="Admin" style={styles.adminImage} />
            </div>

            <button
              onClick={() => handleSectionChange('admins')}
              style={{...styles.button, ...(isActive('admins') && styles.activeButton)}}
            >
              <FaShieldAlt size={24} color={isActive('admins') ? '#000' : '#fff'} />
              <span style={{...styles.buttonText, ...(isActive('admins') && styles.activeButtonText)}}>Admins</span>
            </button>

            <button
              onClick={() => handleSectionChange('dataMigration')}
              style={{...styles.button, ...(isActive('dataMigration') && styles.activeButton)}}
            >
              <FaFileUpload size={24} color={isActive('dataMigration') ? '#000' : '#fff'} />
              <span style={{...styles.buttonText, ...(isActive('dataMigration') && styles.activeButtonText)}}>
                Data Migration
              </span>
            </button>
          </>
        )}
      </div>

      <div style={styles.content}>
        {renderSection()}
      </div>

      <div style={styles.dropdownContainer}>
        <button onClick={toggleDropdown} style={styles.dropdownButton}>
          <div style={styles.circle}>
            <span style={styles.circleText}>SA</span>
          </div>
          <div style={styles.adminTextContainer}>
            <span style={styles.dropdownText}>Super Admin</span>
          </div>
          <FaChevronDown size={20} color="#000" />
        </button>

        {isDropdownVisible && (
          <div style={styles.dropdownMenu}>
            <div onClick={() => navigate('/settings')} style={styles.dropdownItem}>
              <FaCog size={16} color="#fff" />
              <span style={styles.dropdownItemText}>Settings</span>
            </div>
            <div onClick={handleLogout} style={styles.dropdownItem}>
              <FaSignOutAlt size={16} color="#fff" />
              <span style={styles.dropdownItemText}>Logout</span>
            </div>
          </div>
        )}
      </div>

      {modalVisible && (
        <div style={styles.modalContainer}>
          <div style={styles.modalContent}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <span style={styles.loadingText}>Logging out...</span>
              </div>
            ) : (
              <>
                <span style={styles.modalText}>Are you sure you want to log out?</span>
                <div style={styles.modalButtons}>
                  <button style={styles.modalButton} onClick={() => setModalVisible(false)}>
                    <span style={styles.modalButtonText}>No, Stay</span>
                  </button>
                  <button style={{...styles.modalButton, ...styles.confirmButton}} onClick={confirmLogout}>
                    <span style={styles.modalButtonText}>Yes, Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSplash && (
        <div style={styles.fullScreenOverlay}>
          <div style={styles.loadingSpinner}></div>
          <span style={styles.loadingOverlayText}>Please wait...</span>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SuperAdminHome;