'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, channelsService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function DashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({ channels: 0, textChannels: 0, voiceChannels: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { checkAuth(); }, []);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
            // Fetch quick stats
            try {
                const ch = await channelsService.getChannels({ limit: 100 });
                const all = ch.data || [];
                setStats({
                    channels: ch.meta?.total || all.length,
                    textChannels: all.filter(c => c.tur === 'text').length,
                    voiceChannels: all.filter(c => c.tur === 'voice').length,
                });
            } catch { }
        } catch {
            router.push('/auth/login');
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

    const roleLabel = {
        admin: '👑 Admin',
        moderator: '🛡️ Moderatör',
        user: '👤 Kullanıcı',
    }[currentUser?.role] || '👤 Kullanıcı';

    const quickActions = [
        {
            icon: '💬',
            title: 'Metin Kanalları',
            desc: 'Toplulukla metin üzerinden iletişim kur',
            badge: `${stats.textChannels} kanal`,
            badgeClass: 'badge-purple',
            href: '/channels',
            gradient: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(139,92,246,0.05) 100%)',
            borderColor: 'rgba(124,58,237,0.3)',
        },
        {
            icon: '🔊',
            title: 'Sesli Kanallar',
            desc: 'Gerçek zamanlı sesli iletişime katıl',
            badge: `${stats.voiceChannels} kanal`,
            badgeClass: 'badge-blue',
            href: '/channels',
            gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 100%)',
            borderColor: 'rgba(6,182,212,0.3)',
        },
        ...(currentUser?.role === 'admin' || currentUser?.role === 'moderator' ? [{
            icon: '⚙️',
            title: 'Yönetim Paneli',
            desc: 'Kullanıcı ve yetki yönetimini yönet',
            badge: 'Admin',
            badgeClass: 'badge-yellow',
            href: '/admin/users',
            gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
            borderColor: 'rgba(245,158,11,0.3)',
        }] : []),
    ];

    return (
        <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <div className="main-content">
                {/* Hero Header */}
                <div style={{
                    padding: '40px 40px 32px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Merhaba,{' '}
                            <span style={{
                                background: 'var(--gradient-brand)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {currentUser?.username}!
                            </span>{' '}
                            👋
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        {roleLabel} · Talk2People'a hoş geldin. Ne yapmak istersin?
                    </p>
                </div>

                <div className="page-body">
                    {/* Stats */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="stat-card">
                            <div className="stat-value">{stats.channels}</div>
                            <div className="stat-label">Toplam Kanal</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.textChannels}</div>
                            <div className="stat-label">Metin Kanalı</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.voiceChannels}</div>
                            <div className="stat-label">Sesli Kanal</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                        Hızlı Erişim
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => router.push(action.href)}
                                style={{
                                    background: action.gradient,
                                    border: `1px solid ${action.borderColor}`,
                                    borderRadius: 20,
                                    padding: '24px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: 'inherit',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ fontSize: 32 }}>{action.icon}</div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                        {action.title}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {action.desc}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <span className={`badge ${action.badgeClass}`}>{action.badge}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Git →</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Info bar */}
                    <div style={{
                        marginTop: 28,
                        padding: '14px 20px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <span className="status-dot" />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Backend: localhost:3000 · Web: localhost:3002 · WebSocket: Aktif
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
