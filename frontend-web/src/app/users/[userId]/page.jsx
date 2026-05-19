'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService, usersService } from '../../../lib/api';
import Sidebar from '../../../shared/Sidebar';

const roleConfig = {
    admin: { label: '👑 Admin', badgeClass: 'badge-red' },
    moderator: { label: '🛡️ Moderatör', badgeClass: 'badge-yellow' },
    user: { label: '👤 Kullanıcı', badgeClass: 'badge-gray' },
};

const extraRoleConfig = {
    vip: 'VIP',
    support: 'Destek',
    founder: 'Kurucu',
    tester: 'Test',
};

function Avatar({ user, className }) {
    const url = user?.profil_fotografi_url;
    return (
        <div className={className} style={url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {!url && (user?.username || '?')[0].toUpperCase()}
        </div>
    );
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isOnline(user) {
    if (user?.aktif_mi === false) return false;
    if (typeof user?.cevrimici_mi === 'boolean') return user.cevrimici_mi;
    if (!user?.son_cevrimici_tarihi) return false;

    return Date.now() - new Date(user.son_cevrimici_tarihi).getTime() < 60000;
}

function getPresenceLabel(user) {
    if (user?.aktif_mi === false) return 'Pasif';
    return isOnline(user) ? 'Çevrimiçi' : 'Çevrimdışı';
}

export default function UserProfilePage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId;
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { loadProfile(); }, [userId]);

    async function loadProfile() {
        setLoading(true);
        try {
            const me = await authService.getMe();
            const user = me.data.user;
            if (user.role !== 'admin' && user.role !== 'moderator') {
                router.push('/dashboard');
                return;
            }

            setCurrentUser(user);
            const res = await usersService.getUserById(userId);
            setProfile(res.data);
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

    const rc = roleConfig[profile?.role] || roleConfig.user;

    return (
        <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <div className="main-content">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-ghost" onClick={() => router.push('/admin/users')} style={{ padding: '8px 14px', fontSize: 13 }}>
                            ← Kullanıcılar
                        </button>
                        <div>
                            <div className="page-title">👤 Kullanıcı Profili</div>
                            <div className="page-subtitle">{profile?.username || 'Profil detayı'}</div>
                        </div>
                    </div>
                    {profile && <span className={`badge ${rc.badgeClass}`}>{rc.label}</span>}
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {profile && (
                        <div className="profile-detail-layout">
                            <section className="profile-hero-panel">
                                <Avatar user={profile} className="profile-detail-avatar" />
                                <div>
                                    <h1>{profile.username}</h1>
                                    <p>{profile.email}</p>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                        <span className={`badge ${rc.badgeClass}`}>{rc.label}</span>
                                        <span className={`badge ${profile.aktif_mi === false ? 'badge-red' : isOnline(profile) ? 'badge-green' : 'badge-gray'}`}>
                                            {getPresenceLabel(profile)}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="profile-detail-grid">
                                <div className="profile-detail-item">
                                    <span>Kullanıcı adı</span>
                                    <strong>{profile.username || '-'}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>E-posta</span>
                                    <strong>{profile.email || '-'}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Rol</span>
                                    <strong>{rc.label}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Ek roller</span>
                                    <strong>{(profile.extra_roles || []).map(role => extraRoleConfig[role] || role).join(', ') || '-'}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Durum</span>
                                    <strong>{getPresenceLabel(profile)}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Arkadaş sayısı</span>
                                    <strong>{profile.friendCount ?? 0}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Hesap oluşturma tarihi</span>
                                    <strong>{formatDateTime(profile.olusturulma_tarihi)}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Son çevrimiçi</span>
                                    <strong>{formatDateTime(profile.son_cevrimici_tarihi)}</strong>
                                </div>
                                <div className="profile-detail-item">
                                    <span>Son güncelleme</span>
                                    <strong>{formatDateTime(profile.degistirilme_tarihi)}</strong>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
