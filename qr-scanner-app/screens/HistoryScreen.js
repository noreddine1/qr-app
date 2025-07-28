import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Enhanced fetch function with error handling
  const fetchScans = async (isRefresh = false) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Error', 'Please log in again to view your scan history.', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      
      const q = query(
        collection(db, 'scans'),
        where('email', '==', user.email),
        orderBy('scannedAt', sortOrder)
      );
      
      const querySnapshot = await getDocs(q);
      const scanData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setScans(scanData);
      setFilteredScans(scanData);
    } catch (error) {
      console.error('Fetch scans error:', error);
      
      let errorMessage = 'Failed to fetch scan history. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to access this data.';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage, [
        { text: 'Retry', onPress: () => fetchScans(isRefresh) },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [sortOrder]);

  // Enhanced search and filter functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    
    return scans.filter((scan) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        scan.data.toLowerCase().includes(searchLower) ||
        scan.type.toLowerCase().includes(searchLower) ||
        (scan.scannedAt && 
          format(scan.scannedAt.toDate(), 'PPP').toLowerCase().includes(searchLower))
      );
    });
  }, [searchQuery, scans]);

  useEffect(() => {
    setFilteredScans(searchResults);
  }, [searchResults]);

  // Enhanced date formatting
  const formatScanDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate();
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  // Determine QR code type icon
  const getQRIcon = (data, type) => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return 'link';
    } else if (data.includes('@') && data.includes('.')) {
      return 'email';
    } else if (data.startsWith('tel:')) {
      return 'phone';
    } else if (data.startsWith('sms:')) {
      return 'message';
    } else {
      return 'qr-code';
    }
  };

  // Enhanced scan item with better visual hierarchy
  const renderScanItem = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
      style={[styles.scanItem, { marginTop: index === 0 ? 0 : 10 }]}
      accessibilityLabel={`View details for scan: ${item.data}`}
      activeOpacity={0.7}
    >
      <View style={styles.scanHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={getQRIcon(item.data, item.type)} 
            size={28} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.scanMainContent}>
          <Text style={styles.scanData} numberOfLines={2}>
            {item.data}
          </Text>
          <View style={styles.scanMetaContainer}>
            <MaterialIcons name="schedule" size={16} color="#8E8E93" />
            <Text style={styles.scanMeta}>
              {formatScanDate(item.scannedAt)}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
      </View>
      
      <View style={styles.scanFooter}>
        <View style={styles.typeChip}>
          <Text style={styles.typeText}>
            {item.type.replace('org.iso.', '').toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Enhanced header with sorting and statistics
  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Scan History</Text>
          {scans.length > 0 && (
            <Text style={styles.subtitle}>
              {scans.length} scan{scans.length !== 1 ? 's' : ''} total
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          accessibilityLabel={`Sort ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
        >
          <MaterialIcons 
            name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'} 
            size={20} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Enhanced search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search scans, URLs, or dates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          accessibilityLabel="Search scans"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <MaterialIcons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Enhanced empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons 
        name={searchQuery ? "search-off" : "qr-code-scanner"} 
        size={80} 
        color="#C7C7CC" 
      />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No matching scans' : 'No scans yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No scans found for "${searchQuery}"`
          : 'Start scanning QR codes to see your history here'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <MaterialIcons name="qr-code-scanner" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Your First QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your scan history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredScans}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          filteredScans.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchScans(true)}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  scanItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanMainContent: {
    flex: 1,
    marginRight: 8,
  },
  scanData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 22,
  },
  scanMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanMeta: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
    fontWeight: '500',
  },
  scanFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HistoryScreen;