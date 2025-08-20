import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  Modal 
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterPage2 = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [validIdFront, setValidIdFront] = useState(null);
    const [validIdBack, setValidIdBack] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [selfieWithId, setSelfieWithId] = useState(null);
    const [showIdFrontOptions, setShowIdFrontOptions] = useState(false);
    const [showIdBackOptions, setShowIdBackOptions] = useState(false);
    const [showSelfieOptions, setShowSelfieOptions] = useState(false);
    const [showSelfieWithIdOptions, setShowSelfieWithIdOptions] = useState(false);
    // State for crop options modal
    const [showCropOptions, setShowCropOptions] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    // State for custom modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error');

    useEffect(() => {
        if (route.params?.selfieWithId) {
            setSelfieWithId(route.params.selfieWithId);
        }
        if (route.params?.selfie) {
            setSelfie(route.params.selfie);
        }
    }, [route.params]);

    const {
        firstName, middleName, lastName, email, phoneNumber, gender, civilStatus, placeOfBirth,
        address, governmentId, age, dateOfBirth,
    } = route.params;

    const handleSelectImage = async (source, setImageFunction, imageType) => {
        // First, ensure we have a valid function to set the image
        if (typeof setImageFunction !== 'function') {
            console.error('setImageFunction is not a function:', setImageFunction);
            Alert.alert('Error', 'An internal error occurred. Please try again.');
            return;
        }
        
        // Close all option modals first
        setShowIdFrontOptions(false);
        setShowIdBackOptions(false);
        setShowSelfieOptions(false);
        setShowSelfieWithIdOptions(false);
        
        // Save the current set function and image type for later use
        setCurrentSetFunction(() => setImageFunction);
        setCurrentImageType(imageType);
        
        const { status } = source === 'camera' 
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
            
        if (status !== 'granted') {
            setModalMessage(`We need permission to access your ${source === 'camera' ? 'camera' : 'media library'}`);
            setModalType('error');
            setModalVisible(true);
            return;
        }

        try {
            // Launch camera or image library WITHOUT automatic editing
            const result = await (source === 'camera' 
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // Disable automatic editing
                    quality: 0.8,
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // Disable automatic editing
                    quality: 0.8,
                }));

            if (!result.canceled && result.assets && result.assets[0]) {
                if (source === 'camera') {
                    // For camera: automatically use the image as is
                    setImageFunction(result.assets[0].uri);
                    // Clean up state
                    setCurrentSetFunction(null);
                    setCurrentImageType(null);
                } else {
                    // For gallery: show crop options
                    setSelectedImageUri(result.assets[0].uri);
                    setShowCropOptions(true);
                }
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            setModalMessage('Failed to select image');
            setModalType('error');
            setModalVisible(true);
        }
    };

    const handleUseAsIs = () => {
        if (currentSetFunction && selectedImageUri) {
            currentSetFunction(selectedImageUri);
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
        }
    };

    const handleCropImage = async () => {
        if (!selectedImageUri) return;

        try {
            setShowCropOptions(false);
            
            Alert.alert(
                'Crop Image',
                'You can now crop the image with flexible dimensions. Drag the corners to adjust both height and width as needed.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setShowCropOptions(true)
                    },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            try {
                                // Use ImagePicker with editing enabled for flexible cropping
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                    allowsEditing: true,
                                    // No aspect ratio = free form cropping
                                    quality: 0.8,
                                });

                                if (!result.canceled && result.assets && result.assets[0]) {
                                    if (currentSetFunction) {
                                        currentSetFunction(result.assets[0].uri);
                                    }
                                    // Clean up state
                                    setSelectedImageUri(null);
                                    setCurrentImageType(null);
                                    setCurrentSetFunction(null);
                                } else {
                                    setShowCropOptions(true);
                                }
                            } catch (error) {
                                console.error('Error cropping image:', error);
                                setModalMessage('Failed to crop image');
                                setModalType('error');
                                setModalVisible(true);
                                setShowCropOptions(true);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error with crop:', error);
            setModalMessage('Failed to crop image');
            setModalType('error');
            setModalVisible(true);
        }
    };

    const handleNext = () => {
        if (!validIdFront || !validIdBack || !selfie || !selfieWithId) {
            setModalMessage('Please upload all required images');
            setModalType('error');
            setModalVisible(true);
            return;
        }

        navigation.navigate('RegistrationFee', {
            ...route.params,
            validIdFront,
            validIdBack,
            selfie,
            selfieWithId
        });
    };

    const renderOptionsModal = (visible, setVisible, onCameraPress, onLibraryPress, title, showLibraryOption = true) => (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={() => setVisible(false)}
            animationType="slide"
        >
            <View style={styles.modalBackground}>
                <View style={styles.optionsModal}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <View style={styles.optionButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.optionButton, !showLibraryOption && styles.fullWidthOption]}
                            onPress={() => {
                                // First close the modal, then handle the camera press
                                setVisible(false);
                                // Small delay to ensure modal is closed before proceeding
                                setTimeout(() => {
                                    onCameraPress();
                                }, 300);
                            }}
                        >
                            <Icon name="photo-camera" size={24} color="#2D5783" style={styles.optionIcon} />
                            <Text style={styles.optionText}>Take Photo</Text>
                        </TouchableOpacity>
                        {showLibraryOption && (
                            <TouchableOpacity 
                                style={styles.optionButton}
                                onPress={() => {
                                    // First close the modal, then handle the library press
                                    setVisible(false);
                                    // Small delay to ensure modal is closed before proceeding
                                    setTimeout(() => {
                                        onLibraryPress();
                                    }, 300);
                                }}
                            >
                                <Icon name="photo-library" size={24} color="#2D5783" style={styles.optionIcon} />
                                <Text style={styles.optionText}>Choose from Gallery</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => setVisible(false)}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={30} color="white" />
                </TouchableOpacity>

                <Text style={styles.title}>Complete Registration</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Valid ID Front</Text>
                    <TouchableOpacity 
                        onPress={() => setShowIdFrontOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {validIdFront ? (
                            <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="add" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Valid ID Back</Text>
                    <TouchableOpacity 
                        onPress={() => setShowIdBackOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {validIdBack ? (
                            <Image source={{ uri: validIdBack }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="add" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Selfie</Text>
                    <TouchableOpacity 
                        onPress={() => setShowSelfieOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {selfie ? (
                            <Image source={{ uri: selfie }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="photo-camera" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Selfie with ID</Text>
                    <Text style={styles.subLabel}>Hold your ID next to your face</Text>
                    <TouchableOpacity 
                        onPress={() => setShowSelfieWithIdOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {selfieWithId ? (
                            <Image source={{ uri: selfieWithId }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="photo-camera" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[
                            styles.registerButton,
                            (!validIdFront || !validIdBack || !selfie || !selfieWithId) && styles.disabledButton
                        ]}
                        disabled={!validIdFront || !validIdBack || !selfie || !selfieWithId}
                    >
                        <Text style={styles.registerButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>

                {/* Option Modals */}
                {renderOptionsModal(
                    showIdFrontOptions, 
                    setShowIdFrontOptions, 
                    () => handleSelectImage('camera', setValidIdFront, 'validIdFront'), 
                    () => handleSelectImage('library', setValidIdFront, 'validIdFront'),
                    'Select ID Front Source',
                    true
                )}

                {renderOptionsModal(
                    showIdBackOptions, 
                    setShowIdBackOptions, 
                    () => handleSelectImage('camera', setValidIdBack, 'validIdBack'), 
                    () => handleSelectImage('library', setValidIdBack, 'validIdBack'),
                    'Select ID Back Source',
                    true
                )}

                {renderOptionsModal(
                    showSelfieOptions, 
                    setShowSelfieOptions, 
                    () => handleSelectImage('camera', setSelfie, 'selfie'), 
                    () => handleSelectImage('library', setSelfie, 'selfie'),
                    'Take Selfie',
                    false
                )}

                {renderOptionsModal(
                    showSelfieWithIdOptions, 
                    setShowSelfieWithIdOptions, 
                    () => handleSelectImage('camera', setSelfieWithId, 'selfieWithId'), 
                    () => handleSelectImage('library', setSelfieWithId, 'selfieWithId'),
                    'Take Selfie with ID',
                    false
                )}

                {/* Crop Options Modal */}
                <Modal
                    transparent={true}
                    visible={showCropOptions}
                    onRequestClose={() => setShowCropOptions(false)}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.optionsModal}>
                            <Text style={styles.modalTitle}>Image Options</Text>
                            
                            {selectedImageUri && (
                                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                            )}
                            
                            <Text style={styles.cropInstructions}>
                                Choose how you want to use this selected image. "Crop Image" will open a cropping interface where you can adjust the size by dragging the corners.
                            </Text>
                            
                            <View style={styles.cropButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.cropButton, styles.useAsIsButton]}
                                    onPress={handleUseAsIs}
                                >
                                    <Text style={styles.cropButtonText}>Use As Is</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.cropButton}
                                    onPress={handleCropImage}
                                >
                                    <Text style={styles.cropButtonText}>Crop Image</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowCropOptions(false);
                                    setSelectedImageUri(null);
                                    setCurrentImageType(null);
                                    setCurrentSetFunction(null);
                                }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Custom Modal */}
                <CustomModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    message={modalMessage}
                    type={modalType}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        padding: 15,
        paddingBottom: 30,
        backgroundColor: '#2C5282',
    },
    // We've removed the custom crop styles since we're using the built-in image picker cropping
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    backButton: {
        marginBottom: 10,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20,
    },
    section: {
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: 'white',
        fontWeight: 'bold',
    },
    subLabel: {
        fontSize: 14,
        marginBottom: 8,
        color: 'white',
        fontStyle: 'italic',
    },
    imagePreviewContainer: {
        backgroundColor: '#F6F6F6',
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 8,
        width: 230,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    registerButton: {
        backgroundColor: '#4FE7AF',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 30,
        marginBottom: 40,
        alignItems: 'center',
        width: '50%',
        alignSelf: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    registerButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    optionsModal: {
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
    optionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    // New styles for crop options modal
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cropButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        width: '100%',
    },
    cropButton: {
        backgroundColor: '#2D5783',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    useAsIsButton: {
        backgroundColor: '#4FE7AF',
    },
    cropButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    fullWidthOption: {
        flex: 1,
        marginHorizontal: 0,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
        color: '#2D5783',
    },
    optionIcon: {
        marginRight: 5,
    },
    cancelButton: {
        padding: 15,
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: 'red',
    },
    cropInstructions: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
});

export default RegisterPage2;