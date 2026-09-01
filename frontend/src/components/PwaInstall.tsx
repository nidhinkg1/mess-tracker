'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed:', err);
        });
    }

    // Check if already installed
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or already triggered
      alert(
        'To install MessTracker:\n\n' +
        '• Chrome/Edge on Desktop/Android: Click the Install icon (⊕) in the browser address bar, or browser menu ⋮ -> "Install App"\n' +
        '• Safari on iOS: Tap Share (⎋) -> "Add to Home Screen"'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If already running standalone, don't show install buttons
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Quick Install Banner / Button for desktop & mobile */}
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition-all shadow-sm"
          title="Install MessTracker App on your device"
        >
          <Download className="h-3.5 w-3.5 text-teal-700" />
          <span>Install App</span>
        </button>
      )}

      {/* Installed Toast Confirmation */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-xs font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>MessTracker installed successfully!</span>
          <button onClick={() => setShowToast(false)} className="text-emerald-300 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
