import axios from 'axios';

// All frontend requests route through the API Gateway
const api = axios.create({
  baseURL: 'https://eshopx-api-gateway.onrender.com/api',
});
// Interceptor to attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eshopx_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
