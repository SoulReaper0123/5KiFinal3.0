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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { database, storage } from '../../firebaseConfig';
import { getDatabase, ref, get, update } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';

const Profile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [profilePic, setProfilePic] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [newDetails, setNewDetails] = useState({});
  const [currentEmail, setCurrentEmail] = useState(email);

  // If no email from params, try to get it from SecureStore
  useEffect(() => {
    const getEmail = async () => {
      if (!email) {
        try {
          const storedEmail = await SecureStore.getItemAsync('currentUserEmail');
          if (storedEmail) {
            setCurrentEmail(storedEmail);
            fetchUserData(storedEmail);
          } else {
            setLoading(false);
            Alert.alert('Error', 'No user email found. Please log in again.');
          }
        } catch (error) {
          console.error('Error getting email from SecureStore:', error);
          setLoading(false);
        }
      } else {
        setCurrentEmail(email);
        fetchUserData(email);
      }
    };

    getEmail();
  }, [email]);

  const fetchUserData = async (userEmail) => {
    try {
      const db = getDatabase();
      const snapshot = await get(ref(db, 'Members'));
      
      if (snapshot.exists()) {
        const members = snapshot.val();
        let foundUser = null;

        for (const memberId in members) {
          if (members[memberId].email === userEmail) {
            foundUser = { id: memberId, ...members[memberId] };
            break;
          }
        }

        if (foundUser) {
          setUserDetails(foundUser);
          setSelfie(foundUser.selfie || null);
          setNewDetails(foundUser);
          console.log('Profile - User data fetched:', foundUser);
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
      const db = getDatabase();
      const userRef = ref(db, 'Members/' + userDetails.id);
      await update(userRef, { selfie: downloadURL });
      setSelfie(downloadURL);
      Alert.alert('Success', 'Profile picture updated successfully!');
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
      const db = getDatabase();
      const userRef = ref(db, 'Members/' + userDetails.id);
      await update(userRef, newDetails);
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
              navigation.goBack();
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
              <Text style={styles.infoRowLabel}>Birthdate</Text>
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
                { field: 'placeOfBirth', label: 'Place of Birth', required: true },
              ].map(({ field, label, required }) => (
                <View key={field} style={styles.fieldRow}>
                  <Text style={styles.inputLabel}>
                    {label} {required && <Text style={styles.requiredStar}>*</Text>}
                  </Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder={label}
                    value={newDetails[field] || ''}
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
  requiredStar: {
    color: 'red',
  },
});

export default Profile;
