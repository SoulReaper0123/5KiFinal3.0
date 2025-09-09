import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';

const ContactUs = () => {
  const navigation = useNavigation();
  const [contactUs, setContactUs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const contactUsRef = ref(db, 'Settings/ContactUs');
    
    const unsubscribe = onValue(contactUsRef, (snapshot) => {
      if (snapshot.exists()) {
        setContactUs(snapshot.val());
      } else {
        setContactUs({
          title: 'Contact Us',
          content: 'No contact information available.'
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLinkPress = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2D5783" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={28} color="#2D5783" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{contactUs?.title || 'Contact Us'}</Text>
        <Text style={styles.content}>{contactUs?.content || 'No contact information available.'}</Text>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollView: {
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    whiteSpace: 'pre-line',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2D5783',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContactUs;