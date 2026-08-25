import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Users, Truck, ShoppingCart, ShoppingBag, Warehouse, Receipt, DollarSign, UserCog, ClipboardList, Activity, Settings, LogOut, Menu, X, ChevronRight, Shield } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/stock', label: 'Stock', icon: Warehouse },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/users', label: 'Users', icon: UserCog },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/activities', label: 'Activities', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const initials = (session?.user || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-white/50 transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`} style={{ height: '100vh' }}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-violet-600 to-accent text-white shadow-[0_8px_24px_-8px_rgba(91,33,182,.5)]">
                <Shield size={20} />
              </div>
              <span className="font-display text-xl font-extrabold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Scanimart</span>
            </div>
            <button className="lg:hidden p-2 rounded-lg hover:bg-white/50" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-primary to-violet-600 text-white shadow-[0_8px_24px_-8px_rgba(91,33,182,.4)]'
                    : 'text-muted-foreground hover:bg-white/70 hover:text-primary'}`}
                  onMouseEnter={() => setHovered(item.path)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Icon size={18} className={`${isActive ? 'text-white' : hovered === item.path ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/50">
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:bg-red-50" onClick={signOut}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </Button>
            <div className="mt-3 flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{session?.user}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{session?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 glass border-b border-white/50 backdrop-blur-xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden p-2 rounded-lg hover:bg-white/50" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="flex-1 lg:flex-none">
              <h1 className="font-display text-lg font-extrabold text-foreground">
                {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Online
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}