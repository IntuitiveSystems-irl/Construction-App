// Centralized API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? `http://${window.location.hostname}:5002`
    : 'http://localhost:4000');

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || API_URL;

console.log('API Configuration:', { API_URL, BACKEND_URL });
