import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';

const Terms = () => {
  const navigation = useNavigation();
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const termsRef = ref(db, 'Settings/TermsAndConditions');
    
    const unsubscribe = onValue(termsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTerms(snapshot.val());
      } else {
        setTerms({
          title: 'Terms and Conditions',
          content: 'No terms and conditions available.'
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

            // When the Terms screen lives inside the Drawer navigator, open it again
            if (parent && parent.openDrawer) {
              parent.openDrawer();
              return;
            }

            // Otherwise, navigate to AppHome and open the drawer
            navigation.replace('AppHome', { openDrawer: true });
          }}
        >
          <MaterialIcons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{terms?.title || 'Terms and Conditions'}</Text>
        <Text style={styles.content}>{terms?.content || 'No terms available.'}</Text>
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

export default Terms;