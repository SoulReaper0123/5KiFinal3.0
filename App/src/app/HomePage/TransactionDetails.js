import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Dimensions, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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

export default function TransactionDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};

  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Extract data passed from Transactions screen
  const type = item?.label || item?.type || 'Transaction';
  const amount = item?.amount ?? 0;
  const txnId = item?.transactionId || item?.id || 'N/A';
  const memberId = item?.memberId || item?.id || 'N/A';
  const proofOfTransactionUrl = item?.proofOfTransactionUrl || null;
  
  // Get date and time from timestamp
  const ts = typeof item?.timestamp === 'number' ? new Date(item.timestamp) : 
           item?.dateApproved ? new Date(item.dateApproved) : 
           item?.dateRejected ? new Date(item.dateRejected) : 
           item?.dateApplied ? new Date(item.dateApplied) : null;
  
  const date = ts ? ts.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
  const time = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const icon = iconByType(type);
  const IconComp = icon.lib === 'Ionicons' ? Ionicons : (icon.lib === 'FontAwesome' ? FontAwesome : MaterialIcons);
  
  // Check if proof is PDF or Image
  const isPdf = proofOfTransactionUrl ? proofOfTransactionUrl.toLowerCase().endsWith('.pdf') : false;

  const handleViewProof = () => {
    if (!proofOfTransactionUrl) {
      Alert.alert('No Proof', 'Proof of transaction is not available for this transaction.');
      return;
    }
    
    if (isPdf) {
      // Open PDF in browser
      Linking.openURL(proofOfTransactionUrl).catch(err => {
        Alert.alert('Error', 'Unable to open the PDF file. Please check your internet connection.');
      });
    } else {
      // Show image in modal
      setImageModalVisible(true);
    }
  };

  const handleDownloadProof = async () => {
    if (!proofOfTransactionUrl) {
      Alert.alert('No Proof', 'No proof available to download.');
      return;
    }
    
    try {
      await Linking.openURL(proofOfTransactionUrl);
    } catch (error) {
      Alert.alert('Error', 'Unable to download the file. Please check your internet connection.');
    }
  };

  const getStatusBadge = () => {
    const status = item?.status || 'approved';
    let bgColor = '#10B981'; // green for approved/completed
    let textColor = '#FFFFFF';
    let text = 'Approved';

    if (status.toLowerCase() === 'rejected') {
      bgColor = '#EF4444';
      text = 'Rejected';
    } else if (status.toLowerCase() === 'pending') {
      bgColor = '#F59E0B';
      text = 'Pending';
    } else if (status.toLowerCase() === 'completed') {
      bgColor = '#10B981';
      text = 'Completed';
    }

    return { bgColor, textColor, text };
  };

  const statusBadge = getStatusBadge();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Transaction Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Transaction Icon & Status */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
          <IconComp name={icon.name} size={40} color={icon.color} />
        </View>
        <Text style={styles.typeText}>{type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
          <Text style={[styles.statusText, { color: statusBadge.textColor }]}>
            {statusBadge.text}
          </Text>
        </View>
      </View>

      {/* Basic Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="info" size={20} color="#1E3A5F" />
          <Text style={styles.cardTitle}>Transaction Information</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <MaterialIcons name="receipt" size={18} color="#64748B" />
            <Text style={styles.label}>Transaction ID</Text>
          </View>
          <Text style={styles.value}>{txnId}</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Feather name="user" size={18} color="#64748B" />
            <Text style={styles.label}>Member ID</Text>
          </View>
          <Text style={styles.value}>{memberId}</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Feather name="dollar-sign" size={18} color="#64748B" />
            <Text style={styles.label}>Amount</Text>
          </View>
          <Text style={[styles.value, styles.amountValue]}>{formatPeso(amount)}</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Feather name="calendar" size={18} color="#64748B" />
            <Text style={styles.label}>Date</Text>
          </View>
          <Text style={styles.value}>{date}</Text>
        </View>
        
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.labelContainer}>
            <Feather name="clock" size={18} color="#64748B" />
            <Text style={styles.label}>Time</Text>
          </View>
          <Text style={styles.value}>{time}</Text>
        </View>
      </View>

      {/* Proof of Transaction Section - Always shown */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="file-text" size={20} color="#1E3A5F" />
          <Text style={styles.cardTitle}>Proof of Transaction</Text>
        </View>
        
        {proofOfTransactionUrl ? (
          <View style={styles.proofContainer}>
            {/* If it's an image, show thumbnail */}
            {!isPdf && (
              <TouchableOpacity 
                style={styles.imageThumbnailContainer}
                onPress={() => setImageModalVisible(true)}
              >
                <Image
                  source={{ uri: proofOfTransactionUrl }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleViewProof}
              >
                <Feather name={isPdf ? "eye" : "maximize-2"} size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {isPdf ? 'View PDF' : 'View Image'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleDownloadProof}
              >
                <Feather name="download" size={20} color="#1E3A5F" />
                <Text style={styles.secondaryButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noProofContainer}>
            <Feather name="file" size={48} color="#94A3B8" />
            <Text style={styles.noProofTitle}>No Proof Available</Text>
            <Text style={styles.noProofText}>
              Proof of transaction is not available for this {type.toLowerCase()}.
            </Text>
          </View>
        )}
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.fullScreenModal}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Feather name="x" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Image Container */}
          <View style={styles.modalImageContainer}>
            <Image
              source={{ uri: proofOfTransactionUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Download Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalDownloadButton}
              onPress={handleDownloadProof}
            >
              <Feather name="download" size={20} color="#FFFFFF" />
              <Text style={styles.modalDownloadText}>Download Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    paddingBottom: 30,
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
    marginTop: 16, 
    marginBottom: 8 
  },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1E3A5F',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginLeft: 8,
  },
  row: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { 
    color: '#64748B', 
    fontSize: 14, 
    fontWeight: '500',
    marginLeft: 8,
  },
  value: { 
    color: '#1E293B', 
    fontSize: 14, 
    fontWeight: '600',
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '700',
  },
  proofContainer: {
    paddingTop: 8,
  },
  imageThumbnailContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    height: 200,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1E3A5F',
    fontSize: 14,
    fontWeight: '600',
  },
  noProofContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noProofTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
  },
  noProofText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalDownloadButton: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 10,
  },
  modalDownloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
