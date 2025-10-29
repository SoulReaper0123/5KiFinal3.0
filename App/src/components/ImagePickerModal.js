import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Image,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ImagePickerModal = ({
  visible,
  onClose,
  onImageSelected,
  onGalleryImageSelected,
  title = "Select Proof of Deposit",
  showCropOptions = false,
  cameraOnly = false,
}) => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to continue.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleCameraPress = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        onImageSelected(imageUri);
        onClose();
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleGalleryPress = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        if (showCropOptions && onGalleryImageSelected) {
          // Pass the image to parent component to handle crop options
          onGalleryImageSelected(imageUri);
          onClose();
        } else {
          // Use image directly without crop options
          onImageSelected(imageUri);
          onClose();
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  return (
    <>
      {/* Main Image Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton, 
                  styles.cameraOption,
                  cameraOnly && styles.fullWidthOption
                ]}
                onPress={handleCameraPress}
              >
                <MaterialIcons name="photo-camera" size={24} color="#2D5783" style={styles.optionIcon} />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
              
              {!cameraOnly && (
                <TouchableOpacity
                  style={[styles.optionButton, styles.galleryOption]}
                  onPress={handleGalleryPress}
                >
                  <MaterialIcons name="photo-library" size={24} color="#2D5783" style={styles.optionIcon} />
                  <Text style={styles.optionText}>
                    {Platform.OS === 'web' ? 'Choose File' : 'Choose from Gallery'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.cancelOption}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2D5783',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#2D5783',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cameraOption: {
    marginRight: 5,
  },
  galleryOption: {
    marginLeft: 5,
  },
  fullWidthOption: {
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  cancelOption: {
    padding: 15,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#2D5783',
  },
  optionIcon: {
    marginRight: 5,
  },
  cancelText: {
    fontSize: 16,
    color: 'red',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ImagePickerModal;
