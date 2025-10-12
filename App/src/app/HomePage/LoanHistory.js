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

  const getUserIdFromSources = () => {
    const user = auth.currentUser;
    return (
      user?.uid ||
      user?.userId ||
      route.params?.user?.id ||
      route.params?.user?.userId ||
      route.params?.userId ||
      route.params?.id ||
      null
    );
  };

  const normalizedEmail = (email || '').toLowerCase();
  const normalizedUserId = (() => {
    const id = getUserIdFromSources();
    if (id === null || id === undefined) return '';
    return String(id).toLowerCase();
  })();

  const fetchLoans = async () => {
    setLoading(true);
    try {
      // Read paid loans from Loans/PaidLoans
      const paidRef = ref(database, 'Loans/PaidLoans');
      const snapshot = await get(paidRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = [];

        const parseNumeric = (value) => {
          if (value === null || value === undefined) return 0;
          if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
          if (typeof value === 'string') {
            const sanitized = value.replace(/[^0-9.-]/g, '');
            if (!sanitized.trim()) return 0;
            const num = Number(sanitized);
            return Number.isNaN(num) ? 0 : num;
          }
          return 0;
        };

        const normalizeTimestamp = (value) => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'number') {
            return value < 1e12 ? value * 1000 : value;
          }
          if (typeof value === 'object') {
            if (typeof value.seconds === 'number') {
              return value.seconds * 1000;
            }
            if (typeof value.toDate === 'function') {
              return value.toDate().getTime();
            }
          }
          if (typeof value === 'string') {
            const parsedValue = Date.parse(value);
            if (!Number.isNaN(parsedValue)) {
              return parsedValue;
            }
          }
          return null;
        };

        const resolveTimestamp = (txnDetails, memberData) => {
          const timestampCandidates = [
            txnDetails?.timestamp,
            txnDetails?.paidAt,
            txnDetails?.approvedAt,
            txnDetails?.createdAt,
            txnDetails?.updatedAt,
            memberData?.timestamp,
            memberData?.paidAt,
            memberData?.approvedAt,
            memberData?.createdAt,
            memberData?.updatedAt,
          ];

          for (const candidate of timestampCandidates) {
            const normalized = normalizeTimestamp(candidate);
            if (normalized !== null) {
              return normalized;
            }
          }

          const dateCandidates = [
            txnDetails?.dateApproved,
            txnDetails?.datePaid,
            txnDetails?.paymentDate,
            txnDetails?.paymentDateTime,
            memberData?.dateApproved,
            memberData?.datePaid,
            memberData?.paymentDate,
          ];

          for (const candidate of dateCandidates) {
            const normalized = normalizeTimestamp(candidate);
            if (normalized !== null) {
              return normalized;
            }
          }

          return Date.now();
        };

        const resolveLoanType = (txnDetails, memberData) => (
          txnDetails?.loanType ||
          txnDetails?.loanName ||
          txnDetails?.loanTypeName ||
          txnDetails?.type ||
          memberData?.loanType ||
          memberData?.loanName ||
          memberData?.loanTypeName ||
          memberData?.type ||
          null
        );

        const matchesCurrentUser = (txnEmail, txnUserId, memberIdFromPath) => {
          const emailMatches = normalizedEmail && txnEmail === normalizedEmail;
          const idMatches = normalizedUserId &&
            (String(txnUserId ?? memberIdFromPath).toLowerCase() === normalizedUserId);

          if (!normalizedEmail && !normalizedUserId) return true;
          return emailMatches || idMatches;
        };

        Object.entries(data).forEach(([memberId, memberNode]) => {
          if (!memberNode || typeof memberNode !== 'object') return;

          const memberData = memberNode.data || memberNode.loanData || memberNode.details || {};
          const transactionsNode =
            memberNode.transaction ||
            memberNode.transactions ||
            memberNode.txn ||
            memberNode; // fallback for flat structures

          if (!transactionsNode || typeof transactionsNode !== 'object') return;

          Object.entries(transactionsNode).forEach(([transactionKey, txnDetailsRaw]) => {
            if (!txnDetailsRaw || typeof txnDetailsRaw !== 'object') return;
            if (['data', 'loanData', 'details'].includes(transactionKey)) return;

            const txnDetails = txnDetailsRaw;
            const txnEmail = (
              txnDetails.email ||
              txnDetails.memberEmail ||
              txnDetails.borrowerEmail ||
              memberData.email ||
              memberData.memberEmail ||
              ''
            )
              .toString()
              .toLowerCase();

            const txnUserId = txnDetails.userId || txnDetails.memberId || txnDetails.borrowerId || memberData.userId;

            if (!matchesCurrentUser(txnEmail, txnUserId, memberId)) return;

            const status = String(txnDetails.status || memberData.status || 'paid').toLowerCase();
            if (status !== 'paid') return;

            parsed.push({
              memberId,
              transactionId:
                txnDetails.transactionId ||
                txnDetails.txnId ||
                txnDetails.referenceId ||
                transactionKey,
              email: txnEmail,
              amount: parseNumeric(
                txnDetails.amountPaid ||
                  txnDetails.totalTermPayment ||
                  txnDetails.totalAmount ||
                  txnDetails.amount ||
                  txnDetails.amountToBePaid ||
                  memberData.amountPaid ||
                  memberData.totalTermPayment ||
                  memberData.totalAmount ||
                  memberData.amount
              ),
              dateApproved:
                txnDetails.dateApproved ||
                txnDetails.datePaid ||
                txnDetails.paymentDate ||
                txnDetails.dateApplied ||
                memberData.dateApproved ||
                memberData.datePaid ||
                memberData.paymentDate ||
                null,
              timestamp: resolveTimestamp(txnDetails, memberData),
              status: 'paid',
              loanType: resolveLoanType(txnDetails, memberData),
              loanId:
                txnDetails.selectedLoanId ||
                txnDetails.loanId ||
                txnDetails.loan_id ||
                memberData.selectedLoanId ||
                memberData.loanId ||
                memberData.loan_id ||
                null,
              relatedLoanId:
                txnDetails.relatedLoanId ||
                txnDetails.loanTransactionId ||
                txnDetails.loanTxnId ||
                memberData.relatedLoanId ||
                memberData.loanTransactionId ||
                memberData.loanTxnId ||
                null,
              rawDetails: { ...memberData, ...txnDetails },
            });
          });
        });

        parsed.sort((a, b) => b.timestamp - a.timestamp);

        // Fetch payments for each loan to check for common originalTransactionId
        for (const loan of parsed) {
          try {
            const paymentsRef = ref(database, `Payments/ApprovedPayments/${loan.memberId}`);
            const paymentsSnap = await get(paymentsRef);
            if (paymentsSnap.exists()) {
              const paymentsData = paymentsSnap.val();
              const loanPayments = Object.values(paymentsData).filter(p => p.appliedToLoan === loan.transactionId);
              const originalIds = loanPayments.map(p => p.originalTransactionId).filter(id => id);
              if (originalIds.length > 0) {
                const uniqueIds = [...new Set(originalIds)];
                if (uniqueIds.length === 1) {
                  loan.commonOriginalTransactionId = uniqueIds[0];
                }
              }
            }
          } catch (e) {
            console.error('Error fetching payments for loan:', loan.transactionId, e);
          }
        }

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

  const formatLoanType = (loan) => {
    const directType = loan.loanType || loan.loanName || loan.type || null;
    if (directType) return directType;

    const details = loan.rawDetails || loan;
    if (details && typeof details === 'object') {
      const candidate =
        details.loanType ||
        details.loanName ||
        details.loanTypeName ||
        details.type ||
        details.selectedLoan ||
        details.selectedLoanType;
      if (candidate) return candidate;
    }

    return 'Loan';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitleText}>Loan History</Text>
        </View>
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
            loans.map((loan) => (
              <View key={loan.transactionId}>
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LoanPaymentHistory', { loan })}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="history" size={22} color="#1E3A5F" />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.title}>{formatLoanType(loan)}</Text>
                    <Text style={styles.sub}>{formatCurrency(loan.amount)}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={[styles.status, { color: '#4CAF50' }]}>PAID</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No paid loans found</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerBackBtn: {
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'center',
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