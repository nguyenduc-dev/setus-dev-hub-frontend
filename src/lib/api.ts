import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // If we're accessing via IP or non-localhost name, use that for the API too
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:4000/api`;
    }
  }
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
