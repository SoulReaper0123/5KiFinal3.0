import React, { useState } from 'react';
import { FaTimesCircle, FaTimes } from 'react-icons/fa';

const styles = {
  container: {
    flex: 1,
  },
  loadingView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
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
  statusRejected: {
    color: 'red'
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
    width: '40%',
    maxWidth: '800px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalContent: {
    paddingBottom: '12px',
    overflowY: 'auto',
    flex: 1
  },
  columns: {
    display: 'flex',
    flexDirection: 'row',
    gap: '30px'
  },
  leftColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#2D5783',
    textAlign: 'center'
  },
  modalDetailText: {
    fontSize: '13px',
    marginBottom: '6px',
    color: '#333',
    wordBreak: 'break-word',
    lineHeight: '1.3'
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
  modalHeader: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px'
  },
  compactField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '8px'
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: '13px',
    minWidth: '100px'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#333',
    fontSize: '13px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2D5783',
    margin: '12px 0 8px 0',
    paddingBottom: '4px',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
    width: '100%'
  }
};

const RejectedLoans = ({ loans }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const openModal = (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  if (!loans.length) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No rejected loans available.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Transaction ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Term</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Disbursement</th>
              <th style={{ ...styles.tableHeaderCell, width: '15%' }}>Date Rejected</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((item, index) => (
              <tr key={index} style={styles.tableRow} onClick={() => openModal(item)}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.loanAmount)}</td>
                <td style={styles.tableCell}>{item.term} months</td>
                <td style={styles.tableCell}>{item.disbursement}</td>
                <td style={styles.tableCell}>{item.dateRejected}</td>
                <td style={{...styles.tableCell, ...styles.statusRejected}}>
                  <FaTimesCircle /> Rejected
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {modalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCard}>
            <button 
              style={styles.closeButton} 
              onClick={closeModal}
              aria-label="Close modal"
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <FaTimes />
            </button>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Loan Details</h2>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.columns}>
                <div style={styles.leftColumn}>
                  <div style={styles.sectionTitle}>Loan Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Member ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Transaction ID:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.transactionId || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Amount:</span>
                    <span style={styles.fieldValue}>{formatCurrency(selectedLoan?.loanAmount) || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Term:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.term ? `${selectedLoan.term} months` : 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Disbursement:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.disbursement || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Applied:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.dateApplied || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Date Rejected:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.dateRejected || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Time Rejected:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.timeRejected || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Rejection Reason:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.rejectionReason || 'N/A'}</span>
                  </div>
                </div>
                <div style={styles.rightColumn}>
                  <div style={styles.sectionTitle}>Member Information</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Name:</span>
                    <span style={styles.fieldValue}>{`${selectedLoan?.firstName || ''} ${selectedLoan?.lastName || ''}`}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Email:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.email || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Contact:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.phoneNumber || 'N/A'}</span>
                  </div>

                  <div style={styles.sectionTitle}>Bank Details</div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Name:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.accountName || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Account Number:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.accountNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.compactField}>
                    <span style={styles.fieldLabel}>Bank Name:</span>
                    <span style={styles.fieldValue}>{selectedLoan?.bankName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedLoans;