import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrashAlt } from 'react-icons/fa';

const styles = {
  container: {
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    padding: '20px'
  },
  contentContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    fontSize: '26px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#1f2937'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#374151'
  },
  inputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '10px'
  },
  label: {
    flex: 1,
    fontSize: '16px',
    color: '#111827'
  },
  input: {
    flex: 1,
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '16px',
    backgroundColor: '#fff'
  },
  miniInput: {
    width: '80px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '6px',
    fontSize: '16px'
  },
  staticText: {
    fontSize: '16px',
    color: '#374151'
  },
  rateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  termText: {
    fontSize: '16px',
    color: '#111827'
  },
  editRateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  deleteTermBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '16px'
  },
  addTermBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '20px',
    marginBottom: '30px'
  },
  saveMode: {
    backgroundColor: '#3b82f6'
  },
  dateButton: {
    color: '#3b82f6',
    marginBottom: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    textAlign: 'left',
    padding: 0
  },
  calendarContainer: {
    marginTop: '10px'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '60px',
    height: '34px'
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s'
  },
  sliderBefore: {
    position: 'absolute',
    content: '""',
    height: '26px',
    width: '26px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s'
  },
  sliderRound: {
    borderRadius: '34px'
  },
  sliderRoundBefore: {
    borderRadius: '50%'
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
    borderRadius: '10px',
    width: '85%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  modalText: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#111827'
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  modalBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  loading: {
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '18px',
    color: '#6b7280'
  }
};

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    LoanPercentage: '',
    Funds: '',
    InterestRate: {},
    AdvancedPayments: false,
    DividendDate: '',
    PenaltyValue: '',
    PenaltyType: 'percentage',
  });

  const [newTerm, setNewTerm] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);

  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [termToDelete, setTermToDelete] = useState('');

  const db = getDatabase();

  useEffect(() => {
    const settingsRef = ref(db, 'Settings/');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          LoanPercentage: data.LoanPercentage?.toString() || '',
          Funds: data.Funds?.toString() || '',
          InterestRate: Object.fromEntries(
            Object.entries(data.InterestRate || {}).map(([key, val]) => [key, val.toString()])
          ),
          AdvancedPayments: data.AdvancedPayments || false,
          DividendDate: data.DividendDate || '',
          PenaltyValue: data.PenaltyValue?.toString() || '',
          PenaltyType: data.PenaltyType || 'percentage',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const confirmAddTerm = () => {
    if (!newTerm || !newRate) {
      alert('Error: Please enter both term and interest rate.');
      return;
    }
    if (settings.InterestRate[newTerm]) {
      alert('Error: This term already exists.');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      InterestRate: { ...prev.InterestRate, [newTerm]: newRate },
    }));
    setNewTerm('');
    setNewRate('');
    setAddModalVisible(false);
  };

  const requestAddTerm = () => {
    if (!newTerm || !newRate) {
      alert('Error: Please enter both term and rate.');
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
      InterestRate: parsedInterest,
      AdvancedPayments: settings.AdvancedPayments,
      DividendDate: settings.DividendDate,
      PenaltyValue: parseFloat(settings.PenaltyValue),
      PenaltyType: settings.PenaltyType,
    };

    update(settingsRef, updatedData)
      .then(() => {
        alert('Success: Settings updated successfully!');
        setEditMode(false);
      })
      .catch((error) => {
        alert('Error: ' + error.message);
      });

    setConfirmationModalVisible(false);
  };

  const handleDateChange = (date) => {
    setSettings({ ...settings, DividendDate: date.toISOString().split('T')[0] });
    setShowCalendar(false);
  };

  if (loading) return <div style={styles.loading}>Loading settings...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <h1 style={styles.header}>System Settings</h1>

        {/* Loan Fields */}
        <div style={styles.card}>
          <InputRow
            label="Loanable Amount Percentage"
            value={settings.LoanPercentage}
            onChange={(text) => handleInputChange('LoanPercentage', text)}
            editable={editMode}
          />
          <InputRow
            label="Available Funds (₱)"
            value={settings.Funds}
            onChange={(text) => handleInputChange('Funds', text)}
            editable={editMode}
          />
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
                Add
              </button>
            </div>
          )}
        </div>

        {/* Advanced Payments & Penalty */}
        <div style={styles.card}>
          <div style={styles.inputRow}>
            <label style={styles.label}>Advanced Payments</label>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={settings.AdvancedPayments}
                onChange={(e) => setSettings({ ...settings, AdvancedPayments: e.target.checked })}
                disabled={!editMode}
              />
              <span style={{ ...styles.slider, ...styles.sliderRound }}></span>
            </label>
          </div>
          <InputRow
            label="Penalty Value"
            value={settings.PenaltyValue}
            onChange={(text) => handleInputChange('PenaltyValue', text)}
            editable={editMode}
          />
        </div>

        {/* Dividend Date */}
        <div style={styles.card}>
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
                : ''}
            </span>
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
              <p style={styles.modalText}>Are you sure you want to save changes?</p>
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
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Interest Term Modal */}
        {addModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
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
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Interest Term Modal */}
        {deleteModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>Delete term "{termToDelete}"?</p>
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
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InputRow = ({ label, value, onChange, editable }) => (
  <div style={styles.inputRow}>
    <label style={styles.label}>{label}</label>
    {editable ? (
      <input 
        style={styles.input} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        type="number" 
      />
    ) : (
      <span style={styles.staticText}>{value}</span>
    )}
  </div>
);

export default SystemSettings;