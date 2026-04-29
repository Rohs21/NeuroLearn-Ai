'use client';

import { GraduationCap } from 'lucide-react';

type BrandLogoSize = 'sm' | 'md' | 'lg';

type BrandLogoProps = {
  size?: BrandLogoSize;
  className?: string;
  showTagline?: boolean;
  inverted?: boolean;
};

const SIZE_STYLES: Record<BrandLogoSize, { icon: string; title: string; tagline: string; gap: string }> = {
  sm: {
    icon: 'h-7 w-7',
    title: 'text-base',
    tagline: 'text-[8px]',
    gap: 'gap-2',
  },
  md: {
    icon: 'h-8 w-8',
    title: 'text-lg',
    tagline: 'text-[9px]',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'h-10 w-10',
    title: 'text-2xl',
    tagline: 'text-[10px]',
    gap: 'gap-3',
  },
};

export function BrandLogo({ size = 'md', className = '', showTagline = true, inverted = false }: BrandLogoProps) {
  const styles = SIZE_STYLES[size];
  const iconColors = inverted
    ? 'bg-white text-zinc-900'
    : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900';
  const titleColors = inverted
    ? 'text-white'
    : 'text-zinc-900 dark:text-white';
  const taglineColors = inverted
    ? 'text-zinc-400'
    : 'text-zinc-500 dark:text-zinc-400';

  return (
    <div className={`flex items-center ${styles.gap} ${className}`.trim()}>
      <div className={`flex items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105 ${iconColors} ${styles.icon}`}>
        <GraduationCap className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-semibold tracking-tight ${titleColors} ${styles.title}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          NeuroLearn
        </span>

        {showTagline && (
          <span
            className={`mt-1 font-normal uppercase tracking-[0.35em] ${taglineColors} ${styles.tagline}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            AI
          </span>
        )}
      </div>
    </div>
  );
}