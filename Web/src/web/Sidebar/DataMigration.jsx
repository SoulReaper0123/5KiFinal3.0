import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const styles = {
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
    width: '300px',
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
  }
};

const DataMigration = () => {
  const [members, setMembers] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmMigrateVisible, setConfirmMigrateVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [statusList, setStatusList] = useState([]);
  const pageSize = 10;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .safe-area-view {
        flex: 1;
        background-color: #F5F5F5;
        height: 100%;
        width: 100%;
        overflow: auto;
      }
      .main-container {
        flex: 1;
      }
      .header-text {
        font-weight: bold;
        font-size: 40px;
        margin-bottom: 10px;
        margin-left: 25px;
        margin-right: 25px;
      }
      .top-controls {
        display: flex;
        justify-content: space-between;
        margin: 0 25px;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-download-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .search-bar {
        display: flex;
        border: 1px solid #ccc;
        border-radius: 25px;
        background-color: #fff;
        padding: 0 10px;
        align-items: center;
        height: 40px;
        width: 250px;
      }
      .search-input {
        height: 36px;
        width: 100%;
        font-size: 16px;
        padding-left: 8px;
        border: none;
        outline: none;
        background: transparent;
      }
      .search-icon {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
      }
      .download-icon {
        padding: 6px;
        background: none;
        border: none;
        cursor: pointer;
        color: #2D5783;
      }
      .upload-button {
        background-color: #2D5783;
        padding: 0 16px;
        border-radius: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border: none;
        cursor: pointer;
      }
      .upload-button-text {
        color: #fff;
        font-size: 14px;
        font-weight: bold;
      }
      .file-input {
        display: none;
      }
      .pagination-container {
        display: flex;
        justify-content: flex-end;
        margin: 0 25px;
        margin-top: 10px;
        align-items: center;
      }
      .pagination-info {
        font-size: 12px;
        margin-right: 10px;
        color: #333;
      }
      .pagination-button {
        padding: 0;
        background-color: #2D5783;
        border-radius: 5px;
        margin: 0 3px;
        color: white;
        border: none;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .pagination-button svg {
        font-size: 10px;
        display: block;
        margin: 0 auto;
      }
      .disabled-button {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .data-container {
        flex: 1;
        margin: 0 25px;
        margin-top: 10px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .no-match-text {
        text-align: center;
        margin-top: 20px;
        font-size: 16px;
        color: #666;
      }
      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .modal-container {
        width: 500px;
        height: 650px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        position: relative;
        overflow-x: hidden;
      }
      @media (max-width: 800px) {
        .modal-container {
            width: 90%;
            max-width: 90%;
            height: auto;
            max-height: 90vh;
        }
      }
      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #2D5783;
        text-align: center;
      }
      .modal-content {
        padding-bottom: 20px;
        height: calc(100% - 100px);
        display: flex;
        flex-direction: column;
      }
      .form-group {
        margin-bottom: 20px;
        width: 100%;
      }
      .form-label {
        font-weight: 600;
        margin-bottom: 5px;
        display: block;
      }
      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-sizing: border-box;
      }
      .error-text {
        color: red;
        font-size: 12px;
        margin-top: 5px;
      }
      .modal-button-container {
        display: flex;
        justify-content: space-between;
        margin-top: auto;
        width: 100%;
        padding-top: 20px;
      }
      .modal-submit-button {
        background-color: #2D5783;
        color: white;
        padding: 10px;
        border: none;
        border-radius: 5px;
        width: 48%;
        cursor: pointer;
        font-weight: bold;
      }
      .modal-cancel-button {
        background-color: #ccc;
        padding: 10px;
        border: none;
        border-radius: 5px;
        width: 48%;
        cursor: pointer;
        font-weight: bold;
      }
      .confirm-modal-card {
        width: 300px;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        overflow: hidden;
      }
      .action-buttons-container {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        width: 100%;
      }
      .migrate-button {
        background-color: #28a745;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      .file-name {
        margin-left: 10px;
        font-size: 14px;
        color: #666;
      }
      .status-badge {
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const db = getDatabase();
        const memRef = ref(db, 'Members');
        onValue(memRef, (snap) => {
          const data = snap.val() || {};
          const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
          setMembers(arr);
          setFilteredData(arr);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching members:', error);
        setErrorMessage('Failed to fetch member data');
        setErrorModalVisible(true);
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = excelData.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.email.toLowerCase().includes(searchLower) ||
        item.firstName.toLowerCase().includes(searchLower) ||
        item.lastName.toLowerCase().includes(searchLower) ||
        (item.phoneNumber && item.phoneNumber.toLowerCase().includes(searchLower))
      );
    });
    setFilteredData(filtered);
    setNoMatch(filtered.length === 0);
    setCurrentPage(0);
  }, [searchQuery, excelData]);

  const handleFilePick = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      setFileName(file.name);
      const fileContent = await file.arrayBuffer();
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileContent);
      
      const worksheet = workbook.worksheets[0];
      const json = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          json.push({
            email: row.getCell(1).value?.toString() || '',
            phoneNumber: row.getCell(2).value?.toString() || '',
            firstName: row.getCell(3).value?.toString() || '',
            middleName: row.getCell(4).value?.toString() || '',
            lastName: row.getCell(5).value?.toString() || '',
          });
        }
      });
      
      setExcelData(json);
      setFilteredData(json);
      setNoMatch(false);
      setStatusList([]);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error reading file:', error);
      setErrorMessage('Failed to read file');
      setErrorModalVisible(true);
    }
  };

  const migrateData = async () => {
    setConfirmMigrateVisible(false);
    setIsProcessing(true);

    try {
      const db = getDatabase();
      const sts = [];
      
      for (let i = 0; i < filteredData.length; i++) {
        const e = filteredData[i];
        const uid = e.email.replace(/[@.]/g, '_') || `user_${i}`;
        try {
          await set(ref(db, `Users/MigratedUsers/${uid}`), {
            email: e.email,
            phoneNumber: e.phoneNumber,
            firstName: e.firstName,
            middleName: e.middleName,
            lastName: e.lastName,
            migratedAt: new Date().toISOString(),
          });
          sts.push({ index: i, status: 'Success' });
        } catch {
          sts.push({ index: i, status: 'Error' });
        }
      }
      
      setStatusList(sts);
      setSuccessMessage(`${filteredData.length} records migrated successfully!`);
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error migrating data:', error);
      setErrorMessage('Failed to migrate data');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (filteredData.length === 0) {
        setErrorMessage('No data to export');
        setErrorModalVisible(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Migration Data');

      const headers = ['Email', 'Phone Number', 'First Name', 'Middle Name', 'Last Name', 'Status'];
      worksheet.addRow(headers);

      filteredData.forEach((item, index) => {
        const status = statusList.find(s => s.index === index)?.status || 'Pending';
        const row = [
          item.email,
          item.phoneNumber,
          item.firstName,
          item.middleName,
          item.lastName,
          status
        ];
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'MigrationData.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Data exported successfully!');
      setSuccessVisible(true);
    } catch (error) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to export data');
      setErrorModalVisible(true);
    }
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
    setFileName('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div className="loading-container">
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Data Migration</h2>

        <div className="top-controls">
          <label className="upload-button">
            <input 
              type="file" 
              className="file-input" 
              onChange={handleFilePick}
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
            <span className="upload-button-text">Upload Excel File</span>
          </label>
          {fileName && <span className="file-name">{fileName}</span>}

          <div className="search-download-container">
            <div className="search-bar">
              <input
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-icon">
                <FaSearch />
              </button>
            </div>
            <button onClick={handleDownload} className="download-icon">
              <FaDownload />
            </button>
          </div>
        </div>

        {!noMatch && filteredData.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">{`Page ${currentPage + 1} of ${totalPages}`}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className={`pagination-button ${currentPage === 0 ? 'disabled-button' : ''}`}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
              className={`pagination-button ${currentPage === totalPages - 1 ? 'disabled-button' : ''}`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="data-container">
          {noMatch ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Email</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Phone Number</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>First Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Middle Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Last Name</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
                    <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => {
                    const status = statusList.find(s => s.index === (currentPage * pageSize + index))?.status || 'Pending';
                    return (
                      <tr key={index} style={styles.tableRow}>
                        <td style={styles.tableCell}>{item.email}</td>
                        <td style={styles.tableCell}>{item.phoneNumber}</td>
                        <td style={styles.tableCell}>{item.firstName}</td>
                        <td style={styles.tableCell}>{item.middleName}</td>
                        <td style={styles.tableCell}>{item.lastName}</td>
                        <td style={{
                          ...styles.tableCell,
                          color: status === 'Success' ? 'green' : status === 'Error' ? 'red' : 'inherit'
                        }}>
                          {status}
                        </td>
                        <td style={styles.tableCell}>
                          <span 
                            style={styles.viewText} 
                            onClick={() => {
                              setSelectedMember(item);
                              setMemberModalVisible(true);
                            }}
                          >
                            View
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="action-buttons-container">
            <button
              className="migrate-button"
              onClick={() => setConfirmMigrateVisible(true)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Migrating...' : 'Migrate Data'}
            </button>
          </div>
        )}

        {/* Member Details Modal */}
        {memberModalVisible && (
          <div style={styles.centeredModal}>
            <div className="modal-container">
              <button 
                onClick={() => setMemberModalVisible(false)} 
                style={styles.closeButton}
                aria-label="Close modal"
              >
                <AiOutlineClose />
              </button>
              <div className="modal-content">
                <h3 className="modal-title">Member Details</h3>
                <div className="form-group">
                  <label className="form-label">Email:</label>
                  <p>{selectedMember?.email || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number:</label>
                  <p>{selectedMember?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">First Name:</label>
                  <p>{selectedMember?.firstName || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Middle Name:</label>
                  <p>{selectedMember?.middleName || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name:</label>
                  <p>{selectedMember?.lastName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmMigrateVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCardSmall}>
              <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
              <p style={styles.modalText}>Are you sure you want to migrate {filteredData.length} records?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#2D5783',
                    color: '#fff'
                  }} 
                  onClick={migrateData}
                >
                  Yes
                </button>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#f44336',
                    color: '#fff'
                  }} 
                  onClick={() => setConfirmMigrateVisible(false)}
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
    </div>
  );
};

export default DataMigration;