import "./globals.css";

export const metadata = {
    title: "Talk2People — Real-time Communication",
    description: "Modern real-time communication platform with text and voice channels",
};

export default function RootLayout({ children }) {
    return (
        <html lang="tr">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
