import { useState, useRef, useEffect } from 'react';
import { QrCode, Bell, LogOut, User, Tags, Truck, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';

export default function Header() {
  const { session, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const initials = (session?.user || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-4 z-40 animate-in px-4 sm:px-6 lg:px-8">
      <div className="glass w-full px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-[0_8px_32px_-8px_rgba(91,33,182,.15)]">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-violet-600 to-accent text-white shadow-[0_8px_24px_-8px_rgba(91,33,182,.5)]">
            <QrCode size={20} />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <span className="font-display text-xl font-extrabold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Scanimart</span>
            <span className="text-[10.5px] font-medium text-muted-foreground">Self Checkout</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-500 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Session Active
          </span>

          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
              aria-label="Notifications"
              className="relative bg-white/70 hover:bg-white hover:text-primary"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 animate-ping" />
            </Button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 glass-strong rounded-2xl p-3 shadow-[0_16px_48px_-12px_rgba(30,27,75,.15)] border border-white/50 animate-in">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <p className="font-display text-sm font-bold">Notifications</p>
                  <span className="text-[10px] text-muted-foreground">3 new</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-xl bg-white/70 border border-border hover:bg-white transition-colors">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 shrink-0"><Tags size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold truncate">Flat 10% off on Amul Butter</p>
                      <p className="text-[10.5px] text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-white/70 border border-border hover:bg-white transition-colors">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600 shrink-0"><Truck size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold truncate">Self-checkout lanes open on Floor 2</p>
                      <p className="text-[10.5px] text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-white/70 border border-border hover:bg-white transition-colors">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600 shrink-0"><QrCode size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold truncate">New payment method: UPI Autopay</p>
                      <p className="text-[10.5px] text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={() => setNotifOpen(false)}>Mark all as read</Button>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              aria-label="User menu"
              className="relative bg-white/70 hover:bg-white hover:text-primary"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 glass-strong rounded-2xl py-2 shadow-[0_16px_48px_-12px_rgba(30,27,75,.15)] border border-white/50 animate-in">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-semibold truncate">{session?.user}</p>
                  <p className="text-[10.5px] text-muted-foreground">{session?.email}</p>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start px-3" onClick={signOut}>
                  <LogOut size={14} className="mr-2 text-red-500" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}