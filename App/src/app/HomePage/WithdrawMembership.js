import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function WithdrawMembership() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    address: '',
    contact: '',
    email: '',
    joined: '',
    reason: '',
    hasLoan: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = () => {
    const {
      firstName,
      lastName,
      dob,
      address,
      contact,
      email,
      joined,
      reason,
      hasLoan,
    } = form;

    if (
      !firstName ||
      !lastName ||
      !dob ||
      !address ||
      !contact ||
      !email ||
      !joined ||
      !reason ||
      !hasLoan ||
      !agreed
    ) {
      Alert.alert('Incomplete Form', 'Please complete all required fields.');
      return;
    }

    setModalVisible(true);
    setForm({
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      address: '',
      contact: '',
      email: '',
      joined: '',
      reason: '',
      hasLoan: '',
    });
    setAgreed(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      {/* Header Title */}
      <Text style={styles.title}>Membership Withdrawal</Text>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TextInput
            placeholder="First Name"
            value={form.firstName}
            onChangeText={(text) => setForm({ ...form, firstName: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Middle Name"
            value={form.middleName}
            onChangeText={(text) => setForm({ ...form, middleName: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Last Name"
            value={form.lastName}
            onChangeText={(text) => setForm({ ...form, lastName: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Date of Birth"
            value={form.dob}
            onChangeText={(text) => setForm({ ...form, dob: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Contact Number"
            value={form.contact}
            onChangeText={(text) => setForm({ ...form, contact: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Date Joined"
            value={form.joined}
            onChangeText={(text) => setForm({ ...form, joined: text })}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Reason for withdrawal</Text>
          {['Relocation', 'Financial', 'No longer interested', 'Others'].map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.radioOption}
              onPress={() => setForm({ ...form, reason: r })}
            >
              <View style={styles.radioCircle}>
                {form.reason === r && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{r}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Do you have existing loans?</Text>
          {['Yes', 'No'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.radioOption}
              onPress={() => setForm({ ...form, hasLoan: opt })}
            >
              <View style={styles.radioCircle}>
                {form.hasLoan === opt && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <MaterialIcons
              name={agreed ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={agreed ? '#2D5783' : '#888'}
            />
            <Text style={styles.checkboxLabel}>
              I agree and wish to proceed with my request.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalText}>
              Your membership withdrawal request has been submitted.
            </Text>
            <Pressable style={styles.okButton} onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'white' }}>Ok</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2D5783',
  },
  backButton: {
    marginTop: 40,
    marginStart: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'white',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    flex: 1,
    paddingStart: 50,
    paddingEnd: 50,
    paddingTop: 20,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2D5783',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D5783',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#00c853',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#2D5783',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
});
