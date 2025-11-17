import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';

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

const LoanDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState(loan.paymentHistory || []);
  const [debugInfo, setDebugInfo] = useState('');

  // Enhanced debugging
  useEffect(() => {
    if (loan) {
      console.log('🔍 LoanDetails - Loan object:', {
        _loanId: loan._loanId,
        transactionId: loan.transactionId,
        originalTransactionId: loan.originalTransactionId,
        commonOriginalTransactionId: loan.commonOriginalTransactionId,
        loanId: loan.loanId,
        paymentHistoryCount: loan.paymentHistory?.length || 0
      });
    }
  }, [loan]);

  useEffect(() => {
    console.log('🔍 LoanDetails - Payments found:', payments.length);
    payments.forEach((p, index) => {
      console.log(`Payment ${index}:`, {
        transactionId: p.transactionId,
        originalTransactionId: p.originalTransactionId,
        appliedToLoan: p.appliedToLoan,
        amount: p.amount,
        dateApproved: p.dateApproved
      });
    });
  }, [payments]);

  // If no payment history was passed, try to fetch it
  useEffect(() => {
    const fetchPaymentsIfNeeded = async () => {
      if (!loan.paymentHistory || loan.paymentHistory.length === 0) {
        setLoading(true);
        try {
          const memberId = loan._memberId || loan.memberId || loan.id;
          if (!memberId) {
            setDebugInfo('No member ID found');
            return;
          }

          console.log('🔄 LoanDetails - Fetching payments for member:', memberId);

          // Fetch from Payments/ApprovedPayments
          const paymentsRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
          const paymentsSnap = await get(paymentsRef);

          const collectedPayments = [];

          if (paymentsSnap?.exists()) {
            const paymentsData = paymentsSnap.val();
            
            // Get all possible loan identifiers
            const possibleLoanIdentifiers = [
              loan.originalTransactionId,
              loan.commonOriginalTransactionId,
              loan._loanId,
              loan.transactionId,
              loan.loanId
            ].filter(Boolean);

            console.log('📋 LoanDetails - Possible loan identifiers:', possibleLoanIdentifiers);

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

            console.log('✅ LoanDetails - Found payments:', collectedPayments.length);
            setPayments(collectedPayments);
            setDebugInfo(`Found ${collectedPayments.length} payments`);
          } else {
            setDebugInfo('No payments found');
          }
        } catch (error) {
          console.error('❌ LoanDetails - Error fetching payments:', error);
          setDebugInfo(`Error: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPaymentsIfNeeded();
  }, [loan]);

  // Calculate total paid amount
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>{loan.loanType || 'Loan'}</Text>
          <View style={{ width: 22 }} />
        </View>
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 20 }} />
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    );
  }

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
        {/* Debug Info */}
        {__DEV__ && debugInfo ? (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug: {debugInfo}</Text>
            <Text style={styles.debugText}>Loan ID: {loan._loanId}</Text>
            <Text style={styles.debugText}>Original ID: {loan.originalTransactionId}</Text>
          </View>
        ) : null}

        <View style={styles.loanSummary}>
          <Text style={styles.summaryTitle}>{loan.loanType || 'Loan Type'}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.loanAmount)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding Balance</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.outstandingBalance ?? loan.loanAmount)}</Text>
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

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date Applied</Text>
            <Text style={styles.summaryValue}>{formatDate(loan.dateApplied)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date Approved</Text>
            <Text style={styles.summaryValue}>{formatDate(loan.dateApproved)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Payment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.monthlyPayment)}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Total Monthly Payment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loan.totalMonthlyPayment ?? loan.totalTermPayment)}</Text>
          </View>

          {loan.dueDate || loan.nextDueDate ? (
            <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 8 }]}>
              <Text style={styles.summaryLabel}>Due Date</Text>
              <Text style={styles.summaryValue}>{formatDate(loan.dueDate || loan.nextDueDate)}</Text>
            </View>
          ) : null}

          {payments.length > 0 && (
            <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 8 }]}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{formatCurrency(totalPaid)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Payment History ({payments.length})
        </Text>

        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <View key={`${payment.id}-${index}`} style={styles.paymentCard}>
              <Text style={styles.paymentTitle}>
                Payment ID: {payment.transactionId || 'N/A'}
              </Text>
              
              {payment.originalTransactionId && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Original Transaction ID</Text>
                  <Text style={styles.paymentValue}>{payment.originalTransactionId}</Text>
                </View>
              )}

              {payment.appliedToLoan && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Applied To Loan</Text>
                  <Text style={styles.paymentValue}>{payment.appliedToLoan}</Text>
                </View>
              )}

              {payment.amountToBePaid > 0 && (
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

              {payment.interestPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Interest Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.interestPaid)}</Text>
                </View>
              )}

              {payment.penaltyPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Penalty Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.penaltyPaid)}</Text>
                </View>
              )}

              {payment.principalPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Principal Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.principalPaid)}</Text>
                </View>
              )}

              {payment.excessPayment > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Excess Payment</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.excessPayment)}</Text>
                </View>
              )}

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Amount</Text>
                <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>
                  +{formatCurrency(payment.amount)}
                </Text>
              </View>

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
            <Text style={styles.emptyText}>No payments found for this loan</Text>
            <Text style={styles.emptySubText}>
              Payment history will appear here once payments are approved
            </Text>
          </View>
        )}
      </ScrollView>
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
  backBtn: { 
    padding: 6, 
    borderRadius: 8 
  },
  headerTitleText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E3A5F' 
  },
  debugContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
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
  summaryTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#2D5783', 
    marginBottom: 10 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { 
    fontSize: 14, 
    color: '#666' 
  },
  summaryValue: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#2D5783' 
  },
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
});

export default LoanDetails;
