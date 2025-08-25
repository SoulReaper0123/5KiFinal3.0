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
    // Dividend Distribution Percentages
    MembersDividendPercentage: '60',
    FiveKiEarningsPercentage: '40',
    // Members Dividend Breakdown
    InvestmentSharePercentage: '60',
    PatronageSharePercentage: '25',
    ActiveMonthsPercentage: '15',
  });

  const [newTerm, setNewTerm] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const db = getDatabase();

  // Helper function to format peso amounts with at least 2 decimal places
  const formatPesoAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toFixed(2);
  };

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
          // Dividend Distribution Percentages
          MembersDividendPercentage: data.MembersDividendPercentage?.toString() || '60',
          FiveKiEarningsPercentage: data.FiveKiEarningsPercentage?.toString() || '40',
          // Members Dividend Breakdown
          InvestmentSharePercentage: data.InvestmentSharePercentage?.toString() || '60',
          PatronageSharePercentage: data.PatronageSharePercentage?.toString() || '25',
          ActiveMonthsPercentage: data.ActiveMonthsPercentage?.toString() || '15',
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
    // Validate that dividend totals equal 100%
    const distTotal = parseFloat(settings.MembersDividendPercentage || 0) + parseFloat(settings.FiveKiEarningsPercentage || 0);
    const breakdownTotal = parseFloat(settings.InvestmentSharePercentage || 0) + parseFloat(settings.PatronageSharePercentage || 0) + parseFloat(settings.ActiveMonthsPercentage || 0);
    
    if (distTotal !== 100) {
      Alert.alert('Validation Error', 'Dividend Distribution must total 100%.');
      setConfirmationModalVisible(false);
      return;
    }
    if (breakdownTotal !== 100) {
      Alert.alert('Validation Error', 'Members Dividend Breakdown must total 100%.');
      setConfirmationModalVisible(false);
      return;
    }

    const settingsRef = ref(db, 'Settings/');

    const parsedInterest = {};
    for (let key in settings.InterestRate) {
      const val = parseFloat(settings.InterestRate[key]);
      if (!isNaN(val)) parsedInterest[key] = val;
    }

    const updatedData = {
      LoanPercentage: parseFloat(settings.LoanPercentage),
      Funds: parseFloat(parseFloat(settings.Funds || 0).toFixed(2)),
      InterestRate: parsedInterest,
      AdvancedPayments: settings.AdvancedPayments,
      DividendDate: settings.DividendDate,
      // Dividend Distribution Percentages
      MembersDividendPercentage: parseFloat(settings.MembersDividendPercentage) || 60,
      FiveKiEarningsPercentage: parseFloat(settings.FiveKiEarningsPercentage) || 40,
      // Members Dividend Breakdown
      InvestmentSharePercentage: parseFloat(settings.InvestmentSharePercentage) || 60,
      PatronageSharePercentage: parseFloat(settings.PatronageSharePercentage) || 25,
      ActiveMonthsPercentage: parseFloat(settings.ActiveMonthsPercentage) || 15,
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
              <Text style={styles.staticText}>₱{formatPesoAmount(settings.Funds)}</Text>
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



        {/* Dividend Distribution Percentages */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dividend Distribution</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Members Dividend</Text>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={settings.MembersDividendPercentage}
                  onChangeText={(text) => handleInputChange('MembersDividendPercentage', text)}
                  keyboardType="numeric"
                  placeholder="60"
                />
                <Text style={styles.label}>%</Text>
              </View>
            ) : (
              <Text style={styles.staticText}>{settings.MembersDividendPercentage}%</Text>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>5Ki Earnings</Text>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={settings.FiveKiEarningsPercentage}
                  onChangeText={(text) => handleInputChange('FiveKiEarningsPercentage', text)}
                  keyboardType="numeric"
                  placeholder="40"
                />
                <Text style={styles.label}>%</Text>
              </View>
            ) : (
              <Text style={styles.staticText}>{settings.FiveKiEarningsPercentage}%</Text>
            )}
          </View>
          {editMode && (
            <Text style={[
              styles.validationText,
              {color: (parseFloat(settings.MembersDividendPercentage || 0) + parseFloat(settings.FiveKiEarningsPercentage || 0)) === 100 ? '#4CAF50' : '#f44336'}
            ]}>
              Total: {(parseFloat(settings.MembersDividendPercentage || 0) + parseFloat(settings.FiveKiEarningsPercentage || 0)).toFixed(1)}% 
              {(parseFloat(settings.MembersDividendPercentage || 0) + parseFloat(settings.FiveKiEarningsPercentage || 0)) === 100 ? ' ✓' : ' (Must equal 100%)'}
            </Text>
          )}
        </View>

        {/* Members Dividend Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Members Dividend Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Investment Share</Text>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={settings.InvestmentSharePercentage}
                  onChangeText={(text) => handleInputChange('InvestmentSharePercentage', text)}
                  keyboardType="numeric"
                  placeholder="60"
                />
                <Text style={styles.label}>%</Text>
              </View>
            ) : (
              <Text style={styles.staticText}>{settings.InvestmentSharePercentage}%</Text>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Patronage Share</Text>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={settings.PatronageSharePercentage}
                  onChangeText={(text) => handleInputChange('PatronageSharePercentage', text)}
                  keyboardType="numeric"
                  placeholder="25"
                />
                <Text style={styles.label}>%</Text>
              </View>
            ) : (
              <Text style={styles.staticText}>{settings.PatronageSharePercentage}%</Text>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Months</Text>
            {editMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={settings.ActiveMonthsPercentage}
                  onChangeText={(text) => handleInputChange('ActiveMonthsPercentage', text)}
                  keyboardType="numeric"
                  placeholder="15"
                />
                <Text style={styles.label}>%</Text>
              </View>
            ) : (
              <Text style={styles.staticText}>{settings.ActiveMonthsPercentage}%</Text>
            )}
          </View>
          {editMode && (
            <Text style={[
              styles.validationText,
              {color: (parseFloat(settings.InvestmentSharePercentage || 0) + parseFloat(settings.PatronageSharePercentage || 0) + parseFloat(settings.ActiveMonthsPercentage || 0)) === 100 ? '#4CAF50' : '#f44336'}
            ]}>
              Total: {(parseFloat(settings.InvestmentSharePercentage || 0) + parseFloat(settings.PatronageSharePercentage || 0) + parseFloat(settings.ActiveMonthsPercentage || 0)).toFixed(1)}% 
              {(parseFloat(settings.InvestmentSharePercentage || 0) + parseFloat(settings.PatronageSharePercentage || 0) + parseFloat(settings.ActiveMonthsPercentage || 0)) === 100 ? ' ✓' : ' (Must equal 100%)'}
            </Text>
          )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: 15,
    textAlign: 'center',
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default SystemSettings;
