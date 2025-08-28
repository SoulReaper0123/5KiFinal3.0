import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import Registrations from './Registrations';
import RejectedRegistrations from '../Registrations/RejectedRegistrations';
import ApprovedRegistrations from '../Registrations/ApprovedRegistrations';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as XLSX from 'xlsx';

const Register = () => {
  const [activeSection, setActiveSection] = useState('registrations');
  const [registrations, setRegistrations] = useState([]); // Static data can be added here
  const [rejectedRegistrations, setRejectedRegistrations] = useState([]); // Static data can be added here
  const [approvedRegistrations, setApprovedRegistrations] = useState([]); // Static data can be added here
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false); // Set to false as we are no longer fetching data
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);

  const handleSearch = (text) => {
    setSearchQuery(text);
    let filtered = [];

    const currentData =
      activeSection === 'registrations'
        ? registrations
        : activeSection === 'rejectedRegistrations'
        ? rejectedRegistrations
        : approvedRegistrations;

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
      // Avoid web-only APIs on native
      if (Platform.OS !== 'web') {
        console.log('Export to Excel is only available on web.');
        return;
      }

      let dataToDownload = [];
      let tableName =
        activeSection === 'rejectedRegistrations'
          ? 'RejectedRegistrations'
          : activeSection === 'approvedRegistrations'
          ? 'ApprovedRegistrations'
          : 'Registrations';

      dataToDownload = filteredData;

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
      section === 'registrations'
        ? registrations
        : section === 'rejectedRegistrations'
        ? rejectedRegistrations
        : approvedRegistrations;
    setFilteredData(defaultData);
    setNoMatch(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.mainContainer}>
        <Text style={styles.headerText}>Registrations</Text>

        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {[ 
              { key: 'registrations', label: 'Registration Applications', color: '#2D5783' },
              { key: 'approvedRegistrations', label: 'Approved Applications', color: '#008000' },
              { key: 'rejectedRegistrations', label: 'Rejected Applications', color: '#FF0000' },
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
              {activeSection === 'registrations' && (
                <Registrations registrations={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'rejectedRegistrations' && (
                <RejectedRegistrations rejectedRegistrations={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
              )}
              {activeSection === 'approvedRegistrations' && (
                <ApprovedRegistrations approvedRegistrations={filteredData} searchQuery={searchQuery} onSearch={handleSearch} />
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

export default Register;