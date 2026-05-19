'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { authService, channelsService, messagesService } from '../../../lib/api';
import Sidebar from '../../../shared/Sidebar';

export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const channelId = params.channelId;

    const [currentUser, setCurrentUser] = useState(null);
    const [channel, setChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [channelPassword, setChannelPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => { checkAuth(); }, []);

    useEffect(() => {
        if (currentUser) {
            fetchChannel();
            fetchMessages();
            const token = localStorage.getItem('token');
            socketRef.current = io('http://localhost:3000', { auth: { token } });
            socketRef.current.on('connect', () => {
                setConnected(true);
                socketRef.current.emit('join_channel', { channelId, kanal_sifresi: channelPassword });
            });
            socketRef.current.on('disconnect', () => setConnected(false));
            socketRef.current.on('new_message', (msg) => {
                setMessages(prev => [...prev, msg]);
            });
            socketRef.current.on('message_deleted', (data) => {
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            });
            socketRef.current.on('message_reaction_updated', (data) => {
                setMessages(prev => prev.map(msg => 
                    msg._id === data.messageId ? { ...msg, tepkiler: data.tepkiler } : msg
                ));
            });
            socketRef.current.on('exception', (err) => {
                setError(err.message || 'Bir bağlantı hatası oluştu');
            });
            return () => {
                if (socketRef.current) {
                    socketRef.current.emit('leave_channel', channelId);
                    socketRef.current.off('connect');
                    socketRef.current.off('disconnect');
                    socketRef.current.off('new_message');
                    socketRef.current.off('message_deleted');
                    socketRef.current.off('message_reaction_updated');
                    socketRef.current.off('exception');
                    socketRef.current.disconnect();
                }
            };
        }
    }, [currentUser, channelId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
        } catch {
            router.push('/auth/login');
        }
    }

    async function fetchChannel() {
        try {
            const res = await channelsService.getChannelById(channelId, channelPassword ? { kanal_sifresi: channelPassword } : {});
            setChannel(res.data);
            setNeedsPassword(false);
        } catch (err) {
            if (isPasswordError(err)) {
                setNeedsPassword(true);
                setError('Kanal şifresi hatalı veya gerekli.');
                return;
            }
            setError(err.message);
        }
    }

    async function fetchMessages(bg = false) {
        if (!bg) setLoading(true);
        try {
            const params = { limit: 50 };
            if (channelPassword) params.kanal_sifresi = channelPassword;
            const res = await messagesService.getMessages(channelId, params);
            setMessages((res.data || []).reverse());
            setNeedsPassword(false);
        } catch (err) {
            if (isPasswordError(err)) {
                setNeedsPassword(true);
                setError('Kanal şifresi hatalı veya gerekli.');
                return;
            }
            setError(err.message);
        } finally {
            if (!bg) setLoading(false);
        }
    }

    function isPasswordError(err) {
        const message = String(err.message || '').toLowerCase();
        return message.includes('şifre') || message.includes('internal server error');
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setError('');
        await fetchChannel();
        await fetchMessages();
        if (socketRef.current?.connected) {
            socketRef.current.emit('join_channel', { channelId, kanal_sifresi: channelPassword });
        }
    }

    async function handleSend(e) {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;
        socketRef.current.emit('send_message', { 
            channelId, 
            icerik: newMessage.trim(),
            alintiId: replyingTo ? replyingTo._id : null,
            kanal_sifresi: channelPassword
        });
        setNewMessage('');
        setReplyingTo(null);
    }

    async function handleDelete(messageId) {
        if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
        try {
            await messagesService.deleteMessage(channelId, messageId);
            fetchMessages(true);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleReact(messageId, emoji) {
        setActiveReactionMessageId(null);
        try {
            await messagesService.reactToMessage(channelId, messageId, emoji);
            // WebSocket üzerinden 'message_reaction_updated' eventi ile anında güncellenecek
        } catch (err) {
            console.error('Tepki eklenirken hata oluştu', err);
        }
    }

    const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    const isAdmin = currentUser?.role === 'admin';

    // Group messages by sender (consecutive)
    function groupMessages(msgs) {
        const groups = [];
        msgs.forEach((msg, i) => {
            const prev = msgs[i - 1];
            const sameUser = prev && prev.gonderen?._id === msg.gonderen?._id;
            const timeDiff = prev ? (new Date(msg.olusturulma_tarihi) - new Date(prev.olusturulma_tarihi)) / 60000 : 99;
            if (sameUser && timeDiff < 5) {
                groups[groups.length - 1].msgs.push(msg);
            } else {
                groups.push({ sender: msg.gonderen, msgs: [msg] });
            }
        });
        return groups;
    }

    const groups = groupMessages(messages);

    return (
        <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <div className="main-content">
                {/* Chat Header */}
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
                            <div className="page-title">
                                {channel?.tur === 'voice' ? '🔊' : '💬'} {channel?.ad || '...'}
                            </div>
                            {channel?.aciklama && (
                                <div className="page-subtitle">{channel.aciklama}</div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={connected ? 'status-dot' : ''} style={!connected ? { width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' } : {}} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {connected ? 'Bağlı' : 'Bağlanıyor...'}
                        </span>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="chat-container">
                    {error && (
                        <div className="alert-error" style={{ margin: '12px 28px 0' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {needsPassword && (
                        <form onSubmit={handlePasswordSubmit} style={{
                            margin: 28,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 14,
                            padding: 18,
                        }}>
                            <div className="field-group" style={{ marginBottom: 12 }}>
                                <label className="field-label">Kanal Şifresi</label>
                                <input
                                    className="field-input"
                                    type="password"
                                    value={channelPassword}
                                    onChange={e => setChannelPassword(e.target.value)}
                                    placeholder="Bu kanal kilitli"
                                    autoFocus
                                />
                            </div>
                            <button className="btn btn-primary" type="submit">Kilidi Aç</button>
                        </form>
                    )}

                    {needsPassword ? null : loading ? (
                        <div className="loading-screen">
                            <div className="spinner" />
                            <p className="loading-text">Mesajlar yükleniyor...</p>
                        </div>
                    ) : (
                        <div className="chat-messages">
                            {groups.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-icon">💬</div>
                                    <div className="empty-text">Henüz mesaj yok. İlk mesajı sen gönder! 🎉</div>
                                </div>
                            )}
                            {groups.map((group, gi) => {
                                const isOwn = group.sender?._id === currentUser?._id;
                                const initial = (group.sender?.username || '?')[0].toUpperCase();
                                return (
                                    <div key={gi} className={`msg-row ${isOwn ? 'msg-own' : ''}`}>
                                        <div className="msg-avatar" style={{
                                            background: isOwn
                                                ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                                                : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                                        }}>
                                            {initial}
                                        </div>
                                        <div className="msg-content">
                                            <div className="msg-header">
                                                <span className="msg-sender">
                                                    {group.sender?.username || 'Bilinmeyen'}
                                                    {isOwn && ' (Ben)'}
                                                </span>
                                                <span className="msg-time">
                                                    {new Date(group.msgs[0].olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {group.msgs.map(msg => (
                                                <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, position: 'relative' }}>
                                                    {msg.alinti_yapilan_mesaj && (
                                                        <div className="msg-quote" onClick={() => {
                                                            // Optional: Scroll to message logic could be added here
                                                        }}>
                                                            Cevaplanan: <strong>@{msg.alinti_yapilan_mesaj.gonderen?.username}</strong> - {msg.alinti_yapilan_mesaj.icerik?.substring(0, 40)}{msg.alinti_yapilan_mesaj.icerik?.length > 40 ? '...' : ''}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                                        <p className="msg-text" style={{ flex: 1 }}>{msg.icerik}</p>
                                                        
                                                        {/* Actions on Hover */}
                                                        <div className="msg-actions">
                                                            <button 
                                                                title="Tepki Ekle" 
                                                                className="react-msg-btn"
                                                                onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg._id ? null : msg._id)}
                                                            >
                                                                +😀
                                                            </button>
                                                            <button 
                                                                title="Cevapla" 
                                                                className="reply-msg-btn"
                                                                onClick={() => setReplyingTo(msg)}
                                                            >
                                                                ↩
                                                            </button>
                                                            {(isOwn || isAdmin) && (
                                                                <button
                                                                    title="Sil"
                                                                    onClick={() => handleDelete(msg._id)}
                                                                    className="delete-msg-btn"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Emoji Picker Popup */}
                                                        {activeReactionMessageId === msg._id && (
                                                            <div className="reaction-picker">
                                                                {EMOJIS.map(emoji => (
                                                                    <button 
                                                                        key={emoji} 
                                                                        className="emoji-btn"
                                                                        onClick={() => handleReact(msg._id, emoji)}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Reactions Display */}
                                                    {msg.tepkiler && msg.tepkiler.length > 0 && (
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                                            {msg.tepkiler.map((reaction, i) => {
                                                                const isUserReacted = currentUser && reaction.kullanicilar.includes(currentUser._id);
                                                                return (
                                                                    <button 
                                                                        key={i} 
                                                                        className={`reaction-pill ${isUserReacted ? 'active' : ''}`}
                                                                        onClick={() => handleReact(msg._id, reaction.emoji)}
                                                                    >
                                                                        <span>{reaction.emoji}</span>
                                                                        <span>{reaction.kullanicilar.length}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Input */}
                    <div className="chat-input-area">
                        {replyingTo && (
                            <div style={{
                                padding: '8px 12px',
                                background: 'rgba(124,58,237,0.1)',
                                borderLeft: '3px solid var(--brand-primary-light)',
                                borderRadius: '4px 4px 0 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '13px',
                                color: 'var(--text-secondary)'
                            }}>
                                <span>Yanıtlanıyor: <strong>@{replyingTo.gonderen?.username}</strong> - {replyingTo.icerik?.substring(0, 30)}...</span>
                                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                            </div>
                        )}
                        <form onSubmit={handleSend}>
                            <div className="chat-input-wrapper" style={{ borderRadius: replyingTo ? '0 0 14px 14px' : '14px' }}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={`#${channel?.ad || '...'} kanalına mesaj gönder`}
                                />
                                <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                                    ➤
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
