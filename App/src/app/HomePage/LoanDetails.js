import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const formatCurrency = (n) => `₱${(Number(n) || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';

  const normalizeEpochValue = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    if (Number.isNaN(num)) return null;
    return num < 1e12 ? num * 1000 : num;
  };

  const normalized = normalizeEpochValue(value);
  const baseDate = normalized !== null ? new Date(normalized) : new Date(value);

  if (Number.isNaN(baseDate.getTime())) return String(value);

  const datePart = baseDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timePart = baseDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} • ${timePart}`;
};

export default function LoanDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

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

  const isOverdue = (raw) => {
    const d = parseDateTime(raw);
    if (!d) return false;
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return startToday >= startDue;
  };

  const dueRaw = loan.dueDate || loan.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>{loan.loanType || 'Loan'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.loanSummary}>
          <Text style={styles.summaryTitle}>{loan.loanType || 'Loan Type'}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.loanAmount)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>
              {loan.term ? `${loan.term} ${loan.term === 1 ? 'month' : 'months'}` : 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.interest)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>{Number(loan.interestRate || 0).toFixed(2)}%</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.totalMonthlyPayment ?? loan.totalTermPayment)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Payments ({loan.paymentHistory?.length || 0})
        </Text>

        {loan.paymentHistory && loan.paymentHistory.length > 0 ? (
          loan.paymentHistory.map((payment, index) => (
            <View key={index} style={styles.paymentCard}>
              <Text style={styles.paymentTitle}>Payment ID: {payment.transactionId || 'N/A'}</Text>
              
              {payment.appliedToLoan && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Applied To Loan</Text>
                  <Text style={styles.paymentValue}>{payment.appliedToLoan}</Text>
                </View>
              )}

              {payment.amountToBePaid !== null && payment.amountToBePaid !== undefined && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount to Be Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.amountToBePaid)}</Text>
                </View>
              )}

              {payment.dateApplied && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Date Applied</Text>
                  <Text style={styles.paymentValue}>{formatDate(payment.dateApplied)}</Text>
                </View>
              )}

              {payment.dateApproved && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Date Approved</Text>
                  <Text style={styles.paymentValue}>{formatDate(payment.dateApproved)}</Text>
                </View>
              )}

              {payment.interestPaid !== null && payment.interestPaid !== undefined && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Interest Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.interestPaid)}</Text>
                </View>
              )}

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Amount</Text>
                <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>
                  +{formatCurrency(payment.amountToBePaid || payment.amount || 0)}
                </Text>
              </View>

              {payment.displayDate && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment Date</Text>
                  <Text style={styles.paymentValue}>{formatDate(payment.displayDate)}</Text>
                </View>
              )}

              {payment.paymentOption && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Method</Text>
                  <Text style={styles.paymentValue}>{payment.paymentOption}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payments made for this loan</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 30 },
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
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  loanSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: '#2D5783', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#2D5783' },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5783',
    marginTop: 8,
  },
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentTitle: { fontSize: 16, fontWeight: '600', color: '#2D5783', marginBottom: 10 },
  paymentLabel: { fontSize: 14, color: '#666' },
  paymentValue: { fontSize: 14, fontWeight: '500', color: '#2D5783' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
});