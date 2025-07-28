import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import WithdrawApplications from './WithdrawApplications'; // Component for withdraw applications
import ApprovedWithdraws from './ApprovedWithdraws'; // Component for approved withdraws
import RejectedWithdraws from './RejectedWithdraws'; // Component for rejected withdraws
import Icon from 'react-native-vector-icons/FontAwesome';
import * as XLSX from 'xlsx';
import { database } from '../../../firebaseConfig'; // Ensure you have the correct path for firebaseConfig

const Withdraws = () => {
  const [activeSection, setActiveSection] = useState('WithdrawApplications');
  const [withdrawApplications, setWithdrawApplications] = useState([]);
  const [approvedWithdraws, setApprovedWithdraws] = useState([]);
  const [rejectedWithdraws, setRejectedWithdraws] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);

  const handleSearch = (text) => {
    setSearchQuery(text);
    let filtered = [];

    const currentData =
      activeSection === 'WithdrawApplications'
        ? withdrawApplications
        : activeSection === 'ApprovedWithdraws'
        ? approvedWithdraws
        : rejectedWithdraws;

    filtered = currentData.filter(item =>
      `${item.firstName ?? ''} ${item.lastName ?? ''}`
        .toLowerCase()
        .includes(text.toLowerCase())
    );

    setNoMatch(filtered.length === 0);
    setFilteredData(filtered);
  };

  const handleDownload = async () => {
    try {
      let dataToDownload = [];
      let tableName = '';

      if (activeSection === 'WithdrawApplications') {
        const snapshot = await database.ref('Withdrawals').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'WithdrawApplications';
      } else if (activeSection === 'ApprovedWithdraws') {
        const snapshot = await database.ref('ApprovedWithdraws').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'ApprovedWithdraws';
      } else if (activeSection === 'RejectedWithdraws') {
        const snapshot = await database.ref('RejectedWithdraws').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'RejectedWithdraws';
      }

      if (dataToDownload.length === 0) {
        console.log('No data to download');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

      const excelData = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });
      const blob = new Blob([s2ab(excelData)], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${tableName}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
  }

  const handleTabSwitch = (section) => {
    setActiveSection(section);
    setSearchQuery('');
    const defaultData =
      section === 'WithdrawApplications'
        ? withdrawApplications
        : section === 'ApprovedWithdraws'
        ? approvedWithdraws
        : rejectedWithdraws;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const withdrawSnapshot = await database.ref('Withdrawals').once('value');
        const approvedSnapshot = await database.ref('ApprovedWithdraws').once('value');
        const rejectedSnapshot = await database.ref('RejectedWithdraws').once('value');

        const withdrawData = withdrawSnapshot.exists() ? flattenNestedData(withdrawSnapshot.val()) : [];
        const approvedData = approvedSnapshot.exists() ? flattenNestedData(approvedSnapshot.val()) : [];
        const rejectedData = rejectedSnapshot.exists() ? flattenNestedData(rejectedSnapshot.val()) : [];

        setWithdrawApplications(withdrawData);
        setApprovedWithdraws(approvedData);
        setRejectedWithdraws(rejectedData);

        setFilteredData(withdrawData); // default
      } catch (error) {
        console.error('Error fetching withdraws:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerText}>Withdraws</Text>
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {[ 
              { key: 'WithdrawApplications', label: 'Withdraw Applications', color: '#2D5783' },
              { key: 'ApprovedWithdraws', label: 'Approved Withdraws', color: '#008000' },
              { key: 'RejectedWithdraws', label: 'Rejected Withdraws', color: '#FF0000' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  backgroundColor: activeSection === tab.key ? tab.color : 'transparent',
                  borderColor: tab.color,
                }}
                onPress={() => handleTabSwitch(tab.key)}
              >
                <Text style={{
                  ...styles.tabText,
                  color: activeSection === tab.key ? '#fff' : tab.color,
                  fontWeight: '500',
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleDownload} style={styles.downloadIcon}>
            <Icon name="download" size={30} color="#001F3F" />
          </TouchableOpacity>
        </View>

        <View style={styles.dataContainer}>
          {noMatch ? (
            <Text style={styles.noMatchText}>No Matches Found</Text>
          ) : (
            <>
              {activeSection === 'WithdrawApplications' && (
                <WithdrawApplications withdraws={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'ApprovedWithdraws' && (
                <ApprovedWithdraws withdraws={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'RejectedWithdraws' && (
                <RejectedWithdraws withdraws={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  safeAreaView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContainer: {
    flex: 1,
    padding: 10,
    marginTop: 70,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 34,
    marginBottom: 10,
    marginLeft: 25,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginLeft: 25,
    marginRight: 25,
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: -10,
    borderRadius: 25,
    borderWidth: 1,
  },
  tabText: {
    textAlign: 'center',
  },
  downloadIcon: {
    flexDirection: 'row',
    alignItems: 'end',
  },
  dataContainer: {
    flex: 1,
  },
  noMatchText: {
    textAlign: 'center',
    marginTop: 20,
  },
};

export default Withdraws;
