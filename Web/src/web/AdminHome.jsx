import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaUserCircle, 
  FaSignOutAlt
} from 'react-icons/fa';
import { 
  GoSidebarCollapse,
  GoSidebarExpand
} from 'react-icons/go';
import Register from './Sidebar/Registrations/Register';
import Loans from './Sidebar/Loans/Loans';
import PayLoans from './Sidebar/Payments/PayLoans';
import Withdraws from './Sidebar/Withdraws/Withdraws';
import Transactions from './Sidebar/Transactions';
import CoAdmins from './Sidebar/CoAdmins';
import Deposits from './Sidebar/Deposits/Deposits';
import Dashboard from './Sidebar/Dashboard/Dashboard';
import Settings from './Settings/Settings';
import AccountSettings from './Settings/AccountSettings';
import { useAuth } from '../web/WebAuth/AuthContext';
import logo from '../../../assets/logo.png';
import { 
  Analytics02Icon,
  Settings02Icon,
  ManagerIcon,
  ReverseWithdrawal01Icon,
  Payment01Icon,
  Payment02Icon,
  MoneyAdd02Icon,
  UserGroupIcon
} from "hugeicons-react";
import { GrTransaction } from "react-icons/gr";

const AdminHome = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isSmallScreen = windowWidth < 1024;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSection = async () => {
      const savedSection = localStorage.getItem('activeSection');
      if (savedSection) {
        setActiveSection(savedSection);
      }
    };
    loadSection();
  }, []);

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    await localStorage.setItem('activeSection', section);
    setIsDropdownVisible(false);
  };

  const toggleSidebar = () => {
    setSidebarWidth(isCollapsed ? 280 : 60);
    setIsCollapsed(!isCollapsed);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'registrations': return <Register />;
      case 'members': return <Members />;
      case 'deposits': return <Deposits />;
      case 'applyLoans': return <Loans />;
      case 'payLoans': return <PayLoans />;
      case 'withdraws': return <Withdraws />;
      case 'transactions': return <Transactions />;
      case 'coadmins': return <CoAdmins />;
      case 'settings': return <Settings />;
      case 'accountSettings': return <AccountSettings />;
      default: return <Dashboard />;
    }
  };

  const isActive = (section) => activeSection === section;

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem('activeSection');
      logout();
      navigate('/');
    }, 1500);
  };

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  const handleAdminIconPress = () => {
    handleSectionChange('accountSettings');
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
    // Updated modal styles to match login page
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
    modalCard: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '300px',
      height: '150px'
    },
    spinner: {
      border: '4px solid rgba(0, 31, 63, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #001F3F',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    },
    modalText: {
      marginTop: '15px',
      fontSize: '16px',
      textAlign: 'center',
      color: '#001F3F'
    },
    confirmationText: {
      fontSize: '18px',
      marginBottom: '25px',
      textAlign: 'center',
      color: '#001F3F',
    },
    modalButtons: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: '20px',
    },
    modalButton: {
      padding: '10px 20px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '100px',
      cursor: 'pointer',
      border: 'none',
    },
    cancelButton: {
      backgroundColor: '#CCCCCC',
      marginRight: '10px',
    },
    confirmButton: {
      backgroundColor: '#001F3F',
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: '16px',
      fontWeight: '600',
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
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
              onClick={() => handleSectionChange('dashboard')}
              style={isActive('dashboard') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Analytics02Icon 
                  style={isActive('dashboard') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('dashboard') ? styles.activeButtonText : styles.buttonText}>
                Dashboard
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('registrations')}
              style={isActive('registrations') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <UserGroupIcon 
                  style={isActive('registrations') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('registrations') ? styles.activeButtonText : styles.buttonText}>
                Membership
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('deposits')}
              style={isActive('deposits') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Payment02Icon 
                  style={isActive('deposits') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('deposits') ? styles.activeButtonText : styles.buttonText}>
                Deposits
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('applyLoans')}
              style={isActive('applyLoans') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <MoneyAdd02Icon 
                  style={isActive('applyLoans') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('applyLoans') ? styles.activeButtonText : styles.buttonText}>
                Loans
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('payLoans')}
              style={isActive('payLoans') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Payment01Icon 
                  style={isActive('payLoans') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('payLoans') ? styles.activeButtonText : styles.buttonText}>
                Payments
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('withdraws')}
              style={isActive('withdraws') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <ReverseWithdrawal01Icon 
                  style={isActive('withdraws') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('withdraws') ? styles.activeButtonText : styles.buttonText}>
                Withdraws
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('transactions')}
              style={isActive('transactions') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <GrTransaction 
                  style={isActive('transactions') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('transactions') ? styles.activeButtonText : styles.buttonText}>
                Transactions
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('coadmins')}
              style={isActive('coadmins') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <ManagerIcon 
                  style={isActive('coadmins') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('coadmins') ? styles.activeButtonText : styles.buttonText}>
                Co-Admins
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('settings')}
              style={isActive('settings') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Settings02Icon 
                  style={isActive('settings') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('settings') ? styles.activeButtonText : styles.buttonText}>
                Settings
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
              <span style={styles.dropdownText}>Admin</span>
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

      {logoutModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                <p style={styles.modalText}>Logging Out...</p>
              </>
            ) : (
              <>
                <p style={styles.confirmationText}>Are you sure you want to log out?</p>
                <div style={styles.modalButtons}>
                  <button
                    style={{...styles.modalButton, ...styles.cancelButton}}
                    onClick={() => setLogoutModalVisible(false)}
                  >
                    <span style={styles.modalButtonText}>Cancel</span>
                  </button>
                  <button
                    style={{...styles.modalButton, ...styles.confirmButton}}
                    onClick={handleLogout}
                  >
                    <span style={styles.modalButtonText}>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;