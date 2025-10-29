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
  Modal,
  TextInput,
  Platform
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import ImagePickerModal from '../../components/ImagePickerModal';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ModalSelector from 'react-native-modal-selector';

const RegisterPage2 = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [governmentId, setGovernmentId] = useState('');
    const [isOtherGovernmentId, setIsOtherGovernmentId] = useState(false);
    const [otherGovernmentId, setOtherGovernmentId] = useState('');
    const [validIdFront, setValidIdFront] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [showIdFrontOptions, setShowIdFrontOptions] = useState(false);
    const [showSelfieOptions, setShowSelfieOptions] = useState(false);
    // State for crop options modal
    const [showCropOptions, setShowCropOptions] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    // State for custom modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error');

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

    // Request permissions on component mount
    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                
                if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
                    setModalMessage('Camera and gallery permissions are required for image uploads');
                    setModalType('error');
                    setModalVisible(true);
                }
            }
        })();
    }, []);

    // Handle image selection from the ImagePickerModal
    const handleImageSelected = (imageUri, imageType = null, setFunction = null) => {
        if (imageType === 'idFront') {
            setValidIdFront(imageUri);
        } else if (imageType === 'selfie') {
            setSelfie(imageUri);
        } else if (setFunction) {
            setFunction(imageUri);
        }
    };

    // Handle when user wants to crop the selected image
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            // Use ImagePicker with editing enabled to crop the SAME image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                // Use the cropped image
                if (currentSetFunction) {
                    currentSetFunction(result.assets[0].uri);
                }
                // Close the crop options modal
                setShowCropOptions(false);
                setSelectedImageUri(null);
                setCurrentImageType(null);
                setCurrentSetFunction(null);
            } else {
                // User canceled cropping, keep the crop options modal open
                // so they can choose "Use as is" instead
                console.log('User canceled cropping');
            }
        } catch (error) {
            console.error('Error cropping image:', error);
            setModalMessage('Failed to crop image. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // Handle using the image as-is (no cropping)
    const handleUseAsIs = () => {
        if (currentSetFunction && selectedImageUri) {
            currentSetFunction(selectedImageUri);
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
        }
    };

    // Handle when image is selected from gallery and show crop options
    const handleGalleryImageSelected = async (imageUri, setImageFunction, imageType) => {
        try {
            // For web/mobile browser compatibility, we'll handle image selection differently
            if (Platform.OS === 'web') {
                // On web, we need to use a different approach
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const imageUri = event.target.result;
                            // Save the image and show crop options
                            setSelectedImageUri(imageUri);
                            setCurrentSetFunction(() => setImageFunction);
                            setCurrentImageType(imageType);
                            setShowCropOptions(true);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            } else {
                // For native apps, use the existing approach
                setSelectedImageUri(imageUri);
                setCurrentSetFunction(() => setImageFunction);
                setCurrentImageType(imageType);
                setShowCropOptions(true);
            }
        } catch (error) {
            console.error('Error handling gallery selection:', error);
            setModalMessage('Failed to select image. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // Direct image selection for web (bypasses crop options if needed)
    const handleDirectImageSelection = async (setImageFunction, showCrop = false) => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageUri = event.target.result;
                        if (showCrop) {
                            setSelectedImageUri(imageUri);
                            setCurrentSetFunction(() => setImageFunction);
                            setShowCropOptions(true);
                        } else {
                            setImageFunction(imageUri);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        }
    };

    const handleNext = () => {
        if (!governmentId || !validIdFront || !selfie) {
            setModalMessage('Please select government ID and upload all required images');
            setModalType('error');
            setModalVisible(true);
            return;
        }

        navigation.navigate('RegistrationFee', {
            ...route.params,
            governmentId: isOtherGovernmentId ? otherGovernmentId : governmentId,
            validIdFront,
            selfie
        });
    };

    // Handle ID Front selection
    const handleIdFrontPress = () => {
        if (Platform.OS === 'web') {
            // On web, use direct file input for ID front with crop options
            handleDirectImageSelection(setValidIdFront, true);
        } else {
            setShowIdFrontOptions(true);
        }
    };

    // Handle Selfie selection
    const handleSelfiePress = () => {
        if (Platform.OS === 'web') {
            // On web, use direct file input for selfie
            handleDirectImageSelection(setSelfie, false);
        } else {
            setShowSelfieOptions(true);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
                </TouchableOpacity>

                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.title}>Identity Verification</Text>
                    <Text style={styles.subLabel}>Step 2 of 4 • Provide ID and selfie</Text>
                    <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
                        <View style={{ width: '40%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
                    </View>
                </View>

                {/* Web Warning */}
                {Platform.OS === 'web' && (
                    <View style={styles.webWarning}>
                        <MaterialIcons name="info" size={16} color="#856404" />
                        <Text style={styles.webWarningText}>
                            For image uploads on web: Click the image area and select a file from your device. Camera access is not available on web.
                        </Text>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Government ID <Text style={styles.required}>*</Text></Text>
                        <ModalSelector
                            data={governmentIdOptions}
                            initValue="Select Government ID"
                            cancelText="Cancel"
                            onChange={(option) => {
                                const isOther = option.key === 'other';
                                setIsOtherGovernmentId(isOther);
                                if (isOther) {
                                    setGovernmentId('Other');
                                    setOtherGovernmentId('');
                                } else {
                                    setGovernmentId(option.label);
                                    setOtherGovernmentId('');
                                }
                            }}
                            style={styles.picker}
                            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
                            overlayStyle={{ justifyContent: 'flex-end' }}
                        >
                            <TouchableOpacity style={styles.pickerContainer}>
                                <Text style={styles.pickerText}>
                                    {isOtherGovernmentId ? `Other: ${otherGovernmentId || ''}` : (governmentId || 'Select Government ID')}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                            </TouchableOpacity>
                        </ModalSelector>
                        {isOtherGovernmentId && (
                            <View style={{ marginTop: 8 }}>
                                <TextInput
                                    placeholder="Please specify your Government ID"
                                    value={otherGovernmentId}
                                    onChangeText={(text) => {
                                        setOtherGovernmentId(text);
                                        setGovernmentId(text);
                                    }}
                                    style={styles.input}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.grid}>
                        <View style={styles.tile}>
                            <Text style={styles.label}>Valid ID - Front</Text>
                            <TouchableOpacity 
                                onPress={handleIdFrontPress} 
                                style={styles.imagePreviewContainer}
                            >
                                {validIdFront ? (
                                    <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="add" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tile}>
                            <Text style={styles.label}>Selfie</Text>
                            <TouchableOpacity 
                                onPress={handleSelfiePress} 
                                style={styles.imagePreviewContainer}
                            >
                                {selfie ? (
                                    <Image source={{ uri: selfie }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="photo-camera" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[
                            styles.primaryButton,
                            (!governmentId || !validIdFront || !selfie) && styles.buttonDisabled
                        ]}
                        disabled={!governmentId || !validIdFront || !selfie}
                    >
                        <Text style={styles.primaryButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>

                {/* Image Picker Modals - Only show on native platforms */}
                {Platform.OS !== 'web' && (
                    <>
                        <ImagePickerModal
                            visible={showIdFrontOptions}
                            onClose={() => setShowIdFrontOptions(false)}
                            onImageSelected={(imageUri) => handleImageSelected(imageUri, 'idFront', setValidIdFront)}
                            onGalleryImageSelected={(imageUri) => handleGalleryImageSelected(imageUri, setValidIdFront, 'idFront')}
                            title="Select ID Front Source"
                            showCropOptions={true}
                        />

                        <ImagePickerModal
                            visible={showSelfieOptions}
                            onClose={() => setShowSelfieOptions(false)}
                            onImageSelected={(imageUri) => handleImageSelected(imageUri, 'selfie', setSelfie)}
                            onGalleryImageSelected={(imageUri) => handleGalleryImageSelected(imageUri, setSelfie, 'selfie')}
                            title="Take Selfie"
                            showCropOptions={false}
                        />
                    </>
                )}

                {/* Crop Options Modal - Shows after gallery selection */}
                <Modal
                    transparent={true}
                    visible={showCropOptions}
                    onRequestClose={() => {
                        setShowCropOptions(false);
                        setSelectedImageUri(null);
                        setCurrentImageType(null);
                        setCurrentSetFunction(null);
                    }}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.cropOptionsModal}>
                            <Text style={styles.modalTitle}>Image Preview</Text>
                            
                            {selectedImageUri && (
                                <View style={styles.previewImageContainer}>
                                    <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                                    <Text style={styles.previewText}>Preview of your selected image</Text>
                                </View>
                            )}
                            
                            <Text style={styles.cropInstructions}>
                                Would you like to use this image as is or crop it?
                            </Text>
                            
                            <View style={styles.cropButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.cropOptionButton, styles.useAsIsButton]}
                                    onPress={handleUseAsIs}
                                >
                                    <MaterialIcons name="check" size={20} color="#fff" />
                                    <Text style={styles.cropOptionButtonText}>Use as is</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.cropOptionButton, styles.cropImageButton]}
                                    onPress={handleCropSelectedImage}
                                >
                                    <MaterialIcons name="crop" size={20} color="#fff" />
                                    <Text style={styles.cropOptionButtonText}>Crop Image</Text>
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
        justifyContent: 'flex-start',
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'left',
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        marginBottom: 8,
        color: '#0F172A',
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 13,
        marginTop: 2,
        color: '#475569',
    },
    webWarning: {
        backgroundColor: '#FFF3CD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
        flexDirection: 'row',
        alignItems: 'center',
    },
    webWarningText: {
        color: '#856404',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tile: {
        width: '48%',
        marginBottom: 14,
    },
    imagePreviewContainer: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    buttonContainer: {
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: '#1E3A5F',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        alignSelf: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    cropOptionsModal: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1E3A5F',
    },
    previewImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    previewText: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 12,
        color: '#64748B',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 4,
    },
    cropInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    cropButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        width: '100%',
    },
    cropOptionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginHorizontal: 6,
    },
    useAsIsButton: {
        backgroundColor: '#059669',
    },
    cropImageButton: {
        backgroundColor: '#1E3A5F',
    },
    cropOptionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelButton: {
        padding: 14,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: '#DC2626',
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    picker: {
        marginBottom: 10,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderColor: '#ccc',
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: 'white',
    },
    pickerText: {
        fontSize: 14,
        color: 'grey',
    },
    required: {
        color: 'red',
    },
});

const governmentIdOptions = [
    { key: 'national', label: 'National ID (PhilSys)' },
    { key: 'sss', label: 'SSS ID' },
    { key: 'philhealth', label: 'PhilHealth ID' },
    { key: 'drivers_license', label: 'Drivers License' },
    { key: 'other', label: 'Others' },
];

export default RegisterPage2;
