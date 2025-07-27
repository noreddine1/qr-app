import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

const ScanDetail = ({ scan }) => {
  if (!scan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No scan data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.label}>QR Code Data:</Text>
        <Text style={styles.value}>{scan.data}</Text>
        <Text style={styles.label}>Scanned On:</Text>
        <Text style={styles.value}>
          {scan.scannedAt ? format(scan.scannedAt.toDate(), 'PPp') : 'Unknown'}
        </Text>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{scan.type}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
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
  detailCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default ScanDetail;