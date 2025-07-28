import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const Dashboard = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.content}>
        Welcome to the Admin Dashboard. Here you can manage various aspects of the platform.
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statTitle}>Total Members</Text>
          <Text style={styles.statValue}>200</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statTitle}>Pending Loans</Text>
          <Text style={styles.statValue}>5</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statTitle}>Total Withdrawals</Text>
          <Text style={styles.statValue}>$10,000</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  content: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Allow items to wrap in case of smaller screens
  },
  statItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '30%',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
});

export default Dashboard;
