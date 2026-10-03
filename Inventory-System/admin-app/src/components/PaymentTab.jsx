import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Check, QrCode as QrIcon, Banknote, CreditCard, Wallet, Smartphone, CircleCheck, Info, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { QrCode } from './qr-code';
import { storeScanner } from '../lib/api';
import { money } from '../lib/utils';

const METHODS = [
  { id: 'upi', name: 'UPI', sub: 'PhonePe · Google Pay · Paytm', icon: <Smartphone size={22} />, gradient: 'from-primary to-violet-600', bg: 'from-violet-50 to-cyan-50', border: 'border-primary/30' },
  { id: 'card', name: 'Card', sub: 'Visa · Mastercard · RuPay', icon: <CreditCard size={22} />, gradient: 'from-indigo-500 to-blue-600', bg: 'from-indigo-50 to-blue-50', border: 'border-indigo/30' },
  { id: 'cash', name: 'Cash', sub: 'Pay at the counter', icon: <Banknote size={22} />, gradient: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald/30' },
  { id: 'wallet', name: 'Wallet', sub: 'Amazon Pay · Mobikwik', icon: <Wallet size={22} />, gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber/30' }
];

const APPS = [
  { label: 'PhonePe', emoji: '💠', vpa: 'phone', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { label: 'Google Pay', emoji: '🟢', vpa: 'gpay', color: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'Paytm', emoji: '🔷', vpa: 'paytm', color: 'bg-blue-50 text-blue-700 border-blue-100' }
];

const WALLETS = [
  { label: 'PhonePe', emoji: '💠', color: 'from-indigo-500 to-indigo-600' },
  { label: 'Google Pay', emoji: '🟢', color: 'from-green-500 to-green-600' },
  { label: 'Paytm', emoji: '🔷', color: 'from-blue-500 to-blue-600' },
  { label: 'Amazon Pay', emoji: '🛒', color: 'from-orange-500 to-orange-600' }
];

export default function PaymentTab({ cart, totals, method, setMethod, phase, txnId, onPay, onGetExit, paying }) {
  const [upiId, setUpiId] = useState('');
  const [app, setApp] = useState('PhonePe');
  const [cardNo, setCardNo] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [wallet, setWallet] = useState('Paytm');

  const pickApp = a => {
    setApp(a.label);
    if (!upiId) setUpiId(`user@${a.vpa}`);
  };

  const handlePay = () => {
    if (!cart.length) return toast.error('Your cart is empty.');
    if (method === 'upi' && !upiId.trim()) return toast.error('Enter your UPI ID.');
    if (method === 'card' && (!cardNo.trim() || !cardExp.trim() || !cardCvv.trim())) return toast.error('Enter your card details.');
    onPay(method);
  };

  return (
    <div className="grid gap-4 animate-in">
      <Card variant="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <ShieldCheck size={18} />
            </div>
            Order Summary
          </CardTitle>
          <span className="text-sm text-muted-foreground">{cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</span>
        </CardHeader>
        <ul className="grid gap-2">
          {cart.map(item => (
            <li key={item.sku} className="flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 transition-colors hover:bg-white/80">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-xl">{item.emoji || '🛒'}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{item.name}</span>
              <span className="text-[12px] font-bold text-muted-foreground">×{item.qty}</span>
              <span className="text-[13px] font-bold text-primary tabular-nums">{money(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 border-t border-dashed border-border pt-3 text-[14px]">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-medium">{money(totals.subtotal)}</span></div>
          <div className="flex justify-between font-bold text-emerald-600"><span>You save</span><span>- {money(totals.savings)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>GST (5%)</span><span>{money(totals.gst)}</span></div>
          <div className="flex justify-between font-display text-lg font-extrabold"><span>Total Payable</span><span>{money(totals.total)}</span></div>
        </div>
      </Card>

      {phase === 'method' && (
        <Card variant="default">
          <div className="mb-5">
            <h3 className="font-display text-[17px] font-extrabold">Choose Payment Method</h3>
            <p className="text-sm text-muted-foreground mt-1">Select your preferred payment option</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {METHODS.map(m => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`relative group rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[.98] ${
                    active
                      ? `border-primary bg-gradient-to-br ${m.bg} shadow-[0_12px_32px_-12px_rgba(91,33,182,.35)] ring-2 ring-primary/20`
                      : 'border-border bg-white/80 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg'
                  }`}
                >
                  <span className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] transition-all duration-300 ${
                    active ? 'border-primary bg-primary text-white scale-100 rotate-0' : 'border-border text-transparent scale-75 group-hover:scale-100'
                  }`}>
                    <Check size={12} />
                  </span>
                  <span className={`mb-3 grid h-12 w-12 place-items-center rounded-xl text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,.2)] transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br ${m.gradient}`}>
                    {m.icon}
                  </span>
                  <span className="block text-[14px] font-extrabold">{m.name}</span>
                  <span className="block text-[11.5px] text-muted-foreground mt-0.5">{m.sub}</span>
                </button>
              );
            })}
          </div>

          {method === 'upi' && (
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/70 p-5 animate-in">
              <Label>UPI ID</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60">@</span>
                <Input placeholder="yourname" value={upiId} onChange={e => setUpiId(e.target.value)} className="pl-8" />
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">Or choose a UPI app</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {APPS.map(a => (
                  <button key={a.label} onClick={() => pickApp(a)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-95 ${app === a.label ? `border-primary bg-primary/5 text-primary shadow-[0_4px_12px_-4px_rgba(91,33,182,.3)]` : `${a.color} hover:border-primary/30 hover:bg-white`}`}>
                    <span className="mr-2 text-base">{a.emoji}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="mt-5 grid gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 animate-in">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="4111 1111 1111 1111" inputMode="numeric" value={cardNo}
                  onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} className="mt-2 tracking-wider" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry (MM/YY)</Label>
                  <Input placeholder="12/28" value={cardExp}
                    onChange={e => setCardExp(e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'))} className="mt-2" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input placeholder="•••" type="password" maxLength={4} value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="mt-2" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground pt-2 border-t border-border">
                <Lock size={13} className="text-emerald-500" />
                <span>Your card details are encrypted and secure</span>
              </div>
            </div>
          )}

          {method === 'cash' && (
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/70 p-5 animate-in">
              <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><Info size={18} /></div>
                <div>
                  <p className="font-semibold text-emerald-800">Pay with Cash at Counter</p>
                  <p className="text-[12.5px] text-emerald-700 mt-0.5">A staff member will confirm your payment and generate your Exit QR.</p>
                </div>
              </div>
            </div>
          )}

          {method === 'wallet' && (
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/70 p-5 animate-in">
              <Label>Select Wallet</Label>
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {WALLETS.map(w => (
                  <button key={w.label} onClick={() => setWallet(w.label)}
                    className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-[11px] font-semibold transition-all duration-300 active:scale-95 ${wallet === w.label
                      ? `border-transparent bg-gradient-to-br ${w.color} text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,.25)]`
                      : 'border-border bg-white hover:border-primary/30 hover:bg-white/80'}`}>
                    <span className="text-3xl">{w.emoji}</span>{w.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button variant="success" size="lg" className="mt-6" onClick={handlePay} disabled={paying}>
            {paying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2" />
                Pay {money(totals.total)} Securely
                <ArrowRight className="ml-2" size={16} />
              </>
            )}
          </Button>
        </Card>
      )}

      {phase === 'cash-wait' && (
        <Card variant="default" className="text-center">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-[11px] font-bold text-cyan-700 border border-cyan-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping-slow rounded-full bg-cyan-500 opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              Awaiting Payment
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Scan the QR code at the cash counter to complete payment</p>
          </div>
          <div className="mx-auto inline-grid place-items-center rounded-2xl border border-white/60 bg-white p-5 shadow-[0_16px_48px_-16px_rgba(91,33,182,.2)]">
            <QrCode value={storeScanner.build('STAFF', txnId)} size={200} />
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">Transaction ID: <span className="font-mono font-bold text-primary">{txnId}</span></p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-[13px] font-semibold text-cyan-700 border border-cyan-100 animate-ping-slow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-cyan-500 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            Waiting for staff confirmation...
          </div>
        </Card>
      )}

      {phase === 'success' && (
        <Card variant="default" className="text-center py-4">
          <div className="relative mx-auto mb-6">
            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_24px_60px_-16px_rgba(16,185,129,.5)] animate-pop">
              <span className="absolute inset-0 animate-ping-slow rounded-full border-4 border-emerald-300/40" />
              <CircleCheck size={60} className="text-white drop-shadow-lg" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5">
              {[1,2,3].map(i => (
                <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-ping-slow" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
          <h2 className="font-display text-2xl font-extrabold">Payment Successful!</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Your order has been confirmed. Head to the exit when ready.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-[13px] font-bold text-emerald-700 border border-emerald-100">
            <CircleCheck size={16} className="text-emerald-600" />
            Transaction ID: <span className="font-mono">{txnId}</span>
          </div>
          <Button size="lg" className="mt-7 w-full sm:w-auto" onClick={onGetExit}>
            <QrIcon className="mr-2" /> Get Exit QR
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </Card>
      )}
    </div>
  );
}