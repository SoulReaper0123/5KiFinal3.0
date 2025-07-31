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
      <div className="error-container">
        <h2>Error loading data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="data-management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className={`sidebar-button ${activeSection === 'archiving' ? 'active' : ''}`}
          onClick={() => setActiveSection('archiving')}
        >
          <span className="sidebar-button-text">Data Archiving</span>
        </button>

        <button
          className={`sidebar-button ${activeSection === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveSection('archived')}
        >
          <span className="sidebar-button-text">Archived Data</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {activeSection === 'archiving' && (
          <div className="section">
            <h2 className="section-title">Data Archiving</h2>

            <div className="form-row">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={autoArchive} 
                  onChange={(e) => setAutoArchive(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
              <span className="label">Enable Automatic Archiving</span>
            </div>

            <div className="form-row">
              <span className="label">Archive Every</span>
              <input
                type="number"
                placeholder="Days"
                className="input"
                value={archiveInterval}
                onChange={(e) => setArchiveInterval(e.target.value)}
                min="0"
              />
              <span className="label">days (0 = archive now)</span>
            </div>

            {lastArchiveDate && (
              <div className="form-row">
                <span className="label">Last Archive:</span>
                <span className="label">
                  {new Date(lastArchiveDate).toLocaleString()}
                </span>
              </div>
            )}

            <button 
              className="save-button"
              onClick={handleSaveSettings}
              disabled={loading}
            >
              <span className="save-button-text">
                {loading ? 'Processing...' : 'Save Settings'}
              </span>
            </button>
          </div>
        )}

        {activeSection === 'archived' && (
          <div className="section">
            <h2 className="section-title">Archived Data</h2>

            <div className="search-row">
              <input 
                type="text" 
                placeholder="Search archives..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className="export-button"
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
                <FaDownload className="export-icon" />
              </button>
            </div>

            <div className="table-header">
              <span className="table-header-text">Data type</span>
              <span className="table-header-text">Date Archived</span>
              <span className="table-header-text">Status</span>
              <span className="table-header-text">Counts</span>
              <span className="table-header-text">Actions</span>
            </div>

            {filteredArchives.length === 0 ? (
              <div className="no-data-message">No archived data found</div>
            ) : (
              filteredArchives.map(item => (
                <div key={item.id} className="table-row">
                  <span className="table-cell">{item.type || 'Full Archive'}</span>
                  <span className="table-cell">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span className="table-cell archived-status">{item.status}</span>
                  <span className="table-cell">
                    {item.counts ? (
                      `D:${item.counts.deposits || 0} L:${item.counts.loans || 0} R:${item.counts.registrations || 0}`
                    ) : 'N/A'}
                  </span>
                  <div className="actions">
                    <button 
                      className="restore-button"
                      onClick={() => {
                        // Implement restore functionality if needed
                        console.log('Restore archive:', item.id);
                      }}
                    >
                      <FaUndo className="action-icon" />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteArchive(item.id)}
                    >
                      <FaTrashAlt className="action-icon" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style>{`
        .data-management-container {
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

        .form-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        /* Custom switch styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
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
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: #2ecc71;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .slider.round {
          border-radius: 24px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        .label {
          font-size: 13px;
          margin-left: 10px;
        }

        .input {
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 8px 10px;
          width: 80px;
          font-size: 13px;
          margin-left: 10px;
        }

        .save-button {
          background-color: green;
          padding: 8px 0;
          border-radius: 5px;
          border: none;
          width: 100%;
          cursor: pointer;
        }

        .save-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .save-button-text {
          color: #fff;
          font-weight: 600;
        }

        .search-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .search-input {
          flex: 1;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 8px 10px;
          font-size: 13px;
        }

        .export-button {
          margin-left: 10px;
          background-color: #ddd;
          padding: 8px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .export-icon {
          font-size: 16px;
        }

        .table-header {
          display: flex;
          margin-bottom: 8px;
          font-weight: bold;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .table-header-text {
          font-size: 12px;
          flex: 1;
        }

        .table-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .table-cell {
          font-size: 12px;
          flex: 1;
        }

        .archived-status {
          color: orange;
          font-weight: bold;
        }

        .actions {
          display: flex;
          flex: 1;
          justify-content: flex-end;
          gap: 5px;
        }

        .restore-button {
          background-color: #00C851;
          padding: 6px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button {
          background-color: #ff4444;
          padding: 6px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-icon {
          color: #fff;
          font-size: 12px;
        }

        .no-data-message {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 14px;
        }

        .error-container {
          padding: 20px;
          text-align: center;
          color: #ff4444;
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
          .data-management-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            display: flex;
            padding-top: 0;
          }

          .sidebar-button {
            text-align: center;
            padding: 10px;
          }

          .sidebar-button.active {
            border-radius: 0;
          }

          .content-area {
            padding: 15px;
          }

          .form-row {
            flex-wrap: wrap;
          }

          .input {
            margin-left: 0;
            margin-top: 5px;
            width: 100%;
          }

          .table-header, .table-row {
            flex-wrap: wrap;
          }

          .table-header-text, .table-cell {
            width: 100%;
            margin-bottom: 5px;
          }

          .actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DataManagement;