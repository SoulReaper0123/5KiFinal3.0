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
import LoanHistory from './HomePage/LoanHistory';
import MarqueeData from './HomePage/MarqueeData';
import CustomConfirmModal from '../components/CustomConfirmModal';
import CustomModal from '../components/CustomModal';

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
  const [activeSection, setActiveSection] = useState('investment'); // 'savings' or 'investment'

  const navigation = useNavigation();
  const route = useRoute();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [marqueeMessages, setMarqueeMessages] = useState([]);
  const [hasNewInboxItems, setHasNewInboxItems] = useState(false);
  const previousInboxCount = useRef(0);
  const lastInboxCheckRef = useRef(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);


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

  // Handle openDrawer param from navigation
  useEffect(() => {
    if (route.params?.openDrawer) {
      handleOpenMenu();
    }
  }, [route.params?.openDrawer]);

  const handleInboxOpen = () => {
    setHasNewInboxItems(false);
    lastInboxCheckRef.current = Date.now();
    navigation.navigate('InboxTab');
  };

  const handleLogoutFallback = async () => {
    setLogoutLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await SecureStore.deleteItemAsync('currentUserEmail').catch(() => {});
      await SecureStore.deleteItemAsync('biometricEnabled').catch(() => {});
      await auth.signOut();
      
      // Show success modal before navigating
      setSuccessModalVisible(true);
      
      // Navigate after showing success message
      setTimeout(() => {
        setSuccessModalVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 1500);
      
    } catch (e) {
      setLogoutLoading(false);
      Alert.alert('Logout Error', 'There was an error during logout. Please try again.');
    }
  };

  const showLogoutConfirmation = () => {
    setLogoutModalVisible(true);
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
              onPress={handleInboxOpen}
            >
              <Ionicons name="notifications-outline" size={26} color="#1E3A5F" />
              {hasNewInboxItems && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>

          {/* Combined Investment & Savings Card */}
          <View style={styles.walletCard}>
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeSection === 'investment' && styles.toggleButtonActive
                ]}
                onPress={() => setActiveSection('investment')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  activeSection === 'investment' && styles.toggleButtonTextActive
                ]}>
                  INVESTMENT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeSection === 'savings' && styles.toggleButtonActive
                ]}
                onPress={() => setActiveSection('savings')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  activeSection === 'savings' && styles.toggleButtonTextActive
                ]}>
                  SAVINGS
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Display */}
            <View style={styles.balanceRow}>
              <Text style={styles.walletAmount}>
                {activeSection === 'investment' 
                  ? (investmentHidden ? '******' : formatBalance(investment))
                  : (amountHidden ? '******' : formatBalance(balance))
                }
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (activeSection === 'investment') {
                    setInvestmentHidden((v) => !v);
                  } else {
                    setAmountHidden((v) => !v);
                  }
                }} 
                style={styles.eyeBtn}
              >
                <MaterialIcons 
                  name={
                    activeSection === 'investment' 
                      ? (investmentHidden ? 'visibility' : 'visibility-off')
                      : (amountHidden ? 'visibility' : 'visibility-off')
                  } 
                  size={22} 
                  color="#1E3A5F" 
                />
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <View style={styles.walletActionsRow}>
              {activeSection === 'investment' ? (
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
              ) : (
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => setWithdrawModalVisible(true)}
                >
                  <Entypo name="upload" size={18} color="#1E3A5F" />
                  <Text style={styles.secondaryActionText}>Withdraw</Text>
                </TouchableOpacity>
              )}
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
                <MaterialIcons name="edit-document" size={20} color="#1E3A5F" />
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
                <Ionicons name="cash" size={20} color="#1E3A5F" />
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
                <FontAwesome name="book" size={20} color="#1E3A5F" />
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
                <Ionicons name="swap-horizontal" size={20} color="#1E3A5F" />
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

      {/* Enhanced Fallback Drawer Modal when Drawer navigator is unavailable */}
      {fallbackDrawerVisible && (
        <View style={styles.fallbackOverlay}>
          <View style={styles.fallbackDrawer}>
            {/* Enhanced Profile Header */}
            <View style={styles.fallbackProfileContainer}>
              <TouchableOpacity 
                style={styles.fallbackCloseButton}
                onPress={() => setFallbackDrawerVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.fallbackProfileImageContainer}>
                {selfie ? (
                  <Image source={{ uri: selfie }} style={styles.fallbackProfileImage} />
                ) : (
                  <View style={styles.fallbackDefaultProfileImage}>
                    <MaterialIcons name="person" size={40} color="#2D5783" />
                  </View>
                )}
                <View style={styles.fallbackOnlineIndicator} />
              </View>
              
              <Text style={styles.fallbackProfileName}>{firstName}</Text>
              <Text style={styles.fallbackProfileEmail}>{email}</Text>
              

            </View>

            {/* Navigation Items */}
            <View style={styles.fallbackNavigationContainer}>
              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Profile', { email }); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="account-circle" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>Account Management</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Settings'); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="settings" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>Settings</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('AboutUs'); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="info" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>About Us</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('ContactUs'); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="contact-mail" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>Contact Us</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Terms and Conditions'); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="description" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>Terms & Conditions</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.fallbackMenuItem} 
                onPress={() => { setFallbackDrawerVisible(false); navigation.navigate('Privacy Policy'); }}
                activeOpacity={0.7}
              >
                <View style={styles.fallbackMenuIcon}>
                  <MaterialIcons name="privacy-tip" size={22} color="#2D5783" />
                </View>
                <Text style={styles.fallbackMenuText}>Privacy Policy</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Enhanced Logout Section */}
            <View style={styles.fallbackLogoutContainer}>
              <TouchableOpacity 
                style={styles.fallbackLogoutButton} 
                onPress={showLogoutConfirmation}
                activeOpacity={0.8}
              >
                <MaterialIcons name="logout" size={20} color="white" />
                <Text style={styles.fallbackLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Custom Logout Confirmation Modal */}
      <CustomConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        type="warning"
        cancelText="No"
        confirmText="Yes"
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutFallback}
      />

      {/* Custom Success Modal */}
      <CustomModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Success"
        message="You have been logged out successfully!"
        type="success"
        buttonText="OK"
      />

      {/* Logout Loading Overlay */}
      {logoutLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Logging out...</Text>
          </View>
        </View>
      )}

      {withdrawModalVisible && (
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Withdrawal Type</Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.withdrawMoneyButton]}
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
              <MaterialIcons name="account-balance-wallet" size={20} color="white" />
              <Text style={styles.modalButtonText}>Withdraw Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.withdrawMembershipButton]}
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
              <MaterialIcons name="person-remove" size={20} color="white" />
              <Text style={styles.modalButtonText}>Withdraw Membership</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setWithdrawModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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



  const navigation = useNavigation();

  const handleAIButtonPress = () => {
    navigation.navigate('Bot', { email });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'HomeTab') iconName = 'home';
            else if (route.name === 'InboxTab') iconName = 'email';
            else if (route.name === 'LoanHistoryTab') iconName = 'history';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          headerShown: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
          tabBarStyle: {
            backgroundColor: '#1E3A5F',
            borderTopColor: 'transparent',
            height: 50 + Math.max(insets.bottom, 0),
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
          name="InboxTab"
          options={{ tabBarLabel: 'Inbox' }}
        >
          {() => <Inbox memberId={memberId} email={email} />}
        </Tab.Screen>

        <Tab.Screen
          name="LoanHistoryTab"
          options={{ tabBarLabel: 'Loan History' }}
        >
          {() => <LoanHistory />}
        </Tab.Screen>
      </Tab.Navigator>
      
      {/* Floating AI Button */}
      <TouchableOpacity 
        style={[styles.floatingAIButton, { bottom: Math.max(insets.bottom + 70, 90) }]}
        onPress={handleAIButtonPress}
        activeOpacity={0.8}
      >
        <View style={styles.floatingAIButtonInner}>
          <MaterialIcons name="smart-toy" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#fffff',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  avatarButton: {
    backgroundColor: '#1E3A5F',
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
    color: '#1E3A5F',
  },
  greetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },

  // Wallet Card
  walletCard: {
    backgroundColor: '#f2f4f7ff',
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#00000091',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  walletLabel: {
    fontSize: 12,
    color: '#1E3A5F',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletAmount: {
    fontSize: 32,
    color: '#1E3A5F',
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

  // Toggle Button Styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#1E3A5F',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#f2f4f7ff',
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
    color: '#1E3A5F',
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
    backgroundColor: 'rgba(199, 202, 238, 0.2)',
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
    width: '85%',
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },

  // Enhanced Fallback drawer styles
  fallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  fallbackDrawer: {
    width: '80%',
    backgroundColor: '#f8fafc',
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  fallbackProfileContainer: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#2D5783',
    minHeight: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fallbackCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fallbackProfileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  fallbackProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fallbackDefaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fallbackOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fallbackProfileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  fallbackProfileEmail: {
    fontSize: 12,
    color: '#e2e8f0',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackWelcomeContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  fallbackWelcomeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  fallbackNavigationContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  fallbackMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fallbackMenuIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  fallbackMenuText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  fallbackLogoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  fallbackLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fallbackLogoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#1E3A5F',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  withdrawMoneyButton: {
    backgroundColor: '#28a745', // Green for money withdrawal
  },
  withdrawMembershipButton: {
    backgroundColor: '#dc3545', // Red for membership withdrawal (more serious action)
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    width: '100%',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    width: 220,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },

  // Floating AI Button styles
  floatingAIButton: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D5783',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  floatingAIButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#2D5783',
  },
});