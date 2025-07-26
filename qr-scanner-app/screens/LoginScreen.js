import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const isDev = __DEV__; // Expo sets this to true in dev mode

  const [email, setEmail] = useState(isDev ? 'test@example.com' : '');
  const [password, setPassword] = useState(isDev ? '123456' : '');
  const [confirmPassword, setConfirmPassword] = useState(isDev ? '123456' : '');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthenticate = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      return Alert.alert('Error', 'Email and password are required.');
    }

    if (!emailRegex.test(email)) {
      return Alert.alert('Error', 'Please enter a valid email address.');
    }

    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }
    if (isSignUp && password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    // authentication logic 
    if (isSignUp) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        navigation.navigate('Home');
      } catch (error) {
        return Alert.alert('Error', error.message);
      }
      Alert.alert('Success', 'You have successfully signed up!');
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigation.navigate('Home');
      } catch (error) {
        return Alert.alert('Error', error.message);
      }
      Alert.alert('Success', 'You have successfully logged in!');
    }
    resetForm();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    if (isDev) { //just for development convenience
      resetForm();
    }
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
          onPress={() => {
            handleAuthenticate();
          }}
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