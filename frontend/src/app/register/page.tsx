'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../services/api';
import { Utensils, UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 glass-card p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Utensils className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Create Account</h2>
          <p className="mt-1.5 text-xs font-medium text-slate-500">Start tracking your hostel mess expenses</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="resident@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-semibold text-sm disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
