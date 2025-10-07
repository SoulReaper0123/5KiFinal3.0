import React, { useState, useEffect } from 'react';
import SystemSettings from './SystemSettings';
import DataManagement from './DataManagement';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('SystemSettings');

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .hover-lift:hover {
        transform: translateY(-2px);
        boxShadow: 0 10px 25px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const styles = {
    safeAreaView: {
      flex: 1,
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '0'
    },
    mainContainer: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative'
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e2e8f0'
    },
    headerText: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0'
    },
    headerSubtitle: {
      fontSize: '16px',
      color: '#64748b',
      marginTop: '4px'
    },
    controlsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    controlsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      width: '100%'
    },
    tabContainer: {
      display: 'flex',
      backgroundColor: 'transparent',
      borderRadius: '12px',
      padding: '4px',
      gap: '4px',
      flexWrap: 'wrap',
      flex: '1',
      minWidth: '0'
    },
    tabButton: {
      padding: '12px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      outline: 'none',
      background: 'transparent',
      color: '#64748b',
      whiteSpace: 'nowrap'
    },
    activeTabButton: {
      backgroundColor: '#fff',
      color: '#1e40af',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    tabIcon: {
      fontSize: '16px'
    },
    dataContainer: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '80px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px'
    },
    spinner: {
      border: '4px solid #f3f4f6',
      borderLeft: '4px solid #1e40af',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    }
  };

  const tabs = [
    { 
      key: 'SystemSettings', 
      label: 'System Settings', 
      icon: FaChevronRight,
      color: '#1e40af'
    },
    { 
      key: 'DataManagement', 
      label: 'Data Management', 
      icon: FaChevronLeft,
      color: '#059669'
    }
  ];

  const handleTabSwitch = (section) => {
    setActiveSection(section);
  };

  const renderTabContent = () => {
    switch (activeSection) {
      case 'SystemSettings':
        return <SystemSettings />;
      case 'DataManagement':
        return <DataManagement />;
      default:
        return <SystemSettings />;
    }
  };

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Settings</h1>
            <p style={styles.headerSubtitle}>
              Manage system configurations and data management
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Now takes full width */}
            <div style={styles.tabContainer}>
              {tabs.map((tab) => {
                const isActive = activeSection === tab.key;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabSwitch(tab.key)}
                    style={{
                      ...styles.tabButton,
                      ...(isActive ? styles.activeTabButton : {})
                    }}
                    className="hover-lift"
                  >
                    <IconComponent style={styles.tabIcon} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div style={styles.dataContainer}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;