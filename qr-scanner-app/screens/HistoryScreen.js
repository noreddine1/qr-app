import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

const HistoryScreen = ({ navigation }) => {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchScans = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view scan history.');
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'scans'),
          where('email', '==', user.email),
          orderBy('scannedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const scanData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScans(scanData);
        setFilteredScans(scanData);
      } catch (error) {
        Alert.alert('Error', `Failed to fetch scan history: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  useEffect(() => {
    const filtered = scans.filter((scan) =>
      scan.data.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredScans(filtered);
  }, [searchQuery, scans]);

  const renderScanItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
      style={styles.scanItem}
    >
      <Text style={styles.scanData}>{item.data}</Text>
      <Text style={styles.scanMeta}>
        Scanned on: {item.scannedAt ? format(item.scannedAt.toDate(), 'PPp') : 'Unknown'}
      </Text>
      <Text style={styles.scanMeta}>Type: {item.type}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading scan history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search scans..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
      />
      {filteredScans.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching scans found.' : 'No scans found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredScans}
          keyExtractor={(item) => item.id}
          renderItem={renderScanItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  scanItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  scanData: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  scanMeta: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    paddingBottom: 20,
  },
});

export default HistoryScreen;