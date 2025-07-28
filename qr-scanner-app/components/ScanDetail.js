import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking, 
  Alert,
  Share,
  ScrollView
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { format, isToday, isYesterday } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';

const ScanDetail = ({ scan, navigation }) => {
  const [copied, setCopied] = useState(false);

  if (!scan) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={80} color="#C7C7CC" />
        <Text style={styles.errorTitle}>No Scan Data</Text>
        <Text style={styles.errorText}>
          The scan details could not be loaded. Please try again.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation && navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Enhanced date formatting with null safety
  const formatScanDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    
    // Handle both Firestore Timestamp and JavaScript Date objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // String date
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
    }
  };

  // Determine QR code type and get appropriate icon
  const getQRTypeInfo = (data, type) => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return { icon: 'link', label: 'Website URL', color: '#007AFF', actionable: true };
    } else if (data.includes('@') && data.includes('.') && !data.includes(' ')) {
      return { icon: 'email', label: 'Email Address', color: '#FF9500', actionable: true };
    } else if (data.startsWith('tel:') || /^\+?[\d\s-()]+$/.test(data)) {
      return { icon: 'phone', label: 'Phone Number', color: '#34C759', actionable: true };
    } else if (data.startsWith('sms:')) {
      return { icon: 'message', label: 'SMS Message', color: '#32D74B', actionable: true };
    } else if (data.startsWith('wifi:')) {
      return { icon: 'wifi', label: 'WiFi Network', color: '#5856D6', actionable: false };
    } else if (data.startsWith('geo:') || data.includes('maps.google.com')) {
      return { icon: 'location-on', label: 'Location', color: '#FF3B30', actionable: true };
    } else {
      return { icon: 'qr-code', label: 'Text Data', color: '#8E8E93', actionable: false };
    }
  };

  const typeInfo = getQRTypeInfo(scan.data, scan.type);

  // Handle copying to clipboard - Updated to use Expo Clipboard
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(scan.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Handle sharing
  const handleShare = async () => {
    try {
      await Share.share({
        message: scan.data,
        title: 'QR Code Data',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share content');
    }
  };

  // Handle opening links/actions
  const handleAction = async () => {
    try {
      if (typeInfo.icon === 'link') {
        await Linking.openURL(scan.data);
      } else if (typeInfo.icon === 'email') {
        await Linking.openURL(`mailto:${scan.data}`);
      } else if (typeInfo.icon === 'phone') {
        const phoneNumber = scan.data.startsWith('tel:') ? scan.data : `tel:${scan.data}`;
        await Linking.openURL(phoneNumber);
      } else if (typeInfo.icon === 'message') {
        await Linking.openURL(scan.data);
      } else if (typeInfo.icon === 'location-on') {
        await Linking.openURL(scan.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open this content');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Type Card */}
      <View style={styles.typeCard}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}15` }]}>
          <MaterialIcons name={typeInfo.icon} size={32} color={typeInfo.color} />
        </View>
        <View style={styles.typeInfo}>
          <Text style={styles.typeLabel}>{typeInfo.label}</Text>
          <Text style={styles.typeSubtitle}>
            Scanned {formatScanDate(scan.scannedAt)}
          </Text>
        </View>
      </View>

      {/* Data Card */}
      <View style={styles.dataCard}>
        <View style={styles.dataHeader}>
          <Text style={styles.dataLabel}>QR Code Content</Text>
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <MaterialIcons 
              name={copied ? "check" : "content-copy"} 
              size={20} 
              color={copied ? "#34C759" : "#007AFF"} 
            />
            <Text style={[styles.copyText, copied && styles.copiedText]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dataContent}>
          <Text style={styles.dataValue} selectable={true}>
            {scan.data}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {typeInfo.actionable && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleAction}
          >
            <MaterialIcons name="open-in-new" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {typeInfo.icon === 'link' ? 'Open Link' :
               typeInfo.icon === 'email' ? 'Send Email' :
               typeInfo.icon === 'phone' ? 'Call Number' :
               typeInfo.icon === 'message' ? 'Send Message' :
               typeInfo.icon === 'location-on' ? 'View Location' : 'Open'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={handleShare}
        >
          <MaterialIcons name="share" size={20} color="#007AFF" />
          <Text style={styles.secondaryActionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Metadata Card */}
      <View style={styles.metadataCard}>
        <Text style={styles.metadataTitle}>Scan Information</Text>
        
        <View style={styles.metadataRow}>
          <MaterialIcons name="schedule" size={20} color="#8E8E93" />
          <View style={styles.metadataContent}>
            <Text style={styles.metadataLabel}>Date & Time</Text>
            <Text style={styles.metadataValue}>
              {formatScanDate(scan.scannedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.metadataRow}>
          <MaterialIcons name="qr-code-2" size={20} color="#8E8E93" />
          <View style={styles.metadataContent}>
            <Text style={styles.metadataLabel}>QR Code Type</Text>
            <Text style={styles.metadataValue}>
              {scan.type ? scan.type.replace('org.iso.', '').toUpperCase() : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.metadataRow}>
          <MaterialIcons name="text-fields" size={20} color="#8E8E93" />
          <View style={styles.metadataContent}>
            <Text style={styles.metadataLabel}>Content Length</Text>
            <Text style={styles.metadataValue}>
              {scan.data ? scan.data.length : 0} characters
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  typeSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dataCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  copiedText: {
    color: '#34C759',
  },
  dataContent: {
    padding: 20,
  },
  dataValue: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  secondaryAction: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  metadataCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataContent: {
    marginLeft: 12,
    flex: 1,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});

export default ScanDetail;