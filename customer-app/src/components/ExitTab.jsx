import { Box, CircleCheck, Heart, RefreshCcw, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { QrCode } from './qr-code';
import { storeScanner } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ExitTab({ receiptId, onNewSession }) {
  const { session } = useAuth();

  if (!receiptId) return null;

  return (
    <Card variant="default" className="text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="relative">
        <div className="relative mx-auto inline-grid w-fit place-items-center rounded-3xl p-5 bg-white/90 shadow-[0_24px_80px_-20px_rgba(91,33,182,.25)] border border-white/60">
          <QrCode value={storeScanner.build('SECURITY', receiptId)} size={240} />
          <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-primary via-violet-600 to-accent text-white shadow-[0_12px_32px_-8px_rgba(91,33,182,.5)]">
            <Box size={26} />
          </div>
        </div>

        <div className="mt-6 animate-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-base font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,.4)]">
            <ShieldCheck size={18} />
            Cleared to Exit
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Exit QR Ready</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Show this QR code to the security guard at the exit</p>
        </div>

        <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/60 bg-white/85 px-4 py-2 text-[13.5px] font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white"><User size={14} /></span>
          {session?.user}
        </div>

        <p className="mt-3 text-[11.5px] text-muted-foreground">Session ID: <span className="font-mono font-medium text-primary">{receiptId}</span></p>

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-violet-50 to-cyan-50 px-5 py-4 text-[13.5px] font-semibold text-primary border border-lavender-border animate-in">
          <div className="flex items-center justify-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white"><Heart size={14} /></span>
            <span>Thank you for shopping with Scanimart. Have a wonderful day!</span>
            <Sparkles size={16} className="text-accent" />
          </div>
        </div>

        <Button variant="ghost" size="lg" className="mt-6 w-full sm:w-auto" onClick={onNewSession}>
          <RefreshCcw className="mr-2" /> Start New Session
          <ArrowRight className="ml-2" size={16} />
        </Button>
      </div>
    </Card>
  );
}