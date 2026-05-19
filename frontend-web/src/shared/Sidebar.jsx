'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService, dmService } from '@/lib/api';

export default function Sidebar({ currentUser }) {
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState({
        unreadDmCount: 0,
        incomingFriendRequestCount: 0,
        total: 0,
    });

    const isAdmin = currentUser?.role === 'admin';
    const isMod = currentUser?.role === 'moderator';

    const roleLabel = {
        admin: '👑 Admin',
        moderator: '🛡️ Moderatör',
        user: '👤 Kullanıcı',
    }[currentUser?.role] || '👤 Kullanıcı';

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
                    <span className="status-dot" />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sunucu Çevrimiçi</span>
                </div>
            </nav>

            <div className="sidebar-footer">
                {currentUser && (
                    <div className="user-card">
                        <div className="user-avatar">
                            {(currentUser.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{currentUser.username}</div>
                            <div className="user-role">{roleLabel}</div>
                        </div>
                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                            title="Çıkış Yap"
                        >
                            ⏻
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
