import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const saveScanToFirestore = async (data, type) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to scan QR codes.');
  }
  const docRef = await addDoc(collection(db, 'scans'), {
    email: user.email,
    data,
    type,
    scannedAt: serverTimestamp(),
  });
  return docRef.id; // Return the document ID
};

const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [torchOn, setTorchOn] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Reset scanned state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused - resetting scanner state');
      setIsFocused(true);
      setScanned(false);
      
      return () => {
        console.log('Screen unfocused');
        setIsFocused(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || !isFocused) return;

    setScanned(true);

    try {
      // Add loading state
      setLoading(true);
      
      const scanId = await saveScanToFirestore(data, type);
      
      // Add success feedback
      Alert.alert('Success', 'QR code scanned successfully!', [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('ScanDetail', {
            scanId,
            scanData: { data, type, scannedAt: new Date() },
          }),
        },
        {
          text: 'Scan Another',
          onPress: () => setScanned(false),
        },
      ]);
    } catch (error) {
      console.error('Scan error:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to save scan. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to save scans.';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Check your connection.';
      }
      
      Alert.alert('Error', errorMessage, [
        { text: 'Retry', onPress: () => setScanned(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          facing="back"
          torch={torchOn ? 'on' : 'off'}
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.frame}>
          <Text style={styles.scanningText}>
            {loading ? 'Processing...' : 'Align QR code within the frame'}
          </Text>
          {loading && <ActivityIndicator size="large" color="#00FF00" />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  scanningText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ScannerScreen;