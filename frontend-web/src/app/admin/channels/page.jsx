'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, channelsService } from '../../../lib/api';
import Sidebar from '../../../shared/Sidebar';

export default function AdminChannelsPage() {
    const router = useRouter();
    const [channels, setChannels] = useState([]);
    const [meta, setMeta] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [configOpen, setConfigOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [configForm, setConfigForm] = useState({
        ad: '',
        aciklama: '',
        tur: 'text',
        kullanici_limiti: 0,
        gerekli_rol: 'user',
        sifreli_mi: false,
        kanal_sifresi: '',
    });

    const roleLabels = {
        user: 'Üye ve üzeri',
        moderator: 'Moderatör ve üzeri',
        admin: 'Sadece admin',
    };

    useEffect(() => { checkAccess(); }, []);
    useEffect(() => { if (currentUser) fetchChannels(); }, [page, currentUser]);

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

    async function fetchChannels() {
        setLoading(true);
        try {
            // We get all channels limit 100 for simplicity as admin
            const res = await channelsService.getChannels({ page, limit: 100 });
            setChannels(res.data);
            setMeta(res.meta || {});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteChannel(channelId) {
        if (!confirm('Bu kanalı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
        try {
            await channelsService.deleteChannel(channelId);
            setSuccess(`Kanal başarıyla silindi.`);
            setTimeout(() => setSuccess(''), 3000);
            fetchChannels();
        } catch (err) {
            setError(err.message);
        }
    }

    function openCreateConfig() {
        setEditingChannel(null);
        setError('');
        setConfigForm({
            ad: '',
            aciklama: '',
            tur: 'text',
            kullanici_limiti: 0,
            gerekli_rol: 'user',
            sifreli_mi: false,
            kanal_sifresi: '',
        });
        setConfigOpen(true);
    }

    function openEditConfig(channel) {
        setEditingChannel(channel);
        setError('');
        setConfigForm({
            ad: channel.ad || '',
            aciklama: channel.aciklama || '',
            tur: channel.tur || 'text',
            kullanici_limiti: channel.kullanici_limiti || 0,
            gerekli_rol: channel.gerekli_rol || 'user',
            sifreli_mi: Boolean(channel.sifreli_mi),
            kanal_sifresi: '',
        });
        setConfigOpen(true);
    }

    function closeConfig() {
        setConfigOpen(false);
        setEditingChannel(null);
        setConfigLoading(false);
    }

    async function handleSaveConfig(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!configForm.ad.trim()) {
            setError('Kanal adı zorunludur.');
            return;
        }

        if (!editingChannel && configForm.sifreli_mi && !configForm.kanal_sifresi.trim()) {
            setError('Kilitli kanal oluşturmak için şifre girmelisiniz.');
            return;
        }

        setConfigLoading(true);
        try {
            const payload = {
                ad: configForm.ad.trim(),
                aciklama: configForm.aciklama.trim(),
                tur: configForm.tur,
                kullanici_limiti: Number(configForm.kullanici_limiti) || 0,
                gerekli_rol: configForm.gerekli_rol,
                sifreli_mi: configForm.sifreli_mi,
            };

            if (!configForm.sifreli_mi) {
                payload.kanal_sifresi = '';
            } else if (configForm.kanal_sifresi.trim()) {
                payload.kanal_sifresi = configForm.kanal_sifresi.trim();
            }

            if (editingChannel) {
                await channelsService.updateChannel(editingChannel._id, payload);
                setSuccess('Kanal konfigürasyonu güncellendi.');
            } else {
                await channelsService.createChannel(payload);
                setSuccess('Kanal oluşturuldu.');
            }

            closeConfig();
            fetchChannels();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setConfigLoading(false);
        }
    }

    const filteredChannels = search
        ? channels.filter(c => c.ad?.toLowerCase().includes(search.toLowerCase()))
        : channels;

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
                        <div className="page-title">📺 Kanal Yönetimi</div>
                        <div className="page-subtitle">Platformdaki tüm kanalları yönetin</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            placeholder="🔍 Kanal ara..."
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
                        <button className="btn btn-primary" onClick={openCreateConfig}>
                            + Yeni Kanal
                        </button>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}
                    {success && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: '#6ee7b7',
                            padding: '12px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            marginBottom: 16,
                        }}>
                            ✅ {success}
                        </div>
                    )}

                    {configOpen && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(3,7,18,0.72)',
                            zIndex: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 24,
                        }}>
                            <form
                                onSubmit={handleSaveConfig}
                                style={{
                                    width: 'min(720px, 100%)',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 16,
                                    padding: 24,
                                    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                                    <div>
                                        <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, margin: 0 }}>
                                            {editingChannel ? 'Kanal Konfigürasyonu' : 'Yeni Kanal Oluştur'}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                                            Kullanıcı limiti, gerekli rol ve kanal kilidini buradan yönetin.
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-ghost" onClick={closeConfig} style={{ height: 36 }}>
                                        Kapat
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14 }}>
                                    <div className="field-group">
                                        <label className="field-label">Kanal adı</label>
                                        <input
                                            className="field-input"
                                            value={configForm.ad}
                                            onChange={e => setConfigForm({ ...configForm, ad: e.target.value })}
                                            placeholder="genel-sohbet"
                                            required
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Tür</label>
                                        <select
                                            className="field-select"
                                            value={configForm.tur}
                                            onChange={e => setConfigForm({ ...configForm, tur: e.target.value })}
                                        >
                                            <option value="text">Metin</option>
                                            <option value="voice">Sesli</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Açıklama</label>
                                    <input
                                        className="field-input"
                                        value={configForm.aciklama}
                                        onChange={e => setConfigForm({ ...configForm, aciklama: e.target.value })}
                                        placeholder="Kanal açıklaması"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="field-group">
                                        <label className="field-label">Kullanıcı limiti</label>
                                        <input
                                            className="field-input"
                                            type="number"
                                            min="0"
                                            value={configForm.kullanici_limiti}
                                            onChange={e => setConfigForm({ ...configForm, kullanici_limiti: e.target.value })}
                                        />
                                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                                            0 sınırsız anlamına gelir.
                                        </div>
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Gerekli rol</label>
                                        <select
                                            className="field-select"
                                            value={configForm.gerekli_rol}
                                            onChange={e => setConfigForm({ ...configForm, gerekli_rol: e.target.value })}
                                        >
                                            <option value="user">Üye ve üzeri</option>
                                            <option value="moderator">Moderatör ve üzeri</option>
                                            <option value="admin">Sadece admin</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 12,
                                    padding: 14,
                                    marginBottom: 18,
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={configForm.sifreli_mi}
                                            onChange={e => setConfigForm({ ...configForm, sifreli_mi: e.target.checked, kanal_sifresi: e.target.checked ? configForm.kanal_sifresi : '' })}
                                        />
                                        Kanalı şifreyle kilitle
                                    </label>
                                    {configForm.sifreli_mi && (
                                        <div className="field-group" style={{ marginTop: 14, marginBottom: 0 }}>
                                            <label className="field-label">
                                                {editingChannel ? 'Yeni şifre (boş bırakırsanız değişmez)' : 'Kanal şifresi'}
                                            </label>
                                            <input
                                                className="field-input"
                                                type="password"
                                                value={configForm.kanal_sifresi}
                                                onChange={e => setConfigForm({ ...configForm, kanal_sifresi: e.target.value })}
                                                placeholder={editingChannel ? 'Mevcut şifreyi koru' : 'Şifre girin'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button type="button" className="btn btn-ghost" onClick={closeConfig}>
                                        Vazgeç
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={configLoading}>
                                        {configLoading ? 'Kaydediliyor...' : (editingChannel ? 'Kaydet' : 'Oluştur')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                        {[
                            { label: 'Toplam Kanal', value: channels.length },
                            { label: 'Metin Kanalları', value: channels.filter(c => c.tur === 'text').length },
                            { label: 'Ses Kanalları', value: channels.filter(c => c.tur === 'voice').length },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
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
                        ) : filteredChannels.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📺</div>
                                <div className="empty-text">Kanal bulunamadı.</div>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Kanal Adı</th>
                                        <th>Tür</th>
                                        <th>Limit</th>
                                        <th>Gerekli Rol</th>
                                        <th>Kilit</th>
                                        <th>Açıklama</th>
                                        <th>Oluşturan</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredChannels.map(channel => (
                                        <tr key={channel._id}>
                                            <td style={{ fontWeight: 600 }}>#{channel.ad}</td>
                                            <td>
                                                <span className={`badge ${channel.tur === 'voice' ? 'badge-blue' : 'badge-purple'}`}>
                                                    {channel.tur === 'voice' ? '🔊 Sesli' : '💬 Metin'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {channel.kullanici_limiti > 0 ? channel.kullanici_limiti : 'Sınırsız'}
                                            </td>
                                            <td>
                                                <span className="badge badge-gray">
                                                    {roleLabels[channel.gerekli_rol || 'user']}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${channel.sifreli_mi ? 'badge-yellow' : 'badge-green'}`}>
                                                    {channel.sifreli_mi ? 'Kilitli' : 'Açık'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{channel.aciklama || '-'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{channel.olusturan?.username || '?'}</td>
                                            <td style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: '5px 10px', fontSize: 12 }}
                                                    onClick={() => openEditConfig(channel)}
                                                >
                                                    Ayarla
                                                </button>
                                                <button 
                                                    className="btn btn-danger"
                                                    style={{ padding: '5px 10px', fontSize: 12 }}
                                                    onClick={() => handleDeleteChannel(channel._id)}
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
