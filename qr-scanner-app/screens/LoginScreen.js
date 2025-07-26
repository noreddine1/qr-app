import React from "react";
import { Text, TextInput, Button, View, StyleSheet } from 'react-native'


export default function LoginScreen({ navigation }) {
    return (
        <View>
            <Text>Login Screen</Text>
            <Button title="Login" onPress={() => navigation.navigate('Home')}/>
        </View>
    );
}
