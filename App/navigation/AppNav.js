import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Alert, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { getDatabase, ref, get, child } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../src/firebaseConfig';
import * as SecureStore from 'expo-secure-store';
import CustomConfirmModal from '../src/components/CustomConfirmModal';

// Import all your screens
import Splashscreen from '../src/app/Splashscreen';
import AppLoginPage from '../src/app/Auth/AppLoginPage';
import ForgotPassword from '../src/app/Auth/ForgotPassword';
import RegisterPage from '../src/app/Auth/RegisterPage';
import RegisterPage2 from '../src/app/Auth/RegisterPage2';
import CreatePasswordPage from '../src/app/Auth/CreatePasswordPage';
import AppHome from '../src/app/AppHome';
import ProfileScreen from '../src/app/Drawer/Profile';
import Terms from '../src/app/Drawer/Terms';
import Privacy from '../src/app/Drawer/Privacy';
import ApplyLoan from '../src/app/HomePage/ApplyLoan';
import PayLoan from '../src/app/HomePage/PayLoan';
import Deposit from '../src/app/HomePage/Deposit';
import Withdraw from '../src/app/HomePage/Withdraw';
import Transactions from '../src/app/HomePage/Transactions';
import ExistingLoan from '../src/app/HomePage/ExistingLoan';
import TwoFactorEmail from '../src/app/Auth/TwoFactorEmail';
import VerifyCode from '../src/app/Auth/VerifyCode';
import Bot from '../src/app/HomePage/Bot';
import Inbox from '../src/app/HomePage/Inbox';
import WithdrawMembership from '../src/app/HomePage/WithdrawMembership';
import ChangePassword from '../src/app/Drawer/ChangePassword';
import AboutUs from '../src/app/Drawer/AboutUs';
import ContactUs from '../src/app/Drawer/ContactUs';
import Settings from '../src/app/Drawer/Settings';
import RegistrationFeePage from '../src/app/Auth/RegistrationFeePage';
import BiometricSetupScreen from '../src/app/Auth/BiometricSetupScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ user, loading, setGlobalLogoutLoading, ...props }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setGlobalLogoutLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await SecureStore.deleteItemAsync('currentUserEmail').catch(() => {});
      await SecureStore.deleteItemAsync('biometricEnabled').catch(() => {});
      await auth.signOut();
      
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'There was an error during logout. Please try again.');
    } finally {
      setGlobalLogoutLoading(false);
    }
  };

  // Get icon for each route
  const getRouteIcon = (routeName) => {
    switch (routeName) {
      case 'Profile': return 'account-circle';
      case 'Terms and Conditions': return 'description';
      case 'Privacy Policy': return 'privacy-tip';
      case 'About Us': return 'info';
      case 'Contact Us': return 'contact-mail';
      case 'Settings': return 'settings';
      default: return 'chevron-right';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        {/* Enhanced Profile Header */}
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => props.navigation.closeDrawer()}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.profileImageContainer}>
            {user?.selfie ? (
              <Image source={{ uri: user.selfie }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
                <MaterialIcons name="person" size={50} color="#2D5783" />
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          
          <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          
          {/* Welcome message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D5783" style={styles.loadingIndicator} />
              <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
          ) : (
            <>
              {props.state.routes.map((route, index) => {
                // Skip the Home route as it's the current screen
                if (route.name === 'Home') return null;
                
                // Custom label mapping
                const getLabel = (routeName) => {
                  switch (routeName) {
                    case 'Profile': return 'Account Management';
                    case 'Terms and Conditions': return 'Terms & Conditions';
                    case 'Privacy Policy': return 'Privacy Policy';
                    case 'About Us': return 'About Us';
                    case 'Contact Us': return 'Contact Us';
                    case 'Settings': return 'Settings';
                    default: return routeName;
                  }
                };
                
                const isActive = props.state.index === index;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                    onPress={() => {
                      props.navigation.navigate(route.name);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.drawerItemIcon}>
                      <MaterialIcons 
                        name={getRouteIcon(route.name)} 
                        size={22} 
                        color={isActive ? '#2D5783' : '#666'} 
                      />
                    </View>
                    <Text style={[styles.drawerItemLabel, isActive && styles.drawerItemLabelActive]}>
                      {getLabel(route.name)}
                    </Text>
                    <MaterialIcons 
                      name="chevron-right" 
                      size={20} 
                      color={isActive ? '#2D5783' : '#ccc'} 
                    />
                  </TouchableOpacity>
                );
              })}
              
              {/* Additional Privacy item */}
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => props.navigation.navigate('Privacy Policy')}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIcon}>
                  <MaterialIcons name="privacy-tip" size={22} color="#666" />
                </View>
                <Text style={styles.drawerItemLabel}>Privacy</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Enhanced Logout Section */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Full-screen confirmation modal using shared component */}
      <CustomConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        type="warning"
        cancelText="No"
        confirmText="Yes"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => { setShowLogoutModal(false); confirmLogout(); }}
      />

      {/* Login-style loading overlay during logout */}
      {globalLogoutLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const DrawerNavigator = ({ route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalLogoutLoading, setGlobalLogoutLoading] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const { email, password, shouldPromptBiometric } = route.params;

  useEffect(() => {
    const fetchUserData = async () => {
      const db = getDatabase();
      const dbRef = ref(db);
      try {
        const snapshot = await get(child(dbRef, 'Members'));
        if (snapshot.exists()) {
          const members = snapshot.val();
          const foundUser = Object.entries(members).find(([id, member]) => member.email === email);
          if (foundUser) {
            const [memberId, memberData] = foundUser;
            const { firstName, middleName, lastName } = memberData;
            const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
            setUser({ id: memberId, fullName, ...memberData });
          } else {
            console.log('No user found with the provided email');
          }
        } else {
          console.log('No data available');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <View style={{ flex: 1 }}>
      <Drawer.Navigator
        drawerContent={(props) => (
          <CustomDrawerContent 
            user={user} 
            loading={loading} 
            setGlobalLogoutLoading={setGlobalLogoutLoading}
            {...props} 
          />
        )}
        screenOptions={{
          drawerStyle: { backgroundColor: 'black' },
          drawerType: 'front',
          overlayColor: 'rgba(0,0,0,0.3)',
          swipeEnabled: true,
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={AppHome} 
          initialParams={{ user, email, password, shouldPromptBiometric }} 
          options={{ headerShown: false }} 
        />
        <Drawer.Screen name="Profile" component={ProfileScreen} initialParams={{ email }} options={{ headerShown: false }} />
        <Drawer.Screen name="Terms and Conditions" component={Terms} options={{ headerShown: false }} />
        <Drawer.Screen name="Privacy Policy" component={Privacy} options={{ headerShown: false }} />
        <Drawer.Screen name="About Us" component={AboutUs} options={{ headerShown: false }} />
        <Drawer.Screen name="Contact Us" component={ContactUs} options={{ headerShown: false }} />
        <Drawer.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      </Drawer.Navigator>
    
      {globalLogoutLoading && (
        <View style={styles.globalLoadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3A7F0D" />
            <Text style={styles.loadingText}>Logging out...</Text>
            <Text style={styles.loadingSubText}>Please wait</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const AppNav = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={Splashscreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={AppLoginPage} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false }} />
      <Stack.Screen name="Register2" component={RegisterPage2} options={{ headerShown: false }} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordPage} options={{ headerShown: false }} />
      <Stack.Screen name="AccountDetails" component={require('../src/app/Auth/AccountDetailsPage').default} options={{ headerShown: false }} />
      <Stack.Screen name="DrawerNav" component={AppHome} options={{ headerShown: false }} />
      <Stack.Screen name="AppHome" component={AppHome} options={{ headerShown: false }} />
      <Stack.Screen name="ApplyLoan" component={ApplyLoan} options={{ headerShown: false }} />
      <Stack.Screen name="PayLoan" component={PayLoan} options={{ headerShown: false }} />
      <Stack.Screen name="PayLoanDetails" component={require('../src/app/HomePage/PayLoanDetails').default} options={{ headerShown: false }} />
      <Stack.Screen name="ExistingLoan" component={ExistingLoan} options={{ headerShown: false }} />
      <Stack.Screen name="LoanPaymentHistory" component={require('../src/app/HomePage/LoanPaymentHistory').default} options={{ headerShown: false }} />
      <Stack.Screen name="LoanDetails" component={require('../src/app/HomePage/LoanDetails').default} options={{ headerShown: false }} />
      <Stack.Screen name="Deposit" component={Deposit} options={{ headerShown: false }} />
      <Stack.Screen name="Withdraw" component={Withdraw} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={Terms} options={{ headerShown: false }} />
      <Stack.Screen name="Privacy" component={Privacy} options={{ headerShown: false }} />
      <Stack.Screen name="TwoFactorEmail" component={TwoFactorEmail} options={{ headerShown: false }} />
      <Stack.Screen name="VerifyCode" component={VerifyCode} options={{ headerShown: false }} />
      <Stack.Screen name="Bot" component={Bot} options={{ headerShown: false }} />
      <Stack.Screen name="Inbox" component={Inbox} options={{ headerShown: false }} />
      <Stack.Screen name="InboxDetails" component={require('../src/app/HomePage/InboxDetails').default} options={{ headerShown: false }} />
      <Stack.Screen name="Transactions" component={Transactions} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionDetails" component={require('../src/app/HomePage/TransactionDetails').default} options={{ headerShown: false }} />
      <Stack.Screen name="WithdrawMembership" component={WithdrawMembership} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
      <Stack.Screen name="AboutUs" component={AboutUs} options={{ headerShown: false }} />
      <Stack.Screen name="ContactUs" component={ContactUs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      <Stack.Screen name="RegistrationFee" component={RegistrationFeePage} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen 
        name="BiometricSetup" 
        component={BiometricSetupScreen} 
        options={{ headerShown: false, gestureEnabled: false }} 
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  drawerContent: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  profileContainer: {
    padding: 30,
    paddingTop: 70,
    alignItems: 'center',
    backgroundColor: '#2D5783',
    minHeight: 280,
    marginTop: -60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ade80',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  navigationContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  drawerItemActive: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#2D5783',
  },
  drawerItemIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  drawerItemLabelActive: {
    color: '#2D5783',
    fontWeight: '600',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingIndicator: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  globalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10000,
  },
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
  backArrow: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    width: 320,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
  },
  confirmButton: {
    backgroundColor: '#8E0B16',
    shadowColor: '#8E0B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppNav;