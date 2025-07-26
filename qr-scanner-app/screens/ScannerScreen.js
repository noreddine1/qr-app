import { View, Text } from "react-native";
import { Camera } from "expo-camera";
import { useEffect, useState } from "react";

const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View>
        <Text>No access to camera</Text>
      </View>
    );
  }
  return (
    <View>
      <Text>Camera permission granted</Text>
    </View>
  );
};

export default ScannerScreen;