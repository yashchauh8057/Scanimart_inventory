import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl transition-all duration-300',
      variant === 'default' && 'glass p-6',
      variant === 'strong' && 'glass-strong p-6',
      variant === 'lavender' && 'glass-lavender p-6',
      variant === 'elevated' && 'surface-elevated p-6',
      variant === 'subtle' && 'surface-subtle p-6',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mb-5 flex items-center justify-between gap-3', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-[18px] font-extrabold font-display leading-tight tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };