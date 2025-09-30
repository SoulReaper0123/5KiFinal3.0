import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';

const Privacy = () => {
  const navigation = useNavigation();
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const privacyRef = ref(db, 'Settings/PrivacyPolicy');
    
    const unsubscribe = onValue(privacyRef, (snapshot) => {
      if (snapshot.exists()) {
        setPrivacy(snapshot.val());
      } else {
        setPrivacy({
          title: 'Privacy Policy',
          content: 'No privacy policy available.'
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
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
          <MaterialIcons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{privacy?.title || 'Privacy Policy'}</Text>
        <Text style={styles.content}>{privacy?.content || 'No privacy policy available.'}</Text>
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
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    whiteSpace: 'pre-line',
  },
});

export default Privacy;