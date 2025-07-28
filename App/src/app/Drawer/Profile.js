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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDatabase, ref, get, child, update } from 'firebase/database';
import firebase from 'firebase/app';
import 'firebase/storage';

const Profile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const [profilePic, setProfilePic] = useState(null);
  const [selfie, setSelfie] = useState(null); // ✅ updated
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [newDetails, setNewDetails] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      const db = getDatabase();
      const dbRef = ref(db);
      try {
        const snapshot = await get(child(dbRef, 'Members'));
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
            setSelfie(foundUser.selfie || null); // ✅ updated
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
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = firebase.storage().ref();
    const profilePicRef = storageRef.child('profile_pics/' + new Date().toISOString());

    try {
      await profilePicRef.put(blob);
      const downloadURL = await profilePicRef.getDownloadURL();
      const db = getDatabase();
      const userRef = ref(db, 'Members/' + userDetails.id);
      await userRef.update({ selfie: downloadURL }); // ✅ updated
      setSelfie(downloadURL); // ✅ updated
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert('Upload failed', 'Could not upload the image. Please try again.');
    }
  };

  const handleEditDetails = () => {
    setModalVisible(true);
  };

  const handleSaveDetails = async () => {
    const db = getDatabase();
    const userRef = ref(db, 'Members/' + userDetails.id);
    try {
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
          <DetailRow label="Member ID:" detail={userDetails.id || 'N/A'} />
          <DetailRow label="Name:" detail={`${userDetails.firstName || 'N/A'} ${userDetails.middleName || ''} ${userDetails.lastName || ''}`} />
          <DetailRow label="Address:" detail={userDetails.address || 'N/A'} />
          <DetailRow label="Birthday:" detail={userDetails.dateOfBirth || 'N/A'} />
          <DetailRow label="Contact Number:" detail={userDetails.phoneNumber || 'N/A'} />
          <DetailRow label="Gender:" detail={userDetails.gender || 'N/A'} />
          <DetailRow label="Place of Birth:" detail={userDetails.placeOfBirth || 'N/A'} />
          <DetailRow label="Civil Status:" detail={userDetails.civilStatus || 'N/A'} />
          <TouchableOpacity onPress={handleEditDetails} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile Details</Text>
            {['firstName', 'middleName', 'lastName', 'address', 'dateOfBirth', 'phoneNumber', 'gender', 'placeOfBirth', 'civilStatus'].map((field) => (
              <View key={field}>
                <Text style={styles.label}>{capitalizeFirstLetter(field)}:</Text>
                <TextInput
                  style={styles.input}
                  placeholder={capitalizeFirstLetter(field)}
                  value={newDetails[field]}
                  onChangeText={(text) => setNewDetails({ ...newDetails, [field]: text })}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveDetails} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: 'black',
    width: '40%',
  },
  detailValue: {
    color: 'black',
    textAlign: 'right',
    width: '60%',
  },
  editButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 5,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
});

export default Profile;
