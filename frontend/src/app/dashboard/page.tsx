'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../services/api';
import {
  Calendar,
  CreditCard,
  CalendarX,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Receipt,
  PlusCircle,
  ArrowRight,
  Share2,
  Copy,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface BillingSummary {
  year: number;
  month: number;
  daysInMonth: number;
  defaultDailyRate: number;
  defaultMonthlyAmount: number;
  totalDeductions: number;
  actualBill: number;
  totalAdvancePaid: number;
  netResult: number;
  amountDue: number;
  remainingAdvance: number;
  status: 'DUE' | 'SURPLUS' | 'FULLY_PAID';
  exceptionDaysCount: number;
  exceptions: Array<{
    id: string;
    date: string;
    type: string;
    normalPrice: number;
    actualPrice: number;
    deduction: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    note: string | null;
  }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardPage() {
  const router = useRouter();
  const currentDate = new Date();

  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Share link state
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const loadBilling = async (y: number, m: number) => {
    setLoading(true);
    setError('');
    try {
      const billingData = await fetchApi(`/billing/monthly?year=${y}&month=${m}`);
      setBilling(billingData);

      try {
        const shareStatus = await fetchApi(`/billing/share/status?year=${y}&month=${m}`);
        if (shareStatus && shareStatus.active && shareStatus.token) {
          setShareToken(shareStatus.token);
        } else {
          setShareToken(null);
        }
      } catch {
        setShareToken(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling(year, month);
  }, [year, month]);

  const handleGenerateShareLink = async () => {
    setShareLoading(true);
    setError('');
    try {
      const res = await fetchApi('/billing/share', {
        method: 'POST',
        body: JSON.stringify({ year, month })
      });
      setShareToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!confirm('Are you sure you want to revoke this share link? The mess owner will no longer be able to view this statement.')) return;
    setShareLoading(true);
    setError('');
    try {
      await fetchApi('/billing/share/revoke', {
        method: 'POST',
        body: JSON.stringify({ year, month })
      });
      setShareToken(null);
      setCopySuccess('');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess('Link copied successfully!');
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const handleNativeShare = () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    if (navigator.share) {
      navigator.share({
        title: `Mess Expense Statement - ${MONTH_NAMES[month - 1]} ${year}`,
        url: shareUrl
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between glass-card p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
            <span>Monthly Billing Dashboard</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Exception-based hostel mess expense calculation (Default daily rate: ₹115)
          </p>
        </div>

        {/* Selector */}
        <div className="flex items-center gap-2.5 bg-slate-100 p-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-emerald-600 ml-1 shrink-0" />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1} className="bg-white text-slate-900">
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y} className="bg-white text-slate-900">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass-card animate-pulse" />
          ))}
        </div>
      ) : billing ? (
        <>
          {/* Main Status Hero Banner */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${
              billing.status === 'DUE'
                ? 'bg-rose-50/90 border-rose-200'
                : billing.status === 'SURPLUS'
                ? 'bg-emerald-50/90 border-emerald-200'
                : 'bg-teal-50/90 border-teal-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-slate-500 block">
                  Billing Period: {MONTH_NAMES[billing.month - 1]} {billing.year} ({billing.daysInMonth} Days)
                </span>
                {billing.status === 'DUE' && (
                  <div className="mt-2">
                    <div className="text-xs text-rose-700 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertCircle className="h-4 w-4" /> Amount Still Payable
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-rose-600 mt-1">₹{billing.amountDue}</div>
                  </div>
                )}
                {billing.status === 'SURPLUS' && (
                  <div className="mt-2">
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4" /> Remaining Advance Balance
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1">₹{billing.remainingAdvance}</div>
                  </div>
                )}
                {billing.status === 'FULLY_PAID' && (
                  <div className="mt-2">
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4" /> Fully Settled
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1">₹0 Balance</div>
                  </div>
                )}
              </div>

              {/* Action Quick Links */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/payments"
                  className="btn-secondary text-xs flex items-center gap-1.5 shadow-sm py-2 px-3 sm:px-4"
                >
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                  <span>Add Advance</span>
                </Link>
                <Link
                  href="/meal-exceptions"
                  className="btn-primary text-xs flex items-center gap-1.5 shadow-sm py-2 px-3 sm:px-4"
                >
                  <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Log Exception</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Share Statement Card */}
          <div className="glass-card p-5 sm:p-6 border-emerald-200 bg-gradient-to-r from-emerald-50/50 via-white to-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                  <Share2 className="h-5 w-5 text-emerald-600" />
                  <span>Share Monthly Statement</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Send a public read-only statement to the mess owner showing the full 31-day breakdown
                </p>
              </div>

              {!shareToken && (
                <button
                  onClick={handleGenerateShareLink}
                  disabled={shareLoading}
                  className="btn-primary text-xs py-2.5 px-4 shadow-sm self-start sm:self-auto disabled:opacity-50"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{shareLoading ? 'Generating Link...' : 'Share Monthly Statement'}</span>
                </button>
              )}
            </div>

            {shareToken && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Active Share Link ({MONTH_NAMES[month - 1]} {year})
                  </div>
                  {copySuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {copySuccess}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`}
                    className="input-field font-mono text-xs text-slate-700 bg-white"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="btn-primary text-xs py-2 px-3 flex-1 sm:flex-initial"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={handleNativeShare}
                      className="btn-secondary text-xs py-2 px-3"
                      title="Native Share"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleRevokeShareLink}
                      disabled={shareLoading}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                      title="Revoke Share Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Default Amount */}
            <div className="glass-card glass-card-hover p-4 sm:p-5 space-y-1">
              <div className="text-[11px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Monthly Default</div>
              <div className="text-2xl font-black text-slate-900">₹{billing.defaultMonthlyAmount}</div>
              <div className="text-xs text-slate-500 font-medium">
                {billing.daysInMonth} days × ₹{billing.defaultDailyRate}/day
              </div>
            </div>

            {/* Total Deductions */}
            <div className="glass-card glass-card-hover p-4 sm:p-5 space-y-1 border-emerald-200 bg-emerald-50/20">
              <div className="text-[11px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Meal Deductions</span>
                <TrendingDown className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">₹{billing.totalDeductions}</div>
              <div className="text-xs text-slate-500 font-medium">
                From {billing.exceptionDaysCount} exception {billing.exceptionDaysCount === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Actual Bill */}
            <div className="glass-card glass-card-hover p-4 sm:p-5 space-y-1">
              <div className="text-[11px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Actual Bill</div>
              <div className="text-2xl font-black text-indigo-700">₹{billing.actualBill}</div>
              <div className="text-xs text-slate-500 font-medium">Default (₹{billing.defaultMonthlyAmount}) - Deductions (₹{billing.totalDeductions})</div>
            </div>

            {/* Advance Paid */}
            <div className="glass-card glass-card-hover p-4 sm:p-5 space-y-1">
              <div className="text-[11px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider">Advance Paid</div>
              <div className="text-2xl font-black text-teal-600">₹{billing.totalAdvancePaid}</div>
              <div className="text-xs text-slate-500 font-medium">
                {billing.payments.length} payment {billing.payments.length === 1 ? 'record' : 'records'}
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Exception Summary */}
            <div className="glass-card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <CalendarX className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                  <span>Meal Exceptions ({billing.exceptionDaysCount})</span>
                </h3>
                <Link
                  href="/meal-exceptions"
                  className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {billing.exceptions.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-lg font-medium">
                  No meal exceptions recorded for {MONTH_NAMES[billing.month - 1]}. Every day defaults to full meal (₹115).
                </div>
              ) : (
                <div className="space-y-2">
                  {billing.exceptions.slice(0, 4).map((exc) => (
                    <div
                      key={exc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{exc.date}</span>
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {exc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 line-through mr-2 font-medium">₹115</span>
                        <span className="font-extrabold text-emerald-600">-₹{exc.deduction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History Summary */}
            <div className="glass-card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                  <span>Advance Payments (₹{billing.totalAdvancePaid})</span>
                </h3>
                <Link
                  href="/payments"
                  className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold"
                >
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {billing.payments.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-lg font-medium">
                  No advance payments logged for {MONTH_NAMES[billing.month - 1]}. Click "Add Advance" above to enter a payment.
                </div>
              ) : (
                <div className="space-y-2">
                  {billing.payments.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p.paymentDate}</span>
                        {p.note && <span className="ml-2 text-slate-500 font-medium italic">({p.note})</span>}
                      </div>
                      <div className="font-extrabold text-teal-700">₹{p.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
