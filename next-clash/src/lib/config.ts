// Client-safe configuration for API and WebSocket endpoints
const apiFromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
const wsFromEnv = process.env.NEXT_PUBLIC_WS_BASE_URL;

const inferHost = () => (typeof window === 'undefined' ? 'localhost' : window.location.hostname);

export const API_BASE_URL = apiFromEnv || `http://${inferHost()}:3000`;
export const WS_BASE_URL = wsFromEnv || `ws://${inferHost()}:3001`;


