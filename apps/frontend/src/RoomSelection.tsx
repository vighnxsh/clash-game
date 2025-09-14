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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Select a Room
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose which arena you want to join
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleRoomSelect('Arena 1')}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Arena 1'}
          </button>

          <button
            onClick={() => handleRoomSelect('Arena 2')}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Arena 2'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">or</span>
            </div>
          </div>

          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Join by Room ID
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                  Room ID
                </label>
                <input
                  id="roomId"
                  type="text"
                  value={manualRoomId}
                  onChange={(e) => setManualRoomId(e.target.value)}
                  placeholder="Enter room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  disabled={loading}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleJoinByRoomId}
                  disabled={loading || !manualRoomId.trim()}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Both arenas support up to 10 players. You can also join any room by entering its ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;
