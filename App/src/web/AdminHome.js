import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-native';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons'; 
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'; 
import Register from './Sidebar/Registrations/Register';
import Loans from './Sidebar/Loans/Loans'; 
import PayLoans from './Sidebar/Payments/PayLoans';
import Withdraws from './Sidebar/Withdraws/Withdraws';
import Transactions from './Sidebar/Transactions';
import CoAdmins from './Sidebar/CoAdmins';
import Members from './Sidebar/Members';
import Deposits from './Sidebar/Deposits/Deposits';
import Dashboard from './Sidebar/Dashboard/Dashboard';
import Settings from './Settings/Settings';
import { Image } from 'react-native';

const AdminHome = () => {
  const [activeSection, setActiveSection] = useState('registrations');
  const [loading, setLoading] = useState(false); // For logout loading state
  const [modalVisible, setModalVisible] = useState(false); // For showing modal
  const navigate = useNavigate(); 
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Dropdown visibility state
  const [funds, setFunds] = useState(null); // 🟡 New state for funds

  // Load active section from AsyncStorage on mount
  useEffect(() => {
    const loadSection = async () => {
      const savedSection = await AsyncStorage.getItem('activeSection');
      if (savedSection) {
        setActiveSection(savedSection);
      }
    };
    loadSection();
  }, []);

  // Function to update section and save it
  const handleSectionChange = async (section) => {
    setActiveSection(section);
    await AsyncStorage.setItem('activeSection', section);
    
    // If the selected section is 'settings', hide the dropdown
    if (section === 'settings') {
      setIsDropdownVisible(false);
    }
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'registrations':
        return <Register />;
      case 'members':
        return <Members />;
      case 'deposits':
        return <Deposits />;
      case 'applyLoans':
        return <Loans />;
      case 'payLoans':
        return <PayLoans />;
      case 'withdraws':
        return <Withdraws />;
      case 'transactions':
        return <Transactions />;
      case 'coadmins':
        return <CoAdmins />;
        case 'settings':
          return <Settings />;
      default:
        return <Register />;
    }
  };

  const isActive = (section) => activeSection === section;

  const confirmLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      AsyncStorage.removeItem('activeSection'); // Clear stored section on logout
      navigate('/'); // Simulate the logout
    }, 2000); // Add a 2-second delay for loading simulation
  };

  const handleLogout = () => setModalVisible(true);
  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
            <MaterialIcons name={isCollapsed ? "menu" : "menu"} size={24} color="#fff" />
          </TouchableOpacity>

          {!isCollapsed && (
            <>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.adminContainer}>
                <Image source={require('../../assets/logo.png')} style={styles.adminImage} />
              </View>

          <TouchableOpacity
            onPress={() => handleSectionChange('dashboard')}
            style={[styles.button, isActive('dashboard') && styles.activeButton]}
          >
            <MaterialCommunityIcons name="tablet-dashboard" size={24} color={isActive('dashboard') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('dashboard') && styles.activeButtonText]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSectionChange('registrations')}
            style={[styles.button, isActive('registrations') && styles.activeButton]}
          >
            <AntDesign name="form" size={24} color={isActive('registrations') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('registrations') && styles.activeButtonText]}>Registrations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSectionChange('members')}
            style={[styles.button, isActive('members') && styles.activeButton]}
          >
            <FontAwesome name="users" size={24} color={isActive('members') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('members') && styles.activeButtonText]}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('deposits')}
            style={[styles.button, isActive('deposits') && styles.activeButton]}
          >
            <MaterialIcons name="add-card" size={24} color={isActive('deposits') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('deposits') && styles.activeButtonText]}>Deposits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('applyLoans')}
            style={[styles.button, isActive('applyLoans') && styles.activeButton]}
          >
            <AntDesign name="creditcard" size={24} color={isActive('applyLoans') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('applyLoans') && styles.activeButtonText]}>Loans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('payLoans')}
            style={[styles.button, isActive('payLoans') && styles.activeButton]}
          >
            <FontAwesome name="money" size={24} color={isActive('payLoans') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('payLoans') && styles.activeButtonText]}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('withdraws')}
            style={[styles.button, isActive('withdraws') && styles.activeButton]}
          >
            <FontAwesome name="arrow-circle-down" size={24} color={isActive('withdraws') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('withdraws') && styles.activeButtonText]}>Withdraws</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('transactions')}
            style={[styles.button, isActive('transactions') && styles.activeButton]}
          >
            <FontAwesome name="history" size={24} color={isActive('transactions') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('transactions') && styles.activeButtonText]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSectionChange('coadmins')}
            style={[styles.button, isActive('coadmins') && styles.activeButton]}
          >
            <FontAwesome name="shield" size={24} color={isActive('coadmins') ? '#000' : '#fff'} />
            <Text style={[styles.buttonText, isActive('coadmins') && styles.activeButtonText]}>Co-Admins</Text>
          </TouchableOpacity>
          </ScrollView>
          </>
          )}
      </View>

      <View style={styles.content}>
        {renderSection()}
      </View>

            {/* Dropdown Button (top-right) */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton}>
                {/* Green circle with letter A */}
                <View style={styles.circle}>
                  <Text style={styles.circleText}>A</Text>
                </View>
                
                {/* White background with Admin text */}
                <View style={styles.adminTextContainer}>
                  <Text style={styles.dropdownText}>Admin</Text>
                </View>
      
                {/* Down arrow */}
                <AntDesign name="down" size={20} color="#000" />
              </TouchableOpacity>
      
              {isDropdownVisible && (
                <View style={styles.dropdownMenu}>
                <TouchableOpacity onPress={() => handleSectionChange('settings')} style={styles.dropdownItem}>
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
        transparent={true}
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
  },
  scrollContainer: {
    paddingBottom: 20, // ensures you can scroll to the last item
  },
  sidebar: {
    width: 260,
    backgroundColor: '#2D5783',
    borderRightWidth: 2,
    borderRightColor: '#ddd',
    paddingVertical: 50,
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
  sidebarCollapsed: {
    width: 50, // Shrink sidebar width
    alignItems: 'center',
  },
  toggleButton: {
    position: 'absolute', // Absolute positioning to place it at the top-right
    top: 10, // Adjust the top spacing
    right: 10, // Adjust the right spacing
    zIndex: 1000, // Ensure the button is on top
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
  dropdownContainer: {
    position: 'absolute',
    top: 30,
    right: 40,
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
  button: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15,
    paddingLeft: 30, // Add left padding for spacing in non-active buttons
  },
  activeButton: {
    backgroundColor: '#EEEEEE',
    paddingLeft: 30, // Increase left padding for active button
    width: '100%', // Make active button wider to stand out
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
    marginLeft: 20, 
  },
  activeButtonText: {
    color: '#000000',
    fontSize: 16, 
  },
  logoutContainer: {
    flex: 1, // Allows the container to take full height and width
    justifyContent: 'center', // Centers vertically
    alignItems: 'center', // Centers horizontally
},
  logoutButton: {
    paddingVertical: 10, // Reduced padding for a smaller button
    borderTopColor: '#ddd',
    backgroundColor: '#8E0B16',
    marginTop: 20,
    justifyContent: 'center',
    borderRadius: 10, // Reduced border radius for a more compact look
    height: 50, // Fixed height for consistency
    width: 150, // Adjust the width as needed
},
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    margin: 0, 
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '35%',
    height: '35%', // Change the width as needed
    padding: 80, // Adjust padding to give more space inside the modal
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 20,
    marginBottom: 50,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#8E0B16', // Change the background for the confirm button
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
};

export default AdminHome;