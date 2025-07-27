import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns'; // For formatting timestamps

const HistoryScreen = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.log(error)
        Alert.alert('Error', `Failed to fetch scan history: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  const renderScanItem = ({ item }) => (
    <View style={styles.scanItem}>
      <Text style={styles.scanData}>{item.data}</Text>
      <Text style={styles.scanMeta}>
        Scanned on: {item.scannedAt ? format(item.scannedAt.toDate(), 'PPp') : 'Unknown'}
      </Text>
      <Text style={styles.scanMeta}>Type: {item.type}</Text>
    </View>
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
      {scans.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No scans found.</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
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