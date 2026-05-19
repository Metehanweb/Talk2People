'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { authService, channelsService } from '../../../../lib/api';
import Sidebar from '../../../../shared/Sidebar';

const API_BASE = 'http://localhost:3000';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export default function VoicePage() {
    const router = useRouter();
    const params = useParams();
    const channelId = params.channelId;

    const [currentUser, setCurrentUser] = useState(null);
    const [channel, setChannel] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [inChannel, setInChannel] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [channelPassword, setChannelPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);

    // WebRTC & Socket Refs
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
    const socketUserIdsRef = useRef(new Map());
    const speakingWatchersRef = useRef(new Map());
    
    // Remote audio streams UI management
    const [remoteStreams, setRemoteStreams] = useState([]); // { socketId, stream }
    const [localSpeaking, setLocalSpeaking] = useState(false);
    const [speakingUserIds, setSpeakingUserIds] = useState(new Set());
    const remoteAudiosContainerRef = useRef(null);

    useEffect(() => { checkAuth(); }, []);

    useEffect(() => {
        if (currentUser) {
            fetchChannel();
            fetchParticipants();
            const interval = setInterval(fetchParticipants, 5000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (inChannel) {
                handleLeave();
            }
        };
    }, [inChannel]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
        } catch { router.push('/auth/login'); }
    }

    async function fetchChannel() {
        try {
            const res = await channelsService.getChannelById(channelId, channelPassword ? { kanal_sifresi: channelPassword } : {});
            setChannel(res.data);
            setNeedsPassword(false);
        } catch (err) {
            if (err.message?.toLowerCase().includes('şifre')) {
                setNeedsPassword(true);
            }
            setError(err.message);
        }
        finally { setLoading(false); }
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setError('');
        await fetchChannel();
    }

    async function fetchParticipants() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/channels/${channelId}/voice/participants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setParticipants(data.data || []);
        } catch { }
    }

    async function handleJoin() {
        try {
            // 1. Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            startSpeakingWatcher('local', stream, speaking => setLocalSpeaking(speaking));
            
            // Apply initial mute state if joining muted
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });

            // 2. DB / API Join
            const token = localStorage.getItem('token');
            const joinRes = await fetch(`${API_BASE}/channels/${channelId}/voice/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ kanal_sifresi: channelPassword })
            });
            const joinData = await joinRes.json();
            if (!joinData.success) {
                throw new Error(joinData.message || 'Kanala katılamadınız');
            }

            // 3. Connect Socket for WebRTC Signaling
            socketRef.current = io(API_BASE, { auth: { token } });
            
            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_voice', { channelId, user: currentUser, kanal_sifresi: channelPassword });
            });

            // Signaling handlers
            socketRef.current.on('user_joined_voice', handleUserJoined);
            socketRef.current.on('user_left_voice', handleUserLeft);
            socketRef.current.on('voice_signal', handleVoiceSignal);

            setInChannel(true);
            fetchParticipants();
            setError('');
        } catch (err) { 
            console.error(err);
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            setError(err.message?.includes('şifre') ? err.message : 'Kanala katılırken hata oluştu. Mikrofon izni verdiğinizden emin olun.'); 
        }
    }

    async function handleLeave() {
        try {
            // 1. Stop local media
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }

            // 2. Close all peer connections
            peersRef.current.forEach((peer, socketId) => {
                peer.close();
            });
            peersRef.current.clear();
            speakingWatchersRef.current.forEach(stop => stop());
            speakingWatchersRef.current.clear();
            socketUserIdsRef.current.clear();
            setLocalSpeaking(false);
            setSpeakingUserIds(new Set());
            setRemoteStreams([]);

            // 3. Disconnect socket
            if (socketRef.current) {
                socketRef.current.emit('leave_voice', channelId);
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            // 4. API Leave
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/channels/${channelId}/voice/leave`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setInChannel(false);
            fetchParticipants();
        } catch (err) {
            console.error(err);
        }
    }

    // --- WebRTC Logic ---

    function createPeerConnection(targetSocketId) {
        const peer = new RTCPeerConnection(ICE_SERVERS);
        
        // Add local stream tracks to peer
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('voice_signal', {
                    targetSocketId,
                    signal: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        // Handle incoming audio streams
        peer.ontrack = (event) => {
            const remoteStream = event.streams[0];
            startSpeakingWatcher(targetSocketId, remoteStream, speaking => {
                const userId = socketUserIdsRef.current.get(targetSocketId);
                if (!userId) return;
                setSpeakingUserIds(prev => {
                    const next = new Set(prev);
                    if (speaking) next.add(String(userId));
                    else next.delete(String(userId));
                    return next;
                });
            });
            setRemoteStreams(prev => {
                // If stream already exists, don't add again
                if (prev.find(rs => rs.socketId === targetSocketId)) return prev;
                return [...prev, { socketId: targetSocketId, stream: remoteStream }];
            });
        };

        peersRef.current.set(targetSocketId, peer);
        return peer;
    }

    async function handleUserJoined(data) {
        const { socketId, userId, user } = data;
        socketUserIdsRef.current.set(socketId, userId || user?._id || user?.userId);
        const peer = createPeerConnection(socketId);
        
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            
            socketRef.current.emit('voice_signal', {
                targetSocketId: socketId,
                signal: { type: 'offer', offer }
            });
        } catch (err) {
            console.error('Offer oluşturulurken hata:', err);
        }
    }

    async function handleUserLeft(data) {
        const { socketId } = data;
        if (peersRef.current.has(socketId)) {
            peersRef.current.get(socketId).close();
            peersRef.current.delete(socketId);
        }
        setRemoteStreams(prev => prev.filter(rs => rs.socketId !== socketId));
        const userId = socketUserIdsRef.current.get(socketId);
        socketUserIdsRef.current.delete(socketId);
        stopSpeakingWatcher(socketId);
        if (userId) {
            setSpeakingUserIds(prev => {
                const next = new Set(prev);
                next.delete(String(userId));
                return next;
            });
        }
    }

    async function handleVoiceSignal(data) {
        const { callerId, callerUserId, signal } = data;
        if (callerUserId) {
            socketUserIdsRef.current.set(callerId, callerUserId);
        }

        if (signal.type === 'offer') {
            const peer = createPeerConnection(callerId);
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                
                socketRef.current.emit('voice_signal', {
                    targetSocketId: callerId,
                    signal: { type: 'answer', answer }
                });
            } catch (err) {
                console.error('Offer işlenirken hata:', err);
            }
        } 
        else if (signal.type === 'answer') {
            const peer = peersRef.current.get(callerId);
            if (peer) {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
                } catch (err) {
                    console.error('Answer işlenirken hata:', err);
                }
            }
        } 
        else if (signal.type === 'candidate') {
            const peer = peersRef.current.get(callerId);
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (err) {
                    console.error('ICE adayı eklenirken hata:', err);
                }
            }
        }
    }

    // --- Controls ---

    async function handleToggleMute() {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        
        // WebRTC Local Stream Control
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMuted;
            });
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/channels/${channelId}/voice/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessiz_mi: newMuted })
            });
            fetchParticipants();
        } catch { }
    }

    async function handleToggleDeafen() {
        const newDeafened = !isDeafened;
        setIsDeafened(newDeafened);
        // HTMLAudioElements muted state will be handled in render
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/channels/${channelId}/voice/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sagir_mi: newDeafened })
            });
            fetchParticipants();
        } catch { }
    }

    // Effect to attach streams to audio elements dynamically
    useEffect(() => {
        remoteStreams.forEach(rs => {
            const audioElement = document.getElementById(`audio-${rs.socketId}`);
            if (audioElement && audioElement.srcObject !== rs.stream) {
                audioElement.srcObject = rs.stream;
            }
        });
    }, [remoteStreams]);

    function startSpeakingWatcher(key, stream, onChange) {
        stopSpeakingWatcher(key);
        if (!stream || typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        const data = new Uint8Array(512);
        let rafId;
        let lastSpeaking = false;

        analyser.fftSize = 512;
        source.connect(analyser);

        const tick = () => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i += 1) {
                const value = (data[i] - 128) / 128;
                sum += value * value;
            }
            const speaking = Math.sqrt(sum / data.length) > 0.035;
            if (speaking !== lastSpeaking) {
                lastSpeaking = speaking;
                onChange(speaking);
            }
            rafId = requestAnimationFrame(tick);
        };

        tick();
        speakingWatchersRef.current.set(key, () => {
            cancelAnimationFrame(rafId);
            source.disconnect();
            audioContext.close();
            onChange(false);
        });
    }

    function stopSpeakingWatcher(key) {
        const stop = speakingWatchersRef.current.get(key);
        if (!stop) return;
        stop();
        speakingWatchersRef.current.delete(key);
    }


    if (loading) {
        return (
            <div className="loading-screen" style={{ height: '100vh' }}>
                <div className="spinner" />
                <p className="loading-text">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <div className="main-content">
                
                {/* Görünmez Audio Elementleri */}
                <div ref={remoteAudiosContainerRef} style={{ display: 'none' }}>
                    {remoteStreams.map(rs => (
                        <audio 
                            key={rs.socketId} 
                            id={`audio-${rs.socketId}`} 
                            autoPlay 
                            muted={isDeafened} // Eğer sağırsa gelen sesleri sessize al
                        />
                    ))}
                </div>

                {/* Header */}
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => router.push('/channels')}
                            style={{ padding: '8px 14px', fontSize: 13 }}
                        >
                            ← Kanallar
                        </button>
                        <div>
                            <div className="page-title">🔊 {channel?.ad}</div>
                            {channel?.aciklama && <div className="page-subtitle">{channel.aciklama}</div>}
                        </div>
                    </div>
                    <span className="badge badge-blue">Sesli Kanal</span>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

                    {needsPassword && (
                        <form onSubmit={handlePasswordSubmit} style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 14,
                            padding: 18,
                            marginBottom: 20,
                            maxWidth: 420,
                        }}>
                            <div className="field-group" style={{ marginBottom: 12 }}>
                                <label className="field-label">Kanal Şifresi</label>
                                <input
                                    className="field-input"
                                    type="password"
                                    value={channelPassword}
                                    onChange={e => setChannelPassword(e.target.value)}
                                    placeholder="Bu ses kanalı kilitli"
                                    autoFocus
                                />
                            </div>
                            <button className="btn btn-primary" type="submit">Kilidi Aç</button>
                        </form>
                    )}

                    {!needsPassword && <div className="voice-grid">
                        {/* Participants Panel */}
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 16,
                            padding: 24,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Katılımcılar
                                </h2>
                                <span className="badge badge-gray">{participants.length} kişi</span>
                            </div>

                            {participants.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px 0' }}>
                                    <div className="empty-icon" style={{ fontSize: 36 }}>🎙️</div>
                                    <div className="empty-text">Henüz kimse yok.<br />İlk katılan sen ol!</div>
                                </div>
                            ) : (
                                <div className="participants-list">
                                    {participants.map(p => {
                                        const isMe = currentUser?._id === p.kullanici?._id;
                                        const userId = String(p.kullanici?._id || '');
                                        const isSpeaking = isMe ? localSpeaking && !isMuted : speakingUserIds.has(userId);
                                        return (
                                            <div key={p._id} className="participant-item">
                                                <div className={`user-avatar ${isSpeaking ? 'voice-speaking' : ''}`} style={isMe && !isSpeaking ? { border: '2px solid var(--accent-blue)' } : {}}>
                                                    {(p.kullanici?.username || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {p.kullanici?.username || 'Bilinmeyen'} {isMe && '(Ben)'}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                                                        {p.sessiz_mi && <span className="badge badge-yellow" style={{ fontSize: 11 }}>🔇 Sessiz</span>}
                                                        {p.sagir_mi && <span className="badge badge-red" style={{ fontSize: 11 }}>🔕 Sağır</span>}
                                                        {!p.sessiz_mi && !p.sagir_mi && <span className="badge badge-green" style={{ fontSize: 11 }}>🟢 Aktif</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Controls Panel */}
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 16,
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 20,
                            minHeight: 280,
                        }}>
                            {!inChannel ? (
                                <>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                            Sesli kanala katılmak için butona tıkla
                                        </p>
                                        <button className="voice-join-btn" onClick={handleJoin} title="Kanala Katıl">
                                            📞
                                        </button>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>Kanala Katıl</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                        <span className="badge badge-green" style={{ fontSize: 13, padding: '5px 14px' }}>
                                            ✅ WebRTC ile Bağlandınız
                                        </span>
                                    </div>
                                    <div className="voice-ctrl-row">
                                        <button
                                            className={`voice-ctrl-btn ${isMuted ? 'active' : ''}`}
                                            onClick={handleToggleMute}
                                            title={isMuted ? 'Sessizliği Kaldır' : 'Sessiz Ol'}
                                        >
                                            {isMuted ? '🔇' : '🎤'}
                                        </button>
                                        <button
                                            className={`voice-ctrl-btn ${isDeafened ? 'active' : ''}`}
                                            onClick={handleToggleDeafen}
                                            title={isDeafened ? 'Sesi Aç' : 'Sağır Ol'}
                                        >
                                            {isDeafened ? '🔕' : '🔊'}
                                        </button>
                                        <button className="voice-leave-btn" onClick={handleLeave} title="Kanaldan Ayrıl">
                                            📵
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                        <span>{isMuted ? '🔇 Sessiz' : '🎤 Açık'}</span>
                                        <span>{isDeafened ? '🔕 Sağır' : '🔊 Dinliyor'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
        </div>
    );
}
