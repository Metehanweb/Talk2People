'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, friendsService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function FriendsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => { checkAuth(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentUser && searchTerm.trim().length >= 2) searchUsers();
            if (searchTerm.trim().length < 2) setSearchResults([]);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, currentUser]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
            await fetchOverview();
        } catch {
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    }

    async function fetchOverview() {
        const res = await friendsService.getOverview();
        setFriends(res.data.friends || []);
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
    }

    async function searchUsers() {
        setSearching(true);
        setError('');
        try {
            const res = await friendsService.searchUsers(searchTerm.trim());
            setSearchResults(res.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setSearching(false);
        }
    }

    async function runAction(action, successText = '') {
        setError('');
        setNotice('');
        try {
            await action();
            if (successText) setNotice(successText);
            await fetchOverview();
        } catch (err) {
            setError(err.message);
        }
    }

    const outgoingTargetIds = new Set(outgoing.map(item => String(item.hedef?._id)));
    const friendIds = new Set(friends.map(item => String(item.user?._id)));

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
                        <div className="page-title">👥 Arkadaşlar</div>
                        <div className="page-subtitle">{friends.length} arkadaş, {incoming.length} bekleyen istek</div>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {notice && <div className="alert-success">{notice}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20, alignItems: 'start' }}>
                        <section style={panelStyle}>
                            <h3 style={titleStyle}>Kullanıcı ara</h3>
                            <input
                                className="field-input"
                                placeholder="Kullanıcı adı veya e-posta"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <div style={listStyle}>
                                {searching && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Aranıyor...</div>}
                                {!searching && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sonuç bulunamadı.</div>
                                )}
                                {searchResults.map(user => {
                                    const disabled = outgoingTargetIds.has(String(user._id)) || friendIds.has(String(user._id));
                                    return (
                                        <div key={user._id} style={rowStyle}>
                                            <UserSummary user={user} />
                                            <button
                                                className="btn btn-primary"
                                                disabled={disabled}
                                                onClick={() => runAction(async () => {
                                                    await friendsService.sendRequest(user._id);
                                                    setSearchResults(results => results.filter(item => item._id !== user._id));
                                                }, 'Arkadaşlık isteği gönderildi.')}
                                                style={smallButtonStyle}
                                            >
                                                {disabled ? 'Ekli' : 'Ekle'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div style={{ display: 'grid', gap: 20 }}>
                            {incoming.length > 0 && (
                                <section style={panelStyle}>
                                    <h3 style={titleStyle}>Gelen istekler</h3>
                                    <div style={listStyle}>
                                        {incoming.map(item => (
                                            <div key={item._id} style={rowStyle}>
                                                <UserSummary user={item.isteyen} />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary" onClick={() => runAction(() => friendsService.acceptRequest(item._id))} style={smallButtonStyle}>Kabul Et</button>
                                                    <button className="btn btn-ghost" onClick={() => runAction(() => friendsService.removeFriendship(item._id))} style={smallButtonStyle}>Sil</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section style={panelStyle}>
                                <h3 style={titleStyle}>Arkadaş listen</h3>
                                {friends.length === 0 ? (
                                    <div className="empty-state" style={{ padding: 24 }}>
                                        <div className="empty-text">Henüz arkadaş yok.</div>
                                    </div>
                                ) : (
                                    <div style={listStyle}>
                                        {friends.map(item => (
                                            <div key={item._id} style={rowStyle}>
                                                <UserSummary user={item.user} />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary" onClick={() => router.push(`/dm/${item.user._id}`)} style={smallButtonStyle}>Mesaj</button>
                                                    <button className="btn btn-ghost" onClick={() => runAction(() => friendsService.removeFriendship(item._id))} style={smallButtonStyle}>Kaldır</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {outgoing.length > 0 && (
                                <section style={panelStyle}>
                                    <h3 style={titleStyle}>Gönderilen istekler</h3>
                                    <div style={listStyle}>
                                        {outgoing.map(item => (
                                            <div key={item._id} style={rowStyle}>
                                                <UserSummary user={item.hedef} />
                                                <button className="btn btn-ghost" onClick={() => runAction(() => friendsService.removeFriendship(item._id))} style={smallButtonStyle}>İptal Et</button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserSummary({ user }) {
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            <div className="user-avatar" style={{ width: 38, height: 38, flex: '0 0 auto' }}>
                {(user?.username || '?')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
        </div>
    );
}

const panelStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    padding: 20,
};

const titleStyle = {
    color: 'var(--text-primary)',
    fontSize: 16,
    marginBottom: 14,
};

const listStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 14,
};

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    padding: 12,
};

const smallButtonStyle = {
    padding: '8px 12px',
    fontSize: 13,
};
