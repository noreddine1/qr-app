import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth } from '../firebase/config';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', `Failed to log out: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Scanner</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Scanner')}
        accessibilityLabel="Navigate to QR Code Scanner"
      >
        <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('History')}
        accessibilityLabel="Navigate to Scan History"
      >
        <MaterialIcons name="history" size={24} color="#fff" />
        <Text style={styles.buttonText}>View Scan History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
        disabled={loading}
        accessibilityLabel="Log out of the application"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialIcons name="logout" size={24} color="#fff" />
            <Text style={styles.buttonText}>Log Out</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});