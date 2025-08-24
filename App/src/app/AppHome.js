import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome, Entypo, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, DrawerActions } from '@react-navigation/native';
import { getDatabase, ref, get } from 'firebase/database';
import { auth } from '../firebaseConfig';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import Bot from './HomePage/Bot';
import Inbox from './HomePage/Inbox';
import MarqueeData from './HomePage/MarqueeData';

const Tab = createBottomTabNavigator();

const HomeTab = ({ setMemberId, setEmail, memberId, email }) => {
  const [balance, setBalance] = useState(0);
  const [firstName, setFirstName] = useState('Guest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const [biometricPromptShown, setBiometricPromptShown] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [marqueeMessages, setMarqueeMessages] = useState([]);


  useEffect(() => {
    const textWidth = 600;
    scrollAnim.setValue(screenWidth);
    Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -textWidth,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
  const unsubscribe = MarqueeData(setMarqueeMessages);
  return () => unsubscribe(); // Clean up when component unmounts
}, []);


  const formatBalance = (amount) => {
    const validAmount = Number(amount) || 0;
    return `₱${validAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchUserData = async (userEmail) => {
    const db = getDatabase();
    const dbRef = ref(db, 'Members');
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.values(members).find(
          (member) => member.email === userEmail
        );
        if (foundUser) {
          setFirstName(foundUser.firstName || 'Guest');
          setBalance(foundUser.balance || 0);
          setEmail(foundUser.email || 'No email provided');
          setSelfie(foundUser.selfie || null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        const paramEmail = route.params?.user?.email;
        const routeEmail = route.params?.email;
        let storedEmail = null;
        
        // Try to get email from SecureStore (for biometric login)
        try {
          storedEmail = await SecureStore.getItemAsync('currentUserEmail');
        } catch (error) {
          console.error('Error getting email from SecureStore:', error);
        }
        
        console.log('AppHome - Loading user data with:', { 
          authEmail: user?.email, 
          paramEmail, 
          routeEmail,
          storedEmail,
          email
        });
        
        // First try to use the email passed directly to this component
        if (email) {
          console.log('Using email prop:', email);
          fetchUserData(email);
        }
        // Then try the email from SecureStore (for biometric login)
        else if (storedEmail) {
          console.log('Using email from SecureStore:', storedEmail);
          fetchUserData(storedEmail);
        }
        // Then try the email from Firebase auth
        else if (user?.email) {
          console.log('Using Firebase auth email:', user.email);
          fetchUserData(user.email);
        }
        // Then try the email from route params (user object)
        else if (paramEmail) {
          console.log('Using param email from user object:', paramEmail);
          fetchUserData(paramEmail);
        }
        // Finally try the direct email from route params (used in biometric login)
        else if (routeEmail) {
          console.log('Using direct route email:', routeEmail);
          fetchUserData(routeEmail);
        }
        else {
          console.log('No email found, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in loadUserData:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [route.params, email]);

  // Check if biometric setup should be prompted
  useEffect(() => {
    const checkBiometricSetup = async () => {
      if (biometricPromptShown) return;
      
      // Get parameters from route
      const shouldPromptBiometric = route.params?.shouldPromptBiometric;
      const password = route.params?.password;
      
      // Always check if we should show the prompt, even if no password is provided
      // We'll handle the password input in the BiometricSetupScreen
      if (!shouldPromptBiometric) return;
      
      try {
        // Check if biometrics are already set up for this user
        const credentials = await SecureStore.getItemAsync('biometricCredentials');
        if (credentials) {
          const storedData = JSON.parse(credentials);
          if (storedData.email === email) {
            // Biometrics already set up for this user, skip prompt
            return;
          }
        }
        
        console.log('Showing biometric setup prompt');
        
        // Show biometric setup prompt
        Alert.alert(
          'Enable Fingerprint Login?',
          'Do you want to enable fingerprint authentication for faster login next time?',
          [
            {
              text: 'Not Now',
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: () => navigation.navigate('BiometricSetup', { email, password }),
            },
          ]
        );
        
        setBiometricPromptShown(true);
      } catch (error) {
        console.error('Biometric check error:', error);
      }
    };
    
    // Wait a bit before showing the prompt to ensure the home screen is fully loaded
    const timer = setTimeout(() => {
      checkBiometricSetup();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [route.params, email, navigation, biometricPromptShown]);

  useEffect(() => {
    const backAction = () => {
      navigation.dispatch(DrawerActions.openDrawer());
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      const paramEmail = route.params?.user?.email;
      const routeEmail = route.params?.email;
      let storedEmail = null;
      
      // Try to get email from SecureStore (for biometric login)
      try {
        storedEmail = await SecureStore.getItemAsync('currentUserEmail');
      } catch (error) {
        console.error('Error getting email from SecureStore during refresh:', error);
      }
      
      console.log('AppHome - Refreshing user data with:', { 
        authEmail: user?.email, 
        paramEmail, 
        routeEmail,
        storedEmail,
        email
      });
      
      // Use the same priority order as initial load
      if (email) {
        console.log('Refreshing with email prop:', email);
        fetchUserData(email);
      }
      else if (storedEmail) {
        console.log('Refreshing with email from SecureStore:', storedEmail);
        fetchUserData(storedEmail);
      }
      else if (user?.email) {
        console.log('Refreshing with Firebase auth email:', user.email);
        fetchUserData(user.email);
      }
      else if (paramEmail) {
        console.log('Refreshing with param email from user object:', paramEmail);
        fetchUserData(paramEmail);
      }
      else if (routeEmail) {
        console.log('Refreshing with direct route email:', routeEmail);
        fetchUserData(routeEmail);
      }
      else {
        console.log('No email found during refresh, stopping refresh');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error in onRefresh:', error);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                {selfie ? (
                  <Image source={{ uri: selfie }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                  <MaterialIcons name="person" size={50} color="#2D5783" />
                )}
              </TouchableOpacity>
              <Text style={styles.welcomeText}>Welcome, {firstName}!</Text>
            </View>

            <View style={styles.balanceWrapper}>
              <Text style={styles.balanceLabel}>SAVINGS</Text>
              <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
            </View>

            <View style={styles.marqueeContainer}>
              <Animated.Text style={[styles.reviewText, { transform: [{ translateX: scrollAnim }] }]}>
                {marqueeMessages.length > 0
                  ? marqueeMessages.map((m) => m.message).join('   •   ')
                  : 'No recent application activity.'}
              </Animated.Text>
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <View style={styles.iconGrid}>
              {[
                { pack: Entypo, name: 'download', label: 'Deposit', route: 'Deposit' },
                { pack: Entypo, name: 'upload', label: 'Withdraw', route: 'Withdraw' },
                { pack: MaterialIcons, name: 'edit-document', label: 'Apply Loan', route: 'ApplyLoan' },
                { pack: Ionicons, name: 'cash', label: 'Pay Loan', route: 'PayLoan' },
                { pack: FontAwesome, name: 'book', label: 'Existing Loan', route: 'ExistingLoan' },
                { pack: Ionicons, name: 'swap-horizontal', label: 'Transaction', route: 'Transactions' },
              ].map(({ pack: IconPack, name, label, route }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.iconContainer}
                  onPress={() => {
                    if (label === 'Withdraw') {
                      setWithdrawModalVisible(true);
                    } else {
                      // Pass complete user data
                      navigation.navigate(route, { 
                        user: { 
                          email, 
                          memberId, 
                          firstName,
                          balance 
                        } 
                      });
                    }
                  }}
                >
                  <IconPack name={name} size={40} color="#2D5783" />
                  <Text style={styles.iconText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
      {withdrawModalVisible && (
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Withdrawal Type</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setWithdrawModalVisible(false);
                navigation.navigate('Withdraw', { 
                  user: { 
                    email, 
                    memberId, 
                    firstName,
                    balance 
                  } 
                });
              }}
            >
              <Text style={styles.modalButtonText}>Withdraw Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setWithdrawModalVisible(false);
                navigation.navigate('WithdrawMembership', { 
                  user: { 
                    email, 
                    memberId, 
                    firstName,
                    balance 
                  } 
                });
              }}
            >
              <Text style={styles.modalButtonText}>Withdraw Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWithdrawModalVisible(false)}
            >
              <Text style={{ color: 'gray', marginTop: 10, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default function AppHome() {
  const [memberId, setMemberId] = useState(null);
  const [email, setEmail] = useState(null);
  const route = useRoute();
  
  // Initialize email from route params if available
  useEffect(() => {
    const routeEmail = route.params?.email;
    if (routeEmail && !email) {
      console.log('AppHome - Setting email from route params:', routeEmail);
      setEmail(routeEmail);
    }
  }, [route.params, email]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'BotTab') iconName = 'smart-toy';
          else if (route.name === 'InboxTab') iconName = 'email';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#2D5783',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{ tabBarLabel: 'Home' }}
        children={() => (
          <HomeTab
            setMemberId={setMemberId}
            setEmail={setEmail}
            memberId={memberId}
            email={email}
          />
        )}
      />
      <Tab.Screen name="BotTab" component={Bot} options={{ tabBarLabel: 'Bot' }} />
      <Tab.Screen
        name="InboxTab"
        options={{ tabBarLabel: 'Inbox' }}
      >
        {() => <Inbox memberId={memberId} email={email} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  topContainer: {
    backgroundColor: '#2D5783',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 55,
    paddingLeft: 50,
    paddingRight: 50,
    marginRight: -20,
    marginLeft: -20,
    marginTop: -20,
  },
  bottomContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
  },
  balanceWrapper: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
  },
  balanceLabel: {
    fontSize: 18,
    color: 'green',
  },
  balanceAmount: {
    fontSize: 36,
    color: 'black',
  },
  marqueeContainer: {
    height: 20,
    marginTop: 5,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    width: 600,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    padding: 13,
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOpacity: 2,
    shadowRadius: 5,
    elevation: 5,
    width: '45%',
    marginBottom: 15,
  },
  iconText: {
    marginTop: 5,
    textAlign: 'center',
    color: 'black',
    fontSize: 14,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2D5783',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});