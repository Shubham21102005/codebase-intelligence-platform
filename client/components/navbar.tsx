'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Image
            src="/brain-brainstorm-creative-svgrepo-com.svg"
            alt="CodePulse Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-xl font-semibold text-white">
            CodePulse
          </span>
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#b4b4b4]">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-[#b4b4b4] hover:text-white transition-colors text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
