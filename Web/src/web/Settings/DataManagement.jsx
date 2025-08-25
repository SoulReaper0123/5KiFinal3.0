import React, { useState, useEffect } from 'react';
import { FaDownload, FaTrashAlt, FaUndo, FaCheckCircle, FaTimes } from 'react-icons/fa';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
      
      // Fetch both approved and pending data from different sections, plus members
      const [
        approvedDepositsSnap, 
        pendingDepositsSnap,
        approvedLoansSnap, 
        pendingLoansSnap,
        approvedRegistrationsSnap, 
        pendingRegistrationsSnap,
        approvedPaymentsSnap,
        pendingPaymentsSnap,
        approvedWithdrawalsSnap,
        pendingWithdrawalsSnap,
        membersSnap
      ] = await Promise.all([
        database.ref('Deposits/ApprovedDeposits').once('value'),
        database.ref('Deposits/PendingDeposits').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Loans/PendingLoans').once('value'),
        database.ref('Registrations/ApprovedRegistrations').once('value'),
        database.ref('Registrations/PendingRegistrations').once('value'),
        database.ref('Payments/ApprovedPayments').once('value'),
        database.ref('Payments/PendingPayments').once('value'),
        database.ref('Withdrawals/ApprovedWithdrawals').once('value'),
        database.ref('Withdrawals/PendingWithdrawals').once('value'),
        database.ref('Members').once('value')
      ]);

      // Process data for archiving
      const archiveDate = new Date().toISOString();
      const archiveTimestamp = Date.now();
      
      // Extract data from snapshots
      const approvedDepositsData = approvedDepositsSnap.exists() ? approvedDepositsSnap.val() : {};
      const pendingDepositsData = pendingDepositsSnap.exists() ? pendingDepositsSnap.val() : {};
      const approvedLoansData = approvedLoansSnap.exists() ? approvedLoansSnap.val() : {};
      const pendingLoansData = pendingLoansSnap.exists() ? pendingLoansSnap.val() : {};
      const approvedRegistrationsData = approvedRegistrationsSnap.exists() ? approvedRegistrationsSnap.val() : {};
      const pendingRegistrationsData = pendingRegistrationsSnap.exists() ? pendingRegistrationsSnap.val() : {};
      const approvedPaymentsData = approvedPaymentsSnap.exists() ? approvedPaymentsSnap.val() : {};
      const pendingPaymentsData = pendingPaymentsSnap.exists() ? pendingPaymentsSnap.val() : {};
      const approvedWithdrawalsData = approvedWithdrawalsSnap.exists() ? approvedWithdrawalsSnap.val() : {};
      const pendingWithdrawalsData = pendingWithdrawalsSnap.exists() ? pendingWithdrawalsSnap.val() : {};
      const membersData = membersSnap.exists() ? membersSnap.val() : {};

      // Prepare archive records
      const archiveRecords = {
        approvedDeposits: {
          data: approvedDepositsData,
          count: Object.keys(approvedDepositsData).length,
          type: 'approved deposits'
        },
        pendingDeposits: {
          data: pendingDepositsData,
          count: Object.keys(pendingDepositsData).length,
          type: 'pending deposits'
        },
        approvedLoans: {
          data: approvedLoansData,
          count: Object.keys(approvedLoansData).length,
          type: 'approved loans'
        },
        pendingLoans: {
          data: pendingLoansData,
          count: Object.keys(pendingLoansData).length,
          type: 'pending loans'
        },
        approvedRegistrations: {
          data: approvedRegistrationsData,
          count: Object.keys(approvedRegistrationsData).length,
          type: 'approved registrations'
        },
        pendingRegistrations: {
          data: pendingRegistrationsData,
          count: Object.keys(pendingRegistrationsData).length,
          type: 'pending registrations'
        },
        approvedPayments: {
          data: approvedPaymentsData,
          count: Object.keys(approvedPaymentsData).length,
          type: 'approved payments'
        },
        pendingPayments: {
          data: pendingPaymentsData,
          count: Object.keys(pendingPaymentsData).length,
          type: 'pending payments'
        },
        approvedWithdrawals: {
          data: approvedWithdrawalsData,
          count: Object.keys(approvedWithdrawalsData).length,
          type: 'approved withdrawals'
        },
        pendingWithdrawals: {
          data: pendingWithdrawalsData,
          count: Object.keys(pendingWithdrawalsData).length,
          type: 'pending withdrawals'
        },
        members: {
          data: membersData,
          count: Object.keys(membersData).length,
          type: 'members'
        }
      };

      // Save archive record to database
      const archiveRef = database.ref('ArchivedData').push();
      await archiveRef.set({
        date: archiveDate,
        counts: {
          approvedDeposits: archiveRecords.approvedDeposits.count,
          pendingDeposits: archiveRecords.pendingDeposits.count,
          approvedLoans: archiveRecords.approvedLoans.count,
          pendingLoans: archiveRecords.pendingLoans.count,
          approvedRegistrations: archiveRecords.approvedRegistrations.count,
          pendingRegistrations: archiveRecords.pendingRegistrations.count,
          approvedPayments: archiveRecords.approvedPayments.count,
          pendingPayments: archiveRecords.pendingPayments.count,
          approvedWithdrawals: archiveRecords.approvedWithdrawals.count,
          pendingWithdrawals: archiveRecords.pendingWithdrawals.count,
          members: archiveRecords.members.count
        },
        status: 'archived'
      });

      // Generate and download a single Excel file with multiple sheets
      await generateExcelFile(archiveRecords, archiveTimestamp);

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
        counts: {
          approvedDeposits: archiveRecords.approvedDeposits.count,
          pendingDeposits: archiveRecords.pendingDeposits.count,
          approvedLoans: archiveRecords.approvedLoans.count,
          pendingLoans: archiveRecords.pendingLoans.count,
          approvedRegistrations: archiveRecords.approvedRegistrations.count,
          pendingRegistrations: archiveRecords.pendingRegistrations.count,
          approvedPayments: archiveRecords.approvedPayments.count,
          pendingPayments: archiveRecords.pendingPayments.count,
          approvedWithdrawals: archiveRecords.approvedWithdrawals.count,
          pendingWithdrawals: archiveRecords.pendingWithdrawals.count,
          members: archiveRecords.members.count
        }
      }, ...prev]);

      setLoading(false);
    } catch (error) {
      console.error('Error during auto-archive:', error);
      setLoading(false);
    }
  };

  const generateExcelFile = async (archiveRecords, timestamp) => {
    try {
      // Create a single workbook with multiple sheets
      const workbook = new ExcelJS.Workbook();
      
      // Add a summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.addRow(['Data Type', 'Record Count']);
      
      // Process each data type and add as a separate sheet
      for (const [key, record] of Object.entries(archiveRecords)) {
        // Add to summary
        summarySheet.addRow([
          record.type.charAt(0).toUpperCase() + record.type.slice(1), 
          record.count
        ]);
        
        // Skip empty data sets
        if (record.count === 0) continue;
        
        // Create a worksheet for this data type
        const sheetName = key.charAt(0).toUpperCase() + key.slice(1);
        const worksheet = workbook.addWorksheet(sheetName);
        
        // Get the first record to extract headers
        const firstRecord = record.data[Object.keys(record.data)[0]];
        
        if (firstRecord) {
          // Add headers
          const headers = Object.keys(firstRecord);
          worksheet.addRow(headers);
          
          // Add data rows
          Object.values(record.data).forEach(item => {
            const row = headers.map(header => item[header]);
            worksheet.addRow(row);
          });
          
          // Format the worksheet - safely
          worksheet.columns.forEach(column => {
            if (column && column.key) {
              const columnValues = worksheet.getColumn(column.key).values || [];
              if (columnValues.length > 0) {
                column.width = Math.max(
                  15,
                  ...columnValues
                    .filter(value => value !== null && value !== undefined)
                    .map(value => String(value).length)
                );
              } else {
                column.width = 15; // Default width if no values
              }
            }
          });
        } else {
          worksheet.addRow(['No data available']);
        }
      }
      
      // Format the summary sheet - safely
      summarySheet.columns.forEach(column => {
        if (column) {
          column.width = 20;
        }
      });
      
      // Generate file and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full_archive_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Excel file:', error);
    }
  };

  const handleSaveSettings = async () => {
    // Show confirmation modal instead of immediately saving
    setShowConfirmModal(true);
  };

  const confirmSaveSettings = async () => {
    try {
      setShowConfirmModal(false);
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
        setSuccessMessage('Settings saved and data archived successfully!');
      } else {
        setSuccessMessage('Settings saved successfully!');
      }

      setIsError(false);
      setShowSuccessModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSuccessMessage('Error saving settings: ' + error.message);
      setIsError(true);
      setShowSuccessModal(true);
      setLoading(false);
    }
  };

  const handleDeleteArchive = async (id) => {
    try {
      await database.ref(`ArchivedData/${id}`).remove();
      setArchivedData(prev => prev.filter(item => item.id !== id));
      setSuccessMessage('Archive deleted successfully!');
      setIsError(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting archive:', error);
      setSuccessMessage('Error deleting archive: ' + error.message);
      setIsError(true);
      setShowSuccessModal(true);
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
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Confirm Action</h3>
            <p style={styles.modalText}>
              {archiveInterval === 0 
                ? 'This will save your settings and immediately archive your data. Continue?' 
                : 'Save these archiving settings?'}
            </p>
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmButton}
                onClick={confirmSaveSettings}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            {isError ? (
              <FaTimes style={{ ...styles.confirmIcon, color: '#f44336' }} />
            ) : (
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#4CAF50' }} />
            )}
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#2D5783',
                color: '#fff'
              }}
              onClick={() => setShowSuccessModal(false)}
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              OK
            </button>
          </div>
        </div>
      )}

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
                  
                  worksheet.addRow([
                    'Archive ID', 
                    'Date', 
                    'Type', 
                    'Status', 
                    'Approved Deposits', 
                    'Pending Deposits',
                    'Approved Loans', 
                    'Pending Loans',
                    'Approved Registrations', 
                    'Pending Registrations',
                    'Approved Payments',
                    'Pending Payments',
                    'Approved Withdrawals',
                    'Pending Withdrawals',
                    'Members'
                  ]);
                  
                  archivedData.forEach(item => {
                    // Handle both old and new data structures
                    const hasOldStructure = item.counts?.deposits !== undefined;
                    
                    worksheet.addRow([
                      item.id,
                      item.date,
                      item.type,
                      item.status,
                      hasOldStructure ? item.counts?.deposits || 0 : item.counts?.approvedDeposits || 0,
                      hasOldStructure ? 0 : item.counts?.pendingDeposits || 0,
                      hasOldStructure ? item.counts?.loans || 0 : item.counts?.approvedLoans || 0,
                      hasOldStructure ? 0 : item.counts?.pendingLoans || 0,
                      hasOldStructure ? item.counts?.registrations || 0 : item.counts?.approvedRegistrations || 0,
                      hasOldStructure ? 0 : item.counts?.pendingRegistrations || 0,
                      hasOldStructure ? 0 : item.counts?.approvedPayments || 0,
                      hasOldStructure ? 0 : item.counts?.pendingPayments || 0,
                      hasOldStructure ? 0 : item.counts?.approvedWithdrawals || 0,
                      hasOldStructure ? 0 : item.counts?.pendingWithdrawals || 0,
                      item.counts?.members || 0
                    ]);
                  });
                  
                  // Format the worksheet - safely
                  worksheet.columns.forEach(column => {
                    if (column && column.key) {
                      const columnValues = worksheet.getColumn(column.key).values || [];
                      if (columnValues.length > 0) {
                        column.width = Math.max(
                          15,
                          ...columnValues
                            .filter(value => value !== null && value !== undefined)
                            .map(value => String(value).length)
                        );
                      } else {
                        column.width = 15; // Default width if no values
                      }
                    }
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
                      <>
                        <div>Deposits: {
                          // Handle both old and new data structure
                          item.counts.deposits !== undefined ? 
                            item.counts.deposits : 
                            (item.counts.approvedDeposits || 0) + (item.counts.pendingDeposits || 0)
                        }</div>
                        <div>Loans: {
                          item.counts.loans !== undefined ? 
                            item.counts.loans : 
                            (item.counts.approvedLoans || 0) + (item.counts.pendingLoans || 0)
                        }</div>
                        <div>Registrations: {
                          item.counts.registrations !== undefined ? 
                            item.counts.registrations : 
                            (item.counts.approvedRegistrations || 0) + (item.counts.pendingRegistrations || 0)
                        }</div>
                        <div>Payments: {
                          (item.counts.approvedPayments || 0) + (item.counts.pendingPayments || 0)
                        }</div>
                        <div>Withdrawals: {
                          (item.counts.approvedWithdrawals || 0) + (item.counts.pendingWithdrawals || 0)
                        }</div>
                        <div>Members: {item.counts.members || 0}</div>
                      </>
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2D5783',
  },
  modalText: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  confirmButton: {
    backgroundColor: '#2D5783',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
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
    outline: 'none'
  },
};

export default DataManagement;