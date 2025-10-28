'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null;
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const normalized = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(100, value)) : 0;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={typeof value === 'number' ? Math.round(normalized) : undefined}
        className={cn('relative w-full overflow-hidden rounded-full bg-secondary', className)}
        {...props}
      >
        <div
          className="h-2 bg-primary transition-all"
          style={{ width: `${normalized}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
