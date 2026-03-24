import axios from 'axios';

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    
    // If NEXT_PUBLIC_API_URL is set, use it (unless we are on localhost and it's not localhost)
    if (envUrl && !envUrl.includes('localhost') && hostname === 'localhost') {
        // Keep using localhost in dev even if env is set for prod
    } else if (envUrl) {
        return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    }

    // Dynamic detection for local network (IP address)
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIP && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:4000/api`;
    }
  }
  
  return `${envUrl || 'http://localhost:4000'}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
