'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, channelsService } from '../../lib/api';
import Sidebar from '../../shared/Sidebar';

export default function ChannelsPage() {
    const router = useRouter();
    const [channels, setChannels] = useState([]);
    const [meta, setMeta] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ ad: '', aciklama: '', tur: 'text' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => { checkAuth(); }, []);
    useEffect(() => { if (currentUser) fetchChannels(); }, [page, currentUser, filter]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
        } catch {
            router.push('/auth/login');
        }
    }

    async function fetchChannels() {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (filter !== 'all') params.tur = filter;
            const res = await channelsService.getChannels(params);
            setChannels(res.data);
            setMeta(res.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await channelsService.createChannel(formData);
            setFormData({ ad: '', aciklama: '', tur: 'text' });
            setShowForm(false);
            fetchChannels();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDelete(id, e) {
        e.stopPropagation();
        if (!confirm('Bu kanalı silmek istediğinize emin misiniz?')) return;
        try {
            await channelsService.deleteChannel(id);
            fetchChannels();
        } catch (err) {
            setError(err.message);
        }
    }

    const isAdmin = currentUser?.role === 'admin';
    const isMod = currentUser?.role === 'moderator';
    const canManage = isAdmin || isMod;

    const filteredChannels = filter === 'all' ? channels : channels.filter(c => c.tur === filter);

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
                {/* Header */}
                <div className="page-header">
                    <div>
                        <div className="page-title">💬 Kanallar</div>
                        <div className="page-subtitle">Toplam {meta.total || channels.length} kanal</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Filter tabs */}
                        <div style={{
                            display: 'flex',
                            background: 'var(--bg-elevated)',
                            borderRadius: 10,
                            padding: 4,
                            border: '1px solid var(--border-subtle)',
                        }}>
                            {[['all', '🌐 Tümü'], ['text', '💬 Metin'], ['voice', '🔊 Sesli']].map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => { setFilter(val); setPage(1); }}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 7,
                                        border: 'none',
                                        background: filter === val ? 'var(--brand-primary)' : 'transparent',
                                        color: filter === val ? '#fff' : 'var(--text-secondary)',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {canManage && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? '✕ Kapat' : '+ Yeni Kanal'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert-error">⚠️ {error}</div>}

                    {/* Create Form */}
                    {showForm && (
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--brand-primary)',
                            borderRadius: 16,
                            padding: 24,
                            marginBottom: 24,
                        }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                                ✨ Yeni Kanal Oluştur
                            </h3>
                            {formError && <div className="alert-error">{formError}</div>}
                            <form onSubmit={handleCreate}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div className="field-group" style={{ marginBottom: 0 }}>
                                        <label className="field-label">Kanal Adı</label>
                                        <input
                                            type="text"
                                            className="field-input"
                                            placeholder="genel-sohbet"
                                            value={formData.ad}
                                            onChange={e => setFormData({ ...formData, ad: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="field-group" style={{ marginBottom: 0 }}>
                                        <label className="field-label">Tür</label>
                                        <select
                                            className="field-select"
                                            value={formData.tur}
                                            onChange={e => setFormData({ ...formData, tur: e.target.value })}
                                        >
                                            <option value="text">💬 Metin Kanalı</option>
                                            <option value="voice">🔊 Sesli Kanal</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Açıklama (opsiyonel)</label>
                                    <input
                                        type="text"
                                        className="field-input"
                                        placeholder="Kanal açıklaması..."
                                        value={formData.aciklama}
                                        onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                                    />
                                </div>
                                <button type="submit" disabled={formLoading} className="btn btn-primary">
                                    {formLoading ? 'Oluşturuluyor...' : '✅ Oluştur'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Channel Grid */}
                    {loading ? (
                        <div className="loading-screen" style={{ height: 200 }}>
                            <div className="spinner" />
                        </div>
                    ) : filteredChannels.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <div className="empty-text">Henüz kanal bulunmuyor.</div>
                        </div>
                    ) : (
                        <div className="channel-grid">
                            {filteredChannels.map(ch => (
                                <div
                                    key={ch._id}
                                    className="channel-card"
                                    onClick={() => router.push(ch.tur === 'voice' ? `/channels/${ch._id}/voice` : `/channels/${ch._id}`)}
                                >
                                    <div className={`channel-card-icon ${ch.tur === 'voice' ? 'voice' : ''}`}>
                                        {ch.tur === 'voice' ? '🔊' : '💬'}
                                    </div>
                                    <div className="channel-card-name">{ch.ad}</div>
                                    {ch.aciklama && (
                                        <div className="channel-card-desc">{ch.aciklama}</div>
                                    )}
                                    <div className="channel-card-footer">
                                        <span className={`badge ${ch.tur === 'voice' ? 'badge-blue' : 'badge-purple'}`}>
                                            {ch.tur === 'voice' ? 'Sesli' : 'Metin'}
                                        </span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(ch.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={e => handleDelete(ch._id, e)}
                                            className="btn btn-danger"
                                            style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', fontSize: 12, borderRadius: 8 }}
                                        >
                                            Sil
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                ← Önceki
                            </button>
                            <span className="page-info">Sayfa {meta.page} / {meta.totalPages}</span>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page >= meta.totalPages}
                            >
                                Sonraki →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
