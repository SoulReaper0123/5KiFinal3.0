import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoanPaymentHistory() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const formatCurrency = (n) => `₱${(Number(n) || 0).toFixed(2)}`;
  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      if (!loan) { setLoading(false); return; }
      try {
        const approvedRef = ref(database, `Payments/ApprovedPayments/${loan.memberId}`);
        const txRef = ref(database, `Transactions/Payments/${loan.memberId}`);
        const [approvedSnap, txSnap] = await Promise.all([get(approvedRef), get(txRef)]);

        const collected = [];
        const sameLoan = (t) => {
          const tLoanId = t.selectedLoanId || t.loanId || null;
          if (loan.loanId && tLoanId) return String(tLoanId) === String(loan.loanId);
          const tRelated = t.relatedLoanId || t.loanTransactionId || t.loanTxnId || null;
          if (tRelated) return String(tRelated) === String(loan.transactionId);
          return true;
        };

        if (approvedSnap.exists()) {
          const data = approvedSnap.val();
          Object.entries(data).forEach(([id, t]) => {
            if (!sameLoan(t)) return;
            collected.push({
              source: 'approved',
              id,
              amount: Number(t.amount || t.amountToBePaid || 0),
              dateApproved: t.dateApproved,
              timestamp: typeof t.timestamp === 'number' ? t.timestamp : (t.dateApproved ? new Date(t.dateApproved).getTime() : Date.now()),
              status: 'paid',
              paymentOption: t.paymentOption || t.modeOfPayment,
            });
          });
        }

        if (txSnap.exists()) {
          const data = txSnap.val();
          Object.entries(data).forEach(([id, t]) => {
            if (!sameLoan(t)) return;
            const status = String(t.status || '').toLowerCase();
            collected.push({
              source: 'tx',
              id,
              amount: Number(t.amount || t.amountToBePaid || 0),
              dateApproved: t.dateApproved,
              timestamp: typeof t.timestamp === 'number' ? t.timestamp : (t.dateApproved ? new Date(t.dateApproved).getTime() : Date.now()),
              status: status === 'approved' ? 'paid' : status,
              paymentOption: t.paymentOption || t.modeOfPayment,
            });
          });
        }

        collected.sort((a, b) => b.timestamp - a.timestamp);
        setPayments(collected);
      } catch (e) {
        console.error('Error fetching payments:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [loan]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Payment History</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Loan summary */}
      {loan && (
        <View style={styles.loanSummary}>
          <Text style={styles.summaryTitle}>Loan: {loan.transactionId}</Text>
          <Text style={styles.summarySub}>
            {loan.dateApproved ? `Approved: ${formatDate(loan.dateApproved)}` : (loan.dateApplied ? `Applied: ${formatDate(loan.dateApplied)}` : 'Date: N/A')}
          </Text>
          <Text style={styles.summaryAmt}>-{formatCurrency(loan.amount)}</Text>
        </View>
      )}

      {/* Payments list */}
      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {payments.length > 0 ? (
            payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>{p.status === 'paid' ? 'Paid' : (p.status || 'Pending')}</Text>
                  {!!p.dateApproved && (
                    <Text style={styles.paymentSub}>Date: {formatDate(p.dateApproved)}</Text>
                  )}
                  {!!p.paymentOption && (
                    <Text style={styles.paymentSub}>Method: {p.paymentOption}</Text>
                  )}
                </View>
                <Text style={[styles.paymentAmount, { color: p.status === 'paid' ? '#4CAF50' : '#FFA000' }]}>
                  {p.status === 'paid' ? '-' : ''}{formatCurrency(p.amount)}
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
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },
  summarySub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  summaryAmt: { fontSize: 16, fontWeight: '700', color: '#E53935', marginTop: 6 },
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