'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService, authService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({ totalUsers: 0, totalChannels: 0, totalMessages: 0, activeVoiceSessions: 0 });
    const [reports, setReports] = useState([]);
    const [logs, setLogs] = useState([]);
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
            await fetchDashboard();
        } catch {
            router.push('/auth/login');
        }
    }

    async function fetchDashboard() {
        try {
            const [statsRes, reportsRes, logsRes] = await Promise.all([
                adminService.getStats(),
                adminService.getReports({ limit: 5 }),
                adminService.getLogs({ limit: 8 }),
            ]);
            setStats(statsRes.data);
            setReports(reportsRes.data?.reports || []);
            setLogs(logsRes.data?.logs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleReportStatus(id, durum) {
        try {
            await adminService.updateReport(id, { durum });
            const reportsRes = await adminService.getReports({ limit: 5 });
            setReports(reportsRes.data?.reports || []);
        } catch (err) {
            setError(err.message);
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
                        <div className="page-subtitle">Sistemin genel durumunu, raporları ve işlem kayıtlarını takip edin.</div>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}

                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                        {statCards.map((s) => (
                            <div key={s.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ fontSize: 40, position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>
                                    {s.icon}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                                        color: s.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
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

                    <div className="admin-two-column">
                        <section className="admin-panel-section">
                            <h2>Raporlar</h2>
                            {reports.length === 0 ? (
                                <div className="empty-text">Açık rapor yok.</div>
                            ) : reports.map(report => (
                                <div key={report._id} className="admin-list-item">
                                    <div>
                                        <strong>{report.hedef_tipi}</strong>
                                        <p>{report.neden}</p>
                                        <span>{report.raporlayan?.username || 'Bilinmeyen'} · {report.durum}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button className="message-mini-action" onClick={() => handleReportStatus(report._id, 'reviewing')}>İncele</button>
                                        <button className="message-mini-action" onClick={() => handleReportStatus(report._id, 'resolved')}>Çözüldü</button>
                                        <button className="message-mini-action danger" onClick={() => handleReportStatus(report._id, 'dismissed')}>Kapat</button>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="admin-panel-section">
                            <h2>Admin Logları</h2>
                            {logs.length === 0 ? (
                                <div className="empty-text">Henüz log yok.</div>
                            ) : logs.map(log => (
                                <div key={log._id} className="admin-list-item compact">
                                    <div>
                                        <strong>{log.aksiyon}</strong>
                                        <p>{log.aktor?.username || 'Sistem'} · {new Date(log.olusturulma_tarihi).toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
