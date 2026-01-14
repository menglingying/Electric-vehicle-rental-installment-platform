import axios from 'axios';
import { getH5Token, clearH5Token } from './auth';
export const http = axios.create({
    baseURL: '/api',
    timeout: 15000
});
http.interceptors.request.use((config) => {
    const token = getH5Token();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
http.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        clearH5Token();
        const msg = error.response?.data?.message || '登录已过期，请重新登录';
        alert(msg);
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
