import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import ScanDetail from '../components/ScanDetail';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ScanDetailScreen = ({ route, navigation }) => {
  const { scanId, scanData } = route.params || {}; // Get scanId and optional scanData from navigation params
  const [scan, setScan] = useState(scanData || null); // Use scanData if available immediately
  const [loading, setLoading] = useState(!scanData); // Don't show loading if we already have data
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Enhanced fetch function with better error handling
  const fetchScan = async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
      setError(null);
    }

    const user = auth.currentUser;
    if (!user) {
      setError({
        type: 'auth',
        title: 'Authentication Required',
        message: 'Please log in again to view scan details.',
        action: () => navigation.replace('Login')
      });
      setLoading(false);
      setRetrying(false);
      return;
    }

    if (!scanId) {
      setError({
        type: 'validation',
        title: 'Invalid Request',
        message: 'No scan ID provided. Please try again.',
        action: () => navigation.goBack()
      });
      setLoading(false);
      setRetrying(false);
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
          setError(null);
        } else {
          setError({
            type: 'permission',
            title: 'Access Denied',
            message: 'You do not have permission to view this scan.',
            action: () => navigation.goBack()
          });
        }
      } else {
        setError({
          type: 'not-found',
          title: 'Scan Not Found',
          message: 'This scan may have been deleted or does not exist.',
          action: () => navigation.goBack()
        });
      }
    } catch (error) {
      console.error('Fetch scan error:', error);
      
      let errorMessage = 'Failed to load scan details. Please try again.';
      let errorType = 'network';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to access this data.';
        errorType = 'permission';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
        errorType = 'network';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        errorType = 'service';
      }
      
      setError({
        type: errorType,
        title: 'Error Loading Scan',
        message: errorMessage,
        canRetry: true
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (!scan) {
      fetchScan();
    }
  }, [scanId]);

  // Refresh data when screen comes into focus (in case data was updated elsewhere)
  useFocusEffect(
    React.useCallback(() => {
      if (scan && scanId) {
        // Silently refresh the data without showing loading
        fetchScan();
      }
    }, [scanId])
  );

  const handleRetry = () => {
    setLoading(true);
    fetchScan(true);
  };

  const handleErrorAction = () => {
    if (error?.action) {
      error.action();
    } else {
      navigation.goBack();
    }
  };

  // Enhanced loading state
  if (loading && !scan) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingTitle}>Loading Scan Details</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch your scan information...
          </Text>
        </View>
      </View>
    );
  }

  // Enhanced error state
  if (error && !scan) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <View style={[styles.errorIcon, { backgroundColor: getErrorColor(error.type) }]}>
            <MaterialIcons 
              name={getErrorIcon(error.type)} 
              size={40} 
              color="#fff" 
            />
          </View>
          
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          
          <View style={styles.errorActions}>
            {error.canRetry && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleRetry}
                disabled={retrying}
              >
                {retrying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="refresh" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleErrorAction}
            >
              <MaterialIcons name="arrow-back" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Show the scan detail component
  return <ScanDetail scan={scan} navigation={navigation} />;
};

// Helper functions for error states
const getErrorIcon = (errorType) => {
  switch (errorType) {
    case 'auth': return 'lock';
    case 'permission': return 'block';
    case 'not-found': return 'search-off';
    case 'network': return 'wifi-off';
    case 'service': return 'cloud-off';
    default: return 'error-outline';
  }
};

const getErrorColor = (errorType) => {
  switch (errorType) {
    case 'auth': return '#FF9500';
    case 'permission': return '#FF3B30';
    case 'not-found': return '#8E8E93';
    case 'network': return '#007AFF';
    case 'service': return '#5856D6';
    default: return '#FF3B30';
  }
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 280,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 320,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ScanDetailScreen;