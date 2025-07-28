import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-native';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons'; 
import Register from './Sidebar/Registrations/Register';
import Admins from './Sidebar/Admins';
import Members from './Sidebar/Members';
import { Image } from 'react-native';

const SuperAdminHome = () => {
  const [activeSection, setActiveSection] = useState('registrations');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Dropdown visibility state
  const navigate = useNavigate();

  useEffect(() => {
    const loadSection = async () => {
      const savedSection = await AsyncStorage.getItem('activeSection');
      if (savedSection) setActiveSection(savedSection);
    };
    loadSection();
  }, []);

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    await AsyncStorage.setItem('activeSection', section);
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const renderSection = () => {
    switch (activeSection) {
      case 'registrations': return <Register />;
      case 'members': return <Members />;
      case 'admins': return <Admins />;
      default: return <Register />;
    }
  };

  const isActive = (section) => activeSection === section;

  const confirmLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      AsyncStorage.removeItem('activeSection');
      navigate('/');
    }, 2000);
  };

  const handleLogout = () => setModalVisible(true);
  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
            <MaterialIcons name={isCollapsed ? "menu" : "close"} size={24} color="#fff" />
          </TouchableOpacity>

          {!isCollapsed && (
            <>
              <View style={styles.adminContainer}>
                <Image source={require('../../assets/logo.png')} style={styles.adminImage} />
              </View>
              
              <TouchableOpacity
                onPress={() => handleSectionChange('admins')}
                style={[styles.button, isActive('admins') && styles.activeButton]}
              >
                <FontAwesome name="shield" size={24} color={isActive('admins') ? '#000' : '#fff'} />
                <Text style={[styles.buttonText, isActive('admins') && styles.activeButtonText]}>Admins</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleSectionChange('members')}
                style={[styles.button, isActive('members') && styles.activeButton]}
              >
                <FontAwesome name="users" size={24} color={isActive('members') ? '#000' : '#fff'} />
                <Text style={[styles.buttonText, isActive('members') && styles.activeButtonText]}>Members</Text>
              </TouchableOpacity>
            </>
          )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderSection()}
      </View>

      {/* Dropdown Button (top-right) */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton}>
          {/* Green circle with letter A */}
          <View style={styles.circle}>
            <Text style={styles.circleText}>SA</Text>
          </View>
          
          {/* White background with Admin text */}
          <View style={styles.adminTextContainer}>
            <Text style={styles.dropdownText}>Super Admin</Text>
          </View>

          {/* Down arrow */}
          <AntDesign name="down" size={20} color="#000" />
        </TouchableOpacity>

        {isDropdownVisible && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity onPress={() => navigate('/settings')} style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.dropdownItem}>
              <Text style={styles.dropdownItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large"/>
                <Text style={styles.loadingText}>Logging out...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalText}>Are you sure you want to log out?</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalButtonText}>No, Stay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmLogout}>
                    <Text style={styles.modalButtonText}>Yes, Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    flex: 1,
    position: 'relative',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#2D5783',
    padding: 10,
    borderRightWidth: 2,
    borderRightColor: '#ddd',
  },
  sidebarCollapsed: {
    width: 60, // Shrink sidebar width
    alignItems: 'center',
  },
  toggleButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 5,
  },
  greetingContainer: {
    paddingVertical: 25,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingLeft: 10,
  },
  activeButton: {
    backgroundColor: '#edf8e9',
    paddingLeft: 20,
    paddingRight: 10,
    width: '100%',
  },
  adminContainer: {
    alignItems: 'center',  // Centers content horizontally
    marginBottom: 20,     // Adds spacing below
  },
  adminImage: {
    width: 80,   // Adjust size as needed
    height: 80,  // Adjust size as needed
    borderRadius: 40, // Optional: Make it circular if needed
    marginBottom: 10, // Space between image and text
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
  },
  activeButtonText: {
    color: '#000000',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 20,
    right: 60,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white', // White background for the button
    padding: 5,
    borderRadius: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  adminTextContainer: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    
  },
  dropdownText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    backgroundColor: '#2D5783',
    paddingVertical: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '35%',
    height: '35%',
    padding: 80,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 50,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#001F3F',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#8E0B16',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
};

export default SuperAdminHome;
