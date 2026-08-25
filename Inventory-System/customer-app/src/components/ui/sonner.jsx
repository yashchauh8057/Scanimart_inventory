import { Toaster as Sonner } from 'sonner';

export function Toaster(props) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:font-sans',
          success: 'group-[.toaster]:border-emerald-200',
          error: 'group-[.toaster]:border-red-200'
        }
      }}
      {...props}
    />
  );
}
