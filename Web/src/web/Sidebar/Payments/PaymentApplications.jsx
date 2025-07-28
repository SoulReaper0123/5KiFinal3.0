import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaSpinner, FaImage } from 'react-icons/fa';
import { database } from '../../../../../Database/firebaseConfig';
import { ApprovePayments, RejectPayments } from '../../../../../Server/api';

const styles = {
  container: {
    flex: 1,
    padding: '20px'
  },
  loadingView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  tableContainer: {
    borderRadius: '10px',
    overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
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
    padding: '12px',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    height: '60px',
    '&:nth-child(even)': {
      backgroundColor: '#f5f5f5'
    },
    '&:nth-child(odd)': {
      backgroundColor: '#fff'
    },
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  tableCell: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #ddd'
  },
  thumbnailImage: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  actionsCell: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  actionButton: {
    padding: '8px 12px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: '14px',
    transition: 'background-color 0.3s'
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    '&:hover': {
      backgroundColor: '#3e8e41'
    }
  },
  rejectButton: {
    backgroundColor: '#f44336',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  imageModalContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  },
  imageModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    paddingTop: '20px',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  imageModalTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    padding: '5px',
    cursor: 'pointer',
    border: 'none',
    color: '#fff',
    fontSize: '20px'
  },
  imageContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px'
  },
  enlargedImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px'
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
    height: '200px',
    backgroundColor: '#D9D9D9',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalIcon: {
    fontSize: '30px',
    marginBottom: '10px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  modalButtons: {
    display: 'flex',
    gap: '20px'
  },
  modalButton: {
    width: '100px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: '16px'
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    '&:hover': {
      backgroundColor: '#3e8e41'
    }
  },
  cancelButton: {
    backgroundColor: '#f44336',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  noDataMessage: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '16px',
    color: '#666'
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    fontSize: '40px',
    color: '#001F3F'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
};

const PaymentApplications = ({ payments }) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const openImageModal = (uri) => {
    setSelectedImageUrl(uri);
    setImageModalVisible(true);
  };

  const handleAction = (payment, action) => {
    setSelectedPayment(payment);
    setCurrentAction(action);
    setConfirmModalVisible(true);
  };

  const confirmAction = async () => {
    setConfirmModalVisible(false);
    setIsProcessing(true);

    try {
      if (currentAction === 'approve') {
        const success = await handleApprove(selectedPayment);
        if (!success) return;
        setSuccessMessage('Payment approved successfully.');
      } else {
        await handleReject(selectedPayment);
        setSuccessMessage('Payment rejected successfully.');
      }

      setSuccessModalVisible(true);
    } catch (err) {
      console.error(`${currentAction} error:`, err);
      setErrorMessage(`An error occurred during ${currentAction}. Please try again.`);
      setErrorModalVisible(true);
    }

    setIsProcessing(false);
  };

  const handleApprove = async (item) => {
    const { id, transactionId, amountToBePaid, paymentOption } = item;
    
    const paymentRef = database.ref(`Payments/Pending/${id}/${transactionId}`);
    const approvedRef = database.ref(`Payments/Completed/${id}/${transactionId}`);
    const transactionRef = database.ref(`Transactions/Payments/${id}/${transactionId}`);
    const fundsRef = database.ref('Settings/Funds');
    const currentLoanRef = database.ref(`Loans/CurrentLoans/${id}/${transactionId}`);

    try {
      const [paymentSnap, fundsSnap, loanSnap] = await Promise.all([
        paymentRef.once('value'),
        fundsRef.once('value'),
        currentLoanRef.once('value'),
      ]);

      if (!paymentSnap.exists()) {
        setErrorMessage('Payment data not found.');
        setErrorModalVisible(true);
        return false;
      }

      const paymentData = paymentSnap.val();
      const currentFunds = parseFloat(fundsSnap.val()) || 0;
      const paymentAmount = parseFloat(amountToBePaid);
      const approvalDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Update funds
      await fundsRef.set(currentFunds + paymentAmount);

      // Update loan if exists
      if (loanSnap.exists()) {
        const loanData = loanSnap.val();
        const remainingAmount = parseFloat(loanData.loanAmount) - paymentAmount;
        
        if (remainingAmount <= 0) {
          await currentLoanRef.remove();
        } else {
          await currentLoanRef.update({
            loanAmount: remainingAmount.toFixed(2)
          });
        }
      }

      // Create approved record
      const approvedData = {
        ...paymentData,
        dateApproved: approvalDate,
        status: 'completed',
      };

      await approvedRef.set(approvedData);
      await transactionRef.set(approvedData);
      await paymentRef.remove();

      return true;
    } catch (err) {
      console.error('Approval error:', err);
      setErrorMessage('An unexpected error occurred during approval.');
      setErrorModalVisible(true);
      return false;
    }
  };

  const handleReject = async (item) => {
    const paymentRef = database.ref(`Payments/Pending/${item.id}/${item.transactionId}`);
    const rejectedRef = database.ref(`Payments/Failed/${item.id}/${item.transactionId}`);
    const transactionRef = database.ref(`Transactions/Payments/${item.id}/${item.transactionId}`);
    const snapshot = await paymentRef.once('value');

    const rejectionDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (snapshot.exists()) {
      const data = snapshot.val();

      const rejectedData = {
        ...data,
        dateRejected: rejectionDate,
        status: 'failed',
      };

      await rejectedRef.set(rejectedData);
      await transactionRef.set(rejectedData);
      await paymentRef.remove();
    }
  };

  const callApiApprove = async (item) => {
    try {
      const memberSnap = await database.ref(`Members/${item.id}`).once('value');
      const memberData = memberSnap.val();

      await ApprovePayments({
        memberId: item.id,
        transactionId: item.transactionId,
        amount: item.amountToBePaid,
        paymentMethod: item.paymentOption,
        dateApproved: new Date().toLocaleDateString('en-US'),
        email: item.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
      });
    } catch (err) {
      console.error('API approve error:', err);
    }
  };

  const callApiReject = async (item) => {
    try {
      const memberSnap = await database.ref(`Members/${item.id}`).once('value');
      const memberData = memberSnap.val();

      await RejectPayments({
        memberId: item.id,
        transactionId: item.transactionId,
        amount: item.amountToBePaid,
        paymentMethod: item.paymentOption,
        dateRejected: new Date().toLocaleDateString('en-US'),
        email: item.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
      });
    } catch (err) {
      console.error('API reject error:', err);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    if (currentAction === 'approve') callApiApprove(selectedPayment);
    else callApiReject(selectedPayment);
    setSelectedPayment(null);
    setCurrentAction(null);
  };

  const handleErrorOk = () => {
    setErrorModalVisible(false);
    setSelectedPayment(null);
    setCurrentAction(null);
  };

  if (!payments || payments.length === 0) {
    return (
      <div style={styles.loadingView}>
        <p style={styles.noDataMessage}>No pending payments available.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableHeaderCell}>ID</th>
              <th style={styles.tableHeaderCell}>Transaction ID</th>
              <th style={styles.tableHeaderCell}>Amount</th>
              <th style={styles.tableHeaderCell}>Payment Option</th>
              <th style={styles.tableHeaderCell}>Date Applied</th>
              <th style={styles.tableHeaderCell}>Proof</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.id}</td>
                <td style={styles.tableCell}>{item.transactionId}</td>
                <td style={styles.tableCell}>{formatCurrency(item.amountToBePaid)}</td>
                <td style={styles.tableCell}>{item.paymentOption}</td>
                <td style={styles.tableCell}>{formatDate(item.dateApplied)}</td>
                <td style={styles.tableCell}>
                  {item.proofOfPaymentUrl ? (
                    <img
                      src={item.proofOfPaymentUrl}
                      alt="Proof of payment"
                      style={styles.thumbnailImage}
                      onClick={() => openImageModal(item.proofOfPaymentUrl)}
                    />
                  ) : (
                    'N/A'
                  )}
                </td>
                <td style={styles.actionsCell}>
                  <button
                    style={{...styles.actionButton, ...styles.approveButton}}
                    onClick={() => handleAction(item, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    style={{...styles.actionButton, ...styles.rejectButton}}
                    onClick={() => handleAction(item, 'reject')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {imageModalVisible && (
        <div style={styles.imageModalContainer}>
          <div style={styles.imageModalHeader}>
            <h2 style={styles.imageModalTitle}>Proof of Payment</h2>
            <button 
              onClick={() => setImageModalVisible(false)} 
              style={styles.closeButton}
            >
              ×
            </button>
          </div>
          <div style={styles.imageContent}>
            <img 
              src={selectedImageUrl} 
              alt="Enlarged proof of payment" 
              style={styles.enlargedImage} 
            />
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{...styles.modalIcon, color: '#faad14'}} />
            <p style={styles.modalText}>
              Are you sure you want to <strong>{currentAction?.toUpperCase()}</strong> this payment?
            </p>
            <div style={styles.modalButtons}>
              <button 
                style={{...styles.modalButton, ...styles.confirmButton}}
                onClick={confirmAction}
              >
                Yes
              </button>
              <button 
                style={{...styles.modalButton, ...styles.cancelButton}}
                onClick={() => setConfirmModalVisible(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            {currentAction === 'approve' ? (
              <FaCheckCircle style={{...styles.modalIcon, color: '#4CAF50'}} />
            ) : (
              <FaTimesCircle style={{...styles.modalIcon, color: '#f44336'}} />
            )}
            <p style={styles.modalText}>{successMessage}</p>
            <button 
              style={{...styles.modalButton, ...styles.confirmButton}}
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
            <FaTimesCircle style={{...styles.modalIcon, color: '#f44336'}} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button 
              style={{...styles.modalButton, ...styles.cancelButton}}
              onClick={handleErrorOk}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <div style={styles.centeredModal}>
          <FaSpinner style={styles.spinner} />
        </div>
      )}
    </div>
  );
};

export default PaymentApplications;