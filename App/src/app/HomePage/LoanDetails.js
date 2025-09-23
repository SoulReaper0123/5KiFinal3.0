import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const formatPeso = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (raw) => {
  if (!raw) return 'N/A';
  try {
    if (typeof raw === 'object' && raw.seconds) {
      const d = new Date(raw.seconds * 1000);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return String(raw);
  }
};

export default function LoanDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

  const details = [
    { label: 'Loan ID', value: loan.transactionId || loan._loanId || 'N/A' },
    { label: 'Loan Type', value: loan.loanType || 'N/A' },
    { label: 'Approved Amount', value: formatPeso(loan.loanAmount) },
    { label: 'Outstanding Balance', value: formatPeso(loan.outstandingBalance ?? loan.loanAmount) },
    { label: 'Date Applied', value: formatDate(loan.dateApplied) },
    { label: 'Date Approved', value: formatDate(loan.dateApproved) },
    { label: 'Interest Rate', value: `${Number(loan.interestRate || 0).toFixed(2)}%` },
    { label: 'Total Interest', value: formatPeso(loan.interest) },
    { label: 'Terms', value: loan.term ? `${loan.term} months` : 'N/A' },
    { label: 'Monthly Payment', value: formatPeso(loan.monthlyPayment) },
    { label: 'Due Date', value: formatDate(loan.dueDate || loan.nextDueDate) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Loan Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        {details.map((row, idx) => (
          <View key={idx} style={[styles.row, idx === details.length - 1 && { borderBottomWidth: 0 }]}> 
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 30 },
  headerBar: {
    marginHorizontal: 16, marginTop: 10, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#E8F1FB', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  value: { color: '#0F172A', fontSize: 16, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
});