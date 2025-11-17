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

  // Fetch payments for this specific loan
  const fetchPaymentsForLoan = async () => {
    if (!loan) return;

    try {
      const memberId = loan._memberId || loan.memberId;
      if (!memberId) {
        console.log('❌ No member ID found for loan');
        setPayments([]);
        return;
      }

      console.log('🔍 Fetching payments for loan:', {
        memberId,
        loanId: loan._loanId,
        transactionId: loan.transactionId
      });

      // Get the originalTransactionId from the loan data
      const loanOriginalTransactionId = 
        loan.originalTransactionId || 
        loan.commonOriginalTransactionId || 
        loan._loanId;

      console.log('📋 Looking for payments with appliedToLoan =', loanOriginalTransactionId);

      // Fetch from Payments/ApprovedPayments
      const paymentsRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
      const paymentsSnap = await get(paymentsRef);

      const collectedPayments = [];

      if (paymentsSnap?.exists()) {
        const paymentsData = paymentsSnap.val();
        console.log('✅ Found payments data, searching for loan matches...');

        // Find all payments where appliedToLoan matches the loan's originalTransactionId
        Object.entries(paymentsData).forEach(([paymentId, paymentData]) => {
          if (!paymentData || typeof paymentData !== 'object') return;

          const paymentAppliedToLoan = paymentData.appliedToLoan;

          console.log(`🔍 Checking payment ${paymentId}:`);
          console.log('  paymentAppliedToLoan:', paymentAppliedToLoan);
          console.log('  loanOriginalTransactionId:', loanOriginalTransactionId);

          // Check if this payment is for our loan
          const matchesLoan = paymentAppliedToLoan &&
            String(paymentAppliedToLoan) === String(loanOriginalTransactionId);

          console.log('  ✅ MATCHES:', matchesLoan);

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

          collectedPayments.push(payment);
          console.log('  ✅ Added payment to collection');
        });
      } else {
        console.log('❌ No payments found at Payments/ApprovedPayments/' + memberId);
      }

      console.log('📊 Final payments collection:', collectedPayments);
      collectedPayments.sort((a, b) => b.timestamp - a.timestamp);
      setPayments(collectedPayments);
    } catch (error) {
      console.error('❌ Error fetching payments for loan:', error);
      setPayments([]);
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
          outstandingBalance: parseFloat(loan.outstandingBalance) || 0,
        });
      }

      // Fetch payments for this loan
      await fetchPaymentsForLoan();
      setLoading(false);
    };

    initializeData();
  }, [loan]);

  const dueRaw = loan.dueDate || loan.nextDueDate;
  const dueOverdue = isOverdue(dueRaw);

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
        <View style={styles.loanSummary}>
          <Text style={styles.summaryTitle}>{loanDetails?.loanType || loan?.loanType || 'Loan Type'}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanDetails?.amount)}</Text>
          </View>

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

          <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 8 }]}>
            <Text style={styles.summaryLabel}>Due Date</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryValue, dueOverdue && { color: '#D32F2F' }]}>
                {formatDate(dueRaw)}
              </Text>
              {dueOverdue && (
                <Text style={{ color: '#D32F2F', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                  Overdue
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Payment History ({payments.length})
        </Text>

        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <View key={`${payment.id}-${index}`} style={styles.paymentCard}>
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
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payments found for this loan</Text>
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
    paddingVertical: 20,
    marginHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
  },
});

export default LoanDetails;
