import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Alert, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getDatabase, ref, get, child } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../../App/src/firebaseConfig';

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
import RegistrationFeePage from '../src/app/Auth/RegistrationFeePage';
import BiometricSetupScreen from '../src/app/Auth/BiometricSetupScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ user, loading, ...props }) => {
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await auth.signOut();
              props.navigation.navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Error', 'There was an error during logout');
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={{ flex: 1 }} pointerEvents={logoutLoading ? 'none' : 'auto'}>
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
      {logoutLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </View>
  );
};

const DrawerNavigator = ({ route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { email } = route.params;

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
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent user={user} loading={loading} {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: 'black' },
      }}
    >
      <Drawer.Screen name="Home" component={AppHome} initialParams={{ user }} options={{ headerShown: false }} />
      <Drawer.Screen name="Account Management" component={ProfileScreen} initialParams={{ email }} options={{ headerShown: false }} />
      <Drawer.Screen name="Terms and Conditions" component={Terms} options={{ headerShown: false }} />
      <Drawer.Screen name="Privacy Policy" component={Privacy} options={{ headerShown: false }} />
      <Drawer.Screen name="About Us" component={AboutUs} options={{ headerShown: false }} />
      <Drawer.Screen name="Contact Us" component={ContactUs} options={{ headerShown: false }} />
    </Drawer.Navigator>
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
      <Stack.Screen name="Transactions" component={Transactions} options={{ headerShown: false }} />
      <Stack.Screen name="WithdrawMembership" component={WithdrawMembership} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
      <Stack.Screen name="AboutUs" component={AboutUs} options={{ headerShown: false }} />
      <Stack.Screen name="ContactUs" component={ContactUs} options={{ headerShown: false }} />
      <Stack.Screen name="RegistrationFee" component={RegistrationFeePage} options={{ headerShown: false }} />
      <Stack.Screen 
        name="BiometricSetup" 
        component={BiometricSetupScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

export default AppNav;