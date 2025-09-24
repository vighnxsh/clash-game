"use client";

import { useState } from 'react';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import Game from './components/Game';

export default function Home() {
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

  const [copied, setCopied] = useState(false);
  const handleCopyRoomId = async () => {
    if (!spaceId) return;
    try {
      await navigator.clipboard.writeText(spaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (!token) return <Login onLogin={handleLogin} />;
  if (showRoomSelection || !spaceId) return <RoomSelection onRoomSelect={handleRoomSelect} token={token} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/50 backdrop-blur-xl border-b border-white/20 p-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6 animate-fadeInUp">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">2D</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">2D Metaverse</h1>
              <p className="text-sm text-muted-foreground">Interactive Virtual World</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 animate-slideInRight">
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">Room:</span>
              <span className="text-sm font-mono font-semibold bg-muted px-2 py-1 rounded" title={spaceId || ''}>
                {spaceId?.slice(0, 8)}...
              </span>
              <button 
                onClick={handleCopyRoomId} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            
            <button 
              onClick={() => setShowRoomSelection(true)} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              🔄 Change Room
            </button>
            
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
      <Game token={token} spaceId={spaceId!} />
    </div>
  );
}
