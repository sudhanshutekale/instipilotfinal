import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSessionUser } from '@/lib/rbac/auth';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'InstiPilot — Institute Management & Operations ERP',
  description: 'Enterprise operations platform for academy leaders, faculty, counselors, and students.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090D16',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <AppShell currentUser={user}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
