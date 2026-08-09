'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, getToken } from '../../services/api';
import { CreditCard, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Calendar, FileText } from 'lucide-react';

interface AdvancePayment {
  id: string;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<AdvancePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 20;

  const loadPayments = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi(`/payments?page=${targetPage}&limit=${limit}`);
      if (res && res.data && res.pagination) {
        setPayments(res.data);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } else if (Array.isArray(res)) {
        setPayments(res);
        setTotalRecords(res.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadPayments(1);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await fetchApi(`/payments/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            amount: parsedAmount,
            paymentDate,
            note: note.trim() || undefined
          })
        });
        setSuccess('Payment updated successfully');
      } else {
        await fetchApi('/payments', {
          method: 'POST',
          body: JSON.stringify({
            amount: parsedAmount,
            paymentDate,
            note: note.trim() || undefined
          })
        });
        setSuccess('Advance payment recorded successfully');
      }

      setAmount('');
      setNote('');
      setEditingId(null);
      loadPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: AdvancePayment) => {
    setEditingId(p.id);
    setAmount(String(p.amount));
    setPaymentDate(p.paymentDate.split('T')[0]);
    setNote(p.note || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    setError('');
    setSuccess('');

    try {
      await fetchApi(`/payments/${id}`, { method: 'DELETE' });
      setSuccess('Payment deleted');
      loadPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
  };

  const totalAdvancePaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between glass-card p-4 sm:p-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
            <span>Advance Payments</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Log and manage your mess advance payments
          </p>
        </div>
        <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl self-start sm:self-auto">
          <span className="text-[11px] sm:text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Logged Advance</span>
          <span className="text-lg sm:text-xl font-black text-emerald-700">₹{totalAdvancePaid}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="glass-card p-5 sm:p-6 h-fit space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            {editingId ? <Edit2 className="h-5 w-5 text-amber-600 shrink-0" /> : <Plus className="h-5 w-5 text-emerald-600 shrink-0" />}
            <span>{editingId ? 'Edit Payment Record' : 'Record New Advance'}</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 3000"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cash payment / GPay"
                className="input-field"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-primary text-xs sm:text-sm py-2.5 disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Payment' : 'Save Payment'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary text-xs px-3"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Payment History ({payments.length})</span>
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              No advance payments recorded yet. Use the form to log your first payment.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700 min-w-[480px]">
                <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Note</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{p.paymentDate.split('T')[0]}</span>
                        </div>
                      </td>
                      <td className="p-3 font-extrabold text-teal-700 text-sm">₹{p.amount}</td>
                      <td className="p-3 text-slate-500 font-medium">
                        {p.note ? (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                            {p.note}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <span className="text-slate-500 font-medium">
                Page {page} of {totalPages} ({totalRecords} total records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadPayments(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-200 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadPayments(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-200 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
