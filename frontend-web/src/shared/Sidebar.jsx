'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService, dmService, usersService } from '@/lib/api';

const statusConfig = {
    online: { label: 'Çevrimiçi', dot: '#22c55e' },
    idle: { label: 'Boşta', dot: '#f59e0b' },
    dnd: { label: 'Rahatsız etmeyin', dot: '#ef4444' },
    invisible: { label: 'Görünmez', dot: '#64748b' },
};

const roleLabelMap = {
    admin: '👑 Admin',
    moderator: '🛡️ Moderatör',
    user: '👤 Kullanıcı',
};

function Avatar({ user, className = 'user-avatar', style = {} }) {
    const url = user?.profil_fotografi_url;
    return (
        <div
            className={className}
            style={url ? { ...style, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : style}
        >
            {!url && (user?.username || '?')[0].toUpperCase()}
        </div>
    );
}

export default function Sidebar({ currentUser }) {
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState({
        unreadDmCount: 0,
        incomingFriendRequestCount: 0,
        total: 0,
    });
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [localUser, setLocalUser] = useState(currentUser);
    const [photoUrl, setPhotoUrl] = useState('');

    const displayUser = localUser || currentUser;
    const isAdmin = displayUser?.role === 'admin';
    const isMod = displayUser?.role === 'moderator';
    const roleLabel = roleLabelMap[displayUser?.role] || roleLabelMap.user;
    const currentStatus = statusConfig[displayUser?.durum_modu || 'online'] || statusConfig.online;

    const navItems = [
        { icon: '🏠', label: 'Ana Sayfa', href: '/dashboard' },
        { icon: '💬', label: 'Metin Kanalları', href: '/channels' },
        { icon: '👥', label: 'Arkadaşlar', href: '/friends', count: notifications.incomingFriendRequestCount },
        { icon: '✉️', label: 'DM', href: '/dm', count: notifications.unreadDmCount },
    ];

    if (isAdmin || isMod) {
        navItems.push({ icon: '👑', label: 'Yönetim Paneli', href: '/admin' });
        navItems.push({ icon: '👥', label: 'Kullanıcı Yönetimi', href: '/admin/users' });
        navItems.push({ icon: '📺', label: 'Kanal Yönetimi', href: '/admin/channels' });
    }

    useEffect(() => {
        setLocalUser(currentUser);
        setPhotoUrl(currentUser?.profil_fotografi_url || '');
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        let mounted = true;

        async function fetchNotifications() {
            try {
                const res = await dmService.getNotifications();
                if (mounted) {
                    setNotifications(res.data || {
                        unreadDmCount: 0,
                        incomingFriendRequestCount: 0,
                        total: 0,
                    });
                }
            } catch {
                if (mounted) {
                    setNotifications({
                        unreadDmCount: 0,
                        incomingFriendRequestCount: 0,
                        total: 0,
                    });
                }
            }
        }

        fetchNotifications();
        authService.touch().catch(() => {});
        const interval = setInterval(fetchNotifications, 15000);
        const heartbeat = setInterval(() => {
            authService.touch().catch(() => {});
        }, 30000);

        return () => {
            mounted = false;
            clearInterval(interval);
            clearInterval(heartbeat);
        };
    }, [currentUser?._id, currentUser?.userId]);

    async function handleStatusModeChange(durum_modu) {
        try {
            const res = await usersService.updateMyProfile({ durum_modu });
            setLocalUser(res.data);
        } catch {
            setLocalUser(user => ({ ...(user || currentUser), durum_modu }));
        }
    }

    async function handlePhotoSave() {
        try {
            const res = await usersService.updateMyProfile({ profil_fotografi_url: photoUrl });
            setLocalUser(res.data);
        } catch {
            setLocalUser(user => ({ ...(user || currentUser), profil_fotografi_url: photoUrl }));
        }
    }

    function handleLogout() {
        authService.logout();
        router.push('/auth/login');
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">💬</div>
                    <span className="sidebar-logo-text">Talk2People</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button className="notification-center-button" onClick={() => setNotificationOpen(value => !value)}>
                    <span>Bildirimler</span>
                    {notifications.total > 0 && <span className="sidebar-notification-badge">{notifications.total > 9 ? '9+' : notifications.total}</span>}
                </button>

                {notificationOpen && (
                    <div className="notification-center-panel">
                        <div className="notification-center-title">Bildirim Merkezi</div>
                        {notifications.total === 0 ? (
                            <div className="notification-center-empty">Yeni bildirim yok.</div>
                        ) : (
                            <>
                                {notifications.unreadDmCount > 0 && <button onClick={() => router.push('/dm')}>✉️ {notifications.unreadDmCount} okunmamış DM</button>}
                                {notifications.incomingFriendRequestCount > 0 && <button onClick={() => router.push('/friends')}>👥 {notifications.incomingFriendRequestCount} arkadaşlık isteği</button>}
                            </>
                        )}
                    </div>
                )}

                <div className="sidebar-section-title">Menü</div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + '/') && item.href !== '/dashboard' ? 'active' : ''}`}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        <span className="sidebar-item-label">{item.label}</span>
                        {item.count > 0 && (
                            <span className="sidebar-notification-badge" title={`${item.count} yeni bildirim`}>
                                {item.count > 9 ? '9+' : item.count}
                            </span>
                        )}
                    </Link>
                ))}

                <div className="sidebar-section-title" style={{ marginTop: 16 }}>Durum</div>
                <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="status-dot" style={{ background: currentStatus.dot }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{currentStatus.label}</span>
                </div>
                <select
                    className="field-select sidebar-status-select"
                    value={displayUser?.durum_modu || 'online'}
                    onChange={event => handleStatusModeChange(event.target.value)}
                >
                    <option value="online">Çevrimiçi</option>
                    <option value="idle">Boşta</option>
                    <option value="dnd">Rahatsız etmeyin</option>
                    <option value="invisible">Görünmez</option>
                </select>
                <div className="sidebar-photo-editor">
                    <input
                        value={photoUrl}
                        onChange={event => setPhotoUrl(event.target.value)}
                        placeholder="Profil foto URL"
                    />
                    <button type="button" onClick={handlePhotoSave}>Kaydet</button>
                </div>
            </nav>

            <div className="sidebar-footer">
                {displayUser && (
                    <div className="user-card">
                        <Avatar user={displayUser} />
                        <div className="user-info">
                            <div className="user-name">{displayUser.username}</div>
                            <div className="user-role">{roleLabel}</div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Çıkış Yap">
                            ⏻
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
