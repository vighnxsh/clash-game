export interface User {
  userId: string;
  username?: string;
  x: number;
  y: number;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface LoginProps {
  onLogin: (token: string) => void;
}

export interface RoomSelectionProps {
  onRoomSelect: (roomId: string) => void;
  token: string;
}

export interface ArenaProps {
  token: string;
  spaceId: string;
}






