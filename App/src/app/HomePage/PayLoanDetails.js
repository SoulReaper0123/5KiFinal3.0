import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

// Calculate overdue days
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

const PayLoanDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

  const dueRaw = loan.dueDate || loan.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

  // Calculate payment details (same as PayLoan screen)
  const overdueDays = computeOverdueDays(dueRaw);
  const loanInterest = parseFloat(loan.interest) || 0;
  const penalty = overdueDays > 0 ? loanInterest * (overdueDays / 30) : 0;
  const monthly = parseFloat(loan.totalMonthlyPayment || loan.monthlyPayment || 0) || 0;
  const totalDue = monthly + penalty;

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

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Pay Loan Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Loan Information Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan Information</Text>
          </View>
          
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

          {/* Total Payment Section - NEW ADDITION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
          </View>

          {/* Monthly Payment */}
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }]}> 
            <Text style={styles.label}>Monthly Payment</Text>
            <Text style={styles.value}>{formatPeso(monthly)}</Text>
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
              
              {/* Total Amount Due - Highlighted */}
              <View style={[styles.row, styles.totalDueRow]}> 
                <Text style={[styles.label, styles.totalDueLabel]}>Total Amount Due</Text>
                <Text style={[styles.value, styles.totalDueValue]}>{formatPeso(totalDue)}</Text>
              </View>
              
              {/* Overdue Warning */}
              <View style={styles.overdueWarning}>
                <MaterialIcons name="warning" size={20} color="#D32F2F" />
                <Text style={styles.overdueWarningText}>
                  This loan is {overdueDays} day{overdueDays > 1 ? 's' : ''} overdue. Please pay immediately to avoid additional penalties.
                </Text>
              </View>
            </>
          )}

          {/* If not overdue, show only the monthly payment as total */}
          {overdueDays === 0 && (
            <View style={[styles.row, styles.totalDueRow]}> 
              <Text style={[styles.label, styles.totalDueLabel]}>Total Amount Due</Text>
              <Text style={[styles.value, styles.totalDueValue]}>{formatPeso(monthly)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Pay Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={() => navigation.navigate('PayLoan')}
        >
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    paddingTop: 30 
  },
  headerBar: {
    marginHorizontal: 16, 
    marginTop: 10, 
    marginBottom: 12,
    paddingHorizontal: 12, 
    paddingVertical: 12,
    backgroundColor: '#E8F1FB', 
    borderRadius: 14,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerIconButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitleText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E3A5F' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  row: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { 
    color: '#64748B', 
    fontSize: 14, 
    fontWeight: '600', 
    flex: 1 
  },
  value: { 
    color: '#0F172A', 
    fontSize: 16, 
    fontWeight: '700', 
    textAlign: 'right', 
    flex: 1 
  },
  valueOverdue: { 
    color: '#D32F2F' 
  },
  overdueText: { 
    color: '#D32F2F', 
    fontSize: 12, 
    fontWeight: '700', 
    marginTop: 4 
  },
  smallNote: { 
    color: '#94A3B8', 
    fontSize: 12, 
    marginTop: 2 
  },
  
  // New styles for total payment section
  totalDueRow: {
    backgroundColor: '#F1F5F9',
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    paddingVertical: 16,
  },
  totalDueLabel: {
    color: '#1E3A5F',
    fontSize: 16,
    fontWeight: '700',
  },
  totalDueValue: {
    color: '#1E3A5F',
    fontSize: 18,
    fontWeight: '800',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    borderColor: '#D32F2F',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginTop: 8,
  },
  overdueWarningText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  payNowButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  payNowButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default PayLoanDetails;