'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser } from '../services/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-pulse text-indigo-400 font-medium text-sm">Loading Mess Expense Tracker...</div>
    </div>
  );
}
