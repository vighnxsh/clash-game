// Configuration for API and WebSocket endpoints
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Production URLs - update these with your actual deployment URLs
const PRODUCTION_API_URL = 'https://your-app.railway.app';
const PRODUCTION_WS_URL = 'wss://your-app.railway.app';

// Development URLs
const DEV_HOST = window.location.hostname;
const DEV_API_URL = `http://${DEV_HOST}:3000`;
const DEV_WS_URL = `ws://${DEV_HOST}:3001`;

export const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEV_API_URL;
export const WS_BASE_URL = isProduction ? PRODUCTION_WS_URL : DEV_WS_URL;

// For local network access, you can manually set the IP address here:
// export const API_BASE_URL = 'http://192.168.1.100:3000';
// export const WS_BASE_URL = 'ws://192.168.1.100:3001';
