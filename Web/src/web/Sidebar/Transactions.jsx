import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaDownload, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaEye,
  FaMoneyBillWave,
  FaPiggyBank,
  FaHandHoldingUsd,
  FaCreditCard,
  FaUserPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileAlt,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaTimes,
  FaPrint
} from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0'
  },
  mainContainer: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  headerText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '4px'
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    width: '100%'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    flexWrap: 'wrap',
    flex: '1',
    minWidth: '0'
  },
  tabButton: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: 'transparent',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  activeTabButton: {
    backgroundColor: '#fff',
    color: '#1e40af',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tabIcon: {
    fontSize: '16px'
  },
  searchDownloadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: '10',
    flexShrink: '0'
  },
  filterContainer: {
    position: 'relative'
  },
  filterButton: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  filterButtonHover: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: '100',
    marginTop: '4px'
  },
  filterOption: {
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activeFilterOption: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontWeight: '600'
  },
  searchContainer: {
    position: 'relative',
    width: '280px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  searchInputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: '1'
  },
  downloadButton: {
    padding: '10px 12px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    width: '40px',
    height: '40px',
    flexShrink: '0'
  },
  downloadButtonHover: {
    backgroundColor: '#047857'
  },
  printButton: {
    padding: '10px 16px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  printButtonHover: {
    backgroundColor: '#b91c1c'
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '80px'
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    background: 'white',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    minWidth: '1000px'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: 'white',
    height: '56px',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  tableHeaderCell: {
    padding: '1rem 0.75rem',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.1)'
    }
  },
  sortableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
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
    whiteSpace: 'nowrap'
  },
  memberInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  memberName: {
    fontWeight: '600',
    color: '#1f2937'
  },
  memberEmail: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  transactionCount: {
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  viewButton: {
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#2563eb',
      color: 'white',
      transform: 'translateY(-1px)'
    }
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '40px'
  },
  paginationInfo: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  paginationButton: {
    padding: '4px 8px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '10px',
    minWidth: '24px',
    minHeight: '24px'
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#d1d5db'
  },
  noDataText: {
    fontSize: '16px',
    margin: 0
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
    padding: '20px',
    overflowY: 'auto'
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonHover: {
    backgroundColor: '#f1f5f9',
    color: '#374151'
  },
  modalContent: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  modalFilters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  transactionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  transactionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#2563eb',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
    }
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  transactionType: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    fontSize: '1rem'
  },
  typeIcon: {
    fontSize: '1.25rem'
  },
  typeDeposit: {
    color: '#059669'
  },
  typeLoan: {
    color: '#dc2626'
  },
  typePayment: {
    color: '#7c3aed'
  },
  typeWithdrawal: {
    color: '#d97706'
  },
  typeRegistration: {
    color: '#0369a1'
  },
  transactionDate: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  transactionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '600'
  },
  amountValue: {
    fontSize: '1rem',
    fontWeight: '700'
  },
  printModalContent: {
    padding: '24px',
    textAlign: 'center'
  },
  printOption: {
    padding: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '12px',
    width: '100%'
  },
  printOptionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  printOptionText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  printOptionDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0'
  }
};

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState({});
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [activeTransactionFilter, setActiveTransactionFilter] = useState('all');
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const pageSize = 10;

  // Tab configuration
  const tabs = [
    { 
      key: 'all', 
      label: 'All Transactions', 
      icon: FaFileAlt,
      color: '#1e40af'
    },
    { 
      key: 'deposits', 
      label: 'Deposits', 
      icon: FaPiggyBank,
      color: '#059669'
    },
    { 
      key: 'loans', 
      label: 'Loans', 
      icon: FaHandHoldingUsd,
      color: '#dc2626'
    },
    { 
      key: 'payments', 
      label: 'Payments', 
      icon: FaCreditCard,
      color: '#7c3aed'
    },
    { 
      key: 'withdrawals', 
      label: 'Withdrawals', 
      icon: FaMoneyBillWave,
      color: '#d97706'
    }
  ];

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .hover-lift:hover {
        transform: translateY(-2px);
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)';
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    // Set up real-time listeners for all transaction types
    const depositsRef = database.ref('Transactions/Deposits');
    const loansRef = database.ref('Transactions/Loans');
    const withdrawalsRef = database.ref('Transactions/Withdrawals');
    const paymentsRef = database.ref('Transactions/Payments');
    const registrationsRef = database.ref('Transactions/Registrations');
    const membersRef = database.ref('Members');

    const processTransactions = (data, type) => {
      if (!data.exists()) return;
      
      const transactionsData = data.val();
      setTransactions(prev => {
        const newTransactions = {...prev};
        
        Object.keys(transactionsData).forEach(memberId => {
          if (!newTransactions[memberId]) {
            newTransactions[memberId] = [];
          }
          
          Object.keys(transactionsData[memberId]).forEach(transactionId => {
            const details = transactionsData[memberId][transactionId];
            const status = (details.status || '').toLowerCase();
            // Only include approved transactions to match the App
            if (status !== 'approved') {
              return;
            }
            // Check if transaction already exists
            const exists = newTransactions[memberId].some(
              t => t.transactionId === transactionId && t.type === type
            );
            
            if (!exists) {
              newTransactions[memberId].push({
                ...details,
                type,
                transactionId,
              });
            }
          });
        });
        
        return newTransactions;
      });
    };

    const depositsListener = depositsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Deposits');
      setLoading(false);
    });

    const loansListener = loansRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Loans');
      setLoading(false);
    });

    const withdrawalsListener = withdrawalsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Withdrawals');
      setLoading(false);
    });

    const paymentsListener = paymentsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Payments');
      setLoading(false);
    });

    const registrationsListener = registrationsRef.on('value', (snapshot) => {
      processTransactions(snapshot, 'Registrations');
      setLoading(false);
    });

    const membersListener = membersRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        setMembers(snapshot.val());
      }
    });

    return () => {
      // Clean up listeners
      depositsRef.off('value', depositsListener);
      loansRef.off('value', loansListener);
      withdrawalsRef.off('value', withdrawalsListener);
      paymentsRef.off('value', paymentsListener);
      registrationsRef.off('value', registrationsListener);
      membersRef.off('value', membersListener);
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Deposits': return FaPiggyBank;
      case 'Loans': return FaHandHoldingUsd;
      case 'Payments': return FaCreditCard;
      case 'Withdrawals': return FaMoneyBillWave;
      case 'Registrations': return FaUserPlus;
      default: return FaMoneyBillWave;
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Deposits': return styles.typeDeposit;
      case 'Loans': return styles.typeLoan;
      case 'Payments': return styles.typePayment;
      case 'Withdrawals': return styles.typeWithdrawal;
      case 'Registrations': return styles.typeRegistration;
      default: return {};
    }
  };

  const handlePrint = (format = 'print') => {
    setPrinting(true);
    
    try {
      const sectionTitle = 
        activeTransactionFilter === 'all' ? 'All Transactions' :
        activeTransactionFilter === 'deposits' ? 'Deposit Transactions' :
        activeTransactionFilter === 'loans' ? 'Loan Transactions' :
        activeTransactionFilter === 'payments' ? 'Payment Transactions' :
        'Withdrawal Transactions';

      // Get the data that's currently displayed in the table (paginated)
      const displayedData = paginatedData;

      const printContent = document.createElement('div');
      printContent.className = 'print-content';
      printContent.style.padding = '20px';
      printContent.style.fontFamily = 'Arial, sans-serif';

      // Header
      const header = document.createElement('div');
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '10px';
      header.style.marginBottom = '20px';
      
      const title = document.createElement('h1');
      title.textContent = `${sectionTitle} Report`;
      title.style.margin = '0';
      title.style.color = '#333';
      
      const date = document.createElement('p');
      date.textContent = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      date.style.margin = '5px 0 0 0';
      date.style.color = '#666';
      
      const count = document.createElement('p');
      count.textContent = `Displayed Records: ${displayedData.length} (Page ${currentPage + 1} of ${Math.ceil(filteredMembers.length / pageSize)})`;
      count.style.margin = '5px 0 0 0';
      count.style.color = '#666';
      
      header.appendChild(title);
      header.appendChild(date);
      header.appendChild(count);
      printContent.appendChild(header);

      // Table
      if (displayedData.length > 0) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';

        // Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f8f9fa';
        
        const headers = ['Member ID', 'Member Name', 'Email', 'Transaction Count', 'Latest Transaction Type', 'Latest Amount', 'Latest Date'];
        
        // Create header cells
        headers.forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          th.style.padding = '12px 8px';
          th.style.border = '1px solid #ddd';
          th.style.textAlign = 'left';
          th.style.fontWeight = 'bold';
          th.style.backgroundColor = '#e9ecef';
          headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body
        const tbody = document.createElement('tbody');
        displayedData.forEach((memberId, index) => {
          const member = members[memberId];
          const memberTransactions = transactions[memberId] || [];
          
          // Filter transactions by active tab
          const filteredTransactions = activeTransactionFilter === 'all' 
            ? memberTransactions 
            : memberTransactions.filter(tx => {
                const transactionType = tx.type.toLowerCase();
                switch (activeTransactionFilter) {
                  case 'deposits': return transactionType === 'deposits';
                  case 'loans': return transactionType === 'loans';
                  case 'payments': return transactionType === 'payments';
                  case 'withdrawals': return transactionType === 'withdrawals';
                  default: return true;
                }
              });

          const latestTransaction = filteredTransactions
            .sort((a, b) => {
              const dateA = a.dateApproved || a.dateApplied || '';
              const dateB = b.dateApproved || b.dateApplied || '';
              return dateB.localeCompare(dateA);
            })[0];

          const row = document.createElement('tr');
          row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
          
          // Member ID
          const tdId = document.createElement('td');
          tdId.textContent = memberId;
          tdId.style.padding = '10px 8px';
          tdId.style.border = '1px solid #ddd';
          tdId.style.fontSize = '12px';
          row.appendChild(tdId);

          // Member Name
          const tdName = document.createElement('td');
          tdName.textContent = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
          tdName.style.padding = '10px 8px';
          tdName.style.border = '1px solid #ddd';
          tdName.style.fontSize = '12px';
          row.appendChild(tdName);

          // Email
          const tdEmail = document.createElement('td');
          tdEmail.textContent = member?.email || 'N/A';
          tdEmail.style.padding = '10px 8px';
          tdEmail.style.border = '1px solid #ddd';
          tdEmail.style.fontSize = '12px';
          row.appendChild(tdEmail);

          // Transaction Count
          const tdCount = document.createElement('td');
          tdCount.textContent = filteredTransactions.length;
          tdCount.style.padding = '10px 8px';
          tdCount.style.border = '1px solid #ddd';
          tdCount.style.fontSize = '12px';
          tdCount.style.textAlign = 'center';
          row.appendChild(tdCount);

          // Latest Transaction Type
          const tdType = document.createElement('td');
          tdType.textContent = latestTransaction?.type || 'N/A';
          tdType.style.padding = '10px 8px';
          tdType.style.border = '1px solid #ddd';
          tdType.style.fontSize = '12px';
          row.appendChild(tdType);

          // Latest Amount
          const tdAmount = document.createElement('td');
          if (latestTransaction) {
            const amount = latestTransaction.amountToBeDeposited || 
                          latestTransaction.loanAmount || 
                          latestTransaction.amount || 
                          latestTransaction.amountWithdrawn || 
                          latestTransaction.amountToBePaid;
            tdAmount.textContent = formatCurrency(amount);
          } else {
            tdAmount.textContent = 'N/A';
          }
          tdAmount.style.padding = '10px 8px';
          tdAmount.style.border = '1px solid #ddd';
          tdAmount.style.fontSize = '12px';
          row.appendChild(tdAmount);

          // Latest Date
          const tdDate = document.createElement('td');
          tdDate.textContent = latestTransaction ? 
            formatDate(latestTransaction.dateApproved || latestTransaction.dateApplied) : 
            'N/A';
          tdDate.style.padding = '10px 8px';
          tdDate.style.border = '1px solid #ddd';
          tdDate.style.fontSize = '12px';
          row.appendChild(tdDate);
          
          tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        printContent.appendChild(table);
      } else {
        const noData = document.createElement('p');
        noData.textContent = 'No data available';
        noData.style.textAlign = 'center';
        noData.style.color = '#666';
        noData.style.fontStyle = 'italic';
        printContent.appendChild(noData);
      }

      if (format === 'pdf') {
        // For PDF, we'll use browser's print to PDF functionality
        document.body.appendChild(printContent);
        window.print();
        document.body.removeChild(printContent);
      } else if (format === 'word') {
        // For Word, create a simple HTML file that can be opened in Word
        const htmlContent = `
          <html>
            <head>
              <title>${sectionTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                h1 { color: #333; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Export to Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sectionTitle);

        if (displayedData.length > 0) {
          // Define headers for Excel
          const excelHeaders = [
            'Member ID', 
            'Member Name', 
            'Email', 
            'Transaction Count', 
            'Latest Transaction Type', 
            'Latest Amount', 
            'Latest Date'
          ];

          worksheet.addRow(excelHeaders);

          displayedData.forEach(memberId => {
            const member = members[memberId];
            const memberTransactions = transactions[memberId] || [];
            
            // Filter transactions by active tab
            const filteredTransactions = activeTransactionFilter === 'all' 
              ? memberTransactions 
              : memberTransactions.filter(tx => {
                  const transactionType = tx.type.toLowerCase();
                  switch (activeTransactionFilter) {
                    case 'deposits': return transactionType === 'deposits';
                    case 'loans': return transactionType === 'loans';
                    case 'payments': return transactionType === 'payments';
                    case 'withdrawals': return transactionType === 'withdrawals';
                    default: return true;
                  }
                });

            const latestTransaction = filteredTransactions
              .sort((a, b) => {
                const dateA = a.dateApproved || a.dateApplied || '';
                const dateB = b.dateApproved || b.dateApplied || '';
                return dateB.localeCompare(dateA);
              })[0];

            const row = [
              memberId,
              member ? `${member.firstName} ${member.lastName}` : 'Unknown Member',
              member?.email || 'N/A',
              filteredTransactions.length,
              latestTransaction?.type || 'N/A'
            ];

            if (latestTransaction) {
              const amount = latestTransaction.amountToBeDeposited || 
                            latestTransaction.loanAmount || 
                            latestTransaction.amount || 
                            latestTransaction.amountWithdrawn || 
                            latestTransaction.amountToBePaid;
              row.push(parseFloat(amount) || 0);
              row.push(latestTransaction.dateApproved || latestTransaction.dateApplied || '');
            } else {
              row.push(0);
              row.push('N/A');
            }

            worksheet.addRow(row);
          });
        }

        workbook.xlsx.writeBuffer().then(buffer => {
          const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        });
      } else {
        // Direct print
        document.body.appendChild(printContent);
        window.print();
        document.body.removeChild(printContent);
      }

      setPrintModalVisible(false);
    } catch (error) {
      console.error('Error printing data:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (filteredMembers.length === 0) {
        console.log('No data to download');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      worksheet.columns = [
        { header: 'Member ID', key: 'memberId', width: 20 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Transaction Count', key: 'transactionCount', width: 20 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1e3a8a' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      filteredMembers.forEach(memberId => {
        const member = members[memberId];
        const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
        const email = member?.email || 'N/A';
        const transactionCount = transactions[memberId]?.length || 0;
        const totalAmount = transactions[memberId]?.reduce((sum, tx) => {
          const amount = tx.amountToBeDeposited || tx.loanAmount || tx.amount || tx.amountWithdrawn || tx.amountToBePaid || 0;
          return sum + (parseFloat(amount) || 0);
        }, 0) || 0;

        worksheet.addRow({
          memberId,
          name,
          email,
          transactionCount,
          totalAmount: formatCurrency(totalAmount)
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Transactions_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return FaSort;
    return sortConfig.direction === 'asc' ? FaSortUp : FaSortDown;
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setCurrentPage(0);
  };

  const handleTabSwitch = (section) => {
    setActiveTransactionFilter(section);
    setCurrentPage(0);
  };

  const handleMouseEnter = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: true }));
  };

  const handleMouseLeave = (element) => {
    setIsHovered(prev => ({ ...prev, [element]: false }));
  };

  // Filter members based on active tab and search query
  const filteredMembers = Object.keys(transactions)
    .filter(memberId => {
      const member = members[memberId];
      if (!member) return false;

      const searchLower = searchQuery.toLowerCase();
      const name = `${member.firstName} ${member.middleName || ''} ${member.lastName}`.toLowerCase();
      const email = member.email?.toLowerCase() || '';
      
      const searchMatch = memberId.toLowerCase().includes(searchLower) ||
        name.includes(searchLower) ||
        email.includes(searchLower);

      if (!searchMatch) return false;

      // Filter by transaction type tab
      if (activeTransactionFilter !== 'all') {
        const memberTransactions = transactions[memberId] || [];
        const hasMatchingTransaction = memberTransactions.some(tx => {
          const transactionType = tx.type.toLowerCase();
          switch (activeTransactionFilter) {
            case 'deposits': return transactionType === 'deposits';
            case 'loans': return transactionType === 'loans';
            case 'payments': return transactionType === 'payments';
            case 'withdrawals': return transactionType === 'withdrawals';
            default: return true;
          }
        });
        return hasMatchingTransaction;
      }

      return true;
    })
    .sort((a, b) => {
      const memberA = members[a];
      const memberB = members[b];
      
      if (sortConfig.key === 'name') {
        const nameA = `${memberA?.firstName} ${memberA?.lastName}`.toLowerCase();
        const nameB = `${memberB?.firstName} ${memberB?.lastName}`.toLowerCase();
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      
      if (sortConfig.key === 'transactions') {
        const countA = transactions[a]?.length || 0;
        const countB = transactions[b]?.length || 0;
        return sortConfig.direction === 'asc' ? countA - countB : countB - countA;
      }
      
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedData = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.safeAreaView}>
      <div style={styles.mainContainer}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.headerText}>Transaction Management</h1>
            <p style={styles.headerSubtitle}>
              Monitor and manage all member transactions
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.controlsRow}>
            {/* Tabs - Left side */}
            <div style={styles.tabContainer}>
              {tabs.map((tab) => {
                const isActive = activeTransactionFilter === tab.key;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabSwitch(tab.key)}
                    style={{
                      ...styles.tabButton,
                      ...(isActive ? styles.activeTabButton : {})
                    }}
                    className="hover-lift"
                  >
                    <IconComponent style={styles.tabIcon} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search, Download, Print - Right side */}
            <div style={styles.searchDownloadContainer}>
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  style={{
                    ...styles.searchInput,
                    ...(isHovered.search ? styles.searchInputFocus : {})
                  }}
                  placeholder="Search by member ID, name, or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => handleMouseEnter('search')}
                  onBlur={() => handleMouseLeave('search')}
                />
              </div>

              <button 
                style={{
                  ...styles.printButton,
                  ...(isHovered.print ? styles.printButtonHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('print')}
                onMouseLeave={() => handleMouseLeave('print')}
                onClick={() => setPrintModalVisible(true)}
                title="Print/Export Options"
              >
                <FaPrint />
              </button>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div style={styles.dataContainer}>
          {/* Pagination at the top */}
          {filteredMembers.length > 0 && (
            <div style={styles.paginationContainer}>
              <span style={styles.paginationInfo}>
               {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredMembers.length)} of {filteredMembers.length} 
              </span>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 0 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages - 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* Table Content */}
          {filteredMembers.length === 0 ? (
            <div style={styles.noDataContainer}>
              <FaFileAlt style={styles.noDataIcon} />
              <p style={styles.noDataText}>
                {searchQuery ? 'No transactions match your search' : 'No transaction data available'}
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>
                      <div 
                        style={styles.sortableHeader}
                        onClick={() => handleSort('name')}
                      >
                        Member ID
                        {React.createElement(getSortIcon('name'))}
                      </div>
                    </th>
                    <th style={{ ...styles.tableHeaderCell, width: '25%' }}>Member Information</th>
                    <th style={{ ...styles.tableHeaderCell, width: '15%' }}>
                      <div 
                        style={styles.sortableHeader}
                        onClick={() => handleSort('transactions')}
                      >
                        Transaction Count
                        {React.createElement(getSortIcon('transactions'))}
                      </div>
                    </th>
                    <th style={{ ...styles.tableHeaderCell, width: '20%' }}>Latest Transaction</th>
                    <th style={{ ...styles.tableHeaderCell, width: '25%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((memberId) => {
                    const member = members[memberId];
                    const memberTransactions = transactions[memberId] || [];
                    
                    // Filter transactions by active tab
                    const filteredTransactions = activeTransactionFilter === 'all' 
                      ? memberTransactions 
                      : memberTransactions.filter(tx => {
                          const transactionType = tx.type.toLowerCase();
                          switch (activeTransactionFilter) {
                            case 'deposits': return transactionType === 'deposits';
                            case 'loans': return transactionType === 'loans';
                            case 'payments': return transactionType === 'payments';
                            case 'withdrawals': return transactionType === 'withdrawals';
                            default: return true;
                          }
                        });

                    const latestTransaction = filteredTransactions
                      .sort((a, b) => {
                        const dateA = a.dateApproved || a.dateApplied || '';
                        const dateB = b.dateApproved || b.dateApplied || '';
                        return dateB.localeCompare(dateA);
                      })[0];

                    return (
                      <tr key={memberId} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <strong>#{memberId}</strong>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.memberInfo}>
                            <div style={styles.memberName}>
                              {member?.firstName} {member?.lastName}
                            </div>
                            <div style={styles.memberEmail}>
                              {member?.email || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.transactionCount}>
                            {filteredTransactions.length} transactions
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {latestTransaction ? (
                            <div style={styles.memberInfo}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {latestTransaction.type}
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                                {formatCurrency(
                                  latestTransaction.amountToBeDeposited || 
                                  latestTransaction.loanAmount || 
                                  latestTransaction.amount || 
                                  latestTransaction.amountWithdrawn || 
                                  latestTransaction.amountToBePaid
                                )}
                              </div>
                              <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                                {formatDate(latestTransaction.dateApproved || latestTransaction.dateApplied)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No transactions</span>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <button 
                            style={styles.viewButton}
                            onClick={() => {
                              setSelectedMember({
                                id: memberId,
                                name: `${member?.firstName} ${member?.lastName}`,
                                email: member?.email,
                                transactions: memberTransactions
                              });
                              setMemberModalVisible(true);
                            }}
                          >
                            <FaEye />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Print Modal */}
        {printModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setPrintModalVisible(false)}>
            <div style={{...styles.modalCard, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Print/Export Options</h2>
                <button 
                  onClick={() => setPrintModalVisible(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closePrintModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closePrintModal')}
                  onMouseLeave={() => handleMouseLeave('closePrintModal')}
                  disabled={printing}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={styles.printModalContent}>
                <p style={{margin: '0 0 20px 0', color: '#64748b'}}>
                  Choose how you want to export the currently displayed {paginatedData.length} records:
                </p>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printDirect ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printDirect')}
                  onMouseLeave={() => handleMouseLeave('printDirect')}
                  onClick={() => handlePrint('print')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Print Directly</p>
                  <p style={styles.printOptionDescription}>
                    Send directly to your printer
                  </p>
                </button>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printPDF ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printPDF')}
                  onMouseLeave={() => handleMouseLeave('printPDF')}
                  onClick={() => handlePrint('pdf')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Save as PDF</p>
                  <p style={styles.printOptionDescription}>
                    Download as PDF file
                  </p>
                </button>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printWord ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printWord')}
                  onMouseLeave={() => handleMouseLeave('printWord')}
                  onClick={() => handlePrint('word')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Export to Word</p>
                  <p style={styles.printOptionDescription}>
                    Download as Word document
                  </p>
                </button>

                <button
                  style={{
                    ...styles.printOption,
                    ...(isHovered.printExcel ? styles.printOptionHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('printExcel')}
                  onMouseLeave={() => handleMouseLeave('printExcel')}
                  onClick={() => handlePrint('excel')}
                  disabled={printing}
                >
                  <p style={styles.printOptionText}>Export to Excel</p>
                  <p style={styles.printOptionDescription}>
                    Download as Excel spreadsheet
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Transactions Modal */}
        {memberModalVisible && selectedMember && (
          <div style={styles.modalOverlay} onClick={() => setMemberModalVisible(false)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {selectedMember.name}'s Transactions
                </h2>
                <button 
                  onClick={() => setMemberModalVisible(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closeModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeModal')}
                  onMouseLeave={() => handleMouseLeave('closeModal')}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div style={styles.modalContent}>
                <div style={styles.modalFilters}>
                  <select 
                    style={{
                      ...styles.filterButton,
                      border: '1px solid #d1d5db',
                      padding: '10px 12px',
                      minWidth: '140px'
                    }}
                    value={transactionTypeFilter}
                    onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Deposits">Deposits</option>
                    <option value="Loans">Loans</option>
                    <option value="Payments">Payments</option>
                    <option value="Withdrawals">Withdrawals</option>
                    <option value="Registrations">Registrations</option>
                  </select>
                </div>

                <div style={styles.transactionGrid}>
                  {selectedMember.transactions
                    .filter(tx => transactionTypeFilter === 'All' || tx.type === transactionTypeFilter)
                    .sort((a, b) => {
                      const dateA = a.dateApproved || a.dateApplied || '';
                      const dateB = b.dateApproved || b.dateApplied || '';
                      return dateB.localeCompare(dateA);
                    })
                    .map((transaction, index) => {
                      const IconComponent = getTransactionIcon(transaction.type);
                      const amount = transaction.amountToBeDeposited || 
                                   transaction.loanAmount || 
                                   transaction.amount || 
                                   transaction.amountWithdrawn || 
                                   transaction.amountToBePaid;

                      return (
                        <div key={`${transaction.transactionId}-${index}`} style={styles.transactionCard}>
                          <div style={styles.transactionHeader}>
                            <div style={styles.transactionType}>
                              <IconComponent style={{ ...styles.typeIcon, ...getTransactionTypeColor(transaction.type) }} />
                              {transaction.type}
                            </div>
                            <div style={styles.transactionDate}>
                              {formatDate(transaction.dateApproved || transaction.dateApplied)}
                            </div>
                          </div>

                          <div style={styles.transactionDetails}>
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>Transaction ID</span>
                              <span style={styles.detailValue}>{transaction.transactionId}</span>
                            </div>
                            
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>Amount</span>
                              <span style={{ ...styles.detailValue, ...styles.amountValue }}>
                                {formatCurrency(amount)}
                              </span>
                            </div>

                            {transaction.interestRate && (
                              <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Interest Rate</span>
                                <span style={styles.detailValue}>{transaction.interestRate}%</span>
                              </div>
                            )}

                            {transaction.term && (
                              <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Term</span>
                                <span style={styles.detailValue}>{transaction.term} months</span>
                              </div>
                            )}

                            {transaction.rejectionReason && (
                              <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Rejection Reason</span>
                                <span style={{ ...styles.detailValue, color: '#dc2626' }}>
                                  {transaction.rejectionReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {selectedMember.transactions.filter(tx => 
                    transactionTypeFilter === 'All' || tx.type === transactionTypeFilter
                  ).length === 0 && (
                    <div style={styles.noDataContainer}>
                      <FaFilter style={styles.noDataIcon} />
                      <p style={styles.noDataText}>No transactions match the selected filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;