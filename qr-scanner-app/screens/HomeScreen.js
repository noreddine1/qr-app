import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { auth } from '../firebase/config';

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', `Failed to log out: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Scanner</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Scan QR Code"
          onPress={() => navigation.navigate('Scanner')}
          color="#007AFF"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="View Scan History"
          onPress={() => navigation.navigate('History')}
          color="#007AFF"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Log Out" onPress={handleLogout} color="#FF3B30" />
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 10,
  },
});