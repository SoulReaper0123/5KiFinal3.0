import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { database, storage } from '../../firebaseConfig';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const Profile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const [profilePic, setProfilePic] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [newDetails, setNewDetails] = useState({});
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Check if biometrics are available and enabled
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        // Check if device supports biometrics
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        setBiometricsAvailable(hasHardware && isEnrolled);
        
        // Check if biometrics are enabled for this user
        const credentials = await SecureStore.getItemAsync('biometricCredentials');
        if (credentials) {
          const storedData = JSON.parse(credentials);
          if (storedData.email === email) {
            setBiometricsEnabled(true);
          }
        }
      } catch (error) {
        console.error('Biometric check error:', error);
      }
    };
    
    checkBiometrics();
  }, [email]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const snapshot = await database.ref('Members').once('value');
        if (snapshot.exists()) {
          const members = snapshot.val();
          let foundUser = null;

          for (const memberId in members) {
            if (members[memberId].email === email) {
              foundUser = { id: memberId, ...members[memberId] };
              break;
            }
          }

          if (foundUser) {
            setUserDetails(foundUser);
            setSelfie(foundUser.selfie || null);
            setNewDetails(foundUser);
          } else {
            Alert.alert('User not found', 'No user found with the provided email.');
          }
        } else {
          Alert.alert('No data available', 'The members data is empty.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);
  
  // Function to enable biometrics
  const enableBiometrics = async () => {
    try {
      // Check if device supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Not Available', 
          'Your device does not support biometric authentication or you have not set up fingerprints in your device settings.'
        );
        return;
      }
      
      // Use a modal to get the password instead of Alert.prompt (which is iOS-only)
      Alert.alert(
        'Enable Fingerprint Login',
        'To enable fingerprint login, please enter your password in the next screen',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to BiometricSetup screen with email
              navigation.navigate('BiometricSetup', { email });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Enable biometrics error:', error);
      Alert.alert('Error', 'Could not enable biometric login');
    }
  };
  
  // Function to disable biometrics
  const disableBiometrics = async () => {
    try {
      Alert.alert(
        'Disable Biometric Login',
        'Are you sure you want to disable biometric login?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disable',
            onPress: async () => {
              await SecureStore.deleteItemAsync('biometricCredentials');
              setBiometricsEnabled(false);
              Alert.alert('Success', 'Biometric login has been disabled');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Disable biometrics error:', error);
      Alert.alert('Error', 'Could not disable biometric login');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need permission to access your media library');
      return;
    }

    Alert.alert(
      'Edit Profile Picture',
      'Do you want to change your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });

            if (!result.canceled) {
              setProfilePic(result.uri);
              uploadImage(result.uri);
            }
          },
        },
      ]
    );
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a reference to the file location
      const fileRef = storage.ref().child('profile_pics/' + new Date().toISOString());
      
      // Upload the file
      await fileRef.put(blob);
      
      // Get the download URL
      const downloadURL = await fileRef.getDownloadURL();
      
      // Update user profile in database
      const userRef = database.ref('Members/' + userDetails.id);
      await userRef.update({ selfie: downloadURL });
      setSelfie(downloadURL);
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert('Upload failed', 'Could not upload the image. Please try again.');
    }
  };

  const handleEditDetails = () => {
    setModalVisible(true);
  };

  const handleSaveDetails = async () => {
    try {
      const userRef = database.ref('Members/' + userDetails.id);
      await userRef.update(newDetails);
      Alert.alert('Success', 'Profile updated successfully!');
      setModalVisible(false);
      setUserDetails(newDetails);
    } catch (error) {
      console.error('Update failed', error);
      Alert.alert('Update failed', 'Could not update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            const parent = navigation.getParent();
            if (parent && parent.openDrawer) {
              parent.openDrawer();
            } else {
              navigation.replace('AppHome', { openDrawer: true });
            }
          }} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => setImageModalVisible(true)} style={styles.imageContainer}>
            {profilePic || selfie ? (
              <Image source={{ uri: profilePic || selfie }} style={styles.profileImage} />
            ) : (
              <MaterialIcons name="account-circle" size={120} color="#ccc" />
            )}
            <TouchableOpacity onPress={pickImage} style={styles.editIconContainer}>
              <MaterialCommunityIcons name="account-edit" size={30} color="black" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.nameText}>
                {`${(userDetails.firstName || '').trim()} ${(userDetails.middleName || '').trim()} ${(userDetails.lastName || '').trim()}`.replace(/\s+/g,' ').trim() || 'No name'}
              </Text>
              <Text style={styles.emailText}>{userDetails.email || 'N/A'}</Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idLabel}>Member ID</Text>
              <Text style={styles.idValue}>{userDetails.id || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Address</Text>
              <Text style={styles.infoRowValue}>{userDetails.address || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Birthday</Text>
              <Text style={styles.infoRowValue}>{userDetails.dateOfBirth || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Contact Number</Text>
              <Text style={styles.infoRowValue}>{userDetails.phoneNumber || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Place of Birth</Text>
              <Text style={styles.infoRowValue}>{userDetails.placeOfBirth || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionColumn}>
              <TouchableOpacity onPress={handleEditDetails} style={[styles.actionButton, styles.editButton]}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword', { email })}
                style={[styles.actionButton, styles.changePwButton]}
              >
                <Text style={styles.changePwText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalContainer}
  >
    <View style={styles.modalCard}>
      <View style={styles.modalHeaderRow}>
        <Text style={styles.modalTitleLarge}>Edit Profile</Text>
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
          <MaterialIcons name="close" size={22} color="#2D5783" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.modalInner} keyboardShouldPersistTaps="handled">
        <Text style={styles.modalSubtitle}>Update your personal information. Fields marked with <Text style={styles.requiredStar}>*</Text> are required.</Text>

        {[
          { field: 'firstName', label: 'First Name', required: true },
          { field: 'middleName', label: 'Middle Name', required: false },
          { field: 'lastName', label: 'Last Name', required: true },
          { field: 'address', label: 'Address', required: true },
          { field: 'dateOfBirth', label: 'Birthday', required: true },
          { field: 'phoneNumber', label: 'Contact Number', required: true },
          { field: 'gender', label: 'Gender', required: true },
          { field: 'placeOfBirth', label: 'Place of Birth', required: true },
          { field: 'civilStatus', label: 'Civil Status', required: true }
        ].map(({ field, label, required }) => (
          <View key={field} style={styles.fieldRow}>
            <Text style={styles.inputLabel}>
              {label} {required && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            <TextInput
              style={styles.inputField}
              placeholder={label}
              value={newDetails[field]}
              onChangeText={(text) => setNewDetails({ ...newDetails, [field]: text })}
              returnKeyType="next"
            />
          </View>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalActionButton, styles.cancelButton]}>
            <Text style={styles.modalActionText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSaveDetails} style={[styles.modalActionButton, styles.saveButton]}>
            <Text style={styles.modalActionText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </KeyboardAvoidingView>
</Modal>

      {/* Full Image Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <Image source={{ uri: selfie }} style={styles.modalImage} />
          <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeImageModalButton}>
            <Text style={styles.closeImageModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, detail }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{detail}</Text>
  </View>
);

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

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
  profileContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    marginTop: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5783',
  },
  emailText: {
    fontSize: 14,
    color: '#64748B',
  },
  idBadge: {
    backgroundColor: '#F6FBFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  idValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5783',
  },
  infoList: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  infoRowValue: {
    color: 'black',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  actionButton: {
    borderRadius: 5,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#4FE7AF',
  },
  changePwButton: {
    backgroundColor: '#6C63FF',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FBFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  modalTitleLarge: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5783',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
  },
  modalInner: {
    padding: 16,
    paddingBottom: 28,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  fieldRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E6EEF6',
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButton: {
    backgroundColor: '#2D5783',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  imageModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeImageModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  closeImageModalButtonText: {
    fontWeight: 'bold',
  },
  biometricSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D5783',
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricText: {
    marginLeft: 10,
    fontSize: 16,
  },
  biometricButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  biometricButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  biometricUnavailable: {
    color: '#999',
    fontStyle: 'italic',
  },
  biometricNote: {
    marginTop: 5,
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default Profile;