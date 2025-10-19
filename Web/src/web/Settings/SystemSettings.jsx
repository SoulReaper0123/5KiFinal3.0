import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrashAlt, FaPlus, FaExchangeAlt, FaCopy, FaRedo, FaCheck, FaTimes, FaCheckCircle, FaPiggyBank, FaPercentage, FaCalendarAlt, FaFileContract, FaShieldAlt, FaInfoCircle, FaPhone, FaMoneyBillWave, FaBusinessTime } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { FaEdit, FaSave } from 'react-icons/fa';
import { ConfirmModal, SuccessModal } from '../components/Modals';

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState('general');

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const [settings, setSettings] = useState({
    Funds: '',
    Savings: '',
    InterestRate: {},
    InterestRateByType: {},
    LoanReminderDays: '7',
    DividendDate: '',
    MembersDividendPercentage: '60',
    FiveKiEarningsPercentage: '40',
    InvestmentSharePercentage: '60',
    PatronageSharePercentage: '25',
    ActiveMonthsPercentage: '15',
    ProcessingFee: '',
    RegistrationMinimumFee: '5000',
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
    },
  });

  const [newTerm, setNewTerm] = useState('');
  const [newRate, setNewRate] = useState('');
  
  // Loan types management
  const [newLoanType, setNewLoanType] = useState('');
  const [addLoanTypeModalVisible, setAddLoanTypeModalVisible] = useState(false);
  const [deleteLoanTypeModalVisible, setDeleteLoanTypeModalVisible] = useState(false);
  const [loanTypeToDelete, setLoanTypeToDelete] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orientationCopied, setOrientationCopied] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [termToDelete, setTermToDelete] = useState('');
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [fundsActionModal, setFundsActionModal] = useState(null);
  const [actionAmount, setActionAmount] = useState('');
  const [messageModal, setMessageModal] = useState({ visible: false, title: '', message: '', isError: false });
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState(null);
  const [editAccounts, setEditAccounts] = useState(false);
  const [editDividend, setEditDividend] = useState(false);
  const [editLoanReminder, setEditLoanReminder] = useState(false);
  const [editProcessingFee, setEditProcessingFee] = useState(false);
  const [editTermsModal, setEditTermsModal] = useState(false);
  const [editPrivacyModal, setEditPrivacyModal] = useState(false);
  const [editAboutModal, setEditAboutModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [editLoanAndFee, setEditLoanAndFee] = useState(false);
  const [editLoanTypes, setEditLoanTypes] = useState(false);
  const [editOrientationCode, setEditOrientationCode] = useState(false);
  const [editGeneralSettings, setEditGeneralSettings] = useState(false);
  const [savingsAddAmount, setSavingsAddAmount] = useState('');
  const [addToSavingsModalVisible, setAddToSavingsModalVisible] = useState(false);

  // Add Loan Type wizard state
  const [addLoanTypeWizardVisible, setAddLoanTypeWizardVisible] = useState(false);
  const [wizardLoanTypeName, setWizardLoanTypeName] = useState('');
  const [wizardRows, setWizardRows] = useState([{ term: '', rate: '' }]);
  const [wizardError, setWizardError] = useState('');
  const [isEditingLoanType, setIsEditingLoanType] = useState(false);
  const [editingOriginalLoanType, setEditingOriginalLoanType] = useState('');
  
  // Temporary content states for modal editing
  const [tempTermsContent, setTempTermsContent] = useState({ title: '', content: '' });
  const [tempPrivacyContent, setTempPrivacyContent] = useState({ title: '', content: '' });
  const [tempAboutContent, setTempAboutContent] = useState({ title: '', content: '' });
  const [tempContactContent, setTempContactContent] = useState({ title: '', content: '' });

  // Validation states
  const [dividendValidation, setDividendValidation] = useState({
    distributionValid: true,
    breakdownValid: true
  });

  // Confirmation modal state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Success modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const db = getDatabase();

  // Helper function to format peso amounts with at least 2 decimal places
  const formatPesoAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper function to validate dividend percentages with better precision handling
  const validateDividendPercentages = () => {
    const membersDividend = parseFloat(settings.MembersDividendPercentage || 0);
    const fiveKiEarnings = parseFloat(settings.FiveKiEarningsPercentage || 0);
    const investmentShare = parseFloat(settings.InvestmentSharePercentage || 0);
    const patronageShare = parseFloat(settings.PatronageSharePercentage || 0);
    const activeMonths = parseFloat(settings.ActiveMonthsPercentage || 0);
    
    // Round to 1 decimal place to avoid floating point precision issues
    const distTotal = Math.round((membersDividend + fiveKiEarnings) * 10) / 10;
    const breakdownTotal = Math.round((investmentShare + patronageShare + activeMonths) * 10) / 10;
    
    const distributionValid = distTotal === 100;
    const breakdownValid = breakdownTotal === 100;
    
    setDividendValidation({
      distributionValid,
      breakdownValid
    });
    
    return distributionValid && breakdownValid;
  };

  const showConfirmModal = (message, onConfirm, onCancel = () => {}) => {
    setConfirmModalConfig({
      message,
      onConfirm: () => {
        setConfirmModalVisible(false);
        onConfirm();
      },
      onCancel: () => {
        setConfirmModalVisible(false);
        onCancel();
      }
    });
    setConfirmModalVisible(true);
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  useEffect(() => {
    const settingsRef = ref(db, 'Settings/');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loaded = {
          Funds: data.Funds?.toString() || '',
          Savings: data.Savings?.toString() || '',
          InterestRate: Object.fromEntries(
            Object.entries(data.InterestRate || {}).map(([key, val]) => [key, val.toString()])
          ),
          InterestRateByType: (() => {
            const source = (data && typeof data.LoanTypes === 'object' && !Array.isArray(data.LoanTypes)) ? data.LoanTypes : {};
            return Object.fromEntries(
              Object.entries(source).map(([lt, map]) => [lt, Object.fromEntries(Object.entries(map || {}).map(([k, v]) => [String(k), String(v)]))])
            );
          })(),
          LoanReminderDays: (data.LoanReminderDays ?? 7).toString(),
          DividendDate: data.DividendDate || '',
          MembersDividendPercentage: data.MembersDividendPercentage?.toString() || '60',
          FiveKiEarningsPercentage: data.FiveKiEarningsPercentage?.toString() || '40',
          InvestmentSharePercentage: data.InvestmentSharePercentage?.toString() || '60',
          PatronageSharePercentage: data.PatronageSharePercentage?.toString() || '25',
          ActiveMonthsPercentage: data.ActiveMonthsPercentage?.toString() || '15',
          ProcessingFee: data.ProcessingFee?.toString() || '',
          RegistrationMinimumFee: data.RegistrationMinimumFee?.toString() || '5000',
          LoanTypes: (() => {
            if (data && typeof data.LoanTypes === 'object' && !Array.isArray(data.LoanTypes)) {
              return Object.keys(data.LoanTypes);
            }
            return data.LoanTypes || ['Regular Loan', 'Quick Cash'];
          })(),
          LoanPercentage: data.LoanPercentage?.toString() || '80',
          OrientationCode: data.OrientationCode || generateOrientationCode(),
          Accounts: data.Accounts || {
            Bank: { accountName: '', accountNumber: '' },
            GCash: { accountName: '', accountNumber: '' }
          },
          TermsAndConditions: data.TermsAndConditions || {
            title: 'Terms and Conditions',
            content: ''
          },
          PrivacyPolicy: data.PrivacyPolicy || {
            title: 'Privacy Policy',
            content: ''
          },
          AboutUs: data.AboutUs || {
            title: 'About Us',
            content: ''
          },
          ContactUs: data.ContactUs || {
            title: 'Contact Us',
            content: ''
          }
        };
        setSettings(loaded);
        setSavedSettingsSnapshot(loaded);
        
        // Validate percentages when settings are loaded
        validateDividendPercentages();
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
      showSuccessMessage('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      setMessageModal({ visible: true, title: 'Error', message: 'Failed to copy code', isError: true });
    }
  };

  const handleGenerateOrientationCode = () => {
    const newCode = generateOrientationCode();
    setSettings({ ...settings, OrientationCode: newCode });
    showSuccessMessage('New orientation code generated!');
  };

  const showMessage = (title, message, isError = false) => {
    setMessageModal({ visible: true, title, message, isError });
    setTimeout(() => setMessageModal({ ...messageModal, visible: false }), 3000);
  };

  const handleInputChange = (key, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    if (clean.split('.').length > 2) return;
    
    const newSettings = { ...settings, [key]: clean };
    setSettings(newSettings);
    
    // Validate dividend percentages when relevant fields change
    if (['MembersDividendPercentage', 'FiveKiEarningsPercentage', 'InvestmentSharePercentage', 'PatronageSharePercentage', 'ActiveMonthsPercentage'].includes(key)) {
      setTimeout(() => validateDividendPercentages(), 0);
    }
  };

  const handleInterestChange = (term, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    if (clean.split('.').length > 2) return;
    setSettings((prev) => ({
      ...prev,
      InterestRate: { ...prev.InterestRate, [term]: clean },
    }));
  };

  const handleTypeInterestChange = (loanType, term, value) => {
    const clean = String(value).replace(/[^0-9.]/g, '');
    if (clean.split('.').length > 2) return;
    setSettings((prev) => ({
      ...prev,
      InterestRateByType: {
        ...(prev.InterestRateByType || {}),
        [loanType]: {
          ...((prev.InterestRateByType || {})[loanType] || {}),
          [term]: clean,
        }
      }
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
      showMessage('Error', 'This term already exists in the global map. Use per-type editor below instead.', true);
      return;
    }

    setSettings((prev) => ({
      ...prev,
      InterestRate: { ...prev.InterestRate, [newTerm]: newRate },
    }));
    setNewTerm('');
    setNewRate('');
    setAddModalVisible(false);
    showSuccessMessage('Global term added. Assign per-type rates below.');
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
    const t = String(termToDelete);
    const lt = editingOriginalLoanType || wizardLoanTypeName || '';
    if (!lt) {
      showMessage('Error', 'Please select a loan type first.', true);
      return;
    }

    const updatedByType = { ...(settings.InterestRateByType || {}) };
    const typeMap = { ...(updatedByType[lt] || {}) };
    delete typeMap[t];
    updatedByType[lt] = typeMap;

    setSettings((prev) => ({
      ...prev,
      InterestRateByType: updatedByType,
    }));
    setDeleteModalVisible(false);
    showSuccessMessage(`Deleted ${t} month term for ${lt} only.`);
  };

  // Loan Types management functions
  const addWizardRow = () => setWizardRows((rows) => [...rows, { term: '', rate: '' }]);
  const removeWizardRow = (idx) => setWizardRows((rows) => rows.filter((_, i) => i !== idx));
  const updateWizardRow = (idx, key, value) => setWizardRows((rows) => rows.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  const resetWizard = () => {
    setWizardLoanTypeName('');
    setWizardRows([{ term: '', rate: '' }]);
    setWizardError('');
    setIsEditingLoanType(false);
    setEditingOriginalLoanType('');
  };
  const openEditLoanType = (loanType) => {
    setWizardLoanTypeName(loanType);
    const map = settings.InterestRateByType?.[loanType] || {};
    const rows = Object.keys(map)
      .sort((a,b)=>Number(a)-Number(b))
      .map((t) => ({ term: t, rate: String(map[t] ?? '') }));
    setWizardRows(rows.length ? rows : [{ term: '', rate: '' }]);
    setWizardError('');
    setAddLoanTypeWizardVisible(true);
    setIsEditingLoanType(true);
    setEditingOriginalLoanType(loanType);
  };
  const validateWizard = () => {
    const name = wizardLoanTypeName.trim();
    if (!name) return 'Please enter a loan type name.';
    if (!isEditingLoanType && settings.LoanTypes.includes(name)) return 'This loan type already exists.';
    if (!wizardRows.length) return 'Please add at least one term and rate.';
    const seen = new Set();
    for (const r of wizardRows) {
      const t = String(r.term || '').trim();
      const rate = String(r.rate || '').trim();
      if (!t || isNaN(Number(t))) return 'Each row must have a valid numeric term in months.';
      if (seen.has(t)) return 'Duplicate months are not allowed.';
      seen.add(t);
      if (!rate || isNaN(Number(rate))) return 'Each row must have a valid numeric interest rate.';
    }
    return '';
  };
  const confirmWizardAdd = async () => {
    const err = validateWizard();
    if (err) { setWizardError(err); return; }
    const name = wizardLoanTypeName.trim();

    const newInterestByType = { ...(settings.InterestRateByType || {}) };
    const typeMap = {};
    for (const r of wizardRows) {
      const t = String(r.term).trim();
      typeMap[t] = String(r.rate);
    }

    let newLoanTypes = [...(settings.LoanTypes || [])];

    if (isEditingLoanType) {
      const original = editingOriginalLoanType;
      if (name !== original) {
        delete newInterestByType[original];
        newInterestByType[name] = typeMap;
        newLoanTypes = newLoanTypes.map((lt) => (lt === original ? name : lt));
      } else {
        newInterestByType[name] = typeMap;
      }
    } else {
      newLoanTypes = [...newLoanTypes, name];
      newInterestByType[name] = typeMap;
    }

    try {
      setActionInProgress(true);
      const parsedByType = {};
      Object.entries(newInterestByType).forEach(([lt, map]) => {
        parsedByType[lt] = {};
        Object.entries(map || {}).forEach(([term, rate]) => {
          const v = parseFloat(rate);
          if (!isNaN(v)) parsedByType[lt][String(term)] = v;
        });
      });
      const loanTypesNested = Object.fromEntries(
        Object.entries(parsedByType).map(([lt, map]) => [lt, Object.fromEntries(Object.entries(map || {}).map(([k, v]) => [String(k), Number(v)]))])
      );
      await update(ref(db, 'Settings'), {
        LoanTypes: loanTypesNested
      });
      setSettings(prev => ({
        ...prev,
        LoanTypes: newLoanTypes,
      }));
      setSavedSettingsSnapshot(prev => ({ ...(prev || {}), LoanTypes: loanTypesNested }));
      setAddLoanTypeWizardVisible(false);
      showSuccessMessage(isEditingLoanType ? 'Loan type updated.' : 'Loan type and per-term rates added.');
      resetWizard();
    } catch (e) {
      showMessage('Error', e.message || 'Failed to save', true);
    } finally {
      setActionInProgress(false);
    }
  };

  const requestAddLoanType = () => {
    if (!newLoanType.trim()) {
      showMessage('Error', 'Please enter a loan type name.', true);
      return;
    }

    if (settings.LoanTypes.includes(newLoanType.trim())) {
      showMessage('Error', 'This loan type already exists.', true);
      return;
    }

    setAddLoanTypeModalVisible(true);
  };

  const confirmAddLoanType = () => {
    const newLoanTypes = [...settings.LoanTypes, newLoanType.trim()];
    setSettings({
      ...settings,
      LoanTypes: newLoanTypes
    });
    setNewLoanType('');
    setAddLoanTypeModalVisible(false);
    showSuccessMessage('Loan type added successfully!');
  };

  const requestDeleteLoanType = (loanType) => {
    if (settings.LoanTypes.length <= 1) {
      showMessage('Error', 'You must have at least one loan type.', true);
      return;
    }
    
    setLoanTypeToDelete(loanType);
    setDeleteLoanTypeModalVisible(true);
  };

  const confirmDeleteLoanType = async () => {
    try {
      setActionInProgress(true);
      const newLoanTypes = settings.LoanTypes.filter(type => type !== loanTypeToDelete);
      const newInterestByType = { ...(settings.InterestRateByType || {}) };
      delete newInterestByType[loanTypeToDelete];

      const parsedByType = {};
      Object.entries(newInterestByType).forEach(([lt, map]) => {
        parsedByType[lt] = {};
        Object.entries(map || {}).forEach(([term, rate]) => {
          const v = parseFloat(rate);
          if (!isNaN(v)) parsedByType[lt][String(term)] = v;
        });
      });
      const loanTypesNested = Object.fromEntries(
        Object.entries(parsedByType).map(([lt, map]) => [lt, Object.fromEntries(Object.entries(map || {}).map(([k, v]) => [String(k), Number(v)]))])
      );

      await update(ref(db, 'Settings'), {
        InterestRateByType: parsedByType,
        LoanTypes: loanTypesNested
      });

      setSettings({
        ...settings,
        LoanTypes: newLoanTypes,
        InterestRateByType: newInterestByType
      });
      setSavedSettingsSnapshot(prev => ({ ...(prev || {}), InterestRateByType: newInterestByType, LoanTypes: loanTypesNested }));
      setDeleteLoanTypeModalVisible(false);
      showSuccessMessage('Loan type deleted successfully!');
    } catch (e) {
      showMessage('Error', e.message || 'Failed to delete', true);
    } finally {
      setActionInProgress(false);
    }
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
      Funds: newFunds.toFixed(2),
      Savings: newSavings.toFixed(2)
    });

    setFundsActionModal(null);
    setActionAmount('');
    showSuccessMessage(`Funds ${fundsActionModal === 'add' ? 'added' : 'withdrawn'} successfully!`);
  };

  const handleFundsActionWithConfirmation = () => {
    const actionText = fundsActionModal === 'add' ? 'transfer from savings to funds' : 'withdraw from funds to savings';
    showConfirmModal(
      `Are you sure you want to ${actionText}?`,
      confirmFundsAction,
      () => {
        setFundsActionModal(null);
      }
    );
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

    const newSavings = (parseFloat(settings.Savings) + amount).toFixed(2);
    setSettings({
      ...settings,
      Savings: newSavings
    });

    setSavingsModalVisible(false);
    setActionAmount('');
    showSuccessMessage('Savings added successfully!');
  };

  const handleAddSavingsWithConfirmation = () => {
    showConfirmModal(
      'Are you sure you want to add to savings?',
      confirmAddSavings,
      () => {
        setSavingsModalVisible(false);
      }
    );
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Enhanced Sidebar Navigation */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Configuration</h3>
        </div>
        <div style={styles.sidebarMenu}>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'general' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => handleSectionChange('general')}
          >
            <FaPiggyBank style={styles.sidebarIcon} />
            <span style={styles.sidebarButtonText}>Financial Settings</span>
          </button>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'loan' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => handleSectionChange('loan')}
          >
            <FaBusinessTime style={styles.sidebarIcon} />
            <span style={styles.sidebarButtonText}>Loan & Dividend</span>
          </button>
          <button
            style={{
              ...styles.sidebarButton,
              ...(activeSection === 'content' ? styles.sidebarButtonActive : {})
            }}
            onClick={() => handleSectionChange('content')}
          >
            <FaFileContract style={styles.sidebarIcon} />
            <span style={styles.sidebarButtonText}>Content Management</span>
          </button>
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <div style={styles.contentArea}>
        <div style={styles.contentHeader}>
          <h2 style={styles.contentTitle}>
            {activeSection === 'general' && 'Financial Settings'}
            {activeSection === 'loan' && 'Loan & Dividend Configuration'}
            {activeSection === 'content' && 'Content Management'}
          </h2>
          <div style={styles.contentSubtitle}>
            {activeSection === 'general' && 'Manage financial accounts, registration fees, and system parameters'}
            {activeSection === 'loan' && 'Configure loan types, interest rates, and dividend distribution'}
            {activeSection === 'content' && 'Manage legal documents and informational content'}
          </div>
        </div>

        {/* Enhanced General Settings Section */}
        {activeSection === 'general' && (
          <div style={styles.section}>
            {/* Financial Settings Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaMoneyBillWave style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Financial Configuration</h3>
                </div>
                {!editGeneralSettings ? (
                  <button style={styles.headerIconBtn} title="Edit Financial Settings" onClick={() => setEditGeneralSettings(true)}>
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save Financial Settings"
                      onClick={async () => {
                        try {
                          setActionInProgress(true);
                          
                          const updateData = {
                            RegistrationMinimumFee: parseFloat(parseFloat(settings.RegistrationMinimumFee || 0).toFixed(2))
                          };
                          
                          await update(ref(db, 'Settings'), updateData);
                          
                          setSavedSettingsSnapshot(prev => ({ 
                            ...(prev || {}), 
                            RegistrationMinimumFee: settings.RegistrationMinimumFee
                          }));
                          
                          setEditGeneralSettings(false);
                          showSuccessMessage('Financial settings updated successfully!');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save financial settings', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          RegistrationMinimumFee: savedSettingsSnapshot?.RegistrationMinimumFee ?? prev.RegistrationMinimumFee,
                        }));
                        setEditGeneralSettings(false);
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.cardContent}>
                {/* Minimum Registration Fee */}
                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Minimum Registration Fee</span>
                    <span style={styles.labelDescription}>Initial deposit required for new members</span>
                  </label>
                  {!editGeneralSettings ? (
                    <div style={styles.amountDisplay}>
                      <span style={styles.amountSymbol}>₱</span>
                      <span style={styles.amountValue}>{formatPesoAmount(settings.RegistrationMinimumFee)}</span>
                    </div>
                  ) : (
                    <div style={styles.amountInputContainer}>
                      <span style={styles.amountSymbol}>₱</span>
                      <input
                        style={styles.amountInput}
                        value={settings.RegistrationMinimumFee}
                        onChange={(e) => handleInputChange('RegistrationMinimumFee', e.target.value)}
                        type="text"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
                
                {/* Available Funds */}
                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Available Funds</span>
                    <span style={styles.labelDescription}>Total funds available for lending</span>
                  </label>
                  <div style={styles.amountDisplay}>
                    <span style={styles.amountSymbol}>₱</span>
                    <span style={styles.amountValue}>{formatPesoAmount(settings.Funds)}</span>
                  </div>
                </div>

                {/* Savings */}
                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Current Savings</span>
                    <span style={styles.labelDescription}>Total savings pool</span>
                  </label>
                  <div style={styles.amountDisplay}>
                    <span style={styles.amountSymbol}>₱</span>
                    <span style={styles.amountValue}>{formatPesoAmount(settings.Savings)}</span>
                  </div>
                </div>

                {/* Add to Savings Button */}
                {editGeneralSettings && (
                  <div style={styles.actionButtonContainer}>
                    <button
                      style={styles.primaryButton}
                      onClick={() => {
                        setSavingsAddAmount('');
                        setAddToSavingsModalVisible(true);
                      }}
                    >
                      <FaPlus />
                      Add to Savings
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accounts Section */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaPiggyBank style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Bank Accounts</h3>
                </div>
                {!editAccounts ? (
                  <button style={styles.headerIconBtn} title="Edit Accounts" onClick={() => setEditAccounts(true)}>
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save Accounts"
                      onClick={async () => {
                        try {
                          setActionInProgress(true);
                          const settingsRef = ref(db, 'Settings/Accounts');
                          await update(settingsRef, settings.Accounts);
                          setSavedSettingsSnapshot(prev => ({ ...(prev || {}), Accounts: settings.Accounts }));
                          setEditAccounts(false);
                          showSuccessMessage('Accounts updated successfully!');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save Accounts', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        if (savedSettingsSnapshot?.Accounts) {
                          setSettings(prev => ({ ...prev, Accounts: savedSettingsSnapshot.Accounts }));
                        }
                        setEditAccounts(false);
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.accountGrid}>
                <div style={styles.accountCard}>
                  <div style={styles.accountCardHeader}>
                    <div style={styles.accountType}>Bank Account</div>
                    <div style={styles.accountBadge}>Traditional</div>
                  </div>
                  <InputRow
                    label="Account Name"
                    value={settings.Accounts.Bank.accountName}
                    onChange={(text) => handleAccountChange('Bank', 'accountName', text)}
                    editable={editAccounts}
                  />
                  <InputRow
                    label="Account Number"
                    value={settings.Accounts.Bank.accountNumber}
                    onChange={(text) => handleAccountChange('Bank', 'accountNumber', text)}
                    editable={editAccounts}
                  />
                </div>
                
                <div style={styles.accountCard}>
                  <div style={styles.accountCardHeader}>
                    <div style={styles.accountType}>GCash Account</div>
                    <div style={{...styles.accountBadge, backgroundColor: '#06d6a0'}}>Digital</div>
                  </div>
                  <InputRow
                    label="Account Name"
                    value={settings.Accounts.GCash.accountName}
                    onChange={(text) => handleAccountChange('GCash', 'accountName', text)}
                    editable={editAccounts}
                  />
                  <InputRow
                    label="Account Number"
                    value={settings.Accounts.GCash.accountNumber}
                    onChange={(text) => handleAccountChange('GCash', 'accountNumber', text)}
                    editable={editAccounts}
                  />
                </div>
              </div>
            </div>

            {/* Orientation Code Section */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaShieldAlt style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Orientation Security</h3>
                </div>
                {!editOrientationCode ? (
                  <button style={styles.headerIconBtn} title="Edit Orientation Code" onClick={() => setEditOrientationCode(true)}>
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save Orientation Code"
                      onClick={async () => {
                        try {
                          setActionInProgress(true);
                          await update(ref(db, 'Settings'), {
                            OrientationCode: settings.OrientationCode
                          });
                          setSavedSettingsSnapshot(prev => ({ 
                            ...(prev || {}), 
                            OrientationCode: settings.OrientationCode
                          }));
                          setEditOrientationCode(false);
                          showSuccessMessage('Orientation code updated successfully!');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save orientation code', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          OrientationCode: savedSettingsSnapshot?.OrientationCode ?? prev.OrientationCode,
                        }));
                        setEditOrientationCode(false);
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.orientationContent}>
                <div style={styles.orientationCodeDisplay}>
                  <div style={styles.orientationCodeValue}>
                    {settings.OrientationCode || 'Not set'}
                  </div>
                  <div style={styles.orientationActions}>
                    {settings.OrientationCode && (
                      <button 
                        style={styles.iconButton}
                        onClick={() => copyToClipboard(settings.OrientationCode)}
                        aria-label="Copy orientation code"
                      >
                        <FaCopy />
                      </button>
                    )}
                    {editOrientationCode && (
                      <button 
                        style={styles.iconButton}
                        onClick={handleGenerateOrientationCode}
                        aria-label="Generate new orientation code"
                        title="Generate New Code"
                      >
                        <FaRedo />
                      </button>
                    )}
                    {orientationCopied && <span style={styles.copiedText}>Copied!</span>}
                  </div>
                </div>
                <p style={styles.orientationDescription}>
                  This secure code is used for member registration during orientation sessions. 
                  Share this code exclusively with authorized attendees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loan & Dividend Section */}
        {activeSection === 'loan' && (
          <div style={styles.section}>
            {/* Loan Settings Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaBusinessTime style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Loan Parameters</h3>
                </div>
                {!editLoanAndFee ? (
                  <button style={styles.headerIconBtn} title="Edit Loan Reminder & Processing Fee" onClick={() => setEditLoanAndFee(true)}>
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save"
                      onClick={async () => {
                        try {
                          setActionInProgress(true);
                          await update(ref(db, 'Settings'), {
                            LoanReminderDays: parseInt(settings.LoanReminderDays || 0, 10),
                            ProcessingFee: parseFloat(parseFloat(settings.ProcessingFee || 0).toFixed(2))
                          });
                          setSavedSettingsSnapshot(prev => ({ ...(prev || {}), LoanReminderDays: settings.LoanReminderDays, ProcessingFee: settings.ProcessingFee }));
                          setEditLoanAndFee(false);
                          showSuccessMessage('Loan Reminder and Processing Fee updated');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          LoanReminderDays: savedSettingsSnapshot?.LoanReminderDays ?? prev.LoanReminderDays,
                          ProcessingFee: savedSettingsSnapshot?.ProcessingFee ?? prev.ProcessingFee,
                        }));
                        setEditLoanAndFee(false);
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.cardContent}>
                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Loan Reminder Period</span>
                    <span style={styles.labelDescription}>Days before payment due date to send reminders</span>
                  </label>
                  {!editLoanAndFee ? (
                    <div style={styles.valueDisplay}>
                      <span style={styles.valueText}>{settings.LoanReminderDays} days</span>
                    </div>
                  ) : (
                    <div style={styles.valueInputContainer}>
                      <input
                        style={styles.valueInput}
                        value={settings.LoanReminderDays}
                        onChange={(e) => setSettings({ ...settings, LoanReminderDays: e.target.value.replace(/[^0-9]/g, '') })}
                        type="number"
                        min="1"
                        max="30"
                      />
                      <span style={styles.valueSuffix}>days</span>
                    </div>
                  )}
                </div>

                <div style={styles.inputRow}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Processing Fee</span>
                    <span style={styles.labelDescription}>Fixed fee charged for loan processing</span>
                  </label>
                  {!editLoanAndFee ? (
                    <div style={styles.amountDisplay}>
                      <span style={styles.amountSymbol}>₱</span>
                      <span style={styles.amountValue}>{formatPesoAmount(settings.ProcessingFee)}</span>
                    </div>
                  ) : (
                    <div style={styles.amountInputContainer}>
                      <span style={styles.amountSymbol}>₱</span>
                      <input
                        style={styles.amountInput}
                        value={settings.ProcessingFee}
                        onChange={(e) => handleInputChange('ProcessingFee', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loan Types Section */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaPercentage style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Loan Products</h3>
                </div>
                {!editLoanTypes ? (
                  <button
                    style={styles.headerIconBtn}
                    title="Edit Types of Loan"
                    onClick={() => setEditLoanTypes(true)}
                  >
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#10b981', color: '#fff' }}
                      title="Save Types of Loan"
                      onClick={async () => {
                        try {
                          setActionInProgress(true);
                          const parsedByType = {};
                          Object.entries(settings.InterestRateByType || {}).forEach(([lt, map]) => {
                            parsedByType[lt] = {};
                            Object.entries(map || {}).forEach(([term, rate]) => {
                              const v = parseFloat(rate);
                              if (!isNaN(v)) parsedByType[lt][String(term)] = v;
                            });
                          });
                          const loanTypesNested = Object.fromEntries(
                            Object.entries(parsedByType).map(([lt, map]) => [lt, Object.fromEntries(Object.entries(map || {}).map(([k, v]) => [String(k), Number(v)]))])
                          );
                          await update(ref(db, 'Settings'), {
                            LoanTypes: loanTypesNested
                          });
                          setSavedSettingsSnapshot(prev => ({ ...(prev || {}), LoanTypes: loanTypesNested }));
                          setEditLoanTypes(false);
                          showSuccessMessage('Types of Loan updated');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        if (savedSettingsSnapshot) {
                          setSettings(prev => ({
                            ...prev,
                            InterestRateByType: savedSettingsSnapshot.InterestRateByType ?? prev.InterestRateByType,
                            LoanTypes: Array.isArray(savedSettingsSnapshot.LoanTypes) ? savedSettingsSnapshot.LoanTypes : Object.keys(savedSettingsSnapshot.LoanTypes || {})
                          }));
                        }
                        setEditLoanTypes(false);
                      }}
                    >
                      <FaTimes />
                    </button>
                    <button
                      style={styles.headerIconBtn}
                      title="Add Type of Loan"
                      onClick={() => {
                        setWizardLoanTypeName('');
                        setWizardRows([{ term: '', rate: '' }]);
                        setWizardError('');
                        setIsEditingLoanType(false);
                        setEditingOriginalLoanType('');
                        setAddLoanTypeWizardVisible(true);
                      }}
                    >
                      <FaPlus />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.loanTypesGrid}>
                {settings.LoanTypes.map((loanType, index) => (
                  <div key={index} style={styles.loanTypeCard}>
                    <div style={styles.loanTypeHeader}>
                      <span style={styles.loanTypeName}>{loanType}</span>
                      {editLoanTypes && (
                        <div style={styles.loanTypeActions}>
                          <button 
                            style={styles.smallIconButton}
                            title="Edit terms & rates"
                            onClick={() => openEditLoanType(loanType)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            style={{...styles.smallIconButton, backgroundColor: '#ef4444'}}
                            title="Delete loan type"
                            onClick={() => requestDeleteLoanType(loanType)}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={styles.termsGrid}>
                      {(settings.InterestRateByType?.[loanType] && Object.keys(settings.InterestRateByType[loanType]).length > 0)
                        ? (
                            Object.keys(settings.InterestRateByType[loanType])
                              .sort((a,b)=>Number(a)-Number(b))
                              .map((m) => (
                                <div key={m} style={styles.termChip}>
                                  <span style={styles.termMonths}>{m} mo</span>
                                  <span style={styles.termRate}>{String(settings.InterestRateByType[loanType][m])}%</span>
                                </div>
                              ))
                          )
                        : (<span style={styles.noTerms}>No terms configured</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dividend Settings Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaMoneyBillWave style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Dividend Configuration</h3>
                </div>
                {!editDividend ? (
                  <button style={styles.headerIconBtn} title="Edit Dividend Settings" onClick={() => setEditDividend(true)}>
                    <FaEdit />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ 
                        ...styles.headerIconBtn, 
                        backgroundColor: dividendValidation.distributionValid && dividendValidation.breakdownValid ? '#10b981' : '#9ca3af',
                        color: '#fff',
                        cursor: dividendValidation.distributionValid && dividendValidation.breakdownValid ? 'pointer' : 'not-allowed'
                      }}
                      title={dividendValidation.distributionValid && dividendValidation.breakdownValid ? "Save Dividend Settings" : "Please fix percentage validation errors"}
                      onClick={async () => {
                        // Final validation before saving
                        if (!validateDividendPercentages()) {
                          showMessage('Error', 'Please ensure all dividend percentages total exactly 100% before saving.', true);
                          return;
                        }

                        try {
                          setActionInProgress(true);
                          const membersDividend = parseFloat(settings.MembersDividendPercentage || 0);
                          const fiveKiEarnings = parseFloat(settings.FiveKiEarningsPercentage || 0);
                          const investmentShare = parseFloat(settings.InvestmentSharePercentage || 0);
                          const patronageShare = parseFloat(settings.PatronageSharePercentage || 0);
                          const activeMonths = parseFloat(settings.ActiveMonthsPercentage || 0);
                          
                          const payload = {
                            MembersDividendPercentage: membersDividend,
                            FiveKiEarningsPercentage: fiveKiEarnings,
                            InvestmentSharePercentage: investmentShare,
                            PatronageSharePercentage: patronageShare,
                            ActiveMonthsPercentage: activeMonths,
                            DividendDate: settings.DividendDate || ''
                          };
                          
                          // Final validation check with rounded values
                          const distTotal = Math.round((membersDividend + fiveKiEarnings) * 10) / 10;
                          const breakdownTotal = Math.round((investmentShare + patronageShare + activeMonths) * 10) / 10;
                          
                          if (distTotal !== 100) {
                            throw new Error('Dividend Distribution must total exactly 100%.');
                          }
                          if (breakdownTotal !== 100) {
                            throw new Error('Members Dividend Breakdown must total exactly 100%.');
                          }

                          await update(ref(db, 'Settings'), payload);
                          setSavedSettingsSnapshot(prev => ({ ...(prev || {}), ...payload }));
                          setEditDividend(false);
                          showSuccessMessage('Dividend settings updated successfully!');
                        } catch (e) {
                          showMessage('Error', e.message || 'Failed to save dividend settings', true);
                        } finally {
                          setActionInProgress(false);
                        }
                      }}
                      disabled={!dividendValidation.distributionValid || !dividendValidation.breakdownValid || actionInProgress}
                    >
                      <FaSave />
                    </button>
                    <button
                      style={{ ...styles.headerIconBtn, backgroundColor: '#ef4444', color: '#fff' }}
                      title="Cancel"
                      onClick={() => {
                        if (savedSettingsSnapshot) {
                          setSettings(prev => ({
                            ...prev,
                            MembersDividendPercentage: savedSettingsSnapshot.MembersDividendPercentage ?? prev.MembersDividendPercentage,
                            FiveKiEarningsPercentage: savedSettingsSnapshot.FiveKiEarningsPercentage ?? prev.FiveKiEarningsPercentage,
                            InvestmentSharePercentage: savedSettingsSnapshot.InvestmentSharePercentage ?? prev.InvestmentSharePercentage,
                            PatronageSharePercentage: savedSettingsSnapshot.PatronageSharePercentage ?? prev.PatronageSharePercentage,
                            ActiveMonthsPercentage: savedSettingsSnapshot.ActiveMonthsPercentage ?? prev.ActiveMonthsPercentage,
                            DividendDate: savedSettingsSnapshot.DividendDate ?? prev.DividendDate,
                          }));
                        }
                        setEditDividend(false);
                        // Reset validation state when canceling
                        validateDividendPercentages();
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              
              <div style={styles.dividendContent}>
                {/* Dividend Distribution */}
                <div style={styles.dividendSection}>
                  <h4 style={styles.sectionSubtitle}>Distribution Allocation</h4>
                  <div style={styles.percentageRow}>
                    <div style={styles.percentageItem}>
                      <span style={styles.percentageLabel}>Members Dividend</span>
                      {editDividend ? (
                        <div style={styles.percentageInputContainer}>
                          <input
                            style={{
                              ...styles.percentageInput,
                              borderColor: dividendValidation.distributionValid ? '#d1d5db' : '#ef4444',
                              backgroundColor: dividendValidation.distributionValid ? '#ffffff' : '#fef2f2'
                            }}
                            value={settings.MembersDividendPercentage}
                            onChange={(e) => handleInputChange('MembersDividendPercentage', e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span style={styles.percentageSymbol}>%</span>
                        </div>
                      ) : (
                        <div style={styles.percentageDisplay}>
                          <span style={styles.percentageValue}>{settings.MembersDividendPercentage}%</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.percentageItem}>
                      <span style={styles.percentageLabel}>5Ki Earnings</span>
                      {editDividend ? (
                        <div style={styles.percentageInputContainer}>
                          <input
                            style={{
                              ...styles.percentageInput,
                              borderColor: dividendValidation.distributionValid ? '#d1d5db' : '#ef4444',
                              backgroundColor: dividendValidation.distributionValid ? '#ffffff' : '#fef2f2'
                            }}
                            value={settings.FiveKiEarningsPercentage}
                            onChange={(e) => handleInputChange('FiveKiEarningsPercentage', e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span style={styles.percentageSymbol}>%</span>
                        </div>
                      ) : (
                        <div style={styles.percentageDisplay}>
                          <span style={styles.percentageValue}>{settings.FiveKiEarningsPercentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.validationMessage,
                    color: dividendValidation.distributionValid ? '#10b981' : '#ef4444',
                    backgroundColor: dividendValidation.distributionValid ? '#f0fdf4' : '#fef2f2',
                    borderColor: dividendValidation.distributionValid ? '#bbf7d0' : '#fecaca'
                  }}>
                    Total: {Math.round((parseFloat(settings.MembersDividendPercentage || 0) + parseFloat(settings.FiveKiEarningsPercentage || 0)) * 10) / 10}% 
                    {dividendValidation.distributionValid ? ' ✓ Balanced' : ' - Must equal exactly 100%'}
                  </div>
                </div>

                {/* Members Dividend Breakdown */}
                <div style={styles.dividendSection}>
                  <h4 style={styles.sectionSubtitle}>Members Dividend Breakdown</h4>
                  <div style={styles.breakdownGrid}>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Investment Share</span>
                      {editDividend ? (
                        <div style={styles.percentageInputContainer}>
                          <input
                            style={{
                              ...styles.percentageInput,
                              borderColor: dividendValidation.breakdownValid ? '#d1d5db' : '#ef4444',
                              backgroundColor: dividendValidation.breakdownValid ? '#ffffff' : '#fef2f2'
                            }}
                            value={settings.InvestmentSharePercentage}
                            onChange={(e) => handleInputChange('InvestmentSharePercentage', e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span style={styles.percentageSymbol}>%</span>
                        </div>
                      ) : (
                        <div style={styles.percentageDisplay}>
                          <span style={styles.percentageValue}>{settings.InvestmentSharePercentage}%</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Patronage Share</span>
                      {editDividend ? (
                        <div style={styles.percentageInputContainer}>
                          <input
                            style={{
                              ...styles.percentageInput,
                              borderColor: dividendValidation.breakdownValid ? '#d1d5db' : '#ef4444',
                              backgroundColor: dividendValidation.breakdownValid ? '#ffffff' : '#fef2f2'
                            }}
                            value={settings.PatronageSharePercentage}
                            onChange={(e) => handleInputChange('PatronageSharePercentage', e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span style={styles.percentageSymbol}>%</span>
                        </div>
                      ) : (
                        <div style={styles.percentageDisplay}>
                          <span style={styles.percentageValue}>{settings.PatronageSharePercentage}%</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.breakdownItem}>
                      <span style={styles.breakdownLabel}>Active Months</span>
                      {editDividend ? (
                        <div style={styles.percentageInputContainer}>
                          <input
                            style={{
                              ...styles.percentageInput,
                              borderColor: dividendValidation.breakdownValid ? '#d1d5db' : '#ef4444',
                              backgroundColor: dividendValidation.breakdownValid ? '#ffffff' : '#fef2f2'
                            }}
                            value={settings.ActiveMonthsPercentage}
                            onChange={(e) => handleInputChange('ActiveMonthsPercentage', e.target.value)}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span style={styles.percentageSymbol}>%</span>
                        </div>
                      ) : (
                        <div style={styles.percentageDisplay}>
                          <span style={styles.percentageValue}>{settings.ActiveMonthsPercentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.validationMessage,
                    color: dividendValidation.breakdownValid ? '#10b981' : '#ef4444',
                    backgroundColor: dividendValidation.breakdownValid ? '#f0fdf4' : '#fef2f2',
                    borderColor: dividendValidation.breakdownValid ? '#bbf7d0' : '#fecaca'
                  }}>
                    Total: {Math.round((parseFloat(settings.InvestmentSharePercentage || 0) + parseFloat(settings.PatronageSharePercentage || 0) + parseFloat(settings.ActiveMonthsPercentage || 0)) * 10) / 10}% 
                    {dividendValidation.breakdownValid ? ' ✓ Balanced' : ' - Must equal exactly 100%'}
                  </div>
                </div>

                {/* Dividend Date */}
                <div style={styles.dateSection}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Dividend Distribution Date</span>
                    <span style={styles.labelDescription}>Annual date for dividend distribution</span>
                  </label>
                  {editDividend ? (
                    <>
                      <button 
                        style={styles.dateButton}
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        <FaCalendarAlt style={{ marginRight: 8 }} />
                        {settings.DividendDate
                          ? new Date(settings.DividendDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Select distribution date'}
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
                    <div style={styles.dateDisplay}>
                      <FaCalendarAlt style={{ marginRight: 8, color: '#6b7280' }} />
                      <span style={styles.dateText}>
                        {settings.DividendDate
                          ? new Date(settings.DividendDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Not scheduled'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Content Management Section */}
        {activeSection === 'content' && (
          <div style={styles.section}>
            {/* Terms and Conditions */}
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaFileContract style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Terms and Conditions</h3>
                </div>
                <button 
                  style={styles.headerIconBtn} 
                  title="Edit Terms and Conditions" 
                  onClick={() => {
                    setTempTermsContent({
                      title: settings.TermsAndConditions.title,
                      content: settings.TermsAndConditions.content
                    });
                    setEditTermsModal(true);
                  }}
                >
                  <FaEdit />
                </button>
              </div>
              <div style={styles.contentPreview}>
                <div style={styles.contentPreviewHeader}>
                  <h4 style={styles.contentPreviewTitle}>{settings.TermsAndConditions.title}</h4>
                </div>
                <div style={styles.contentPreviewText}>
                  {settings.TermsAndConditions.content || 'No content available. Click edit to add terms and conditions.'}
                </div>
              </div>
            </div>

            {/* Privacy Policy */}
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaShieldAlt style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Privacy Policy</h3>
                </div>
                <button 
                  style={styles.headerIconBtn} 
                  title="Edit Privacy Policy" 
                  onClick={() => {
                    setTempPrivacyContent({
                      title: settings.PrivacyPolicy.title,
                      content: settings.PrivacyPolicy.content
                    });
                    setEditPrivacyModal(true);
                  }}
                >
                  <FaEdit />
                </button>
              </div>
              <div style={styles.contentPreview}>
                <div style={styles.contentPreviewHeader}>
                  <h4 style={styles.contentPreviewTitle}>{settings.PrivacyPolicy.title}</h4>
                </div>
                <div style={styles.contentPreviewText}>
                  {settings.PrivacyPolicy.content || 'No content available. Click edit to add privacy policy.'}
                </div>
              </div>
            </div>

            {/* About Us */}
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaInfoCircle style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>About Us</h3>
                </div>
                <button 
                  style={styles.headerIconBtn} 
                  title="Edit About Us" 
                  onClick={() => {
                    setTempAboutContent({
                      title: settings.AboutUs.title,
                      content: settings.AboutUs.content
                    });
                    setEditAboutModal(true);
                  }}
                >
                  <FaEdit />
                </button>
              </div>
              <div style={styles.contentPreview}>
                <div style={styles.contentPreviewHeader}>
                  <h4 style={styles.contentPreviewTitle}>{settings.AboutUs.title}</h4>
                </div>
                <div style={styles.contentPreviewText}>
                  {settings.AboutUs.content || 'No content available. Click edit to add about us information.'}
                </div>
              </div>
            </div>

            {/* Contact Us */}
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaPhone style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Contact Us</h3>
                </div>
                <button 
                  style={styles.headerIconBtn} 
                  title="Edit Contact Us" 
                  onClick={() => {
                    setTempContactContent({
                      title: settings.ContactUs.title,
                      content: settings.ContactUs.content
                    });
                    setEditContactModal(true);
                  }}
                >
                  <FaEdit />
                </button>
              </div>
              <div style={styles.contentPreview}>
                <div style={styles.contentPreviewHeader}>
                  <h4 style={styles.contentPreviewTitle}>{settings.ContactUs.title}</h4>
                </div>
                <div style={styles.contentPreviewText}>
                  {settings.ContactUs.content || 'No content available. Click edit to add contact information.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        message={confirmModalConfig.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        iconColor="#3B82F6"
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={confirmModalConfig.onCancel}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
        okLabel="Continue"
      />

      {/* All other existing modals remain the same but use the new confirmation pattern */}
      {addModalVisible && (
        <ConfirmModal
          visible={addModalVisible}
          message={`Add ${newTerm} months at ${newRate}% interest?`}
          confirmLabel="Yes"
          cancelLabel="No"
          iconColor="#3B82F6"
          onConfirm={confirmAddTerm}
          onCancel={() => setAddModalVisible(false)}
        />
      )}

      {/* Delete Interest Term Modal */}
      {deleteModalVisible && (
        <ConfirmModal
          visible={deleteModalVisible}
          message={`Delete the ${termToDelete} month term for ${(editingOriginalLoanType || wizardLoanTypeName)} only? Other loan types will keep this term.`}
          confirmLabel="Yes"
          cancelLabel="No"
          iconColor="#3B82F6"
          onConfirm={confirmDeleteTerm}
          onCancel={() => setDeleteModalVisible(false)}
        />
      )}

      {/* Add Savings Modal */}
      {savingsModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.smallModalCard}>
            <FiAlertCircle style={styles.confirmIcon} />
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
            <div style={styles.bottomButtons}>
              <button style={styles.confirmBtn} onClick={handleAddSavingsWithConfirmation}>Add</button>
              <button style={styles.cancelBtn} onClick={() => setSavingsModalVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Funds Action Modal */}
      {fundsActionModal && (
        <div style={styles.centeredModal}>
          <div style={styles.smallModalCard}>
            <FiAlertCircle style={styles.confirmIcon} />
            <p style={styles.modalText}>
              {fundsActionModal === 'add' ? 'Add to Funds' : 'Withdraw to Savings'}
            </p>
            <p style={styles.modalText}>
              {fundsActionModal === 'add' ? 
                `Available Savings: ₱${formatPesoAmount(settings.Savings)}` : 
                `Available Funds: ₱${formatPesoAmount(settings.Funds)}`}
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
            <div style={styles.bottomButtons}>
              <button style={styles.confirmBtn} onClick={handleFundsActionWithConfirmation}>
                {fundsActionModal === 'add' ? 'Transfer' : 'Withdraw'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setFundsActionModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Add Loan Type Wizard Modal */}
      {addLoanTypeWizardVisible && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '700px'}}>
            <h3 style={styles.enhancedModalTitle}>{isEditingLoanType ? 'Edit Loan Type' : 'Add Loan Type'}</h3>
            
            {/* Loan Type Name Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>
                Loan Type Name
              </label>
              <input
                style={styles.enhancedModalInput}
                placeholder="e.g., Emergency Loan"
                value={wizardLoanTypeName}
                onChange={(e) => setWizardLoanTypeName(e.target.value)}
              />
            </div>

            {/* Terms and Interest Rates Section */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 16, color: '#374151' }}>
                Terms and Interest Rates
              </label>
              
              {/* Column Headers */}
              <div style={styles.termsHeaderRow}>
                <div style={styles.columnHeader}>Terms/Months</div>
                <div style={styles.columnHeader}>Interest Rates</div>
                <div style={styles.columnHeader}>Action</div>
              </div>
              
              {/* Input Rows */}
              {wizardRows.map((row, idx) => (
                <div key={idx} style={styles.termsInputRow}>
                  {/* Terms/Months Input */}
                  <div style={styles.inputWithLabel}>
                    <input
                      style={styles.enhancedModalInput}
                      placeholder="e.g., 6"
                      type="number"
                      value={row.term}
                      onChange={(e) => updateWizardRow(idx, 'term', e.target.value)}
                    />
                  </div>
                  
                  {/* Interest Rate Input with % symbol */}
                  <div style={styles.inputWithLabel}>
                    <div style={styles.interestRateContainer}>
                      <input
                        style={styles.interestRateInput}
                        placeholder="e.g., 3.5"
                        type="number"
                        value={row.rate}
                        onChange={(e) => updateWizardRow(idx, 'rate', e.target.value)}
                      />
                      <span style={styles.percentSymbol}>%</span>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <div style={styles.removeButtonContainer}>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeWizardRow(idx)}
                      disabled={wizardRows.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Row Button */}
              <button
                style={styles.addRowButton}
                onClick={addWizardRow}
              >
                + Add Row
              </button>
            </div>

            {wizardError && (
              <div style={styles.errorMessage}>
                {wizardError}
              </div>
            )}

            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => { setAddLoanTypeWizardVisible(false); resetWizard(); }}
              >
                Cancel
              </button>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={confirmWizardAdd}
              >
                {isEditingLoanType ? 'Save Changes' : 'Add Loan Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Loan Type Modal */}
      {addLoanTypeModalVisible && (
        <ConfirmModal
          visible={addLoanTypeModalVisible}
          message={`Add "${newLoanType}" as a new loan type?`}
          confirmLabel="Yes"
          cancelLabel="No"
          iconColor="#3B82F6"
          onConfirm={confirmAddLoanType}
          onCancel={() => setAddLoanTypeModalVisible(false)}
        />
      )}

      {/* Delete Loan Type Modal */}
      {deleteLoanTypeModalVisible && (
        <ConfirmModal
          visible={deleteLoanTypeModalVisible}
          message={`Are you sure you want to delete "${loanTypeToDelete}" loan type?`}
          confirmLabel="Yes"
          cancelLabel="No"
          iconColor="#3B82F6"
          onConfirm={confirmDeleteLoanType}
          onCancel={() => setDeleteLoanTypeModalVisible(false)}
        />
      )}

      {/* Message Modal */}
      {messageModal.visible && (
        <div style={styles.centeredModal}>
          <div style={styles.smallModalCard}>
            {messageModal.isError ? (
              <FiAlertCircle style={{ fontSize: '48px', color: '#ef4444', marginBottom: '20px' }} />
            ) : (
              <FaCheckCircle style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }} />
            )}
            <p style={styles.modalText}>{messageModal.message}</p>
            <button 
              style={styles.confirmBtn}
              onClick={() => setMessageModal({ ...messageModal, visible: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Terms and Conditions Edit Modal */}
      {editTermsModal && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '700px'}}>
            <h3 style={styles.enhancedModalTitle}>Edit Terms and Conditions</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Title</label>
              <input
                style={styles.enhancedModalInput}
                value={tempTermsContent.title}
                onChange={(e) => setTempTermsContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Content</label>
              <textarea
                style={styles.enhancedModalTextarea}
                value={tempTermsContent.content}
                onChange={(e) => setTempTermsContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content"
              />
            </div>
            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={async () => {
                  try {
                    setActionInProgress(true);
                    const updatedTerms = {
                      title: tempTermsContent.title,
                      content: tempTermsContent.content
                    };
                    await update(ref(db, 'Settings/TermsAndConditions'), updatedTerms);
                    setSettings(prev => ({ ...prev, TermsAndConditions: updatedTerms }));
                    setSavedSettingsSnapshot(prev => ({ ...(prev || {}), TermsAndConditions: updatedTerms }));
                    setEditTermsModal(false);
                    showSuccessMessage('Terms and Conditions updated successfully!');
                  } catch (e) {
                    showMessage('Error', e.message || 'Failed to save Terms and Conditions', true);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => setEditTermsModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Privacy Policy Edit Modal */}
      {editPrivacyModal && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '700px'}}>
            <h3 style={styles.enhancedModalTitle}>Edit Privacy Policy</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Title</label>
              <input
                style={styles.enhancedModalInput}
                value={tempPrivacyContent.title}
                onChange={(e) => setTempPrivacyContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Content</label>
              <textarea
                style={styles.enhancedModalTextarea}
                value={tempPrivacyContent.content}
                onChange={(e) => setTempPrivacyContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content"
              />
            </div>
            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={async () => {
                  try {
                    setActionInProgress(true);
                    const updatedPrivacy = {
                      title: tempPrivacyContent.title,
                      content: tempPrivacyContent.content
                    };
                    await update(ref(db, 'Settings/PrivacyPolicy'), updatedPrivacy);
                    setSettings(prev => ({ ...prev, PrivacyPolicy: updatedPrivacy }));
                    setSavedSettingsSnapshot(prev => ({ ...(prev || {}), PrivacyPolicy: updatedPrivacy }));
                    setEditPrivacyModal(false);
                    showSuccessMessage('Privacy Policy updated successfully!');
                  } catch (e) {
                    showMessage('Error', e.message || 'Failed to save Privacy Policy', true);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => setEditPrivacyModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced About Us Edit Modal */}
      {editAboutModal && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '700px'}}>
            <h3 style={styles.enhancedModalTitle}>Edit About Us</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Title</label>
              <input
                style={styles.enhancedModalInput}
                value={tempAboutContent.title}
                onChange={(e) => setTempAboutContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Content</label>
              <textarea
                style={styles.enhancedModalTextarea}
                value={tempAboutContent.content}
                onChange={(e) => setTempAboutContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content"
              />
            </div>
            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={async () => {
                  try {
                    setActionInProgress(true);
                    const updatedAbout = {
                      title: tempAboutContent.title,
                      content: tempAboutContent.content
                    };
                    await update(ref(db, 'Settings/AboutUs'), updatedAbout);
                    setSettings(prev => ({ ...prev, AboutUs: updatedAbout }));
                    setSavedSettingsSnapshot(prev => ({ ...(prev || {}), AboutUs: updatedAbout }));
                    setEditAboutModal(false);
                    showSuccessMessage('About Us updated successfully!');
                  } catch (e) {
                    showMessage('Error', e.message || 'Failed to save About Us', true);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => setEditAboutModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Contact Us Edit Modal */}
      {editContactModal && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '700px'}}>
            <h3 style={styles.enhancedModalTitle}>Edit Contact Us</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Title</label>
              <input
                style={styles.enhancedModalInput}
                value={tempContactContent.title}
                onChange={(e) => setTempContactContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Content</label>
              <textarea
                style={styles.enhancedModalTextarea}
                value={tempContactContent.content}
                onChange={(e) => setTempContactContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content"
              />
            </div>
            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={async () => {
                  try {
                    setActionInProgress(true);
                    const updatedContact = {
                      title: tempContactContent.title,
                      content: tempContactContent.content
                    };
                    await update(ref(db, 'Settings/ContactUs'), updatedContact);
                    setSettings(prev => ({ ...prev, ContactUs: updatedContact }));
                    setSavedSettingsSnapshot(prev => ({ ...(prev || {}), ContactUs: updatedContact }));
                    setEditContactModal(false);
                    showSuccessMessage('Contact Us updated successfully!');
                  } catch (e) {
                    showMessage('Error', e.message || 'Failed to save Contact Us', true);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => setEditContactModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Add to Savings Modal */}
      {addToSavingsModalVisible && (
        <div style={styles.centeredModal}>
          <div style={{...styles.enhancedModal, maxWidth: '400px' }}>
            <h3 style={styles.enhancedModalTitle}>Add to Savings</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#374151' }}>Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#059669' }}>₱</span>
                <input
                  style={styles.enhancedModalInput}
                  value={savingsAddAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setSavingsAddAmount(value);
                    }
                  }}
                  type="text"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {savingsAddAmount && parseFloat(savingsAddAmount) > 0 && (
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  Current: ₱{formatPesoAmount(settings.Savings)} → New total: ₱{formatPesoAmount((parseFloat(settings.Savings || 0) + parseFloat(savingsAddAmount)).toFixed(2))}
                </div>
              )}
            </div>
            <div style={styles.enhancedModalButtons}>
              <button
                style={styles.enhancedModalBtnPrimary}
                onClick={async () => {
                  try {
                    const addAmount = parseFloat(savingsAddAmount || 0);
                    if (addAmount <= 0) {
                      showMessage('Error', 'Please enter a valid amount greater than 0', true);
                      return;
                    }

                    setActionInProgress(true);
                    
                    const currentSavings = parseFloat(settings.Savings || 0);
                    const newSavingsTotal = currentSavings + addAmount;
                    
                    const updateData = {
                      Savings: parseFloat(newSavingsTotal.toFixed(2))
                    };
                    
                    await update(ref(db, 'Settings'), updateData);
                    
                    setSettings(prev => ({ ...prev, Savings: newSavingsTotal.toString() }));
                    setSavedSettingsSnapshot(prev => ({ 
                      ...(prev || {}), 
                      Savings: newSavingsTotal.toString()
                    }));
                    
                    setSavingsAddAmount('');
                    setAddToSavingsModalVisible(false);
                    showSuccessMessage(`₱${formatPesoAmount(addAmount)} added to savings successfully!`);
                  } catch (e) {
                    showMessage('Error', e.message || 'Failed to add to savings', true);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress || !savingsAddAmount || parseFloat(savingsAddAmount) <= 0}
              >
                {actionInProgress ? 'Adding...' : 'Add to Savings'}
              </button>
              <button
                style={styles.enhancedModalBtnSecondary}
                onClick={() => {
                  setSavingsAddAmount('');
                  setAddToSavingsModalVisible(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputRow = ({ label, value, onChange, editable, suffix }) => (
  <div style={styles.inputRow}>
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
    </label>
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

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRight: '1px solid #e2e8f0',
    boxShadow: '4px 0 20px rgba(0,0,0,0.04)',
  },
  sidebarHeader: {
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f1f5f9'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#64748b',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    gap: '12px'
  },
  sidebarButtonActive: {
    backgroundColor: '#f0f7ff',
    color: '#1e40af',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.15)',
  },
  sidebarIcon: {
    fontSize: '18px',
    opacity: '0.8'
  },
  sidebarButtonText: {
    fontSize: '15px',
    fontWeight: '500'
  },
  contentArea: {
    flex: 1,
    padding: '32px',
    backgroundColor: '#f8fafc',
    minWidth: 0,
    overflow: 'auto',
  },
  contentHeader: {
    marginBottom: '32px'
  },
  contentTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em'
  },
  contentSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '400'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f8fafc'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardIcon: {
    fontSize: '24px',
    color: '#1e40af'
  },
  cardTitleText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1'
  },
  labelText: {
    fontSize: '15px',
    color: '#374151',
    fontWeight: '600'
  },
  labelDescription: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '400'
  },
  amountDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '10px',
    minWidth: '150px',
    justifyContent: 'flex-end'
  },
  amountSymbol: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669'
  },
  amountValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669'
  },
  amountInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px 14px',
    minWidth: '150px',
    transition: 'all 0.3s ease'
  },
  amountInput: {
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    width: '100%',
    textAlign: 'right',
    backgroundColor: 'transparent'
  },
  valueDisplay: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '10px',
    minWidth: '120px',
    textAlign: 'center'
  },
  valueText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151'
  },
  valueInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px 14px',
    minWidth: '120px'
  },
  valueInput: {
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    width: '60px',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  valueSuffix: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px'
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 24px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
  },
  accountGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  accountCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0'
  },
  accountCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  accountType: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  accountBadge: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  orientationContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  orientationCodeDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #dbeafe'
  },
  orientationCodeValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e40af',
    fontFamily: 'monospace',
    letterSpacing: '1px'
  },
  orientationActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  smallIconButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '12px'
  },
  copiedText: {
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600'
  },
  orientationDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    textAlign: 'center'
  },
  loanTypesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  loanTypeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },
  loanTypeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  loanTypeName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  loanTypeActions: {
    display: 'flex',
    gap: '6px'
  },
  termsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  termChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  termMonths: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  termRate: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669'
  },
  noTerms: {
    fontSize: '14px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  dividendContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  dividendSection: {
    backgroundColor: '#f8fafc',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  sectionSubtitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '20px'
  },
  percentageRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px'
  },
  percentageItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: '1',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  percentageLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  percentageInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  percentageInput: {
    width: '60px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '14px',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },
  percentageSymbol: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  percentageDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  percentageValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669'
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  breakdownLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  validationMessage: {
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 12px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid',
    transition: 'all 0.3s ease'
  },
  dateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  dateButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    width: 'fit-content'
  },
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '14px 16px',
    borderRadius: '10px',
    width: 'fit-content'
  },
  dateText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151'
  },
  calendarContainer: {
    marginTop: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    width: 'fit-content'
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  contentPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  contentPreviewHeader: {
    paddingBottom: '12px',
    borderBottom: '2px solid #f8fafc'
  },
  contentPreviewTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0'
  },
  contentPreviewText: {
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#6b7280',
    maxHeight: '120px',
    overflow: 'auto',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  headerIconBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  input: {
    flex: 1,
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff'
  },
  staticText: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  centeredModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  smallModalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '380px',
    border: '1px solid #e2e8f0'
  },
  confirmIcon: {
    fontSize: '56px',
    color: '#1e3a8a',
    marginBottom: '24px'
  },
  modalText: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '28px',
    lineHeight: '1.6',
    fontWeight: '500'
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  bottomButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center'
  },
  confirmBtn: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 28px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '100px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
  },
  cancelBtn: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 28px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '100px',
    transition: 'all 0.3s ease'
  },
  enhancedModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '600px',
    border: '1px solid #e2e8f0',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  enhancedModalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1e293b',
    textAlign: 'center'
  },
  enhancedModalInput: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    marginBottom: '0',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease'
  },
  enhancedModalTextarea: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    minHeight: '200px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  enhancedModalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px'
  },
  enhancedModalBtnPrimary: {
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    minWidth: '120px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  enhancedModalBtnSecondary: {
    padding: '14px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    minWidth: '120px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '2px solid #e2e8f0'
  },
  removeButton: {
    padding: '12px 16px', 
    backgroundColor: '#ef4444', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    width: '100%',
    minWidth: '80px'
  },
  addRowButton: {
    padding: '12px 20px', 
    backgroundColor: '#1e40af', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    width: '100%',
    marginTop: '8px'
  },
  errorMessage: {
    color: '#ef4444', 
    marginBottom: 16, 
    fontSize: 14, 
    backgroundColor: '#fef2f2',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  // New styles for the loan type wizard
  termsHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 100px',
    gap: '12px',
    marginBottom: '12px',
    padding: '0 4px'
  },
  columnHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'left'
  },
  termsInputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 100px',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  inputWithLabel: {
    display: 'flex',
    flexDirection: 'column'
  },
  interestRateContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  interestRateInput: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    paddingRight: '40px' // Make space for % symbol
  },
  percentSymbol: {
    position: 'absolute',
    right: '16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    pointerEvents: 'none' // Make it non-interactive
  },
  removeButtonContainer: {
    display: 'flex',
    justifyContent: 'center'
  }
};

// Add CSS for animations
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .confirm-btn:hover {
    background: linear-gradient(135deg, #3730a3 0%, #1e3a8a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 58, 138, 0.4);
  }

  .cancel-btn:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }

  .enhanced-modal-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .enhanced-modal-btn-secondary:hover:not(:disabled) {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }

  .enhanced-modal-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
document.head.appendChild(styleElement);

export default SystemSettings;