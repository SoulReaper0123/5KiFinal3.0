import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Alert, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { getDatabase, ref, get, child } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../src/firebaseConfig';
import * as SecureStore from 'expo-secure-store';

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
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => props.navigation.navigate('HomeTab')}
          >
            <MaterialIcons name="arrow-forward" size={28} color="white" />
          </TouchableOpacity>

          {user?.selfie && (
            <Image source={{ uri: user.selfie }} style={styles.profileImage} />
          )}
          <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.separator} />
        {loading ? (
          <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
        ) : (
          props.state.routes.map((route, index) => (
            <DrawerItem
              key={index}
              label={route.name}
              onPress={() => {
                props.navigation.navigate(route.name);
              }}
              labelStyle={styles.drawerItemLabel}
            />
          ))
        )}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialIcons name="logout" size={40} color="#2D5783" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DrawerNavigator = ({ route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalLogoutLoading, setGlobalLogoutLoading] = useState(false);
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
          // Add these options to ensure compatibility
          drawerType: 'front',
          overlayColor: 'transparent',
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={AppHome} 
          initialParams={{ user, email, password, shouldPromptBiometric }} 
          options={{ headerShown: false }} 
        />
        <Drawer.Screen name="Account Management" component={ProfileScreen} initialParams={{ email }} options={{ headerShown: false }} />
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
      <Stack.Screen name="DrawerNav" component={DrawerNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AppHomeStandalone" component={AppHome} options={{ headerShown: false }} />
      <Stack.Screen name="ApplyLoan" component={ApplyLoan} options={{ headerShown: false }} />
      <Stack.Screen name="PayLoan" component={PayLoan} options={{ headerShown: false }} />
      <Stack.Screen name="ExistingLoan" component={ExistingLoan} options={{ headerShown: false }} />
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
    backgroundColor: 'white',
  },
  profileContainer: {
    padding: 30,
    paddingTop: 70,
    alignItems: 'center',
    backgroundColor: '#2D5783',
    height: '35%',
    marginTop: -60,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 80,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  separator: {
    height: 1,
    backgroundColor: 'white',
  },
  logoutContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#8E0B16',
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 20,
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
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5783',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    color: 'black',
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