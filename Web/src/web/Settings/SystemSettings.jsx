import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrashAlt, FaPlus, FaExchangeAlt, FaCopy, FaRedo } from 'react-icons/fa';

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '20px'
  },
  contentContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
  },
  header: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '25px',
    textAlign: 'center',
    color: '#1e293b',
    paddingBottom: '10px',
    borderBottom: '2px solid #e2e8f0'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)'
    }
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  inputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    gap: '15px'
  },
  label: {
    flex: 1,
    fontSize: '16px',
    color: '#334155',
    fontWeight: '500'
  },
  input: {
    flex: 1,
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#fff',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: '#2563eb',
      outline: 'none'
    }
  },
  staticInput: {
    flex: 1,
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#f8fafc',
    color: '#64748b'
  },
  miniInput: {
    width: '80px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '16px',
    textAlign: 'center',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: '#2563eb',
      outline: 'none'
    }
  },
  staticText: {
    fontSize: '16px',
    color: '#334155',
    padding: '12px 0'
  },
  rateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f1f5f9'
    }
  },
  termText: {
    fontSize: '16px',
    color: '#334155',
    fontWeight: '500'
  },
  editRateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  deleteTermBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '6px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#fee2e2'
    }
  },
  addTermBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#059669'
    }
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    marginTop: '20px',
    marginBottom: '30px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-1px)'
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  },
  saveMode: {
    backgroundColor: '#1d4ed8',
    boxShadow: '0 4px 6px rgba(29, 78, 216, 0.3)'
  },
  dateButton: {
    color: '#2563eb',
    marginBottom: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    textAlign: 'left',
    padding: '12px 0',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#1d4ed8'
    }
  },
  calendarContainer: {
    marginTop: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '60px',
    height: '34px'
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#cbd5e1',
    transition: '.4s',
    borderRadius: '34px'
  },
  sliderBefore: {
    position: 'absolute',
    content: '""',
    height: '26px',
    width: '26px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%'
  },
  switchInputChecked: {
    backgroundColor: '#10b981'
  },
  sliderBeforeChecked: {
    transform: 'translateX(26px)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    animation: 'fadeIn 0.3s ease'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#1e293b',
    textAlign: 'center'
  },
  modalText: {
    fontSize: '16px',
    marginBottom: '20px',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: '1.5'
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: '#2563eb',
      outline: 'none'
    }
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  modalBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    flex: 1,
    transition: 'all 0.2s',
    '&:hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)'
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b'
  },
  confirmBtn: {
    backgroundColor: '#2563eb',
    color: 'white'
  },
  successBtn: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  errorBtn: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  loading: {
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '18px',
    color: '#64748b'
  },
  fundsActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  actionBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      opacity: 0.9,
      transform: 'translateY(-1px)'
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  },
  addFundsBtn: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  withdrawFundsBtn: {
    backgroundColor: '#f97316',
    color: 'white'
  },
  copyBtn: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#bfdbfe'
    }
  },
  generateBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#1d4ed8'
    }
  },
  copiedText: {
    fontSize: '14px',
    color: '#10b981',
    marginLeft: '10px',
    fontWeight: '500'
  },
  orientationCodeContainer: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd'
  },
  orientationCodeTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '10px'
  },
  orientationCodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  orientationCodeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#075985',
    backgroundColor: '#e0f2fe',
    padding: '8px 12px',
    borderRadius: '6px'
  },
  orientationCodeDescription: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '8px'
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px'
  },
  accountCard: {
    flex: 1,
    padding: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc'
  },
  accountTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#1e293b'
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  textarea: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#fff',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'border-color 0.2s',
    minHeight: '300px',
    resize: 'vertical',
    width: '100%',
    '&:focus': {
      borderColor: '#2563eb',
      outline: 'none'
    }
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  editButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  }
};

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    LoanPercentage: '',
    Funds: '',
    Savings: '',
    InterestRate: {},
    AdvancedPayments: false,
    DividendDate: '',
    PenaltyValue: '',
    PenaltyType: 'percentage',
    OrientationCode: '',
    Accounts: {
      Bank: { accountName: '', accountNumber: '' },
      GCash: { accountName: '', accountNumber: '' }
    },
    TermsAndConditions: {
      title: 'Terms and Conditions',
      content: ''
    },
    PrivacyPolicy: {
      title: 'Privacy Policy',
      content: ''
    },
    AboutUs: {
      title: 'About Us',
      content: ''
    },
    ContactUs: {
      title: 'Contact Us',
      content: ''
    }
  });

  const [newTerm, setNewTerm] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editTerms, setEditTerms] = useState(false);
  const [editPrivacy, setEditPrivacy] = useState(false);
  const [editAboutUs, setEditAboutUs] = useState(false);
  const [editContactUs, setEditContactUs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orientationCopied, setOrientationCopied] = useState(false);

  // Modal states
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [termToDelete, setTermToDelete] = useState('');
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [fundsActionModal, setFundsActionModal] = useState(null);
  const [actionAmount, setActionAmount] = useState('');
  const [messageModal, setMessageModal] = useState({ visible: false, title: '', message: '', isError: false });

  const db = getDatabase();

  useEffect(() => {
    const settingsRef = ref(db, 'Settings/');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          LoanPercentage: data.LoanPercentage?.toString() || '',
          Funds: data.Funds?.toString() || '',
          Savings: data.Savings?.toString() || '',
          InterestRate: Object.fromEntries(
            Object.entries(data.InterestRate || {}).map(([key, val]) => [key, val.toString()])
          ),
          AdvancedPayments: data.AdvancedPayments || false,
          DividendDate: data.DividendDate || '',
          PenaltyValue: data.PenaltyValue?.toString() || '',
          PenaltyType: data.PenaltyType || 'percentage',
          OrientationCode: data.OrientationCode || generateOrientationCode(),
          Accounts: data.Accounts || {
            Bank: { accountName: '', accountNumber: '' },
            GCash: { accountName: '', accountNumber: '' }
          },
          TermsAndConditions: data.TermsAndConditions || {
            title: 'Terms and Conditions',
            content: 'No terms available.'
          },
          PrivacyPolicy: data.PrivacyPolicy || {
            title: 'Privacy Policy',
            content: 'No privacy policy available.'
          },
          AboutUs: data.AboutUs || {
            title: 'About Us',
            content: 'No information available.'
          },
          ContactUs: data.ContactUs || {
            title: 'Contact Us',
            content: 'No contact information available.'
          }
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateOrientationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setOrientationCopied(true);
      setTimeout(() => setOrientationCopied(false), 2000);
      showMessage('Success', 'Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showMessage('Error', 'Failed to copy code', true);
    }
  };

  const handleGenerateOrientationCode = () => {
    const newCode = generateOrientationCode();
    setSettings({ ...settings, OrientationCode: newCode });
    showMessage('Success', 'New orientation code generated!');
  };

  const showMessage = (title, message, isError = false) => {
    setMessageModal({ visible: true, title, message, isError });
    setTimeout(() => setMessageModal({ ...messageModal, visible: false }), 3000);
  };

  const handleInputChange = (key, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    if (clean.split('.').length > 2) return;
    setSettings({ ...settings, [key]: clean });
  };

  const handleInterestChange = (term, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    if (clean.split('.').length > 2) return;
    setSettings((prev) => ({
      ...prev,
      InterestRate: { ...prev.InterestRate, [term]: clean },
    }));
  };

  const handleAccountChange = (accountType, field, value) => {
    setSettings(prev => ({
      ...prev,
      Accounts: {
        ...prev.Accounts,
        [accountType]: {
          ...prev.Accounts[accountType],
          [field]: value
        }
      }
    }));
  };

  const confirmAddTerm = () => {
    if (!newTerm || !newRate) {
      showMessage('Error', 'Please enter both term and interest rate.', true);
      return;
    }
    if (settings.InterestRate[newTerm]) {
      showMessage('Error', 'This term already exists.', true);
      return;
    }

    setSettings((prev) => ({
      ...prev,
      InterestRate: { ...prev.InterestRate, [newTerm]: newRate },
    }));
    setNewTerm('');
    setNewRate('');
    setAddModalVisible(false);
    showMessage('Success', 'Interest rate added successfully!');
  };

  const requestAddTerm = () => {
    if (!newTerm || !newRate) {
      showMessage('Error', 'Please enter both term and rate.', true);
      return;
    }
    setAddModalVisible(true);
  };

  const requestDeleteTerm = (term) => {
    setTermToDelete(term);
    setDeleteModalVisible(true);
  };

  const confirmDeleteTerm = () => {
    const updatedRates = { ...settings.InterestRate };
    delete updatedRates[termToDelete];
    setSettings((prev) => ({ ...prev, InterestRate: updatedRates }));
    setDeleteModalVisible(false);
    showMessage('Success', 'Interest rate deleted successfully!');
  };

  const handleSave = () => setConfirmationModalVisible(true);

  const confirmSave = () => {
    const settingsRef = ref(db, 'Settings/');
    const parsedInterest = {};
    for (let key in settings.InterestRate) {
      const val = parseFloat(settings.InterestRate[key]);
      if (!isNaN(val)) parsedInterest[key] = val;
    }

    const updatedData = {
      LoanPercentage: parseFloat(settings.LoanPercentage),
      Funds: parseFloat(settings.Funds),
      Savings: parseFloat(settings.Savings),
      InterestRate: parsedInterest,
      AdvancedPayments: settings.AdvancedPayments,
      DividendDate: settings.DividendDate,
      PenaltyValue: parseFloat(settings.PenaltyValue),
      PenaltyType: settings.PenaltyType,
      OrientationCode: settings.OrientationCode,
      Accounts: settings.Accounts,
      TermsAndConditions: settings.TermsAndConditions,
      PrivacyPolicy: settings.PrivacyPolicy,
      AboutUs: settings.AboutUs,
      ContactUs: settings.ContactUs
    };

    update(settingsRef, updatedData)
      .then(() => {
        setConfirmationModalVisible(false);
        setEditMode(false);
        setEditTerms(false);
        setEditPrivacy(false);
        setEditAboutUs(false);
        setEditContactUs(false);
        showMessage('Success', 'Settings updated successfully!');
      })
      .catch((error) => {
        showMessage('Error', 'Failed to update settings: ' + error.message, true);
      });
  };

  const handleDateChange = (date) => {
    setSettings({ ...settings, DividendDate: date.toISOString().split('T')[0] });
    setShowCalendar(false);
  };

  const handleFundsAction = (action) => {
    setFundsActionModal(action);
    setActionAmount('');
  };

  const confirmFundsAction = () => {
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      showMessage('Error', 'Please enter a valid positive amount', true);
      return;
    }

    if (fundsActionModal === 'add' && amount > parseFloat(settings.Savings)) {
      showMessage('Error', 'Not enough savings to transfer', true);
      return;
    }

    if (fundsActionModal === 'withdraw' && amount > parseFloat(settings.Funds)) {
      showMessage('Error', 'Not enough funds to withdraw', true);
      return;
    }

    let newFunds = parseFloat(settings.Funds);
    let newSavings = parseFloat(settings.Savings);

    switch (fundsActionModal) {
      case 'add':
        newFunds += amount;
        newSavings -= amount;
        break;
      case 'withdraw':
        newFunds -= amount;
        newSavings += amount;
        break;
      default:
        break;
    }

    setSettings({
      ...settings,
      Funds: newFunds.toString(),
      Savings: newSavings.toString()
    });

    setFundsActionModal(null);
    setActionAmount('');
    showMessage('Success', `Funds ${fundsActionModal === 'add' ? 'added' : 'withdrawn'} successfully!`);
  };

  const handleAddSavings = () => {
    setSavingsModalVisible(true);
    setActionAmount('');
  };

  const confirmAddSavings = () => {
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      showMessage('Error', 'Please enter a valid positive amount', true);
      return;
    }

    const newSavings = (parseFloat(settings.Savings) + amount).toString();
    setSettings({
      ...settings,
      Savings: newSavings
    });

    setSavingsModalVisible(false);
    setActionAmount('');
    showMessage('Success', 'Savings added successfully!');
  };

  if (loading) return <div style={styles.loading}>Loading settings...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <h1 style={styles.header}>System Settings</h1>

        {/* Accounts Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Accounts</h2>
          
          <div style={styles.accountRow}>
            <div style={styles.accountCard}>
              <h3 style={styles.accountTitle}>Bank Account</h3>
              <InputRow
                label="Account Name"
                value={settings.Accounts.Bank.accountName}
                onChange={(text) => handleAccountChange('Bank', 'accountName', text)}
                editable={editMode}
              />
              <InputRow
                label="Account Number"
                value={settings.Accounts.Bank.accountNumber}
                onChange={(text) => handleAccountChange('Bank', 'accountNumber', text)}
                editable={editMode}
              />
            </div>
            
            <div style={styles.accountCard}>
              <h3 style={styles.accountTitle}>GCash Account</h3>
              <InputRow
                label="Account Name"
                value={settings.Accounts.GCash.accountName}
                onChange={(text) => handleAccountChange('GCash', 'accountName', text)}
                editable={editMode}
              />
              <InputRow
                label="Account Number"
                value={settings.Accounts.GCash.accountNumber}
                onChange={(text) => handleAccountChange('GCash', 'accountNumber', text)}
                editable={editMode}
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Financial Settings</h2>
          
          <InputRow
            label="Loanable Amount Percentage"
            value={settings.LoanPercentage}
            onChange={(text) => handleInputChange('LoanPercentage', text)}
            editable={editMode}
            suffix="%"
          />
          
          <div style={styles.inputRow}>
            <label style={styles.label}>Available Funds (₱)</label>
            <input 
              style={styles.staticInput} 
              value={settings.Funds} 
              readOnly 
            />
          </div>

          <div style={styles.inputRow}>
            <label style={styles.label}>Savings (₱)</label>
            {editMode ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  style={styles.staticInput}
                  value={settings.Savings}
                  readOnly
                />
                <button 
                  style={{ ...styles.actionBtn, ...styles.addFundsBtn }}
                  onClick={handleAddSavings}
                >
                  <FaPlus /> Add
                </button>
              </div>
            ) : (
              <span style={styles.staticText}>₱{settings.Savings}</span>
            )}
          </div>

          {editMode && (
            <div style={styles.fundsActions}>
              <button 
                style={{ ...styles.actionBtn, ...styles.addFundsBtn }}
                onClick={() => handleFundsAction('add')}
                disabled={!settings.Savings || parseFloat(settings.Savings) <= 0}
              >
                <FaExchangeAlt /> Add to Funds
              </button>
              <button 
                style={{ ...styles.actionBtn, ...styles.withdrawFundsBtn }}
                onClick={() => handleFundsAction('withdraw')}
                disabled={!settings.Funds || parseFloat(settings.Funds) <= 0}
              >
                <FaExchangeAlt /> Withdraw to Savings
              </button>
            </div>
          )}
        </div>

        {/* Orientation Code */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Orientation Registration Code</h2>
          <div style={styles.orientationCodeContainer}>
            <div style={styles.orientationCodeTitle}>Orientation Attendance Code</div>
            <div style={styles.orientationCodeRow}>
              <div style={styles.orientationCodeValue}>
                {settings.OrientationCode || 'Not set'}
              </div>
              {settings.OrientationCode && (
                <button 
                  style={styles.copyBtn}
                  onClick={() => copyToClipboard(settings.OrientationCode)}
                  aria-label="Copy orientation code"
                >
                  <FaCopy />
                </button>
              )}
              {orientationCopied && <span style={styles.copiedText}>Copied!</span>}
            </div>
            {editMode && (
              <button 
                style={styles.generateBtn}
                onClick={handleGenerateOrientationCode}
              >
                <FaRedo /> Generate New Code
              </button>
            )}
            <p style={styles.orientationCodeDescription}>
              This code is used for registration when attending the orientation. Share this code with attendees.
            </p>
          </div>
        </div>

        {/* Interest Rates */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Interest Rates</h2>
          {Object.entries(settings.InterestRate).map(([term, rate]) => (
            <div key={term} style={styles.rateRow}>
              <span style={styles.termText}>{term} months</span>
              {editMode ? (
                <div style={styles.editRateRow}>
                  <input
                    style={styles.miniInput}
                    value={rate}
                    onChange={(e) => handleInterestChange(term, e.target.value)}
                    type="number"
                  />
                  <span>%</span>
                  <button 
                    style={styles.deleteTermBtn}
                    onClick={() => requestDeleteTerm(term)}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ) : (
                <span style={styles.staticText}>{rate}%</span>
              )}
            </div>
          ))}
          {editMode && (
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                placeholder="New Term (e.g. 6)"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                type="number"
              />
              <input
                style={styles.input}
                placeholder="Interest Rate (%)"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                type="number"
              />
              <button style={styles.addTermBtn} onClick={requestAddTerm}>
                <FaPlus /> Add
              </button>
            </div>
          )}
        </div>

        {/* Loan Settings */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Loan Settings</h2>
          
          <div style={styles.inputRow}>
            <label style={styles.label}>Advanced Payments</label>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.AdvancedPayments}
                onChange={(e) => setSettings({ ...settings, AdvancedPayments: e.target.checked })}
                disabled={!editMode}
                style={styles.switchInput}
              />
              <span style={{
                ...styles.slider,
                ...(settings.AdvancedPayments ? styles.switchInputChecked : {})
              }}>
                <span style={{
                  ...styles.sliderBefore,
                  ...(settings.AdvancedPayments ? styles.sliderBeforeChecked : {})
                }}></span>
              </span>
            </label>
          </div>
          
          <InputRow
            label="Penalty Value"
            value={settings.PenaltyValue}
            onChange={(text) => handleInputChange('PenaltyValue', text)}
            editable={editMode}
            suffix={settings.PenaltyType === 'percentage' ? '%' : '₱'}
          />
        </div>

        {/* Dividend Date */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Dividend Settings</h2>
          <label style={styles.label}>Dividend Date</label>
          {editMode ? (
            <>
              <button 
                style={styles.dateButton}
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {settings.DividendDate
                  ? new Date(settings.DividendDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a date'}
              </button>
              {showCalendar && (
                <div style={styles.calendarContainer}>
                  <Calendar
                    onChange={handleDateChange}
                    value={settings.DividendDate ? new Date(settings.DividendDate) : new Date()}
                  />
                </div>
              )}
            </>
          ) : (
            <span style={styles.staticText}>
              {settings.DividendDate
                ? new Date(settings.DividendDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not set'}
            </span>
          )}
        </div>

        {/* Terms and Conditions Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Terms and Conditions</h2>
          {editMode && editTerms ? (
            <div style={styles.editSection}>
              <div style={styles.inputContainer}>
                <label>Title</label>
                <input
                  style={styles.input}
                  value={settings.TermsAndConditions.title}
                  onChange={(e) => setSettings({
                    ...settings,
                    TermsAndConditions: {
                      ...settings.TermsAndConditions,
                      title: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.inputContainer}>
                <label>Content</label>
                <textarea
                  style={styles.textarea}
                  value={settings.TermsAndConditions.content}
                  onChange={(e) => setSettings({
                    ...settings,
                    TermsAndConditions: {
                      ...settings.TermsAndConditions,
                      content: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.editButtons}>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#10b981' }}
                  onClick={() => setEditTerms(false)}
                >
                  Save Terms
                </button>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#ef4444' }}
                  onClick={() => setEditTerms(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>
                <h3>{settings.TermsAndConditions.title}</h3>
                <p>{settings.TermsAndConditions.content}</p>
              </div>
              {editMode && (
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#3b82f6' }}
                  onClick={() => setEditTerms(true)}
                >
                  Edit Terms
                </button>
              )}
            </div>
          )}
        </div>

        {/* Privacy Policy Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Privacy Policy</h2>
          {editMode && editPrivacy ? (
            <div style={styles.editSection}>
              <div style={styles.inputContainer}>
                <label>Title</label>
                <input
                  style={styles.input}
                  value={settings.PrivacyPolicy.title}
                  onChange={(e) => setSettings({
                    ...settings,
                    PrivacyPolicy: {
                      ...settings.PrivacyPolicy,
                      title: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.inputContainer}>
                <label>Content</label>
                <textarea
                  style={styles.textarea}
                  value={settings.PrivacyPolicy.content}
                  onChange={(e) => setSettings({
                    ...settings,
                    PrivacyPolicy: {
                      ...settings.PrivacyPolicy,
                      content: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.editButtons}>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#10b981' }}
                  onClick={() => setEditPrivacy(false)}
                >
                  Save Privacy Policy
                </button>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#ef4444' }}
                  onClick={() => setEditPrivacy(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>
                <h3>{settings.PrivacyPolicy.title}</h3>
                <p>{settings.PrivacyPolicy.content}</p>
              </div>
              {editMode && (
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#3b82f6' }}
                  onClick={() => setEditPrivacy(true)}
                >
                  Edit Privacy Policy
                </button>
              )}
            </div>
          )}
        </div>

        {/* About Us Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>About Us</h2>
          {editMode && editAboutUs ? (
            <div style={styles.editSection}>
              <div style={styles.inputContainer}>
                <label>Title</label>
                <input
                  style={styles.input}
                  value={settings.AboutUs.title}
                  onChange={(e) => setSettings({
                    ...settings,
                    AboutUs: {
                      ...settings.AboutUs,
                      title: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.inputContainer}>
                <label>Content</label>
                <textarea
                  style={styles.textarea}
                  value={settings.AboutUs.content}
                  onChange={(e) => setSettings({
                    ...settings,
                    AboutUs: {
                      ...settings.AboutUs,
                      content: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.editButtons}>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#10b981' }}
                  onClick={() => setEditAboutUs(false)}
                >
                  Save About Us
                </button>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#ef4444' }}
                  onClick={() => setEditAboutUs(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>
                <h3>{settings.AboutUs.title}</h3>
                <p>{settings.AboutUs.content}</p>
              </div>
              {editMode && (
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#3b82f6' }}
                  onClick={() => setEditAboutUs(true)}
                >
                  Edit About Us
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Us Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Contact Us</h2>
          {editMode && editContactUs ? (
            <div style={styles.editSection}>
              <div style={styles.inputContainer}>
                <label>Title</label>
                <input
                  style={styles.input}
                  value={settings.ContactUs.title}
                  onChange={(e) => setSettings({
                    ...settings,
                    ContactUs: {
                      ...settings.ContactUs,
                      title: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.inputContainer}>
                <label>Content</label>
                <textarea
                  style={styles.textarea}
                  value={settings.ContactUs.content}
                  onChange={(e) => setSettings({
                    ...settings,
                    ContactUs: {
                      ...settings.ContactUs,
                      content: e.target.value
                    }
                  })}
                />
              </div>
              <div style={styles.editButtons}>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#10b981' }}
                  onClick={() => setEditContactUs(false)}
                >
                  Save Contact Us
                </button>
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#ef4444' }}
                  onClick={() => setEditContactUs(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>
                <h3>{settings.ContactUs.title}</h3>
                <p>{settings.ContactUs.content}</p>
              </div>
              {editMode && (
                <button 
                  style={{ ...styles.saveBtn, backgroundColor: '#3b82f6' }}
                  onClick={() => setEditContactUs(true)}
                >
                  Edit Contact Us
                </button>
              )}
            </div>
          )}
        </div>

        {/* Save/Edit Button */}
        <button 
          style={{ ...styles.saveBtn, ...(editMode ? styles.saveMode : {}) }}
          onClick={editMode ? handleSave : () => setEditMode(true)}
        >
          {editMode ? 'Save Settings' : 'Edit Settings'}
        </button>

        {/* Save Confirmation Modal */}
        {confirmationModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Confirm Changes</h3>
              <p style={styles.modalText}>Are you sure you want to save these settings changes?</p>
              <div style={styles.modalButtons}>
                <button 
                  style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                  onClick={() => setConfirmationModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                  onClick={confirmSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Interest Term Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Add Interest Rate</h3>
              <p style={styles.modalText}>
                Add {newTerm} months at {newRate}% interest?
              </p>
              <div style={styles.modalButtons}>
                <button 
                  style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                  onClick={() => setAddModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                  onClick={confirmAddTerm}
                >
                  Add Rate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Interest Term Modal */}
        {deleteModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Delete Interest Rate</h3>
              <p style={styles.modalText}>
                Are you sure you want to delete the {termToDelete} month interest rate?
              </p>
              <div style={styles.modalButtons}>
                <button 
                  style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                  onClick={() => setDeleteModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                  onClick={confirmDeleteTerm}
                >
                  Delete Rate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Savings Modal */}
        {savingsModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Add to Savings</h3>
              <p style={styles.modalText}>Enter amount to add to savings:</p>
              <input
                style={styles.modalInput}
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                type="number"
                placeholder="Amount"
                min="0"
                step="0.01"
              />
              <div style={styles.modalButtons}>
                <button 
                  style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                  onClick={() => setSavingsModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                  onClick={confirmAddSavings}
                >
                  Add Savings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Funds Action Modal */}
        {fundsActionModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>
                {fundsActionModal === 'add' ? 'Add to Funds' : 'Withdraw to Savings'}
              </h3>
              <p style={styles.modalText}>
                {fundsActionModal === 'add' ? 
                  `Available Savings: ₱${settings.Savings}` : 
                  `Available Funds: ₱${settings.Funds}`}
              </p>
              <input
                style={styles.modalInput}
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                type="number"
                placeholder="Amount"
                min="0"
                step="0.01"
              />
              <div style={styles.modalButtons}>
                <button 
                  style={{ ...styles.modalBtn, ...styles.cancelBtn }}
                  onClick={() => setFundsActionModal(null)}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...styles.modalBtn, ...styles.confirmBtn }}
                  onClick={confirmFundsAction}
                >
                  {fundsActionModal === 'add' ? 'Transfer' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {messageModal.visible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>{messageModal.title}</h3>
              <p style={styles.modalText}>{messageModal.message}</p>
              <div style={styles.modalButtons}>
                <button 
                  style={{ 
                    ...styles.modalBtn, 
                    ...(messageModal.isError ? styles.errorBtn : styles.successBtn)
                  }}
                  onClick={() => setMessageModal({ ...messageModal, visible: false })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InputRow = ({ label, value, onChange, editable, suffix }) => (
  <div style={styles.inputRow}>
    <label style={styles.label}>{label}</label>
    {editable ? (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          style={styles.input} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
        {suffix && <span>{suffix}</span>}
      </div>
    ) : (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={styles.staticText}>{value}</span>
        {suffix && <span>{suffix}</span>}
      </div>
    )}
  </div>
);

export default SystemSettings;