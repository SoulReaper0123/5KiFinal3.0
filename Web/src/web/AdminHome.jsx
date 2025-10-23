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

import { database } from '../../../Database/firebaseConfig';
import { generateEnhancedAdminAIResponse } from '../services/enhancedAdminAI';

const AdminHome = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(270);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sectionReloadCounter, setSectionReloadCounter] = useState(0);
  const [pendingCounts, setPendingCounts] = useState({
    registrations: 0,
    deposits: 0,
    loans: 0,
    payments: 0,
    withdraws: 0,
  });
  
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

  // Build visible UI context for the AI (display-only snapshot)
  const buildVisibleContext = () => {
    // Capture only what is currently displayed on the Admin UI for the AI
    const ui = {
      activeSection,
      pending: { ...pendingCounts },
    };

    // Pull dashboard snapshot if user is on the dashboard (display-only)
    const dash = window.__visibleDashboard || null;

    // Add a normalized, AI-friendly string focusing on labels used in UI
    return [
      'UI STATE',
      `- Active Section: ${ui.activeSection}`,
      `- Pending Registrations: ${ui.pending.registrations}`,
      `- Pending Deposits: ${ui.pending.deposits}`,
      `- Pending Loans: ${ui.pending.loans}`,
      `- Pending Payments: ${ui.pending.payments}`,
      `- Pending Withdrawals: ${ui.pending.withdraws}`,
      dash ? 'DASHBOARD SNAPSHOT' : null,
      dash ? `- Available Funds: ₱${Number(dash.availableFunds || 0).toLocaleString()}` : null,
      dash ? `- Total Yields: ₱${Number(dash.totalYields || 0).toLocaleString()}` : null,
      dash ? `- Total Loans: ₱${Number(dash.totalLoans || 0).toLocaleString()}` : null,
      dash ? `- Total Receivables: ₱${Number(dash.totalReceivables || 0).toLocaleString()}` : null,
      dash ? `- 5KI Savings: ₱${Number(dash.fiveKISavings || 0).toLocaleString()}` : null,
      dash ? `- Active Borrowers: ${dash.activeBorrowers || 0}` : null,
      dash ? `- Total Members: ${dash.totalMembers || 0}` : null,
    ].filter(Boolean).join('\n');
  };

  // Test AI connection (Gemini v1beta endpoint) with dynamic model probe
  const testAI = async () => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!geminiKey) {
      console.log('⚠️ No Gemini API key found');
      return false;
    }

    const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Use updated model names that work with v1beta
    const CANDIDATE_MODELS = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-latest',
    ];

    const probe = async (model) => {
      const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${geminiKey}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: 'Hello' }] }
            ]
          }),
        });
        return res.ok ? null : (await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } })));
      } catch (e) {
        return { error: { message: e.message } };
      }
    };

    try {
      for (const m of CANDIDATE_MODELS) {
        const err = await probe(m);
        if (!err) {
          console.log(`✅ Gemini API working with model: ${m}`);
          return true;
        } else {
          console.warn(`Model ${m} not working:`, err?.error?.message || err);
        }
      }
      console.error('❌ No supported Gemini model found');
    } catch (e) {
      console.warn('❌ Gemini test failed:', e.message);
    }
    
    // Even if testing fails, return true to allow the AI to try anyway
    return true;
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
      // Auto-collapse on smaller screens
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
        setSidebarWidth(60);
      }
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

    // Subscribe to pending counts
    const refs = {
      registrations: database.ref('Registrations/RegistrationApplications'),
      deposits: database.ref('Deposits/DepositApplications'),
      loans: database.ref('Loans/LoanApplications'),
      payments: database.ref('Payments/PaymentApplications'),
      withdraws: database.ref('Withdrawals/WithdrawalApplications'),
    };

    const computePending = (root) => {
      if (!root || typeof root !== 'object') return 0;
      let count = 0;

      // Normalize and check various status casings
      const isPending = (status) => {
        if (!status) return false;
        const s = typeof status === 'string' ? status.toLowerCase() : '';
        return s === 'pending';
      };

      Object.values(root).forEach((node) => {
        if (node && typeof node === 'object') {
          // Case 1: Flat structure id -> record
          if ('status' in node) {
            if (isPending(node.status)) count += 1;
          } else {
            // Case 2: Nested structure groupId -> { id -> record }
            Object.values(node).forEach((rec) => {
              if (rec && typeof rec === 'object' && isPending(rec.status)) {
                count += 1;
              }
            });
          }
        }
      });

      return count;
    };

    const handlers = {
      registrations: (snap) => setPendingCounts(prev => ({ ...prev, registrations: computePending(snap.val()) })),
      deposits: (snap) => setPendingCounts(prev => ({ ...prev, deposits: computePending(snap.val()) })),
      loans: (snap) => setPendingCounts(prev => ({ ...prev, loans: computePending(snap.val()) })),
      payments: (snap) => setPendingCounts(prev => ({ ...prev, payments: computePending(snap.val()) })),
      withdraws: (snap) => setPendingCounts(prev => ({ ...prev, withdraws: computePending(snap.val()) })),
    };

    // Attach listeners
    refs.registrations.on('value', handlers.registrations);
    refs.deposits.on('value', handlers.deposits);
    refs.loans.on('value', handlers.loans);
    refs.payments.on('value', handlers.payments);
    refs.withdraws.on('value', handlers.withdraws);
    
    // Test AI connection
    testAI();

    // Cleanup
    return () => {
      refs.registrations.off('value', handlers.registrations);
      refs.deposits.off('value', handlers.deposits);
      refs.loans.off('value', handlers.loans);
      refs.payments.off('value', handlers.payments);
      refs.withdraws.off('value', handlers.withdraws);
    };
  }, []);

  // Load chat sessions from localStorage
  const loadChatSessions = () => {
    try {
      const savedChats = localStorage.getItem('aiChatSessions');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChatSessions(parsedChats);
        
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
    setSectionReloadCounter((c) => c + 1);
  };

  const toggleSidebar = () => {
    if (isCollapsed) {
      setSidebarWidth(270);
    } else {
      setSidebarWidth(60);
    }
    setIsCollapsed(!isCollapsed);
  };

  const renderSection = () => {
    const SectionComponent = () => {
      switch (activeSection) {
        case 'dashboard': return <Dashboard key={`dashboard-${sectionReloadCounter}`} />;
        case 'registrations': return <Register key={`register-${sectionReloadCounter}`} />;
        case 'members': return <Members key={`members-${sectionReloadCounter}`} />;
        case 'deposits': return <Deposits key={`deposits-${sectionReloadCounter}`} />;
        case 'applyLoans': return <Loans key={`loans-${sectionReloadCounter}`} />;
        case 'payLoans': return <PayLoans key={`payloans-${sectionReloadCounter}`} />;
        case 'withdraws': return <Withdraws key={`withdraws-${sectionReloadCounter}`} />;
        case 'transactions': return <Transactions key={`transactions-${sectionReloadCounter}`} />;
        case 'coadmins': return <CoAdmins key={`coadmins-${sectionReloadCounter}`} />;
        case 'settings': return <Settings key={`settings-${sectionReloadCounter}`} />;
        case 'accountSettings': return <AccountSettings key={`acctsettings-${sectionReloadCounter}`} />;
        default: return <Dashboard key={`dashboard-${sectionReloadCounter}`} />;
      }
    };

    return (
      <div style={{
        width: '100%',
        minHeight: '100%',
        overflowX: 'auto',
        boxSizing: 'border-box'
      }}>
        <SectionComponent />
      </div>
    );
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
      content: 'Hi! How may I help you today?',
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
    
    updatedSessions.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    saveChatSessions(updatedSessions);
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
      
      // Use enhanced AI service with database access + visible UI snapshot
      const result = await generateEnhancedAdminAIResponse(userMessage, buildVisibleContext());

      // Add AI response
      const newAIMessage = {
        type: 'ai',
        content: result.text || result.message || 'Sorry, I could not process your request.',
        timestamp: new Date().toLocaleTimeString(),
        provider: result.provider || 'AI Assistant'
      };

      const finalMessages = [...updatedMessages, newAIMessage];
      setAiMessages(finalMessages);
      updateCurrentChat(finalMessages);

      console.log('AI response generated successfully');

    } catch (error) {
      console.error('AI processing error:', error);
      
      // Fallback response
      let fallbackResponse = 'I apologize, but I\'m currently unable to access the AI service. ';
      fallbackResponse += 'Please check your internet connection and try again. ';
      fallbackResponse += 'You can still navigate through the system using the sidebar menu.';
      
      const errorMessage = {
        type: 'ai',
        content: fallbackResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setAiMessages(finalMessages);
      updateCurrentChat(finalMessages);
      
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIInputSubmit = (e) => {
    e.preventDefault();
    handleAIQuery(aiInput);
  };

  // Enhanced professional styles for banking admin dashboard
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    sidebar: {
      width: `${sidebarWidth}px`,
      background: 'linear-gradient(180deg, #1E3A5F 0%, #2D5783 100%)',
      padding: '16px 0',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: 'relative',
      height: '100%',
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      flexShrink: 0,
    },
    scrollContainer: {
      paddingBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      overflowY: 'auto',
      justifyContent: 'flex-start',
      width: '100%',
    },
    toggleButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      cursor: 'pointer',
      color: '#FFFFFF',
      fontSize: '18px',
      padding: '6px',
      borderRadius: '6px',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.2s ease',
    },
    adminContainer: {
      alignItems: 'center',
      marginBottom: '24px',
      marginTop: '40px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      padding: '0 16px',
    },
    adminImage: {
      width: '60px',
      height: '60px',
      borderRadius: '12px',
      marginBottom: '12px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    adminTitle: {
      color: '#FFFFFF',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
    },
    adminSubtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '11px',
      textAlign: 'center',
      marginTop: '2px',
    },
    adminButtonContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '5px',
      position: 'relative',
    },
    adminProfileButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      padding: '6px 12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      gap: '8px',
    },
    adminProfileIcon: {
      backgroundColor: '#3B82F6',
      borderRadius: '4px',
      width: '20px',
      height: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    adminButtonText: {
      color: '#FFFFFF',
      fontSize: '11px',
      fontWeight: '500',
    },
    adminDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      zIndex: 1000,
      marginTop: '4px',
      minWidth: '100px',
    },
    adminDropdownItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      borderBottom: '1px solid #F1F5F9',
    },
    adminDropdownItemText: {
      color: '#475569',
      fontSize: '11px',
      fontWeight: '500',
      marginLeft: '6px',
    },
    button: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      height: '44px',
      paddingLeft: '16px',
      paddingRight: '12px',
      marginBottom: '6px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      width: 'calc(100% - 12px)',
      backgroundColor: 'transparent',
      borderRadius: '10px',
      marginLeft: '6px',
      marginRight: '6px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
    },
    activeButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    iconContainer: {
      position: 'relative',
      width: '32px',
      height: '32px',
      marginRight: '12px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    icon: {
      fontSize: '18px',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: 'all 0.2s ease',
    },
    activeIcon: {
      fontSize: '18px',
      color: '#FFFFFF',
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      minWidth: '18px',
      height: '18px',
      borderRadius: '9px',
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '600',
      padding: '0 4px',
      lineHeight: 1,
      border: '2px solid #1E3A8A',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    buttonText: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    activeButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'auto',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#F8FAFC',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
      minWidth: 0,
      width: isCollapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 270px)',
      boxSizing: 'border-box',
      transition: 'width 0.3s ease',
    },
    fullOverlay: {
      position: 'fixed',
      zIndex: 9999,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      backdropFilter: 'blur(8px)',
    },
    overlayContent: {
      textAlign: 'center',
      maxWidth: '400px',
    },
    overlayIcon: {
      fontSize: '48px',
      color: '#3B82F6',
      marginBottom: '20px',
    },
    overlayTitle: {
      color: '#FFFFFF',
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '12px',
    },
    overlayText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
      lineHeight: 1.6,
    },
    centeredModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1300,
      backdropFilter: 'blur(4px)',
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
      border: '1px solid #F1F5F9',
    },
    confirmIcon: {
      marginBottom: '14px',
      fontSize: '28px',
    },
    modalText: {
      fontSize: '14px',
      marginBottom: '18px',
      textAlign: 'center',
      color: '#475569',
      lineHeight: '1.5',
      fontWeight: '500',
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      minWidth: '80px',
    },
    spinner: {
      border: '3px solid rgba(59, 130, 246, 0.3)',
      borderTop: '3px solid #3B82F6',
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
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1500,
      backdropFilter: 'blur(4px)',
    },
    // AI Assistant Styles
    aiAssistantModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1200,
      padding: '16px',
      backdropFilter: 'blur(4px)',
    },
    aiAssistantContainer: {
      backgroundColor: 'white',
      borderRadius: '14px',
      width: '95%',
      maxWidth: '1000px',
      height: '80%',
      maxHeight: '600px',
      display: 'flex',
      flexDirection: 'row',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
    },
    aiAssistantHeader: {
      backgroundColor: '#1E3A8A',
      color: 'white',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #E5E7EB',
    },
    aiAssistantTitle: {
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    aiMessagesContainer: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: '#F8FAFC',
    },
    aiMessage: {
      maxWidth: '80%',
      padding: '14px 16px',
      borderRadius: '14px',
      fontSize: '13px',
      lineHeight: '1.6',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    aiMessageUser: {
      backgroundColor: '#1E3A8A',
      color: 'white',
      alignSelf: 'flex-end',
      borderBottomRightRadius: '4px',
    },
    aiMessageAI: {
      backgroundColor: 'white',
      color: '#374151',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: '4px',
      border: '1px solid #E5E7EB',
    },
    aiMessageTime: {
      fontSize: '10px',
      opacity: 0.7,
      marginTop: '6px',
      fontWeight: '500',
    },
    aiInputContainer: {
      padding: '16px 20px',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      backgroundColor: 'white',
    },
    aiInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #D1D5DB',
      borderRadius: '10px',
      fontSize: '13px',
      outline: 'none',
      resize: 'none',
      backgroundColor: '#F9FAFB',
      transition: 'all 0.2s ease',
    },
    aiSendButton: {
      backgroundColor: '#1E3A8A',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      width: '42px',
      height: '42px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)',
    },
    aiLoadingDots: {
      display: 'flex',
      gap: '5px',
      alignItems: 'center',
      padding: '14px 16px',
    },
    aiLoadingDot: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      backgroundColor: '#1E3A8A',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    // Chat Management Styles
    aiSidebar: {
      width: '240px',
      backgroundColor: '#F8FAFC',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    aiSidebarHeader: {
      padding: '16px',
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#F8FAFC',
    },
    newChatButton: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#1E3A8A',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)',
    },
    aiSidebarContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px',
    },
    sidebarSectionTitle: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '12px 6px 6px 6px',
    },
    chatHistoryItem: {
      padding: '10px',
      margin: '3px 0',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      position: 'relative',
      border: '1px solid transparent',
    },
    chatHistoryItemActive: {
      backgroundColor: '#EFF6FF',
      borderColor: '#3B82F6',
      borderLeft: '3px solid #3B82F6',
    },
    chatItemContent: {
      flex: 1,
      minWidth: 0,
    },
    chatTitle: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#1F2937',
      marginBottom: '3px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    chatDate: {
      fontSize: '10px',
      color: '#6B7280',
      fontWeight: '500',
    },
    chatDeleteButton: {
      background: 'none',
      border: 'none',
      color: '#9CA3AF',
      fontSize: '11px',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '5px',
      opacity: 0,
      transition: 'all 0.2s ease',
      position: 'absolute',
      right: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    aiMainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    aiMainHeader: {
      backgroundColor: '#1E3A8A',
      color: 'white',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiMainTitle: {
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    aiCloseButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      color: 'white',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '6px',
      transition: 'background-color 0.2s ease',
      backdropFilter: 'blur(10px)',
    },
    // Success Message Styles
    successMessage: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#10B981',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '600',
    },
    // Collapsed Sidebar Styles - FIXED
    collapsedContainer: {
      paddingBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      overflowY: 'auto',
      paddingTop: '60px',
      width: '100%',
    },
    collapsedButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '48px',
      height: '48px',
      marginBottom: '10px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
    },
    collapsedIcon: {
      fontSize: '22px',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: 'all 0.2s ease',
    },
    collapsedIconActive: {
      fontSize: '22px',
      color: '#FFFFFF',
    },
    collapsedButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      transform: 'scale(1.05)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <button 
          style={styles.toggleButton} 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        >
          {isCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand /> }
        </button>

        {!isCollapsed && (
          <div style={styles.scrollContainer}>
            <div style={styles.adminContainer}>
              <img src={logo} alt="5KI Banking" style={styles.adminImage} />
              <div style={styles.adminTitle}>5KI Financial Services</div>
              
              {/* Profile Icon + Admin Button */}
              <div style={styles.adminButtonContainer}>
                <button
                  style={styles.adminProfileButton}
                  onClick={toggleDropdown}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  <div 
                    style={styles.adminProfileIcon}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminIconPress();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                    }}
                  >
                    <FaUserCircle size={12} color="#FFFFFF" />
                  </div>
                  <span style={styles.adminButtonText}>Admin</span>
                  {isDropdownVisible ? <FaChevronUp size={8} color="#FFFFFF" /> : <FaChevronDown size={8} color="#FFFFFF" />}
                </button>

                {isDropdownVisible && (
                  <div style={styles.adminDropdownMenu}>
                    <div 
                      onClick={() => {
                        setLogoutModalVisible(true);
                        setIsDropdownVisible(false);
                      }} 
                      style={styles.adminDropdownItem}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <FaSignOutAlt size={10} style={{ color: '#EF4444' }} />
                      <span style={{...styles.adminDropdownItemText, color: '#EF4444'}}>Logout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSectionChange('dashboard')}
              style={isActive('dashboard') ? 
                {...styles.button, ...styles.activeButton} : 
                styles.button}
              onMouseEnter={(e) => !isActive('dashboard') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('dashboard') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <Analytics02Icon 
                  style={isActive('dashboard') ? styles.activeIcon : styles.icon} 
                  size={18}
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
              onMouseEnter={(e) => !isActive('registrations') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('registrations') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <UserGroupIcon 
                  style={isActive('registrations') ? styles.activeIcon : styles.icon} 
                  size={18}
                />
                {pendingCounts.registrations > 0 && (
                  <span style={styles.badge}>{pendingCounts.registrations}</span>
                )}
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
              onMouseEnter={(e) => !isActive('deposits') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('deposits') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <Payment02Icon 
                  style={isActive('deposits') ? styles.activeIcon : styles.icon} 
                  size={18}
                />
                {pendingCounts.deposits > 0 && (
                  <span style={styles.badge}>{pendingCounts.deposits}</span>
                )}
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
              onMouseEnter={(e) => !isActive('applyLoans') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('applyLoans') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <MoneyAdd02Icon 
                  style={isActive('applyLoans') ? styles.activeIcon : styles.icon} 
                  size={18}
                />
                {pendingCounts.loans > 0 && (
                  <span style={styles.badge}>{pendingCounts.loans}</span>
                )}
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
              onMouseEnter={(e) => !isActive('payLoans') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('payLoans') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <Payment01Icon 
                  style={isActive('payLoans') ? styles.activeIcon : styles.icon} 
                  size={18}
                />
                {pendingCounts.payments > 0 && (
                  <span style={styles.badge}>{pendingCounts.payments}</span>
                )}
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
              onMouseEnter={(e) => !isActive('withdraws') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('withdraws') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <ReverseWithdrawal01Icon 
                  style={isActive('withdraws') ? styles.activeIcon : styles.icon} 
                  size={18}
                />
                {pendingCounts.withdraws > 0 && (
                  <span style={styles.badge}>{pendingCounts.withdraws}</span>
                )}
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
              onMouseEnter={(e) => !isActive('transactions') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('transactions') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <GrTransaction 
                  style={isActive('transactions') ? styles.activeIcon : styles.icon} 
                  size={18}
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
              onMouseEnter={(e) => !isActive('coadmins') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('coadmins') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <ManagerIcon 
                  style={isActive('coadmins') ? styles.activeIcon : styles.icon} 
                  size={18}
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
              onMouseEnter={(e) => !isActive('settings') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => !isActive('settings') && (e.target.style.backgroundColor = 'transparent')}
            >
              <div style={styles.iconContainer}>
                <Settings02Icon 
                  style={isActive('settings') ? styles.activeIcon : styles.icon} 
                  size={18}
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
                marginBottom: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <div style={styles.iconContainer}>
                <FaRobot style={styles.icon} size={18} />
              </div>
              <span style={styles.buttonText}>
                AI Assistant
              </span>
            </button>
          </div>
        )}

        {/* Collapsed Sidebar - Show only icons - FIXED */}
        {isCollapsed && (
          <div style={styles.collapsedContainer}>
            <button
              onClick={() => handleSectionChange('dashboard')}
              style={isActive('dashboard') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Dashboard"
              onMouseEnter={(e) => {
                if (!isActive('dashboard')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('dashboard')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <Analytics02Icon 
                style={isActive('dashboard') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
            </button>

            <button
              onClick={() => handleSectionChange('registrations')}
              style={isActive('registrations') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Membership"
              onMouseEnter={(e) => {
                if (!isActive('registrations')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('registrations')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <UserGroupIcon 
                style={isActive('registrations') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
              {pendingCounts.registrations > 0 && (
                <span style={{
                  ...styles.badge, 
                  top: '-2px', 
                  right: '-2px',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>{pendingCounts.registrations}</span>
              )}
            </button>

            <button
              onClick={() => handleSectionChange('deposits')}
              style={isActive('deposits') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Deposits"
              onMouseEnter={(e) => {
                if (!isActive('deposits')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('deposits')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <Payment02Icon 
                style={isActive('deposits') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
              {pendingCounts.deposits > 0 && (
                <span style={{
                  ...styles.badge, 
                  top: '-2px', 
                  right: '-2px',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>{pendingCounts.deposits}</span>
              )}
            </button>

            <button
              onClick={() => handleSectionChange('applyLoans')}
              style={isActive('applyLoans') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Loans"
              onMouseEnter={(e) => {
                if (!isActive('applyLoans')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('applyLoans')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <MoneyAdd02Icon 
                style={isActive('applyLoans') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
              {pendingCounts.loans > 0 && (
                <span style={{
                  ...styles.badge, 
                  top: '-2px', 
                  right: '-2px',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>{pendingCounts.loans}</span>
              )}
            </button>

            <button
              onClick={() => handleSectionChange('payLoans')}
              style={isActive('payLoans') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Payments"
              onMouseEnter={(e) => {
                if (!isActive('payLoans')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('payLoans')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <Payment01Icon 
                style={isActive('payLoans') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
              {pendingCounts.payments > 0 && (
                <span style={{
                  ...styles.badge, 
                  top: '-2px', 
                  right: '-2px',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>{pendingCounts.payments}</span>
              )}
            </button>

            <button
              onClick={() => handleSectionChange('withdraws')}
              style={isActive('withdraws') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Withdrawals"
              onMouseEnter={(e) => {
                if (!isActive('withdraws')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('withdraws')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <ReverseWithdrawal01Icon 
                style={isActive('withdraws') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
              {pendingCounts.withdraws > 0 && (
                <span style={{
                  ...styles.badge, 
                  top: '-2px', 
                  right: '-2px',
                  minWidth: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>{pendingCounts.withdraws}</span>
              )}
            </button>

            <button
              onClick={() => handleSectionChange('transactions')}
              style={isActive('transactions') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Transactions"
              onMouseEnter={(e) => {
                if (!isActive('transactions')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('transactions')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <GrTransaction 
                style={isActive('transactions') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
            </button>

            <button
              onClick={() => handleSectionChange('coadmins')}
              style={isActive('coadmins') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Co-Admins"
              onMouseEnter={(e) => {
                if (!isActive('coadmins')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('coadmins')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <ManagerIcon 
                style={isActive('coadmins') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
            </button>

            <button
              onClick={() => handleSectionChange('settings')}
              style={isActive('settings') ? 
                {...styles.collapsedButton, ...styles.collapsedButtonActive} : 
                styles.collapsedButton}
              title="Settings"
              onMouseEnter={(e) => {
                if (!isActive('settings')) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('settings')) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <Settings02Icon 
                style={isActive('settings') ? styles.collapsedIconActive : styles.collapsedIcon} 
                size={22}
              />
            </button>

            {/* AI Assistant Button - Collapsed */}
            <button
              onClick={toggleAIAssistant}
              style={{
                ...styles.collapsedButton,
                marginTop: 'auto',
                marginBottom: '16px'
              }}
              title="AI Assistant"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <FaRobot style={styles.collapsedIcon} size={22} />
            </button>
          </div>
        )}
      </div>

      <div style={styles.content}>
        {renderSection()}
      </div>

      {isSmallScreen && (
        <div style={styles.fullOverlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayIcon}>💻</div>
            <h2 style={styles.overlayTitle}>Desktop Experience Required</h2>
            <p style={styles.overlayText}>
              For optimal functionality and security, please access the Admin Portal from a desktop or tablet device.
            </p>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalVisible && (
        <div style={styles.centeredModal}>
          <div style={styles.modalCardSmall}>
            <FiAlertCircle style={{ ...styles.confirmIcon, color: '#EF4444' }} />
            <p style={styles.modalText}>Are you sure you want to log out of the Admin Portal?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#EF4444',
                  color: '#fff',
                }} 
                onClick={handleLogout}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
              >
                <FaSignOutAlt style={{ marginRight: '4px' }} />
                Logout
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#6B7280',
                  color: '#fff',
                }} 
                onClick={() => setLogoutModalVisible(false)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                Cancel
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
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#1E3A8A'}
                >
                  <FaPlus size={12} />
                  New Chat
                </button>
              </div>
              
              <div style={styles.aiSidebarContent}>
                {chatSessions.length > 0 && (
                  <div style={styles.sidebarSectionTitle}>Recent Chats</div>
                )}
                
                {chatSessions.length === 0 ? (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: '#666',
                    fontSize: '13px'
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
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#FEF2F2';
                          e.target.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#9CA3AF';
                        }}
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
                  <FaRobot size={18} />
                  AI Assistant
                  {currentChatId && (
                    <span style={{ fontSize: '13px', opacity: 0.8, marginLeft: '6px' }}>
                      - {chatSessions.find(chat => chat.id === currentChatId)?.title || 'Chat'}
                    </span>
                  )}
                </div>
                <button 
                  style={styles.aiCloseButton}
                  onClick={toggleAIAssistant}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
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
                      <span style={{ marginLeft: '6px', fontSize: '13px', color: '#666' }}>
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.backgroundColor = '#F9FAFB';
                    e.target.style.boxShadow = 'none';
                  }}
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
                      e.target.style.backgroundColor = '#1E3A8A';
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
                  backgroundColor: '#EF4444',
                  color: '#fff'
                }} 
                onClick={deleteChat}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
              >
                <FaTrash style={{ marginRight: '4px' }} />
                Delete
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#6B7280',
                  color: '#fff'
                }} 
                onClick={cancelDeleteChat}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={styles.spinner}></div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Logging out...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;