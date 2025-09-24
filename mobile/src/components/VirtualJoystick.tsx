import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 40;

interface VirtualJoystickProps {
  onMove: (deltaX: number, deltaY: number) => void;
  onEnd: () => void;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, onEnd }) => {
  const [isActive, setIsActive] = useState(false);

  const handleDirectionPress = (direction: string) => {
    if (!isActive) {
      setIsActive(true);
    }
    
    switch (direction) {
      case 'up':
        onMove(0, -1);
        break;
      case 'down':
        onMove(0, 1);
        break;
      case 'left':
        onMove(-1, 0);
        break;
      case 'right':
        onMove(1, 0);
        break;
    }
  };

  const handleRelease = () => {
    setIsActive(false);
    onEnd();
  };

  return (
    <View style={styles.container}>
      <View style={styles.joystickBase}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
          style={styles.joystickBackground}
        >
          {/* Directional Pad */}
          <View style={styles.dpad}>
            {/* Top Row */}
            <View style={styles.dpadRow}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadButtonUp]}
                onPressIn={() => handleDirectionPress('up')}
                onPressOut={handleRelease}
              >
                <Text style={styles.dpadText}>↑</Text>
              </TouchableOpacity>
            </View>
            
            {/* Middle Row */}
            <View style={styles.dpadRow}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadButtonLeft]}
                onPressIn={() => handleDirectionPress('left')}
                onPressOut={handleRelease}
              >
                <Text style={styles.dpadText}>←</Text>
              </TouchableOpacity>
              <View style={styles.dpadCenter} />
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadButtonRight]}
                onPressIn={() => handleDirectionPress('right')}
                onPressOut={handleRelease}
              >
                <Text style={styles.dpadText}>→</Text>
              </TouchableOpacity>
            </View>
            
            {/* Bottom Row */}
            <View style={styles.dpadRow}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadButtonDown]}
                onPressIn={() => handleDirectionPress('down')}
                onPressOut={handleRelease}
              >
                <Text style={styles.dpadText}>↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    zIndex: 1000,
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  joystickBackground: {
    width: '100%',
    height: '100%',
    borderRadius: JOYSTICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dpad: {
    width: 100,
    height: 100,
  },
  dpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 33,
  },
  dpadButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  dpadCenter: {
    width: 30,
    height: 30,
  },
  dpadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dpadButtonUp: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  dpadButtonDown: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  dpadButtonLeft: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  dpadButtonRight: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
});

export default VirtualJoystick;
