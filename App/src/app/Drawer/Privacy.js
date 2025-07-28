import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Privacy = () => {
  const navigation = useNavigation(); // Use the navigation hook

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Go back to the previous screen
          accessibilityLabel="Back" // Accessibility label
        >
          <MaterialIcons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.paragraph}>
          5KI Financial Services is committed to protecting your personal information. This Privacy Policy explains how we collect,
          use, and share your information when you use our loan system services.
        </Text>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We may collect personal information like your name, email address, phone number, and financial details.
        </Text>
        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to assess your loan application, communicate with you, and improve our services.
        </Text>
        <Text style={styles.heading}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We do not share your personal information with third parties unless required by law or necessary for the provision 
          of services, such as credit checks.
        </Text>
        <Text style={styles.heading}>4. Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your personal data, but we cannot guarantee absolute 
          security against all threats.
        </Text>
        <Text style={styles.heading}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your data only as long as necessary to fulfill the purposes outlined in this policy or as required by law.
        </Text>
        <Text style={styles.heading}>6. Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. You will be notified of any significant changes via our platform.
        </Text>
        <Text style={styles.heading}>7. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about our Privacy Policy or the way we handle your data, please contact us at 5kifinancials@gmail.com.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 10,
    marginTop: 20,
  },
  scrollView: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  paragraph: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default Privacy;
