import { useState } from 'react';
import { toast } from 'sonner';
import { QrCode, Shield, Loader2, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth';
import logo from '../assets/scanimart-logo.png';

const CREDENTIALS = [
  { role: 'Admin', email: 'admin@scanimart.com', password: 'admin123', color: 'from-rose-500 to-orange-500' },
];

export default function Login() {
  const { signIn, homeFor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (!email || !password) return toast.error('Email and password are required.');
    setLoading(true);
    try {
      const session = await signIn(email, password);
      if (session.role !== 'admin') {
        toast.error('Admin access only. Please use admin credentials.');
        return;
      }
      toast.success(`Welcome back, ${session.user}!`, { duration: 2000 });
      setTimeout(() => window.location.href = homeFor(session.role), 500);
    } catch (error) {
      toast.error(error.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
    setTimeout(() => submit({ preventDefault: () => {} }), 100);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-violet-400/30 blur-[100px] animate-float" />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-cyan-400/25 blur-[100px] animate-float" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-1/3 left-1/2 h-[340px] w-[340px] rounded-full bg-emerald-400/20 blur-[100px] animate-float" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in">
        <Card variant="strong" className="p-8">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-5 grid h-18 w-18 place-items-center rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-accent text-white shadow-[0_20px_50px_-16px_rgba(91,33,182,.5)]">
              <img src={logo} alt="Scanimart logo" className="h-16 w-16 rounded-2xl bg-white object-cover shadow-lg" />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-3 border-white animate-ping" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Scanimart</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Admin Dashboard</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-lavender px-4 py-1.5 text-[11.5px] font-semibold text-primary border border-lavender-border">
              <Sparkles size={13} className="text-accent" />
              Admin Access Only
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@scanimart.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                className="mt-1.5"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5"
                disabled={loading}
              />
            </div>
            <Button type="submit" size="lg" className="mt-3" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2" />
                  Sign In
                  <ArrowRight className="ml-2" size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Quick Access</p>
              <p className="text-[10.5px] text-muted-foreground/70">Click to auto-fill</p>
            </div>
            <div className="grid gap-2">
              {CREDENTIALS.map(c => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => quickLogin(c.email, c.password)}
                  className="relative group flex items-center gap-3 rounded-xl border border-border bg-white/70 p-3 transition-all duration-300 hover:border-primary/20 hover:bg-white hover:shadow-lg"
                >
                  <div className={`relative shrink-0 grid h-10 w-10 place-items-center rounded-xl ${c.color} text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,.2)]`}>
                    <Shield size={16} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate">{c.role}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-white/50 font-medium">
          Scanimart Admin Panel v2.0 — Production Ready
        </p>
      </div>
    </div>
  );
}
