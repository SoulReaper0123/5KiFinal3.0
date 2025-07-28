import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload, FaTimes } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const DataMigration = () => {
  const [members, setMembers] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [page, setPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const PAGE_SIZE = 5;

  useEffect(() => {
    const db = getDatabase();
    const memRef = ref(db, 'Members');
    onValue(memRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      setMembers(arr);
    });
  }, []);

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
      setPage(0);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const q = text.toLowerCase();
    const arr = excelData.filter((i) =>
      i.email.toLowerCase().includes(q) ||
      i.firstName.toLowerCase().includes(q) ||
      i.lastName.toLowerCase().includes(q)
    );
    setFilteredData(arr);
    setNoMatch(arr.length === 0);
    setPage(0);
  };

  const migrateData = async () => {
    setConfirmVisible(false);
    setIsMigrating(true);
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
    setIsMigrating(false);
    alert('Migration complete');
  };

  const handleDownload = async () => {
    if (!filteredData.length) return;
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Migrated Data');
      
      // Add headers
      worksheet.addRow(['Email', 'Contact', 'First Name', 'Middle Name', 'Last Name']);
      
      // Add data
      filteredData.forEach(item => {
        worksheet.addRow([
          item.email,
          item.phoneNumber,
          item.firstName,
          item.middleName,
          item.lastName
        ]);
      });
      
      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Web download
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MigratedData.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error exporting file');
    }
  };

  const paged = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openMemberModal = (m) => {
    setSelectedMember(m);
    setModalVisible(true);
  };

  // Styles
  const styles = {
    safeArea: { 
      minHeight: '100vh', 
      backgroundColor: '#F5F5F5' 
    },
    container: { 
      padding: '10px' 
    },
    headerText: { 
      fontWeight: 'bold', 
      fontSize: '36px', 
      margin: '25px',
      marginTop: '25px'
    },
    topControls: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: '0 25px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    uploadBtn: {
      backgroundColor: '#001F3F',
      padding: '10px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'inline-block',
    },
    uploadText: { 
      color: '#fff', 
      fontWeight: 'bold' 
    },
    searchDownload: { 
      display: 'flex', 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    searchBar: {
      display: 'flex',
      flexDirection: 'row',
      border: '1px solid #ccc',
      borderRadius: '25px',
      backgroundColor: '#fff',
      padding: '0 10px',
      alignItems: 'center',
      height: '40px',
    },
    searchInput: { 
      flex: 1, 
      height: '36px', 
      fontSize: '14px', 
      border: 'none',
      outline: 'none',
    },
    downloadBtn: { 
      padding: '6px', 
      marginLeft: '10px',
      cursor: 'pointer',
    },
    tableContainer: { 
      margin: '20px',
      borderRadius: '10px',
      overflow: 'hidden',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: { 
      height: '50px', 
      backgroundColor: '#2D5783',
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tableRow: { 
      height: '50px',
      borderBottom: '1px solid #eee',
    },
    tableCell: {
      textAlign: 'center',
      padding: '10px',
    },
    moreButton: {
      backgroundColor: '#5A8DB8',
      padding: '5px',
      borderRadius: '10px',
      color: '#fff',
      textAlign: 'center',
      cursor: 'pointer',
    },
    centeredModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
    },
    modalCard: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '15px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    },
    modalContent: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    leftColumn: {
      flex: 1,
      paddingRight: '10px',
    },
    rightColumn: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    modalText: {
      fontSize: '14px',
      marginBottom: '10px',
    },
    imageThumbnail: {
      width: '80px',
      height: '80px',
      margin: '5px',
      borderRadius: '10px',
      cursor: 'pointer',
    },
    imageModalView: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001,
    },
    enlargedImage: {
      width: '90%',
      height: '70%',
      objectFit: 'contain',
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1,
      cursor: 'pointer',
      color: '#fff',
      fontSize: '20px',
      fontWeight: 'bold',
    },
    pagination: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px',
    },
    pageBtn: {
      padding: '8px',
      backgroundColor: '#001F3F',
      borderRadius: '5px',
      margin: '0 8px',
      cursor: 'pointer',
      border: 'none',
      color: '#fff',
    },
    disabledPage: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
    pageInfo: {
      fontSize: '14px',
    },
    confirmBtn: {
      backgroundColor: '#28a745',
      padding: '10px',
      borderRadius: '8px',
      margin: '20px',
      width: '50%',
      cursor: 'pointer',
      border: 'none',
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
      alignSelf: 'center',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      margin: '20px',
    },
    modalBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalBox: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '10px',
      width: '80%',
      boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    },
    modalActions: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: '20px',
    },
    subHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px',
      textAlign: 'center',
      color: '#2D5783',
    },
    fileInput: {
      display: 'none',
    },
  };

  return (
    <div style={styles.safeArea}>
      <div style={styles.container}>
        <h1 style={styles.headerText}>Data Migration</h1>

        <div style={styles.topControls}>
          <label style={styles.uploadBtn}>
            <input 
              type="file" 
              style={styles.fileInput} 
              onChange={handleFilePick}
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
            <span style={styles.uploadText}>Upload Excel File</span>
          </label>

          <div style={styles.searchDownload}>
            <div style={styles.searchBar}>
              <input
                style={styles.searchInput}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <FaSearch color="#000" />
            </div>
            <button onClick={handleDownload} style={styles.downloadBtn}>
              <FaDownload size={24} color="#001F3F" />
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Email</th>
                <th>Contact</th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Last Name</th>
                <th>More</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.tableCell}>{m.email}</td>
                  <td style={styles.tableCell}>{m.phoneNumber}</td>
                  <td style={styles.tableCell}>{m.firstName}</td>
                  <td style={styles.tableCell}>{m.middleName}</td>
                  <td style={styles.tableCell}>{m.lastName}</td>
                  <td style={styles.tableCell}>
                    <button 
                      style={styles.moreButton}
                      onClick={() => openMemberModal(m)}
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Excel Preview */}
        {paged.length > 0 && (
          <div style={styles.tableContainer}>
            <h3 style={styles.subHeader}>Preview & Migration</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>First Name</th>
                  <th>Middle Name</th>
                  <th>Last Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => {
                  const st = statusList.find((s) => s.index === page * PAGE_SIZE + i)?.status || '-';
                  return (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.tableCell}>{r.email}</td>
                      <td style={styles.tableCell}>{r.phoneNumber}</td>
                      <td style={styles.tableCell}>{r.firstName}</td>
                      <td style={styles.tableCell}>{r.middleName}</td>
                      <td style={styles.tableCell}>{r.lastName}</td>
                      <td style={{
                        ...styles.tableCell,
                        color: st === 'Success' ? 'green' : st === 'Error' ? 'red' : 'inherit'
                      }}>
                        {st}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
                style={{
                  ...styles.pageBtn,
                  ...(page === 0 && styles.disabledPage)
                }}
              >
                Prev
              </button>
              <span style={styles.pageInfo}>
                Page {page + 1} of {Math.ceil(filteredData.length / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, Math.floor((filteredData.length - 1) / PAGE_SIZE)))}
                disabled={page >= Math.floor((filteredData.length - 1) / PAGE_SIZE)}
                style={{
                  ...styles.pageBtn,
                  ...(page >= Math.floor((filteredData.length - 1) / PAGE_SIZE) && styles.disabledPage)
                }}
              >
                Next
              </button>
            </div>

            {!isMigrating && (
              <button 
                style={styles.confirmBtn} 
                onClick={() => setConfirmVisible(true)}
              >
                Migrate Now
              </button>
            )}
            {isMigrating && (
              <div style={styles.loading}>
                <div className="spinner"></div>
                <span>Migrating...</span>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {modalVisible && (
          <div style={styles.centeredModal}>
            <div style={styles.modalCard}>
              <button onClick={() => setModalVisible(false)} style={styles.closeButton}>
                <FaTimes size={26} color="black" />
              </button>
              <div style={styles.modalContent}>
                {selectedMember && (
                  <>
                    <div style={styles.leftColumn}>
                      <h3 style={styles.modalTitle}>Member Details</h3>
                      {['email', 'phoneNumber', 'firstName', 'middleName', 'lastName',
                        'gender', 'age', 'dateOfBirth', 'placeOfBirth',
                        'address', 'civilStatus', 'balance', 'loans', 'dateApproved'
                      ].map((f) => (
                        <p key={f} style={styles.modalText}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}: {selectedMember[f] || 'N/A'}
                        </p>
                      ))}
                    </div>
                    <div style={styles.rightColumn}>
                      <h3 style={styles.modalTitle}>Images</h3>
                      {['validIdFrontUrl', 'validIdBackUrl', 'selfieUrl'].map((urlField) =>
                        selectedMember[urlField] ? (
                          <img
                            key={urlField}
                            src={selectedMember[urlField]}
                            style={styles.imageThumbnail}
                            onClick={() => { 
                              setSelectedImage(selectedMember[urlField]); 
                              setImageModalVisible(true); 
                            }}
                            alt={urlField}
                          />
                        ) : null
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {imageModalVisible && (
          <div style={styles.imageModalView}>
            <button onClick={() => setImageModalVisible(false)} style={styles.closeButton}>
              X
            </button>
            <img src={selectedImage} style={styles.enlargedImage} alt="Enlarged" />
          </div>
        )}

        {/* Confirm Modal */}
        {confirmVisible && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modalBox}>
              <h3 style={styles.modalTitle}>Confirm Migration?</h3>
              <p>Migrate {filteredData.length} entries?</p>
              <div style={styles.modalActions}>
                <button style={styles.confirmBtn} onClick={migrateData}>
                  Yes
                </button>
                <button
                  style={{ ...styles.confirmBtn, backgroundColor: '#dc3545' }}
                  onClick={() => setConfirmVisible(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #001F3F;
            animation: spin 1s linear infinite;
            margin-right: 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DataMigration;