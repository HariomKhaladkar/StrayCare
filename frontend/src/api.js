// Central API base URL configuration.
// In development (browser/web): set REACT_APP_API_BASE_URL in .env to http://<PC_IP>:8000
// In production: set REACT_APP_API_BASE_URL to your deployed backend URL.
// Falls back to empty string "" which means relative URLs (works only when served from same host).
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default API_BASE_URL;
