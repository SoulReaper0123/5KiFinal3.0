import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { generateAIResponse, checkAIServiceStatus } from '../services/firebaseAI';

const AITestComponent = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);

  const testAI = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const result = await generateAIResponse(prompt);
      
      if (result.success) {
        setResponse(result.text);
        Alert.alert('Success', 'AI response generated successfully!');
      } else {
        setResponse(`Error: ${result.message}`);
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const status = await checkAIServiceStatus();
      setServiceStatus(status);
      
      if (status.available) {
        Alert.alert('Service Status', `✅ Firebase AI is working!\nModel: ${status.model}`);
      } else {
        Alert.alert('Service Status', `❌ Firebase AI is not available\nError: ${status.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to check service status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase AI Test</Text>
      
      <TouchableOpacity style={styles.statusButton} onPress={checkStatus}>
        <Text style={styles.buttonText}>Check AI Service Status</Text>
      </TouchableOpacity>

      {serviceStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Status: {serviceStatus.available ? '✅ Available' : '❌ Not Available'}
          </Text>
          <Text style={styles.statusText}>Model: {serviceStatus.model}</Text>
          <Text style={styles.statusText}>Provider: {serviceStatus.provider}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter your prompt here..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testAI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Generating...' : 'Generate AI Response'}
        </Text>
      </TouchableOpacity>

      {response ? (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default AITestComponent;