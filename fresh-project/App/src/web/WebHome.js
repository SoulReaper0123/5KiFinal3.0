import React from 'react';
import { useNavigate } from 'react-router-dom';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// Import the logo image
import logo from '../../assets/logo.png'; // Update the path if necessary

const WebHome = () => {
  const navigate = useNavigate();

  const handleOnClick = (page) => {
    navigate(page);
  };

  return (
    <View style={styles.container}>
      {/* Left column */}
      <View style={styles.leftColumn}>
        {/* Logo Image */}
        <Image source={logo} style={styles.logo} />
        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's get back to managing with ease!
        </Text>
      </View>

      {/* Right column */}
      <View style={styles.rightColumn}>
        <Text style={styles.dashboardTitle}>Welcome to 5KI </Text>
        <Text style={styles.selectRoleText}>Select your role</Text>

        <TouchableOpacity
          style={styles.superAdminButton} // Separate Super Admin button style
          onPress={() => handleOnClick('/superadminlogin')}
        >
          <Text style={styles.superAdminButtonText}>Super Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminButton} // Separate Admin button style
          onPress={() => handleOnClick('/adminlogin')}
        >
          <Text style={styles.adminButtonText}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adminButton} // Separate Admin button style
          onPress={() => handleOnClick('/adminlogin')}
        >
          <Text style={styles.adminButtonText}>Co-Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Two-column layout
    backgroundColor: '#F4F5F7', // Light background for the container
  },
  leftColumn: {
    flex: 1.0, // Left side takes less space
    backgroundColor: '#2D5783', // Dark blue background
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    padding: 20,
  },
  logo: {
    width: 400, // Adjust the width as needed
    height: 400, // Adjust the height as needed
    marginBottom: 0, // No space below the logo
    marginTop: -100, // Adjust this value to move the logo higher
    borderRadius: 500,
  },
  rightColumn: {
    flex: 1, // Right side takes more space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF', // White background for the right column
  },
  welcomeTitle: {
    fontSize: 60,
    color: '#FFFFFF', // White text
    fontWeight: 'bold',
    marginTop: -10, // No space above the welcome title
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#FFFFFF', // Lighter shade of white
    textAlign: 'center', // Centered text
  },
  dashboardTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#001F3F', // Darker color for the title
    marginBottom: 10,
  },
  selectRoleText: {
    fontSize: 20,
    color: '#001F3F',
    marginBottom: 30,
  },
  superAdminButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2D5783', 
    borderWidth: 3,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  superAdminButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001F3F', // Dark text for Super Admin
  },
  adminButton: {
    backgroundColor: '#2D5783',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  adminButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text for Admin button
  },
});

export default WebHome;