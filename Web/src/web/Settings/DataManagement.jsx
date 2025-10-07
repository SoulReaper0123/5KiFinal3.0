import React, { useState, useEffect } from 'react';
import { FaDownload, FaTrashAlt, FaCheckCircle, FaTimes, FaEdit, FaSave, FaArchive, FaDatabase, FaHistory, FaFileExport } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';

const DataManagement = () => {
  const [activeSection, setActiveSection] = useState('archiving');

  // Handle section change and reset edit mode
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setEditMode(false); // Reset edit mode when switching sections
  };
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveInterval, setArchiveInterval] = useState(0);
  const [lastArchiveDate, setLastArchiveDate] = useState(null);
  const [archivedData, setArchivedData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

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

  const handleSave = () => setConfirmationModalVisible(true);

  const confirmSave = async () => {
    setActionInProgress(true);
    try {
      const settingsRef = database.ref('Settings/DataArchiving');
      
      await settingsRef.set({
        autoArchive,
        archiveInterval: parseInt(archiveInterval),
        lastArchiveDate
      });

      // If auto archive is enabled and interval is 0, perform immediate archive
      if (autoArchive && archiveInterval === 0) {
        await performAutoArchive();
        setSuccessMessage('Settings saved and data archived successfully!');
      } else {
        setSuccessMessage('Settings saved successfully!');
      }

      setEditMode(false);
      setConfirmationModalVisible(false);
      setIsError(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSuccessMessage('Error saving settings: ' + error.message);
      setIsError(true);
      setShowSuccessModal(true);
    } finally {
      setActionInProgress(false);
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

      {/* Save Confirmation Modal */}
      {confirmationModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>Are you sure you want to save these settings changes?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#1e3a8a',
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
                  backgroundColor: '#6c757d',
                  color: '#fff'
                }}
                onClick={() => setConfirmationModalVisible(false)}
                disabled={actionInProgress}
              >
                Cancel
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
              <FaTimes style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            ) : (
              <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
            )}
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{
                ...styles.actionButton,
                backgroundColor: '#1e3a8a',
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

      {/* Enhanced Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Data Management</h3>
        </div>
        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'archiving' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => handleSectionChange('archiving')}
        >
          <FaArchive style={styles.sidebarIcon} />
          <span style={styles.sidebarButtonText}>Data Archiving</span>
        </button>

        <button
          style={{
            ...styles.sidebarButton,
            ...(activeSection === 'archived' ? styles.sidebarButtonActive : {})
          }}
          onClick={() => handleSectionChange('archived')}
        >
          <FaHistory style={styles.sidebarIcon} />
          <span style={styles.sidebarButtonText}>Archived Data</span>
        </button>
      </div>

      {/* Enhanced Main Content Area */}
      <div style={styles.contentArea}>
        <div style={styles.contentHeader}>
          <h2 style={styles.contentTitle}>
            {activeSection === 'archiving' && 'Data Archiving Configuration'}
            {activeSection === 'archived' && 'Archived Data Management'}
          </h2>
          <div style={styles.contentSubtitle}>
            {activeSection === 'archiving' && 'Configure automatic data archiving schedules and settings'}
            {activeSection === 'archived' && 'Manage and export previously archived financial data'}
          </div>
        </div>

        {/* Enhanced Data Archiving Section */}
        {activeSection === 'archiving' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaDatabase style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Archiving Configuration</h3>
                </div>
              </div>

              <div style={styles.cardContent}>
                <div style={styles.configItem}>
                  <div style={styles.configLabel}>
                    <span style={styles.configLabelText}>Enable Automatic Archiving</span>
                    <span style={styles.configLabelDescription}>
                      Automatically archive financial data at regular intervals
                    </span>
                  </div>
                  <label style={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={autoArchive} 
                      onChange={(e) => setAutoArchive(e.target.checked)} 
                      disabled={!editMode}
                      style={styles.switchInput}
                    />
                    <span style={{
                      ...styles.slider,
                      ...(autoArchive ? styles.sliderChecked : {})
                    }}>
                      <span style={{
                        ...styles.sliderBefore,
                        ...(autoArchive ? styles.sliderBeforeChecked : {})
                      }}></span>
                    </span>
                  </label>
                </div>

                <div style={styles.configItem}>
                  <div style={styles.configLabel}>
                    <span style={styles.configLabelText}>Archive Frequency</span>
                    <span style={styles.configLabelDescription}>
                      Set how often to automatically archive data (0 = archive immediately)
                    </span>
                  </div>
                  <div style={styles.inputWithSuffix}>
                    <input
                      type="number"
                      placeholder="Days"
                      style={styles.configInput}
                      value={archiveInterval}
                      onChange={(e) => setArchiveInterval(e.target.value)}
                      disabled={!editMode}
                      min="0"
                    />
                    <span style={styles.inputSuffix}>days</span>
                  </div>
                </div>

                {lastArchiveDate && (
                  <div style={styles.configItem}>
                    <div style={styles.configLabel}>
                      <span style={styles.configLabelText}>Last Archive</span>
                      <span style={styles.configLabelDescription}>
                        Date of the most recent automatic archive
                      </span>
                    </div>
                    <div style={styles.lastArchiveDate}>
                      {new Date(lastArchiveDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                )}

                <div style={styles.actionSection}>
                  <button 
                    style={{
                      ...styles.primaryButton,
                      ...(editMode ? styles.saveButtonActive : {})
                    }}
                    onClick={editMode ? handleSave : () => setEditMode(true)}
                    disabled={loading}
                  >
                    <span style={styles.buttonContent}>
                      {editMode ? <FaSave style={{ marginRight: '8px' }} /> : <FaEdit style={{ marginRight: '8px' }} />}
                      {loading ? 'Processing...' : (editMode ? 'Save Configuration' : 'Edit Configuration')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Archived Data Section */}
        {activeSection === 'archived' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <FaHistory style={styles.cardIcon} />
                  <h3 style={styles.cardTitleText}>Archive History</h3>
                </div>
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
                  <FaFileExport style={styles.exportIcon} />
                  Export Archive List
                </button>
              </div>

              {/* Enhanced Table Header */}
              <div style={styles.tableHeader}>
                <span style={styles.tableHeaderText}>Archive Type</span>
                <span style={styles.tableHeaderText}>Date Archived</span>
                <span style={styles.tableHeaderText}>Status</span>
                <span style={styles.tableHeaderText}>Data Summary</span>
                <span style={styles.tableHeaderText}>Actions</span>
              </div>

              {archivedData.length === 0 ? (
                <div style={styles.noDataMessage}>
                  <FaDatabase style={styles.noDataIcon} />
                  <p style={styles.noDataText}>No archived data found</p>
                  <p style={styles.noDataSubtext}>Archived data will appear here once automatic or manual archiving is performed.</p>
                </div>
              ) : (
                archivedData.map(item => (
                  <div key={item.id} style={styles.tableRow}>
                    <div style={styles.tableCell}>
                      <span style={styles.archiveType}>{item.type || 'Full Archive'}</span>
                    </div>
                    <div style={styles.tableCell}>
                      <span style={styles.archiveDate}>
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div style={styles.tableCell}>
                      <span style={styles.statusBadge}>{item.status}</span>
                    </div>
                    <div style={styles.tableCell}>
                      <div style={styles.dataSummary}>
                        <div style={styles.summaryItem}>
                          <span style={styles.summaryLabel}>Deposits:</span>
                          <span style={styles.summaryValue}>
                            {item.counts.deposits !== undefined ? 
                              item.counts.deposits : 
                              (item.counts.approvedDeposits || 0) + (item.counts.pendingDeposits || 0)}
                          </span>
                        </div>
                        <div style={styles.summaryItem}>
                          <span style={styles.summaryLabel}>Loans:</span>
                          <span style={styles.summaryValue}>
                            {item.counts.loans !== undefined ? 
                              item.counts.loans : 
                              (item.counts.approvedLoans || 0) + (item.counts.pendingLoans || 0)}
                          </span>
                        </div>
                        <div style={styles.summaryItem}>
                          <span style={styles.summaryLabel}>Members:</span>
                          <span style={styles.summaryValue}>{item.counts.members || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.tableCell}>
                      <div style={styles.actions}>
                        <button 
                          style={styles.deleteButton}
                          onClick={() => handleDeleteArchive(item.id)}
                          title="Delete Archive"
                        >
                          <FaTrashAlt style={styles.actionIcon} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  sidebar: {
    width: '280px',
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
    gap: '12px',
    marginBottom: '8px'
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
    gap: '24px'
  },
  configItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  configLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1'
  },
  configLabelText: {
    fontSize: '15px',
    color: '#374151',
    fontWeight: '600'
  },
  configLabelDescription: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '400'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '60px',
    height: '28px',
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
    backgroundColor: '#d1d5db',
    transition: '.4s',
    borderRadius: '28px',
  },
  sliderChecked: {
    backgroundColor: '#10b981',
  },
  sliderBefore: {
    position: 'absolute',
    content: '""',
    height: '20px',
    width: '20px',
    left: '4px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
    transform: 'translateX(0px)',
  },
  sliderBeforeChecked: {
    transform: 'translateX(32px)',
  },
  inputWithSuffix: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  configInput: {
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100px',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  inputSuffix: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  lastArchiveDate: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  actionSection: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px'
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 32px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
  },
  saveButtonActive: {
    backgroundColor: '#10b981'
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  exportButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
  },
  exportIcon: {
    fontSize: '16px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 2fr 0.5fr',
    gap: '16px',
    marginBottom: '16px',
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontWeight: '600'
  },
  tableHeaderText: {
    fontSize: '14px',
    color: '#374151',
    textAlign: 'left'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 2fr 0.5fr',
    gap: '16px',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #f1f5f9',
    transition: 'all 0.3s ease'
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center'
  },
  archiveType: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b'
  },
  archiveDate: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  statusBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  dataSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500'
  },
  summaryValue: {
    fontSize: '12px',
    color: '#374151',
    fontWeight: '600'
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  actionIcon: {
    fontSize: '14px'
  },
  noDataMessage: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: '0.5'
  },
  noDataText: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  noDataSubtext: {
    fontSize: '14px',
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: '1.5'
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
    fontSize: '20px',
    color: '#ef4444',
    marginBottom: '12px',
    fontWeight: '600'
  },
  errorText: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '24px',
    maxWidth: '400px'
  },
  retryButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
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
    padding: '32px',
    borderRadius: '16px',
    width: '420px',
    maxWidth: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    border: '1px solid #e2e8f0'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1e293b',
  },
  modalText: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  confirmButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
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
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  },
  confirmIcon: {
    marginBottom: '16px',
    fontSize: '40px'
  },
  actionButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.3s ease',
    minWidth: '80px',
    outline: 'none'
  }
};

export default DataManagement;