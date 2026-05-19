"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authService.register(formData.email, formData.password, formData.username);
            router.push("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="auth-bg">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💬</div>
                    <span className="auth-logo-text">Talk2People</span>
                </div>

                <h1 className="auth-title">Maceraya Katıl</h1>
                <p className="auth-sub">Ücretsiz hesap oluştur, hemen başla</p>

                {error && <div className="auth-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">Kullanıcı Adı</label>
                        <input
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className="auth-input"
                            placeholder="CoolUser99"
                        />
                    </div>
                    <div className="auth-form-group">
                        <label className="auth-label">E-posta</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="auth-input"
                            placeholder="ornek@mail.com"
                        />
                    </div>
                    <div className="auth-form-group">
                        <label className="auth-label">Şifre</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="auth-input"
                            placeholder="En az 6 karakter"
                            minLength={6}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? "Kaydediliyor..." : "Hesap Oluştur →"}
                    </button>
                </form>

                <p className="auth-footer">
                    Zaten hesabın var mı?{" "}
                    <Link href="/auth/login" className="auth-link">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
