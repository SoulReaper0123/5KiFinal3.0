import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaUserCircle, 
  FaSignOutAlt,
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaPlus,
  FaHistory,
  FaTrash,
  FaComments
} from 'react-icons/fa';
import { 
  GoSidebarCollapse,
  GoSidebarExpand
} from 'react-icons/go';
import { FiAlertCircle } from 'react-icons/fi';
import Register from './Sidebar/Registrations/Register';
import Loans from './Sidebar/Loans/Loans';
import PayLoans from './Sidebar/Payments/PayLoans';
import Withdraws from './Sidebar/Withdraws/Withdraws';
import Transactions from './Sidebar/Transactions';
import CoAdmins from './Sidebar/CoAdmins';
import Deposits from './Sidebar/Deposits/Deposits';
import Dashboard from './Sidebar/Dashboard/Dashboard';
import Settings from './Settings/Settings';
import AccountSettings from './Settings/AccountSettings';
import Members from './Sidebar/Members/Members';
import { useAuth } from '../web/WebAuth/AuthContext';
import logo from '../../../assets/logo.png';
import { 
  Analytics02Icon,
  Settings02Icon,
  ManagerIcon,
  ReverseWithdrawal01Icon,
  Payment01Icon,
  Payment02Icon,
  MoneyAdd02Icon,
  UserGroupIcon
} from "hugeicons-react";
import { GrTransaction } from "react-icons/gr";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { database } from '../../../Database/firebaseConfig';
import { generateEnhancedAdminAIResponse } from '../services/enhancedAdminAI';

const AdminHome = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // AI Assistant States
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Chat Management States
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
  scrollToBottom();
}, [aiMessages]);
  
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isSmallScreen = windowWidth < 1024;

// Initialize Gemini AI - Updated for free version
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use the correct model for the free version
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash"
});

  // Test function to verify AI is working
const testAI = async () => {
try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 80%, 100% { opacity: 0.3; }
        40% { opacity: 1; }
      }
      @keyframes slideInRight {
        0% { 
          transform: translateX(100%); 
          opacity: 0; 
        }
        100% { 
          transform: translateX(0); 
          opacity: 1; 
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSection = async () => {
      const savedSection = localStorage.getItem('activeSection');
      if (savedSection) {
        setActiveSection(savedSection);
      }
    };
    loadSection();
    loadChatSessions();
    
    // Test AI connection on component mount
    testAI();
  }, []);

  // Load chat sessions from localStorage
  const loadChatSessions = () => {
    try {
      const savedChats = localStorage.getItem('aiChatSessions');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChatSessions(parsedChats);
        
        // Load the most recent chat if available
        if (parsedChats.length > 0) {
          const mostRecent = parsedChats[0];
          setCurrentChatId(mostRecent.id);
          setAiMessages(mostRecent.messages || []);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  // Save chat sessions to localStorage
  const saveChatSessions = (sessions) => {
    try {
      localStorage.setItem('aiChatSessions', JSON.stringify(sessions));
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  };

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    await localStorage.setItem('activeSection', section);
    setIsDropdownVisible(false);
  };

  const toggleSidebar = () => {
    setSidebarWidth(isCollapsed ? 280 : 60);
    setIsCollapsed(!isCollapsed);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'registrations': return <Register />;
      case 'members': return <Members />;
      case 'deposits': return <Deposits />;
      case 'applyLoans': return <Loans />;
      case 'payLoans': return <PayLoans />;
      case 'withdraws': return <Withdraws />;
      case 'transactions': return <Transactions />;
      case 'coadmins': return <CoAdmins />;
      case 'settings': return <Settings />;
      case 'accountSettings': return <AccountSettings />;
      default: return <Dashboard />;
    }
  };

  const isActive = (section) => activeSection === section;

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem('activeSection');
      logout();
      navigate('/');
    }, 1500);
  };

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  const handleAdminIconPress = () => {
    handleSectionChange('accountSettings');
  };

  // AI Assistant Functions
  const toggleAIAssistant = () => {
    setIsAIAssistantVisible(!isAIAssistantVisible);
    if (!isAIAssistantVisible && aiMessages.length === 0 && !currentChatId) {
      startNewChat();
    }
  };

  // Chat Management Functions
  const startNewChat = () => {
    const newChatId = Date.now().toString();
    const welcomeMessage = {
      type: 'ai',
      content: 'Hello! I\'m your AI Assistant for the Financial Management System. I can help you with:\n\n• Database queries and statistics\n• User and member management\n• Loan applications and approvals\n• Deposit and withdrawal tracking\n• Transaction analysis\n• System navigation and features\n• Troubleshooting and support\n\nFeel free to ask me anything about your system!',
      timestamp: new Date().toLocaleTimeString()
    };
    
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [welcomeMessage],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    const updatedSessions = [newChat, ...chatSessions];
    saveChatSessions(updatedSessions);
    setCurrentChatId(newChatId);
    setAiMessages([welcomeMessage]);
    setShowChatHistory(false);
  };

const loadChat = (chatId) => {
  const chat = chatSessions.find(session => session.id === chatId);
  if (chat) {
    setCurrentChatId(chatId);
    setAiMessages(chat.messages || []);
    setShowChatHistory(false);
    // Scroll to bottom after state updates
    setTimeout(scrollToBottom, 0);
  }
};

  const confirmDeleteChat = (chatId) => {
    setChatToDelete(chatId);
    setShowDeleteModal(true);
  };

  const deleteChat = () => {
    if (!chatToDelete) return;
    
    const updatedSessions = chatSessions.filter(session => session.id !== chatToDelete);
    saveChatSessions(updatedSessions);
    
    if (currentChatId === chatToDelete) {
      if (updatedSessions.length > 0) {
        loadChat(updatedSessions[0].id);
      } else {
        setCurrentChatId(null);
        setAiMessages([]);
        startNewChat();
      }
    }
    
    setShowDeleteModal(false);
    setChatToDelete(null);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const cancelDeleteChat = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const updateCurrentChat = (messages) => {
    if (!currentChatId) return;
    
    const updatedSessions = chatSessions.map(session => {
      if (session.id === currentChatId) {
        // Update title based on first user message
        let title = session.title;
        if (title === 'New Chat' && messages.length > 1) {
          const firstUserMessage = messages.find(msg => msg.type === 'user');
          if (firstUserMessage) {
            title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
          }
        }
        
        return {
          ...session,
          title,
          messages,
          lastUpdated: new Date().toISOString()
        };
      }
      return session;
    });
    
    // Sort by last updated (most recent first)
    updatedSessions.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    saveChatSessions(updatedSessions);
  };

  const getProjectContext = () => {
    return `
You are an AI assistant for 5KI Financial Services management system with comprehensive database access.

DATABASE COLLECTIONS (Firebase Realtime Database):
- Members: User registrations and profiles
- Loans/LoanApplications: Loan applications and approvals
- Deposits/DepositApplications: Deposit applications and records
- Withdraws/WithdrawApplications: Withdrawal requests and approvals
- Payments/PaymentApplications: Payment records and applications

CAPABILITIES:
- I can access real-time data from the Firebase database
- I can provide statistics on members, loans, deposits, payments, and withdrawals
- I can look up specific member information by email address
- I can calculate totals, counts, and financial summaries
- I can provide detailed breakdowns by status (pending, approved, rejected)

MAIN SECTIONS:
- Dashboard: Analytics and overview with real-time data
- Registrations: User membership management
- Deposits: Deposit applications and approvals
- Loans: Loan applications and management
- Payments: Payment processing
- Withdrawals: Withdrawal requests
- Transactions: Transaction history
- Co-Admins: Admin user management
- Settings: System configuration

CURRENT ACTIVE SECTION: ${activeSection}

QUERY EXAMPLES I CAN HANDLE:
- "How many members do we have?"
- "What's the total loan amount?"
- "Show me statistics for john@example.com"
- "How many pending deposits are there?"
- "What's our available funds?"

The system uses React.js frontend with Firebase Realtime Database. All amounts are in Philippine Peso (₱).
`;
  };

  // Fallback responses for common queries when AI fails
  const getFallbackResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('how many') || message.includes('count') || message.includes('total')) {
      return `I'd be happy to help you get counts and statistics! However, I'm currently unable to access the live database. 

To get this information, you can:
• Check the Dashboard section for overview statistics
• Go to the specific sections (Members, Loans, Deposits, etc.) to see current data
• Use the browser's developer console to check for any connection issues

Common queries I can help with:
• System structure and navigation
• Feature explanations
• Troubleshooting steps
• Code-related questions`;
    }
    
    if (message.includes('member') || message.includes('user')) {
      return `For member/user information:

• Members Section: View all registered users, their profiles, and membership status
• Registrations: Handle new membership applications
• Dashboard: See member statistics and overview

The users are stored in the 'users' collection in Firebase with fields like:
- Personal information (name, email, phone)
- Membership status
- Registration date
- Profile details

Would you like me to explain any specific aspect of user management?`;
    }
    
    if (message.includes('loan')) {
      return `For loan information:

• Loans Section: View all loan applications and their status
• Payments Section: Handle loan payments and repayments
• Dashboard: See loan statistics

Loan statuses typically include:
- Pending: Awaiting approval
- Approved: Loan has been approved
- Rejected: Application was declined
- Active: Currently being repaid

Would you like me to explain the loan approval process or payment handling?`;
    }
    
    if (message.includes('deposit')) {
      return `For deposit information:

• Deposits Section: View all deposit applications and records
• Dashboard: See deposit statistics and trends

Deposit types and statuses:
- Pending deposits awaiting processing
- Approved deposits that have been confirmed
- Various deposit categories and amounts

The system tracks deposit history, amounts, and processing status.`;
    }
    
    return `I'm here to help! While I'm currently unable to access live data, I can assist with:

• System Navigation: How to use different sections
• Feature Explanations: What each section does
• Data Structure: How information is organized
• Troubleshooting: Common issues and solutions

What specific aspect of the system would you like to know about?`;
  };

  const queryFirebaseData = async (collection, filters = {}) => {
    try {
      console.log(`Querying Firebase collection: ${collection}`);
      const ref = database.ref(collection);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase query timeout')), 10000)
      );
      
      const dataPromise = ref.once('value');
      const snapshot = await Promise.race([dataPromise, timeoutPromise]);
      const data = snapshot.val();
      
      console.log(`Firebase data for ${collection}:`, data ? 'Data found' : 'No data');
      
      if (!data) return [];
      
      // Convert to array and apply basic filters
      const dataArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      
      console.log(`Converted ${collection} to array:`, dataArray.length, 'items');
      return dataArray;
    } catch (error) {
      console.error(`Firebase query error for ${collection}:`, error);
      throw error; // Re-throw to handle in calling function
    }
  };

const handleAIQuery = async (userMessage) => {
  if (!userMessage.trim()) return;

  // Add user message
  const newUserMessage = {
    type: 'user',
    content: userMessage,
    timestamp: new Date().toLocaleTimeString()
  };

  const updatedMessages = [...aiMessages, newUserMessage];
  setAiMessages(updatedMessages);
  setAiInput('');
  setAiLoading(true);

  try {
    console.log('Processing admin AI query:', userMessage);
    
    // Use the enhanced admin AI service
    const result = await generateEnhancedAdminAIResponse(userMessage);
    
    if (!result.success) {
      throw new Error(result.message || 'AI service unavailable');
    }

    // Add AI response
    const newAIMessage = {
      type: 'ai',
      content: result.text,
      timestamp: new Date().toLocaleTimeString(),
      provider: result.provider
    };

    const finalMessages = [...updatedMessages, newAIMessage];
    setAiMessages(finalMessages);
    updateCurrentChat(finalMessages);

    console.log('Admin AI response generated successfully');

  } catch (error) {
    console.error('Admin AI processing error:', error);
    
    // Enhanced fallback response for admin
    let fallbackResponse = '';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('member') || lowerMessage.includes('user')) {
      fallbackResponse = 'I can help you with member information. Try asking about specific member details, account summaries, or member statistics.';
    } else if (lowerMessage.includes('loan')) {
      fallbackResponse = 'I can provide loan information including applications, current loans, approval rates, and loan statistics.';
    } else if (lowerMessage.includes('deposit') || lowerMessage.includes('saving')) {
      fallbackResponse = 'I can help with deposit information, savings balances, and deposit transaction analysis.';
    } else if (lowerMessage.includes('withdrawal')) {
      fallbackResponse = 'I can provide withdrawal information, transaction history, and withdrawal patterns.';
    } else if (lowerMessage.includes('payment')) {
      fallbackResponse = 'I can help with payment information, transaction records, and payment analysis.';
    } else if (lowerMessage.includes('report') || lowerMessage.includes('statistic')) {
      fallbackResponse = 'I can generate various reports and statistics about members, loans, deposits, withdrawals, and overall system performance.';
    } else {
      fallbackResponse = 'I\'m your admin AI assistant with access to all database information. I can help with member management, financial reports, transaction analysis, and system insights.';
    }
    
    const errorMessage = {
      type: 'ai',
      content: `I'm temporarily having trouble accessing the full database. Here's what I can help you with:\n\n${fallbackResponse}\n\nPlease try your question again, or contact support if the issue persists.`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const finalMessages = [...updatedMessages, errorMessage];
    setAiMessages(finalMessages);
    updateCurrentChat(finalMessages);
    
  } finally {
    setAiLoading(false);
  }
};

// Helper function to get specific member data
const getMemberData = async (email) => {
  try {
    const membersSnapshot = await database.ref('Members').once('value');
    const membersData = membersSnapshot.val();
    
    if (!membersData) return null;
    
    // Find member by email
    let memberInfo = null;
    let memberId = null;
    
    Object.keys(membersData).forEach(id => {
      const member = membersData[id];
      if (member && member.email && member.email.toLowerCase() === email.toLowerCase()) {
        memberInfo = { id, ...member };
        memberId = id;
      }
    });
    
    if (!memberInfo) return null;
    
    // Get member's transactions
    const memberData = {
      info: memberInfo,
      loans: [],
      deposits: [],
      payments: [],
      withdrawals: [],
      totalBalance: 0
    };
    
    // Get loans
    const loansSnapshot = await database.ref(`Loans/LoanApplications/${memberId}`).once('value');
    const loansData = loansSnapshot.val();
    if (loansData) {
      memberData.loans = Object.keys(loansData).map(loanId => ({
        id: loanId,
        ...loansData[loanId]
      }));
    }
    
    // Get deposits
    const depositsSnapshot = await database.ref(`Deposits/DepositApplications/${memberId}`).once('value');
    const depositsData = depositsSnapshot.val();
    if (depositsData) {
      memberData.deposits = Object.keys(depositsData).map(depositId => ({
        id: depositId,
        ...depositsData[depositId]
      }));
      
      // Calculate balance from approved deposits
      memberData.deposits.forEach(deposit => {
        if (deposit.status === 'approved') {
          memberData.totalBalance += parseFloat(deposit.depositAmount) || 0;
        }
      });
    }
    
    // Get payments
    const paymentsSnapshot = await database.ref(`Payments/PaymentApplications/${memberId}`).once('value');
    const paymentsData = paymentsSnapshot.val();
    if (paymentsData) {
      memberData.payments = Object.keys(paymentsData).map(paymentId => ({
        id: paymentId,
        ...paymentsData[paymentId]
      }));
    }
    
    // Get withdrawals
    const withdrawalsSnapshot = await database.ref(`Withdraws/WithdrawApplications/${memberId}`).once('value');
    const withdrawalsData = withdrawalsSnapshot.val();
    if (withdrawalsData) {
      memberData.withdrawals = Object.keys(withdrawalsData).map(withdrawalId => ({
        id: withdrawalId,
        ...withdrawalsData[withdrawalId]
      }));
      
      // Subtract approved withdrawals from balance
      memberData.withdrawals.forEach(withdrawal => {
        if (withdrawal.status === 'approved') {
          memberData.totalBalance -= parseFloat(withdrawal.withdrawAmount) || 0;
        }
      });
    }
    
    return memberData;
  } catch (error) {
    console.error('Error getting member data:', error);
    return null;
  }
};

// Helper function to fetch relevant data
const fetchRelevantData = async (userMessage) => {
  const message = userMessage.toLowerCase();
  
  // Check if the message is asking for database information
  const isDataQuery = message.includes('data') || message.includes('count') || 
                     message.includes('how many') || message.includes('total') ||
                     message.includes('member') || message.includes('loan') ||
                     message.includes('deposit') || message.includes('payment') ||
                     message.includes('withdraw') || message.includes('balance') ||
                     message.includes('statistics') || message.includes('summary');

  if (!isDataQuery) {
    return '';
  }

  try {
    // Check if asking for specific member data
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = userMessage.match(emailRegex);
    
    if (emailMatch) {
      const email = emailMatch[0];
      const memberData = await getMemberData(email);
      
      if (memberData) {
        let memberSummary = `\n\nMember Data for ${email}:`;
        memberSummary += `\n\n👤 MEMBER INFO:`;
        memberSummary += `\n- Name: ${memberData.info.firstName || ''} ${memberData.info.lastName || ''}`;
        memberSummary += `\n- Member ID: ${memberData.info.id}`;
        memberSummary += `\n- Status: ${memberData.info.status || 'N/A'}`;
        memberSummary += `\n- Current Balance: ₱${memberData.totalBalance.toLocaleString()}`;
        
        memberSummary += `\n\n💰 LOANS (${memberData.loans.length}):`;
        if (memberData.loans.length > 0) {
          memberData.loans.slice(0, 5).forEach(loan => {
            memberSummary += `\n- ${loan.id}: ₱${loan.loanAmount} (${loan.status}) - ${loan.dateApplied}`;
          });
          if (memberData.loans.length > 5) {
            memberSummary += `\n- ... and ${memberData.loans.length - 5} more loans`;
          }
        } else {
          memberSummary += `\n- No loans found`;
        }
        
        memberSummary += `\n\n💳 DEPOSITS (${memberData.deposits.length}):`;
        if (memberData.deposits.length > 0) {
          memberData.deposits.slice(0, 5).forEach(deposit => {
            memberSummary += `\n- ${deposit.id}: ₱${deposit.depositAmount} (${deposit.status}) - ${deposit.dateApplied}`;
          });
          if (memberData.deposits.length > 5) {
            memberSummary += `\n- ... and ${memberData.deposits.length - 5} more deposits`;
          }
        } else {
          memberSummary += `\n- No deposits found`;
        }
        
        memberSummary += `\n\n💸 PAYMENTS (${memberData.payments.length}):`;
        if (memberData.payments.length > 0) {
          memberData.payments.slice(0, 5).forEach(payment => {
            memberSummary += `\n- ${payment.id}: ₱${payment.paymentAmount} (${payment.status}) - ${payment.dateApplied}`;
          });
          if (memberData.payments.length > 5) {
            memberSummary += `\n- ... and ${memberData.payments.length - 5} more payments`;
          }
        } else {
          memberSummary += `\n- No payments found`;
        }
        
        return memberSummary;
      } else {
        return `\n\nMember with email ${email} not found in the system.`;
      }
    }
    let dataSummary = '\n\nCurrent System Data Summary:';
    
    // Get Members data
    const membersSnapshot = await database.ref('Members').once('value');
    const membersData = membersSnapshot.val();
    const totalMembers = membersData ? Object.keys(membersData).length : 0;
    
    // Get active/inactive members
    let activeMembers = 0, inactiveMembers = 0;
    if (membersData) {
      Object.values(membersData).forEach(member => {
        if (member.status === 'active') activeMembers++;
        else inactiveMembers++;
      });
    }
    
    dataSummary += `\n\n📊 MEMBERS:`;
    dataSummary += `\n- Total Members: ${totalMembers}`;
    dataSummary += `\n- Active Members: ${activeMembers}`;
    dataSummary += `\n- Inactive Members: ${inactiveMembers}`;

    // Get Loans data
    const loansSnapshot = await database.ref('Loans/LoanApplications').once('value');
    const loansData = loansSnapshot.val();
    let totalLoans = 0, pendingLoans = 0, approvedLoans = 0, rejectedLoans = 0;
    let totalLoanAmount = 0;
    
    if (loansData) {
      Object.values(loansData).forEach(memberLoans => {
        if (memberLoans) {
          Object.values(memberLoans).forEach(loan => {
            totalLoans++;
            if (loan.status === 'pending') pendingLoans++;
            else if (loan.status === 'approved') approvedLoans++;
            else if (loan.status === 'rejected') rejectedLoans++;
            
            if (loan.loanAmount) {
              totalLoanAmount += parseFloat(loan.loanAmount) || 0;
            }
          });
        }
      });
    }
    
    dataSummary += `\n\n💰 LOANS:`;
    dataSummary += `\n- Total Loan Applications: ${totalLoans}`;
    dataSummary += `\n- Pending: ${pendingLoans}`;
    dataSummary += `\n- Approved: ${approvedLoans}`;
    dataSummary += `\n- Rejected: ${rejectedLoans}`;
    dataSummary += `\n- Total Loan Amount: ₱${totalLoanAmount.toLocaleString()}`;

    // Get Deposits data
    const depositsSnapshot = await database.ref('Deposits/DepositApplications').once('value');
    const depositsData = depositsSnapshot.val();
    let totalDeposits = 0, pendingDeposits = 0, approvedDeposits = 0, rejectedDeposits = 0;
    let totalDepositAmount = 0;
    
    if (depositsData) {
      Object.values(depositsData).forEach(memberDeposits => {
        if (memberDeposits) {
          Object.values(memberDeposits).forEach(deposit => {
            totalDeposits++;
            if (deposit.status === 'pending') pendingDeposits++;
            else if (deposit.status === 'approved') approvedDeposits++;
            else if (deposit.status === 'rejected') rejectedDeposits++;
            
            if (deposit.depositAmount) {
              totalDepositAmount += parseFloat(deposit.depositAmount) || 0;
            }
          });
        }
      });
    }
    
    dataSummary += `\n\n💳 DEPOSITS:`;
    dataSummary += `\n- Total Deposit Applications: ${totalDeposits}`;
    dataSummary += `\n- Pending: ${pendingDeposits}`;
    dataSummary += `\n- Approved: ${approvedDeposits}`;
    dataSummary += `\n- Rejected: ${rejectedDeposits}`;
    dataSummary += `\n- Total Deposit Amount: ₱${totalDepositAmount.toLocaleString()}`;

    // Get Payments data
    const paymentsSnapshot = await database.ref('Payments/PaymentApplications').once('value');
    const paymentsData = paymentsSnapshot.val();
    let totalPayments = 0, pendingPayments = 0, approvedPayments = 0, rejectedPayments = 0;
    let totalPaymentAmount = 0;
    
    if (paymentsData) {
      Object.values(paymentsData).forEach(memberPayments => {
        if (memberPayments) {
          Object.values(memberPayments).forEach(payment => {
            totalPayments++;
            if (payment.status === 'pending') pendingPayments++;
            else if (payment.status === 'approved') approvedPayments++;
            else if (payment.status === 'rejected') rejectedPayments++;
            
            if (payment.paymentAmount) {
              totalPaymentAmount += parseFloat(payment.paymentAmount) || 0;
            }
          });
        }
      });
    }
    
    dataSummary += `\n\n💸 PAYMENTS:`;
    dataSummary += `\n- Total Payment Applications: ${totalPayments}`;
    dataSummary += `\n- Pending: ${pendingPayments}`;
    dataSummary += `\n- Approved: ${approvedPayments}`;
    dataSummary += `\n- Rejected: ${rejectedPayments}`;
    dataSummary += `\n- Total Payment Amount: ₱${totalPaymentAmount.toLocaleString()}`;

    // Get Withdrawals data
    const withdrawalsSnapshot = await database.ref('Withdraws/WithdrawApplications').once('value');
    const withdrawalsData = withdrawalsSnapshot.val();
    let totalWithdrawals = 0, pendingWithdrawals = 0, approvedWithdrawals = 0, rejectedWithdrawals = 0;
    let totalWithdrawalAmount = 0;
    
    if (withdrawalsData) {
      Object.values(withdrawalsData).forEach(memberWithdrawals => {
        if (memberWithdrawals) {
          Object.values(memberWithdrawals).forEach(withdrawal => {
            totalWithdrawals++;
            if (withdrawal.status === 'pending') pendingWithdrawals++;
            else if (withdrawal.status === 'approved') approvedWithdrawals++;
            else if (withdrawal.status === 'rejected') rejectedWithdrawals++;
            
            if (withdrawal.withdrawAmount) {
              totalWithdrawalAmount += parseFloat(withdrawal.withdrawAmount) || 0;
            }
          });
        }
      });
    }
    
    dataSummary += `\n\n🏦 WITHDRAWALS:`;
    dataSummary += `\n- Total Withdrawal Applications: ${totalWithdrawals}`;
    dataSummary += `\n- Pending: ${pendingWithdrawals}`;
    dataSummary += `\n- Approved: ${approvedWithdrawals}`;
    dataSummary += `\n- Rejected: ${rejectedWithdrawals}`;
    dataSummary += `\n- Total Withdrawal Amount: ₱${totalWithdrawalAmount.toLocaleString()}`;

    // Calculate system totals
    const totalFunds = totalDepositAmount - totalWithdrawalAmount;
    const totalOutstanding = totalLoanAmount - totalPaymentAmount;
    
    dataSummary += `\n\n📈 SYSTEM TOTALS:`;
    dataSummary += `\n- Available Funds: ₱${totalFunds.toLocaleString()}`;
    dataSummary += `\n- Outstanding Loans: ₱${totalOutstanding.toLocaleString()}`;
    dataSummary += `\n- Net Position: ₱${(totalFunds - totalOutstanding).toLocaleString()}`;
    
    return dataSummary;
  } catch (error) {
    console.error('Data fetch error:', error);
    throw error;
  }
};

  const handleAIInputSubmit = (e) => {
    e.preventDefault();
    handleAIQuery(aiInput);
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      overflowX: 'hidden',
      position: 'relative',
    },
    sidebar: {
      width: `${sidebarWidth}px`,
      backgroundColor: isCollapsed ? '#F5F5F5' : '#2D5783',
      padding: '20px 0',
      transition: 'width 0.3s ease, background-color 0.3s ease',
      overflow: 'hidden',
      position: 'relative',
      height: '100%',
    },
    scrollContainer: {
      paddingBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      overflowY: 'auto',
      justifyContent: 'flex-start',
    },
    toggleButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: isCollapsed ? '#000000' : '#FFFFFF',
      fontSize: '32px',
      padding: '0',
      margin: '0',
      outline: 'none',
    },
    adminContainer: {
      alignItems: 'center',
      marginBottom: '20px',
      marginTop: '40px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },
    adminImage: {
      width: '80px',
      height: '80px',
      borderRadius: '40px',
      marginBottom: '10px',
    },
    button: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      height: '48px',
      paddingLeft: '30px',
      paddingRight: '10px',
      marginBottom: '5px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      backgroundColor: 'transparent',
    },
    activeButton: {
      backgroundColor: '#F5F5F5',
      borderRadius: '8px',
      border: 'none',
      outline: 'none',
    },
    iconContainer: {
      width: '40px',
      height: '40px',
      marginRight: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'default',
    },
    icon: {
      fontSize: '28px',
      color: '#fff',
      display: 'inline-block',
      fontStyle: 'normal',
    },
    activeIcon: {
      fontSize: '28px',
      color: '#000',
      display: 'inline-block',
      fontStyle: 'normal',
    },
    buttonText: {
      fontSize: '16px',
      color: '#ffffff',
      marginRight: '20px',
      fontWeight: 'normal',
      cursor: 'pointer',
    },
    activeButtonText: {
      color: '#000000',
      fontWeight: 'normal',
      marginLeft: '5px',
      fontSize: '18px',
    },
content: {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  height: '100vh',
  padding: '20px',
  backgroundColor: '#f5f7fa',
},
    dropdownWrapper: {
      position: 'absolute',
      top: '40px',
      right: '50px',
      zIndex: 900,
    },
    dropdownContainer: {
      backgroundColor: 'white',
      borderRadius: '25px',
      border: '1px solid #ddd',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      width: '100%', 
    },
    dropdownButton: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '6px 10px',
      cursor: 'pointer',
    },
    profileIconContainer: {
      backgroundColor: '#f0f0f0',
      borderRadius: '20px', 
      width: '35px',
      height: '35px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
    },
    dropdownTextContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: '10px',
      paddingRight: '5px',
      cursor: 'pointer',
    },
    dropdownText: {
      color: 'black',
      fontSize: '16px',
      marginRight: '8px',
      fontWeight: 'normal',
    },
    dropdownMenu: {
      backgroundColor: 'white',
      borderTop: '1px solid #eee',
    },
    dropdownItem: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer',
    },
    dropdownItemText: {
      color: '#333',
      fontSize: '14px',
      fontWeight: 'normal',
    },
    fullOverlay: {
      position: 'fixed',
      zIndex: 9999,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    },
    overlayText: {
      color: '#FFFFFF',
      fontSize: '20px',
      textAlign: 'center',
      fontWeight: 'bold',
      maxWidth: '500px',
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
      zIndex: 1300
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
    },
    spinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#2D5783',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      animation: 'spin 1s linear infinite'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100
    },
    // AI Assistant Styles
    aiAssistantModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1200,
      padding: '20px'
    },
    aiAssistantContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '95%',
      maxWidth: '1200px',
      height: '85%',
      maxHeight: '700px',
      display: 'flex',
      flexDirection: 'row',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      overflow: 'hidden'
    },
    aiAssistantHeader: {
      backgroundColor: '#2D5783',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '12px 12px 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    aiAssistantTitle: {
      fontSize: '18px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    aiMessagesContainer: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    aiMessage: {
      maxWidth: '80%',
      padding: '12px 16px',
      borderRadius: '12px',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    aiMessageUser: {
      backgroundColor: '#2D5783',
      color: 'white',
      alignSelf: 'flex-end',
      borderBottomRightRadius: '4px'
    },
    aiMessageAI: {
      backgroundColor: '#f5f5f5',
      color: '#333',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: '4px'
    },
    aiMessageTime: {
      fontSize: '11px',
      opacity: 0.7,
      marginTop: '4px'
    },
    aiInputContainer: {
      padding: '16px 20px',
      borderTop: '1px solid #eee',
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    aiInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '25px',
      fontSize: '14px',
      outline: 'none',
      resize: 'none'
    },
    aiSendButton: {
      backgroundColor: '#2D5783',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    aiLoadingDots: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      padding: '12px 16px'
    },
    aiLoadingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#2D5783',
      animation: 'pulse 1.5s ease-in-out infinite'
    },
    // Chat Management Styles - ChatGPT-like Layout
    aiSidebar: {
      width: '280px',
      backgroundColor: '#f7f7f8',
      borderRight: '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    aiSidebarHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e5e5',
      backgroundColor: '#f7f7f8'
    },
    newChatButton: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#2D5783',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    aiSidebarContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px'
    },
    sidebarSectionTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '16px 8px 8px 8px'
    },
    chatHistoryItem: {
      padding: '12px',
      margin: '2px 0',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background-color 0.2s',
      position: 'relative',
      group: true
    },
    chatHistoryItemActive: {
      backgroundColor: '#e3f2fd',
      borderLeft: '3px solid #2D5783'
    },
    chatHistoryItemHover: {
      backgroundColor: '#f0f0f0'
    },
    chatItemContent: {
      flex: 1,
      minWidth: 0
    },
    chatTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    chatDate: {
      fontSize: '11px',
      color: '#666'
    },
    chatDeleteButton: {
      background: 'none',
      border: 'none',
      color: '#999',
      fontSize: '12px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      opacity: 0,
      transition: 'all 0.2s',
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)'
    },
    aiMainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    aiMainHeader: {
      backgroundColor: '#2D5783',
      color: 'white',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e5e5e5'
    },
    aiMainTitle: {
      fontSize: '18px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    aiCloseButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      transition: 'background-color 0.2s'
    },
    // Success Message Styles
    successMessage: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#4caf50',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideInRight 0.3s ease-out'
    },
    // Collapsed Sidebar Styles
    collapsedContainer: {
      paddingBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      overflowY: 'auto',
      paddingTop: '60px'
    },

    collapsedButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '48px',
      height: '48px',
      marginBottom: '8px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'background-color 0.2s ease',
      ':hover': {
        backgroundColor: 'rgba(0,0,0,0.1)'
      }
    },
    collapsedIcon: {
      fontSize: '28px',
      color: '#00000',
      display: 'inline-block',
      fontStyle: 'normal',
    },
    collapsedButtonActive: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '8px',
    },
    collapsedIconActive: {
      fontSize: '28px',
      color: '#000000',
      display: 'inline-block',
      fontStyle: 'normal',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <button 
          style={styles.toggleButton} 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand /> }
        </button>

        {!isCollapsed && (
          <div style={styles.scrollContainer}>
            <div style={styles.adminContainer}>
              <img src={logo} alt="Admin" style={styles.adminImage} />
            </div>

            <button
              onClick={() => handleSectionChange('dashboard')}
              style={isActive('dashboard') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Analytics02Icon 
                  style={isActive('dashboard') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('dashboard') ? styles.activeButtonText : styles.buttonText}>
                Dashboard
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('registrations')}
              style={isActive('registrations') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <UserGroupIcon 
                  style={isActive('registrations') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('registrations') ? styles.activeButtonText : styles.buttonText}>
                Membership
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('deposits')}
              style={isActive('deposits') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Payment02Icon 
                  style={isActive('deposits') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('deposits') ? styles.activeButtonText : styles.buttonText}>
                Deposits
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('applyLoans')}
              style={isActive('applyLoans') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <MoneyAdd02Icon 
                  style={isActive('applyLoans') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('applyLoans') ? styles.activeButtonText : styles.buttonText}>
                Loans
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('payLoans')}
              style={isActive('payLoans') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Payment01Icon 
                  style={isActive('payLoans') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('payLoans') ? styles.activeButtonText : styles.buttonText}>
                Payments
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('withdraws')}
              style={isActive('withdraws') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <ReverseWithdrawal01Icon 
                  style={isActive('withdraws') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('withdraws') ? styles.activeButtonText : styles.buttonText}>
                Withdrawals
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('transactions')}
              style={isActive('transactions') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <GrTransaction 
                  style={isActive('transactions') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('transactions') ? styles.activeButtonText : styles.buttonText}>
                Transactions
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('coadmins')}
              style={isActive('coadmins') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <ManagerIcon 
                  style={isActive('coadmins') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('coadmins') ? styles.activeButtonText : styles.buttonText}>
                Co-Admins
              </span>
            </button>

            <button
              onClick={() => handleSectionChange('settings')}
              style={isActive('settings') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
            >
              <div style={styles.iconContainer}>
                <Settings02Icon 
                  style={isActive('settings') ? styles.activeIcon : styles.icon} 
                  size={28}
                />
              </div>
              <span style={isActive('settings') ? styles.activeButtonText : styles.buttonText}>
                Settings
              </span>
            </button>

            {/* AI Assistant Button in Sidebar */}
            <button
              onClick={toggleAIAssistant}
              style={{
                ...styles.button,
                marginTop: 'auto',
                marginBottom: '20px'
              }}
            >
              <div style={styles.iconContainer}>
                <FaRobot 
                  style={styles.icon} 
                  size={28}
                />
              </div>
              <span style={styles.buttonText}>
                AI Assistant
              </span>
            </button>
          </div>
        )}

        {/* Collapsed Sidebar - Show only icons */}
        {isCollapsed && (
          <div style={styles.collapsedContainer}>
            <button
              onClick={() => handleSectionChange('dashboard')}
              style={isActive('dashboard') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Dashboard"
            >
              <Analytics02Icon 
                style={isActive('dashboard') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('registrations')}
              style={isActive('registrations') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Membership"
            >
              <UserGroupIcon 
                style={isActive('registrations') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('deposits')}
              style={isActive('deposits') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Deposits"
            >
              <Payment02Icon 
                style={isActive('deposits') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('applyLoans')}
              style={isActive('applyLoans') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Loans"
            >
              <MoneyAdd02Icon 
                style={isActive('applyLoans') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('payLoans')}
              style={isActive('payLoans') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Payments"
            >
              <Payment01Icon 
                style={isActive('payLoans') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('withdraws')}
              style={isActive('withdraws') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Withdrawals"
            >
              <ReverseWithdrawal01Icon 
                style={isActive('withdraws') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('transactions')}
              style={isActive('transactions') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Transactions"
            >
              <GrTransaction 
                style={isActive('transactions') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('coadmins')}
              style={isActive('coadmins') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Co-Admins"
            >
              <ManagerIcon 
                style={isActive('coadmins') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            <button
              onClick={() => handleSectionChange('settings')}
              style={isActive('settings') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Settings"
            >
              <Settings02Icon 
                style={isActive('settings') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={28} 
              />
            </button>

            {/* AI Assistant Button - Collapsed */}
            <button
              onClick={toggleAIAssistant}
              style={{
                ...styles.collapsedButton,
                marginTop: 'auto',
                marginBottom: '20px'
              }}
              title="AI Assistant"
            >
              <FaRobot style={styles.collapsedIcon} size={28} />
            </button>
          </div>
        )}
      </div>

      <div style={styles.content}>
        {renderSection()}
      </div>

      <div style={styles.dropdownWrapper}>
        <div style={styles.dropdownContainer}>
          <div style={styles.dropdownButton}>
            <div onClick={handleAdminIconPress} style={styles.profileIconContainer}>
              <FaUserCircle size={36} color="#000" />
            </div>
            <div onClick={toggleDropdown} style={styles.dropdownTextContainer}>
              <span style={styles.dropdownText}>Admin</span>
              {isDropdownVisible ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
            </div>
          </div>

          {isDropdownVisible && (
            <div style={styles.dropdownMenu}>
              <div 
                onClick={() => {
                  setLogoutModalVisible(true);
                  setIsDropdownVisible(false);
                }} 
                style={styles.dropdownItem}
              >
                <FaSignOutAlt size={22} style={{ marginRight: '10px' }} />
                <span style={styles.dropdownItemText}>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSmallScreen && (
        <div style={styles.fullOverlay}>
          <span style={styles.overlayText}>Please use a device with a larger screen.</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#2D5783' }} />
            <p style={styles.modalText}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2D5783',
                  color: '#fff'
                }} 
                onClick={handleLogout}
              >
                Yes
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
                }} 
                onClick={() => setLogoutModalVisible(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal - ChatGPT Style */}
      {isAIAssistantVisible && (
        <div style={styles.aiAssistantModal}>
          <div style={styles.aiAssistantContainer}>
            {/* Sidebar */}
            <div style={styles.aiSidebar}>
              <div style={styles.aiSidebarHeader}>
                <button 
                  style={styles.newChatButton}
                  onClick={startNewChat}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1e4a6b'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2D5783'}
                >
                  <FaPlus size={14} />
                  New Chat
                </button>
              </div>
              
              <div style={styles.aiSidebarContent}>
                {chatSessions.length > 0 && (
                  <div style={styles.sidebarSectionTitle}>Recent Chats</div>
                )}
                
                {chatSessions.length === 0 ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    No chat history yet.
                    <br />
                    Start a conversation!
                  </div>
                ) : (
                  chatSessions.map((chat) => (
                    <div
                      key={chat.id}
                      style={{
                        ...styles.chatHistoryItem,
                        ...(currentChatId === chat.id ? styles.chatHistoryItemActive : {})
                      }}
                      onClick={() => loadChat(chat.id)}
                      onMouseEnter={(e) => {
                        if (currentChatId !== chat.id) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        if (currentChatId !== chat.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '0';
                      }}
                    >
                      <div style={styles.chatItemContent}>
                        <div style={styles.chatTitle}>{chat.title}</div>
                        <div style={styles.chatDate}>
                          {new Date(chat.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        className="delete-btn"
                        style={styles.chatDeleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteChat(chat.id);
                        }}
                        title="Delete Chat"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Content */}
            <div style={styles.aiMainContent}>
              <div style={styles.aiMainHeader}>
                <div style={styles.aiMainTitle}>
                  <FaRobot size={20} />
                  AI Assistant
                  {currentChatId && (
                    <span style={{ fontSize: '14px', opacity: 0.8, marginLeft: '8px' }}>
                      - {chatSessions.find(chat => chat.id === currentChatId)?.title || 'Chat'}
                    </span>
                  )}
                </div>
                <button 
                  style={styles.aiCloseButton}
                  onClick={toggleAIAssistant}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaTimes />
                </button>
              </div>
              
<div style={styles.aiMessagesContainer}>
  {aiMessages.map((message, index) => (
    <div 
      key={index}
      style={{
        ...styles.aiMessage,
        ...(message.type === 'user' ? styles.aiMessageUser : styles.aiMessageAI)
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
      <div style={styles.aiMessageTime}>{message.timestamp}</div>
    </div>
  ))}
  
  {aiLoading && (
    <div style={{...styles.aiMessage, ...styles.aiMessageAI}}>
      <div style={styles.aiLoadingDots}>
        <div style={{...styles.aiLoadingDot, animationDelay: '0s'}}></div>
        <div style={{...styles.aiLoadingDot, animationDelay: '0.2s'}}></div>
        <div style={{...styles.aiLoadingDot, animationDelay: '0.4s'}}></div>
        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
          AI is thinking...
        </span>
      </div>
    </div>
  )}
  <div ref={messagesEndRef} />
</div>
              
              <form onSubmit={handleAIInputSubmit} style={styles.aiInputContainer}>
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask me anything about your system..."
                  style={styles.aiInput}
                  disabled={aiLoading}
                />
                <button 
                  type="submit"
                  style={{
                    ...styles.aiSendButton,
                    opacity: aiLoading || !aiInput.trim() ? 0.5 : 1,
                    cursor: aiLoading || !aiInput.trim() ? 'not-allowed' : 'pointer'
                  }}
                  disabled={aiLoading || !aiInput.trim()}
                  onMouseEnter={(e) => {
                    if (!aiLoading && aiInput.trim()) {
                      e.target.style.backgroundColor = '#1e4a6b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!aiLoading && aiInput.trim()) {
                      e.target.style.backgroundColor = '#2D5783';
                    }
                  }}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#f44336' }} />
            <p style={styles.modalText}>
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f44336',
                  color: '#fff'
                }} 
                onClick={deleteChat}
              >
                <FaTrash style={{ marginRight: '6px' }} />
                Delete
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#6c757d',
                  color: '#fff'
                }} 
                onClick={cancelDeleteChat}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div style={styles.successMessage}>
          <FaTrash />
          Chat deleted successfully!
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;