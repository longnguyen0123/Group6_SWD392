import axios from 'axios';

export const API_URL = 'http://localhost:3001';

export const api = axios.create({
	baseURL: API_URL,
	timeout: 10000,
});

// Simple helpers
export const get = (path, config) => api.get(path, config).then(r => r.data);
export const post = (path, body, config) => api.post(path, body, config).then(r => r.data);
export const put = (path, body, config) => api.put(path, body, config).then(r => r.data);
export const patch = (path, body, config) => api.patch(path, body, config).then(r => r.data);
export const del = (path, config) => api.delete(path, config).then(r => r.data);


