'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  showBackButton?: boolean;
  showAuthButtons?: boolean;
  isAuthenticated?: boolean;
}

export function Navbar({ showBackButton = false, showAuthButtons = true, isAuthenticated = false }: NavbarProps) {
  const router = useRouter();

  // Use client-side only rendering for interactive elements
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial SSR-safe render
  const authButtons = mounted ? (
    <div className="flex items-center gap-2 sm:gap-4">
      {showAuthButtons && (
        isAuthenticated ? (
          <>
            <Button variant="default" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={() => router.push('/dashboard')}>
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={() => signOut({ callbackUrl: '/' })}>
              Logout
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        )
      )}
      <ThemeToggle />
    </div>
  ) : null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                Back
              </Button>
            )}
            
            <Link href="/">
              <div className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <h1 className="text-base sm:text-xl font-bold">NeuroLearn-AI</h1>
              </div>
            </Link>
          </div>
          
          {authButtons}
        </div>
      </div>
    </header>
  );
}