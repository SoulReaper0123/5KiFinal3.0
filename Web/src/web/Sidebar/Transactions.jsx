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
  FaPrint,
  FaCalendarAlt
} from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { database } from '../../../../Database/firebaseConfig';
import logoImage from '../../../../assets/logo.png';

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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
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
    whiteSpace: 'nowrap',
    minWidth: '180px',
    justifyContent: 'space-between'
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
    minWidth: '200px',
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
    gap: '8px',
    borderBottom: '1px solid #f1f5f9'
  },
  activeFilterOption: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontWeight: '600'
  },
  dateFilterContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dateFilterButton: {
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
    whiteSpace: 'nowrap',
    minWidth: '180px',
    justifyContent: 'space-between'
  },
  dateFilterButtonHover: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  dateFilterDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minWidth: '200px',
    zIndex: '100',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  dateFilterOption: {
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
    gap: '8px',
    borderBottom: '1px solid #f1f5f9'
  },
  activeDateFilterOption: {
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
  dashboardLoadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '90vh',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: '16px'
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderLeft: '4px solid #1e40af',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '16px',
    fontWeight: '500'
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
    width: '100%',
    textAlign: 'center'
  },
  printOptionHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    transform: 'translateY(-1px)'
  },
  printOptionText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  printOptionDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
    textAlign: 'center'
  },
  // Custom Date Range Modal Styles
  customRangeModal: {
    maxWidth: '400px'
  },
  dateRangeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px'
  },
  dateInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  dateInputLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  dateInput: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  applyButton: {
    padding: '10px 16px',
    backgroundColor: '#1e40af',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    width: '100%',
    marginTop: '8px'
  },
  applyButtonHover: {
    backgroundColor: '#1e3a8a'
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
  const [dateFilter, setDateFilter] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [customRangeModal, setCustomRangeModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [adminData, setAdminData] = useState(null);
  const pageSize = 10;

  // Transaction type filter options - INCLUDING REGISTRATIONS
  const transactionTypeOptions = [
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
    },
    { 
      key: 'registrations', 
      label: 'Registrations', 
      icon: FaUserPlus,
      color: '#0369a1'
    }
  ];

  // Date filter options
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
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
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      }
      
      /* PRINT STYLES - REMOVE BROWSER HEADERS/FOOTERS */
      @media print {
        @page {
          margin: 0.5in !important;
          size: auto;
          margin-header: 0 !important;
          margin-footer: 0 !important;
        }
        
        body::before,
        body::after {
          display: none !important;
        }
        
        .print-header:empty,
        .print-footer:empty {
          display: none;
        }
        
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
          padding: 20px;
          background: white;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-header {
          display: block !important;
        }
        .component-header {
          display: none !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Fetch admin data for print report
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminId = localStorage.getItem('adminId');
        if (!adminId) return;

        const role = localStorage.getItem('userRole') || 'admin';
        const node = role === 'superadmin' ? 'Users/SuperAdmin' : 
                    role === 'coadmin' ? 'Users/CoAdmin' : 'Users/Admin';
        
        const adminRef = database.ref(`${node}/${adminId}`);
        const snapshot = await adminRef.once('value');
        
        if (snapshot.exists()) {
          setAdminData(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
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

  // Extract available months from transactions
  useEffect(() => {
    const monthsSet = new Set();
    
    Object.values(transactions).forEach(memberTransactions => {
      memberTransactions.forEach(transaction => {
        const dateString = transaction.dateApproved || transaction.dateApplied;
        if (dateString) {
          const date = new Date(dateString);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          monthsSet.add(JSON.stringify({ value: monthYear, label: monthName }));
        }
      });
    });

    const months = Array.from(monthsSet).map(item => JSON.parse(item));
    months.sort((a, b) => b.value.localeCompare(a.value)); // Sort descending (newest first)
    setAvailableMonths(months);
  }, [transactions]);

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

  // Filter transactions by date
  const filterTransactionsByDate = (transactionsArray) => {
    if (dateFilter === 'all') return transactionsArray;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= today;
        });
        
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
          return txDateOnly.getTime() === yesterday.getTime();
        });
        
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfWeek;
        });
        
      case 'last_week':
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfLastWeek && txDate <= endOfLastWeek;
        });
        
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfMonth;
        });
        
      case 'last_month':
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfLastMonth && txDate <= endOfLastMonth;
        });
        
      case 'this_year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfYear;
        });
        
      case 'last_year':
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
        return transactionsArray.filter(tx => {
          const txDate = new Date(tx.dateApproved || tx.dateApplied);
          return txDate >= startOfLastYear && txDate <= endOfLastYear;
        });
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include entire end date
          return transactionsArray.filter(tx => {
            const txDate = new Date(tx.dateApproved || tx.dateApplied);
            return txDate >= startDate && txDate <= endDate;
          });
        }
        return transactionsArray;
        
      default:
        // Handle month-year filters (e.g., "2024-01")
        if (dateFilter.includes('-')) {
          const [year, month] = dateFilter.split('-').map(Number);
          const startOfMonth = new Date(year, month - 1, 1);
          const endOfMonth = new Date(year, month, 0);
          return transactionsArray.filter(tx => {
            const txDate = new Date(tx.dateApproved || tx.dateApplied);
            return txDate >= startOfMonth && txDate <= endOfMonth;
          });
        }
        
        return transactionsArray;
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
      activeTransactionFilter === 'withdrawals' ? 'Withdrawal Transactions' :
      'Registration Transactions';

    // Get the data that's currently displayed in the table (paginated)
    const displayedData = paginatedData;

    const printContent = document.createElement('div');
    printContent.className = 'print-content';
    printContent.style.padding = '20px';
    printContent.style.fontFamily = 'Arial, sans-serif';
    printContent.style.boxSizing = 'border-box';
    printContent.style.margin = '0';
    printContent.style.display = 'flex';
    printContent.style.flexDirection = 'column';
    printContent.style.minHeight = '100vh';

    // Main content container
    const mainContent = document.createElement('div');
    mainContent.style.flex = '1';

    // ========== HEADER SECTION ==========
    const header = document.createElement('div');
    header.className = 'print-header';
    header.style.paddingBottom = '15px';
    header.style.marginBottom = '20px';
    header.style.boxSizing = 'border-box';

    // Logo and Report Title (Centered)
    const logoSection = document.createElement('div');
    logoSection.style.textAlign = 'center';
    logoSection.style.marginBottom = '15px';

    // Add logo image
    const logoImg = document.createElement('img');
    logoImg.src = logoImage;
    logoImg.style.width = '80px';
    logoImg.style.height = '80px';
    logoImg.style.marginBottom = '5px';
    logoImg.style.display = 'block';
    logoImg.style.marginLeft = 'auto';
    logoImg.style.marginRight = 'auto';

    const logo = document.createElement('div');
    logo.textContent = '5Ki Financial Services';
    logo.style.fontSize = '24px';
    logo.style.fontWeight = 'bold';
    logo.style.color = '#1e40af';
    logo.style.marginBottom = '5px';

    const reportTitle = document.createElement('div');
    reportTitle.textContent = `${sectionTitle} Report`;
    reportTitle.style.fontSize = '20px';
    reportTitle.style.fontWeight = 'bold';
    reportTitle.style.marginBottom = '15px';

    logoSection.appendChild(logoImg);
    logoSection.appendChild(logo);
    logoSection.appendChild(reportTitle);

    // Report Details
    const reportDetails = document.createElement('div');
    reportDetails.style.textAlign = 'center';
    reportDetails.style.marginBottom = '15px';
    reportDetails.style.fontSize = '14px';
    reportDetails.style.color = '#666';
    reportDetails.innerHTML = `
      <strong>Displayed Records: ${displayedData.length} (Page ${currentPage + 1} of ${Math.ceil(filteredMembers.length / pageSize)})</strong>
    `;

    header.appendChild(logoSection);
    header.appendChild(reportDetails);
    mainContent.appendChild(header);

    // ========== TABLE SECTION ==========
    if (displayedData.length > 0) {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '20px';
      table.style.boxSizing = 'border-box';

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
        th.style.boxSizing = 'border-box';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement('tbody');
      displayedData.forEach((memberId, index) => {
        const member = members[memberId];
        const memberTransactions = transactions[memberId] || [];
        
        // Filter transactions by active tab and date
        const filteredTransactions = (activeTransactionFilter === 'all' 
          ? memberTransactions 
          : memberTransactions.filter(tx => {
              const transactionType = tx.type.toLowerCase();
              switch (activeTransactionFilter) {
                case 'deposits': return transactionType === 'deposits';
                case 'loans': return transactionType === 'loans';
                case 'payments': return transactionType === 'payments';
                case 'withdrawals': return transactionType === 'withdrawals';
                case 'registrations': return transactionType === 'registrations';
                default: return true;
              }
            }));

        const dateFilteredTransactions = filterTransactionsByDate(filteredTransactions);
        const latestTransaction = dateFilteredTransactions
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
        tdCount.textContent = dateFilteredTransactions.length;
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
                        latestTransaction.amountToBePaid ||
                        latestTransaction.registrationFee;
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
      mainContent.appendChild(table);
    } else {
      const noData = document.createElement('p');
      noData.textContent = 'No data available';
      noData.style.textAlign = 'center';
      noData.style.color = '#666';
      noData.style.fontStyle = 'italic';
      noData.style.marginTop = '40px';
      mainContent.appendChild(noData);
    }

    // Add main content to printContent
    printContent.appendChild(mainContent);

    // ========== FOOTER SECTION ==========
    const footer = document.createElement('div');
    footer.style.marginTop = 'auto';
    footer.style.paddingTop = '30px';
    footer.style.borderTop = '1px solid #ddd';
    footer.style.fontSize = '12px';
    footer.style.color = '#666';

    // Footer content container
    const footerContent = document.createElement('div');
    footerContent.style.display = 'flex';
    footerContent.style.justifyContent = 'space-between';
    footerContent.style.alignItems = 'flex-start';
    footerContent.style.boxSizing = 'border-box';

    // Left side - Generated Date
    const generatedDate = document.createElement('div');
    generatedDate.style.textAlign = 'left';
    generatedDate.style.flex = '1';
    generatedDate.innerHTML = `
      <div style="margin-bottom: 5px;"><strong>Generated as of:</strong></div>
      <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;

    // Right side - Prepared By
    const preparedBy = document.createElement('div');
    preparedBy.style.textAlign = 'right';
    preparedBy.style.flex = '1';
    const adminFirstName = adminData?.firstName || 'Admin';
    const adminRole = localStorage.getItem('userRole') || 'Admin';
    preparedBy.innerHTML = `
      <div style="margin-bottom: 5px;"><strong>Prepared by:</strong></div>
      <div style="font-weight: bold;">${adminFirstName}</div>
      <div style="font-style: italic;">${adminRole.charAt(0).toUpperCase() + adminRole.slice(1)}</div>
    `;

    footerContent.appendChild(generatedDate);
    footerContent.appendChild(preparedBy);
    footer.appendChild(footerContent);
    printContent.appendChild(footer);

    // Create a hidden iframe for printing to avoid browser headers
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    let printDocument = printFrame.contentWindow || printFrame.contentDocument;
    if (printDocument.document) {
      printDocument = printDocument.document;
    }

    // Write the print content to the iframe with CSS to remove headers/footers
    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sectionTitle} Report</title>
          <style>
            /* Reset all margins and remove browser headers/footers */
            @page {
              margin: 0.5in !important;
              size: auto;
              margin-header: 0 !important;
              margin-footer: 0 !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            
            .print-content {
              margin: 0 !important;
              padding: 20px;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            
            /* Hide any potential browser elements */
            header, footer, .header, .footer {
              display: none !important;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printDocument.close();

    // Wait for content to load then print
    printFrame.onload = function() {
      try {
        if (format === 'pdf') {
          printFrame.contentWindow.print();

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
              
              // Filter transactions by active tab and date
              const filteredTransactions = (activeTransactionFilter === 'all' 
                ? memberTransactions 
                : memberTransactions.filter(tx => {
                    const transactionType = tx.type.toLowerCase();
                    switch (activeTransactionFilter) {
                      case 'deposits': return transactionType === 'deposits';
                      case 'loans': return transactionType === 'loans';
                      case 'payments': return transactionType === 'payments';
                      case 'withdrawals': return transactionType === 'withdrawals';
                      case 'registrations': return transactionType === 'registrations';
                      default: return true;
                    }
                  }));

              const dateFilteredTransactions = filterTransactionsByDate(filteredTransactions);
              const latestTransaction = dateFilteredTransactions
                .sort((a, b) => {
                  const dateA = a.dateApproved || a.dateApplied || '';
                  const dateB = b.dateApproved || b.dateApplied || '';
                  return dateB.localeCompare(dateA);
                })[0];

              const row = [
                memberId,
                member ? `${member.firstName} ${member.lastName}` : 'Unknown Member',
                member?.email || 'N/A',
                dateFilteredTransactions.length,
                latestTransaction?.type || 'N/A'
              ];

              if (latestTransaction) {
                const amount = latestTransaction.amountToBeDeposited || 
                              latestTransaction.loanAmount || 
                              latestTransaction.amount || 
                              latestTransaction.amountWithdrawn || 
                              latestTransaction.amountToBePaid ||
                              latestTransaction.registrationFee;
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
          printFrame.contentWindow.print();
        }
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
          setPrintModalVisible(false);
          setPrinting(false);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        document.body.removeChild(printFrame);
        setPrinting(false);
      }
    };

  } catch (error) {
    console.error('Error printing data:', error);
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
        const memberTransactions = transactions[memberId] || [];
        const dateFilteredTransactions = filterTransactionsByDate(memberTransactions);
        const transactionCount = dateFilteredTransactions.length;
        const totalAmount = dateFilteredTransactions.reduce((sum, tx) => {
          const amount = tx.amountToBeDeposited || tx.loanAmount || tx.amount || tx.amountWithdrawn || tx.amountToBePaid || tx.registrationFee || 0;
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

  const getCurrentTypeFilterLabel = () => {
    const option = transactionTypeOptions.find(opt => opt.key === activeTransactionFilter);
    return option ? option.label : 'All Transactions';
  };

  const getDateFilterLabel = () => {
    if (dateFilter === 'all') return 'All Time';
    if (dateFilter === 'custom') return 'Custom Range';
    
    const option = dateFilterOptions.find(opt => opt.value === dateFilter);
    if (option) return option.label;
    
    const monthOption = availableMonths.find(month => month.value === dateFilter);
    if (monthOption) return monthOption.label;
    
    return 'Select Date Range';
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      setDateFilter('custom');
      setCustomRangeModal(false);
      setCurrentPage(0);
    }
  };

  // Filter members based on active tab, search query, and date filter
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
      const memberTransactions = transactions[memberId] || [];
      let typeFilteredTransactions = memberTransactions;
      
      if (activeTransactionFilter !== 'all') {
        typeFilteredTransactions = memberTransactions.filter(tx => {
          const transactionType = tx.type.toLowerCase();
          switch (activeTransactionFilter) {
            case 'deposits': return transactionType === 'deposits';
            case 'loans': return transactionType === 'loans';
            case 'payments': return transactionType === 'payments';
            case 'withdrawals': return transactionType === 'withdrawals';
            case 'registrations': return transactionType === 'registrations';
            default: return true;
          }
        });
      }

      // Apply date filter
      const dateFilteredTransactions = filterTransactionsByDate(typeFilteredTransactions);
      
      return dateFilteredTransactions.length > 0;
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
        const memberTransactionsA = transactions[a] || [];
        const memberTransactionsB = transactions[b] || [];
        
        let filteredA = memberTransactionsA;
        let filteredB = memberTransactionsB;
        
        if (activeTransactionFilter !== 'all') {
          filteredA = memberTransactionsA.filter(tx => {
            const transactionType = tx.type.toLowerCase();
            switch (activeTransactionFilter) {
              case 'deposits': return transactionType === 'deposits';
              case 'loans': return transactionType === 'loans';
              case 'payments': return transactionType === 'payments';
              case 'withdrawals': return transactionType === 'withdrawals';
              case 'registrations': return transactionType === 'registrations';
              default: return true;
            }
          });
          
          filteredB = memberTransactionsB.filter(tx => {
            const transactionType = tx.type.toLowerCase();
            switch (activeTransactionFilter) {
              case 'deposits': return transactionType === 'deposits';
              case 'loans': return transactionType === 'loans';
              case 'payments': return transactionType === 'payments';
              case 'withdrawals': return transactionType === 'withdrawals';
              case 'registrations': return transactionType === 'registrations';
              default: return true;
            }
          });
        }
        
        const dateFilteredA = filterTransactionsByDate(filteredA);
        const dateFilteredB = filterTransactionsByDate(filteredB);
        
        const countA = dateFilteredA.length;
        const countB = dateFilteredB.length;
        return sortConfig.direction === 'asc' ? countA - countB : countB - countA;
      }
      
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedData = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (loading) {
    return (
      <div style={styles.safeAreaView}>
        <div style={styles.mainContainer}>
          <div style={styles.dashboardLoadingContainer}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.loadingText}>Loading transaction data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.safeAreaView} className="component-header">
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
            {/* Filters - Left side */}
            <div style={styles.filterContainer}>
              {/* Transaction Type Filter */}
              <div style={styles.filterContainer}>
                <button
                  style={{
                    ...styles.filterButton,
                    ...(isHovered.typeFilter ? styles.filterButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('typeFilter')}
                  onMouseLeave={() => handleMouseLeave('typeFilter')}
                  onClick={() => setShowTypeFilter(!showTypeFilter)}
                >
                  <FaFilter />
                  <span>{getCurrentTypeFilterLabel()}</span>
                  <FaSortDown />
                </button>

                {showTypeFilter && (
                  <div style={styles.filterDropdown}>
                    {transactionTypeOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isActive = activeTransactionFilter === option.key;
                      return (
                        <button
                          key={option.key}
                          style={{
                            ...styles.filterOption,
                            ...(isActive ? styles.activeFilterOption : {})
                          }}
                          onClick={() => {
                            setActiveTransactionFilter(option.key);
                            setShowTypeFilter(false);
                            setCurrentPage(0);
                          }}
                        >
                          <IconComponent style={{ color: option.color }} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div style={styles.dateFilterContainer}>
                <button
                  style={{
                    ...styles.dateFilterButton,
                    ...(isHovered.dateFilter ? styles.dateFilterButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('dateFilter')}
                  onMouseLeave={() => handleMouseLeave('dateFilter')}
                  onClick={() => setShowDateFilter(!showDateFilter)}
                >
                  <FaCalendarAlt />
                  <span>{getDateFilterLabel()}</span>
                  <FaSortDown />
                </button>

                {showDateFilter && (
                  <div style={styles.dateFilterDropdown}>
                    {dateFilterOptions.map(option => (
                      <button
                        key={option.value}
                        style={{
                          ...styles.dateFilterOption,
                          ...(dateFilter === option.value ? styles.activeDateFilterOption : {})
                        }}
                        onClick={() => {
                          if (option.value === 'custom') {
                            setCustomRangeModal(true);
                            setShowDateFilter(false);
                          } else {
                            setDateFilter(option.value);
                            setShowDateFilter(false);
                            setCurrentPage(0);
                          }
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                    
                    {/* Available months */}
                    {availableMonths.length > 0 && (
                      <>
                        <div style={{...styles.dateFilterOption, backgroundColor: '#f8fafc', fontWeight: '600', fontSize: '12px', color: '#64748b'}}>
                          SPECIFIC MONTHS
                        </div>
                        {availableMonths.map(month => (
                          <button
                            key={month.value}
                            style={{
                              ...styles.dateFilterOption,
                              ...(dateFilter === month.value ? styles.activeDateFilterOption : {})
                            }}
                            onClick={() => {
                              setDateFilter(month.value);
                              setShowDateFilter(false);
                              setCurrentPage(0);
                            }}
                          >
                            {month.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
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
                Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredMembers.length)} of {filteredMembers.length} 
                {dateFilter !== 'all' && ` (Filtered by: ${getDateFilterLabel()})`}
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
                {searchQuery || dateFilter !== 'all' 
                  ? 'No transactions match your search criteria' 
                  : 'No transaction data available'
                }
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
                    let filteredTransactions = activeTransactionFilter === 'all' 
                      ? memberTransactions 
                      : memberTransactions.filter(tx => {
                          const transactionType = tx.type.toLowerCase();
                          switch (activeTransactionFilter) {
                            case 'deposits': return transactionType === 'deposits';
                            case 'loans': return transactionType === 'loans';
                            case 'payments': return transactionType === 'payments';
                            case 'withdrawals': return transactionType === 'withdrawals';
                            case 'registrations': return transactionType === 'registrations';
                            default: return true;
                          }
                        });

                    // Apply date filter
                    const dateFilteredTransactions = filterTransactionsByDate(filteredTransactions);
                    const latestTransaction = dateFilteredTransactions
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
                            {dateFilteredTransactions.length} transactions
                            {dateFilteredTransactions.length !== filteredTransactions.length && (
                              <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '2px' }}>
                                (Filtered from {filteredTransactions.length})
                              </div>
                            )}
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
                                  latestTransaction.amountToBePaid ||
                                  latestTransaction.registrationFee
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

        {/* Custom Date Range Modal */}
        {customRangeModal && (
          <div style={styles.modalOverlay} onClick={() => setCustomRangeModal(false)}>
            <div style={{...styles.modalCard, ...styles.customRangeModal}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Custom Date Range</h2>
                <button 
                  onClick={() => setCustomRangeModal(false)}
                  style={{
                    ...styles.closeButton,
                    ...(isHovered.closeCustomModal ? styles.closeButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('closeCustomModal')}
                  onMouseLeave={() => handleMouseLeave('closeCustomModal')}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.dateRangeGrid}>
                  <div style={styles.dateInputGroup}>
                    <label style={styles.dateInputLabel}>Start Date</label>
                    <input
                      type="date"
                      style={styles.dateInput}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div style={styles.dateInputGroup}>
                    <label style={styles.dateInputLabel}>End Date</label>
                    <input
                      type="date"
                      style={styles.dateInput}
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  style={{
                    ...styles.applyButton,
                    ...(isHovered.applyCustomRange ? styles.applyButtonHover : {})
                  }}
                  onMouseEnter={() => handleMouseEnter('applyCustomRange')}
                  onMouseLeave={() => handleMouseLeave('applyCustomRange')}
                  onClick={handleCustomRangeApply}
                  disabled={!customStartDate || !customEndDate}
                >
                  Apply Date Range
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {printModalVisible && (
          <div style={styles.modalOverlay} onClick={() => setPrintModalVisible(false)}>
            <div style={{...styles.modalCard, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Export Options</h2>
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
                <p style={{margin: '0 0 20px 0', color: '#64748b', textAlign: 'center'}}>
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
                  <p style={styles.printOptionText}>
                    <FaPrint /> Print Document
                  </p>
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
                  <p style={styles.printOptionText}>
                    <FaFileAlt /> Save as PDF
                  </p>
                  <p style={styles.printOptionDescription}>
                    Download as PDF file
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
                  <p style={styles.printOptionText}>
                    <FaDownload /> Export to Excel
                  </p>
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
                  {dateFilter !== 'all' && ` (${getDateFilterLabel()})`}
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
                    .filter(tx => {
                      if (dateFilter === 'all') return true;
                      return filterTransactionsByDate([tx]).length > 0;
                    })
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
                                   transaction.amountToBePaid ||
                                   transaction.registrationFee;

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
                  ).filter(tx => {
                    if (dateFilter === 'all') return true;
                    return filterTransactionsByDate([tx]).length > 0;
                  }).length === 0 && (
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
