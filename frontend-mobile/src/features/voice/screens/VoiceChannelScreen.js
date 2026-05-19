import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, FlatList,
    StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { channelsService, authService } from '../../../shared/api/api';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

async function voiceApi(endpoint, method = 'GET', body = null) {
    const token = await AsyncStorage.getItem('token');
    const options = { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}/channels/${endpoint}`, options);
    return res.json();
}

export default function VoiceChannelScreen({ route, navigation }) {
    const { channelId } = route.params;
    const [channel, setChannel] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [inChannel, setInChannel] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        init();
        const interval = setInterval(() => fetchParticipants(), 5000);
        return () => clearInterval(interval);
    }, []);

    async function init() {
        try {
            const [meRes, chRes] = await Promise.all([
                authService.getMe(),
                channelsService.getChannelById(channelId),
            ]);
            setCurrentUser(meRes.data.user);
            setChannel(chRes.data);
            navigation.setOptions({ title: `🔊 ${chRes.data.ad}` });
            await fetchParticipants();
        } catch (err) {
            Alert.alert('Hata', err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchParticipants() {
        const data = await voiceApi(`${channelId}/voice/participants`);
        if (data.success) setParticipants(data.data || []);
    }

    async function handleJoin() {
        const data = await voiceApi(`${channelId}/voice/join`, 'POST');
        if (data.success) { setInChannel(true); fetchParticipants(); }
        else Alert.alert('Hata', data.message || 'Kanala katılamadı');
    }

    async function handleLeave() {
        const data = await voiceApi(`${channelId}/voice/leave`, 'DELETE');
        if (data.success) { setInChannel(false); setIsMuted(false); setIsDeafened(false); fetchParticipants(); }
    }

    async function handleToggleMute() {
        const newMuted = !isMuted;
        await voiceApi(`${channelId}/voice/status`, 'PATCH', { sessiz_mi: newMuted });
        setIsMuted(newMuted);
    }

    async function handleToggleDeafen() {
        const newDeafened = !isDeafened;
        await voiceApi(`${channelId}/voice/status`, 'PATCH', { sagir_mi: newDeafened });
        setIsDeafened(newDeafened);
    }

    function renderParticipant({ item }) {
        return (
            <View style={styles.participant}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.kullanici?.username || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={styles.participantInfo}>
                    <Text style={styles.username}>{item.kullanici?.username || 'Bilinmeyen'}</Text>
                    <View style={styles.statusRow}>
                        {item.sessiz_mi && <Text style={styles.statusBadge}>🔇 Sessiz</Text>}
                        {item.sagir_mi && <Text style={styles.statusBadge}>🔕 Sağır</Text>}
                        {!item.sessiz_mi && !item.sagir_mi && <Text style={[styles.statusBadge, styles.activeBadge]}>🟢 Aktif</Text>}
                    </View>
                </View>
            </View>
        );
    }

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Placeholder Banner */}
            <View style={styles.banner}>
                <Text style={styles.bannerTitle}>🚧 Sesli İletişim — Yakında!</Text>
                <Text style={styles.bannerDesc}>WebRTC altyapısı Hafta 9-10'da eklenecek. Şu an oturum yönetimi aktif.</Text>
            </View>

            {/* Katılımcılar */}
            <Text style={styles.sectionTitle}>Katılımcılar ({participants.length})</Text>
            {participants.length === 0 ? (
                <Text style={styles.empty}>Henüz kimse yok. İlk katılan sen ol!</Text>
            ) : (
                <FlatList
                    data={participants}
                    keyExtractor={(item) => item._id}
                    renderItem={renderParticipant}
                    style={styles.list}
                />
            )}

            {/* Kontroller */}
            <View style={styles.controls}>
                {!inChannel ? (
                    <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                        <Text style={styles.joinBtnText}>📞  Kanala Katıl</Text>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <Text style={styles.connectedText}>✅ Bağlısınız</Text>
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
                                onPress={handleToggleMute}
                            >
                                <Text style={styles.ctrlBtnText}>{isMuted ? '🔇 Sessiz' : '🎤 Mikrofon'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.ctrlBtn, isDeafened && styles.ctrlBtnActive]}
                                onPress={handleToggleDeafen}
                            >
                                <Text style={styles.ctrlBtnText}>{isDeafened ? '🔕 Sağır' : '🔊 Ses'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
                            <Text style={styles.leaveBtnText}>📵  Kanaldan Ayrıl</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    banner: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 10, padding: 12, marginBottom: 20 },
    bannerTitle: { fontWeight: '700', color: '#92400e', fontSize: 14, marginBottom: 4 },
    bannerDesc: { color: '#78350f', fontSize: 12, lineHeight: 18 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
    empty: { textAlign: 'center', color: '#9ca3af', marginBottom: 20 },
    list: { flex: 1, marginBottom: 12 },
    participant: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    participantInfo: {},
    username: { fontWeight: '600', color: '#111', fontSize: 14 },
    statusRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
    statusBadge: { fontSize: 11, color: '#991b1b', backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 },
    activeBadge: { color: '#065f46', backgroundColor: '#d1fae5' },
    controls: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    joinBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 16, alignItems: 'center' },
    joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    connectedText: { color: '#10b981', fontWeight: '700', textAlign: 'center', marginBottom: 12 },
    btnRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    ctrlBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    ctrlBtnActive: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    ctrlBtnText: { fontWeight: '600', fontSize: 13 },
    leaveBtn: { backgroundColor: '#dc2626', borderRadius: 10, padding: 14, alignItems: 'center' },
    leaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
