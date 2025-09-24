import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL, WS_BASE_URL } from '../config';
import { ArenaProps, User, WebSocketMessage } from '../types';
import VirtualJoystick from './VirtualJoystick';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(screenWidth - 40, 400);
const GRID_SIZE = 40;

const Arena: React.FC<ArenaProps> = ({ token, spaceId }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch room code for header
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/space/${spaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code) setRoomCode(data.code);
        }
      } catch {}
    })();
  }, [spaceId]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket
    wsRef.current = new WebSocket(WS_BASE_URL);
    
    wsRef.current.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
      // Join the space once connected
      wsRef.current?.send(JSON.stringify({
        type: 'join',
        payload: {
          spaceId,
          token
        }
      }));
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    wsRef.current.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setIsConnected(false);
    };

    wsRef.current.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, spaceId]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log("WebSocket message received:", message);
    switch (message.type) {
      case 'space-joined':
        // Initialize current user position and other users
        console.log("Space joined - setting current user");
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        });
        
        // Initialize other users from the payload
        const userMap = new Map();
        if (message.payload.users && Array.isArray(message.payload.users)) {
          message.payload.users.forEach((user: User) => {
            userMap.set(user.userId, user);
          });
        }
        setUsers(userMap);
        console.log("Current user set, other users:", userMap.size);
        break;

      case 'user-joined':
        console.log("User joined:", message.payload);
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId,
            username: message.payload.username
          });
          return newUsers;
        });
        break;

      case 'movement':
        console.log("Movement received:", message.payload);
        setUsers(prev => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            if (message.payload.username) {
              user.username = message.payload.username;
            }
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        
        // Also update current user if it's their own movement
        if (message.payload.userId === currentUser?.userId) {
          setCurrentUser((prev: User | null) => prev ? ({
            ...prev,
            x: message.payload.x,
            y: message.payload.y
          }) : null);
        }
        break;

      case 'movement-rejected':
        // Reset current user position if movement was rejected
        setCurrentUser((prev: User | null) => prev ? ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y
        }) : null);
        break;

      case 'user-left':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  // Handle user movement
  const handleMove = (newX: number, newY: number) => {
    if (!currentUser || !wsRef.current) return;
    
    // Update current user position optimistically for immediate feedback
    setCurrentUser((prev: User | null) => prev ? ({
      ...prev,
      x: newX,
      y: newY
    }) : null);
    
    // Send movement request
    wsRef.current.send(JSON.stringify({
      type: 'move',
      payload: {
        x: newX,
        y: newY,
        userId: currentUser.userId
      }
    }));
  };

  const handleJoystickMove = (deltaX: number, deltaY: number) => {
    if (!currentUser) return;
    
    // Convert joystick input to grid movement
    const newX = Math.max(0, Math.min(9, currentUser.x + deltaX)); // 10x10 grid (0-9)
    const newY = Math.max(0, Math.min(9, currentUser.y + deltaY)); // 10x10 grid (0-9)
    
    // Only move if position actually changed
    if (newX !== currentUser.x || newY !== currentUser.y) {
      handleMove(newX, newY);
    }
  };

  const handleJoystickEnd = () => {
    // Joystick released - no action needed
  };

  const handleCopyRoomId = async () => {
    if (!spaceId) return;
    try {
      await Clipboard.setStringAsync(spaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log('Failed to copy room id', e);
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        grid.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.gridCell,
              {
                left: x * (CANVAS_SIZE / 10),
                top: y * (CANVAS_SIZE / 10),
              }
            ]}
          />
        );
      }
    }
    return grid;
  };

  const renderAvatars = () => {
    const avatars = [];
    const cellSize = CANVAS_SIZE / 10;
    
    // Render current user
    if (currentUser) {
      avatars.push(
        <View
          key="current-user"
          style={[
            styles.avatar,
            styles.currentUserAvatar,
            {
              left: currentUser.x * cellSize + (cellSize - 30) / 2,
              top: currentUser.y * cellSize + (cellSize - 30) / 2,
            }
          ]}
        />
      );
      avatars.push(
        <Text
          key="current-user-label"
          style={[
            styles.avatarLabel,
            {
              left: currentUser.x * cellSize + (cellSize - 30) / 2,
              top: currentUser.y * cellSize - 25,
            }
          ]}
        >
          You
        </Text>
      );
    }

    // Render other users
    users.forEach((user) => {
      avatars.push(
        <View
          key={user.userId}
          style={[
            styles.avatar,
            styles.otherUserAvatar,
            {
              left: user.x * cellSize + (cellSize - 30) / 2,
              top: user.y * cellSize + (cellSize - 30) / 2,
            }
          ]}
        />
      );
      avatars.push(
        <Text
          key={`${user.userId}-label`}
          style={[
            styles.avatarLabel,
            {
              left: user.x * cellSize + (cellSize - 30) / 2,
              top: user.y * cellSize - 25,
            }
          ]}
        >
          {user.username || `User ${user.userId.slice(0, 8)}`}
        </Text>
      );
    });

    return avatars;
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Arena</Text>
          <Text style={styles.subtitle}>Navigate the virtual world with other players</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>👥</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Connected Users</Text>
              <Text style={styles.statValue}>{users.size + (currentUser ? 1 : 0)}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>📍</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Your Position</Text>
              <Text style={styles.statValue}>
                {currentUser ? `X: ${currentUser.x}, Y: ${currentUser.y}` : 'Not connected'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>🏠</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Room</Text>
              <View style={styles.roomRow}>
                <Text style={styles.statValue}>{roomCode ? `#${roomCode}` : `${spaceId?.slice(0, 8)}...`}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyRoomId}>
                  <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.gameContainer}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>Game Arena</Text>
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          
          <View style={styles.canvasContainer}>
            <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
              {renderGrid()}
              {renderAvatars()}
            </View>
          </View>
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            🎮 Use the joystick to move your avatar around the arena
          </Text>
        </View>
        
        <VirtualJoystick
          onMove={handleJoystickMove}
          onEnd={handleJoystickEnd}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  copyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  gameContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  canvasContainer: {
    alignItems: 'center',
  },
  canvas: {
    backgroundColor: 'white',
    borderRadius: 12,
    position: 'relative',
  },
  gridCell: {
    position: 'absolute',
    width: CANVAS_SIZE / 10 - 1,
    height: CANVAS_SIZE / 10 - 1,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  avatar: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  currentUserAvatar: {
    backgroundColor: '#EF4444',
  },
  otherUserAvatar: {
    backgroundColor: '#10B981',
  },
  avatarLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructions: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default Arena;
