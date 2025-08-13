import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrashAlt, FaPlus, FaExchangeAlt, FaCopy, FaRedo } from 'react-icons/fa';

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
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="system-settings-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className={`sidebar-button ${activeSection === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveSection('accounts')}
        >
          <span className="sidebar-button-text">Accounts</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveSection('financial')}
        >
          <span className="sidebar-button-text">Financial</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'orientation' ? 'active' : ''}`}
          onClick={() => setActiveSection('orientation')}
        >
          <span className="sidebar-button-text">Orientation</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'interest' ? 'active' : ''}`}
          onClick={() => setActiveSection('interest')}
        >
          <span className="sidebar-button-text">Interest Rates</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'loan' ? 'active' : ''}`}
          onClick={() => setActiveSection('loan')}
        >
          <span className="sidebar-button-text">Loan Settings</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'dividend' ? 'active' : ''}`}
          onClick={() => setActiveSection('dividend')}
        >
          <span className="sidebar-button-text">Dividend</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveSection('terms')}
        >
          <span className="sidebar-button-text">Terms</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveSection('privacy')}
        >
          <span className="sidebar-button-text">Privacy</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'about' ? 'active' : ''}`}
          onClick={() => setActiveSection('about')}
        >
          <span className="sidebar-button-text">About Us</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveSection('contact')}
        >
          <span className="sidebar-button-text">Contact Us</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {/* Accounts Section */}
        {activeSection === 'accounts' && (
          <div className="section">
            <h2 className="section-title">Accounts</h2>
            
            <div className="account-row">
              <div className="account-card">
                <h3 className="account-title">Bank Account</h3>
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
              
              <div className="account-card">
                <h3 className="account-title">GCash Account</h3>
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
          <div className="section">
            <h2 className="section-title">Financial Settings</h2>
            
            <InputRow
              label="Loanable Amount Percentage"
              value={settings.LoanPercentage}
              onChange={(text) => handleInputChange('LoanPercentage', text)}
              editable={editMode}
              suffix="%"
            />
            
            <div className="input-row">
              <label className="label">Available Funds (₱)</label>
              <input 
                className="static-input" 
                value={settings.Funds} 
                readOnly 
              />
            </div>

            <div className="input-row">
              <label className="label">Savings (₱)</label>
              {editMode ? (
                <div className="savings-input-container">
                  <input
                    className="static-input"
                    value={settings.Savings}
                    readOnly
                  />
                  <button 
                    className="action-btn add-funds-btn"
                    onClick={handleAddSavings}
                  >
                    <FaPlus /> Add
                  </button>
                </div>
              ) : (
                <span className="static-text">₱{settings.Savings}</span>
              )}
            </div>

            {editMode && (
              <div className="funds-actions">
                <button 
                  className="action-btn add-funds-btn"
                  onClick={() => handleFundsAction('add')}
                  disabled={!settings.Savings || parseFloat(settings.Savings) <= 0}
                >
                  <FaExchangeAlt /> Add to Funds
                </button>
                <button 
                  className="action-btn withdraw-funds-btn"
                  onClick={() => handleFundsAction('withdraw')}
                  disabled={!settings.Funds || parseFloat(settings.Funds) <= 0}
                >
                  <FaExchangeAlt /> Withdraw to Savings
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orientation Code */}
        {activeSection === 'orientation' && (
          <div className="section">
            <h2 className="section-title">Orientation Registration Code</h2>
            <div className="orientation-code-container">
              <div className="orientation-code-title">Orientation Attendance Code</div>
              <div className="orientation-code-row">
                <div className="orientation-code-value">
                  {settings.OrientationCode || 'Not set'}
                </div>
                {settings.OrientationCode && (
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(settings.OrientationCode)}
                    aria-label="Copy orientation code"
                  >
                    <FaCopy />
                  </button>
                )}
                {orientationCopied && <span className="copied-text">Copied!</span>}
              </div>
              {editMode && (
                <button 
                  className="generate-btn"
                  onClick={handleGenerateOrientationCode}
                >
                  <FaRedo /> Generate New Code
                </button>
              )}
              <p className="orientation-code-description">
                This code is used for registration when attending the orientation. Share this code with attendees.
              </p>
            </div>
          </div>
        )}

        {/* Interest Rates */}
        {activeSection === 'interest' && (
          <div className="section">
            <h2 className="section-title">Interest Rates</h2>
            {Object.entries(settings.InterestRate).map(([term, rate]) => (
              <div key={term} className="rate-row">
                <span className="term-text">{term} months</span>
                {editMode ? (
                  <div className="edit-rate-row">
                    <input
                      className="mini-input"
                      value={rate}
                      onChange={(e) => handleInterestChange(term, e.target.value)}
                      type="number"
                    />
                    <span>%</span>
                    <button 
                      className="delete-term-btn"
                      onClick={() => requestDeleteTerm(term)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  <span className="static-text">{rate}%</span>
                )}
              </div>
            ))}
            {editMode && (
              <div className="input-row">
                <input
                  className="input"
                  placeholder="New Term (e.g. 6)"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  type="number"
                />
                <input
                  className="input"
                  placeholder="Interest Rate (%)"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  type="number"
                />
                <button className="add-term-btn" onClick={requestAddTerm}>
                  <FaPlus /> Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loan Settings */}
        {activeSection === 'loan' && (
          <div className="section">
            <h2 className="section-title">Loan Settings</h2>
            
            <div className="input-row">
              <label className="label">Advanced Payments</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.AdvancedPayments}
                  onChange={(e) => setSettings({ ...settings, AdvancedPayments: e.target.checked })}
                  disabled={!editMode}
                  className="switch-input"
                />
                <span className={`slider ${settings.AdvancedPayments ? 'checked' : ''}`}>
                  <span className="slider-before"></span>
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
          <div className="section">
            <h2 className="section-title">Dividend Settings</h2>
            <label className="label">Dividend Date</label>
            {editMode ? (
              <>
                <button 
                  className="date-button"
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
                  <div className="calendar-container">
                    <Calendar
                      onChange={handleDateChange}
                      value={settings.DividendDate ? new Date(settings.DividendDate) : new Date()}
                    />
                  </div>
                )}
              </>
            ) : (
              <span className="static-text">
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
          <div className="section">
            <h2 className="section-title">Terms and Conditions</h2>
            {editMode && editTerms ? (
              <div className="edit-section">
                <div className="input-container">
                  <label>Title</label>
                  <input
                    className="input"
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
                <div className="input-container">
                  <label>Content</label>
                  <textarea
                    className="textarea"
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
                <div className="edit-buttons">
                  <button 
                    className="save-btn success"
                    onClick={() => setEditTerms(false)}
                  >
                    Save Terms
                  </button>
                  <button 
                    className="save-btn error"
                    onClick={() => setEditTerms(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-content">
                  <h3>{settings.TermsAndConditions.title}</h3>
                  <p>{settings.TermsAndConditions.content}</p>
                </div>
                {editMode && (
                  <button 
                    className="save-btn primary"
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
          <div className="section">
            <h2 className="section-title">Privacy Policy</h2>
            {editMode && editPrivacy ? (
              <div className="edit-section">
                <div className="input-container">
                  <label>Title</label>
                  <input
                    className="input"
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
                <div className="input-container">
                  <label>Content</label>
                  <textarea
                    className="textarea"
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
                <div className="edit-buttons">
                  <button 
                    className="save-btn success"
                    onClick={() => setEditPrivacy(false)}
                  >
                    Save Privacy Policy
                  </button>
                  <button 
                    className="save-btn error"
                    onClick={() => setEditPrivacy(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-content">
                  <h3>{settings.PrivacyPolicy.title}</h3>
                  <p>{settings.PrivacyPolicy.content}</p>
                </div>
                {editMode && (
                  <button 
                    className="save-btn primary"
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
          <div className="section">
            <h2 className="section-title">About Us</h2>
            {editMode && editAboutUs ? (
              <div className="edit-section">
                <div className="input-container">
                  <label>Title</label>
                  <input
                    className="input"
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
                <div className="input-container">
                  <label>Content</label>
                  <textarea
                    className="textarea"
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
                <div className="edit-buttons">
                  <button 
                    className="save-btn success"
                    onClick={() => setEditAboutUs(false)}
                  >
                    Save About Us
                  </button>
                  <button 
                    className="save-btn error"
                    onClick={() => setEditAboutUs(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-content">
                  <h3>{settings.AboutUs.title}</h3>
                  <p>{settings.AboutUs.content}</p>
                </div>
                {editMode && (
                  <button 
                    className="save-btn primary"
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
          <div className="section">
            <h2 className="section-title">Contact Us</h2>
            {editMode && editContactUs ? (
              <div className="edit-section">
                <div className="input-container">
                  <label>Title</label>
                  <input
                    className="input"
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
                <div className="input-container">
                  <label>Content</label>
                  <textarea
                    className="textarea"
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
                <div className="edit-buttons">
                  <button 
                    className="save-btn success"
                    onClick={() => setEditContactUs(false)}
                  >
                    Save Contact Us
                  </button>
                  <button 
                    className="save-btn error"
                    onClick={() => setEditContactUs(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-content">
                  <h3>{settings.ContactUs.title}</h3>
                  <p>{settings.ContactUs.content}</p>
                </div>
                {editMode && (
                  <button 
                    className="save-btn primary"
                    onClick={() => setEditContactUs(true)}
                  >
                    Edit Contact Us
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Save/Edit Button */}
        <button 
          className={`save-btn ${editMode ? 'save-mode' : ''}`}
          onClick={editMode ? handleSave : () => setEditMode(true)}
        >
          {editMode ? 'Save Settings' : 'Edit Settings'}
        </button>

        {/* Save Confirmation Modal */}
        {confirmationModalVisible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Confirm Changes</h3>
              <p className="modal-text">Are you sure you want to save these settings changes?</p>
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setConfirmationModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Add Interest Rate</h3>
              <p className="modal-text">
                Add {newTerm} months at {newRate}% interest?
              </p>
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setAddModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Delete Interest Rate</h3>
              <p className="modal-text">
                Are you sure you want to delete the {termToDelete} month interest rate?
              </p>
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setDeleteModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Add to Savings</h3>
              <p className="modal-text">Enter amount to add to savings:</p>
              <input
                className="modal-input"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                type="number"
                placeholder="Amount"
                min="0"
                step="0.01"
              />
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setSavingsModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">
                {fundsActionModal === 'add' ? 'Add to Funds' : 'Withdraw to Savings'}
              </h3>
              <p className="modal-text">
                {fundsActionModal === 'add' ? 
                  `Available Savings: ₱${settings.Savings}` : 
                  `Available Funds: ₱${settings.Funds}`}
              </p>
              <input
                className="modal-input"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                type="number"
                placeholder="Amount"
                min="0"
                step="0.01"
              />
              <div className="modal-buttons">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setFundsActionModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">{messageModal.title}</h3>
              <p className="modal-text">{messageModal.message}</p>
              <div className="modal-buttons">
                <button 
                  className={`modal-btn ${messageModal.isError ? 'error' : 'success'}`}
                  onClick={() => setMessageModal({ ...messageModal, visible: false })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .system-settings-container {
          display: flex;
          min-height: 100vh;
          background-color: #eef1f5;
        }

        .sidebar {
          width: 150px;
          background-color: #dfe4ea;
          padding-top: 20px;
        }

        .sidebar-button {
          display: block;
          width: 100%;
          padding: 12px 10px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
        }

        .sidebar-button.active {
          background-color: #2ecc71;
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }

        .sidebar-button-text {
          font-size: 13px;
          color: #333;
        }

        .sidebar-button.active .sidebar-button-text {
          color: #fff;
          font-weight: bold;
        }

        .content-area {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .section {
          background-color: #fff;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
        }

        .input-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .label {
          font-size: 13px;
          margin-left: 10px;
        }

        .input {
          flex: 1;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 8px 10px;
          font-size: 13px;
          margin-left: 10px;
        }

        .static-input {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 8px 10px;
          font-size: 13px;
          background-color: #f8fafc;
          color: #64748b;
        }

        .static-text {
          font-size: 13px;
          color: #334155;
          padding: 8px 0;
        }

        .account-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .account-card {
          flex: 1;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
        }

        .account-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #1e293b;
        }

        .savings-input-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .funds-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .action-btn {
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .action-btn:active {
          transform: translateY(0);
        }

        .add-funds-btn {
          background-color: #10b981;
          color: white;
        }

        .withdraw-funds-btn {
          background-color: #f97316;
          color: white;
        }

        .orientation-code-container {
          margin-top: 20px;
          padding: 15px;
          background-color: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }

        .orientation-code-title {
          font-size: 14px;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 10px;
        }

        .orientation-code-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .orientation-code-value {
          font-size: 14px;
          font-weight: 600;
          color: #075985;
          background-color: #e0f2fe;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .copy-btn {
          background-color: #dbeafe;
          color: #2563eb;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          background-color: #bfdbfe;
        }

        .copied-text {
          font-size: 12px;
          color: #10b981;
          margin-left: 10px;
          font-weight: 500;
        }

        .orientation-code-description {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }

        .generate-btn {
          background-color: #2563eb;
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .generate-btn:hover {
          background-color: #1d4ed8;
        }

        .rate-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px;
          background-color: #f8fafc;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .rate-row:hover {
          background-color: #f1f5f9;
        }

        .term-text {
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }

        .edit-rate-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mini-input {
          width: 80px;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 8px;
          font-size: 13px;
          text-align: center;
        }

        .delete-term-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
          padding: 6px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .delete-term-btn:hover {
          background-color: #fee2e2;
        }

        .add-term-btn {
          background-color: #10b981;
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }

        .add-term-btn:hover {
          background-color: #059669;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider.checked {
          background-color: #10b981;
        }

        .slider-before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        .slider.checked .slider-before {
          transform: translateX(26px);
        }

        .date-button {
          color: #2563eb;
          margin-bottom: 10px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
          padding: 8px 0;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }

        .date-button:hover {
          color: #1d4ed8;
        }

        .calendar-container {
          margin-top: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .edit-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .textarea {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          background-color: #fff;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: border-color 0.2s;
          min-height: 300px;
          resize: vertical;
          width: 100%;
        }

        .textarea:focus {
          border-color: #2563eb;
          outline: none;
        }

        .text-content {
          white-space: pre-line;
          margin-bottom: 20px;
        }

        .text-content h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #1e293b;
        }

        .text-content p {
          font-size: 13px;
          color: #334155;
        }

        .edit-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .save-btn {
          background-color: #2563eb;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          width: 100%;
          margin-top: 20px;
          transition: all 0.2s;
        }

        .save-btn:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .save-btn:active {
          transform: translateY(0);
        }

        .save-btn.primary {
          background-color: #3b82f6;
        }

        .save-btn.success {
          background-color: #10b981;
        }

        .save-btn.error {
          background-color: #ef4444;
        }

        .save-mode {
          background-color: #1d4ed8;
          box-shadow: 0 4px 6px rgba(29, 78, 216, 0.3);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: #fff;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #1e293b;
          text-align: center;
        }

        .modal-text {
          font-size: 13px;
          margin-bottom: 20px;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
        }

        .modal-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        .modal-input:focus {
          border-color: #2563eb;
          outline: none;
        }

        .modal-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .modal-btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          flex: 1;
          transition: all 0.2s;
        }

        .modal-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .modal-btn:active {
          transform: translateY(0);
        }

        .modal-btn.cancel {
          background-color: #f1f5f9;
          color: #64748b;
        }

        .modal-btn.confirm {
          background-color: #2563eb;
          color: white;
        }

        .modal-btn.success {
          background-color: #10b981;
          color: white;
        }

        .modal-btn.error {
          background-color: #ef4444;
          color: white;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #001F3F;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .system-settings-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            display: flex;
            overflow-x: auto;
            padding-top: 0;
          }

          .sidebar-button {
            text-align: center;
            padding: 10px;
            white-space: nowrap;
          }

          .sidebar-button.active {
            border-radius: 0;
          }

          .content-area {
            padding: 15px;
          }

          .account-row {
            flex-direction: column;
          }

          .input-row {
            flex-wrap: wrap;
          }

          .input, .static-input {
            margin-left: 0;
            margin-top: 5px;
            width: 100%;
          }

          .funds-actions {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

const InputRow = ({ label, value, onChange, editable, suffix }) => (
  <div className="input-row">
    <label className="label">{label}</label>
    {editable ? (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          className="input" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
        {suffix && <span>{suffix}</span>}
      </div>
    ) : (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="static-text">{value}</span>
        {suffix && <span>{suffix}</span>}
      </div>
    )}
  </div>
);

export default SystemSettings;