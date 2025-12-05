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

const formatDate = (rawDate) => {
  if (!rawDate) return '';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return String(rawDate);
  }
};

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

  // Compose sentence - FIXED VERSION with separate Loan and Payment messages
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
    const dateStr = formatDate(approvedDate);

    const type = (item?.type || title || '').toLowerCase();
    const amount = item?.amount || 0;
    const formattedAmount = peso(amount);

    // Handle Loan Payment Reminder specific message
    if (type.includes('loan payment reminder') || item?.isReminder) {
      return `🔔 Payment Reminder\n\nYour monthly loan payment of ${formattedAmount} is due soon.\n\nTransaction ID: ${newRef}`;
    }

    // ========== DIVIDEND SPECIFIC MESSAGE ==========
    if (type.includes('dividend')) {
      if (status === 'approved' || status === 'distributed') {
        let message = `💰 Dividend Distribution\n\nYour dividend of ${formattedAmount} has been successfully distributed on ${dateStr}.`;
        
        // Add investment/balance details if available
        if (item?.addedToInvestment) {
          message += '\n• Added to your investment portfolio';
        }
        if (item?.addedToBalance) {
          message += '\n• Added to your available balance';
        }
        
        message += `\n\nTransaction ID: ${newRef}`;
        return message;
      } else if (status === 'pending') {
        return `⏳ Dividend Pending\n\nYour dividend of ${formattedAmount} is scheduled for distribution.\n\nTransaction ID: ${newRef}`;
      } else {
        return `Dividend Update\n\nAmount: ${formattedAmount}\nStatus: ${status}\nTransaction ID: ${newRef}`;
      }
    }

    // ========== SEPARATE MESSAGES FOR DIFFERENT TRANSACTION TYPES ==========
    const method = type.includes('deposit')
      ? (item?.depositOption || item?.paymentOption || item?.withdrawOption)
      : type.includes('payment')
      ? (item?.paymentOption || item?.depositOption || item?.withdrawOption)
      : type.includes('withdraw')
      ? (item?.withdrawOption || item?.paymentOption || item?.depositOption)
      : (item?.paymentOption || item?.depositOption || item?.withdrawOption);

    const descRef = originalRef !== newRef ? ` (Reference: ${originalRef})` : '';
    
    let baseMessage = '';
    
    // ========== LOAN MESSAGES ==========
    if (type.includes('loan') && !type.includes('payment')) {
      if (status === 'approved') {
        baseMessage = `✅ Loan Application Approved\n\nCongratulations! Your loan application${descRef} for ${formattedAmount} has been approved on ${dateStr}.\n\nThe loan amount will be disbursed to your account shortly.`;
      } else if (status === 'rejected') {
        baseMessage = `❌ Loan Application Not Approved\n\nWe regret to inform you that your loan application${descRef} for ${formattedAmount} was not approved on ${dateStr}.`;
      } else {
        baseMessage = `⏳ Loan Application Under Review\n\nYour loan application${descRef} for ${formattedAmount} is currently being evaluated by our credit team.\n\nWe will notify you once a decision has been made.`;
      }
    }
    
    // ========== PAYMENT MESSAGES ==========
    else if (type.includes('payment')) {
      if (status === 'approved') {
        baseMessage = `✅ Loan Payment Received\n\nThank you! Your loan payment${descRef} of ${formattedAmount} has been successfully processed on ${dateStr}.`;
        if (method) {
          baseMessage += `\nPayment Method: ${method}`;
        }
        baseMessage += `\n\nYour payment has been applied to your loan balance.`;
      } else if (status === 'rejected') {
        baseMessage = `❌ Payment Not Accepted\n\nYour loan payment${descRef} of ${formattedAmount} was not accepted on ${dateStr}.`;
        if (method) {
          baseMessage += `\nPayment Method: ${method}`;
        }
      } else {
        baseMessage = `⏳ Payment Being Processed\n\nYour loan payment${descRef} of ${formattedAmount} is being confirmed and will be processed soon.`;
        if (method) {
          baseMessage += `\nPayment Method: ${method}`;
        }
      }
    }
    
    // ========== DEPOSIT MESSAGES ==========
    else if (type.includes('deposit')) {
      if (status === 'approved') {
        baseMessage = `✅ Deposit Successful\n\nYour deposit${descRef} of ${formattedAmount} has been processed and credited to your account on ${dateStr}.`;
        if (method) {
          baseMessage += `\nDeposit Method: ${method}`;
        }
      } else if (status === 'rejected') {
        baseMessage = `❌ Deposit Declined\n\nYour deposit${descRef} of ${formattedAmount} was not accepted on ${dateStr}.`;
        if (method) {
          baseMessage += `\nDeposit Method: ${method}`;
        }
      } else {
        baseMessage = `⏳ Deposit Under Review\n\nYour deposit${descRef} of ${formattedAmount} is being verified and will be processed soon.`;
        if (method) {
          baseMessage += `\nDeposit Method: ${method}`;
        }
      }
    }
    
    // ========== WITHDRAWAL MESSAGES ==========
    else if (type.includes('withdrawal')) {
      if (status === 'approved') {
        baseMessage = `✅ Withdrawal Authorized\n\nYour withdrawal${descRef} of ${formattedAmount} has been approved and will be processed on ${dateStr}.`;
        if (method) {
          baseMessage += `\nWithdrawal Method: ${method}`;
        }
      } else if (status === 'rejected') {
        baseMessage = `❌ Withdrawal Not Approved\n\nYour withdrawal${descRef} of ${formattedAmount} was not authorized on ${dateStr}.`;
        if (method) {
          baseMessage += `\nWithdrawal Method: ${method}`;
        }
      } else {
        baseMessage = `⏳ Withdrawal Pending\n\nYour withdrawal${descRef} of ${formattedAmount} is undergoing approval and will be processed soon.`;
        if (method) {
          baseMessage += `\nWithdrawal Method: ${method}`;
        }
      }
    }
    
    // ========== REGISTRATION MESSAGES ==========
    else if (type.includes('registration')) {
      if (status === 'approved') {
        baseMessage = `✅ Registration Confirmed\n\nWelcome! Your registration${descRef} with fee of ${formattedAmount} has been confirmed on ${dateStr}.\n\nYour account is now active.`;
      } else if (status === 'rejected') {
        baseMessage = `❌ Registration Not Approved\n\nYour registration${descRef} with fee of ${formattedAmount} was not approved on ${dateStr}.`;
      } else {
        baseMessage = `⏳ Registration Pending\n\nYour registration${descRef} with fee of ${formattedAmount} is awaiting confirmation.\n\nWe will notify you once your registration is processed.`;
      }
    }
    
    // ========== FALLBACK FOR UNKNOWN TYPES ==========
    else {
      if (status === 'approved') {
        baseMessage = `✅ ${title} Approved\n\nYour ${type}${descRef} of ${formattedAmount} has been successfully processed on ${dateStr}.`;
      } else if (status === 'rejected') {
        baseMessage = `❌ ${title} Not Approved\n\nYour ${type}${descRef} of ${formattedAmount} was not approved on ${dateStr}.`;
      } else {
        baseMessage = `⏳ ${title} Pending\n\nYour ${type}${descRef} of ${formattedAmount} is currently under review.`;
      }
    }

    // Add rejection reason if applicable
    const rejectionText = status === 'rejected' && item?.rejectionReason 
      ? `\n\nReason for rejection: ${item.rejectionReason}` 
      : '';

    return `${baseMessage}${rejectionText}\n\nTransaction ID: ${newRef}`;
  }, [item, title]);

  const icon = iconByType(title);
  const IconComp = icon.lib === 'Ionicons' ? Ionicons : (icon.lib === 'FontAwesome' ? FontAwesome : MaterialIcons);

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
  headerIconButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitleText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E3A5F' 
  },
  iconWrap: { 
    alignItems: 'center', 
    marginTop: 16 
  },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 2, 
    borderColor: '#1E3A5F', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  timeText: { 
    marginTop: 10, 
    fontSize: 14, 
    color: '#64748B', 
    textAlign: 'center' 
  },
  titleText: { 
    marginTop: 8, 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E3A5F', 
    textAlign: 'center' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#E2E8F0', 
    marginHorizontal: 16, 
    marginTop: 12 
  },
  messageCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginTop: 12, 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  messageText: { 
    color: '#0F172A', 
    fontSize: 14, 
    lineHeight: 22 
  },
});
