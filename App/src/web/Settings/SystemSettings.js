import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    LoanPercentage: '',
    Funds: '',
    InterestRate: {},
    AdvancedPayments: false,
    DividendDate: '',
    PenaltyValue: '',
    PenaltyType: 'percentage',
  });

  const [newTerm, setNewTerm] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const db = getDatabase();

  useEffect(() => {
    const settingsRef = ref(db, 'Settings/');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          LoanPercentage: data.LoanPercentage?.toString() || '',
          Funds: data.Funds?.toString() || '',
          InterestRate: Object.fromEntries(
            Object.entries(data.InterestRate || {}).map(([key, val]) => [key, val.toString()])
          ),
          AdvancedPayments: data.AdvancedPayments || false,
          DividendDate: data.DividendDate || '',
          PenaltyValue: data.PenaltyValue?.toString() || '',
          PenaltyType: data.PenaltyType || 'percentage',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (key, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) return;
    setSettings({ ...settings, [key]: clean });
  };

  const handleInterestChange = (term, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) return;

    setSettings((prev) => ({
      ...prev,
      InterestRate: {
        ...prev.InterestRate,
        [term]: clean,
      },
    }));
  };

  const handleAddTerm = () => {
    if (!newTerm || !newRate) {
      Alert.alert('Error', 'Please enter both term and interest rate.');
      return;
    }

    if (settings.InterestRate[newTerm]) {
      Alert.alert('Error', 'This term already exists.');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      InterestRate: {
        ...prev.InterestRate,
        [newTerm]: newRate,
      },
    }));

    setNewTerm('');
    setNewRate('');
  };

  const handleDeleteTerm = (term) => {
    const updatedRates = { ...settings.InterestRate };
    delete updatedRates[term];

    setSettings((prev) => ({
      ...prev,
      InterestRate: updatedRates,
    }));
  };

  const handleSave = () => {
    setConfirmationModalVisible(true);
  };

  const confirmSave = () => {
    const settingsRef = ref(db, 'Settings/');

    const parsedInterest = {};
    for (let key in settings.InterestRate) {
      const val = parseFloat(settings.InterestRate[key]);
      if (!isNaN(val)) parsedInterest[key] = val;
    }

    const updatedData = {
      LoanPercentage: parseFloat(settings.LoanPercentage),
      Funds: parseFloat(settings.Funds),
      InterestRate: parsedInterest,
      AdvancedPayments: settings.AdvancedPayments,
      DividendDate: settings.DividendDate,
      PenaltyValue: parseFloat(settings.PenaltyValue),
      PenaltyType: settings.PenaltyType,
    };

    update(settingsRef, updatedData)
      .then(() => {
        Alert.alert('Success', 'Settings updated successfully!');
        setEditMode(false);
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });

    setConfirmationModalVisible(false);
  };

  const handleDateChange = (date) => {
    const formattedDate = new Date(date.dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setSettings({ ...settings, DividendDate: formattedDate });
  };

  if (loading) return <Text style={styles.loading}>Loading settings...</Text>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>System Settings</Text>

        {/* Loan Percentage & Funds Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Percentage</Text>
            {editMode ? (
              <TextInput style={styles.input} value={settings.LoanPercentage} onChangeText={(text) => handleInputChange('LoanPercentage', text)} keyboardType="numeric" />
            ) : (
              <Text style={styles.staticText}>{settings.LoanPercentage}%</Text>
            )}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Funds</Text>
            {editMode ? (
              <TextInput style={styles.input} value={settings.Funds} onChangeText={(text) => handleInputChange('Funds', text)} keyboardType="numeric" />
            ) : (
              <Text style={styles.staticText}>₱{settings.Funds}</Text>
            )}
          </View>
        </View>

        {/* Interest Rates Card */}
        <View style={styles.card}>
          <Text style={[styles.label, { marginBottom: 10 }]}>Interest Rates (per term)</Text>
          {Object.entries(settings.InterestRate).map(([term, rate]) => (
            <View key={term} style={styles.row}>
              <Text style={styles.label}>{term} months</Text>
              {editMode ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { width: 80 }]}
                    value={rate}
                    onChangeText={(text) => handleInterestChange(term, text)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => handleDeleteTerm(term)}>
                    <Ionicons name="trash" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.staticText}>{rate}%</Text>
              )}
            </View>
          ))}
          {editMode && (
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="New Term" value={newTerm} onChangeText={setNewTerm} />
              <TextInput style={styles.input} placeholder="Interest Rate" value={newRate} onChangeText={setNewRate} keyboardType="numeric" />
              <TouchableOpacity style={styles.addTermBtn} onPress={handleAddTerm}>
                <Text style={styles.btnText}>Add Term</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Advanced Payments Switch */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Advanced Payments</Text>
            <Switch
              value={settings.AdvancedPayments}
              onValueChange={(value) => setSettings({ ...settings, AdvancedPayments: value })}
              disabled={!editMode}
            />
          </View>
        </View>

        {/* Penalty Value Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Penalty Value</Text>
            {editMode ? (
              <TextInput style={styles.input} value={settings.PenaltyValue} onChangeText={(text) => handleInputChange('PenaltyValue', text)} keyboardType="numeric" />
            ) : (
              <Text style={styles.staticText}>₱{settings.PenaltyValue}</Text>
            )}
          </View>
        </View>

        {/* Dividend Date */}
        <View style={styles.card}>
          <View style={[styles.row, styles.dividendDateRow]}>
            <Text style={styles.label}>Dividend Date</Text>
            {editMode ? (
              <Calendar onDayPress={handleDateChange} markedDates={{ [settings.DividendDate]: { selected: true } }} />
            ) : (
              <Text style={styles.staticText}>{settings.DividendDate}</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={editMode ? handleSave : () => setEditMode(true)}>
          <Text style={styles.btnText}>{editMode ? 'Save Settings' : 'Edit Settings'}</Text>
        </TouchableOpacity>

        {/* Confirmation Modal */}
        <Modal visible={confirmationModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Are you sure you want to save changes?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setConfirmationModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmSave}>
                  <Text style={styles.modalBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  staticText: {
    fontSize: 16,
    color: '#555',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  addTermBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalBtnCancel: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalBtnConfirm: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
});

export default SystemSettings;
