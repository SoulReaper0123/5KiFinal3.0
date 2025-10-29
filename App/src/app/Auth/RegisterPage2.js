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
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterPage2 = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [governmentId, setGovernmentId] = useState('');
    const [isOtherGovernmentId, setIsOtherGovernmentId] = useState(false);
    const [otherGovernmentId, setOtherGovernmentId] = useState('');
    const [validIdFront, setValidIdFront] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [showSourceOptions, setShowSourceOptions] = useState(false);
    const [pendingImageAction, setPendingImageAction] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error');
    const [showGovernmentIdModal, setShowGovernmentIdModal] = useState(false);

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

    // Request permissions on component mount
    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                try {
                    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    
                    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
                        setModalMessage('Camera and gallery permissions are required for image uploads');
                        setModalType('error');
                        setModalVisible(true);
                    }
                } catch (error) {
                    console.log('Permission request error:', error);
                }
            }
        })();
    }, []);

    // Handle government ID selection
    const handleGovernmentIdSelect = (option) => {
        const isOther = option.key === 'other';
        setIsOtherGovernmentId(isOther);
        if (isOther) {
            setGovernmentId('Other');
            setOtherGovernmentId('');
        } else {
            setGovernmentId(option.label);
            setOtherGovernmentId('');
        }
        setShowGovernmentIdModal(false);
    };

    // Show source selection options (Camera or Gallery)
    const showSourceSelection = (setImageFunction, imageType) => {
        setPendingImageAction({
            setFunction: setImageFunction,
            type: imageType
        });
        setShowSourceOptions(true);
    };

    // Handle camera selection
    const handleCameraSelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Use direct file input with camera for web
                handleWebFileInput(true);
            } else {
                // Native camera handling
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    pendingImageAction.setFunction(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Camera error:', error);
            setModalMessage('Failed to capture image. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
        
        setPendingImageAction(null);
    };

    // Handle gallery selection - SIMPLIFIED AND RELIABLE
    const handleGallerySelection = () => {
        setShowSourceOptions(false);
        
        if (Platform.OS === 'web') {
            // Use direct file input for web gallery - MOST RELIABLE METHOD
            handleWebFileInput(false);
        } else {
            // Native gallery handling
            handleNativeGallery();
        }
    };

    // Native gallery handling
    const handleNativeGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                pendingImageAction.setFunction(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Gallery error:', error);
            setModalMessage('Failed to select image from gallery. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
        setPendingImageAction(null);
    };

    // RELIABLE WEB FILE INPUT - FIXED VERSION
    const handleWebFileInput = (useCamera = false) => {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        // Set camera attribute if needed
        if (useCamera && pendingImageAction?.type === 'selfie') {
            fileInput.capture = 'user'; // Front camera for selfie
        } else if (useCamera) {
            fileInput.capture = 'environment'; // Rear camera for ID
        }

        // Style it to be hidden but functional
        fileInput.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 9999;
        `;

        // Handle file selection
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    setModalMessage('Please select a valid image file (JPEG, PNG, etc.)');
                    setModalType('error');
                    setModalVisible(true);
                    document.body.removeChild(fileInput);
                    return;
                }

                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    setModalMessage('Image size should be less than 10MB');
                    setModalType('error');
                    setModalVisible(true);
                    document.body.removeChild(fileInput);
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const imageUrl = e.target.result;
                    console.log('Image loaded successfully:', imageUrl);
                    
                    // Set the image immediately
                    if (pendingImageAction && pendingImageAction.setFunction) {
                        pendingImageAction.setFunction(imageUrl);
                    }
                    
                    // Clean up
                    document.body.removeChild(fileInput);
                };
                
                reader.onerror = () => {
                    setModalMessage('Failed to read the image file. Please try again.');
                    setModalType('error');
                    setModalVisible(true);
                    document.body.removeChild(fileInput);
                };
                
                reader.readAsDataURL(file);
            } else {
                // No file selected, clean up
                document.body.removeChild(fileInput);
            }
        };

        // Handle cancellation
        fileInput.oncancel = () => {
            document.body.removeChild(fileInput);
        };

        // Handle blur (when user clicks away)
        fileInput.onblur = () => {
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            }, 1000);
        };

        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();

        // Auto-cleanup after 30 seconds (safety net)
        setTimeout(() => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }, 30000);
    };

    // Handle ID Front selection
    const handleIdFrontPress = () => {
        showSourceSelection(setValidIdFront, 'idFront');
    };

    // Handle Selfie selection
    const handleSelfiePress = () => {
        showSourceSelection(setSelfie, 'selfie');
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

    // Remove image
    const removeImage = (setImageFunction, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setImageFunction(null);
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

                {/* Web Instructions */}
                {Platform.OS === 'web' && (
                    <View style={styles.webWarning}>
                        <MaterialIcons name="info" size={16} color="#856404" />
                        <Text style={styles.webWarningText}>
                            Tap on the image areas to upload photos from your device or take new photos.
                        </Text>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Government ID <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity 
                            style={styles.pickerContainer}
                            onPress={() => setShowGovernmentIdModal(true)}
                        >
                            <Text style={[
                                styles.pickerText,
                                governmentId && styles.pickerTextSelected
                            ]}>
                                {isOtherGovernmentId ? `Other: ${otherGovernmentId || ''}` : (governmentId || 'Select Government ID')}
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                        </TouchableOpacity>
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
                                    <View style={styles.imageWithRemove}>
                                        <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                                        <TouchableOpacity 
                                            style={styles.removeButton}
                                            onPress={(e) => removeImage(setValidIdFront, e)}
                                        >
                                            <MaterialIcons name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                        <View style={styles.imageOverlay}>
                                            <Text style={styles.changeText}>Tap to change</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <MaterialIcons name="add-a-photo" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                        <Text style={styles.uploadSubText}>ID Front Photo</Text>
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
                                    <View style={styles.imageWithRemove}>
                                        <Image source={{ uri: selfie }} style={styles.imagePreview} />
                                        <TouchableOpacity 
                                            style={styles.removeButton}
                                            onPress={(e) => removeImage(setSelfie, e)}
                                        >
                                            <MaterialIcons name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                        <View style={styles.imageOverlay}>
                                            <Text style={styles.changeText}>Tap to change</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <MaterialIcons name="face" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                        <Text style={styles.uploadSubText}>Your selfie</Text>
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

                {/* Government ID Selection Modal */}
                <Modal
                    transparent={true}
                    visible={showGovernmentIdModal}
                    onRequestClose={() => setShowGovernmentIdModal(false)}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.governmentIdModal}>
                            <Text style={styles.modalTitle}>Select Government ID</Text>
                            
                            <View style={styles.optionsContainer}>
                                {governmentIdOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.key}
                                        style={styles.optionItem}
                                        onPress={() => handleGovernmentIdSelect(option)}
                                    >
                                        <Text style={styles.optionText}>{option.label}</Text>
                                        <MaterialIcons name="chevron-right" size={20} color="#64748B" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setShowGovernmentIdModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Source Selection Modal */}
                <Modal
                    transparent={true}
                    visible={showSourceOptions}
                    onRequestClose={() => {
                        setShowSourceOptions(false);
                        setPendingImageAction(null);
                    }}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.sourceOptionsModal}>
                            <Text style={styles.modalTitle}>Upload Photo</Text>
                            
                            <Text style={styles.sourceInstructions}>
                                Choose how to add your {pendingImageAction?.type === 'idFront' ? 'ID photo' : 'selfie'}
                            </Text>
                            
                            <View style={styles.sourceButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.sourceOptionButton, styles.cameraButton]}
                                    onPress={handleCameraSelection}
                                >
                                    <MaterialIcons name="photo-camera" size={30} color="#fff" />
                                    <Text style={styles.sourceOptionButtonText}>Take Photo</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.sourceOptionButton, styles.galleryButton]}
                                    onPress={handleGallerySelection}
                                >
                                    <MaterialIcons name="photo-library" size={30} color="#fff" />
                                    <Text style={styles.sourceOptionButtonText}>Choose from Files</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowSourceOptions(false);
                                    setPendingImageAction(null);
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
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    imageWithRemove: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        alignItems: 'center',
    },
    changeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '600',
    },
    uploadSubText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 2,
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
    governmentIdModal: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        maxHeight: '80%',
    },
    sourceOptionsModal: {
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
    optionsContainer: {
        marginBottom: 16,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionText: {
        fontSize: 16,
        color: '#0F172A',
    },
    sourceInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    sourceButtonsContainer: {
        marginBottom: 16,
        width: '100%',
    },
    sourceOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
    },
    cameraButton: {
        backgroundColor: '#1E3A5F',
    },
    galleryButton: {
        backgroundColor: '#059669',
    },
    sourceOptionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
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
    pickerTextSelected: {
        color: '#0F172A',
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
