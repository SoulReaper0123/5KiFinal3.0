import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Bot() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const [inputText, setInputText] = useState('');
  const navigation = useNavigation();

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
    };

    setMessages((prev) => [...prev, newMessage]);
    generateBotResponse(inputText);
    setInputText('');
    Keyboard.dismiss();
  };

  const generateBotResponse = (userInput) => {
    let reply = 'Sorry, I didn’t understand that. Try asking about loans, deposits, or your account.';

    const text = userInput.toLowerCase();

    if (text.includes('hello') || text.includes('hi')) {
      reply = 'Hi there! 😊 How can I assist you?';
    } else if (text.includes('help')) {
      reply = 'Sure! I can help you with your account, loans, deposits, and payments.';
    } else if (text.includes('thank')) {
      reply = 'You’re welcome! 🙌';
    } else if (text.includes('loan')) {
      reply = 'You can apply for a loan under the Apply Loan section. Do you want to know the requirements?';
    } else if (text.includes('deposit')) {
      reply = 'To deposit, go to the Deposit page and enter the amount.';
    } else if (text.includes('withdraw')) {
      reply = 'To withdraw funds, make sure your account is verified, then proceed to the Withdraw section.';
    } else if (text.includes('balance')) {
      reply = 'Your current balance can be viewed in your Account page.';
    } else if (text.includes('account')) {
      reply = 'You can update your account information in the Account Settings.';
    } else if (text.includes('how are you')) {
      reply = 'I’m just a bot, but I’m always ready to help! 😊';
    }

    const botMessage = {
      id: Date.now().toString() + '-bot',
      sender: 'bot',
      text: reply,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMessage]);
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
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
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
  messageList: {
    padding: 10,
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
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
    marginBottom: 35,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
    height: 40,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});