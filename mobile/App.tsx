import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Login from './src/components/Login';
import RoomSelection from './src/components/RoomSelection';
import Arena from './src/components/Game';

const Stack = createStackNavigator();

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [showRoomSelection, setShowRoomSelection] = useState(false);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    setShowRoomSelection(true);
  };

  const handleRoomSelect = (newSpaceId: string) => {
    setSpaceId(newSpaceId);
    setShowRoomSelection(false);
  };

  const handleLogout = () => {
    setToken(null);
    setSpaceId(null);
    setShowRoomSelection(false);
  };

  if (!token) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Login onLogin={handleLogin} />
      </GestureHandlerRootView>
    );
  }

  if (showRoomSelection) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <RoomSelection onRoomSelect={handleRoomSelect} token={token} />
      </GestureHandlerRootView>
    );
  }

  if (!spaceId) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <RoomSelection onRoomSelect={handleRoomSelect} token={token} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>2D Metaverse</Text>
              <Text style={styles.headerSubtitle}>Interactive Virtual World</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.roomInfo}>
              <Text style={styles.roomLabel}>Room: </Text>
              <Text style={styles.roomId}>{spaceId?.slice(0, 8)}...</Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowRoomSelection(true)}
            >
              <Text style={styles.headerButtonIcon}>🔄</Text>
              <Text style={styles.headerButtonText}>Change Room</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.headerButtonIcon}>🚪</Text>
              <Text style={styles.headerButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Arena token={token} spaceId={spaceId} />
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  roomId: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'monospace',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  headerButtonIcon: {
    fontSize: 12,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});

export default App;
