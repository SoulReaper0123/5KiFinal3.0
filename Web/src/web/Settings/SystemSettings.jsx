import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrashAlt, FaPlus, FaExchangeAlt, FaCopy, FaRedo, FaCheck, FaTimes } from 'react-icons/fa';

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState('accounts');
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

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'accounts' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('accounts')}
        >
          <span style={styles.sidebarButtonText}>Accounts</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'financial' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('financial')}
        >
          <span style={styles.sidebarButtonText}>Financial</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'orientation' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('orientation')}
        >
          <span style={styles.sidebarButtonText}>Orientation</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'interest' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('interest')}
        >
          <span style={styles.sidebarButtonText}>Interest Rates</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'loan' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('loan')}
        >
          <span style={styles.sidebarButtonText}>Loan Settings</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'dividend' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('dividend')}
        >
          <span style={styles.sidebarButtonText}>Dividend</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'terms' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('terms')}
        >
          <span style={styles.sidebarButtonText}>Terms</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'privacy' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('privacy')}
        >
          <span style={styles.sidebarButtonText}>Privacy</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'about' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('about')}
        >
          <span style={styles.sidebarButtonText}>About Us</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'contact' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('contact')}
        >
          <span style={styles.sidebarButtonText}>Contact Us</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.contentArea}>
        {/* Only show the active section */}
        <div style={styles.sectionContainer}>
          {/* Accounts Section */}
          {activeSection === 'accounts' && (
            <div style={styles.section}>
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
          )}

          {/* Financial Settings */}
          {activeSection === 'financial' && (
            <div style={styles.section}>
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
                  <div style={styles.savingsInputContainer}>
                    <input
                      style={styles.staticInput}
                      value={settings.Savings}
                      readOnly
                    />
                    <button 
                      style={styles.actionBtnAddFunds}
                      onClick={handleAddSavings}
                    >
                      <FaPlus style={styles.buttonIcon} /> Add
                    </button>
                  </div>
                ) : (
                  <span style={styles.staticText}>₱{settings.Savings}</span>
                )}
              </div>

              {editMode && (
                <div style={styles.fundsActions}>
                  <button 
                    style={styles.actionBtnAddFunds}
                    onClick={() => handleFundsAction('add')}
                    disabled={!settings.Savings || parseFloat(settings.Savings) <= 0}
                  >
                    <FaExchangeAlt style={styles.buttonIcon} /> Add to Funds
                  </button>
                  <button 
                    style={styles.actionBtnWithdrawFunds}
                    onClick={() => handleFundsAction('withdraw')}
                    disabled={!settings.Funds || parseFloat(settings.Funds) <= 0}
                  >
                    <FaExchangeAlt style={styles.buttonIcon} /> Withdraw to Savings
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Orientation Code */}
          {activeSection === 'orientation' && (
            <div style={styles.section}>
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
                      <FaCopy style={styles.buttonIcon} />
                    </button>
                  )}
                  {orientationCopied && <span style={styles.copiedText}>Copied!</span>}
                </div>
                {editMode && (
                  <button 
                    style={styles.generateBtn}
                    onClick={handleGenerateOrientationCode}
                  >
                    <FaRedo style={styles.buttonIcon} /> Generate New Code
                  </button>
                )}
                <p style={styles.orientationCodeDescription}>
                  This code is used for registration when attending the orientation. Share this code with attendees.
                </p>
              </div>
            </div>
          )}

          {/* Interest Rates */}
          {activeSection === 'interest' && (
            <div style={styles.section}>
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
                        <FaTrashAlt style={styles.buttonIcon} />
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
                    <FaPlus style={styles.buttonIcon} /> Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loan Settings */}
          {activeSection === 'loan' && (
            <div style={styles.section}>
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
                    ...(settings.AdvancedPayments ? styles.sliderChecked : {})
                  }}>
                    <span style={styles.sliderBefore}></span>
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
          )}

          {/* Dividend Date */}
          {activeSection === 'dividend' && (
            <div style={styles.section}>
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
          )}

          {/* Terms and Conditions Section */}
          {activeSection === 'terms' && (
            <div style={styles.section}>
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
                      style={styles.saveBtnSuccess}
                      onClick={() => setEditTerms(false)}
                    >
                      <FaCheck style={styles.buttonIcon} /> Save Terms
                    </button>
                    <button 
                      style={styles.saveBtnError}
                      onClick={() => setEditTerms(false)}
                    >
                      <FaTimes style={styles.buttonIcon} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.textContent}>
                    <h3 style={styles.contentTitle}>{settings.TermsAndConditions.title}</h3>
                    <div style={styles.contentText}>{settings.TermsAndConditions.content}</div>
                  </div>
                  {editMode && (
                    <button 
                      style={styles.saveBtnPrimary}
                      onClick={() => setEditTerms(true)}
                    >
                      Edit Terms
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Privacy Policy Section */}
          {activeSection === 'privacy' && (
            <div style={styles.section}>
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
                      style={styles.saveBtnSuccess}
                      onClick={() => setEditPrivacy(false)}
                    >
                      <FaCheck style={styles.buttonIcon} /> Save Privacy Policy
                    </button>
                    <button 
                      style={styles.saveBtnError}
                      onClick={() => setEditPrivacy(false)}
                    >
                      <FaTimes style={styles.buttonIcon} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.textContent}>
                    <h3 style={styles.contentTitle}>{settings.PrivacyPolicy.title}</h3>
                    <div style={styles.contentText}>{settings.PrivacyPolicy.content}</div>
                  </div>
                  {editMode && (
                    <button 
                      style={styles.saveBtnPrimary}
                      onClick={() => setEditPrivacy(true)}
                    >
                      Edit Privacy Policy
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* About Us Section */}
          {activeSection === 'about' && (
            <div style={styles.section}>
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
                      style={styles.saveBtnSuccess}
                      onClick={() => setEditAboutUs(false)}
                    >
                      <FaCheck style={styles.buttonIcon} /> Save About Us
                    </button>
                    <button 
                      style={styles.saveBtnError}
                      onClick={() => setEditAboutUs(false)}
                    >
                      <FaTimes style={styles.buttonIcon} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.textContent}>
                    <h3 style={styles.contentTitle}>{settings.AboutUs.title}</h3>
                    <div style={styles.contentText}>{settings.AboutUs.content}</div>
                  </div>
                  {editMode && (
                    <button 
                      style={styles.saveBtnPrimary}
                      onClick={() => setEditAboutUs(true)}
                    >
                      Edit About Us
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contact Us Section */}
          {activeSection === 'contact' && (
            <div style={styles.section}>
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
                      style={styles.saveBtnSuccess}
                      onClick={() => setEditContactUs(false)}
                    >
                      <FaCheck style={styles.buttonIcon} /> Save Contact Us
                    </button>
                    <button 
                      style={styles.saveBtnError}
                      onClick={() => setEditContactUs(false)}
                    >
                      <FaTimes style={styles.buttonIcon} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.textContent}>
                    <h3 style={styles.contentTitle}>{settings.ContactUs.title}</h3>
                    <div style={styles.contentText}>{settings.ContactUs.content}</div>
                  </div>
                  {editMode && (
                    <button 
                      style={styles.saveBtnPrimary}
                      onClick={() => setEditContactUs(true)}
                    >
                      Edit Contact Us
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save/Edit Button */}
        <button 
          style={{
            ...styles.saveBtn,
            ...(editMode ? styles.saveBtnSaveMode : {})
          }}
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
                  style={styles.modalBtnCancel}
                  onClick={() => setConfirmationModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalBtnConfirm}
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
                  style={styles.modalBtnCancel}
                  onClick={() => setAddModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalBtnConfirm}
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
                  style={styles.modalBtnCancel}
                  onClick={() => setDeleteModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalBtnConfirm}
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
                  style={styles.modalBtnCancel}
                  onClick={() => setSavingsModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalBtnConfirm}
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
                  style={styles.modalBtnCancel}
                  onClick={() => setFundsActionModal(null)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalBtnConfirm}
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
                    ...(messageModal.isError ? styles.modalBtnError : styles.modalBtnSuccess)
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

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#2D5783',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarButton: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  sidebarButtonActive: {
    backgroundColor: '#3a6ea5',
    borderLeft: '4px solid #4CAF50',
  },
  sidebarButtonText: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: '500',
  },
  contentArea: {
    flexGrow: 1,
    padding: '20px',
    marginLeft: '200px',
    overflowY: 'auto',
    minHeight: '100vh',
  },
  sectionContainer: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#2D5783',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    width: '200px',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: '#2D5783',
    outline: 'none',
  },
  staticInput: {
    flex: 1,
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    backgroundColor: '#f9f9f9',
    color: '#555',
  },
  staticText: {
    fontSize: '14px',
    color: '#333',
  },
  accountRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  accountCard: {
    flex: 1,
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  accountTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2D5783',
  },
  savingsInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  fundsActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  actionBtn: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  actionBtnAddFunds: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  actionBtnWithdrawFunds: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  buttonIcon: {
    fontSize: '14px',
  },
  orientationCodeContainer: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
  },
  orientationCodeTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '10px',
  },
  orientationCodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  orientationCodeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#075985',
    backgroundColor: '#e0f2fe',
    padding: '10px 15px',
    borderRadius: '6px',
  },
  copyBtn: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  copiedText: {
    fontSize: '13px',
    color: '#10b981',
    marginLeft: '10px',
    fontWeight: '500',
  },
  orientationCodeDescription: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '10px',
    lineHeight: '1.5',
  },
  generateBtn: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    marginTop: '15px',
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
  },
  termText: {
    fontSize: '14px',
    color: '#334155',
    fontWeight: '500',
  },
  editRateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  miniInput: {
    width: '80px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '14px',
    textAlign: 'center',
  },
  deleteTermBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '6px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  addTermBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
  },
  switchInput: {
    opacity: '0',
    width: '0',
    height: '0',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '24px',
  },
  sliderChecked: {
    backgroundColor: '#4CAF50',
  },
  sliderBefore: {
    position: 'absolute',
    content: '""',
    height: '16px',
    width: '16px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
  },
  dateButton: {
    color: '#2D5783',
    marginBottom: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    padding: '8px 0',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.2s',
  },
  calendarContainer: {
    marginTop: '10px',
    border: '1px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textarea: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#fff',
    minHeight: '200px',
    resize: 'vertical',
    width: '100%',
    lineHeight: '1.5',
  },
  textContent: {
    whiteSpace: 'pre-line',
    marginBottom: '20px',
  },
  contentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2D5783',
  },
  contentText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#333',
    whiteSpace: 'pre-line',
  },
  editButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  saveBtn: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    width: '100%',
    marginTop: '20px',
    transition: 'all 0.2s',
    maxWidth: '1000px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'block',
  },
  saveBtnPrimary: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  saveBtnSuccess: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    flex: 1,
  },
  saveBtnError: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    flex: 1,
  },
  saveBtnSaveMode: {
    backgroundColor: '#1a3d66',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2D5783',
    textAlign: 'center',
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '20px',
    color: '#555',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
  },
  modalBtn: {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    flex: '1',
    transition: 'all 0.2s',
  },
  modalBtnCancel: {
    backgroundColor: '#f1f5f9',
    color: '#555',
  },
  modalBtnConfirm: {
    backgroundColor: '#2D5783',
    color: 'white',
  },
  modalBtnSuccess: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  modalBtnError: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderLeftColor: '#2D5783',
    animation: 'spin 1s linear infinite',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
};

export default SystemSettings;