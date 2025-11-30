import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth, database } from '../../firebaseConfig';
import { ref as dbRef, get } from 'firebase/database';

// Update the iconByType function
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
    case 'loan payment reminder':
      return { name: 'alarm', lib: 'MaterialIcons', color: '#FF9800' };
    case 'membership withdrawal':
      return { name: 'logout', lib: 'MaterialIcons', color: '#1E3A5F' };
    // ADD DIVIDEND CASE
    case 'dividend':
    case 'dividend distribution':
      return { name: 'attach-money', lib: 'MaterialIcons', color: '#4CAF50' };
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

  // Compose sentence - FIXED VERSION
  const sentence = useMemo(() => {
    const status = (item?.status || '').toLowerCase();
    const originalRef = item?.originalTransactionId || item?.transactionId || 'N/A';
    
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
    const amount = item?.amount || 0;

    // Handle Loan Payment Reminder specific message
    if (type.includes('loan payment reminder') || item?.isReminder) {
      return `Reminder: ${item?.message || 'Your loan payment is due soon.'}\nRef No. ${newRef}`;
    }

    // ========== DIVIDEND SPECIFIC MESSAGE ==========
    if (type.includes('dividend')) {
      if (status === 'approved' || status === 'distributed') {
        let message = `Your dividend of ${peso(amount)} has been distributed on ${dateStr}.`;
        
        // Add investment/balance details if available
        if (item?.addedToInvestment) {
          message += '\n• Added to your investment';
        }
        if (item?.addedToBalance) {
          message += '\n• Added to your balance';
        }
        
        message += `\nRef No. ${newRef}`;
        return message;
      } else if (status === 'pending') {
        return `Your dividend of ${peso(amount)} is pending distribution.\nRef No. ${newRef}`;
      } else {
        return `Dividend: ${peso(amount)} - Status: ${status}\nRef No. ${newRef}`;
      }
    }

    // Handle Membership Withdrawal specific message
    if (type.includes('membership withdrawal')) {
      const descRef = originalRef !== newRef ? ` of Ref No. ${originalRef}` : '';
      const base = `Your membership withdrawal application${descRef} with the amount of ${peso(amount)} on ${dateStr} has been ${status}.`;
      const ref2 = `\nRef No. ${newRef}`;
      
      // Add withdrawal reason if available
      const reasonText = item?.reason ? `\nReason: ${item.reason}` : '';
      
      return `${base}${reasonText}${ref2}`;
    }

    // ========== FIXED: Use proper wording for each transaction type ==========
    const method = type.includes('deposit')
      ? (item?.depositOption || item?.paymentOption || item?.withdrawOption)
      : type.includes('payment')
      ? (item?.paymentOption || item?.depositOption || item?.withdrawOption)
      : type.includes('withdraw')
      ? (item?.withdrawOption || item?.paymentOption || item?.depositOption)
      : (item?.paymentOption || item?.depositOption || item?.withdrawOption);

    const descRef = originalRef !== newRef ? ` of Ref No. ${originalRef}` : '';
    
    // Use appropriate wording based on transaction type
    let baseMessage = '';
    
    if (type.includes('deposit')) {
      baseMessage = `Your deposit${descRef} of ${peso(amount)} on ${dateStr} has been ${status}${method ? ` via ${method}` : ''}.`;
    } else if (type.includes('withdrawal')) {
      baseMessage = `Your withdrawal${descRef} of ${peso(amount)} on ${dateStr} has been ${status}${method ? ` via ${method}` : ''}.`;
    } else if (type.includes('loan')) {
      baseMessage = `Your loan${descRef} of ${peso(amount)} on ${dateStr} has been ${status}.`;
    } else if (type.includes('payment')) {
      baseMessage = `Your payment${descRef} of ${peso(amount)} on ${dateStr} has been ${status}${method ? ` via ${method}` : ''}.`;
    } else if (type.includes('registration')) {
      baseMessage = `Your registration${descRef} with fee of ${peso(amount)} on ${dateStr} has been ${status}.`;
    } else {
      // Fallback for unknown types
      baseMessage = `Your ${type}${descRef} of ${peso(amount)} on ${dateStr} has been ${status}${method ? ` using ${method}` : ''}.`;
    }

    // Add rejection reason if applicable
    const rejectionText = status === 'rejected' && item?.rejectionReason 
      ? `\nReason: ${item.rejectionReason}` 
      : '';

    return `${baseMessage}${rejectionText}\nRef No. ${newRef}`;
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
