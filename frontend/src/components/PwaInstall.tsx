'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Smartphone, X, Share2, PlusSquare, Info } from 'lucide-react';

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

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

    if (typeof window !== 'undefined') {
      // Check if iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // Check if already installed / standalone
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
      }

      // Check session dismissal
      const isDismissed = sessionStorage.getItem('pwa_dismissed') === 'true';
      if (isDismissed) {
        setDismissed(true);
      }
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Global custom event for triggering install from Navbar or anywhere
    const handleTriggerInstall = () => {
      handleInstallClick();
    };
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_dismissed', 'true');
    }
  };

  // If already running standalone, don't show prompt
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Responsive Floating Mobile & Desktop Bottom Banner */}
      {!dismissed && (isInstallable || isIos) && (
        <aside
          aria-label="Install MessTracker App"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-bounce-subtle"
        >
          <div className="flex items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/80">
            {/* App Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
              <Smartphone className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Install MessTracker
              </h3>
              <p className="text-[11px] text-slate-300 font-medium truncate sm:whitespace-normal">
                1-tap access & works offline
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>

              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS & Desktop Step-by-Step Installation Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <Download className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Install MessTracker</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Install MessTracker directly to your home screen or desktop for fast, fullscreen access:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-black text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-800">
                    {isIos ? 'Tap the Share icon' : 'In your browser address bar / menu'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {isIos
                      ? 'Tap the Share icon in the Safari toolbar below.'
                      : 'Look for the Install (⊕) icon in the URL bar, or click browser menu (⋮).'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-black text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-800">Select &quot;Install App&quot; or &quot;Add to Home Screen&quot;</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Choose <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install MessTracker&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-black text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-800">Done!</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    MessTracker will now open like a native mobile / desktop app.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full btn-primary text-xs py-2.5 shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
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
