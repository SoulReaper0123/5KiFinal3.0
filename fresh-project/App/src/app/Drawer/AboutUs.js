import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';

const AboutUs = () => {
  const navigation = useNavigation();
  const [aboutUs, setAboutUs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const aboutUsRef = ref(db, 'Settings/AboutUs');
    
    const unsubscribe = onValue(aboutUsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAboutUs(snapshot.val());
      } else {
        setAboutUs({
          title: 'About Us',
          content: 'No information available.'
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
          onPress={() => {
            const parent = navigation.getParent();
            if (parent && parent.openDrawer) {
              parent.openDrawer();
            } else {
              navigation.replace('AppHome', { openDrawer: true });
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={28} color="#2D5783" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{aboutUs?.title || 'About Us'}</Text>
        <Text style={styles.content}>{aboutUs?.content || 'No information available.'}</Text>
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
  },
});

export default AboutUs;