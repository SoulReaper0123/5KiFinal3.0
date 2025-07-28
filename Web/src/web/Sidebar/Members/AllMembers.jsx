import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
  },
  loadingView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
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
  noDataMessage: {
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '16px',
    color: 'gray'
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
  modalCard: {
    width: '90%',
    maxWidth: '600px',
    backgroundColor: '#D9D9D9',
    borderRadius: '8px',
    padding: '15px',
    position: 'relative',
    overflow: 'auto',
    maxHeight: '90vh'
  },
  modalContent: {
    paddingBottom: '15px'
  },
  columns: {
    display: 'flex',
    flexDirection: 'row',
    gap: '15px',
    '@media (max-width: 768px)': {
      flexDirection: 'column'
    }
  },
  leftColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#2c3e50',
    textAlign: 'center'
  },
  modalDetailText: {
    fontSize: '13px',
    marginBottom: '5px',
    color: '#333',
    wordBreak: 'break-word'
  },
  imageBlock: {
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333'
  },
  imageThumbnail: {
    width: '120px',
    height: '80px',
    borderRadius: '8px',
    border: '1px solid #aaa',
    cursor: 'pointer',
    objectFit: 'cover'
  },
  imageModalView: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001
  },
  enlargedImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px'
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#000'
  },
  closeButtonOnImage: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    cursor: 'pointer',
    fontSize: '24px',
    color: '#fff'
  },
  viewText: {
    color: '#2D5783',
    fontSize: '16px',
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  statusActive: {
    color: 'green'
  },
  statusInactive: {
    color: 'red'
  }
};

const AllMembers = ({ members, currentPage, totalPages, onPageChange }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const openModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setImageModalVisible(false);
  };

  const openImageModal = (url) => {
    setSelectedImage(url);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage('');
  };

  const formatNumber = (value) => {
    if (value === 0 || value === '0') return '0.00';
    if (!value) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  if (!members || members.length === 0) return (
    <div style={styles.loadingView}>
      <p style={styles.noDataMessage}>No member data available.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>First Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Last Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Email</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Savings</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loans</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{member.id || 'N/A'}</td>
                <td style={styles.tableCell}>{member.firstName || 'N/A'}</td>
                <td style={styles.tableCell}>{member.lastName || 'N/A'}</td>
                <td style={styles.tableCell}>{member.email || 'N/A'}</td>
                <td style={styles.tableCell}>₱{formatNumber(member.balance)}</td>
                <td style={styles.tableCell}>₱{formatNumber(member.loans)}</td>
                <td style={{
                  ...styles.tableCell,
                  ...(member.status === 'active' ? styles.statusActive : styles.statusInactive)
                }}>
                  {member.status || 'N/A'}
                </td>
                <td style={styles.tableCell}>
                  <span 
                    style={styles.viewText} 
                    onClick={() => openModal(member)}
                  >
                    View
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Details Modal */}
      {modalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCard}>
            <FaTimes 
              style={styles.closeButton} 
              onClick={closeModal} 
            />
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <h2 style={styles.modalTitle}>Member Details</h2>
                  {[
                    ['Member ID', selectedMember?.id],
                    ['First Name', selectedMember?.firstName],
                    ['Middle Name', selectedMember?.middleName],
                    ['Last Name', selectedMember?.lastName],
                    ['Email', selectedMember?.email],
                    ['Contact', selectedMember?.phoneNumber],
                    ['Gender', selectedMember?.gender],
                    ['Civil Status', selectedMember?.civilStatus],
                    ['Age', selectedMember?.age],
                    ['Date of Birth', selectedMember?.dateOfBirth],
                    ['Birth Place', selectedMember?.placeOfBirth],
                    ['Address', selectedMember?.address],
                    ['Date Added', selectedMember?.dateAdded],
                    ['Time Added', selectedMember?.timeAdded],
                    ['Status', selectedMember?.status],
                    ['Savings Balance', `₱${formatNumber(selectedMember?.balance)}`],
                    ['Total Loans', `₱${formatNumber(selectedMember?.loans)}`],
                  ].map(([label, val]) => (
                    <p key={label} style={styles.modalDetailText}>
                      <strong>{label}:</strong> {val || 'N/A'}
                    </p>
                  ))}
                </div>
                <div style={styles.rightColumn}>
                  <h2 style={styles.modalTitle}>ID Documents</h2>
                  {[
                    ['Valid ID (Front)', selectedMember?.validIdFront],
                    ['Valid ID (Back)', selectedMember?.validIdBack],
                    ['Selfie', selectedMember?.selfie],
                  ].map(([label, url]) => (
                    url && (
                      <div key={label} style={styles.imageBlock}>
                        <p style={styles.imageLabel}>{label}</p>
                        <img
                          src={url}
                          alt={label}
                          style={styles.imageThumbnail}
                          onClick={() => openImageModal(url)}
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {imageModalVisible && (
        <div style={styles.imageModalView}>
          <FaTimes 
            style={styles.closeButtonOnImage} 
            onClick={closeImageModal} 
          />
          <img 
            src={selectedImage} 
            alt="Enlarged document" 
            style={styles.enlargedImage} 
          />
        </div>
      )}
    </div>
  );
};

export default AllMembers;  