import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const Settings = () => {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = useState(false);
  
  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await SecureStore.getItemAsync('appSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setDarkMode(settings.darkMode || false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings when they change
  const saveSettings = async (settings) => {
    try {
      await SecureStore.setItemAsync('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Could not save settings');
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = (value) => {
    setDarkMode(value);
    saveSettings({ darkMode: value });
    // In a real app, you would apply the theme change here
    Alert.alert(
      'Theme Changed',
      `Dark mode is now ${value ? 'enabled' : 'disabled'}. This feature will be fully implemented in a future update.`
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <View style={styles.settingsContainer}>
          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={24} color={darkMode ? "#4FE7AF" : "#666"} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#ccc", true: "#2D5783" }}
                thumbColor={darkMode ? "#4FE7AF" : "#f4f3f4"}
              />
            </View>
            
            <Text style={styles.settingDescription}>
              Enable dark mode to reduce eye strain in low light conditions.
            </Text>
          </View>
          
          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <TouchableOpacity style={styles.comingSoonButton}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </TouchableOpacity>
            
            <Text style={styles.settingDescription}>
              Notification settings will be available in a future update.
            </Text>
          </View>
          
          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.aboutInfo}>
              <Text style={styles.appName}>5KI Banking App</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appCopyright}>© 2023 5KI Banking. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  section: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D5783',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  settingDescription: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  comingSoonButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  comingSoonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  aboutInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
});

export default Settings;