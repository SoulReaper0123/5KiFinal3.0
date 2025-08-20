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
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../../firebaseConfig';
import { ref as dbRef, get } from 'firebase/database';

// Initialize Gemini AI with API key
// Using a hardcoded API key for now
const API_KEY = 'AIzaSyDPV6y1cgQMpOyJYKXIHeHXX0m6qIMrMZA';

console.log('API Key available:', API_KEY ? 'Yes' : 'No');
const genAI = new GoogleGenerativeAI(API_KEY);
// Use gemini-1.5-flash to match AdminHome implementation
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

      // Get member info
      const membersRef = dbRef(database, 'Members');
      const membersSnapshot = await get(membersRef);
      if (membersSnapshot.exists()) {
        const membersData = membersSnapshot.val();
        Object.keys(membersData).forEach(memberId => {
          const member = membersData[memberId];
          if (member && member.email === email) {
            userData.memberInfo = { id: memberId, ...member };
          }
        });
      }

      // Get user loans
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
                userData.loans.push({ id: loanId, ...loan });
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
                if (deposit.status === 'approved') {
                  userData.totalBalance += parseFloat(deposit.depositAmount) || 0;
                }
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
                if (withdrawal.status === 'approved') {
                  userData.totalBalance -= parseFloat(withdrawal.withdrawAmount) || 0;
                }
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

  // Check if API key is valid
  useEffect(() => {
    const checkApiKey = async () => {
      console.log('Checking API key...');
      try {
        console.log('Testing connection to Gemini API...');
        const result = await model.generateContent("Test connection");
        const response = await result.response;
        if (response) {
          setUseAI(true);
          console.log('Gemini API connected successfully');
        }
      } catch (error) {
        // Log a simplified error message without the full error details
        console.log('Gemini API connection check failed - Will try to use AI anyway');
        
        // Still set useAI to true to allow the app to try using AI
        // If it fails later, it will fall back to predefined responses
        setUseAI(true);
        
        // Only log that we're falling back to predefined responses if needed
        console.log('Will attempt to use AI but may fall back to predefined responses');
      }
    };
    
    checkApiKey();
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
        let userDataContext = '';
        
        if (userData) {
          userDataContext = `
          
User Account Information:
- Member ID: ${userData.memberInfo?.id || 'N/A'}
- Name: ${userData.memberInfo?.firstName || ''} ${userData.memberInfo?.lastName || ''}
- Email: ${userData.memberInfo?.email || userEmail}
- Current Balance: ₱${userData.totalBalance.toFixed(2)}
- Total Loans: ${userData.loans.length}
- Total Deposits: ${userData.deposits.length}
- Total Payments: ${userData.payments.length}
- Total Withdrawals: ${userData.withdrawals.length}

Recent Loans:
${userData.loans.slice(0, 3).map(loan => 
  `- Loan ID: ${loan.id}, Amount: ₱${loan.loanAmount}, Status: ${loan.status}, Date: ${loan.dateApplied}`
).join('\n') || '- No loans found'}

Recent Deposits:
${userData.deposits.slice(0, 3).map(deposit => 
  `- Deposit ID: ${deposit.id}, Amount: ₱${deposit.depositAmount}, Status: ${deposit.status}, Date: ${deposit.dateApplied}`
).join('\n') || '- No deposits found'}

Recent Payments:
${userData.payments.slice(0, 3).map(payment => 
  `- Payment ID: ${payment.id}, Amount: ₱${payment.paymentAmount}, Status: ${payment.status}, Date: ${payment.dateApplied}`
).join('\n') || '- No payments found'}
          `;
        }
        
        // Get context for the AI
        const context = `You are a helpful banking assistant for a mobile banking app called 5KI Financial Services. 
        The user's email is ${userEmail || 'not provided'}. 
        You have access to their account information and can answer questions about their specific account details.
        Provide concise, accurate information about their banking services, loans, deposits, withdrawals, and account management.
        Use the provided account data to answer specific questions about their balance, transactions, loan status, etc.
        Keep responses under 200 words and focus on being helpful and accurate.
        Always use Philippine Peso (₱) for currency formatting.${userDataContext}`;
        
        // Generate AI response
        const prompt = `${context}\n\nUser question: ${userQuery}`;
        
        // Check if API key is available
        if (!API_KEY || API_KEY.trim() === '') {
          throw new Error('API_KEY_MISSING');
        }
        
        // Create a new instance for each request to avoid any potential issues
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();
        
        console.log('Received response from Gemini API');
        
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
        console.error('AI error occurred - Using fallback response');
        
        // Always use a friendly message regardless of the error
        // Don't expose technical error details to the user
        const botMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: "I've reached my usage limit for the moment. Please try selecting one of the options below or try again later.",
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
      // Use predefined responses as fallback
      setTimeout(() => {
        const botMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: "I'm not sure I understand. Please select one of the options below for assistance.",
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

  const generateBotResponse = (option) => {
    let reply = '';
    let nextOptions = [];
    let nextContext = currentContext;

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
        reply = 'Your current balance can be viewed in your Account page. Would you like me to direct you there?';
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
        reply = 'You can apply for a loan in the Apply Loan section. Minimum loan amount is $1,000 with 5% interest.';
        nextOptions = loanOptions;
        break;
      case 'l2':
        reply = 'Loan requirements include: 650+ credit score, 2 years of employment history, and valid ID.';
        nextOptions = loanOptions;
        break;
      case 'l3':
        reply = 'Loan repayment can be done through automatic deductions or manual payments in the app.';
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