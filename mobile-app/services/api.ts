import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.1.10:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": 'aplication/json',
    },
    timeout: 10000,
});

api.interceptors.request.use(
    async(config) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Beare ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log("Unauthorize! Token Invalid!")
        }
        return Promise.reject(error);
    }
);

export default api;