import { useState } from 'react';
import { API_BASE_URL } from './config';

interface RoomSelectionProps {
  onRoomSelect: (roomId: string) => void;
  token: string;
}

const RoomSelection = ({ onRoomSelect, token }: RoomSelectionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualRoomId, setManualRoomId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleRoomSelect = async (roomName: string) => {
    setLoading(true);
    setError('');

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-300 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              Choose Your Arena
            </h2>
            <p className="text-gray-600 text-sm">
              Select where you want to start your adventure
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-red-700 text-sm text-center mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleRoomSelect('Arena 1')}
              disabled={loading}
              className="w-full py-4 text-base font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-black"
            >
              {loading ? 'Joining Arena 1...' : 'Arena 1'}
            </button>

            <button
              onClick={() => handleRoomSelect('Arena 2')}
              disabled={loading}
              className="w-full py-4 text-base font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-500"
            >
              {loading ? 'Joining Arena 2...' : 'Arena 2'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">or</span>
              </div>
            </div>

            {!showManualInput ? (
              <button
                onClick={() => setShowManualInput(true)}
                disabled={loading}
                className="w-full py-4 text-base font-semibold bg-gray-200 text-black rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-400"
              >
                Join by Room ID
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-black mb-2">
                    Room ID
                  </label>
                  <input
                    id="roomId"
                    type="text"
                    value={manualRoomId}
                    onChange={(e) => setManualRoomId(e.target.value)}
                    placeholder="Enter room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleJoinByRoomId}
                    disabled={loading || !manualRoomId.trim()}
                    className="flex-1 py-3 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                  >
                    {loading ? 'Joining...' : 'Join Room'}
                  </button>
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualRoomId('');
                      setError('');
                    }}
                    disabled={loading}
                    className="flex-1 py-3 text-sm font-semibold bg-gray-200 text-black rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              Both arenas support up to 10 players. You can also join any room by entering its ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;
