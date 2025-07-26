import React from "react";
import { View, Text, Button } from "react-native";

export default function ({ navigation }) {
    return (
        <View>
            <Text>Home Screen</Text>
            <Button title="Scan QR Code" onPress={() => navigation.navigate('Scanner')} />
            <Button title="Log Out" onPress={() => navigation.navigate("Login")} />
        </View>
    )
}