import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import ScanDetail from '../components/ScanDetail';

const ScanDetailScreen = ({ route }) => {
  const { scanId } = route.params; // Get scanId from navigation params
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScan = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view scan details.');
        setLoading(false);
        return;
      }

      try {
        const scanRef = doc(db, 'scans', scanId);
        const scanDoc = await getDoc(scanRef);
        if (scanDoc.exists()) {
          const scanData = { id: scanDoc.id, ...scanDoc.data() };
          // Verify the scan belongs to the user
          if (scanData.email === user.email) {
            setScan(scanData);
          } else {
            Alert.alert('Error', 'You do not have permission to view this scan.');
          }
        } else {
          Alert.alert('Error', 'Scan not found.');
        }
      } catch (error) {
        Alert.alert('Error', `Failed to fetch scan: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <ScanDetail scan={scan} />;
};

export default ScanDetailScreen;