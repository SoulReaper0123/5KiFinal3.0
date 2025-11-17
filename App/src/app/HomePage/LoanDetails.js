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

  // Remove time part, only show date
  return baseDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const LoanDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const loan = item || {};

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Fetch payments for this specific loan
  const fetchPaymentsForLoan = async () => {
    if (!loan) return;

    try {
      const memberId = loan._memberId || loan.memberId || loan.id;
      if (!memberId) {
        console.log('❌ No member ID found for loan');
        setDebugInfo('No member ID found');
        setPayments([]);
        return;
      }

      console.log('🔍 Fetching payments for loan:', {
        memberId,
        loanId: loan._loanId,
        transactionId: loan.transactionId,
        originalTransactionId: loan.originalTransactionId,
        commonOriginalTransactionId: loan.commonOriginalTransactionId
      });

      // Try multiple possible loan identifiers
      const possibleLoanIdentifiers = [
        loan.originalTransactionId,
        loan.commonOriginalTransactionId,
        loan._loanId,
        loan.transactionId,
        loan.loanId
      ].filter(Boolean); // Remove null/undefined values

      console.log('📋 Possible loan identifiers:', possibleLoanIdentifiers);

      // Fetch from Payments/ApprovedPayments
      const paymentsRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
      const paymentsSnap = await get(paymentsRef);

      const collectedPayments = [];

      if (paymentsSnap?.exists()) {
        const paymentsData = paymentsSnap.val();
        console.log('✅ Found payments data, searching for loan matches...');
        console.log('📊 Total payments found:', Object.keys(paymentsData).length);

        // Find all payments where appliedToLoan matches any of the possible loan identifiers
        Object.entries(paymentsData).forEach(([paymentId, paymentData]) => {
          if (!paymentData || typeof paymentData !== 'object') return;

          const paymentAppliedToLoan = paymentData.appliedToLoan;
          const paymentOriginalTransactionId = paymentData.originalTransactionId;

          console.log(`🔍 Checking payment ${paymentId}:`);
          console.log('  paymentAppliedToLoan:', paymentAppliedToLoan);
          console.log('  paymentOriginalTransactionId:', paymentOriginalTransactionId);
          console.log('  possibleLoanIdentifiers:', possibleLoanIdentifiers);

          // Check if this payment is for our loan using multiple matching strategies
          let matchesLoan = false;
          let matchType = '';

          // Strategy 1: Direct appliedToLoan match
          if (paymentAppliedToLoan && possibleLoanIdentifiers.includes(paymentAppliedToLoan)) {
            matchesLoan = true;
            matchType = 'appliedToLoan direct match';
          }
          // Strategy 2: OriginalTransactionId match
          else if (paymentOriginalTransactionId && possibleLoanIdentifiers.includes(paymentOriginalTransactionId)) {
            matchesLoan = true;
            matchType = 'originalTransactionId match';
          }
          // Strategy 3: String comparison (case insensitive)
          else if (paymentAppliedToLoan) {
            const appliedToLoanLower = String(paymentAppliedToLoan).toLowerCase();
            matchesLoan = possibleLoanIdentifiers.some(id => 
              String(id).toLowerCase() === appliedToLoanLower
            );
            if (matchesLoan) matchType = 'case-insensitive match';
          }

          console.log('  ✅ MATCHES:', matchesLoan, matchType);

          if (!matchesLoan) return;

          const status = String(paymentData.status || paymentData.paymentStatus || '').toLowerCase();
          if (status && status !== 'approved' && status !== 'paid') {
            console.log('  ❌ Skipping - status not approved/paid:', status);
            return;
          }

          // Parse currency values
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

          // Extract date info
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
              record.paidAt,
              record.date,
              record.completedAt,
              record.approvedAt,
              record.createdAt,
            ];

            const timestampSources = [
              record.timestamp,
              record.createdAtTimestamp,
              record.updatedAtTimestamp,
              record.approvedAtTimestamp,
              record.paymentTimestamp,
              record.paidAtTimestamp,
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

          const normalizeEpochValue = (value) => {
            if (value === null || value === undefined || value === '') return null;
            const num = Number(value);
            if (Number.isNaN(num)) return null;
            return num < 1e12 ? num * 1000 : num;
          };

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
            status: status || 'approved',
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
            // Additional fields from payment approval
            penaltyPaid: parseCurrencyValue(paymentData.penaltyPaid),
            principalPaid: parseCurrencyValue(paymentData.principalPaid),
            excessPayment: parseCurrencyValue(paymentData.excessPayment),
            matchType: matchType,
          };

          collectedPayments.push(payment);
          console.log('  ✅ Added payment to collection:', paymentId);
        });
      } else {
        console.log('❌ No payments found at Payments/ApprovedPayments/' + memberId);
        setDebugInfo(`No payments found for member: ${memberId}`);
      }

      console.log('📊 Final payments collection:', collectedPayments);
      collectedPayments.sort((a, b) => b.timestamp - a.timestamp);
      setPayments(collectedPayments);
      setDebugInfo(`Found ${collectedPayments.length} payments for ${possibleLoanIdentifiers.length} possible loan identifiers`);
    } catch (error) {
      console.error('❌ Error fetching payments for loan:', error);
      setPayments([]);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  // Also try to fetch from Transactions/Payments as fallback
  const fetchPaymentsFromTransactions = async () => {
    if (!loan || payments.length > 0) return;

    try {
      const memberId = loan._memberId || loan.memberId || loan.id;
      if (!memberId) return;

      console.log('🔄 Trying Transactions/Payments as fallback...');
      const transactionsRef = ref(database, `Transactions/Payments/${memberId}`);
      const transactionsSnap = await get(transactionsRef);

      if (transactionsSnap?.exists()) {
        const transactionsData = transactionsSnap.val();
        console.log('✅ Found transactions data:', Object.keys(transactionsData).length);

        const possibleLoanIdentifiers = [
          loan.originalTransactionId,
          loan.commonOriginalTransactionId,
          loan._loanId,
          loan.transactionId,
          loan.loanId
        ].filter(Boolean);

        const collectedFromTransactions = [];

        Object.entries(transactionsData).forEach(([paymentId, paymentData]) => {
          if (!paymentData || typeof paymentData !== 'object') return;

          const paymentAppliedToLoan = paymentData.appliedToLoan;
          const status = String(paymentData.status || '').toLowerCase();

          if (status !== 'approved' && status !== 'paid') return;

          // Check for matches
          const matchesLoan = paymentAppliedToLoan && 
            possibleLoanIdentifiers.some(id => String(id) === String(paymentAppliedToLoan));

          if (matchesLoan) {
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

            collectedFromTransactions.push({
              ...paymentData,
              id: paymentId,
              transactionId: paymentId,
              amount: parseCurrencyValue(paymentData.amount) ?? 0,
              source: 'transactions',
            });
          }
        });

        if (collectedFromTransactions.length > 0) {
          console.log('✅ Found payments in transactions:', collectedFromTransactions.length);
          setPayments(prev => [...prev, ...collectedFromTransactions]);
          setDebugInfo(prev => prev + ` | Found ${collectedFromTransactions.length} in transactions`);
        }
      }
    } catch (error) {
      console.error('Error fetching from transactions:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Set basic loan details
      if (loan) {
        setLoanDetails({
          loanType: loan.loanType || 'Loan',
          amount: parseFloat(loan.loanAmount) || 0,
          term: loan.term,
          interest: parseFloat(loan.interest) || 0,
          interestRate: parseFloat(loan.interestRate) || 0,
          dateApplied: loan.dateApplied,
          dateApproved: loan.dateApproved,
          monthlyPayment: parseFloat(loan.monthlyPayment) || 0,
          totalMonthlyPayment: parseFloat(loan.totalMonthlyPayment) || 0,
          outstandingBalance: parseFloat(loan.outstandingBalance) || parseFloat(loan.loanAmount) || 0,
          processingFee: parseFloat(loan.processingFee) || 0,
          receivableAmount: parseFloat(loan.receivableAmount) || 0,
        });
      }

      // Fetch payments for this loan
      await fetchPaymentsForLoan();
      
      // Try transactions as fallback
      await fetchPaymentsFromTransactions();
      
      setLoading(false);
    };

    initializeData();
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
        <Text style={styles.headerTitleText}>{loanDetails?.loanType || loan?.loanType || 'Loan'}</Text>
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
          <Text style={styles.summaryTitle}>{loanDetails?.loanType || loan?.loanType || 'Loan Type'}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.amount)}</Text>
          </View>

          {loanDetails?.processingFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Processing Fee</Text>
              <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.processingFee)}</Text>
            </View>
          )}

          {loanDetails?.receivableAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Receivable Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.receivableAmount)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding Balance</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.outstandingBalance)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>
              {loanDetails?.term ? `${loanDetails.term} ${loanDetails.term === 1 ? 'month' : 'months'}` : 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.interest)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>{Number(loanDetails?.interestRate || 0).toFixed(2)}%</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date Applied</Text>
            <Text style={styles.summaryValue}>{formatDate(loanDetails?.dateApplied)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date Approved</Text>
            <Text style={styles.summaryValue}>{formatDate(loanDetails?.dateApproved)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Payment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.monthlyPayment)}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Total Monthly Payment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.totalMonthlyPayment)}</Text>
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
                {payment.matchType && (
                  <Text style={styles.matchType}> ({payment.matchType})</Text>
                )}
              </Text>
              
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

              {payment.interestPaid !== null && payment.interestPaid !== undefined && payment.interestPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Interest Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.interestPaid)}</Text>
                </View>
              )}

              {payment.penaltyPaid !== null && payment.penaltyPaid !== undefined && payment.penaltyPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Penalty Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.penaltyPaid)}</Text>
                </View>
              )}

              {payment.principalPaid !== null && payment.principalPaid !== undefined && payment.principalPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Principal Paid</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(payment.principalPaid)}</Text>
                </View>
              )}

              {payment.excessPayment !== null && payment.excessPayment !== undefined && payment.excessPayment > 0 && (
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

              {payment.receiptNumber && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Receipt Number</Text>
                  <Text style={styles.paymentValue}>{payment.receiptNumber}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt" size={50} color="#94A3B8" />
            <Text style={styles.emptyText}>No payments found for this loan</Text>
            <Text style={styles.emptySubText}>
              Payment history will appear here once payments are approved
            </Text>
            {__DEV__ && (
              <Text style={styles.debugText}>
                Check console for detailed debugging information
              </Text>
            )}
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
  summaryTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1E3A5F', 
    marginBottom: 10 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: { 
    fontSize: 14, 
    color: '#64748B' 
  },
  summaryValue: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#1E3A5F' 
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
    marginTop: 8,
  },
  paymentCard: {
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
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1E3A5F', 
    marginBottom: 10 
  },
  matchType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  paymentLabel: { 
    fontSize: 14, 
    color: '#64748B' 
  },
  paymentValue: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#1E3A5F' 
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
