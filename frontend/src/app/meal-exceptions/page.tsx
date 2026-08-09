'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../services/api';
import { CalendarX, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Calendar, Utensils, Info } from 'lucide-react';

interface MealException {
  id: string;
  date: string;
  formattedDate: string;
  type: 'DINNER_ONLY' | 'LUNCH_ONLY' | 'NO_FOOD';
  normalDailyPrice: number;
  actualPrice: number;
  deduction: number;
}

export default function MealExceptionsPage() {
  const router = useRouter();
  const [exceptions, setExceptions] = useState<MealException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [type, setType] = useState<'DINNER_ONLY' | 'LUNCH_ONLY' | 'NO_FOOD'>('NO_FOOD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 20;

  const loadExceptions = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi(`/meal-exceptions?page=${targetPage}&limit=${limit}`);
      if (res && res.data && res.pagination) {
        setExceptions(res.data);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      } else if (Array.isArray(res)) {
        setExceptions(res);
        setTotalRecords(res.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load meal exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions(1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSubmitting(true);

    try {
      if (editingId) {
        await fetchApi(`/meal-exceptions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ date, type })
        });
        setSuccess('Meal exception updated');
      } else {
        await fetchApi('/meal-exceptions', {
          method: 'POST',
          body: JSON.stringify({ date, type })
        });
        setSuccess('Meal exception logged successfully');
      }

      setEditingId(null);
      loadExceptions();
    } catch (err: any) {
      setError(err.message || 'Failed to save meal exception');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exc: MealException) => {
    setEditingId(exc.id);
    setDate(exc.formattedDate || exc.date.split('T')[0]);
    setType(exc.type);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exception? The date will revert to the default ₹115 rate.')) return;
    setError('');
    setSuccess('');

    try {
      await fetchApi(`/meal-exceptions/${id}`, { method: 'DELETE' });
      setSuccess('Meal exception deleted. Date restored to default ₹115.');
      loadExceptions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exception');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setType('NO_FOOD');
  };

  const totalDeductions = exceptions.reduce((sum, exc) => sum + exc.deduction, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between glass-card p-4 sm:p-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarX className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 shrink-0" />
            <span>Meal Exceptions Tracker</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Log only the days when you did NOT have the full normal meal (₹115/day default)
          </p>
        </div>
        <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl self-start sm:self-auto">
          <span className="text-[11px] sm:text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Deductions Saved</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600">₹{totalDeductions}</span>
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

      {/* Rules Banner */}
      <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-4 text-xs text-emerald-950 flex items-start gap-3 shadow-sm">
        <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-950">How Meal Pricing Rules Work:</p>
          <ul className="list-disc list-inside space-y-0.5 text-emerald-900 font-medium">
            <li><strong>Normal Day (Default):</strong> ₹115 (No entry required!).</li>
            <li><strong>Dinner Only:</strong> Costs ₹50 (Saves ₹65 deduction).</li>
            <li><strong>Lunch Only:</strong> Costs ₹70 (Saves ₹45 deduction).</li>
            <li><strong>No Food:</strong> Costs ₹0 (Saves ₹115 deduction).</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="glass-card p-5 sm:p-6 h-fit space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            {editingId ? <Edit2 className="h-5 w-5 text-amber-600 shrink-0" /> : <Plus className="h-5 w-5 text-emerald-600 shrink-0" />}
            <span>{editingId ? 'Edit Exception Date' : 'Log Meal Exception'}</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Exception Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Exception Type
              </label>
              <div className="space-y-2">
                {/* Dinner Only */}
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition min-h-[48px] ${
                    type === 'DINNER_ONLY'
                      ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exceptionType"
                      value="DINNER_ONLY"
                      checked={type === 'DINNER_ONLY'}
                      onChange={() => setType('DINNER_ONLY')}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <div>
                      <div className="font-bold text-xs">Dinner Only</div>
                      <div className="text-[11px] text-slate-500 font-medium">Actual cost: ₹50</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">-₹65</span>
                </label>

                {/* Lunch Only */}
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition min-h-[48px] ${
                    type === 'LUNCH_ONLY'
                      ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exceptionType"
                      value="LUNCH_ONLY"
                      checked={type === 'LUNCH_ONLY'}
                      onChange={() => setType('LUNCH_ONLY')}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <div>
                      <div className="font-bold text-xs">Lunch Only</div>
                      <div className="text-[11px] text-slate-500 font-medium">Actual cost: ₹70</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">-₹45</span>
                </label>

                {/* No Food */}
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition min-h-[48px] ${
                    type === 'NO_FOOD'
                      ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="exceptionType"
                      value="NO_FOOD"
                      checked={type === 'NO_FOOD'}
                      onChange={() => setType('NO_FOOD')}
                      className="accent-emerald-600 h-4 w-4"
                    />
                    <div>
                      <div className="font-bold text-xs">No Food</div>
                      <div className="text-[11px] text-slate-500 font-medium">Actual cost: ₹0</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">-₹115</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-primary text-xs sm:text-sm py-2.5 disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Exception' : 'Save Exception'}
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

        {/* Exceptions History Table */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Exception Log ({exceptions.length})</span>
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              No meal exceptions recorded yet. Every day defaults to normal ₹115 meal billing.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Exception Type</th>
                    <th className="p-3">Normal</th>
                    <th className="p-3">Actual</th>
                    <th className="p-3">Deduction</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {exceptions.map((exc) => (
                    <tr key={exc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{exc.formattedDate || exc.date.split('T')[0]}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {exc.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-medium">₹{exc.normalDailyPrice || 115}</td>
                      <td className="p-3 font-bold text-slate-900">₹{exc.actualPrice}</td>
                      <td className="p-3 font-black text-emerald-600">+₹{exc.deduction} saved</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(exc)}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exc.id)}
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
                  onClick={() => loadExceptions(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-200 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadExceptions(page + 1)}
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
