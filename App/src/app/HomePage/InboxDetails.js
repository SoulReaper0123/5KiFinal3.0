import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth, database } from '../../firebaseConfig';
import { ref as dbRef, get } from 'firebase/database';

const iconByType = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'deposit':
      return { name: 'arrow-downward', lib: 'MaterialIcons', color: '#1E3A5F' };
    case 'withdraw':
    case 'withdrawal':
      return { name: 'arrow-upward', lib: 'MaterialIcons', color: '#1E3A5F' };
    case 'loan':
      return { name: 'account-balance', lib: 'MaterialIcons', color: '#1E3A5F' };
    case 'loan payment':
    case 'payment':
      return { name: 'cash', lib: 'Ionicons', color: '#1E3A5F' };
    case 'registration':
      return { name: 'id-badge', lib: 'FontAwesome', color: '#1E3A5F' };
    default:
      return { name: 'receipt', lib: 'MaterialIcons', color: '#1E3A5F' };
  }
};

const toTime = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(raw);
  }
};

const peso = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InboxDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};

  const title = item?.label || item?.title || item?.type || 'Message';
  const timeText = toTime(item?.dateApproved || item?.approvedAt || item?.dateApplied) || '';

  // Fetch member balance
  const [memberBalance, setMemberBalance] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const email = auth.currentUser?.email;
        if (!email) return;
        const membersRef = dbRef(database, 'Members');
        const snap = await get(membersRef);
        if (snap.exists()) {
          const members = snap.val();
          const found = Object.values(members).find(m => m.email === email);
          if (found) setMemberBalance(found.balance || 0);
        }
      } catch {}
    })();
  }, []);

  // Compose sentence
  const sentence = useMemo(() => {
    const status = (item?.status || '').toLowerCase();

    // Top Ref No. must come from DB Transactions fetch (originalTransactionId)
    const originalRef = item?.originalTransactionId || item?.transactionId || 'N/A';

    // Bottom Ref No. should be the bare DB id (no type prefix like 'Deposits-')
    const cleanDbId = (val) => {
      if (!val) return '';
      const s = String(val);
      const withoutReminder = s.endsWith('-reminder') ? s.slice(0, -'-reminder'.length) : s;
      const firstDash = withoutReminder.indexOf('-');
      return firstDash >= 0 ? withoutReminder.slice(firstDash + 1) : withoutReminder;
    };
    const newRef = item?.transactionId || item?.originalTransactionId || cleanDbId(item?.id) || originalRef;

    const approvedDate = item?.dateApproved || item?.approvedAt || item?.dateApplied || '';
    const dateStr = (() => {
      try {
        const d = new Date(approvedDate);
        return isNaN(d.getTime()) ? String(approvedDate) : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } catch { return String(approvedDate); }
    })();

    const type = (item?.type || title || '').toLowerCase();

    const method = type.includes('deposit')
      ? (item?.depositOption || item?.paymentOption || item?.withdrawOption)
      : type.includes('payment')
      ? (item?.paymentOption || item?.depositOption || item?.withdrawOption)
      : type.includes('withdraw')
      ? (item?.withdrawOption || item?.paymentOption || item?.depositOption)
      : (item?.paymentOption || item?.depositOption || item?.withdrawOption);

    // Amount
    const amount = item?.amount || 0;

    const base = `Your ${type} application of Ref No. ${originalRef} with the amount of ${peso(amount)} on ${dateStr} has been ${status}${method ? ` using ${method}` : ''}.`;
    const ref2 = `\nRef No. ${newRef}`;
    return `${base}${ref2}`;
  }, [item, title]);

  const icon = iconByType(title);
  const IconComp = icon.lib === 'Ionicons' ? Ionicons : (icon.lib === 'FontAwesome' ? FontAwesome : MaterialIcons);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Inbox Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <IconComp name={icon.name} size={40} color={icon.color} />
        </View>
      </View>

      {timeText ? (
        <Text style={styles.timeText}>{timeText}</Text>
      ) : null}

      <Text style={styles.titleText}>{title}</Text>

      <View style={styles.divider} />

      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{sentence}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 30 },
  headerBar: {
    marginHorizontal: 16, marginTop: 10, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#E8F1FB', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  iconWrap: { alignItems: 'center', marginTop: 16 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  timeText: { marginTop: 10, fontSize: 14, color: '#64748B', textAlign: 'center' },
  titleText: { marginTop: 8, fontSize: 18, fontWeight: '700', color: '#1E3A5F', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16, marginTop: 12 },
  messageCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  messageText: { color: '#0F172A', fontSize: 14, lineHeight: 20 },
});