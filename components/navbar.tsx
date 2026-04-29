'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Features',    href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'FAQ',         href: '/#faq' },
];
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-white/10 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 relative">

        {/* Logo */}
        <div className="flex flex-1 justify-start">
          <Link href="/" className="group hover:opacity-80 transition-opacity shrink-0" aria-label="NeuroLearn home">
            <BrandLogo size="sm" />
          </Link>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <nav className="flex items-center gap-1 bg-zinc-100/50 dark:bg-white/5 backdrop-blur-md px-2 py-1 rounded-full border border-zinc-200/50 dark:border-white/5">
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
        </div>

        {/* Right actions */}
        <div className="flex flex-1 justify-end items-center gap-3 shrink-0">
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
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center shrink-0">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/10 px-4 py-6 flex flex-col gap-4 shadow-xl z-50">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-2 py-1"
            >
              {label}
            </Link>
          ))}
          {mounted && status !== 'loading' && (
            status === 'authenticated' ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-2 py-1 sm:hidden"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-2 py-1 sm:hidden"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
