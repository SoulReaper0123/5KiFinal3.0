import React, { useEffect, useState } from 'react';
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

const formatPeso = (amount) => {
  const n = Number(amount) || 0;
  return `₱${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const splitDateTime = (raw) => {
  if (!raw) return { date: 'N/A', time: 'N/A' };
  try {
    if (typeof raw === 'object' && raw.seconds) {
      const d = new Date(raw.seconds * 1000);
      return {
        date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }
    const d = new Date(raw);
    if (isNaN(d.getTime())) return { date: String(raw), time: '' };
    return {
      date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  } catch {
    return { date: String(raw), time: '' };
  }
};

export default function TransactionDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};

  const [memberBalance, setMemberBalance] = useState(null);

  const type = item?.label || item?.type || 'Transaction';
  const amount = item?.amount ?? 0;
  const txnId = item?.transactionId || item?.id || 'N/A';
  const approvedRaw = item?.dateApproved || item?.approvedAt || item?.dateApplied || null;
  const { date, time } = splitDateTime(approvedRaw);

  const icon = iconByType(type);
  const IconComp = icon.lib === 'Ionicons' ? Ionicons : (icon.lib === 'FontAwesome' ? FontAwesome : MaterialIcons);

  useEffect(() => {
    const fetchBalance = async () => {
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
      } catch (e) {
        // ignore
      }
    };
    fetchBalance();
  }, []);

  const paymentOption = item?.paymentOption;

  const sentence = () => {
    const a = formatPeso(amount);
    const usingTxt = paymentOption ? ` using ${paymentOption}` : '';
    if ((type || '').toLowerCase() === 'loan payment' || (type || '').toLowerCase() === 'payment') {
      return `Your loan payment of ${a} has been approved on ${date} at ${time}${usingTxt}.${memberBalance !== null ? ` Your new balance is ${formatPeso(memberBalance)}.` : ''}`;
    }
    if ((type || '').toLowerCase() === 'deposit') {
      return `Your deposit of ${a} has been approved on ${date} at ${time}${usingTxt}.${memberBalance !== null ? ` Your new balance is ${formatPeso(memberBalance)}.` : ''}`;
    }
    if ((type || '').toLowerCase() === 'withdraw' || (type || '').toLowerCase() === 'withdrawal') {
      return `Your withdrawal of ${a} has been approved on ${date} at ${time}${usingTxt}.${memberBalance !== null ? ` Your new balance is ${formatPeso(memberBalance)}.` : ''}`;
    }
    return `This ${type} was processed on ${date} at ${time}.`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Transaction Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <IconComp name={icon.name} size={40} color={icon.color} />
        </View>
        <Text style={styles.typeText}>{type}</Text>
        <Text style={styles.smallTime}>{time}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{formatPeso(amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{time}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>Reference Number</Text>
          <Text style={styles.value}>{txnId}</Text>
        </View>
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
  iconWrap: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  typeText: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  smallTime: { marginTop: 4, fontSize: 12, color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  value: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  messageCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  messageText: { color: '#0F172A', fontSize: 14, lineHeight: 20 },
});