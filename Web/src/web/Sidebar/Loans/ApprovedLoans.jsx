import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaEye,
  FaUser,
  FaMoneyBillWave,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaFileInvoiceDollar,
  FaPercent,
  FaCalendarDay,
  FaUniversity,
  FaExchangeAlt
} from 'react-icons/fa';
import { database } from '../../../../../Database/firebaseConfig';
import { SendLoanReminder } from '../../../../../Server/api';

const styles = {
  container: {
    flex: 1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #2563eb',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1500,
    backdropFilter: 'blur(4px)',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  loadingText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed'
  },
  tableHeader: {
    background: 'linear-gradient(90deg, #1E3A5F 0%, #2D5783 100%)',
    color: 'white',
    height: '56px',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  tableHeaderCell: {
    padding: '1rem 0.75rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tableRow: {
    height: '52px',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  tableCell: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center'
  },
  noDataContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '1rem',
    color: '#6b7280'
  },
  noDataIcon: {
    fontSize: '3rem',
    opacity: '0.5'
  },
  modalOverlay: {
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
    padding: '2rem',
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    background: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  closeButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.3)',
      transform: 'rotate(90deg)'
    }
  },
  modalContent: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '1.5rem'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  section: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e2e8f0'
  },
  fieldGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    padding: '0.5rem 0'
  },
  fieldLabel: {
    fontWeight: '500',
    color: '#64748b',
    fontSize: '0.875rem',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  fieldValue: {
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
    color: '#1f2937',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusActive: {
    background: '#d1fae5',
    color: '#065f46'
  },
  statusOverdue: {
    background: '#fee2e2',
    color: '#dc2626'
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginTop: '1rem'
  },
  documentCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
    }
  },
  documentImage: {
    width: '100%',
    height: '120px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginBottom: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  documentLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
    flexShrink: 0
  },
  actionButton: {
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    justifyContent: 'center'
  },
  resendButton: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
    }
  },
  disabledButton: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    opacity: '0.7',
    '&:hover': {
      transform: 'none',
      boxShadow: 'none'
    }
  },
viewButton: {
  background: 'transparent',
  color: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: '6px',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center', // Add this
  gap: '0.25rem',
  transition: 'all 0.2s ease',
  width: '40%', // Add this to take full cell width
  margin: '0 auto', // Add this for extra centering
  '&:hover': {
    background: '#2563eb',
    color: 'white'
  }
},
  modalCardSmall: {
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    border: '1px solid #F1F5F9'
  },
  confirmIcon: {
    marginBottom: '14px',
    fontSize: '28px'
  },
  modalText: {
    fontSize: '14px',
    marginBottom: '18px',
    textAlign: 'center',
    color: '#475569',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  imageViewerModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '2rem'
  },
  imageViewerContent: {
    position: 'relative',
    width: '90%',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  largeImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  imageViewerLabel: {
    color: 'white',
    fontSize: '1.125rem',
    marginTop: '1rem',
    textAlign: 'center',
    fontWeight: '500'
  },
  imageViewerNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '1rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'translateY(-50%) scale(1.1)'
    }
  },
  prevButton: {
    left: '2rem'
  },
  nextButton: {
    right: '2rem'
  },
  imageViewerClose: {
    position: 'absolute',
    top: '2rem',
    right: '2rem',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
      transform: 'scale(1.1)'
    }
  },
  financialCard: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  financialLabel: {
    fontSize: '0.875rem',
    color: '#0369a1',
    fontWeight: '500'
  },
  financialValue: {
    fontSize: '1rem',
    fontWeight: '600'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
    }
  },
  secondaryButton: {
    background: '#6b7280',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
    }
  },
  loanDetailsCard: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    border: '1px solid #7dd3fc',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  loanDetailsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  loanDetailsLabel: {
    fontSize: '0.875rem',
    color: '#0369a1',
    fontWeight: '500'
  },
  loanDetailsValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0369a1'
  },
  bankDetailsCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  bankDetailsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0'
  },
  bankDetailsLabel: {
    fontSize: '0.875rem',
    color: '#92400e',
    fontWeight: '500'
  },
  bankDetailsValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#92400e'
  },
  overdueBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #FECACA'
  },
  overdueDate: {
    color: '#EF4444',
    fontWeight: '600'
  }
};

const ApprovedLoans = ({ currentPage, totalPages, onPageChange }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState({ url: '', label: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState([]);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [activeLoansData, setActiveLoansData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    fetchActiveLoansData();
    
    // Set up automatic loan reminder checking
    console.log('Setting up automatic loan reminder system...');
    
    // Run immediately when component mounts
    checkDueDates();
    
    // Check once per day (24 hours) - production frequency
    const checkInterval = setInterval(checkDueDates, 24 * 60 * 60 * 1000);
    
    // Clean up interval when component unmounts
    return () => {
      console.log('Clearing loan reminder check interval');
      clearInterval(checkInterval);
    };
  }, []);

  // Automatic Loan Reminder Functionality
const checkDueDates = async () => {
  try {
    console.log('Checking due dates for loan reminders...');
    const now = new Date();
    
    // Fetch reminder window (days) from Settings
    const settingsSnap = await database.ref('Settings/LoanReminderDays').once('value');
    const reminderDays = parseInt(settingsSnap.val() ?? 7, 10);
    const windowMs = Math.max(0, reminderDays) * 24 * 60 * 60 * 1000;
    const reminderWindowDate = new Date(now.getTime() + windowMs);
    
    // Format dates for logging
    const formattedNow = now.toISOString();
    const formattedWindow = reminderWindowDate.toISOString();
    console.log(`Current date: ${formattedNow}`);
    console.log(`Reminder window end (+${reminderDays}d): ${formattedWindow}`);
    
    const loansRef = database.ref('Loans/CurrentLoans');
    const loansSnapshot = await loansRef.once('value');
    const loansData = loansSnapshot.val() || {};
    
    const approvedLoansRef = database.ref('Loans/ApprovedLoans');
    const approvedLoansSnapshot = await approvedLoansRef.once('value');
    const approvedLoansData = approvedLoansSnapshot.val() || {};
    
    const membersRef = database.ref('Members');
    const membersSnapshot = await membersRef.once('value');
    const membersData = membersSnapshot.val() || {};

    const notificationsRef = database.ref('LoanNotifications');
    const notificationsSnapshot = await notificationsRef.once('value');
    const notificationsData = notificationsSnapshot.val() || {};

    console.log(`Found ${Object.keys(loansData).length} members with loans`);
    
    let remindersSent = 0;
    let loansChecked = 0;

    for (const [memberId, loans] of Object.entries(loansData)) {
      for (const [transactionId, currentLoan] of Object.entries(loans)) {
        loansChecked++;
        
        if (!currentLoan.dueDate) {
          console.log(`Loan ${transactionId} for member ${memberId} has no due date`);
          continue;
        }
        
        // Parse the due date properly
        const dueDate = new Date(currentLoan.dueDate);
        
        // Log the due date for debugging
        console.log(`Loan ${transactionId} for member ${memberId} has due date: ${dueDate.toISOString()}`);
        
        // FIXED: Use startOfDay for proper date comparison
        const dueDateStart = startOfDay(dueDate);
        const nowStart = startOfDay(now);
        const reminderWindowStart = startOfDay(reminderWindowDate);
        
        // FIXED: Check if the due date is within the configured reminder window
        // We want to send reminders for due dates that are between today and the reminder window
        const isWithinWindow = dueDateStart >= nowStart && dueDateStart <= reminderWindowStart;
        console.log(`Is within reminder window: ${isWithinWindow} (Due: ${dueDateStart.toISOString()}, Now: ${nowStart.toISOString()}, Window: ${reminderWindowStart.toISOString()})`);
        
        if (isWithinWindow) {
          const notificationKey = `${memberId}_${transactionId}`;
          const hasBeenNotified = notificationsData && notificationsData[notificationKey];
          
          console.log(`Notification status for ${notificationKey}: ${hasBeenNotified ? 'Already sent' : 'Not sent yet'}`);
          
          // Only send if no notification has been sent yet
          if (!hasBeenNotified) {
            const member = membersData[memberId];
            const approvedLoan = approvedLoansData[memberId]?.[transactionId];
            
            if (member && member.email) {
              try {
                console.log(`Sending reminder to ${member.email} for loan ${transactionId}`);
                
                let outstandingBalance = parseFloat(currentLoan.loanAmount) || 0;
                const originalAmount = approvedLoan 
                  ? parseFloat(approvedLoan.loanAmount) || 0 
                  : outstandingBalance;

                await SendLoanReminder({
                  memberId,
                  transactionId,
                  dueDate: currentLoan.dueDate,
                  email: member.email,
                  firstName: member.firstName,
                  lastName: member.lastName,
                  loanAmount: originalAmount,
                  outstandingBalance: outstandingBalance
                });

                // Record that we've sent a notification
                await notificationsRef.child(notificationKey).set({
                  sentAt: new Date().toISOString(),
                  dueDate: currentLoan.dueDate,
                  reminderDays: reminderDays
                });
                
                remindersSent++;
                console.log(`Successfully sent reminder for loan ${transactionId}`);
              } catch (error) {
                console.error(`Failed to send reminder for ${memberId}/${transactionId}:`, error);
              }
            } else {
              console.log(`Member ${memberId} has no email or member data not found`);
            }
          }
        }
      }
    }
    
    console.log(`Checked ${loansChecked} loans, sent ${remindersSent} reminders`);
  } catch (error) {
    console.error('Error checking due dates:', error);
  }
};

  const fetchActiveLoansData = async () => {
    try {
      setLoading(true);
      const [currentLoansSnapshot, approvedLoansSnapshot, membersSnapshot] = await Promise.all([
        database.ref('Loans/CurrentLoans').once('value'),
        database.ref('Loans/ApprovedLoans').once('value'),
        database.ref('Members').once('value')
      ]);

      const currentLoansData = currentLoansSnapshot.val() || {};
      const approvedLoansData = approvedLoansSnapshot.val() || {};
      const membersData = membersSnapshot.val() || {};
      
      const loanItems = [];

      Object.entries(currentLoansData).forEach(([memberId, loans]) => {
        Object.entries(loans).forEach(([transactionId, loan]) => {
          const outstandingBalance = parseFloat(loan.loanAmount) || 0;
          const originalLoan = approvedLoansData[memberId]?.[transactionId];
          const originalAmount = originalLoan ? parseFloat(originalLoan.loanAmount) || 0 : outstandingBalance;
          const member = membersData[memberId] || {};
          
          const term = loan.term || 'N/A';
          const interest = parseFloat(loan.interest) || 0;
          const monthlyPayment = parseFloat(loan.monthlyPayment) || 0;
          const totalMonthlyPayment = parseFloat(loan.totalMonthlyPayment) || 0;
          const totalTermPayment = parseFloat(loan.totalTermPayment) || 0;
          const dueDate = loan.dueDate || 'N/A';
          const dueDateObj = dueDate !== 'N/A' ? new Date(dueDate) : null;
          const isOverdue = dueDateObj && new Date() > dueDateObj;
          
          loanItems.push({
            memberId,
            transactionId,
            firstName: member.firstName || 'N/A',
            lastName: member.lastName || 'N/A',
            email: member.email || 'N/A',
            phoneNumber: member.phoneNumber || 'N/A',
            loanAmount: originalAmount,
            outstandingBalance,
            term,
            interest,
            monthlyPayment,
            totalMonthlyPayment,
            totalTermPayment,
            dueDate,
            isOverdue,
            // Include approved loan details for modal
            dateApproved: originalLoan?.dateApproved || 'N/A',
            interestRate: originalLoan?.interestRate || 'N/A',
            releaseAmount: originalLoan?.releaseAmount || 'N/A',
            processingFee: originalLoan?.processingFee || 0,
            totalInterest: originalLoan?.totalInterest || 0,
            accountName: originalLoan?.accountName || 'N/A',
            accountNumber: originalLoan?.accountNumber || 'N/A',
            disbursement: originalLoan?.disbursement || 'N/A',
            proofOfIncomeUrl: originalLoan?.proofOfIncomeUrl || '',
            proofOfIdentityUrl: originalLoan?.proofOfIdentityUrl || ''
          });
        });
      });

      setActiveLoansData(loanItems);
    } catch (error) {
      console.error('Error fetching active loans data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (typeof dateInput === 'string') {
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        return dateInput;
      }
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    let due = typeof dueDate === 'string' ? new Date(dueDate) : new Date(dueDate);
    if (isNaN(due.getTime())) return 0;
    const today = startOfDay(new Date());
    const dueStart = startOfDay(due);
    if (today <= dueStart) return 0;
    const ms = today.getTime() - dueStart.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const computePenaltyAndNewTotal = (loan) => {
    const overdueDays = getOverdueDays(loan.dueDate);
    const interest = parseFloat(loan.interest) || 0;
    const penalty = overdueDays > 0 ? (interest * (overdueDays / 30)) : 0;
    const monthly = parseFloat(loan.totalMonthlyPayment) || 0;
    const newTotalMonthly = monthly + penalty;
    return { overdueDays, penalty, newTotalMonthly };
  };

  const openModal = (loan) => {
    setSelectedLoan(loan);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorModalVisible(false);
    setSuccessMessageModalVisible(false);
  };

  const openImageViewer = (url, label, index) => {
    const images = [];
    
    if (url) {
      images.push({ 
        url, 
        label 
      });
    }

    setAvailableImages(images);
    setCurrentImage({ url, label });
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setCurrentImage({ url: '', label: '' });
    setCurrentImageIndex(0);
  };

  const navigateImages = (direction) => {
    if (availableImages.length === 0) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = (currentImageIndex - 1 + availableImages.length) % availableImages.length;
    } else {
      newIndex = (currentImageIndex + 1) % availableImages.length;
    }

    setCurrentImageIndex(newIndex);
    setCurrentImage(availableImages[newIndex]);
  };

  const handleResendClick = () => {
    setShowResendConfirmation(true);
  };

  const confirmResendReminder = async () => {
    setShowResendConfirmation(false);
    setActionInProgress(true);
    
    try {
      const membersRef = database.ref(`Members/${selectedLoan.memberId}`);
      const membersSnapshot = await membersRef.once('value');
      const member = membersSnapshot.val();

      if (member && member.email) {
        await SendLoanReminder({
          memberId: selectedLoan.memberId,
          transactionId: selectedLoan.transactionId,
          dueDate: selectedLoan.dueDate,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          loanAmount: selectedLoan.loanAmount,
          outstandingBalance: selectedLoan.outstandingBalance
        });

        const notificationKey = `${selectedLoan.memberId}_${selectedLoan.transactionId}`;
        const updates = {
          resentAt: new Date().toISOString()
        };
        
        if (database.ServerValue && database.ServerValue.increment) {
          updates.resendCount = database.ServerValue.increment(1);
        } else {
          const notificationRef = database.ref(`LoanNotifications/${notificationKey}`);
          const notificationSnap = await notificationRef.once('value');
          const currentCount = notificationSnap.val()?.resendCount || 0;
          updates.resendCount = currentCount + 1;
        }

        await database.ref(`LoanNotifications/${notificationKey}`).update(updates);
        
        setSuccessMessage('Reminder resent successfully!');
        setSuccessMessageModalVisible(true);
      } else {
        setErrorMessage('Member email not found');
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error('Error resending reminder:', error);
      setErrorMessage('Failed to resend reminder');
      setErrorModalVisible(true);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div>Loading active loans...</div>
      </div>
    );
  }

  if (!activeLoansData || activeLoansData.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <FaMoneyBillWave style={styles.noDataIcon} />
        <div>No active loans available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Active Loans Portfolio Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Member ID</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Full Name</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Loan Amount</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Outstanding</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Due Date</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Status</th>
              <th style={{ ...styles.tableHeaderCell, width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeLoansData.map((loan, index) => {
              const { penalty, newTotalMonthly } = computePenaltyAndNewTotal(loan);
              
              return (
                <tr key={index} style={styles.tableRow}>
                  <td style={styles.tableCell}>{loan.memberId}</td>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: '500' }}>
                      {loan.firstName} {loan.lastName}
                    </div>
                  </td>
                  <td style={styles.tableCell}>₱{formatCurrency(loan.loanAmount)}</td>
                  <td style={styles.tableCell}>₱{formatCurrency(loan.outstandingBalance)}</td>
                  <td style={styles.tableCell}>
                    <span style={loan.isOverdue ? styles.overdueDate : null}>
                      {formatDisplayDate(loan.dueDate)}
                    </span>
         
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(loan.isOverdue ? styles.statusOverdue : styles.statusActive)
                    }}>
                      {loan.isOverdue ? 'overdue' : 'active'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <button 
                      style={styles.viewButton}
                      onClick={() => openModal(loan)}
                    >
                      <FaEye />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loan Details Modal */}
      {modalVisible && selectedLoan && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FaCheckCircle />
                Loan Details - {selectedLoan.transactionId}
              </h2>
              <button 
                style={styles.closeButton}
                onClick={closeModal}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.columnsContainer}>
                {/* Left Column - Member Information */}
                <div style={styles.column}>
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaUser />
                      Member Information
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Member ID:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.memberId || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaUser />
                        Full Name:
                      </span>
                      <span style={styles.fieldValue}>
                        {selectedLoan.firstName} {selectedLoan.lastName}
                      </span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>
                        <FaEnvelope />
                        Email:
                      </span>
                      <span style={styles.fieldValue}>{selectedLoan.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaCalendarAlt />
                      Loan Timeline
                    </h3>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Date Approved:</span>
                      <span style={styles.fieldValue}>{selectedLoan.dateApproved || 'N/A'}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Due Date:</span>
                      <span style={styles.fieldValue}>{formatDisplayDate(selectedLoan.dueDate)}</span>
                    </div>
                    <div style={styles.fieldGroup}>
                      <span style={styles.fieldLabel}>Status:</span>
                      <span style={{
                        ...styles.statusBadge,
                        ...(selectedLoan.isOverdue ? styles.statusOverdue : styles.statusActive)
                      }}>
                        {selectedLoan.isOverdue ? 'overdue' : 'active'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.bankDetailsCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaUniversity />
                      Bank Details
                    </h3>
                    <div style={styles.bankDetailsItem}>
                      <span style={styles.bankDetailsLabel}>Account Name:</span>
                      <span style={styles.bankDetailsValue}>{selectedLoan.accountName || 'N/A'}</span>
                    </div>
                    <div style={styles.bankDetailsItem}>
                      <span style={styles.bankDetailsLabel}>Account Number:</span>
                      <span style={styles.bankDetailsValue}>{selectedLoan.accountNumber || 'N/A'}</span>
                    </div>
                    <div style={styles.bankDetailsItem}>
                      <span style={styles.bankDetailsLabel}>Disbursement:</span>
                      <span style={styles.bankDetailsValue}>{selectedLoan.disbursement || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Loan & Financial Details */}
                <div style={styles.column}>
                  <div style={styles.loanDetailsCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaMoneyBillWave />
                      Loan Information
                    </h3>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Transaction ID:</span>
                      <span style={styles.loanDetailsValue}>{selectedLoan.transactionId || 'N/A'}</span>
                    </div>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Loan Amount:</span>
                      <span style={styles.loanDetailsValue}>
                        ₱{formatCurrency(selectedLoan.loanAmount)}
                      </span>
                    </div>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Outstanding Balance:</span>
                      <span style={styles.loanDetailsValue}>
                        ₱{formatCurrency(selectedLoan.outstandingBalance)}
                      </span>
                    </div>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Term:</span>
                      <span style={styles.loanDetailsValue}>{selectedLoan.term}</span>
                    </div>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Interest Rate:</span>
                      <span style={styles.loanDetailsValue}>{selectedLoan.interestRate || 'N/A'}%</span>
                    </div>
                    <div style={styles.loanDetailsItem}>
                      <span style={styles.loanDetailsLabel}>Interest:</span>
                      <span style={styles.loanDetailsValue}>
                        ₱{formatCurrency(selectedLoan.interest)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.financialCard}>
                    <h3 style={styles.sectionTitle}>
                      <FaFileInvoiceDollar />
                      Financial Breakdown
                    </h3>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Monthly Payment:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.monthlyPayment)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Total Monthly Payment:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.totalMonthlyPayment)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Total Term Payment:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.totalTermPayment)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Release Amount:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.releaseAmount)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Processing Fee:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.processingFee)}
                      </span>
                    </div>
                    <div style={styles.financialItem}>
                      <span style={styles.financialLabel}>Total Interest:</span>
                      <span style={styles.financialValue}>
                        ₱{formatCurrency(selectedLoan.totalInterest)}
                      </span>
                    </div>
                    {(() => {
                      const { penalty, newTotalMonthly } = computePenaltyAndNewTotal(selectedLoan);
                      return (
                        <>
                          <div style={styles.financialItem}>
                            <span style={styles.financialLabel}>Penalty:</span>
                            <span style={styles.financialValue}>
                              ₱{formatCurrency(penalty)}
                            </span>
                          </div>
                          <div style={styles.financialItem}>
                            <span style={styles.financialLabel}>New Total Monthly:</span>
                            <span style={styles.financialValue}>
                              ₱{formatCurrency(newTotalMonthly)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                      <FaIdCard />
                      Submitted Documents
                    </h3>
                    <div style={styles.documentsGrid}>
                      {selectedLoan.proofOfIncomeUrl && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedLoan.proofOfIncomeUrl, 'Proof of Income', 0)}
                        >
                          <img
                            src={selectedLoan.proofOfIncomeUrl}
                            alt="Proof of Income"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Income</div>
                        </div>
                      )}
                      {selectedLoan.proofOfIdentityUrl && (
                        <div 
                          style={styles.documentCard}
                          onClick={() => openImageViewer(selectedLoan.proofOfIdentityUrl, 'Proof of Identity', 1)}
                        >
                          <img
                            src={selectedLoan.proofOfIdentityUrl}
                            alt="Proof of Identity"
                            style={styles.documentImage}
                          />
                          <div style={styles.documentLabel}>Proof of Identity</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.resendButton,
                  ...(actionInProgress ? styles.disabledButton : {})
                }}
                onClick={handleResendClick}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent', 
                      borderTop: '2px solid white', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaExchangeAlt />
                    Resend Reminder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal - Updated Design */}
      {showResendConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#1e3a8a' }} />
            <p style={styles.modalText}>
              Are you sure you want to resend the payment reminder to this member?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.primaryButton,
                  ...(actionInProgress ? styles.disabledButton : {})
                }}
                onClick={confirmResendReminder}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Processing...' : 'Yes'}
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.secondaryButton
                }}
                onClick={() => setShowResendConfirmation(false)}
                disabled={actionInProgress}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Modal - Updated Design */}
      {successMessageModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaCheckCircle style={{ ...styles.confirmIcon, color: '#10b981' }} />
            <p style={styles.modalText}>{successMessage}</p>
            <button
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }}
              onClick={() => setSuccessMessageModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Message Modal - Updated Design */}
      {errorModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <FaExclamationCircle style={{ ...styles.confirmIcon, color: '#ef4444' }} />
            <p style={styles.modalText}>{errorMessage}</p>
            <button
              style={{
                ...styles.actionButton,
                ...styles.primaryButton
              }}
              onClick={() => setErrorModalVisible(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {actionInProgress && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>
              Processing...
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewerVisible && (
        <div style={styles.imageViewerModal}>
          <div style={styles.imageViewerContent}>
            <button 
              style={{ ...styles.imageViewerNav, ...styles.prevButton }}
              onClick={() => navigateImages('prev')}
            >
              <FaChevronLeft />
            </button>
            <img
              src={currentImage.url}
              alt={currentImage.label}
              style={styles.largeImage}
            />
            <button 
              style={{ ...styles.imageViewerNav, ...styles.nextButton }}
              onClick={() => navigateImages('next')}
            >
              <FaChevronRight />
            </button>
            <button 
              style={styles.imageViewerClose}
              onClick={closeImageViewer}
            >
              <FaTimes />
            </button>
            <p style={styles.imageViewerLabel}>{currentImage.label}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedLoans;