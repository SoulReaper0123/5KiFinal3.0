import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Splashscreen = () => {
  const navigation = useNavigation(); // Get navigation object from hook

  useEffect(() => {
    // Simulate loading for 3 seconds and then navigate to Login page
    const timer = setTimeout(() => {
      navigation.navigate('Login'); // Navigate to Login screen
    }, 3000);

    return () => clearTimeout(timer); // Cleanup the timer when component unmounts
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Add the Image component here */}
      <Image
        source={require('../../assets/logo.png')} // Replace with your image path
        style={styles.logo} // Apply styles to the image
        resizeMode="contain" // Optionally resize the image
      />
      <ActivityIndicator size="large" color="white" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D5783',
  },
  logo: {
    width: 180, // Adjust the width of the logo
    height: 180,
    borderRadius:100, // Adjust the height of the logo
    marginBottom: 20, // Add space between the image and text
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default Splashscreen;