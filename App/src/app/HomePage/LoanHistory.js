import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// LoanHistory: shows approved loan-related records for the current user
export default function LoanHistory() {
  const navigation = useNavigation();
  const route = useRoute();
  const [loans, setLoans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  // Inline expand removed; we now navigate to a details screen
  const [expandedLoanId, setExpandedLoanId] = useState(null); // unused
  const [paymentsByLoan, setPaymentsByLoan] = useState({}); // kept for computeLoanStatus if needed
  const [loadingByLoan, setLoadingByLoan] = useState({}); // kept for future use

  // Get email from multiple sources for better compatibility
  const getEmailFromSources = () => {
    const user = auth.currentUser;
    return user?.email || route.params?.user?.email || route.params?.email;
  };

  const email = getEmailFromSources();

  const fetchLoans = async () => {
    setLoading(true);
    try {
      // Read only Loans branch from Transactions
      const loansRef = ref(database, 'Transactions/Loans');
      const snapshot = await get(loansRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = [];

        for (const [memberId, list] of Object.entries(data)) {
          for (const [transactionId, details] of Object.entries(list)) {
            // only approved
            if ((details.status || '').toLowerCase() !== 'approved') continue;

            const itemEmail = (details.email || '').toLowerCase();
            if ((email || '').toLowerCase() !== itemEmail) continue;

            // Build a timestamp for sorting
            const getTimestamp = () => {
              if (details.timestamp && typeof details.timestamp === 'number') return details.timestamp;
              const dateToUse = details.dateApproved || details.dateApplied;
              if (!dateToUse) return Date.now();
              if (typeof dateToUse === 'object' && dateToUse.seconds) return dateToUse.seconds * 1000;
              const d = new Date(dateToUse);
              return isNaN(d.getTime()) ? Date.now() : d.getTime();
            };

            // We try to keep an identifier that links payments to this loan. The app uses selectedLoanId
            // in Payments. If not present, fall back to transactionId as a loose link.
            parsed.push({
              memberId,
              transactionId,
              email: details.email,
              amount: Number(details.loanAmount) || 0,
              dateApplied: details.dateApplied || null,
              dateApproved: details.dateApproved || null,
              timestamp: getTimestamp(),
              disbursement: details.disbursement || null,
              status: details.status || 'Approved',
              // carry possible IDs to match payments later
              loanId: details._loanId || details.loanId || details.selectedLoanId || null,
            });
          }
        }

        // Sort newest first
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setLoans(parsed);
      } else {
        setLoans([]);
      }
    } catch (e) {
      console.error('Error fetching loan history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [email]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

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

  // Helpers for expandable payments per-loan
  const loanKeyFor = (loan) => loan.loanId || loan.transactionId;

  const loadPaymentsForLoan = async (loan) => {
    const key = loanKeyFor(loan);
    setLoadingByLoan((prev) => ({ ...prev, [key]: true }));
    try {
      // Pull from both ApprovedPayments and Transactions/Payments then merge
      const approvedRef = ref(database, `Payments/ApprovedPayments/${loan.memberId}`);
      const txRef = ref(database, `Transactions/Payments/${loan.memberId}`);
      const [approvedSnap, txSnap] = await Promise.all([get(approvedRef), get(txRef)]);

      const collected = [];
      const sameLoan = (t) => {
        // Prefer exact link by selectedLoanId/loanId
        const tLoanId = t.selectedLoanId || t.loanId || null;
        if (loan.loanId && tLoanId) return String(tLoanId) === String(loan.loanId);
        // fallback: try to match by transactionId if system uses that to mark a loan
        const tRelated = t.relatedLoanId || t.loanTransactionId || t.loanTxnId || null;
        if (tRelated) return String(tRelated) === String(loan.transactionId);
        // weakest fallback: if none, include payments for same member filtered later by status/date
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
            status: status === 'approved' ? 'paid' : status, // normalize approved -> paid
            paymentOption: t.paymentOption || t.modeOfPayment,
          });
        });
      }

      // Sort newest first
      collected.sort((a, b) => b.timestamp - a.timestamp);
      setPaymentsByLoan((prev) => ({ ...prev, [key]: collected }));
    } catch (e) {
      console.error('Error loading payments:', e);
      setPaymentsByLoan((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingByLoan((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleExpand = (loan) => {
    const key = loanKeyFor(loan);
    setExpandedLoanId((prev) => (prev === key ? null : key));
    if (!paymentsByLoan[key]) {
      loadPaymentsForLoan(loan);
    }
  };

  // Derive status for the loan summary card (Paid if any paid this month, else Pending)
  const computeLoanStatus = (loan) => {
    try {
      const key = loanKeyFor(loan);
      const list = paymentsByLoan[key] || [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const paidThisMonth = list.some((p) => {
        const ts = typeof p.timestamp === 'number' ? p.timestamp : (p.dateApproved ? new Date(p.dateApproved).getTime() : 0);
        if (!ts) return false;
        const d = new Date(ts);
        return (p.status === 'paid') && d.getFullYear() === year && d.getMonth() === month;
      });
      return paidThisMonth ? 'Paid' : 'Pending';
    } catch {
      return 'Pending';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} style={{ padding: 6, borderRadius: 8 }}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Loan History</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loans.length > 0 ? (
            loans.map((loan) => {
              // Decide card status: Pending (default) or Paid (if we detect any paid tx this calendar month)
              const status = computeLoanStatus(loan);
              const statusColor = status === 'Paid' ? '#4CAF50' : '#FFA000';
              const key = loanKeyFor(loan);
              return (
                <View key={loan.transactionId}>
                  <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LoanPaymentHistory', { loan })}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="history" size={22} color="#1E3A5F" />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.title}>Transaction ID: {loan.transactionId}</Text>
                      <Text style={styles.sub}>{loan.dateApproved ? `Approved: ${formatDate(loan.dateApproved)}` : (loan.dateApplied ? `Applied: ${formatDate(loan.dateApplied)}` : 'Date: N/A')}</Text>
                    </View>
                    <View style={styles.rightCol}>
                      <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
                      <Text style={styles.amount}>-{formatCurrency(loan.amount)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No loan history found</Text>
          )}
        </ScrollView>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 30,
  },
  headerBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#E8F1FB',
    borderRadius: 14,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  sub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
  },
  status: {
    marginTop: 0,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
});