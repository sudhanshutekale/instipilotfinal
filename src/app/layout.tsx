import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSessionUser } from '@/lib/rbac/auth';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'InstiPilot — Institute Operations & Student Management System',
  description: 'Clean executive operations platform for training academy leaders, faculty, accounts, and students.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFFFFF',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <AppShell currentUser={user}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
