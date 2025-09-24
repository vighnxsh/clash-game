import { useState } from 'react';
import Arena from "./Game";
import Login from "./Login";
import RoomSelection from "./RoomSelection";

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
    return <Login onLogin={handleLogin} />;
  }

  if (showRoomSelection) {
    return <RoomSelection onRoomSelect={handleRoomSelect} token={token} />;
  }

  if (!spaceId) {
    return <RoomSelection onRoomSelect={handleRoomSelect} token={token} />;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="bg-white border-b border-gray-300 text-black p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold">2D Metaverse</h1>
            <p className="text-xs text-gray-600">Interactive Virtual World</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded px-3 py-2">
            <span className="text-sm text-gray-700">Room: </span>
            <span className="text-sm font-mono text-black">{spaceId?.slice(0, 8)}...</span>
          </div>
          <button
            onClick={() => setShowRoomSelection(true)}
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 text-sm font-medium border border-gray-400 rounded"
          >
            Change Room
          </button>
          <button
            onClick={handleLogout}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm font-medium border border-gray-600 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <Arena token={token} spaceId={spaceId} />
    </div>
  );
}

export default App
