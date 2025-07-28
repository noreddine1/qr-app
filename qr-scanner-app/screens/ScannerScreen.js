import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  Vibration,
  StatusBar 
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

// Enhanced error types
const ERROR_TYPES = {
  AUTH_ERROR: 'auth/user-not-authenticated',
  PERMISSION_DENIED: 'permission-denied',
  NETWORK_ERROR: 'network-request-failed',
  FIRESTORE_ERROR: 'firestore/error',
  VALIDATION_ERROR: 'validation/error'
};

// Input validation utility
const validateQRData = (data) => {
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid QR code data');
  }
  
  if (data.length > 2000) {
    throw new Error('QR code data too long');
  }
  
  return true;
};

// Enhanced Firestore save function
const saveScanToFirestore = async (data, type) => {
  try {
    validateQRData(data);
    
    const user = auth.currentUser;
    if (!user) {
      const error = new Error('You must be logged in to scan QR codes.');
      error.code = ERROR_TYPES.AUTH_ERROR;
      throw error;
    }

    const scanData = {
      email: user.email,
      data: data.trim(),
      type,
      scannedAt: serverTimestamp(),
      userId: user.uid
    };

    const docRef = await addDoc(collection(db, 'scans'), scanData);
    return docRef.id;
  } catch (error) {
    console.error('Firestore save error:', error);
    
    if (error.code) {
      throw error;
    }
    
    if (error.message.includes('network')) {
      error.code = ERROR_TYPES.NETWORK_ERROR;
    } else if (error.message.includes('permission')) {
      error.code = ERROR_TYPES.PERMISSION_DENIED;
    } else {
      error.code = ERROR_TYPES.FIRESTORE_ERROR;
    }
    
    throw error;
  }
};

const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);
  
  // Animation values
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  // Enhanced permission request
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          setError('Camera permission is required to scan QR codes');
        }
      } catch (error) {
        console.error('Permission request error:', error);
        setError('Failed to request camera permission');
        setHasPermission(false);
      }
    };

    requestCameraPermission();
  }, []);

  // Animated scan line
  useEffect(() => {
    if (hasPermission && !scanned && !loading) {
      const animateScanLine = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(scanLineAnimation, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scanLineAnimation, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      animateScanLine();
    }
  }, [hasPermission, scanned, loading]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused - resetting scanner state');
      setIsFocused(true);
      setScanned(false);
      setError(null);
      
      return () => {
        console.log('Screen unfocused');
        setIsFocused(false);
      };
    }, [])
  );

  // Enhanced barcode scan handler
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || !isFocused || loading) return;

    // Haptic feedback
    Vibration.vibrate(100);
    
    setScanned(true);
    setError(null);

    try {
      setLoading(true);
      
      const scanId = await saveScanToFirestore(data, type);
      
      // Success animation
      Animated.timing(fadeAnimation, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Alert.alert('Success', 'QR code scanned successfully!', [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('ScanDetail', {
            scanId,
            scanData: { 
              data, 
              type, 
              scannedAt: Timestamp.fromDate(new Date()) // Convert Date to Firestore Timestamp
            },
          }),
        },
        {
          text: 'Scan Another',
          onPress: () => {
            setScanned(false);
            setError(null);
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          },
        },
      ]);
    } catch (error) {
      console.error('Scan error:', error);
      
      let errorMessage = 'Failed to save scan. Please try again.';
      let showRetry = true;
      
      switch (error.code) {
        case ERROR_TYPES.AUTH_ERROR:
          errorMessage = 'Please log in again to continue scanning.';
          showRetry = false;
          setTimeout(() => navigation.replace('Login'), 2000);
          break;
        case ERROR_TYPES.PERMISSION_DENIED:
          errorMessage = 'You do not have permission to save scans.';
          break;
        case ERROR_TYPES.NETWORK_ERROR:
          errorMessage = 'Network error. Check your connection and try again.';
          break;
        case ERROR_TYPES.VALIDATION_ERROR:
          errorMessage = 'Invalid QR code data detected.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      
      const alertButtons = [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) }
      ];
      
      if (showRetry) {
        alertButtons.unshift({
          text: 'Retry',
          onPress: () => {
            setScanned(false);
            setError(null);
          }
        });
      }
      
      Alert.alert('Error', errorMessage, alertButtons);
    } finally {
      setLoading(false);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Enhanced loading state
  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingTitle}>Setting up Camera</Text>
          <Text style={styles.loadingSubtitle}>
            Requesting camera permissions...
          </Text>
        </View>
      </View>
    );
  }

  // Enhanced permission denied state
  if (hasPermission === false || error?.includes('permission')) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <MaterialIcons name="camera-alt" size={60} color="#FF3B30" />
          </View>
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorMessage}>
            This app needs camera access to scan QR codes. Please enable camera permissions in your device settings.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={goBack}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Camera View */}
      {isFocused && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnimation }]}>
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
        </Animated.View>
      )}

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={goBack}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity style={styles.controlButton} onPress={toggleTorch}>
          <MaterialIcons 
            name={torchOn ? "flash-on" : "flash-off"} 
            size={24} 
            color={torchOn ? "#FFD60A" : "#fff"} 
          />
        </TouchableOpacity>
      </View>

      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scannerFrame}>
          {/* Corner borders */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* Animated scan line */}
          {!scanned && !loading && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-120, 120],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            {loading ? 'Processing...' : 'Position QR code in the frame'}
          </Text>
          <Text style={styles.instructionSubtitle}>
            {loading 
              ? 'Saving your scan...' 
              : 'Make sure the QR code is clearly visible and well-lit'
            }
          </Text>
          {loading && <ActivityIndicator size="large" color="#fff" style={styles.loadingSpinner} />}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <MaterialIcons name="history" size={24} color="#fff" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 320,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF88',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00FF88',
    borderRadius: 2,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    marginTop: 50,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingSpinner: {
    marginTop: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorBannerText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ScannerScreen;