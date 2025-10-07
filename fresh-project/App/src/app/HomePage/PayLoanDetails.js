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

// Parse flexible date inputs like Firebase Timestamp, "Month DD, YYYY", or "MM/DD/YYYY at HH:MM"
const parseDateTime = (dateInput) => {
  try {
    if (!dateInput) return null;
    if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
      return new Date(dateInput.seconds * 1000);
    }
    if (typeof dateInput === 'string') {
      if (dateInput.includes(' at ')) {
        const [datePart, timePart] = dateInput.split(' at ');
        if (datePart.includes('/')) {
          const [month, day, year] = datePart.split('/');
          const [hours, minutes] = timePart.split(':');
          return new Date(year, month - 1, day, hours, minutes);
        } else {
          const parsed = new Date(dateInput.replace(' at ', ' '));
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
        const parsed = new Date(dateInput + ' 00:00:00');
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return new Date(dateInput + 'T00:00:00');
      }
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
    return null;
  } catch {
    return null;
  }
};

// Determine if a due date is past today (due today or overdue)
const isOverdue = (raw) => {
  const d = parseDateTime(raw);
  if (!d) return false;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return startToday >= startDue;
};

export default function PayLoanDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

  const dueRaw = loan.dueDate || loan.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

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
  ];

  // Compute overdue days, penalty, and total due similar to PayLoan modal
  const computeOverdueDays = (raw) => {
    const d = parseDateTime(raw);
    if (!d) return 0;
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (startToday < startDue) return 0;
    const diffMs = startToday.getTime() - startDue.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const overdueDays = computeOverdueDays(dueRaw);
  const loanInterest = parseFloat(loan.interest) || 0;
  const penalty = overdueDays > 0 ? loanInterest * (overdueDays / 30) : 0;
  const monthly = parseFloat(loan.totalMonthlyPayment || loan.monthlyPayment || 0) || 0;
  const totalDue = monthly + penalty;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Pay Loan Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        {details.map((row, idx) => (
          <View key={idx} style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }]}> 
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
        {/* Due Date with overdue indicator */}
        <View style={[styles.row, { borderBottomWidth: overdueDays > 0 ? 1 : 0, borderBottomColor: '#E2E8F0' }]}> 
          <Text style={styles.label}>Due Date</Text>
          <View style={{ maxWidth: '60%', alignItems: 'flex-end' }}>
            <Text style={[styles.value, dueOverdue && styles.valueOverdue]}>
              {formatDate(dueRaw)}
            </Text>
            {dueOverdue && <Text style={styles.overdueText}>Overdue</Text>}
          </View>
        </View>
        {/* Late fee and total due like PayLoan modal */}
        {overdueDays > 0 && (
          <>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }]}> 
              <Text style={styles.label}>Late Fee</Text>
              <View style={{ maxWidth: '60%', alignItems: 'flex-end' }}>
                <Text style={[styles.value, styles.valueOverdue]}>{formatPeso(penalty)}</Text>
                <Text style={styles.smallNote}>({formatPeso(loanInterest)} × {overdueDays}/30 days)</Text>
              </View>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}> 
              <Text style={styles.label}>Total Amount Due</Text>
              <Text style={[styles.value, styles.valueOverdue]}>{formatPeso(totalDue)}</Text>
            </View>
          </>
        )}
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
  row: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  value: { color: '#0F172A', fontSize: 16, fontWeight: '700', textAlign: 'right' },
  valueOverdue: { color: '#D32F2F' },
  overdueText: { color: '#D32F2F', fontSize: 12, fontWeight: '700', marginTop: 4 },
});