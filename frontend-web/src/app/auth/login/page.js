"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authService.login(formData.email, formData.password);
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

                <h1 className="auth-title">Tekrar Hoş Geldin</h1>
                <p className="auth-sub">Hesabına giriş yap ve topluluğa katıl</p>

                {error && <div className="auth-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
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
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
                    </button>
                </form>

                <p className="auth-footer">
                    Hesabın yok mu?{" "}
                    <Link href="/auth/register" className="auth-link">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
