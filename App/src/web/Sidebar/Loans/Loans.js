import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import ApplyLoans from './ApplyLoans'; // Component for loan applications
import ApprovedLoans from './ApprovedLoans'; // Component for approved loans
import RejectedLoans from './RejectedLoans'; // Component for rejected loans
import Icon from 'react-native-vector-icons/FontAwesome';
import * as XLSX from 'xlsx';

const Loans = () => {
  const [activeSection, setActiveSection] = useState('ApplyLoans');
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [rejectedLoans, setRejectedLoans] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);

  const handleSearch = (text) => {
    setSearchQuery(text);
    let filtered = [];

    const currentData =
      activeSection === 'ApplyLoans'
        ? pendingLoans
        : activeSection === 'approvedLoans'
        ? approvedLoans
        : rejectedLoans;

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

      if (activeSection === 'ApplyLoans') {
        const snapshot = await database.ref('Loans/LoanApplications').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'LoanApplications';
      } else if (activeSection === 'approvedLoans') {
        const snapshot = await database.ref('Loans/ApprovedLoans').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'ApprovedLoans';
      } else if (activeSection === 'rejectedLoans') {
        const snapshot = await database.ref('Loans/RejectedLoans').once('value');
        if (snapshot.exists()) {
          dataToDownload = flattenNestedData(snapshot.val());
        }
        tableName = 'RejectedLoans';
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
      section === 'ApplyLoans'
        ? pendingLoans
        : section === 'approvedLoans'
        ? approvedLoans
        : rejectedLoans;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const applySnapshot = await database.ref('Loans/LoanApplications').once('value');
        const approvedSnapshot = await database.ref('Loans/ApprovedLoans').once('value');
        const rejectedSnapshot = await database.ref('Loans/RejectedLoans').once('value');

        const applyData = applySnapshot.exists() ? flattenNestedData(applySnapshot.val()) : [];
        const approvedData = approvedSnapshot.exists() ? flattenNestedData(approvedSnapshot.val()) : [];
        const rejectedData = rejectedSnapshot.exists() ? flattenNestedData(rejectedSnapshot.val()) : [];

        setPendingLoans(applyData);
        setApprovedLoans(approvedData);
        setRejectedLoans(rejectedData);

        setFilteredData(applyData); // default
      } catch (error) {
        console.error('Error fetching loans:', error);
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
        <Text style={styles.headerText}>Loans</Text>
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {[
              { key: 'ApplyLoans', label: 'Loan Applications', color: '#2D5783' },
              { key: 'approvedLoans', label: 'Approved Loans', color: '#008000' },
              { key: 'rejectedLoans', label: 'Rejected Loans', color: '#FF0000' },
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
              {activeSection === 'ApplyLoans' && (
                <ApplyLoans loans={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'approvedLoans' && (
                <ApprovedLoans loans={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'rejectedLoans' && (
                <RejectedLoans loans={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
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


export default Loans;
