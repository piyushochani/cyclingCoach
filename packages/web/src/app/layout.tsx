import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cycling Coach Web",
  description: "Web interface for EndurAgent Cycling Coach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '1.2rem' }}>EndurAgent</strong>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
