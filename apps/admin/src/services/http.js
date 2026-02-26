import axios from 'axios';
import { getAdminToken, clearAdminToken } from './auth';
export const http = axios.create({
    baseURL: '/api',
    timeout: 15000
});
http.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
http.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        clearAdminToken();
        const msg = error.response?.data?.message || '登录已过期，请重新登录';
        alert(msg);
        const current = window.location.pathname + window.location.search + window.location.hash;
        const redirect = `/login?redirect=${encodeURIComponent(current)}`;
        window.location.replace(redirect);
    }
    return Promise.reject(error);
});
