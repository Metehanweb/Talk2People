import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { channelsService } from '../../../shared/api/api';

import { useNavigation } from '@react-navigation/native';

export default function ChannelListScreen() {
    const navigation = useNavigation();
    const [channels, setChannels] = useState([]);
    const [meta, setMeta] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChannels();
    }, [page]);

    async function fetchChannels() {
        setLoading(true);
        try {
            const res = await channelsService.getChannels({ page, limit: 15 });
            setChannels(res.data);
            setMeta(res.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function renderChannel({ item }) {
        return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(item.tur === 'voice' ? 'VoiceChannel' : 'Chat', { channelId: item._id })}>
                <View style={styles.cardHeader}>
                    <Text style={styles.icon}>{item.tur === 'voice' ? '🔊' : '💬'}</Text>
                    <View style={styles.cardInfo}>
                        <Text style={styles.channelName}>{item.ad}</Text>
                        {item.aciklama ? <Text style={styles.desc}>{item.aciklama}</Text> : null}
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <View style={[styles.badge, { backgroundColor: item.tur === 'voice' ? '#8b5cf6' : '#3b82f6' }]}>
                        <Text style={styles.badgeText}>{item.tur === 'voice' ? 'Sesli' : 'Metin'}</Text>
                    </View>
                    <Text style={styles.date}>
                        {new Date(item.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    if (loading && channels.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kanallar</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FlatList
                data={channels}
                keyExtractor={(item) => item._id}
                renderItem={renderChannel}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Henüz kanal bulunmuyor.</Text>}
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
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    icon: { fontSize: 22 },
    cardInfo: { flex: 1 },
    channelName: { fontSize: 16, fontWeight: '600', color: '#111' },
    desc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    date: { fontSize: 12, color: '#9ca3af' },
    empty: { textAlign: 'center', color: '#9ca3af', padding: 40 },
    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
    pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { fontSize: 13, color: '#374151' },
    pageInfo: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
