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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [amountHidden, setAmountHidden] = useState(false);
  const [investment, setInvestment] = useState(0);
  const [investmentHidden, setInvestmentHidden] = useState(false);

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
          setInvestment(foundUser.investment || foundUser.investments || 0);
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
      const parent = navigation.getParent?.();
      if (parent?.openDrawer) {
        parent.openDrawer();
      }
      return true; // prevent default back action
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

  // Fallback drawer state and handlers when Drawer navigator isn't available
  const [fallbackDrawerVisible, setFallbackDrawerVisible] = useState(false);

  const handleOpenMenu = () => {
    const parent = navigation.getParent?.();
    if (parent?.openDrawer) {
      parent.openDrawer();
    } else {
      setFallbackDrawerVisible(true);
    }
  };

  const handleLogoutFallback = async () => {
    try {
      await SecureStore.deleteItemAsync('currentUserEmail').catch(() => {});
      await SecureStore.deleteItemAsync('biometricEnabled').catch(() => {});
      await auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert('Logout Error', 'There was an error during logout. Please try again.');
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
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handleOpenMenu}
            >
              {selfie ? (
                <Image source={{ uri: selfie }} style={{ width: 46, height: 46, borderRadius: 23 }} />
              ) : (
                <MaterialIcons name="person" size={46} color="#1E3A5F" />
              )}
            </TouchableOpacity>

            <View style={styles.greetGroup}>
              <Text style={styles.greetSubtitle}>Welcome back,</Text>
              <Text style={styles.greetTitle}>{firstName}</Text>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation.navigate('InboxTab')}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Investment Card (same UI as Savings) */}
          <View style={styles.walletCard}>
            <Text style={styles.walletLabel}>INVESTMENT</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.walletAmount}>{investmentHidden ? '******' : formatBalance(investment)}</Text>
              <TouchableOpacity onPress={() => setInvestmentHidden((v) => !v)} style={styles.eyeBtn}>
                <MaterialIcons name={investmentHidden ? 'visibility' : 'visibility-off'} size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.walletActionsRow}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() =>
                  navigation.navigate('Deposit', {
                    user: { email, memberId, firstName, balance },
                  })
                }
              >
                <Entypo name="download" size={18} color="#1E3A5F" />
                <Text style={styles.secondaryActionText}>Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <Text style={styles.walletLabel}>SAVINGS</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.walletAmount}>{amountHidden ? '******' : formatBalance(balance)}</Text>
              <TouchableOpacity onPress={() => setAmountHidden((v) => !v)} style={styles.eyeBtn}>
                <MaterialIcons name={amountHidden ? 'visibility' : 'visibility-off'} size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletActionsRow}>

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => setWithdrawModalVisible(true)}
              >
                <Entypo name="upload" size={18} color="#1E3A5F" />
                <Text style={styles.secondaryActionText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
          </View>

          <View style={styles.serviceGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() =>
                navigation.navigate('ApplyLoan', { user: { email, memberId, firstName, balance } })
              }
            >
              <View style={styles.serviceIconCircle}>
                <MaterialIcons name="edit-document" size={20} color="#fff" />
              </View>
              <Text style={styles.serviceText}>Apply Loan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() =>
                navigation.navigate('PayLoan', { user: { email, memberId, firstName, balance } })
              }
            >
              <View style={styles.serviceIconCircle}>
                <Ionicons name="cash" size={20} color="#fff" />
              </View>
              <Text style={styles.serviceText}>Pay Loan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() =>
                navigation.navigate('ExistingLoan', { user: { email, memberId, firstName, balance } })
              }
            >
              <View style={styles.serviceIconCircle}>
                <FontAwesome name="book" size={20} color="#fff" />
              </View>
              <Text style={styles.serviceText}>Existing Loan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() =>
                navigation.navigate('Transactions', { user: { email, memberId, firstName, balance } })
              }
            >
              <View style={styles.serviceIconCircle}>
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
              </View>
              <Text style={styles.serviceText}>Transactions</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <View style={styles.activityCard}>
            {marqueeMessages && marqueeMessages.length > 0 ? (
              marqueeMessages.slice(0, 5).map((m, idx) => (
                <View key={idx} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <Text style={styles.activityText}>{m.message}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>No recent application activity.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Fallback Drawer Modal when Drawer navigator is unavailable */}
      {fallbackDrawerVisible && (
        <View style={styles.fallbackOverlay}>
          <View style={styles.fallbackDrawer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {selfie ? (
                <Image source={{ uri: selfie }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }} />
              ) : (
                <MaterialIcons name="person" size={64} color="#1E3A5F" />
              )}
              <Text style={{ color: '#1E3A5F', fontWeight: '700', fontSize: 16 }}>{firstName}</Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>{email}</Text>
            </View>

            <TouchableOpacity style={styles.fallbackItem} onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Account Management', { email }); }}>
              <MaterialIcons name="account-circle" size={20} color="#1E3A5F" />
              <Text style={styles.fallbackItemText}>Account Management</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fallbackItem} onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Settings'); }}>
              <MaterialIcons name="settings" size={20} color="#1E3A5F" />
              <Text style={styles.fallbackItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fallbackItem} onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('AboutUs'); }}>
              <MaterialIcons name="info" size={20} color="#1E3A5F" />
              <Text style={styles.fallbackItemText}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fallbackItem} onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('ContactUs'); }}>
              <MaterialIcons name="contact-mail" size={20} color="#1E3A5F" />
              <Text style={styles.fallbackItemText}>Contact Us</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />

            <TouchableOpacity style={[styles.fallbackItem, { justifyContent: 'center', backgroundColor: '#8E0B16', borderRadius: 8 }]} onPress={handleLogoutFallback}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }} onPress={() => setFallbackDrawerVisible(false)}>
              <Text style={{ color: '#1E3A5F', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  const insets = useSafeAreaInsets();
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

  const CenterTabButton = ({ onPress, accessibilityState }) => {
    const focused = !!accessibilityState?.selected;
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.centerTabButton, { bottom: Math.max(insets.bottom + 8, 20) }] }>
        <View style={[styles.centerTabButtonInner, focused && styles.centerTabButtonInnerActive]}>
          <MaterialIcons name="smart-toy" size={26} color={'#2D5783'} />
        </View>
      </TouchableOpacity>
    );
  };

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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarStyle: {
          backgroundColor: '#1E3A5F',
          borderTopColor: 'transparent',
          height: 84 + Math.max(insets.bottom, 0),
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
        },
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
      <Tab.Screen 
        name="BotTab" 
        component={Bot} 
        options={{ 
          tabBarLabel: 'AI',
          tabBarButton: (props) => <CenterTabButton {...props} />
        }} 
      />
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
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },

  // New Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  avatarButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 2,
    overflow: 'hidden',
  },
  greetGroup: {
    flex: 1,
    marginLeft: 12,
  },
  greetSubtitle: {
    fontSize: 12,
    color: '#CFE1F7',
  },
  greetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Wallet Card
  walletCard: {
    backgroundColor: '#1E3A5F',
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  walletLabel: {
    fontSize: 12,
    color: '#9CC2E7',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletAmount: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
  },
  eyeBtn: { marginLeft: 12, padding: 6 }
  ,
  walletActionsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  primaryActionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9D6E5',
  },
  secondaryActionText: {
    color: '#1E3A5F',
    marginLeft: 8,
    fontWeight: '700',
  },

  // Quick Actions Row
  quickActionsRow: {
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#1E3A5F',
    fontWeight: '600',
  },

  // Services
  sectionHeader: {
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#1E3A5F',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    width: '48%',
    borderWidth: 0,
  },
  serviceText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Activity List
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A5F',
    marginRight: 10,
  },
  activityText: {
    color: '#334155',
  },

  // Service icon circle
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#64748B',
  },

  // Legacy styles kept for compatibility (not used in new layout but safe to keep)
  topContainer: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 55,
    marginHorizontal: -20,
    marginTop: -20,
  },
  bottomContainer: {
    backgroundColor: 'transparent',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 50,
    overflow: 'hidden',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  balanceWrapper: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#BEE3F8',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 32,
    color: 'white',
    fontWeight: '700',
  },
  marqueeContainer: {
    height: 20,
    marginTop: 5,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    width: 600,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    width: '47%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modals
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
  },

  // Fallback drawer styles
  fallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  fallbackDrawer: {
    width: '75%',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 48,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  fallbackItemText: {
    color: '#1E3A5F',
    fontWeight: '600',
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
    backgroundColor: '#1E3A5F',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },

  // Floating center AI tab styles
  centerTabButton: {
    position: 'absolute',
    left: '50%',
    // Shift left by half of button width (58/2 = 29) to center precisely
    transform: [{ translateX: -29 }],
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  centerTabButtonInnerActive: {
    backgroundColor: '#FFFFFF',
  },
});