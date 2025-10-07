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
    const fetchLoanData = async () => {
      if (!loan) { setLoading(false); return; }
      try {
        const memberId = loan.memberId || loan.memberID || loan.borrowerId;
        const loansRef = memberId ? ref(database, `Transactions/Loans/${memberId}`) : null;
        const loanSnap = loansRef ? await get(loansRef) : null;
        let foundLoan = null;
        if (loanSnap?.exists()) {
          const loansData = loanSnap.val();
          for (const [id, detail] of Object.entries(loansData)) {
            const normalizedId = String(id);
            const matchesTransaction = normalizedId === String(loan.transactionId);
            const matchesLoanId =
              loan.loanId &&
              (String(detail.loanId || detail._loanId || detail.selectedLoanId || id) === String(loan.loanId));
            if (matchesTransaction || matchesLoanId) {
              foundLoan = { id, ...detail };
              break;
            }
          }
        }

        if (foundLoan) {
          const amountValue = parseCurrencyValue(foundLoan.loanAmount ?? foundLoan.approvedAmount ?? loan.amount);
          const termValue = foundLoan.term || foundLoan.loanTerm || foundLoan.loanTermMonths || loan.term;
          const rateValue = parseCurrencyValue(foundLoan.interestRate ?? foundLoan.interestRatePercent ?? loan.interestRate);
          const interestValue = parseCurrencyValue(foundLoan.interestAmount ?? foundLoan.totalInterest ?? loan.interest);

          setLoanDetails({
            loanType: foundLoan.loanType || loan.loanType || 'Loan',
            amount: amountValue ?? 0,
            term: termValue ?? null,
            interestRate: rateValue,
            interest: interestValue,
          });
        } else {
          const amountValue = parseCurrencyValue(loan.loanAmount ?? loan.amount);
          const rateValue = parseCurrencyValue(loan.interestRate);
          const interestValue = parseCurrencyValue(loan.interest);

          setLoanDetails({
            loanType: loan.loanType || 'Loan',
            amount: amountValue ?? 0,
            term: loan.term || null,
            interestRate: rateValue,
            interest: interestValue,
          });
        }
      } catch (error) {
        console.error('Error fetching loan details:', error);
        const fallbackAmount = parseCurrencyValue(loan.loanAmount ?? loan.amount) ?? 0;
        const fallbackRate = parseCurrencyValue(loan.interestRate);
        const fallbackInterest = parseCurrencyValue(loan.interest);
        setLoanDetails({
          loanType: loan.loanType || 'Loan',
          amount: fallbackAmount,
          term: loan.term || null,
          interestRate: fallbackRate,
          interest: fallbackInterest,
        });
      }
    };

    const fetchPayments = async () => {
      if (!loan) { setLoading(false); return; }
      try {
        const memberId = loan.memberId || loan.memberID || loan.borrowerId;
        if (!memberId) {
          setPayments([]);
          return;
        }

        const approvedRef = ref(database, `Payments/ApprovedPayments/${memberId}`);
        const txRef = ref(database, `Transactions/Payments/${memberId}`);
        const [approvedSnap, txSnap] = await Promise.all([get(approvedRef), get(txRef)]);

        const collected = [];
        const sameLoan = (t = {}) => {
          const paymentLoanId = t.selectedLoanId || t.loanId || t.loan_id || t.selectedLoan || null;
          if (loan.loanId && paymentLoanId) {
            return String(paymentLoanId) === String(loan.loanId);
          }

          const relatedId =
            t.relatedLoanId ||
            t.loanTransactionId ||
            t.loanTxnId ||
            t.transactionLoanId ||
            t.loanReferenceId ||
            null;

          if (loan.transactionId && relatedId) {
            return String(relatedId) === String(loan.transactionId);
          }

          const transactionMatch =
            t.transactionId ||
            t.txnId ||
            t.paymentTransactionId ||
            t.referenceId ||
            t.paymentId;

          if (loan.transactionId && transactionMatch) {
            return String(transactionMatch) === String(loan.transactionId);
          }

          return false;
        };

        const pushPayment = ({ source, id, payload }) => {
          const { displayDate, timestamp } = extractDateInfo(payload);
          const status = String(payload.status || payload.paymentStatus || '').toLowerCase();
          const isApproved = status === 'approved' || status === 'paid' || status === '';

          collected.push({
            source,
            id,
            amount: parseCurrencyValue(
              payload.amountPaid ||
              payload.amountApproved ||
              payload.approvedAmount ||
              payload.amountToBePaid ||
              payload.amount
            ) ?? 0,
            displayDate,
            timestamp,
            status: isApproved ? 'paid' : status,
            paymentOption: payload.paymentOption || payload.modeOfPayment || payload.method,
            receiptNumber:
              payload.referenceNumber ||
              payload.paymentReference ||
              payload.referenceId ||
              payload.receiptNumber ||
              payload.receipt,
          });
        };

        if (approvedSnap?.exists()) {
          const data = approvedSnap.val();
          Object.entries(data).forEach(([id, payload]) => {
            if (!sameLoan(payload)) return;
            const status = String(payload.status || '').toLowerCase();
            if (status && status !== 'approved' && status !== 'paid') return;
            pushPayment({ source: 'approved', id, payload });
          });
        }

        if (txSnap?.exists()) {
          const data = txSnap.val();
          Object.entries(data).forEach(([id, payload]) => {
            if (!sameLoan(payload)) return;
            const status = String(payload.status || payload.paymentStatus || '').toLowerCase();
            if (status && status !== 'approved' && status !== 'paid') return;
            pushPayment({ source: 'transaction', id, payload });
          });
        }

        const approvedOnly = collected.filter((payment) => payment.status === 'paid');
        approvedOnly.sort((a, b) => b.timestamp - a.timestamp);
        setPayments(approvedOnly);
      } catch (e) {
        console.error('Error fetching payments:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
    fetchPayments();
  }, [loan]);

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
            <Text style={styles.summaryValue}>{loanDetails.term ? `${loanDetails.term} months` : 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest</Text>
            <Text style={styles.summaryValue}>
              {loanDetails.interestRate ? `${Number(loanDetails.interestRate).toFixed(2)}%` : (loanDetails.interest ? formatCurrency(loanDetails.interest) : 'N/A')}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Payments</Text>

      {/* Payments list */}
      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {payments.length > 0 ? (
            payments.map((p, index) => (
              <View key={`${p.source}-${p.id ?? p.timestamp ?? index}`} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>{p.status === 'paid' ? 'Paid' : (p.status || 'Pending')}</Text>
                  {!!p.displayDate && (
                    <Text style={styles.paymentSub}>Date: {formatDate(p.displayDate)}</Text>
                  )}
                  {!!p.paymentOption && (
                    <Text style={styles.paymentSub}>Method: {p.paymentOption}</Text>
                  )}
                </View>
                <Text style={[styles.paymentAmount, { color: p.status === 'paid' ? '#4CAF50' : '#FFA000' }]}>
                  {p.status === 'paid' ? '+' : ''}{formatCurrency(p.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No payments found for this loan</Text>
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
    marginBottom: 16,
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
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  paymentSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  paymentAmount: { fontSize: 14, fontWeight: '700', marginLeft: 12 },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 16 },
});