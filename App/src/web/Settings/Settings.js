import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import SystemSettings from './SystemSettings'; // Import SystemSettingsContent
import AccountSettings from './AccountSettings'; // Import AccountSettingsContent
import DataManagement from './DataManagement'; // Import DataManagementContent

const Settings = () => {
  const [activeSection, setActiveSection] = useState('tab1'); // Set default active tab to 'tab1'

  // Function to switch between tabs
  const handleTabSwitch = (section) => {
    setActiveSection(section);
  };

  // Render content for each tab
  const renderTabContent = () => {
    switch (activeSection) {
      case 'tab1':
        return <SystemSettings />; // Render System Settings content
      case 'tab2':
        return <AccountSettings />; // Render Account Settings content
      case 'tab3':
        return <DataManagement />; // Render Data Management content
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerText}>Settings</Text>

        {/* Tab Section */}
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {[{ key: 'tab1', label: 'System Settings', color: '#2D5783' }, 
              { key: 'tab2', label: 'Account Settings', color: '#008000' }, 
              { key: 'tab3', label: 'Data Management', color: '#FF0000' }].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  backgroundColor: activeSection === tab.key ? tab.color : 'transparent',
                  borderColor: tab.color,
                }}
                onPress={() => handleTabSwitch(tab.key)}
              >
                <Text
                  style={{
                    ...styles.tabText,
                    color: activeSection === tab.key ? '#fff' : tab.color,
                    fontWeight: '500',
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Render Content Based on Active Tab */}
        <View style={styles.dataContainer}>
          {renderTabContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContainer: {
    flex: 1,
    padding: 10,
    marginTop: 70,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 34,
    marginBottom: 10,
    marginLeft: 25,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginLeft: 25,
  },
  tabs: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  tabText: {
    textAlign: 'center',
  },
  dataContainer: {
    flex: 1,
    width: '100%',
  },
  tabContentText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
  },
};

export default Settings;
