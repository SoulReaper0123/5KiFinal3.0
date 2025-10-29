import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    
    // State for custom modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error');

    // Refs for hidden file inputs (web only)
    const idFrontFileInputRef = useRef(null);
    const selfieFileInputRef = useRef(null);

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

    // Web-compatible file selection handler
    const handleWebFileSelect = (setImageFunction, fileInputRef) => {
        if (Platform.OS !== 'web') return;
        
        // Create a file input if it doesn't exist
        if (!fileInputRef.current) {
            fileInputRef.current = document.createElement('input');
            fileInputRef.current.type = 'file';
            fileInputRef.current.accept = 'image/*';
            fileInputRef.current.style.display = 'none';
            
            fileInputRef.current.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Check file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        setModalMessage('File size too large. Please select an image smaller than 10MB.');
                        setModalType('error');
                        setModalVisible(true);
                        return;
                    }
                    
                    // Check file type
                    if (!file.type.startsWith('image/')) {
                        setModalMessage('Please select a valid image file.');
                        setModalType('error');
                        setModalVisible(true);
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageUri = event.target.result;
                        setImageFunction(imageUri);
                    };
                    reader.onerror = () => {
                        setModalMessage('Failed to read the selected file.');
                        setModalType('error');
                        setModalVisible(true);
                    };
                    reader.readAsDataURL(file);
                }
                
                // Reset the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            
            document.body.appendChild(fileInputRef.current);
        }
        
        // Trigger file selection
        fileInputRef.current.click();
    };

    // Handle image selection from camera (mobile) or direct file input (web)
    const handleImageSelection = async (source, setImageFunction, imageType) => {
        if (Platform.OS === 'web') {
            if (source === 'gallery') {
                // Use web file input for gallery selection
                if (imageType === 'idFront') {
                    handleWebFileSelect(setImageFunction, idFrontFileInputRef);
                } else if (imageType === 'selfie') {
                    handleWebFileSelect(setImageFunction, selfieFileInputRef);
                }
                return;
            } else if (source === 'camera') {
                // For web camera, we'll use the ImagePickerModal which handles it better
                if (imageType === 'selfie') {
                    setShowSelfieOptions(true);
                } else {
                    setShowIdFrontOptions(true);
                }
                return;
            }
        }

        // Mobile handling
        try {
            const { status } = source === 'camera' 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
                
            if (status !== 'granted') {
                setModalMessage(`We need permission to access your ${source === 'camera' ? 'camera' : 'media library'}`);
                setModalType('error');
                setModalVisible(true);
                return;
            }

            const result = await (source === 'camera' 
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 0.8,
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 0.8,
                }));

            if (!result.canceled && result.assets && result.assets[0]) {
                setImageFunction(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            setModalMessage('Failed to select image');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // Handle direct image selection from ImagePickerModal
    const handleImageSelected = (imageUri, imageType = null) => {
        if (imageType === 'idFront') {
            setValidIdFront(imageUri);
        } else if (imageType === 'selfie') {
            setSelfie(imageUri);
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

    // Clean up on unmount (web only)
    React.useEffect(() => {
        return () => {
            if (Platform.OS === 'web') {
                if (idFrontFileInputRef.current) {
                    document.body.removeChild(idFrontFileInputRef.current);
                }
                if (selfieFileInputRef.current) {
                    document.body.removeChild(selfieFileInputRef.current);
                }
            }
        };
    }, []);

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

                {/* Web Instructions */}
                {Platform.OS === 'web' && (
                    <View style={styles.webInfo}>
                        <MaterialIcons name="info" size={16} color="#1E3A5F" />
                        <Text style={styles.webInfoText}>
                            Click on the image areas to upload photos. Your browser will open a file selector.
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
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        // Direct file selection for web
                                        handleWebFileSelect(setValidIdFront, idFrontFileInputRef);
                                    } else {
                                        setShowIdFrontOptions(true);
                                    }
                                }} 
                                style={styles.imagePreviewContainer}
                            >
                                {validIdFront ? (
                                    <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="add" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>
                                            {Platform.OS === 'web' ? 'Click to Upload' : 'Tap to Add'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tile}>
                            <Text style={styles.label}>Selfie</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        // Direct file selection for web
                                        handleWebFileSelect(setSelfie, selfieFileInputRef);
                                    } else {
                                        setShowSelfieOptions(true);
                                    }
                                }} 
                                style={styles.imagePreviewContainer}
                            >
                                {selfie ? (
                                    <Image source={{ uri: selfie }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="photo-camera" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>
                                            {Platform.OS === 'web' ? 'Click to Upload' : 'Tap to Add'}
                                        </Text>
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

                {/* Image Picker Modals - For mobile and web camera */}
                <ImagePickerModal
                    visible={showIdFrontOptions}
                    onClose={() => setShowIdFrontOptions(false)}
                    onImageSelected={(imageUri) => handleImageSelected(imageUri, 'idFront')}
                    title="Select ID Front Source"
                    showCropOptions={false}
                />

                <ImagePickerModal
                    visible={showSelfieOptions}
                    onClose={() => setShowSelfieOptions(false)}
                    onImageSelected={(imageUri) => handleImageSelected(imageUri, 'selfie')}
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
    subLabel: {
        fontSize: 13,
        marginTop: 2,
        color: '#475569',
    },
    webInfo: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    webInfoText: {
        color: '#1E40AF',
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
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
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
