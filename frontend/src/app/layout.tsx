import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import PwaInstall from '../components/PwaInstall';

export const metadata: Metadata = {
  title: 'Mess Expense Tracker',
  description: 'Personal hostel mess billing tracker and exception manager',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MessTracker'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">{children}</main>
        <PwaInstall />
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
          Mess Expense Tracker MVP &copy; 2026. Built with Next.js, Express & PostgreSQL.
        </footer>
      </body>
    </html>
  );
}
