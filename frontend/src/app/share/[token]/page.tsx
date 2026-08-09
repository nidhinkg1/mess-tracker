'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '../../../services/api';
import {
  Utensils,
  Receipt,
  Calendar,
  CreditCard,
  TrendingDown,
  Lock,
  CalendarX
} from 'lucide-react';

interface PublicStatement {
  residentName: string;
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
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    note: string | null;
  }>;
  exceptions: Array<{
    id: string;
    date: string;
    status: string;
    type: string;
    normalPrice: number;
    actualPrice: number;
    deduction: number;
  }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [statement, setStatement] = useState<PublicStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPublicStatement() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi(`/share/${token}`);
        setStatement(data);
      } catch (err: any) {
        setError(err.message || 'This share link is no longer available.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicStatement();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-teal-700 font-bold text-sm flex items-center gap-2">
          <Utensils className="h-5 w-5 animate-spin" /> Loading Mess Statement...
        </div>
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="glass-card p-8 space-y-4 border-rose-200 bg-rose-50/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Link Unavailable</h1>
          <p className="text-xs font-medium text-slate-600">
            This share link is no longer available or has been revoked by the resident.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-12 px-4">
      {/* Clean Standalone Header */}
      <div className="glass-card p-6 border-teal-200 bg-gradient-to-r from-teal-50/90 via-white to-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-white">
                <Utensils className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-slate-800">MessTracker</span>
              <span className="text-slate-300">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 border border-teal-200 text-teal-900 font-extrabold">
                Official Shareable Statement
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Mess Expense Statement
            </h1>
            <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-700" />
              <span>{MONTH_NAMES[statement.month - 1]} {statement.year}</span>
              <span className="text-slate-400">|</span>
              <span className="text-teal-800">Resident: {statement.residentName}</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm self-start sm:self-auto">
            <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Statement Status</span>
            <span
              className={`text-lg font-black ${
                statement.status === 'DUE'
                  ? 'text-rose-600'
                  : statement.status === 'SURPLUS'
                  ? 'text-emerald-600'
                  : 'text-teal-700'
              }`}
            >
              {statement.status === 'DUE' && `Amount Due: ₹${statement.amountDue}`}
              {statement.status === 'SURPLUS' && `Remaining Advance: ₹${statement.remainingAdvance}`}
              {statement.status === 'FULLY_PAID' && 'Fully Settled'}
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Calculation Formula Summary */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-teal-700" />
          <span>Monthly Calculation Summary</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Normal Amount</div>
            <div className="text-xl font-black text-slate-900 mt-1">₹{statement.defaultMonthlyAmount}</div>
            <div className="text-[11px] text-slate-500 font-medium">{statement.daysInMonth} days × ₹115</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>Meal Deductions</span>
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-600 mt-1">₹{statement.totalDeductions}</div>
            <div className="text-[11px] text-slate-500 font-medium">{statement.exceptionDaysCount} exception days</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Actual Mess Bill</div>
            <div className="text-xl font-black text-indigo-700 mt-1">₹{statement.actualBill}</div>
            <div className="text-[11px] text-slate-500 font-medium">₹{statement.defaultMonthlyAmount} - ₹{statement.totalDeductions}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Advance Paid</div>
            <div className="text-xl font-black text-teal-700 mt-1">₹{statement.totalAdvancePaid}</div>
            <div className="text-[11px] text-slate-500 font-medium">{statement.payments.length} payment records</div>
          </div>
        </div>

        {/* Final Formula Box */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-300">
            Formula: <span className="font-bold text-white">Actual Bill (₹{statement.actualBill}) - Advance Paid (₹{statement.totalAdvancePaid})</span>
          </div>
          <div className="text-sm font-extrabold">
            {statement.status === 'DUE' && (
              <span className="text-rose-400">Final Balance: Amount to Pay ₹{statement.amountDue}</span>
            )}
            {statement.status === 'SURPLUS' && (
              <span className="text-emerald-400">Final Balance: Remaining Advance ₹{statement.remainingAdvance}</span>
            )}
            {statement.status === 'FULLY_PAID' && (
              <span className="text-teal-300">Final Balance: Fully Settled</span>
            )}
          </div>
        </div>
      </div>

      {/* Logged Meal Exceptions Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-amber-600" />
            <span>Meal Exceptions Logged ({statement.exceptionDaysCount})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Normal daily rate: ₹115
          </span>
        </div>

        {statement.exceptions.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl font-medium">
            No meal exceptions recorded for {MONTH_NAMES[statement.month - 1]}. Every day defaults to full meal (₹115).
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
              <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Exception Type</th>
                  <th className="p-3">Normal Rate</th>
                  <th className="p-3">Actual Charged</th>
                  <th className="p-3">Deduction Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {statement.exceptions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{item.date}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-medium">₹{item.normalPrice}</td>
                    <td className="p-3 font-bold text-slate-900">₹{item.actualPrice}</td>
                    <td className="p-3 font-black text-emerald-600">-₹{item.deduction}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50/50 font-bold border-t border-slate-200">
                  <td className="p-3" colSpan={4}>Total Meal Deductions Saved</td>
                  <td className="p-3 font-black text-emerald-600 text-sm">-₹{statement.totalDeductions}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advance Payments List */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal-700" />
          <span>Advance Payments Logged</span>
        </h2>

        {statement.payments.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl font-medium">
            No advance payments recorded for this month.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[400px]">
              <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {statement.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{p.paymentDate}</td>
                    <td className="p-3 font-black text-teal-700">₹{p.amount}</td>
                    <td className="p-3 text-slate-500 font-medium">{p.note || '-'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="p-3">Total Advance Paid</td>
                  <td className="p-3 font-black text-teal-800 text-sm" colSpan={2}>₹{statement.totalAdvancePaid}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
