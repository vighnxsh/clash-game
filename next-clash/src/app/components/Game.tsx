"use client";

import { useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '@/lib/config';

interface ArenaProps {
  token: string;
  spaceId: string;
}

export default function Game({ token, spaceId }: ArenaProps) {
  const canvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState(new Map());
  const [bullets, setBullets] = useState<any[]>([]);
  const [gameState, setGameState] = useState({
    currentUserHealth: 100,
    gameStarted: false,
    isDead: false
  });

  useEffect(() => {
    wsRef.current = new WebSocket(WS_BASE_URL);

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        payload: { spaceId, token }
      }));
    };

    wsRef.current.onmessage = (event: any) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token, spaceId]);

  // Ensure the container receives keyboard focus for arrow key handling
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'space-joined': {
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        });
        const userMap = new Map();
        if (message.payload.users && Array.isArray(message.payload.users)) {
          message.payload.users.forEach((user: any) => {
            userMap.set(user.userId, user);
          });
        }
        setUsers(userMap);
        break;
      }
      case 'user-joined': {
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
      }
      case 'movement': {
        setUsers(prev => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            if (message.payload.username) user.username = message.payload.username;
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        if (message.payload.userId === currentUser?.userId) {
          setCurrentUser((prev: any) => ({ ...prev, x: message.payload.x, y: message.payload.y }));
        }
        break;
      }
      case 'movement-rejected': {
        setCurrentUser((prev: any) => ({ ...prev, x: message.payload.x, y: message.payload.y }));
        break;
      }
      case 'user-left': {
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
      }
      case 'bullet-shot': {
        const bullet = message.payload.bullet;
        if (bullet.owner !== currentUser?.userId) {
          setBullets(prev => [...prev, bullet]);
        }
        break;
      }
      case 'health-update': {
        if (message.payload.userId === currentUser?.userId) {
          setGameState(prev => ({ 
            ...prev, 
            currentUserHealth: message.payload.health 
          }));
        } else {
          setUsers(prev => {
            const newUsers = new Map(prev);
            const user = newUsers.get(message.payload.userId);
            if (user) {
              user.health = message.payload.health;
              newUsers.set(message.payload.userId, user);
            }
            return newUsers;
          });
        }
        break;
      }
      case 'player-death': {
        if (message.payload.userId === currentUser?.userId) {
          setGameState(prev => ({ 
            ...prev, 
            isDead: true,
            currentUserHealth: 0 
          }));
        } else {
          setUsers(prev => {
            const newUsers = new Map(prev);
            const user = newUsers.get(message.payload.userId);
            if (user) {
              user.health = 0;
              newUsers.set(message.payload.userId, user);
            }
            return newUsers;
          });
        }
        break;
      }
    }
  };

  const handleMove = (newX: any, newY: any) => {
    if (!currentUser || typeof currentUser.x !== 'number' || typeof currentUser.y !== 'number' || gameState.isDead) return;
    setCurrentUser((prev: any) => ({ ...prev, x: newX, y: newY }));
    wsRef.current?.send(JSON.stringify({
      type: 'move',
      payload: { x: newX, y: newY, userId: currentUser.userId }
    }));
  };

  const shootBullet = (direction: string) => {
    if (!currentUser || gameState.currentUserHealth <= 0 || gameState.isDead) return;
    
    // Calculate bullet starting position slightly offset from player center
    let startX = currentUser.x * 30 + 15; // Center of grid cell
    let startY = currentUser.y * 30 + 15; // Center of grid cell
    
    // Offset bullet start position based on direction to avoid immediate collision
    switch (direction) {
      case 'up': startY -= 15; break;
      case 'down': startY += 15; break;
      case 'left': startX -= 15; break;
      case 'right': startX += 15; break;
    }
    
    const bullet = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      direction,
      speed: 3,
      owner: currentUser.userId
    };
    
    setBullets(prev => [...prev, bullet]);
    
    wsRef.current?.send(JSON.stringify({
      type: 'shoot',
      payload: { bullet }
    }));
  };

  // Update bullet positions
  useEffect(() => {
    const bulletInterval = setInterval(() => {
      setBullets(prev => {
        const updatedBullets = prev.map(bullet => {
          let newX = bullet.x;
          let newY = bullet.y;
          
          switch (bullet.direction) {
            case 'up': newY -= bullet.speed; break;
            case 'down': newY += bullet.speed; break;
            case 'left': newX -= bullet.speed; break;
            case 'right': newX += bullet.speed; break;
          }
          
          return { ...bullet, x: newX, y: newY };
        }).filter(bullet => {
          // Remove bullets that are off screen
          return bullet.x >= 0 && bullet.x <= 800 && bullet.y >= 0 && bullet.y <= 600;
        });
        
        // Check for collisions and collect bullets to remove
        const bulletsToRemove: number[] = [];
        
        updatedBullets.forEach((bullet, index) => {
          if (bullet.owner !== currentUser?.userId) {
            // Check if bullet hits current user
            const playerCenterX = currentUser.x * 30 + 15;
            const playerCenterY = currentUser.y * 30 + 15;
            const distance = Math.sqrt(
              Math.pow(bullet.x - playerCenterX, 2) + 
              Math.pow(bullet.y - playerCenterY, 2)
            );
            if (distance < 25) { // Increased collision radius
              // Report hit to server
              wsRef.current?.send(JSON.stringify({
                type: 'bullet-hit',
                payload: { 
                  targetUserId: currentUser.userId,
                  damage: 20 
                }
              }));
              // Mark bullet for removal
              bulletsToRemove.push(index);
            }
          } else {
            // Check if our bullet hits other players
            users.forEach((user: any, userId: string) => {
              if (user && user.health > 0) {
                const playerCenterX = user.x * 30 + 15;
                const playerCenterY = user.y * 30 + 15;
                const distance = Math.sqrt(
                  Math.pow(bullet.x - playerCenterX, 2) + 
                  Math.pow(bullet.y - playerCenterY, 2)
                );
                if (distance < 25) { // Increased collision radius
                  // Report hit to server
                  wsRef.current?.send(JSON.stringify({
                    type: 'bullet-hit',
                    payload: { 
                      targetUserId: userId,
                      damage: 20 
                    }
                  }));
                  // Mark bullet for removal
                  bulletsToRemove.push(index);
                }
              }
            });
          }
        });
        
        // Remove bullets that hit (in reverse order to maintain indices)
        bulletsToRemove.sort((a, b) => b - a).forEach(index => {
          updatedBullets.splice(index, 1);
        });
        
        return updatedBullets;
      });
    }, 16); // ~60 FPS
    
    return () => clearInterval(bulletInterval);
  }, [currentUser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // No grid lines - clean canvas

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw current user avatar with health bar
    if (currentUser && typeof currentUser.x === 'number' && typeof currentUser.y === 'number') {
      const avatar = new Image();
      avatar.onload = () => {
        // Draw health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(currentUser.x * 30 - 20, currentUser.y * 30 - 25, 40, 4);
        
        // Draw health bar
        const healthWidth = (gameState.currentUserHealth / 100) * 40;
        ctx.fillStyle = gameState.currentUserHealth > 50 ? '#4CAF50' : gameState.currentUserHealth > 25 ? '#FF9800' : '#F44336';
        ctx.fillRect(currentUser.x * 30 - 20, currentUser.y * 30 - 25, healthWidth, 4);
        
        // Draw avatar with death effect
        if (gameState.isDead) {
          ctx.globalAlpha = 0.5;
          ctx.filter = 'grayscale(100%)';
        }
        ctx.drawImage(avatar, currentUser.x * 30 - 15, currentUser.y * 30 - 15, 30, 30);
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        
        // Draw username
        ctx.fillStyle = gameState.isDead ? '#666' : '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.isDead ? 'DEAD' : 'You', currentUser.x * 30, currentUser.y * 30 + 35);
      };
      avatar.src = '/avatar.png';
    }

    // Draw other users avatars with health bars
    users.forEach((user: any, userId: string) => {
      if (user && typeof user.x === 'number' && typeof user.y === 'number') {
        const avatar = new Image();
        avatar.onload = () => {
          // Draw health bar background
          ctx.fillStyle = '#333';
          ctx.fillRect(user.x * 30 - 20, user.y * 30 - 25, 40, 4);
          
          // Draw health bar
          const userHealth = user.health || 100;
          ctx.fillStyle = userHealth > 50 ? '#4CAF50' : userHealth > 25 ? '#FF9800' : '#F44336';
          ctx.fillRect(user.x * 30 - 20, user.y * 30 - 25, (userHealth / 100) * 40, 4);
          
          // Draw avatar with death effect
          if (userHealth <= 0) {
            ctx.globalAlpha = 0.5;
            ctx.filter = 'grayscale(100%)';
          }
          ctx.drawImage(avatar, user.x * 30 - 15, user.y * 30 - 15, 30, 30);
          ctx.globalAlpha = 1;
          ctx.filter = 'none';
          
          // Draw username
          ctx.fillStyle = userHealth <= 0 ? '#666' : '#000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(userHealth <= 0 ? 'DEAD' : (user.username || `User ${user.userId}`), user.x * 30, user.y * 30 + 35);
        };
        avatar.src = '/avatar2.png';
      }
    });
  }, [currentUser, users, bullets, gameState]);

  const handleKeyDown = (e: any) => {
    if (!currentUser || typeof currentUser.x !== 'number' || typeof currentUser.y !== 'number' || gameState.isDead) return;
    const { x, y } = currentUser;
    
    switch (e.key) {
      case 'ArrowUp':
        handleMove(x, y - 1); break;
      case 'ArrowDown':
        handleMove(x, y + 1); break;
      case 'ArrowLeft':
        handleMove(x - 1, y); break;
      case 'ArrowRight':
        handleMove(x + 1, y); break;
      case ' ': // Spacebar to shoot
        e.preventDefault();
        shootBullet('up'); break;
      case 'w':
      case 'W':
        shootBullet('up'); break;
      case 's':
      case 'S':
        shootBullet('down'); break;
      case 'a':
      case 'A':
        shootBullet('left'); break;
      case 'd':
      case 'D':
        shootBullet('right'); break;
    }
  };

  return (
    <div ref={containerRef} className="p-6 bg-gradient-to-br from-slate-50 to-blue-50" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-bold text-gradient mb-2">🏟️ Arena</h1>
          <p className="text-muted-foreground text-lg">Navigate the virtual world with other players</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 animate-slideInLeft">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">👥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Users</p>
                <p className="text-3xl font-bold text-foreground">{users.size + (currentUser ? 1 : 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 animate-fadeInUp">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">📍</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Position</p>
                <p className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded">
                  {currentUser ? `X: ${currentUser.x}, Y: ${currentUser.y}` : 'Not connected'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 animate-slideInRight">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">🏠</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Room ID</p>
                <p className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded">
                  {spaceId?.slice(0, 12)}...
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 animate-fadeInUp">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">❤️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Health</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        gameState.currentUserHealth > 50 ? 'bg-green-500' : 
                        gameState.currentUserHealth > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${gameState.currentUserHealth}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-foreground">{gameState.currentUserHealth}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
          <div className="bg-white/50 backdrop-blur-xl p-8 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gradient flex items-center gap-2">
                <span>🎮</span>
                <span>Game Arena</span>
              </h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⌨️</span>
                  <span>Arrow keys to move, WASD to shoot</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600} 
              className="bg-gradient-to-br from-blue-50 to-green-50 w-full h-auto" 
              onKeyDown={handleKeyDown} 
              tabIndex={0} 
            />
            <div className="absolute top-4 left-4 bg-white/50 backdrop-blur-xl rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {gameState.isDead ? (
                  <>
                    <span>💀</span>
                    <span className="text-red-600 font-bold">YOU ARE DEAD! Refresh to respawn.</span>
                  </>
                ) : (
                  <>
                    <span>🎯</span>
                    <span>Focus canvas to control your avatar</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center animate-fadeInUp">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            {gameState.isDead ? (
              <div className="text-center">
                <p className="text-red-600 font-bold text-lg mb-2">
                  💀 YOU ARE DEAD! 💀
                </p>
                <p className="text-muted-foreground">
                  Refresh the page to respawn with full health
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span>⌨️</span>
                    <span>Use arrow keys to move, WASD keys to shoot bullets</span>
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on the game area first to enable keyboard controls • Hit other players to damage them!
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


