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
    <div>
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">2D Metaverse</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">Room: {spaceId}</span>
          <button
            onClick={() => setShowRoomSelection(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            Change Room
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
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
