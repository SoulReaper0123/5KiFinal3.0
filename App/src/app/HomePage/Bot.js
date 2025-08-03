import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Bot() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const navigation = useNavigation();

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

  const handleOptionSelect = (option) => {
    // Add user's selection to messages
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: option.text,
    };

    setMessages((prev) => [...prev, newMessage]);
    
    // Generate bot response based on selection
    generateBotResponse(option);
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
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Options - Now displayed vertically */}
        <View style={styles.optionsContainer}>
          {currentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleOptionSelect(option)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
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
  optionsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 10,
  },
  optionButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});