import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
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

  // Robust date parser (handles Firebase Timestamp and strings like "August 20, 2025 at 00:00")
  const parseDateTime = (dateInput) => {
    try {
      if (!dateInput) return null;
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        return new Date(dateInput.seconds * 1000);
      }
      if (typeof dateInput === 'string') {
        // Handle "mm/dd/yyyy at HH:MM" and "Month DD, YYYY at HH:MM"
        if (dateInput.includes(' at ')) {
          const [datePart, timePart] = dateInput.split(' at ');
          // Try mm/dd/yyyy first
          if (datePart.includes('/')) {
            const [month, day, year] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            return new Date(year, month - 1, day, hours, minutes);
          } else {
            const parsed = new Date(dateInput.replace(' at ', ' '));
            if (!isNaN(parsed.getTime())) return parsed;
          }
        }
        // Handle "Month DD, YYYY"
        if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
          const parsed = new Date(dateInput + ' 00:00:00');
          if (!isNaN(parsed.getTime())) return parsed;
        }
        // Handle YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          return new Date(dateInput + 'T00:00:00');
        }
        // Fallback: native parsing
        const parsed = new Date(dateInput);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
      return null;
    } catch {
      return null;
    }
  };

  const isOverdue = (raw) => {
    const d = parseDateTime(raw);
    if (!d) return false;
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return startToday >= startDue; // red when due today or overdue
  };

  const dueRaw = loan.dueDate || loan.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

  const details = [
    { label: 'Loan Type', value: loan.loanType || 'N/A' },
    { label: 'Loan ID', value: loan.transactionId || loan._loanId || 'N/A' },
    { label: 'ApprovedAmount', value: formatPeso(loan.loanAmount) },
    { label: 'Outstanding Balance', value: formatPeso(loan.outstandingBalance ?? loan.loanAmount) },
    { label: 'Date Applied', value: formatDate(loan.dateApplied) },
    { label: 'Date Approved', value: formatDate(loan.dateApproved) },
    { label: 'Term', value: loan.term ? `${loan.term} months` : 'N/A' },
    { label: 'Interest Rate', value: `${Number(loan.interestRate || 0).toFixed(2)}%` },
    { label: 'Interest', value: formatPeso(loan.interest) },
    { label: 'Principal Amount', value: formatPeso(loan.monthlyPayment) },
    { label: 'Total Amount', value: formatPeso(loan.totalMonthlyPayment) },
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
          <View key={idx} style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }]}> 
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
        <View style={[styles.row, { borderBottomWidth: 0 }]}> 
          <Text style={styles.label}>DueDate</Text>
          <View style={{ maxWidth: '100%', alignItems: 'flex-end' }}>
            <Text style={[styles.value, dueOverdue && { color: '#D32F2F' }]}>
              {formatDate(dueRaw)}
            </Text>
            {dueOverdue && <Text style={{ color: '#D32F2F', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Overdue</Text>}
          </View>
        </View>
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