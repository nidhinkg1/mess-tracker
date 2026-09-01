'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchCurrentUser, logoutUser } from '../services/api';
import { Utensils, CreditCard, CalendarX, LayoutDashboard, LogOut, User, KeyRound, Menu, X, Download } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/share/')) {
      setCurrentUser(null);
    } else {
      fetchCurrentUser().then((user) => {
        if (isMounted) {
          setCurrentUser(user);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const triggerInstall = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
    }
  };

  // Hide complete navbar on public share statement pages, login, and register
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/share/')) {
    return null;
  }

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo */}
        <Link
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md shadow-teal-200">
            <Utensils className="h-5 w-5" />
          </div>
          <span>MessTracker</span>
        </Link>

        {/* Desktop Navigation Links */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/payments"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                pathname === '/payments'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Advance Payments</span>
            </Link>

            <Link
              href="/meal-exceptions"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                pathname === '/meal-exceptions'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CalendarX className="h-4 w-4" />
              <span>Meal Exceptions</span>
            </Link>
          </nav>
        )}

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={triggerInstall}
            className="flex items-center gap-1.5 text-xs text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition font-bold shadow-sm active:scale-95"
            title="Install Application"
          >
            <Download className="h-3.5 w-3.5 text-teal-700" />
            <span>Install App</span>
          </button>

          {currentUser ? (
            <>
              <Link
                href="/reset-password"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-slate-200 transition font-medium"
                title="Change Password"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Reset Password</span>
              </Link>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="h-3.5 w-3.5 text-teal-700" />
                <span>{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-teal-700 px-3 py-1.5">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-xs shadow-sm">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={triggerInstall}
            className="flex items-center gap-1 text-xs text-teal-800 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 font-bold"
            title="Install App"
          >
            <Download className="h-3.5 w-3.5 text-teal-700" />
            <span className="text-[11px]">Install</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && currentUser && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-slate-700">
            <User className="h-4 w-4 text-teal-700" />
            <span>Signed in as: {currentUser.name}</span>
          </div>

          <div className="space-y-1.5">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                pathname === '/dashboard' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/payments"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                pathname === '/payments' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Advance Payments</span>
            </Link>

            <Link
              href="/meal-exceptions"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                pathname === '/meal-exceptions' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CalendarX className="h-4 w-4" />
              <span>Meal Exceptions</span>
            </Link>

            <Link
              href="/reset-password"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                pathname === '/reset-password' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Reset Password</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                triggerInstall();
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition"
            >
              <Download className="h-4 w-4 text-teal-700" />
              <span>Install Mobile App</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2.5 rounded-xl border border-rose-200 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
