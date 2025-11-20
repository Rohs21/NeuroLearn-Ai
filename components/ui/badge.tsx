import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Base: glassy/translucent in light mode, keep rounded pill layout and focus styles
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/10 backdrop-blur-sm border-white/20 text-black/90 dark:text-card-foreground',
  {
    variants: {
      variant: {
        // In dark mode use the colored backgrounds; in light mode the translucent glass stays
        default:
          'dark:border-transparent dark:bg-primary dark:text-primary-foreground hover:dark:bg-primary/80',
        secondary:
          'dark:border-transparent dark:bg-secondary dark:text-secondary-foreground hover:dark:bg-secondary/80',
        destructive:
          'dark:border-transparent dark:bg-destructive dark:text-destructive-foreground hover:dark:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
