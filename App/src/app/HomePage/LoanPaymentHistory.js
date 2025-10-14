import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const parseCurrencyValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const sanitized = value.replace(/[^0-9.-]/g, '');
    if (!sanitized.trim()) return null;
    const num = Number(sanitized);
    return Number.isNaN(num) ? null : num;
  }
  return null;
};

const normalizeEpochValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num < 1e12 ? num * 1000 : num;
};

const extractDateInfo = (record = {}) => {
  if (!record || typeof record !== 'object') {
    const now = Date.now();
    return { displayDate: now, timestamp: now };
  }

  const dateCandidates = [
    record.dateApproved,
    record.datePaid,
    record.paymentDate,
    record.paymentDateTime,
    record.payment_date,
    record.paymentDatetime,
    record.paymentCreatedAt,
    record.payment_created_at,
    record.paymentCompletedAt,
    record.paymentTimestamp,
    record.paidAt,
    record.date,
    record.completedAt,
    record.approvedAt,
    record.createdAt,
    record.updatedAt,
  ];

  const timestampSources = [
    record.timestamp,
    record.createdAtTimestamp,
    record.updatedAtTimestamp,
    record.approvedAtTimestamp,
    record.paymentTimestamp,
    record.paymentCreatedAt,
    record.paymentCompletedAt,
    record.paymentDatetime,
    record.paidAtTimestamp,
    record.processedAt,
    record.timeApproved,
    record.timeProcessed,
  ];

  let timestamp = null;
  for (const source of timestampSources) {
    const normalized = normalizeEpochValue(source);
    if (normalized !== null) {
      timestamp = normalized;
      break;
    }
  }

  let displayDate = null;
  for (const candidate of dateCandidates) {
    if (candidate === null || candidate === undefined) continue;
    if (typeof candidate === 'string' && !candidate.trim()) continue;
    displayDate = candidate;
    break;
  }

  if (timestamp === null && displayDate !== null) {
    const normalizedDisplay = normalizeEpochValue(displayDate);
    if (normalizedDisplay !== null) {
      timestamp = normalizedDisplay;
    } else {
      const parsed = Date.parse(displayDate);
      if (!Number.isNaN(parsed)) {
        timestamp = parsed;
      }
    }
  }

  if (timestamp === null) {
    timestamp = Date.now();
  }

  if (!displayDate) {
    displayDate = timestamp;
  }

  return { displayDate, timestamp };
};

export default function LoanPaymentHistory() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [originalTransactionId, setOriginalTransactionId] = useState(null);

  const formatCurrency = (n) => `₱${(Number(n) || 0).toFixed(2)}`;
  const formatDate = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';

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

  useEffect(() => {
 const fetchCompleteLoanDetails = async () => {
  if (!loan) {
    setLoading(false);
    return;
  }

  try {
    // Get the originalTransactionId from the loan
    const loanOriginalTransactionId = loan.originalTransactionId || loan.commonOriginalTransactionId;
    console.log('🔍 Loan Payment History Debug:');
    console.log('Loan object:', loan);
    console.log('Loan originalTransactionId:', loanOriginalTransactionId);
    console.log('Loan transactionId:', loan.transactionId);
    console.log('Loan memberId:', loan.memberId);

    setOriginalTransactionId(loanOriginalTransactionId);

    const memberId = loan.memberId || loan.memberID || loan.borrowerId;

    // Fetch complete loan details from Loans/PaidLoans
    let completeLoanData = null;
    try {
      const paidLoansRef = ref(database, `Loans/PaidLoans/${memberId}/${loan.transactionId}`);
      const paidLoansSnap = await get(paidLoansRef);
      if (paidLoansSnap.exists()) {
        completeLoanData = paidLoansSnap.val();
        console.log('✅ Found complete loan data in Loans/PaidLoans:', completeLoanData);
      } else {
        console.log('❌ No loan data found at Loans/PaidLoans/' + memberId + '/' + loan.transactionId);
      }
    } catch (error) {
      console.log('❌ Error fetching from Loans/PaidLoans:', error.message);
    }

    // Use complete loan data if found, otherwise fall back to basic loan object
    const loanData = completeLoanData || loan;

    console.log('📊 Using loan data:', loanData);

    // Extract loan details - SIMPLIFIED for your database structure
    const amountValue = parseCurrencyValue(
      loanData.amount ||           // Direct amount field
      loan.amount                  // Fallback
    );

    const termValue = 
      loanData.term ||             // Direct term field from your database
      loan.term;                   // Fallback

    const interestValue = parseCurrencyValue(
      loanData.interest ||         // Direct interest field from your database
      loan.interest                // Fallback
    );
    
    // Look for interestRate field directly from database
    const interestRateValue = 
      loanData.interestRate ||     // Direct interestRate field from your database
      loan.interestRate;           // Fallback

    console.log('📊 Extracted loan details:', {
      amount: amountValue,
      term: termValue,
      interest: interestValue,
      interestRate: interestRateValue
    });

    setLoanDetails({
      loanType: loanData.loanType || loan.loanType || 'Loan',
      amount: amountValue ?? 0,
      term: termValue,
      interest: interestValue,
      interestRate: interestRateValue, // This is the same as interest but will display with %
    });

  } catch (error) {
    console.error('Error fetching complete loan details:', error);
    // Fallback to basic loan data
    const fallbackAmount = parseCurrencyValue(loan.amount) ?? 0;
    const fallbackTerm = loan.term || null;
    const fallbackInterest = parseCurrencyValue(loan.interest);

    setLoanDetails({
      loanType: loan.loanType || 'Loan',
      amount: fallbackAmount,
      term: fallbackTerm,
      interest: fallbackInterest,
      interestRate: fallbackInterest,
    });
  }
};

    const fetchPayments = async () => {
      if (!loan) {
        setLoading(false);
        return;
      }

      try {
        const memberId = loan.memberId || loan.memberID || loan.borrowerId;
        if (!memberId) {
          console.log('❌ No member ID found');
          setPayments([]);
          setLoading(false);
          return;
        }

        // Get the originalTransactionId from the loan
        const loanOriginalTransactionId = loan.originalTransactionId || loan.commonOriginalTransactionId;

        if (!loanOriginalTransactionId) {
          console.log('❌ No originalTransactionId found in loan');
          setPayments([]);
          setLoading(false);
          return;
        }

        console.log('📦 Fetching payments for:');
        console.log('Member ID:', memberId);
        console.log('Looking for appliedToLoan =', loanOriginalTransactionId);

        // Fetch from Payments/ApprovedPayments/{memberId}
        const paymentsRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
        const paymentsSnap = await get(paymentsRef);

        const collected = [];

        if (paymentsSnap?.exists()) {
          const paymentsData = paymentsSnap.val();
          console.log('✅ Found payments data:', paymentsData);

          // Find all payments where appliedToLoan matches the loan's originalTransactionId
          Object.entries(paymentsData).forEach(([paymentId, paymentData]) => {
            if (!paymentData || typeof paymentData !== 'object') return;

            const paymentAppliedToLoan = paymentData.appliedToLoan;

            console.log(`🔍 Checking payment ${paymentId}:`);
            console.log('  paymentAppliedToLoan:', paymentAppliedToLoan);
            console.log('  loanOriginalTransactionId:', loanOriginalTransactionId);

            // DIRECT MATCH: appliedToLoan === originalTransactionId
            const matchesLoan = paymentAppliedToLoan &&
              String(paymentAppliedToLoan) === String(loanOriginalTransactionId);

            console.log('  ✅ MATCHES:', matchesLoan);

            if (!matchesLoan) return;

            const status = String(paymentData.status || paymentData.paymentStatus || '').toLowerCase();
            if (status && status !== 'approved' && status !== 'paid') {
              console.log('  ❌ Skipping - status not approved/paid:', status);
              return;
            }

            const { displayDate, timestamp } = extractDateInfo(paymentData);

            const payment = {
              source: 'payment',
              id: paymentId,
              transactionId: paymentId,
              amount: parseCurrencyValue(
                paymentData.amountPaid ||
                paymentData.amountApproved ||
                paymentData.approvedAmount ||
                paymentData.amountToBePaid ||
                paymentData.amount
              ) ?? 0,
              displayDate,
              timestamp,
              status: 'paid',
              paymentOption: paymentData.paymentOption || paymentData.modeOfPayment || paymentData.method,
              receiptNumber:
                paymentData.referenceNumber ||
                paymentData.paymentReference ||
                paymentData.referenceId ||
                paymentData.receiptNumber ||
                paymentData.receipt,
              appliedToLoan: paymentData.appliedToLoan,
              amountToBePaid: parseCurrencyValue(paymentData.amountToBePaid),
              dateApplied: paymentData.dateApplied,
              dateApproved: paymentData.dateApproved,
              interestPaid: parseCurrencyValue(paymentData.interestPaid),
              originalTransactionId: paymentData.originalTransactionId,
            };

            collected.push(payment);
            console.log('  ✅ Added payment to collection');
          });
        } else {
          console.log('❌ No payments found at Payments/ApprovedPayments/' + memberId);
        }

        console.log('📊 Final payments collection:', collected);
        collected.sort((a, b) => b.timestamp - a.timestamp);
        setPayments(collected);
      } catch (e) {
        console.error('❌ Error fetching payments:', e);
      } finally {
        setLoading(false);
      }
    };

    // Fetch both loan details and payments
    Promise.all([fetchCompleteLoanDetails(), fetchPayments()]).finally(() => {
      setLoading(false);
    });
  }, [loan]);

  // Calculate total paid amount
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>{loanDetails?.loanType || loan?.loanType || 'Loan'}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Loan summary */}
      {loanDetails && (
        <View style={styles.loanSummary}>
          <Text style={styles.summaryTitle}>{loanDetails?.loanType || loan?.loanType || 'Loan Type'}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails.amount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>
              {loanDetails.term ? `${loanDetails.term} ${loanDetails.term === 1 ? 'month' : 'months'}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest</Text>
            <Text style={styles.summaryValue}>
              {loanDetails.interest ? formatCurrency(loanDetails.interest) : 'N/A'}
            </Text>
          </View>
          {loanDetails.interestRate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest Rate</Text>
              <Text style={styles.summaryValue}>
                {Number(loanDetails.interestRate).toFixed(2)}%
              </Text>
            </View>
          )}
          {payments.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{formatCurrency(totalPaid)}</Text>
            </View>
          )}
        </View>
      )}


      <Text style={styles.sectionTitle}>
        Payments ({payments.length})
      </Text>

      {/* Payments list */}
      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {payments.length > 0 ? (
            payments.map((p, index) => (
              <View key={`${p.source}-${p.id ?? p.timestamp ?? index}`} style={styles.paymentCard}>
                <Text style={styles.paymentTitle}>Payment ID: {p.transactionId}</Text>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Applied To Loan</Text>
                  <Text style={styles.paymentValue}>{p.appliedToLoan || 'N/A'}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount to Be Paid</Text>
                  <Text style={styles.paymentValue}>{p.amountToBePaid !== null ? formatCurrency(p.amountToBePaid) : 'N/A'}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Date Applied</Text>
                  <Text style={styles.paymentValue}>{p.dateApplied ? formatDate(p.dateApplied) : 'N/A'}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Date Approved</Text>
                  <Text style={styles.paymentValue}>{p.dateApproved ? formatDate(p.dateApproved) : 'N/A'}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Interest Paid</Text>
                  <Text style={styles.paymentValue}>{p.interestPaid !== null ? formatCurrency(p.interestPaid) : 'N/A'}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment Amount</Text>
                  <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>
                    +{formatCurrency(p.amount)}
                  </Text>
                </View>
                
                {!!p.displayDate && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Date</Text>
                    <Text style={styles.paymentValue}>{formatDate(p.displayDate)}</Text>
                  </View>
                )}
                
                {!!p.paymentOption && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Method</Text>
                    <Text style={styles.paymentValue}>{p.paymentOption}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No payments found for this loan
              </Text>
              {originalTransactionId && (
                <Text style={styles.emptySubText}>
                  Looking for payments with "appliedToLoan" = {originalTransactionId}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  originalIdContainer: {
    backgroundColor: '#E8F1FB',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E3A5F',
  },
  originalIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    textAlign: 'center',
  },
  originalIdSubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 10 },
  paymentLabel: { fontSize: 14, color: '#64748B' },
  paymentValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#64748B', 
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
  },
});