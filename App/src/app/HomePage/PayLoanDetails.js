import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';

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
  
  const [loading, setLoading] = useState(true);
  const [loanData, setLoanData] = useState({});
  const [approvedLoanAmount, setApprovedLoanAmount] = useState(0);
  const [currentLoanAmount, setCurrentLoanAmount] = useState(0);
  const [payments, setPayments] = useState([]);

  // Fetch loan details from both ApprovedLoans and CurrentLoans
  useEffect(() => {
    const fetchLoanDetails = async () => {
      setLoading(true);
      try {
        const memberId = item?._memberId || item?.memberId;
        const loanId = item?._loanId || item?.transactionId;

        if (!memberId || !loanId) {
          console.log('Missing memberId or loanId');
          setLoading(false);
          return;
        }

        // Fetch from ApprovedLoans for original loan details (Loan Amount)
        const approvedLoanRef = ref(database, `Loans/ApprovedLoans/${memberId}/${loanId}`);
        const approvedLoanSnap = await get(approvedLoanRef);

        let approvedLoanAmountValue = 0;
        let approvedLoanData = {};
        if (approvedLoanSnap?.exists()) {
          approvedLoanData = approvedLoanSnap.val();
          approvedLoanAmountValue = parseFloat(approvedLoanData.loanAmount || 0);
          setApprovedLoanAmount(approvedLoanAmountValue);
        }

        // Fetch from CurrentLoans for outstanding balance
        const currentLoanRef = ref(database, `Loans/CurrentLoans/${memberId}/${loanId}`);
        const currentLoanSnap = await get(currentLoanRef);

        let currentLoanAmountValue = 0;
        let currentLoanData = {};
        if (currentLoanSnap?.exists()) {
          currentLoanData = currentLoanSnap.val();
          currentLoanAmountValue = parseFloat(currentLoanData.loanAmount || 0);
          setCurrentLoanAmount(currentLoanAmountValue);
        }

        // Merge data exactly like in ExistingLoan component
        const mergedLoanData = {
          ...item,
          ...approvedLoanData,
          ...currentLoanData,
          loanAmount: approvedLoanAmountValue, // From ApprovedLoans
          outstandingBalance: currentLoanAmountValue, // From CurrentLoans
          _memberId: memberId,
          _loanId: loanId
        };

        setLoanData(mergedLoanData);

        // Also fetch payment history
        await fetchPaymentHistory(memberId, loanId);

      } catch (error) {
        console.error('Error fetching loan details:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPaymentHistory = async (memberId, loanId) => {
      try {
        const paymentsRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
        const paymentsSnap = await get(paymentsRef);

        const collectedPayments = [];

        if (paymentsSnap?.exists()) {
          const paymentsData = paymentsSnap.val();
          
          // Get all possible loan identifiers from the original item
          const possibleLoanIdentifiers = [
            item?.originalTransactionId,
            item?.commonOriginalTransactionId,
            item?._loanId,
            item?.transactionId,
            loanId
          ].filter(Boolean);

          // Find payments that match this loan
          Object.entries(paymentsData).forEach(([paymentId, paymentData]) => {
            if (!paymentData || typeof paymentData !== 'object') return;

            const paymentAppliedToLoan = paymentData.appliedToLoan;
            const paymentOriginalTransactionId = paymentData.originalTransactionId;

            // Check if this payment is for our loan
            let matchesLoan = false;

            // Strategy 1: Direct appliedToLoan match
            if (paymentAppliedToLoan && possibleLoanIdentifiers.includes(paymentAppliedToLoan)) {
              matchesLoan = true;
            }
            // Strategy 2: OriginalTransactionId match
            else if (paymentOriginalTransactionId && possibleLoanIdentifiers.includes(paymentOriginalTransactionId)) {
              matchesLoan = true;
            }
            // Strategy 3: String comparison (case insensitive)
            else if (paymentAppliedToLoan) {
              const appliedToLoanLower = String(paymentAppliedToLoan).toLowerCase();
              matchesLoan = possibleLoanIdentifiers.some(id => 
                String(id).toLowerCase() === appliedToLoanLower
              );
            }

            if (matchesLoan) {
              const status = String(paymentData.status || paymentData.paymentStatus || '').toLowerCase();
              if (status && status !== 'approved' && status !== 'paid') return;

              collectedPayments.push({
                source: 'payment',
                id: paymentId,
                transactionId: paymentId,
                originalTransactionId: paymentOriginalTransactionId,
                amount: parseFloat(
                  paymentData.amountPaid ||
                  paymentData.amountApproved ||
                  paymentData.approvedAmount ||
                  paymentData.amountToBePaid ||
                  paymentData.amount
                ) || 0,
                dateApproved: paymentData.dateApproved,
                dateApplied: paymentData.dateApplied,
                status: status || 'approved',
                paymentOption: paymentData.paymentOption || paymentData.modeOfPayment || paymentData.method,
                appliedToLoan: paymentData.appliedToLoan,
                amountToBePaid: parseFloat(paymentData.amountToBePaid) || 0,
                interestPaid: parseFloat(paymentData.interestPaid) || 0,
                principalPaid: parseFloat(paymentData.principalPaid) || 0,
                penaltyPaid: parseFloat(paymentData.penaltyPaid) || 0,
                excessPayment: parseFloat(paymentData.excessPayment) || 0,
              });
            }
          });

          setPayments(collectedPayments);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    // Fetch data when component mounts
    if (item) {
      fetchLoanDetails();
    } else {
      setLoading(false);
    }
  }, [item]);

  const dueRaw = loanData.dueDate || loanData.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

  // Calculate payment details
  const overdueDays = computeOverdueDays(dueRaw);
  const loanInterest = parseFloat(loanData.interest) || 0;
  const penalty = overdueDays > 0 ? loanInterest * (overdueDays / 30) : 0;
  const monthly = parseFloat(loanData.totalMonthlyPayment || loanData.monthlyPayment || 0) || 0;
  const totalDue = monthly + penalty;

  // Calculate total paid from payments
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Use loanAmount from ApprovedLoans and outstandingBalance from CurrentLoans
  const loanAmount = approvedLoanAmount || loanData.loanAmount;
  const outstandingBalance = currentLoanAmount || loanData.outstandingBalance;

  const details = [
    { label: 'Loan Type', value: loanData.loanType || 'N/A' },
    { label: 'Loan ID', value: loanData.transactionId || loanData._loanId || 'N/A' },
    { label: 'Loan Amount', value: formatPeso(loanAmount) },
    { label: 'Processing Fee', value: formatPeso(loanData.processingFee) },
    { label: 'Receivable Amount', value: formatPeso(loanData.releaseAmount) },
    { label: 'Outstanding Balance', value: formatPeso(outstandingBalance) },
    { label: 'Interest', value: formatPeso(loanData.interest) },
    { label: 'Interest Rate', value: `${Number(loanData.interestRate || 0).toFixed(2)}%` },
    { label: 'Total Interest', value: formatPeso(loanData.totalInterest) },
    { label: 'Term', value: loanData.term ? `${loanData.term} ${loanData.term === 1 ? 'month' : 'months'}` : 'N/A' },
    { label: 'Monthly Amortization', value: formatPeso(loanData.monthlyPayment) },
    { label: 'Date Applied', value: formatDate(loanData.dateApplied) },
    { label: 'Date Approved', value: formatDate(loanData.dateApproved) },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Pay Loan Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 20 }} />
      </View>
    );
  }

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

          {/* Total Paid Section */}
          {payments.length > 0 && (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Total Paid</Text>
              <Text style={[styles.value, { color: '#4CAF50' }]}>{formatPeso(totalPaid)}</Text>
            </View>
          )}

          {/* Total Payment Section */}
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

        {/* Payment History Section */}
        {payments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment History ({payments.length})</Text>
            </View>
            {payments.map((payment, index) => (
              <View key={`${payment.id}-${index}`} style={styles.paymentCard}>
                <Text style={styles.paymentTitle}>
                  Payment ID: {payment.transactionId || 'N/A'}
                </Text>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount Paid</Text>
                  <Text style={styles.paymentValue}>{formatPeso(payment.amount)}</Text>
                </View>

                {payment.principalPaid > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Principal Paid</Text>
                    <Text style={styles.paymentValue}>{formatPeso(payment.principalPaid)}</Text>
                  </View>
                )}

                {payment.interestPaid > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Interest Paid</Text>
                    <Text style={styles.paymentValue}>{formatPeso(payment.interestPaid)}</Text>
                  </View>
                )}

                {payment.paymentOption && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Method</Text>
                    <Text style={styles.paymentValue}>{payment.paymentOption}</Text>
                  </View>
                )}

                {payment.dateApproved && (
                  <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.paymentLabel}>Date Approved</Text>
                    <Text style={styles.paymentValue}>{formatDate(payment.dateApproved)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed Pay Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={() => navigation.navigate('PayLoan', { loan: loanData })}
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
  // Payment history styles
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#2D5783', 
    marginBottom: 10 
  },
  paymentLabel: { 
    fontSize: 14, 
    color: '#666' 
  },
  paymentValue: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#2D5783' 
  },
});

export default PayLoanDetails;
