import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';
import { RoomSelectionProps } from '../types';

const RoomSelection: React.FC<RoomSelectionProps> = ({ onRoomSelect, token }) => {
  const [loading, setLoading] = useState(false);
  const [manualRoomId, setManualRoomId] = useState('');
  const [manualRoomCode, setManualRoomCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleRoomSelect = async (roomName: string) => {
    setLoading(true);

    try {
      // First, try to get existing spaces
      const spacesResponse = await fetch(`${API_BASE_URL}/api/v1/space/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let spaceId = null;
      
      if (spacesResponse.ok) {
        const spacesData = await spacesResponse.json();
        // Look for existing room with this name
        const existingRoom = spacesData.spaces?.find((space: any) => space.name === roomName);
        if (existingRoom) {
          spaceId = existingRoom.id;
        }
      }

      // If room doesn't exist, create it
      if (!spaceId) {
        const response = await fetch(`${API_BASE_URL}/api/v1/space`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: roomName,
            dimensions: '40x40'
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create room');
        }
        spaceId = data.spaceId;
      }

      onRoomSelect(spaceId);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByRoomId = async () => {
    if (!manualRoomId.trim()) {
      Alert.alert('Error', 'Please enter a room ID');
      return;
    }

    setLoading(true);

    try {
      // Verify the room exists by trying to get its details
      const response = await fetch(`${API_BASE_URL}/api/v1/space/${manualRoomId.trim()}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found. Please check the room ID.');
        }
        throw new Error('Failed to verify room');
      }

      // Room exists, join it
      onRoomSelect(manualRoomId.trim());
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByRoomCode = async () => {
    const code = manualRoomCode.trim();
    if (!/^\d{4}$/.test(code)) {
      Alert.alert('Error', 'Enter a valid 4-digit room code');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/space/code/${code}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Room not found');
      }
      onRoomSelect(data.spaceId);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🏟️</Text>
            </View>
            <Text style={styles.title}>Choose Your Arena</Text>
            <Text style={styles.subtitle}>Select where you want to start your adventure</Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.arenaButton, styles.arena1Button]}
              onPress={() => handleRoomSelect('Arena 1')}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Joining Arena 1...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIcon}>
                    <Text style={styles.buttonEmoji}>🏟️</Text>
                  </View>
                  <Text style={styles.buttonText}>Arena 1</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.arenaButton, styles.arena2Button]}
              onPress={() => handleRoomSelect('Arena 2')}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Joining Arena 2...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIcon}>
                    <Text style={styles.buttonEmoji}>⚔️</Text>
                  </View>
                  <Text style={styles.buttonText}>Arena 2</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {!showManualInput ? (
              <TouchableOpacity
                style={[styles.arenaButton, styles.manualButton]}
                onPress={() => setShowManualInput(true)}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIcon}>
                    <Text style={styles.buttonEmoji}>🔑</Text>
                  </View>
                  <Text style={styles.buttonText}>Join by Room ID</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.manualInputContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Room ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={manualRoomId}
                    onChangeText={setManualRoomId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Or 4-digit Room Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 4-digit code (e.g., 4821)"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={manualRoomCode}
                    onChangeText={setManualRoomCode}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <View style={styles.manualButtons}>
                  <TouchableOpacity
                    style={[styles.manualButton, styles.joinButton]}
                    onPress={manualRoomId.trim() ? handleJoinByRoomId : handleJoinByRoomCode}
                    disabled={loading || (!manualRoomId.trim() && !/^\d{4}$/.test(manualRoomCode.trim()))}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="white" size="small" />
                        <Text style={styles.buttonText}>Joining...</Text>
                      </View>
                    ) : (
                      <Text style={styles.buttonText}>Join Room</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.manualButton, styles.cancelButton]}
                    onPress={() => {
                      setShowManualInput(false);
                      setManualRoomId('');
                      setManualRoomCode('');
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Both arenas support up to 10 players. You can also join any room by entering its ID.
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 16,
  },
  arenaButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  arena1Button: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  arena2Button: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  manualButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  manualInputContainer: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default RoomSelection;


