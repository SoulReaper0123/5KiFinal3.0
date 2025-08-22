import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimes,
  FaEdit,
  FaSave
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '20px 25px 10px 25px',
    color: '#2D5783',
  },
  settingsSection: {
    backgroundColor: 'white',
    margin: '0 25px 20px 25px',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#2D5783',
  },
  inputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '10px 0',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '200px',
    outline: 'none',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
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
    transform: 'translateX(0px)',
  },
  sliderBeforeChecked: {
    transform: 'translateX(26px)',
  },
  editSaveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#2D5783',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    margin: '20px 0',
  },
  editSaveButtonSave: {
    backgroundColor: '#4CAF50',
  },
  tableContainer: {
    borderRadius: '8px',
    overflow: 'auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '800px'
  },
  tableHeader: {
    backgroundColor: '#2D5783',
    color: '#fff',
    height: '50px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  tableHeaderCell: {
    whiteSpace: 'nowrap'
  },
  tableRow: {
    height: '50px',
    '&:nth-child(even)': {
      backgroundColor: '#f5f5f5'
    },
    '&:nth-child(odd)': {
      backgroundColor: '#ddd'
    }
  },
  tableCell: {
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #ddd',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  viewText: {
    color: '#2D5783',
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
    '&:hover': {
      color: '#1a3d66'
    },
    outline: 'none',
    '&:focus': {
      outline: 'none'
    }
  },
  centeredModal: {
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
  modalCardSmall: {
    width: '250px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  confirmIcon: {
    marginBottom: '12px',
    fontSize: '32px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    color: '#333',
    lineHeight: '1.4'
  },
  actionButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    minWidth: '100px',
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#2D5783',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    color: 'grey',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px',
    outline: 'none',
    '&:focus': {
      outline: 'none',
      boxShadow: 'none'
    }
  },
  topControls: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0 25px',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  searchDownloadContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  searchBar: {
    display: 'flex',
    border: '1px solid #ccc',
    borderRadius: '25px',
    backgroundColor: '#fff',
    padding: '0 10px',
    alignItems: 'center',
    height: '40px',
    width: '250px',
  },
  searchInput: {
    height: '36px',
    width: '100%',
    fontSize: '16px',
    paddingLeft: '8px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
  },
  searchIcon: {
    padding: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
  },
  downloadIcon: {
    padding: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#2D5783',
  },
  uploadButton: {
    backgroundColor: '#2D5783',
    padding: '0 16px',
    borderRadius: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
    border: 'none',
    cursor: 'pointer',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  fileInput: {
    display: 'none',
  },
  dataContainer: {
    flex: 1,
    margin: '0 25px',
    marginTop: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  noMatchText: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '16px',
    color: '#666',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: '0 25px',
    marginTop: '10px',
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: '12px',
    marginRight: '10px',
    color: '#333',
  },
  paginationButton: {
    padding: '0',
    backgroundColor: '#2D5783',
    borderRadius: '5px',
    margin: '0 3px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

const DataMigration = () => {
  const [members, setMembers] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmMigrateVisible, setConfirmMigrateVisible] = useState(false);
  const [confirmSaveVisible, setConfirmSaveVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [statusList, setStatusList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  
  // Data Management Settings
  const [settings, setSettings] = useState({
    autoArchiving: false,
    archiveDays: 365,
    autoBackup: false,
    backupFrequency: 'weekly',
    dataRetentionDays: 1095, // 3 years
    exportFormat: 'xlsx',
    maxFileSize: 50, // MB
    compressionEnabled: true,
  });

  const pageSize = 10;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);

    // Load settings from Firebase
    loadSettings();
    loadMembers();

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const loadSettings = () => {
    const db = getDatabase();
    const settingsRef = ref(db, 'Settings/DataManagement');
    onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...settings, ...snapshot.val() });
      }
      setLoading(false);
    });
  };

  const loadMembers = () => {
    const db = getDatabase();
    const membersRef = ref(db, 'Members');
    onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const membersList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMembers(membersList);
        setFilteredData(membersList);
      }
    });
  };

  const handleSave = () => {
    setConfirmSaveVisible(true);
  };

  const confirmSave = async () => {
    setActionInProgress(true);
    try {
      const db = getDatabase();
      const settingsRef = ref(db, 'Settings/DataManagement');
      await update(settingsRef, settings);
      
      setConfirmSaveVisible(false);
      setEditMode(false);
      setSuccessMessage('Data management settings updated successfully!');
      setSuccessVisible(true);
    } catch (error) {
      setErrorMessage('Failed to update settings: ' + error.message);
      setErrorModalVisible(true);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key, checked) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredData(members);
      setNoMatch(false);
      return;
    }

    const filtered = members.filter(member =>
      member.firstName?.toLowerCase().includes(query.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(query.toLowerCase()) ||
      member.email?.toLowerCase().includes(query.toLowerCase()) ||
      member.id?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredData(filtered);
    setNoMatch(filtered.length === 0);
    setCurrentPage(0);
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Members Data');

      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Date Registered', key: 'dateRegistered', width: 20 },
      ];

      // Add data
      filteredData.forEach(member => {
        worksheet.addRow({
          id: member.id,
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          email: member.email || '',
          phone: member.phone || '',
          status: member.status || '',
          balance: member.balance || 0,
          dateRegistered: member.dateRegistered || '',
        });
      });

      // Style the header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D5783' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `members_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('Failed to export data: ' + error.message);
      setErrorModalVisible(true);
    }
  };

  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Data Management</h1>

      {/* Settings Section */}
      <div style={styles.settingsSection}>
        <h2 style={styles.sectionTitle}>Data Management Settings</h2>
        
        {/* Auto Archiving */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Enable Auto Archiving</label>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.autoArchiving}
              onChange={(e) => handleToggleChange('autoArchiving', e.target.checked)}
              disabled={!editMode}
              style={styles.switchInput}
            />
            <span style={{
              ...styles.slider,
              ...(settings.autoArchiving ? styles.sliderChecked : {})
            }}>
              <span style={{
                ...styles.sliderBefore,
                ...(settings.autoArchiving ? styles.sliderBeforeChecked : {})
              }}></span>
            </span>
          </label>
        </div>

        {/* Archive Days */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Archive After (Days)</label>
          <input
            type="number"
            value={settings.archiveDays}
            onChange={(e) => handleInputChange('archiveDays', parseInt(e.target.value) || 365)}
            disabled={!editMode}
            style={{
              ...styles.input,
              ...(editMode ? {} : styles.inputDisabled)
            }}
          />
        </div>

        {/* Auto Backup */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Enable Auto Backup</label>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => handleToggleChange('autoBackup', e.target.checked)}
              disabled={!editMode}
              style={styles.switchInput}
            />
            <span style={{
              ...styles.slider,
              ...(settings.autoBackup ? styles.sliderChecked : {})
            }}>
              <span style={{
                ...styles.sliderBefore,
                ...(settings.autoBackup ? styles.sliderBeforeChecked : {})
              }}></span>
            </span>
          </label>
        </div>

        {/* Backup Frequency */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Backup Frequency</label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
            disabled={!editMode}
            style={{
              ...styles.input,
              ...(editMode ? {} : styles.inputDisabled)
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Data Retention */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Data Retention (Days)</label>
          <input
            type="number"
            value={settings.dataRetentionDays}
            onChange={(e) => handleInputChange('dataRetentionDays', parseInt(e.target.value) || 1095)}
            disabled={!editMode}
            style={{
              ...styles.input,
              ...(editMode ? {} : styles.inputDisabled)
            }}
          />
        </div>

        {/* Compression */}
        <div style={styles.inputRow}>
          <label style={styles.label}>Enable Compression</label>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={settings.compressionEnabled}
              onChange={(e) => handleToggleChange('compressionEnabled', e.target.checked)}
              disabled={!editMode}
              style={styles.switchInput}
            />
            <span style={{
              ...styles.slider,
              ...(settings.compressionEnabled ? styles.sliderChecked : {})
            }}>
              <span style={{
                ...styles.sliderBefore,
                ...(settings.compressionEnabled ? styles.sliderBeforeChecked : {})
              }}></span>
            </span>
          </label>
        </div>

        {/* Edit/Save Button */}
        <button 
          style={{
            ...styles.editSaveButton,
            ...(editMode ? styles.editSaveButtonSave : {})
          }}
          onClick={editMode ? handleSave : () => setEditMode(true)}
        >
          {editMode ? <FaSave /> : <FaEdit />}
          {editMode ? 'Save Settings' : 'Edit Settings'}
        </button>
      </div>

      {/* Search and Controls */}
      <div style={styles.topControls}>
        <div style={styles.searchDownloadContainer}>
          <div style={styles.searchBar}>
            <input
              style={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <button style={styles.searchIcon}>
              <FaSearch />
            </button>
          </div>
          <button style={styles.downloadIcon} onClick={exportToExcel}>
            <FaDownload size={20} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div style={styles.dataContainer}>
        {noMatch ? (
          <div style={styles.noMatchText}>No matching records found</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>ID</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Email</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Balance</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((member, index) => (
                  <tr key={member.id} style={{
                    ...styles.tableRow,
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#fff'
                  }}>
                    <td style={styles.tableCell}>{member.id}</td>
                    <td style={styles.tableCell}>
                      {`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                    </td>
                    <td style={styles.tableCell}>{member.email || ''}</td>
                    <td style={styles.tableCell}>{member.status || ''}</td>
                    <td style={styles.tableCell}>₱{(member.balance || 0).toLocaleString()}</td>
                    <td style={styles.tableCell}>
                      <span 
                        style={styles.viewText}
                        onClick={() => {
                          setSelectedMember(member);
                          setMemberModalVisible(true);
                        }}
                      >
                        View
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!noMatch && totalPages > 1 && (
        <div style={styles.paginationContainer}>
          <span style={styles.paginationInfo}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            style={{
              ...styles.paginationButton,
              ...(currentPage === 0 ? styles.disabledButton : {})
            }}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <FaChevronLeft />
          </button>
          <button
            style={{
              ...styles.paginationButton,
              ...(currentPage >= totalPages - 1 ? styles.disabledButton : {})
            }}
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {confirmSaveVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to save these data management settings?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={confirmSave}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Saving...' : 'Yes'}
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
                }} 
                onClick={() => setConfirmSaveVisible(false)}
                disabled={actionInProgress}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={handleSuccessOk}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }} 
              onClick={() => setErrorModalVisible(false)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <div style={styles.centeredModal}>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default DataMigration;