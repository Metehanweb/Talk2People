'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, usersService } from '../../../lib/api';
import Sidebar from '../../../shared/Sidebar';

const roleConfig = {
    admin: { label: '👑 Admin', badgeClass: 'badge-red' },
    moderator: { label: '🛡️ Moderatör', badgeClass: 'badge-yellow' },
    user: { label: '👤 Kullanıcı', badgeClass: 'badge-gray' },
};

function formatDate(value, options = {}) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('tr-TR', options);
}

function isOnline(user) {
    if (user.aktif_mi === false) return false;
    if (typeof user.cevrimici_mi === 'boolean') return user.cevrimici_mi;
    if (!user.son_cevrimici_tarihi) return false;

    return Date.now() - new Date(user.son_cevrimici_tarihi).getTime() < 60000;
}

function getStatusBadge(user) {
    if (user.aktif_mi === false) {
        return <span className="badge badge-red">❌ Pasif</span>;
    }

    return isOnline(user)
        ? <span className="badge badge-green">🟢 Çevrimiçi</span>
        : <span className="badge badge-gray">⚫ Çevrimdışı</span>;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => { checkAccess(); }, []);
    useEffect(() => {
        if (!currentUser) return;

        fetchUsers();
        const interval = setInterval(() => fetchUsers({ silent: true }), 15000);

        return () => clearInterval(interval);
    }, [page, currentUser]);

    async function checkAccess() {
        try {
            const res = await authService.getMe();
            const user = res.data.user;
            if (user.role !== 'admin' && user.role !== 'moderator') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(user);
        } catch {
            router.push('/auth/login');
        }
    }

    async function fetchUsers(options = {}) {
        if (!options.silent) setLoading(true);
        try {
            await authService.touch().catch(() => {});
            const res = await usersService.getUsers({ page, limit: 10 });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(userId, newRole) {
        try {
            await usersService.updateUserRole(userId, newRole);
            setSuccess('Rol başarıyla güncellendi!');
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleStatusChange(userId, newStatus) {
        try {
            await usersService.updateUserStatus(userId, newStatus);
            setSuccess('Kullanıcı durumu güncellendi!');
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    }

    const filteredUsers = search
        ? users.filter(user => user.username?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase()))
        : users;

    if (loading && !currentUser) {
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
                        <div className="page-title">⚙️ Kullanıcı Yönetimi</div>
                        <div className="page-subtitle">Toplam {meta.total || 0} kayıtlı kullanıcı</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            placeholder="🔍 Kullanıcı ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                padding: '9px 14px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 10,
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: 'inherit',
                                width: 220,
                            }}
                        />
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {success && <div className="alert-success">✅ {success}</div>}

                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                        {[
                            { label: 'Toplam Kullanıcı', value: meta.total || 0 },
                            { label: 'Bu Sayfada', value: users.length },
                            { label: 'Admin / Mod', value: users.filter(user => user.role !== 'user').length },
                        ].map(item => (
                            <div key={item.label} className="stat-card">
                                <div className="stat-value">{item.value}</div>
                                <div className="stat-label">{item.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}>
                        {loading ? (
                            <div className="loading-screen" style={{ height: 200 }}>
                                <div className="spinner" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👥</div>
                                <div className="empty-text">Kullanıcı bulunamadı.</div>
                            </div>
                        ) : (
                            <table className="data-table users-table">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>Durum</th>
                                        <th>Kayıt Tarihi</th>
                                        {currentUser?.role === 'admin' && <th>İşlem</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => {
                                        const rc = roleConfig[user.role] || roleConfig.user;
                                        return (
                                            <tr key={user._id} className="clickable-user-row" onClick={() => setSelectedUser(user)}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                                                            {(user.username || '?')[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{user.username || user.ad}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                                                <td><span className={`badge ${rc.badgeClass}`}>{rc.label}</span></td>
                                                <td>{getStatusBadge(user)}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    {formatDate(user.olusturulma_tarihi)}
                                                </td>
                                                {currentUser?.role === 'admin' && (
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8 }} onClick={event => event.stopPropagation()}>
                                                            <select
                                                                value={user.role}
                                                                onChange={event => handleRoleChange(user._id, event.target.value)}
                                                                className="field-select"
                                                                style={{ width: 'auto', padding: '5px 10px' }}
                                                                disabled={user._id === currentUser._id}
                                                            >
                                                                <option value="user">👤 User</option>
                                                                <option value="moderator">🛡️ Moderator</option>
                                                                <option value="admin">👑 Admin</option>
                                                            </select>
                                                            <button
                                                                className={`btn ${user.aktif_mi !== false ? 'btn-danger' : 'btn-success'}`}
                                                                style={{ padding: '5px 10px', fontSize: 12 }}
                                                                disabled={user._id === currentUser._id}
                                                                onClick={() => handleStatusChange(user._id, user.aktif_mi === false)}
                                                            >
                                                                {user.aktif_mi !== false ? 'Banla' : 'Banı Kaldır'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {meta.totalPages > 1 && (
                        <div className="pagination">
                            <button className="btn btn-ghost" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1}>
                                ← Önceki
                            </button>
                            <span className="page-info">Sayfa {meta.page} / {meta.totalPages}</span>
                            <button className="btn btn-ghost" onClick={() => setPage(value => Math.min(meta.totalPages, value + 1))} disabled={page >= meta.totalPages}>
                                Sonraki →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedUser && (
                <div className="profile-modal-backdrop" onClick={() => setSelectedUser(null)}>
                    <div className="profile-modal" onClick={event => event.stopPropagation()}>
                        <button className="profile-modal-close" onClick={() => setSelectedUser(null)} title="Kapat">×</button>
                        <div className="profile-modal-header">
                            <div className="profile-modal-avatar">{(selectedUser.username || '?')[0].toUpperCase()}</div>
                            <div>
                                <div className="profile-modal-name">{selectedUser.username || selectedUser.ad}</div>
                                <div className="profile-modal-email">{selectedUser.email}</div>
                            </div>
                        </div>
                        <div className="profile-mini-grid">
                            <div>
                                <span>Rol</span>
                                <strong>{(roleConfig[selectedUser.role] || roleConfig.user).label}</strong>
                            </div>
                            <div>
                                <span>Durum</span>
                                <strong>{selectedUser.aktif_mi === false ? 'Pasif' : isOnline(selectedUser) ? 'Çevrimiçi' : 'Çevrimdışı'}</strong>
                            </div>
                            <div>
                                <span>Kayıt</span>
                                <strong>{formatDate(selectedUser.olusturulma_tarihi)}</strong>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => router.push(`/users/${selectedUser._id}`)}>
                            Tam Profil
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
