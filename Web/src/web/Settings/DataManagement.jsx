import React, { useState, useEffect } from 'react';
import { FaDownload, FaTrashAlt, FaUndo } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';

const DataManagement = () => {
  const [activeSection, setActiveSection] = useState('archiving');
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveInterval, setArchiveInterval] = useState(0);
  const [lastArchiveDate, setLastArchiveDate] = useState(null);
  const [archivedData, setArchivedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch settings and archived data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        
        const settingsRef = database.ref('Settings/DataArchiving');
        const archiveRef = database.ref('ArchivedData');
        
        const [settingsSnap, archiveSnap] = await Promise.all([
          settingsRef.once('value'),
          archiveRef.once('value')
        ]);

        if (settingsSnap.exists()) {
          const settings = settingsSnap.val();
          setAutoArchive(settings.autoArchive || false);
          setArchiveInterval(settings.archiveInterval || 0);
          setLastArchiveDate(settings.lastArchiveDate || null);
        }

        if (archiveSnap.exists()) {
          const archiveData = [];
          archiveSnap.forEach(childSnap => {
            const data = childSnap.val();
            archiveData.push({
              id: childSnap.key,
              type: data.type || 'Full Archive',
              date: data.date || '',
              status: data.status || 'Archived',
              counts: data.counts || {}
            });
          });
          setArchivedData(archiveData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if we need to perform auto-archiving
  useEffect(() => {
    if (!autoArchive || archiveInterval <= 0) return;

    const checkAutoArchive = async () => {
      const now = new Date();
      let shouldArchive = false;

      if (!lastArchiveDate) {
        shouldArchive = true;
      } else {
        const lastDate = new Date(lastArchiveDate);
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        shouldArchive = daysDiff >= archiveInterval;
      }

      if (shouldArchive) {
        await performAutoArchive();
      }
    };

    checkAutoArchive();
  }, [autoArchive, archiveInterval, lastArchiveDate]);

  const performAutoArchive = async () => {
    try {
      setLoading(true);
      
      // Fetch approved data from different sections
      const [depositsSnap, loansSnap, registrationsSnap] = await Promise.all([
        database.ref('Deposits/ApprovedDeposits').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Registrations/ApprovedRegistrations').once('value')
      ]);

      // Process data for archiving
      const archiveDate = new Date().toISOString();
      const archiveTimestamp = Date.now();
      
      const depositsData = depositsSnap.exists() ? depositsSnap.val() : {};
      const loansData = loansSnap.exists() ? loansSnap.val() : {};
      const registrationsData = registrationsSnap.exists() ? registrationsSnap.val() : {};

      // Prepare archive records
      const archiveRecords = {
        deposits: {
          data: depositsData,
          count: Object.keys(depositsData).length,
          type: 'deposits'
        },
        loans: {
          data: loansData,
          count: Object.keys(loansData).length,
          type: 'loans'
        },
        registrations: {
          data: registrationsData,
          count: Object.keys(registrationsData).length,
          type: 'registrations'
        }
      };

      // Save archive record to database
      const archiveRef = database.ref('ArchivedData').push();
      await archiveRef.set({
        date: archiveDate,
        counts: {
          deposits: archiveRecords.deposits.count,
          loans: archiveRecords.loans.count,
          registrations: archiveRecords.registrations.count
        },
        status: 'archived'
      });

      // Generate and download Excel files
      await generateExcelFiles(archiveRecords, archiveTimestamp);

      // Update last archive date
      const settingsRef = database.ref('Settings/DataArchiving');
      await settingsRef.update({
        lastArchiveDate: archiveDate
      });
      setLastArchiveDate(archiveDate);

      // Add to local archived data
      setArchivedData(prev => [{
        id: archiveRef.key,
        date: archiveDate,
        type: 'Full Archive',
        status: 'Archived',
        counts: archiveRecords.counts
      }, ...prev]);

      setLoading(false);
    } catch (error) {
      console.error('Error during auto-archive:', error);
      setLoading(false);
    }
  };

  const generateExcelFiles = async (archiveRecords, timestamp) => {
    try {
      for (const [key, record] of Object.entries(archiveRecords)) {
        if (record.count === 0) continue;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(key);
        
        // Add headers
        const headers = Object.keys(record.data[Object.keys(record.data)[0]]);
        worksheet.addRow(headers);

        // Add data rows
        Object.values(record.data).forEach(item => {
          const row = headers.map(header => item[header]);
          worksheet.addRow(row);
        });

        // Generate file and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${key}_archive_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating Excel files:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = database.ref('Settings/DataArchiving');
      
      await settingsRef.set({
        autoArchive,
        archiveInterval: parseInt(archiveInterval),
        lastArchiveDate
      });

      // If interval is 0, perform immediate archive
      if (archiveInterval === 0) {
        await performAutoArchive();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setLoading(false);
    }
  };

  const handleDeleteArchive = async (id) => {
    try {
      await database.ref(`ArchivedData/${id}`).remove();
      setArchivedData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting archive:', error);
    }
  };

  const filteredArchives = archivedData.filter(item => {
    const type = item.type?.toLowerCase() || '';
    const date = item.date?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return type.includes(query) || date.includes(query);
  });

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorHeading}>Error loading data</h2>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'archiving' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('archiving')}
        >
          <span style={styles.sidebarButtonText}>Data Archiving</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'archived' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => setActiveSection('archived')}
        >
          <span style={styles.sidebarButtonText}>Archived Data</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.contentArea}>
        {activeSection === 'archiving' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Data Archiving</h2>

            <div style={styles.formRow}>
              <label style={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={autoArchive} 
                  onChange={(e) => setAutoArchive(e.target.checked)} 
                  style={styles.switchInput}
                />
                <span style={{
                  ...styles.slider,
                  ...(autoArchive ? styles.sliderChecked : {})
                }}>
                  <span style={styles.sliderBefore}></span>
                </span>
              </label>
              <span style={styles.label}>Enable Automatic Archiving</span>
            </div>

            <div style={styles.formRow}>
              <span style={styles.label}>Archive Every</span>
              <input
                type="number"
                placeholder="Days"
                style={styles.input}
                value={archiveInterval}
                onChange={(e) => setArchiveInterval(e.target.value)}
                min="0"
              />
              <span style={styles.label}>days (0 = archive now)</span>
            </div>

            {lastArchiveDate && (
              <div style={styles.formRow}>
                <span style={styles.label}>Last Archive:</span>
                <span style={styles.label}>
                  {new Date(lastArchiveDate).toLocaleString()}
                </span>
              </div>
            )}

            <button 
              style={styles.saveButton}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              <span style={styles.saveButtonText}>
                {loading ? 'Processing...' : 'Save Settings'}
              </span>
            </button>
          </div>
        )}

        {activeSection === 'archived' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Archived Data</h2>

            <div style={styles.searchRow}>
              <input 
                type="text" 
                placeholder="Search archives..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                style={styles.exportButton}
                onClick={() => {
                  // Export list of archives
                  const workbook = new ExcelJS.Workbook();
                  const worksheet = workbook.addWorksheet('Archive_List');
                  
                  worksheet.addRow(['Archive ID', 'Date', 'Type', 'Status', 'Deposits', 'Loans', 'Registrations']);
                  
                  archivedData.forEach(item => {
                    worksheet.addRow([
                      item.id,
                      item.date,
                      item.type,
                      item.status,
                      item.counts?.deposits || 0,
                      item.counts?.loans || 0,
                      item.counts?.registrations || 0
                    ]);
                  });

                  workbook.xlsx.writeBuffer().then(buffer => {
                    const blob = new Blob([buffer], { 
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `archive_list_${Date.now()}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  });
                }}
              >
                <FaDownload style={styles.exportIcon} />
              </button>
            </div>

            <div style={styles.tableHeader}>
              <span style={styles.tableHeaderText}>Data type</span>
              <span style={styles.tableHeaderText}>Date Archived</span>
              <span style={styles.tableHeaderText}>Status</span>
              <span style={styles.tableHeaderText}>Counts</span>
              <span style={styles.tableHeaderText}>Actions</span>
            </div>

            {filteredArchives.length === 0 ? (
              <div style={styles.noDataMessage}>No archived data found</div>
            ) : (
              filteredArchives.map(item => (
                <div key={item.id} style={styles.tableRow}>
                  <span style={styles.tableCell}>{item.type || 'Full Archive'}</span>
                  <span style={styles.tableCell}>
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span style={{...styles.tableCell, ...styles.archivedStatus}}>{item.status}</span>
                  <span style={styles.tableCell}>
                    {item.counts ? (
                      `D:${item.counts.deposits || 0} L:${item.counts.loans || 0} R:${item.counts.registrations || 0}`
                    ) : 'N/A'}
                  </span>
                  <div style={styles.actions}>
                    <button 
                      style={styles.restoreButton}
                      onClick={() => {
                        // Implement restore functionality if needed
                        console.log('Restore archive:', item.id);
                      }}
                    >
                      <FaUndo style={styles.actionIcon} />
                    </button>
                    <button 
                      style={styles.deleteButton}
                      onClick={() => handleDeleteArchive(item.id)}
                    >
                      <FaTrashAlt style={styles.actionIcon} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRight: '1px solid #e0e0e0',
    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
  },
  sidebarButton: {
    display: 'block',
    width: '100%',
    padding: '12px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  sidebarButtonActive: {
    backgroundColor: '#f0f7ff',
    color: '#2D5783',
    fontWeight: '500',
    borderLeft: '3px solid #2D5783',
  },
  sidebarButtonText: {
    fontSize: '14px',
  },
  contentArea: {
    flex: 1,
    padding: '30px',
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#2D5783',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
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
  label: {
    fontSize: '14px',
    color: '#555',
    marginLeft: '10px',
  },
  input: {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '80px',
    marginLeft: '10px',
    transition: 'border-color 0.2s',
  },
  saveButton: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '20px',
    transition: 'all 0.2s',
  },
  saveButtonText: {
    color: 'white',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  searchInput: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
  },
  exportButton: {
    marginLeft: '10px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  exportIcon: {
    fontSize: '16px',
    color: '#555',
  },
  tableHeader: {
    display: 'flex',
    marginBottom: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    fontWeight: '600',
  },
  tableHeaderText: {
    fontSize: '14px',
    flex: 1,
    color: '#333',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  tableCell: {
    fontSize: '14px',
    flex: 1,
    color: '#333',
  },
  archivedStatus: {
    color: '#28a745',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    gap: '8px',
  },
  restoreButton: {
    backgroundColor: '#17a2b8',
    padding: '8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: '8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: 'white',
    fontSize: '14px',
  },
  noDataMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#6c757d',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center',
  },
  errorHeading: {
    fontSize: '18px',
    color: '#dc3545',
    marginBottom: '10px',
  },
  errorText: {
    fontSize: '14px',
    color: '#6c757d',
    marginBottom: '20px',
  },
  retryButton: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
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

export default DataManagement;