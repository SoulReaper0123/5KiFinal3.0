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
  TextInput
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

    const handleSelectImage = async (source, setImageFunction, imageType) => {
        // First, ensure we have a valid function to set the image
        if (typeof setImageFunction !== 'function') {
            console.error('setImageFunction is not a function:', setImageFunction);
            Alert.alert('Error', 'An internal error occurred. Please try again.');
            return;
        }
        
        // Close all option modals first
        setShowIdFrontOptions(false);
        setShowSelfieOptions(false);
        
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
                    <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
                </TouchableOpacity>

                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.title}>Identity Verification</Text>
                    <Text style={styles.subLabel}>Step 2 of 4 • Provide ID and selfie</Text>
                    <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
                        <View style={{ width: '40%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
                    </View>
                </View>

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
                            <TouchableOpacity onPress={() => setShowIdFrontOptions(true)} style={styles.imagePreviewContainer}>
                                {validIdFront ? (
                                    <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="add" size={40} color="#1E3A5F" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tile}>
                            <Text style={styles.label}>Selfie</Text>
                            <TouchableOpacity onPress={() => setShowSelfieOptions(true)} style={styles.imagePreviewContainer}>
                                {selfie ? (
                                    <Image source={{ uri: selfie }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="photo-camera" size={40} color="#1E3A5F" />
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

                {/* Image Picker Modals */}
                <ImagePickerModal
                    visible={showIdFrontOptions}
                    onClose={() => setShowIdFrontOptions(false)}
                    onImageSelected={(imageUri) => {
                        setValidIdFront(imageUri);
                    }}
                    title="Select ID Front Source"
                    showCropOptions={true}
                />

                <ImagePickerModal
                    visible={showSelfieOptions}
                    onClose={() => setShowSelfieOptions(false)}
                    onImageSelected={(imageUri) => {
                        setSelfie(imageUri);
                    }}
                    title="Take Selfie"
                    showCropOptions={false}
                    cameraOnly={true}
                />



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
        backgroundColor: '#F8FAFC', // light neutral background
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
        color: '#0F172A', // slate-900
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
        color: '#475569', // slate-600
    },
    // Card container that wraps all tiles
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
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    buttonContainer: {
        marginTop: 8,
    },
    // Primary button style (reusable)
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
    optionsModal: {
        backgroundColor: 'white',
        padding: 18,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
        color: '#1E3A5F',
    },
    optionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cropButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        width: '100%',
    },
    cropButton: {
        backgroundColor: '#1E3A5F',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    useAsIsButton: {
        backgroundColor: '#059669', // emerald accent
    },
    cropButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    optionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: '#1E3A5F',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    fullWidthOption: {
        flex: 1,
        marginHorizontal: 0,
    },
    optionText: {
        fontSize: 15,
        marginLeft: 10,
        color: '#1E3A5F',
        fontWeight: '600',
    },
    optionIcon: {
        marginRight: 5,
    },
    cancelButton: {
        padding: 14,
        marginTop: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        color: '#DC2626',
        fontWeight: '600',
    },
    cropInstructions: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 10,
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
