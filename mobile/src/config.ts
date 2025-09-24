// Configuration for API and WebSocket endpoints
import Constants from 'expo-constants';

const isProduction = Constants.expoConfig?.extra?.isProduction || false;

// Production URLs - update these with your actual deployment URLs
const PRODUCTION_API_URL = 'https://your-app.railway.app';
const PRODUCTION_WS_URL = 'wss://your-app.railway.app';

// Development URLs - Replace with your computer's IP address
const DEV_API_URL = 'http://192.168.29.167:3000';
const DEV_WS_URL = 'ws://192.168.29.167:3001';

export const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEV_API_URL;
export const WS_BASE_URL = isProduction ? PRODUCTION_WS_URL : DEV_WS_URL;
