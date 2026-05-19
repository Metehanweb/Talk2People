'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { adminService, authService, dmService, usersService } from '../../../lib/api';
import Sidebar from '../../../shared/Sidebar';

const API_BASE = 'http://localhost:3000';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export default function DmPage() {
    const router = useRouter();
    const params = useParams();
    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const dmSocketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const speakingWatchersRef = useRef(new Map());
    const targetUserId = params.userId;
    const [currentUser, setCurrentUser] = useState(null);
    const [targetUser, setTargetUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [voiceError, setVoiceError] = useState('');
    const [inVoiceCall, setInVoiceCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [hasMicrophone, setHasMicrophone] = useState(false);
    const [localSpeaking, setLocalSpeaking] = useState(false);
    const [speakingSockets, setSpeakingSockets] = useState(new Set());
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [callNotice, setCallNotice] = useState('');
    const [callStartedAt, setCallStartedAt] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => { checkAuth(); }, [targetUserId]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        return () => {
            leaveVoiceCall();
            if (dmSocketRef.current) {
                dmSocketRef.current.disconnect();
                dmSocketRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!callStartedAt) return;
        const interval = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartedAt) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [callStartedAt]);

    useEffect(() => {
        remoteStreams.forEach(item => {
            const audioElement = document.getElementById(`dm-audio-${item.socketId}`);
            if (audioElement && audioElement.srcObject !== item.stream) {
                audioElement.srcObject = item.stream;
            }
        });
    }, [remoteStreams]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
            await fetchMessages();
            connectDmSocket();
        } catch (err) {
            if (err.message?.toLowerCase().includes('token') || err.message?.toLowerCase().includes('unauthorized')) {
                router.push('/auth/login');
                return;
            }
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMessages() {
        const res = await dmService.getMessages(targetUserId, { limit: 80 });
        setTargetUser(res.data.user);
        setMessages(res.data.messages || []);
    }

    async function handleSend(e) {
        e.preventDefault();
        const text = message.trim();
        if (!text || sending) return;

        setSending(true);
        setError('');
        try {
            const res = await dmService.sendMessage(targetUserId, text);
            setMessages(items => [...items, res.data]);
            setMessage('');
            emitTyping(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    function connectDmSocket() {
        const token = localStorage.getItem('token');
        if (!token || dmSocketRef.current) return;
        dmSocketRef.current = io(API_BASE, { auth: { token } });
        dmSocketRef.current.on('connect', () => {
            dmSocketRef.current.emit('join_dm_room', { targetUserId });
        });
        dmSocketRef.current.on('dm_typing', data => {
            if (String(data.userId) !== String(targetUserId)) return;
            setRemoteTyping(Boolean(data.isTyping));
        });
        dmSocketRef.current.on('incoming_dm_call', data => {
            setCallNotice(`${data.username || 'Bir kullanıcı'} seni sesli arıyor.`);
        });
        dmSocketRef.current.on('missed_dm_call', () => {
            setCallNotice('Cevapsız sesli arama var.');
        });
    }

    function emitTyping(isTyping) {
        if (!dmSocketRef.current?.connected) return;
        dmSocketRef.current.emit('dm_typing', { targetUserId, isTyping });
    }

    function handleMessageChange(value) {
        setMessage(value);
        emitTyping(Boolean(value.trim()));
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
    }

    async function handleReportMessage(item) {
        const reason = prompt('Rapor nedeni nedir?');
        if (!reason?.trim()) return;
        try {
            await adminService.createReport({
                hedef_tipi: 'dm_message',
                hedef_id: item._id,
                hedef_kullanici: item.gonderen?._id || item.gonderen,
                neden: reason.trim(),
            });
            setCallNotice('Rapor admin ekibine iletildi.');
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleBlockUser() {
        if (!confirm(`${targetUser?.username || 'Bu kullanıcı'} engellensin mi?`)) return;
        try {
            await usersService.blockUser(targetUserId);
            setCallNotice('Kullanıcı engellendi. Artık karşılıklı DM gönderilemez.');
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleEditMessage(messageId) {
        const text = editingText.trim();
        if (!text) return;
        try {
            const res = await dmService.editMessage(messageId, text);
            setMessages(items => items.map(item => item._id === messageId ? res.data : item));
            setEditingMessageId(null);
            setEditingText('');
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDeleteMessage(messageId) {
        if (!confirm('Bu mesajı silmek istediğine emin misin?')) return;
        try {
            await dmService.deleteMessage(messageId);
            setMessages(items => items.filter(item => item._id !== messageId));
        } catch (err) {
            setError(err.message);
        }
    }

    async function startVoiceCall() {
        try {
            const token = localStorage.getItem('token');
            const stream = await requestMicrophone();
            if (!stream) {
                setVoiceError('Mikrofon izni verilmedi. Görüşmeye dinleme modunda katıldın; konuşmak için tarayıcıdan mikrofon izni ver.');
            } else {
                setVoiceError('');
            }

            socketRef.current = io(API_BASE, { auth: { token } });
            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_dm_voice', {
                    targetUserId,
                    user: currentUser,
                });
            });
            socketRef.current.on('user_joined_voice', handleUserJoinedVoice);
            socketRef.current.on('user_left_voice', handleUserLeftVoice);
            socketRef.current.on('voice_signal', handleVoiceSignal);
            socketRef.current.on('exception', err => setVoiceError(err?.message || 'Sesli görüşme başlatılamadı.'));

            setInVoiceCall(true);
            setCallStartedAt(Date.now());
            setCallDuration(0);
        } catch (err) {
            cleanupVoiceResources();
            setVoiceError(err.message || 'Sesli görüşme başlatılamadı.');
        }
    }

    async function requestMicrophone() {
        if (!navigator.mediaDevices?.getUserMedia) {
            setHasMicrophone(false);
            return null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setHasMicrophone(true);
            startSpeakingWatcher('local', stream, speaking => setLocalSpeaking(speaking));
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
            return stream;
        } catch {
            localStreamRef.current = null;
            setHasMicrophone(false);
            return null;
        }
    }

    function leaveVoiceCall() {
        if (socketRef.current) {
            socketRef.current.emit('leave_dm_voice');
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        cleanupVoiceResources();
        setInVoiceCall(false);
        setCallStartedAt(null);
        setCallDuration(0);
        setRemoteUsers([]);
    }

    function cleanupVoiceResources() {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        setHasMicrophone(false);
        setLocalSpeaking(false);
        peersRef.current.forEach(peer => peer.close());
        peersRef.current.clear();
        speakingWatchersRef.current.forEach(stop => stop());
        speakingWatchersRef.current.clear();
        setSpeakingSockets(new Set());
        setRemoteStreams([]);
    }

    function createPeerConnection(targetSocketId) {
        const peer = new RTCPeerConnection(ICE_SERVERS);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current);
            });
        } else {
            peer.addTransceiver('audio', { direction: 'recvonly' });
        }

        peer.onicecandidate = event => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('voice_signal', {
                    targetSocketId,
                    signal: { type: 'candidate', candidate: event.candidate },
                });
            }
        };

        peer.ontrack = event => {
            const remoteStream = event.streams[0];
            startSpeakingWatcher(targetSocketId, remoteStream, speaking => {
                setSpeakingSockets(prev => {
                    const next = new Set(prev);
                    if (speaking) next.add(targetSocketId);
                    else next.delete(targetSocketId);
                    return next;
                });
            });
            setRemoteStreams(prev => {
                if (prev.find(item => item.socketId === targetSocketId)) return prev;
                return [...prev, { socketId: targetSocketId, stream: remoteStream }];
            });
        };

        peersRef.current.set(targetSocketId, peer);
        return peer;
    }

    async function handleUserJoinedVoice(data) {
        const { socketId, user } = data;
        setRemoteUsers(prev => {
            if (prev.find(item => item.socketId === socketId)) return prev;
            return [...prev, { socketId, user }];
        });

        const peer = createPeerConnection(socketId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('voice_signal', {
            targetSocketId: socketId,
            signal: { type: 'offer', offer },
        });
    }

    function handleUserLeftVoice(data) {
        const { socketId } = data;
        if (peersRef.current.has(socketId)) {
            peersRef.current.get(socketId).close();
            peersRef.current.delete(socketId);
        }
        setRemoteStreams(prev => prev.filter(item => item.socketId !== socketId));
        setRemoteUsers(prev => prev.filter(item => item.socketId !== socketId));
        stopSpeakingWatcher(socketId);
        setSpeakingSockets(prev => {
            const next = new Set(prev);
            next.delete(socketId);
            return next;
        });
    }

    async function handleVoiceSignal(data) {
        const { callerId, signal } = data;

        if (signal.type === 'offer') {
            const peer = createPeerConnection(callerId);
            await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socketRef.current.emit('voice_signal', {
                targetSocketId: callerId,
                signal: { type: 'answer', answer },
            });
            return;
        }

        const peer = peersRef.current.get(callerId);
        if (!peer) return;

        if (signal.type === 'answer') {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
        }

        if (signal.type === 'candidate') {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    }

    async function toggleMute() {
        if (!localStreamRef.current) {
            const stream = await requestMicrophone();
            if (!stream) {
                setVoiceError('Mikrofon izni hâlâ kapalı. Tarayıcı izinlerinden mikrofonu açman gerekiyor.');
                return;
            }
            setVoiceError('');
        }

        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = !nextMuted;
        });
    }

    function toggleDeafen() {
        setIsDeafened(value => !value);
    }

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

    const currentUserId = currentUser?._id || currentUser?.userId;
    const remoteSpeaking = speakingSockets.size > 0;
    const formattedCallDuration = `${String(Math.floor(callDuration / 60)).padStart(2, '0')}:${String(callDuration % 60).padStart(2, '0')}`;

    function renderAvatar(user, className = 'user-avatar', style = {}) {
        const url = user?.profil_fotografi_url;
        return (
            <div className={className} style={url ? { ...style, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : style}>
                {!url && (user?.username || '?')[0].toUpperCase()}
            </div>
        );
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
                <div style={{ display: 'none' }}>
                    {remoteStreams.map(item => (
                        <audio
                            key={item.socketId}
                            id={`dm-audio-${item.socketId}`}
                            autoPlay
                            muted={isDeafened}
                        />
                    ))}
                </div>

                <div className="page-header">
                    <div>
                        <div className="page-title">✉️ {targetUser?.username || 'DM'}</div>
                        <div className="page-subtitle">{targetUser?.email || 'Özel mesaj'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {!inVoiceCall ? (
                            <button className="btn btn-primary" onClick={startVoiceCall}>📞 Sesli Ara</button>
                        ) : (
                            <>
                                <button className={`voice-ctrl-btn ${isMuted || !hasMicrophone ? 'active' : ''}`} onClick={toggleMute} title={!hasMicrophone ? 'Mikrofon izni al' : isMuted ? 'Mikrofonu Aç' : 'Sessize Al'}>
                                    {!hasMicrophone || isMuted ? '🔇' : '🎤'}
                                </button>
                                <button className={`voice-ctrl-btn ${isDeafened ? 'active' : ''}`} onClick={toggleDeafen} title={isDeafened ? 'Sesi Aç' : 'Gelen Sesi Kapat'}>
                                    {isDeafened ? '🔕' : '🔊'}
                                </button>
                                <button className="voice-leave-btn" onClick={leaveVoiceCall} title="Görüşmeden Ayrıl">📵</button>
                            </>
                        )}
                        <button className="btn btn-ghost" onClick={handleBlockUser}>Engelle</button>
                        <button className="btn btn-ghost" onClick={() => router.push('/dm')}>DM Listesi</button>
                    </div>
                </div>

                <div className="page-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', gap: 16 }}>
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {voiceError && <div className="alert-error">⚠️ {voiceError}</div>}
                    {callNotice && <div className="alert-success">ℹ️ {callNotice}</div>}

                    {inVoiceCall && (
                        <div className="dm-voice-panel">
                            <div>
                                <div className="dm-voice-title">Sesli görüşme açık</div>
                                <div className="dm-voice-subtitle">
                                    {!hasMicrophone
                                        ? 'Mikrofon izni yok, şu an yalnızca dinleme modundasın'
                                        : remoteUsers.length > 0 || remoteStreams.length > 0
                                            ? `${targetUser?.username || 'Arkadaşın'} bağlandı`
                                            : `${targetUser?.username || 'Arkadaşın'} katıldığında ses otomatik bağlanır`}
                                    {' · '}
                                    Süre {formattedCallDuration}
                                </div>
                            </div>
                            <div className="dm-voice-users">
                                <div className="dm-voice-user">
                                    {renderAvatar(currentUser, `user-avatar ${localSpeaking && !isMuted && hasMicrophone ? 'voice-speaking' : ''}`)}
                                    <span>{currentUser?.username || 'Sen'}</span>
                                </div>
                                <div className="dm-voice-user">
                                    {renderAvatar(targetUser, `user-avatar ${remoteSpeaking ? 'voice-speaking' : ''}`)}
                                    <span>{targetUser?.username || 'Karsi taraf'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={messagePanelStyle}>
                        {messages.length === 0 ? (
                            <div className="empty-state" style={{ padding: 32 }}>
                                <div className="empty-text">Henüz mesaj yok.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {messages.map(item => {
                                    const mine = String(item.gonderen?._id || item.gonderen) === String(currentUserId);
                                    return (
                                        <div
                                            key={item._id}
                                            style={{
                                                alignSelf: mine ? 'flex-end' : 'flex-start',
                                                maxWidth: '68%',
                                                background: mine ? 'var(--brand-primary)' : 'var(--bg-elevated)',
                                                color: mine ? '#fff' : 'var(--text-primary)',
                                                border: mine ? 'none' : '1px solid var(--border-subtle)',
                                                borderRadius: 12,
                                                padding: '10px 12px',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {editingMessageId === item._id ? (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <input className="field-input" value={editingText} onChange={e => setEditingText(e.target.value)} autoFocus />
                                                    <button type="button" className="btn btn-primary" onClick={() => handleEditMessage(item._id)}>Kaydet</button>
                                                    <button type="button" className="btn btn-ghost" onClick={() => setEditingMessageId(null)}>Vazgeç</button>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 14, lineHeight: 1.45 }}>{item.icerik}</div>
                                            )}
                                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                                                {new Date(item.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                {item.duzenlendi_mi && ' · düzenlendi'}
                                                {mine && ` · ${item.okundu_mu ? 'Okundu' : 'Gönderildi'}`}
                                            </div>
                                            {editingMessageId !== item._id && (
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                                    <button type="button" className="message-mini-action" onClick={() => { setEditingMessageId(item._id); setEditingText(item.icerik); }}>Düzenle</button>
                                                    <button type="button" className="message-mini-action danger" onClick={() => handleDeleteMessage(item._id)}>Sil</button>
                                                </div>
                                            )}
                                            {!mine && (
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                    <button type="button" className="message-mini-action" onClick={() => handleReportMessage(item)}>Raporla</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>
                        )}
                    </div>

                    {remoteTyping && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, paddingLeft: 4 }}>
                            {targetUser?.username || 'Karşı taraf'} yazıyor...
                        </div>
                    )}

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
                        <input
                            className="field-input"
                            value={message}
                            onChange={e => handleMessageChange(e.target.value)}
                            placeholder={`${targetUser?.username || 'Arkadaşına'} mesaj yaz`}
                            maxLength={2000}
                        />
                        <button type="submit" className="btn btn-primary" disabled={sending || !message.trim()}>
                            {sending ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const messagePanelStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    padding: 18,
};
