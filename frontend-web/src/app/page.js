export default function Home() {
    const redirectScript = `
        try {
            var token = window.localStorage && window.localStorage.getItem('token');
            window.location.replace(token ? '/dashboard' : '/auth/login');
        } catch (error) {
            window.location.replace('/auth/login');
        }
    `;

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#070b14',
            color: '#94a3b8',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, marginBottom: 16 }}>Yönlendiriliyor...</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <a href="/auth/login" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 13 }}>
                        Giriş sayfasına git
                    </a>
                    <a href="/dashboard" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 13 }}>
                        Panele git
                    </a>
                </div>
            </div>
        </main>
    );
}
