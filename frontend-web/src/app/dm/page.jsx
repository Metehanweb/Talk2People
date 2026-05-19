'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, dmService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function DmListPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { checkAuth(); }, []);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
            const convRes = await dmService.getConversations();
            setConversations(convRes.data || []);
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
                <div className="page-header">
                    <div>
                        <div className="page-title">✉️ DM</div>
                        <div className="page-subtitle">Arkadaşlarınla özel mesajlaş</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => router.push('/friends')}>Arkadaş Ekle</button>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {conversations.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✉️</div>
                            <div className="empty-text">DM başlatmak için önce arkadaş ekle.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12, maxWidth: 780 }}>
                            {conversations.map(item => (
                                <button
                                    key={item.user?._id}
                                    onClick={() => router.push(`/dm/${item.user._id}`)}
                                    style={conversationButtonStyle}
                                >
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                                        <div className="user-avatar">{(item.user?.username || '?')[0].toUpperCase()}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{item.user?.username}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.latestMessage?.icerik || 'Henüz mesaj yok'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aç</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const conversationButtonStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
    textAlign: 'left',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
};
