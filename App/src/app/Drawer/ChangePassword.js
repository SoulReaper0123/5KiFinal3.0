import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { EmailAuthProvider } from 'firebase/auth';

const ChangePassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*_(),.?":{}|<>]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    return {
      isValid: minLength && hasSpecialChar && hasNumber && hasUpper && hasLower,
      requirements: {
        minLength,
        hasSpecialChar,
        hasNumber,
        hasUpper,
        hasLower,
      },
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = currentPassword && 
                     newPassword && 
                     confirmPassword && 
                     passwordValidation.isValid && 
                     passwordsMatch;

   const handleChangePassword = async () => {
  if (!isFormValid) return;

  setLoading(true);
  try {
    // Verify current password
    const credential = EmailAuthProvider.credential(email, currentPassword);
    await auth.currentUser.reauthenticateWithCredential(credential);
    
    // Update password
    await auth.currentUser.updatePassword(newPassword);
    
    setAlertMessage('Password changed successfully!');
    setAlertType('success');
    setAlertModalVisible(true);
  } catch (error) {
    console.error('Password change error:', error);
    
    let errorMessage = 'Failed to change password. Please try again.';
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'The current password is incorrect.';
        break;
      case 'auth/weak-password':
        errorMessage = 'The new password is too weak. Please use a stronger password.';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'This operation requires recent authentication. Please log out and log back in.';
        break;
      default:
        errorMessage = 'An error occurred. Please try again.';
    }
    
    setAlertMessage(errorMessage);
    setAlertType('error');
    setAlertModalVisible(true);
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* top header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        {/* card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a secure password</Text>
          <Text style={styles.cardSubtitle}>Your password must meet the requirements below.</Text>

          {/* Current Password */}
          <Text style={styles.fieldLabel}>Current Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={22} color="#7B8794" />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={22} color="#7B8794" />
            </TouchableOpacity>
          </View>

          {/* requirements (matches create password UI) */}
          <View style={styles.requirementsBox}>
            <RequirementItem
              met={passwordValidation.requirements.minLength}
              text="Minimum of 8 characters"
            />
            <RequirementItem
              met={passwordValidation.requirements.hasSpecialChar}
              text="At least one special character (including _)"
            />
            <RequirementItem
              met={passwordValidation.requirements.hasNumber}
              text="At least one numeric digit"
            />
            <RequirementItem
              met={passwordValidation.requirements.hasUpper && passwordValidation.requirements.hasLower}
              text="Includes both uppercase and lowercase letters"
            />
          </View>

          {/* Confirm Password */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirm Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#7B8794" />
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <RequirementItem met={passwordsMatch} text="Passwords match" />
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleChangePassword}
            style={[styles.primaryButton, (!isFormValid || loading) && styles.disabledButton]}
            disabled={!isFormValid || loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Change Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success') {
            navigation.goBack();
          }
        }}
        message={alertMessage}
        type={alertType}
      />
    </View>
  );
};

/* Small requirement row used by Create Password UI */
const RequirementItem = ({ met, text }) => (
  <View style={styles.requirementRow}>
    <MaterialIcons name={met ? 'check-circle' : 'radio-button-unchecked'} size={20} color={met ? '#16A34A' : '#9CA3AF'} />
    <Text style={[styles.requirementText, met && styles.requirementMet]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 6,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EEF6',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FAFBFD',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 6,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsBox: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#FBFDFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  requirementText: {
    marginLeft: 10,
    color: '#6B7280',
    fontSize: 13,
  },
  requirementMet: {
    color: '#16A34A',
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#1E3A5F',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default ChangePassword;