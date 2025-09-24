"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface RoomSelectionProps {
  onRoomSelect: (roomId: string) => void;
  token: string;
}

export default function RoomSelection({ onRoomSelect, token }: RoomSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualRoomId, setManualRoomId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleRoomSelect = async (roomName: string) => {
    setLoading(true);
    setError('');
    try {
      const spacesResponse = await fetch(`${API_BASE_URL}/api/v1/space/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let spaceId: string | null = null;
      if (spacesResponse.ok) {
        const spacesData = await spacesResponse.json();
        const existingRoom = spacesData.spaces?.find((space: any) => space.name === roomName);
        if (existingRoom) spaceId = existingRoom.id;
      }

      if (!spaceId) {
        const response = await fetch(`${API_BASE_URL}/api/v1/space`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: roomName, dimensions: '40x40' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create room');
        spaceId = data.spaceId;
      }
      onRoomSelect(spaceId!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByRoomId = async () => {
    if (!manualRoomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/space/${manualRoomId.trim()}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Room not found. Please check the room ID.');
        throw new Error('Failed to verify room');
      }
      onRoomSelect(manualRoomId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-md relative z-10 animate-scaleIn">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-2xl">🏟️</span>
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-2">Choose Your Arena</h2>
            <p className="text-muted-foreground">Select where you want to start your adventure</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center mb-6 animate-slideInLeft">
              <div className="flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => handleRoomSelect('Arena 1')} 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner"></div>
                  <span>Joining Arena 1...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>⚔️ Arena 1</span>
                </div>
              )}
            </button>

            <button 
              onClick={() => handleRoomSelect('Arena 2')} 
              disabled={loading} 
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner"></div>
                  <span>Joining Arena 2...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🏰 Arena 2</span>
                </div>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground font-medium">or</span>
              </div>
            </div>

            {!showManualInput ? (
              <button 
                onClick={() => setShowManualInput(true)} 
                disabled={loading} 
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none border border-gray-300 dark:border-gray-600"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>🔑 Join by Room ID</span>
                </div>
              </button>
            ) : (
              <div className="space-y-4 animate-slideInLeft">
                <div className="space-y-2">
                  <label htmlFor="roomId" className="block text-sm font-medium text-foreground">Room ID</label>
                  <input 
                    id="roomId" 
                    type="text" 
                    value={manualRoomId} 
                    onChange={(e) => setManualRoomId(e.target.value)} 
                    placeholder="Enter room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)" 
                    className="input" 
                    disabled={loading} 
                  />
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleJoinByRoomId} 
                    disabled={loading || !manualRoomId.trim()} 
                    className="flex-1 btn btn-primary py-3 text-sm font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="spinner"></div>
                        <span>Joining...</span>
                      </div>
                    ) : (
                      '🎮 Join Room'
                    )}
                  </button>
                  <button 
                    onClick={() => { setShowManualInput(false); setManualRoomId(''); setError(''); }} 
                    disabled={loading} 
                    className="flex-1 btn btn-ghost py-3 text-sm font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-1">
                  <span>👥</span>
                  <span>Both arenas support up to 10 players</span>
                </span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                You can also join any room by entering its ID
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


