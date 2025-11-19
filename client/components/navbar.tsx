'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-[#30363d] bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center">
            <span className="text-[#0d1117] font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-semibold text-[#e6edf3]">
            Codebase Analyzer
          </span>
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#8b949e]">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-[#e6edf3] hover:text-[#58a6ff] transition-colors text-sm"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
