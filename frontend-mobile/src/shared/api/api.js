import AsyncStorage from '@react-native-async-storage/async-storage';


import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        // Ignore async storage errors
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message || 'Bir hata oluştu');
    }

    return data;
}

export const authService = {
    async login(email, password) {
        const res = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (res.data?.accessToken) {
            await AsyncStorage.setItem('token', res.data.accessToken);
        }
        return res;
    },

    async register(email, password, username) {
        const res = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        });

        if (res.data?.accessToken) {
            await AsyncStorage.setItem('token', res.data.accessToken);
        }
        return res;
    },

    async getMe() {
        return fetchAPI('/auth/me', { method: 'GET' });
    },

    async logout() {
        await AsyncStorage.removeItem('token');
    }
};

export const usersService = {
    async getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/users?${query}`, { method: 'GET' });
    },

    async getUserById(id) {
        return fetchAPI(`/users/${id}`, { method: 'GET' });
    },

    async updateUserRole(id, role) {
        return fetchAPI(`/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
    },
};

export const channelsService = {
    async getChannels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/channels?${query}`, { method: 'GET' });
    },

    async getChannelById(id) {
        return fetchAPI(`/channels/${id}`, { method: 'GET' });
    },

    async createChannel(data) {
        return fetchAPI('/channels', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteChannel(id) {
        return fetchAPI(`/channels/${id}`, { method: 'DELETE' });
    },
};

export const messagesService = {
    async getMessages(channelId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/channels/${channelId}/messages?${query}`, { method: 'GET' });
    },

    async sendMessage(channelId, icerik) {
        return fetchAPI(`/channels/${channelId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ icerik }),
        });
    },

    async deleteMessage(channelId, messageId) {
        return fetchAPI(`/channels/${channelId}/messages/${messageId}`, { method: 'DELETE' });
    },
};
