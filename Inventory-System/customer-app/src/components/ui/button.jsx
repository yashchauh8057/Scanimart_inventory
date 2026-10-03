import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold font-display transition-all duration-300 outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground btn-primary hover:brightness-105 active:scale-[.98]',
        success: 'bg-success text-success-foreground btn-success hover:brightness-105 active:scale-[.98]',
        accent: 'bg-accent text-accent-foreground btn-accent hover:brightness-105 active:scale-[.98]',
        ghost: 'bg-white/70 text-primary border border-primary/20 hover:bg-white hover:border-primary/40 active:scale-[.98]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[.98]',
        outline: 'border border-input bg-white/80 hover:bg-lavender active:scale-[.98]',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-105 active:scale-[.98]',
        lavender: 'bg-lavender text-primary border border-lavender-border hover:bg-lavender/80 active:scale-[.98]',
        subtle: 'bg-white/60 text-foreground border border-border hover:bg-white/80 active:scale-[.98]'
      },
      size: {
        default: 'h-12 px-6 py-2.5',
        lg: 'h-[56px] px-8 text-base w-full',
        sm: 'h-10 px-4 rounded-lg',
        xs: 'h-9 px-3 rounded-lg text-xs',
        icon: 'h-12 w-12 rounded-xl',
        iconSm: 'h-10 w-10 rounded-lg',
        iconLg: 'h-14 w-14 rounded-2xl'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };