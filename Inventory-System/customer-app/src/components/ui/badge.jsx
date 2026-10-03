import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/15',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        destructive: 'bg-red-50 text-red-600 border border-red-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        accent: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
        gradient: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_4px_12px_-4px_rgba(244,63,94,.4)]',
        lavender: 'bg-lavender text-primary border border-lavender-border',
        subtle: 'bg-white/60 text-muted-foreground border border-border'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };