'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Features',    href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'FAQ',         href: '/#faq' },
];

export function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-white/10 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-2xl transition-all">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0 group">
          <div className="h-8 w-8 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
            <GraduationCap className="h-5 w-5 text-white dark:text-zinc-900" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">NeuroLearn</span>
        </Link>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100/50 dark:bg-white/5 backdrop-blur-md px-2 py-1 rounded-full border border-zinc-200/50 dark:border-white/5">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-white dark:hover:bg-white/10"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          {mounted && <ThemeToggle />}

          {mounted && status !== 'loading' && (
            status === 'authenticated' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hidden sm:block text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl px-4 sm:px-5 py-2 font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="hidden sm:block text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl px-4 sm:px-5 py-2 font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                >
                  Get Started
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
