import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../../firebaseConfig';
import { ref as dbRef, get } from 'firebase/database';
import { generateEnhancedAIResponse, checkEnhancedAIServiceStatus } from '../../services/enhancedFirebaseAI';

// Firebase AI is now initialized in the service
console.log('Using Firebase AI with Gemini 2.0 Flash');

export default function Bot() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello! How can I help you today? You can select from the options below or type your own question.' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  // State for email
  const [userEmail, setUserEmail] = useState(null);
  
  // Get email and load user data from all possible sources
  useEffect(() => {
    const getEmailAndLoadData = async () => {
      try {
        // Try to get email from different sources
        const routeEmail = route.params?.email;
        const parentRouteEmail = navigation.getParent()?.getState()?.routes?.[0]?.params?.email;
        
        // Safely get auth email
        let authEmail = null;
        try {
          authEmail = auth?.currentUser?.email;
        } catch (error) {
          console.log('Auth not available:', error.message);
        }
        
        // Try to get email from SecureStore (for biometric login)
        let storedEmail = null;
        try {
          storedEmail = await SecureStore.getItemAsync('currentUserEmail');
        } catch (error) {
          console.error('Error getting email from SecureStore:', error);
        }
        
        // Use the first available email
        const email = routeEmail || parentRouteEmail || authEmail || storedEmail || 'Guest User';
        
        console.log('Bot - Using email:', email, 'from sources:', { 
          routeEmail, 
          parentRouteEmail, 
          authEmail, 
          storedEmail 
        });
        
        setUserEmail(email);
        
        // Load user loans if we have a valid email
        if (email && email !== 'Guest User') {
          loadUserLoans(email);
        }
      } catch (error) {
        console.error('Error getting email in Bot:', error);
        // Set a default email if there's an error
        setUserEmail('Guest User');
      }
    };
    
    getEmailAndLoadData();
  }, [route.params, navigation]);
  
  // Function to load user data (loans, deposits, payments, withdrawals)
  const loadUserData = async (email) => {
    try {
      const userData = {
        loans: [],
        deposits: [],
        payments: [],
        withdrawals: [],
        memberInfo: null,
        totalBalance: 0
      };

      // Get member info and balance
      const membersRef = dbRef(database, 'Members');
      const membersSnapshot = await get(membersRef);
      if (membersSnapshot.exists()) {
        const membersData = membersSnapshot.val();
        Object.keys(membersData).forEach(memberId => {
          const member = membersData[memberId];
          if (member && member.email === email) {
            userData.memberInfo = { id: memberId, ...member };
            // Get the actual balance from the Members table
            userData.totalBalance = parseFloat(member.balance) || 0;
            console.log(`Found member ${memberId} with balance: ₱${userData.totalBalance}`);
          }
        });
      }

      // Get user loan applications
      const loansRef = dbRef(database, 'Loans/LoanApplications');
      const loansSnapshot = await get(loansRef);
      if (loansSnapshot.exists()) {
        const loansData = loansSnapshot.val();
        Object.keys(loansData).forEach(memberId => {
          const memberLoans = loansData[memberId];
          if (memberLoans) {
            Object.keys(memberLoans).forEach(loanId => {
              const loan = memberLoans[loanId];
              if (loan && loan.email === email) {
                userData.loans.push({ id: loanId, memberId, ...loan });
              }
            });
          }
        });
      }

      // Get user current loans (approved loans)
      const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
      const currentLoansSnapshot = await get(currentLoansRef);
      if (currentLoansSnapshot.exists()) {
        const currentLoansData = currentLoansSnapshot.val();
        Object.keys(currentLoansData).forEach(memberId => {
          const memberCurrentLoans = currentLoansData[memberId];
          if (memberCurrentLoans && userData.memberInfo && userData.memberInfo.id === memberId) {
            Object.keys(memberCurrentLoans).forEach(loanId => {
              const currentLoan = memberCurrentLoans[loanId];
              if (currentLoan) {
                userData.currentLoans = userData.currentLoans || [];
                userData.currentLoans.push({ id: loanId, memberId, ...currentLoan });
              }
            });
          }
        });
      }

      // Get user deposits
      const depositsRef = dbRef(database, 'Deposits/DepositApplications');
      const depositsSnapshot = await get(depositsRef);
      if (depositsSnapshot.exists()) {
        const depositsData = depositsSnapshot.val();
        Object.keys(depositsData).forEach(memberId => {
          const memberDeposits = depositsData[memberId];
          if (memberDeposits) {
            Object.keys(memberDeposits).forEach(depositId => {
              const deposit = memberDeposits[depositId];
              if (deposit && deposit.email === email) {
                userData.deposits.push({ id: depositId, ...deposit });
              }
            });
          }
        });
      }

      // Get user payments
      const paymentsRef = dbRef(database, 'Payments/PaymentApplications');
      const paymentsSnapshot = await get(paymentsRef);
      if (paymentsSnapshot.exists()) {
        const paymentsData = paymentsSnapshot.val();
        Object.keys(paymentsData).forEach(memberId => {
          const memberPayments = paymentsData[memberId];
          if (memberPayments) {
            Object.keys(memberPayments).forEach(paymentId => {
              const payment = memberPayments[paymentId];
              if (payment && payment.email === email) {
                userData.payments.push({ id: paymentId, ...payment });
              }
            });
          }
        });
      }

      // Get user withdrawals
      const withdrawalsRef = dbRef(database, 'Withdraws/WithdrawApplications');
      const withdrawalsSnapshot = await get(withdrawalsRef);
      if (withdrawalsSnapshot.exists()) {
        const withdrawalsData = withdrawalsSnapshot.val();
        Object.keys(withdrawalsData).forEach(memberId => {
          const memberWithdrawals = withdrawalsData[memberId];
          if (memberWithdrawals) {
            Object.keys(memberWithdrawals).forEach(withdrawalId => {
              const withdrawal = memberWithdrawals[withdrawalId];
              if (withdrawal && withdrawal.email === email) {
                userData.withdrawals.push({ id: withdrawalId, ...withdrawal });
              }
            });
          }
        });
      }

      return userData;
    } catch (error) {
      console.log('Error loading user data:', error);
      return null;
    }
  };

  // Function to load user loans (keeping for backward compatibility)
  const loadUserLoans = async (email) => {
    try {
      const userData = await loadUserData(email);
      if (userData && userData.loans.length > 0) {
        const loanInfo = userData.loans.map(loan => 
          `Loan ID: ${loan.id}, Amount: ₱${loan.loanAmount}, Status: ${loan.status}, Date: ${loan.dateApplied}`
        ).join('\n');
        
        const botMessage = {
          id: Date.now().toString() + '-bot-loans',
          sender: 'bot',
          text: `I see you have ${userData.loans.length} loan(s) in our system. Here are the details:\n\n${loanInfo}`,
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.log('Error loading user loans:', error);
    }
  };

  // Predefined options for different stages of conversation
  const initialOptions = [
    { id: '1', text: 'Account Issues' },
    { id: '2', text: 'Loan Information' },
    { id: '3', text: 'Deposit Questions' },
    { id: '4', text: 'Withdrawal Help' },
    { id: '5', text: 'Balance Inquiry' },
  ];

  const accountOptions = [
    { id: 'a1', text: 'Update account information' },
    { id: 'a2', text: 'Account verification' },
    { id: 'a3', text: 'Close my account' },
    { id: 'a4', text: 'Back to main menu' },
  ];

  const loanOptions = [
    { id: 'l1', text: 'Apply for a loan' },
    { id: 'l2', text: 'Loan requirements' },
    { id: 'l3', text: 'Loan repayment' },
    { id: 'l4', text: 'Back to main menu' },
  ];

  const depositOptions = [
    { id: 'd1', text: 'How to deposit' },
    { id: 'd2', text: 'Deposit limits' },
    { id: 'd3', text: 'Deposit not showing' },
    { id: 'd4', text: 'Back to main menu' },
  ];

  const [currentOptions, setCurrentOptions] = useState(initialOptions);
  const [currentContext, setCurrentContext] = useState('initial');

  // Check if Firebase AI service is available
  useEffect(() => {
    const checkFirebaseAI = async () => {
      console.log('Checking Firebase AI service...');
      try {
        const status = await checkEnhancedAIServiceStatus();
        if (status.available) {
          setUseAI(true);
          console.log('Firebase AI connected successfully:', status.model);
        } else {
          console.log('Firebase AI not available:', status.error);
          setUseAI(false);
        }
      } catch (error) {
        console.log('Firebase AI connection check failed - Will try to use AI anyway');
        setUseAI(true);
        console.log('Will attempt to use Firebase AI but may fall back to predefined responses');
      }
    };
    
    checkFirebaseAI();
  }, []);

  const handleOptionSelect = (option) => {
    // Add user's selection to messages
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: option.text,
    };

    setMessages((prev) => [...prev, newMessage]);
    
    // Always scroll to bottom when user selects an option
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200); // Increased timeout for better reliability
    }
    
    // Generate bot response based on selection
    generateBotResponse(option);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userQuery = inputText;
    setInputText('');
    setIsLoading(true);
    
    // Always scroll to bottom when user sends a message
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200); // Increased timeout for better reliability
    }
    
    if (useAI) {
      try {
        console.log('Sending query to Gemini API...');
        
        // Get user data for context
        const userData = await loadUserData(userEmail);
        console.log('Bot AI - User data loaded:', JSON.stringify(userData, null, 2));
        let userDataContext = '';
        
        if (userData) {
          // Calculate approved deposits total
          const approvedDeposits = userData.deposits.filter(d => d.status === 'approved');
          const totalDeposited = approvedDeposits.reduce((sum, d) => sum + (parseFloat(d.depositAmount) || 0), 0);
          
          // Calculate approved withdrawals total
          const approvedWithdrawals = userData.withdrawals.filter(w => w.status === 'approved');
          const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + (parseFloat(w.withdrawAmount) || 0), 0);
          
          // Calculate current loan balances
          const currentLoanBalance = userData.currentLoans ? 
            userData.currentLoans.reduce((sum, loan) => sum + (parseFloat(loan.remainingBalance) || parseFloat(loan.loanAmount) || 0), 0) : 0;
          
          userDataContext = `

PERSONAL ACCOUNT DATA (CONFIDENTIAL - Only for ${userData.memberInfo?.firstName || 'this user'}):
===========================================
Member Information:
- Member ID: ${userData.memberInfo?.id || 'N/A'}
- Full Name: ${userData.memberInfo?.firstName || ''} ${userData.memberInfo?.middleName || ''} ${userData.memberInfo?.lastName || ''}
- Email: ${userData.memberInfo?.email || userEmail}
- Phone: ${userData.memberInfo?.phoneNumber || 'Not provided'}
- Address: ${userData.memberInfo?.address || 'Not provided'}

Financial Summary:
- Current Savings Balance: ₱${userData.totalBalance.toFixed(2)} (Real-time from database)
- Total Deposited (Approved): ₱${totalDeposited.toFixed(2)}
- Total Withdrawn (Approved): ₱${totalWithdrawn.toFixed(2)}
- Current Loan Balance: ₱${currentLoanBalance.toFixed(2)}

Account Activity:
- Loan Applications: ${userData.loans.length} (All statuses)
- Current Active Loans: ${userData.currentLoans?.length || 0}
- Deposit Transactions: ${userData.deposits.length}
- Withdrawal Transactions: ${userData.withdrawals.length}
- Payment Transactions: ${userData.payments.length}

Recent Loan Applications:
${userData.loans.slice(-3).map(loan => 
  `- Application ID: ${loan.transactionId || loan.id || 'N/A'}, Amount: ₱${loan.amount || 'N/A'}, Status: ${loan.status || 'N/A'}, Date: ${loan.dateApplied || 'N/A'}, Applicant: ${loan.firstName || 'N/A'} ${loan.lastName || 'N/A'}`
).join('\n') || '- No loan applications'}

Current Active Loans:
${userData.currentLoans?.slice(-3).map(loan => 
  `- Loan ID: ${loan.transactionId || loan.id || 'N/A'}, Original: ₱${loan.amount || loan.loanAmount || 'N/A'}, Remaining: ₱${loan.remainingBalance || loan.amount || 'N/A'}, Monthly Payment: ₱${loan.monthlyPayment || 'Not set'}`
).join('\n') || '- No active loans'}

Recent Deposits:
${userData.deposits.slice(-5).map(deposit => 
  `- Amount: ₱${deposit.amountToBeDeposited || deposit.amount || 'N/A'}, Status: ${deposit.status || 'N/A'}, Date: ${deposit.dateApplied || 'N/A'}, Account: ${deposit.accountName || 'Not specified'} (${deposit.accountNumber || 'N/A'})`
).join('\n') || '- No deposits found'}

Recent Withdrawals:
${userData.withdrawals.slice(-5).map(withdrawal => 
  `- Amount: ₱${withdrawal.amountWithdrawn || withdrawal.amount || 'N/A'}, Status: ${withdrawal.status || 'N/A'}, Date: ${withdrawal.dateApplied || 'N/A'}, Account: ${withdrawal.accountName || 'Not specified'} (${withdrawal.accountNumber || 'N/A'})`
).join('\n') || '- No withdrawals found'}

Recent Payments:
${userData.payments.slice(-5).map(payment => 
  `- Amount: ₱${payment.amountToBePaid || payment.amount || 'N/A'}, Status: ${payment.status || 'N/A'}, Date: ${payment.dateApplied || 'N/A'}, Payment Option: ${payment.paymentOption || 'Not specified'}`
).join('\n') || '- No payments found'}
          `;
        }
        
        // Get context for the AI
        const context = `You are a secure banking assistant for 5KI Financial Services mobile app. 

SECURITY RULES:
- You can ONLY provide information about the account holder: ${userEmail || 'current user'}
- NEVER provide information about other members or accounts
- If asked about other accounts, respond: "I can only provide information about your own account for security reasons"
- Always verify you're discussing the correct member ID: ${userData?.memberInfo?.id || 'N/A'}

CAPABILITIES:
- Answer questions about current account balance (from Members/${userData?.memberInfo?.id}/balance)
- Provide savings information, deposits, and withdrawals
- Provide loan information (applications and current loans)
- Explain transaction history and payment records
- Help with account inquiries and banking services
- Calculate totals and provide financial summaries

RESPONSE GUIDELINES:
- Keep responses under 200 words
- Use Philippine Peso (₱) formatting
- Be accurate and helpful
- Reference specific transaction IDs when relevant
- Explain the difference between loan applications and current active loans

${userDataContext}`;
        
        // Generate AI response using Google AI
        const prompt = `${context}\n\nUser question: ${userQuery}`;
        
        console.log('Sending query to Google AI...');
        const result = await generateEnhancedAIResponse(userQuery, userEmail, {
          maxOutputTokens: 512,
          temperature: 0.7
        });
        
        if (!result.success) {
          throw new Error(result.message || 'AI service unavailable');
        }
        
        const aiResponse = result.text;
        console.log('Received response from Google AI (Gemini 1.5 Flash)');
        
        const botMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: aiResponse,
        };
        
        // Add a slight delay to make the response feel more natural
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage]);
          
          // Only scroll to bottom if user hasn't scrolled up
          if (shouldAutoScroll && flatListRef.current) {
            setTimeout(() => {
              flatListRef.current.scrollToEnd({ animated: true });
            }, 200); // Increased timeout for better reliability
          }
          
          setIsLoading(false);
        }, 500);
      } catch (error) {
        // Log a simplified error message without the full error details
        console.log('Google AI quota limit reached - Using enhanced fallback response');
        
        // Check if it's a quota error and provide helpful fallback
        let fallbackText = '';
        if (error.message && error.message.includes('quota')) {
          fallbackText = `I've reached my daily AI limit, but I can still help you! 🤖

📊 **Your Account Summary:**
- Member ID: ${userData?.memberInfo?.id || 'N/A'}
- Current Balance: ₱${userData?.totalBalance?.toFixed(2) || '0.00'}
- Total Loans: ${userData?.loans?.length || 0}
- Total Deposits: ${userData?.deposits?.length || 0}
- Total Withdrawals: ${userData?.withdrawals?.length || 0}

💡 **I can help with:**
• Account balance inquiries
• Recent transaction history  
• Loan application status
• Deposit and withdrawal information

Please select from the options below or ask specific questions about your account!`;
        } else {
          fallbackText = `I'm temporarily having connection issues, but I can still help you! 🤖

📊 **Your Account Summary:**
- Member ID: ${userData?.memberInfo?.id || 'N/A'}
- Current Balance: ₱${userData?.totalBalance?.toFixed(2) || '0.00'}

Please try asking again or select from the available options below.`;
        }
        
        const botMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: fallbackText,
        };
        
        // Add a slight delay to make the response feel more natural
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage]);
          
          // Only scroll to bottom if user hasn't scrolled up
          if (shouldAutoScroll && flatListRef.current) {
            setTimeout(() => {
              flatListRef.current.scrollToEnd({ animated: true });
            }, 200); // Increased timeout for better reliability
          }
          
          setIsLoading(false);
        }, 500);
      }
    } else {
      // Use predefined responses with account data as fallback
      setTimeout(async () => {
        // Get user data for fallback responses
        const userData = await loadUserData(userEmail);
        
        // Generate smart fallback response based on user query
        let fallbackText = '';
        const lowerQuery = userQuery.toLowerCase();
        
        if (lowerQuery.includes('balance') || lowerQuery.includes('money') || lowerQuery.includes('savings')) {
          fallbackText = `💰 **Your Current Balance:** ₱${userData?.totalBalance?.toFixed(2) || '0.00'}

This is your real-time balance from our database. For more detailed information, please select from the options below.`;
        } else if (lowerQuery.includes('loan')) {
          fallbackText = `🏦 **Your Loan Information:**
- Total Loan Applications: ${userData?.loans?.length || 0}
- Current Active Loans: ${userData?.currentLoans?.length || 0}

For detailed loan information, please select "Loan Information" from the options below.`;
        } else if (lowerQuery.includes('deposit')) {
          fallbackText = `💳 **Your Deposit Information:**
- Total Deposits: ${userData?.deposits?.length || 0}

For detailed deposit information, please select "Deposit Questions" from the options below.`;
        } else if (lowerQuery.includes('withdraw')) {
          fallbackText = `💸 **Your Withdrawal Information:**
- Total Withdrawals: ${userData?.withdrawals?.length || 0}

For detailed withdrawal information, please select "Withdrawal Help" from the options below.`;
        } else {
          fallbackText = `I'm currently using basic responses. For better assistance, please select one of the options below:

📊 **Quick Info:**
- Your Balance: ₱${userData?.totalBalance?.toFixed(2) || '0.00'}
- Member ID: ${userData?.memberInfo?.id || 'N/A'}`;
        }
        
        const botMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: fallbackText,
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Only scroll to bottom if user hasn't scrolled up
        if (shouldAutoScroll && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 200); // Increased timeout for better reliability
        }
        
        setIsLoading(false);
      }, 500);
    }
  };

  const generateBotResponse = async (option) => {
    let reply = '';
    let nextOptions = [];
    let nextContext = currentContext;
    
    // Get user data for enhanced responses
    const userData = await loadUserData(userEmail);

    switch (option.id) {
      // Main menu options
      case '1':
        reply = 'What account issue are you experiencing?';
        nextOptions = accountOptions;
        nextContext = 'account';
        break;
      case '2':
        reply = 'What would you like to know about loans?';
        nextOptions = loanOptions;
        nextContext = 'loan';
        break;
      case '3':
        reply = 'What deposit question do you have?';
        nextOptions = depositOptions;
        nextContext = 'deposit';
        break;
      case '4':
        reply = 'To withdraw funds, make sure your account is verified. You can withdraw up to $10,000 daily.';
        nextOptions = initialOptions;
        nextContext = 'initial';
        break;
      case '5':
        reply = `💰 **Your Account Balance:**

**Current Balance:** ₱${userData?.totalBalance?.toFixed(2) || '0.00'}
**Member ID:** ${userData?.memberInfo?.id || 'N/A'}

📊 **Account Summary:**
- Total Loan Applications: ${userData?.loans?.length || 0}
- Total Deposits: ${userData?.deposits?.length || 0}
- Total Withdrawals: ${userData?.withdrawals?.length || 0}
- Total Payments: ${userData?.payments?.length || 0}

This balance is updated in real-time from our database. Is there anything else you'd like to know about your account?`;
        nextOptions = initialOptions;
        nextContext = 'initial';
        break;
      
      // Account options
      case 'a1':
        reply = 'You can update your account information in the Account Settings section of the app.';
        nextOptions = accountOptions;
        break;
      case 'a2':
        reply = 'Account verification requires a government-issued ID and a recent utility bill. Please visit our verification page.';
        nextOptions = accountOptions;
        break;
      case 'a3':
        reply = 'To close your account, please contact customer support at support@bank.com or call 1-800-BANK-HELP.';
        nextOptions = accountOptions;
        break;
      case 'a4':
        reply = 'What else can I help you with?';
        nextOptions = initialOptions;
        nextContext = 'initial';
        break;
      
      // Loan options
      case 'l1':
        reply = `🏦 **Apply for a Loan:**

You can apply for a loan in the Apply Loan section. 

**Your Current Status:**
- Current Balance: ₱${userData?.totalBalance?.toFixed(2) || '0.00'}
- Existing Loan Applications: ${userData?.loans?.length || 0}
- Active Loans: ${userData?.currentLoans?.length || 0}

**Requirements:**
- Minimum loan amount: ₱1,000
- Valid ID and employment proof
- Good standing account`;
        nextOptions = loanOptions;
        break;
      case 'l2':
        reply = `📋 **Loan Requirements:**

**Your Account Status:**
- Member ID: ${userData?.memberInfo?.id || 'N/A'}
- Account Balance: ₱${userData?.totalBalance?.toFixed(2) || '0.00'}

**General Requirements:**
- Valid government-issued ID
- Proof of income/employment
- Good account standing
- Minimum 6 months membership`;
        nextOptions = loanOptions;
        break;
      case 'l3':
        reply = `💳 **Loan Repayment Information:**

**Your Current Loans:**
- Active Loans: ${userData?.currentLoans?.length || 0}
- Loan Applications: ${userData?.loans?.length || 0}

**Payment Methods:**
- Through the app's Pay Loan section
- Bank transfer
- Over-the-counter payments
- Automatic deductions`;
        nextOptions = loanOptions;
        break;
      case 'l4':
        reply = 'What else can I help you with?';
        nextOptions = initialOptions;
        nextContext = 'initial';
        break;
      
      // Deposit options
      case 'd1':
        reply = 'To deposit, go to the Deposit page, enter amount, and follow instructions. Processing takes 1-2 business days.';
        nextOptions = depositOptions;
        break;
      case 'd2':
        reply = 'Daily deposit limit is $50,000. Monthly limit is $500,000. Contact us for higher limits.';
        nextOptions = depositOptions;
        break;
      case 'd3':
        reply = 'If deposit isn\'t showing, first check if it\'s been 2 business days. If issue persists, contact support.';
        nextOptions = depositOptions;
        break;
      case 'd4':
        reply = 'What else can I help you with?';
        nextOptions = initialOptions;
        nextContext = 'initial';
        break;
      
      default:
        reply = 'How else can I assist you?';
        nextOptions = initialOptions;
        nextContext = 'initial';
    }

    const botMessage = {
      id: Date.now().toString() + '-bot',
      sender: 'bot',
      text: reply,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage]);
      setCurrentOptions(nextOptions);
      setCurrentContext(nextContext);
      
      // Only scroll to bottom if user hasn't scrolled up
      if (shouldAutoScroll && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 200); // Increased timeout for better reliability
      }
    }, 500);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === 'bot' ? { color: '#333' } : { color: '#fff' },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({
              routes: [{ name: 'HomeTab' }],
            })
          }
        >
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ChatBot</Text>
      </View>

      {/* Chat Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: 20 } // Add extra padding at the bottom
            ]}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => setShouldAutoScroll(false)}
            onMomentumScrollEnd={(event) => {
              // Check if user is at the bottom of the list
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const paddingToBottom = 20;
              const isAtBottom = layoutMeasurement.height + contentOffset.y >= 
                contentSize.height - paddingToBottom;
              
              setShouldAutoScroll(isAtBottom);
            }}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </View>

        {/* Quick Options */}
        <View style={styles.floatingOptionsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsScrollContainer}
          >
            {currentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.floatingOptionButton}
                onPress={() => handleOptionSelect(option)}
                disabled={isLoading}
              >
                <Text style={styles.floatingOptionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text Input for AI Assistant */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#234E70',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 35,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chatContainer: {
    flex: 1,
    paddingBottom: 10, // Add padding to prevent content from being covered
  },
  messageList: {
    padding: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 6,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 15,
    marginLeft: 10,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#B0C4DE',
  },
  floatingOptionsContainer: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  optionsScrollContainer: {
    paddingRight: 10, // Add some padding at the end
  },
  floatingOptionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});