import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import ApplyDeposits from './ApplyDeposits'; // Corrected import for pending deposits
import ApprovedDeposits from './ApprovedDeposits'; // Component for approved deposits
import RejectedDeposits from './RejectedDeposits'; // Component for rejected deposits
import Icon from 'react-native-vector-icons/FontAwesome';
import * as XLSX from 'xlsx';

const Deposits = () => {
  const [activeSection, setActiveSection] = useState('ApplyDeposits'); // Changed default to ApplyDeposits
  const [pendingDeposits, setPendingDeposits] = useState([]); 
  const [approvedDeposits, setApprovedDeposits] = useState([]);
  const [rejectedDeposits, setRejectedDeposits] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);

  const handleSearch = (text) => {
    setSearchQuery(text);
    let filtered = [];

    const currentData =
      activeSection === 'ApplyDeposits' // Fixed to match ApplyDeposits section
        ? pendingDeposits
        : activeSection === 'approvedDeposits'
        ? approvedDeposits
        : rejectedDeposits;

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
  
      // Fetch data from the appropriate table
      if (view === 'applyDeposits') {
        const snapshot = await database.ref('Deposits/DepositApplications').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val()); // Flatten the data
        }
        tableName = 'DepositApplications';
      } else if (view === 'approvedDeposits') {
        const snapshot = await database.ref('Deposits/ApprovedDeposits').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'ApprovedDeposits';
      } else if (view === 'rejectedDeposits') {
        const snapshot = await database.ref('Deposits/RejectedDeposits').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'RejectedDeposits';
      }
  
      if (dataToDownload.length === 0) {
        console.log('No data to download');
        return;
      }
  
      // Convert the flattened data to a worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
  
      // Create Excel file
      const excelData = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });
  
      // Trigger download in the browser
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
      section === 'ApplyDeposits' // Fixed to match ApplyDeposits section
        ? pendingDeposits
        : section === 'approvedDeposits'
        ? approvedDeposits
        : rejectedDeposits;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.mainContainer}>
        {/* Static Header and Tabs */}
        <Text style={styles.headerText}>Deposits</Text>
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {[ 
              { key: 'ApplyDeposits', label: 'Deposit Applications', color: '#2D5783' }, // Fixed tab name
              { key: 'approvedDeposits', label: 'Approved Deposits', color: '#008000' },
              { key: 'rejectedDeposits', label: 'Rejected Deposits', color: '#FF0000' },
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

        {/* Dynamic Data Content */}
        <View style={styles.dataContainer}>
          {noMatch ? (
            <Text style={styles.noMatchText}>No Matches Found</Text>
          ) : (
            <>
              {activeSection === 'ApplyDeposits' && ( // Fixed to match ApplyDeposits
                <ApplyDeposits deposits={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'rejectedDeposits' && (
                <RejectedDeposits deposits={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'approvedDeposits' && (
                <ApprovedDeposits deposits={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
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

export default Deposits;