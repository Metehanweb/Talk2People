const API_URL = 'http://localhost:3000';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;


    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
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


        if (typeof window !== 'undefined' && res.data?.accessToken) {
            localStorage.setItem('token', res.data.accessToken);
        }
        return res;
    },


    async register(email, password, username) {
        const res = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        });

        if (typeof window !== 'undefined' && res.data?.accessToken) {
            localStorage.setItem('token', res.data.accessToken);
        }
        return res;
    },


    async getMe() {
        return fetchAPI('/auth/me', { method: 'GET' });
    },

    async touch() {
        return fetchAPI('/auth/touch', { method: 'POST' });
    },


    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
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

    async updateUserStatus(id, aktif_mi) {
        return fetchAPI(`/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ aktif_mi }),
        });
    },
};

export const adminService = {
    async getStats() {
        return fetchAPI('/admin/stats', { method: 'GET' });
    }
};

export const channelsService = {
    async getChannels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/channels?${query}`, { method: 'GET' });
    },

    async getChannelById(id, params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/channels/${id}${query ? `?${query}` : ''}`, { method: 'GET' });
    },

    async createChannel(data) {
        return fetchAPI('/channels', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateChannel(id, data) {
        return fetchAPI(`/channels/${id}`, {
            method: 'PATCH',
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

    async reactToMessage(channelId, messageId, emoji) {
        return fetchAPI(`/channels/${channelId}/messages/${messageId}/react`, {
            method: 'POST',
            body: JSON.stringify({ emoji }),
        });
    },
};

export const friendsService = {
    async getOverview() {
        return fetchAPI('/friends', { method: 'GET' });
    },

    async searchUsers(q) {
        const query = new URLSearchParams({ q }).toString();
        return fetchAPI(`/friends/search?${query}`, { method: 'GET' });
    },

    async sendRequest(userId) {
        return fetchAPI(`/friends/${userId}/request`, { method: 'POST' });
    },

    async acceptRequest(id) {
        return fetchAPI(`/friends/requests/${id}/accept`, { method: 'POST' });
    },

    async removeFriendship(id) {
        return fetchAPI(`/friends/${id}`, { method: 'DELETE' });
    },
};

export const dmService = {
    async getNotifications() {
        return fetchAPI('/dm/notifications', { method: 'GET' });
    },

    async getConversations() {
        return fetchAPI('/dm/conversations', { method: 'GET' });
    },

    async getMessages(userId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/dm/${userId}/messages${query ? `?${query}` : ''}`, { method: 'GET' });
    },

    async sendMessage(userId, icerik) {
        return fetchAPI(`/dm/${userId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ icerik }),
        });
    },
};
