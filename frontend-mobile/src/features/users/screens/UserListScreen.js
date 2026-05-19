import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usersService } from '../../../shared/api/api';

export default function UserListScreen() {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [page]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await usersService.getUsers({ page, limit: 15 });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function getRoleBadgeColor(role) {
        if (role === 'admin') return '#ef4444';
        if (role === 'moderator') return '#f59e0b';
        return '#6b7280';
    }

    function renderUser({ item }) {
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.username}>{item.username || item.ad}</Text>
                    <View style={[styles.badge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                        <Text style={styles.badgeText}>{item.role}</Text>
                    </View>
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.status}>{item.aktif_mi ? '✅ Aktif' : '❌ Pasif'}</Text>
                    <Text style={styles.date}>
                        {new Date(item.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                    </Text>
                </View>
            </View>
        );
    }

    if (loading && users.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kullanıcılar</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
            />

            {meta.totalPages > 1 && (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        onPress={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    >
                        <Text style={styles.pageBtnText}>← Önceki</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>{meta.page} / {meta.totalPages}</Text>
                    <TouchableOpacity
                        onPress={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                        style={[styles.pageBtn, page >= meta.totalPages && styles.pageBtnDisabled]}
                    >
                        <Text style={styles.pageBtnText}>Sonraki →</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '700', color: '#111', paddingHorizontal: 20, marginBottom: 16 },
    error: { backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, marginHorizontal: 20, borderRadius: 8, marginBottom: 12 },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    username: { fontSize: 16, fontWeight: '600', color: '#111' },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    email: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    status: { fontSize: 12, color: '#374151' },
    date: { fontSize: 12, color: '#9ca3af' },
    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
    pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { fontSize: 13, color: '#374151' },
    pageInfo: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
