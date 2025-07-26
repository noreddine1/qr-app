import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';

const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Scanner</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      )}
      <View style={styles.buttonContainer}>
        <Button
          title={isSignUp ? 'Sign Up' : 'Login'}
          onPress={() => Alert.alert(isSignUp ? 'Sign Up' : 'Login', 'Functionality to be implemented')}
          color="#007AFF"
        />
      </View>
      <TouchableOpacity onPress={handleToggleMode}>
        <Text style={styles.toggleText}>
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  toggleText: {
    marginTop: 20,
    color: '#007AFF',
    fontSize: 16,
  },
});

export default LoginScreen;