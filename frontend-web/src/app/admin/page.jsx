'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, adminService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({ totalUsers: 0, totalChannels: 0, totalMessages: 0, activeVoiceSessions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { checkAccess(); }, []);

    async function checkAccess() {
        try {
            const res = await authService.getMe();
            const user = res.data.user;
            if (user.role !== 'admin' && user.role !== 'moderator') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(user);
            fetchStats();
        } catch {
            router.push('/auth/login');
        }
    }

    async function fetchStats() {
        try {
            const res = await adminService.getStats();
            setStats(res.data);
        } catch (err) {
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

    const statCards = [
        { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: '👥', color: 'var(--brand-primary)' },
        { label: 'Toplam Kanal', value: stats.totalChannels, icon: '📺', color: 'var(--brand-accent)' },
        { label: 'Gönderilen Mesaj', value: stats.totalMessages, icon: '💬', color: 'var(--brand-success)' },
        { label: 'Aktif Sesli Sohbet', value: stats.activeVoiceSessions, icon: '🎙️', color: 'var(--brand-warning)' },
    ];

    return (
        <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <div className="main-content">
                <div className="page-header">
                    <div>
                        <div className="page-title">👑 Yönetici Paneli</div>
                        <div className="page-subtitle">Sistemin genel durumunu ve istatistiklerini buradan takip edin.</div>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}

                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                        {statCards.map((s, i) => (
                            <div key={i} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ fontSize: 40, position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>
                                    {s.icon}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                                        color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20
                                    }}>
                                        {s.icon}
                                    </div>
                                    <div className="stat-label" style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
                                </div>
                                <div className="stat-value" style={{ fontSize: 36, color: 'var(--text-primary)', WebkitTextFillColor: 'initial', background: 'none' }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 30, marginBottom: 16 }}>Hızlı İşlemler</h2>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button className="btn btn-primary" onClick={() => router.push('/admin/users')}>
                            👥 Kullanıcıları Yönet
                        </button>
                        <button className="btn btn-ghost" onClick={() => router.push('/admin/channels')} style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', borderColor: 'rgba(6,182,212,0.2)' }}>
                            📺 Kanalları Yönet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
