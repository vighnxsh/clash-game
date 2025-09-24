import { useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from './config';

interface ArenaProps {
  token: string;
  spaceId: string;
}

const Arena = ({ token, spaceId }: ArenaProps) => {
  const canvasRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [users, setUsers] = useState(new Map());

  // Initialize WebSocket connection
  useEffect(() => {

    // Initialize WebSocket
    wsRef.current = new WebSocket(WS_BASE_URL);
    
    wsRef.current.onopen = () => {
      console.log("WebSocket connected!");
      // Join the space once connected
      wsRef.current.send(JSON.stringify({
        type: 'join',
        payload: {
          spaceId,
          token
        }
      }));
    };

    wsRef.current.onerror = (error: any) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = (event: any) => {
      console.log("WebSocket closed:", event.code, event.reason);
    };

    wsRef.current.onmessage = (event: any) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, spaceId]);

  const handleWebSocketMessage = (message: any) => {
    console.log("WebSocket message received:", message);
    switch (message.type) {
      case 'space-joined':
        // Initialize current user position and other users
        console.log("Space joined - setting current user")
        console.log({
            x: message.payload.spawn.x,
            y: message.payload.spawn.y,
            userId: message.payload.userId
          })
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        });
        
        // Initialize other users from the payload
        const userMap = new Map();
        if (message.payload.users && Array.isArray(message.payload.users)) {
          message.payload.users.forEach((user: any) => {
            userMap.set(user.userId, user);
          });
        }
        setUsers(userMap);
        console.log("Current user set, other users:", userMap.size);
        console.log("Other users data:", Array.from(userMap.entries()));
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
          console.log("Updated users map:", newUsers.size, "users");
          console.log("All users in map:", Array.from(newUsers.entries()));
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
            console.log("Updated user position:", message.payload.userId, "to", message.payload.x, message.payload.y);
          } else {
            console.log("User not found in map:", message.payload.userId);
          }
          return newUsers;
        });
        
        // Also update current user if it's their own movement
        if (message.payload.userId === currentUser?.userId) {
          setCurrentUser((prev: any) => ({
            ...prev,
            x: message.payload.x,
            y: message.payload.y
          }));
        }
        break;

      case 'movement-rejected':
        // Reset current user position if movement was rejected
        setCurrentUser((prev: any) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y
        }));
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
  const handleMove = (newX: any, newY: any) => {
    if (!currentUser) return;
    
    // Update current user position optimistically for immediate feedback
    setCurrentUser((prev: any) => ({
      ...prev,
      x: newX,
      y: newY
    }));
    
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

  // Draw the arena
  useEffect(() => {
    console.log("render")
    const canvas = canvasRef.current;
    if (!canvas) return;
    console.log("below render")
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#eee';
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    console.log("before currentUser")
    console.log(currentUser)
    // Draw current user
    if (currentUser && typeof currentUser.x === 'number' && typeof currentUser.y === 'number') {
        console.log("drawing myself")
        console.log(currentUser)
      ctx.beginPath();
      ctx.fillStyle = '#FF6B6B';
      ctx.arc(currentUser.x * 50, currentUser.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('You', currentUser.x * 50, currentUser.y * 50 + 40);
    } else {
      console.log("Not drawing current user - missing position data:", currentUser);
    }

    // Draw other users
    console.log("Drawing users, total count:", users.size);
    users.forEach((user, userId) => {
      if (user && typeof user.x === 'number' && typeof user.y === 'number') {
        console.log("drawing other user", userId, "at", user.x, user.y);
        ctx.beginPath();
        ctx.fillStyle = '#4ECDC4';
        ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(user.username || `User ${user.userId}`, user.x * 50, user.y * 50 + 40);
      } else {
        console.log("Skipping user", userId, "invalid position:", user);
      }
    });
  }, [currentUser, users]);

  const handleKeyDown = (e: any) => {
    if (!currentUser) return;

    const { x, y } = currentUser;
    switch (e.key) {
      case 'ArrowUp':
        handleMove(x, y - 1);
        break;
      case 'ArrowDown':
        handleMove(x, y + 1);
        break;
      case 'ArrowLeft':
        handleMove(x - 1, y);
        break;
      case 'ArrowRight':
        handleMove(x + 1, y);
        break;
    }
  };

  return (
    <div className="p-6 bg-white" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Arena</h1>
          <p className="text-gray-600">Navigate the virtual world with other players</p>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Users</p>
                <p className="text-2xl font-bold text-black">{users.size + (currentUser ? 1 : 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Position</p>
                <p className="text-sm text-black font-mono">{currentUser ? `X: ${currentUser.x}, Y: ${currentUser.y}` : 'Not connected'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Room ID</p>
                <p className="text-xs text-black font-mono">{spaceId?.slice(0, 12)}...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-300 rounded-lg p-0 overflow-hidden">
          <div className="bg-gray-100 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Game Arena</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Use arrow keys to move</span>
              </div>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-white w-full h-auto"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Use arrow keys to move your avatar around the arena
          </p>
        </div>
      </div>
    </div>
  );
};

export default Arena;