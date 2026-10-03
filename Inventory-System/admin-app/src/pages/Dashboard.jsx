import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Clock, Box, PackageOpen, CreditCard, Shield, Settings } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const STATS = [
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'from-primary to-violet-600', bg: 'from-violet-50 to-cyan-50' },
  { key: 'totalCustomers', label: 'Customers', icon: Users, color: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50' },
  { key: 'totalSales', label: 'Total Sales', icon: ShoppingCart, color: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50' },
  { key: 'totalRevenue', label: 'Revenue', icon: DollarSign, color: 'from-cyan-500 to-blue-600', bg: 'from-cyan-50 to-blue-50' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentSales, setRecentSales] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, products, customers, sales, stock] = await Promise.all([
          api.dashboard(),
          api.products(),
          api.customers(),
          api.sales(),
          api.stock(),
        ]);
        setStats(dash);
        setRecentSales(sales.slice(0, 5).reverse());
        setRecentActivities(dash.recentActivities || []);
        setLowStock(products.filter(p => (p.stock || 0) <= (p.reorderLevel || 10)).slice(0, 5));
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = STATS.map(s => {
    const value = stats[s.key] || 0;
    const display = s.key === 'totalRevenue' ? money(value) : value;
    const trend = stats[`${s.key}Trend`];
    return (
      <Card key={s.key} variant="default" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-5" style={{ background: `linear-gradient(135deg, ${s.bg.split(' ')[1]} 0%, ${s.bg.split(' ')[3]} 100%)` }} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{display}</p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                <span className={`font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(trend)}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl text-2xl text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,.2)]" style={{ background: `linear-gradient(135deg, ${s.color.split(' ')[1]} 0%, ${s.color.split(' ')[3]} 100%)` }}>
            <s.icon size={28} />
          </div>
        </div>
      </Card>
    );
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
        <Button variant="primary" size="sm"><Box size={16} className="mr-2" /> Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Recent Sales</h2>
            <Badge variant="accent">Live</Badge>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sales yet</p>
            ) : (
              recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border hover:bg-white/80 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{sale.customer}</p>
                    <p className="text-[11px] text-muted-foreground">{sale.invoice} · {new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{money(sale.total)}</p>
                    <Badge variant={sale.payment === 'Paid' ? 'success' : sale.payment === 'Pending' ? 'warning' : 'destructive'} className="text-[10px]">{sale.payment}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Recent Activity</h2>
            <Activity size={18} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivities.slice(0, 5).map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-border hover:bg-white/80 transition-colors">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Activity size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{act.message}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Low Stock Alert</h2>
            <Badge variant="warning" className="animate-ping">{lowStock.length}</Badge>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All items well stocked</p>
            ) : (
              lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border hover:bg-white/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji || '📦'}</span>
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.category} · SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.stock} left</p>
                    <p className="text-[11px] text-muted-foreground">Reorder at {item.reorderLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="default">
          <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><PackageOpen size={24} />Add Product</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><Users size={24} />Add Customer</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><ShoppingCart size={24} />Record Sale</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><CreditCard size={24} />New Expense</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><Truck size={24} />New Purchase</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><Warehouse size={24} />Adjust Stock</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><Shield size={24} />Manage Users</Button>
            <Button variant="outline" className="h-24 flex-col gap-2 justify-center"><Settings size={24} />Settings</Button>
          </div>
        </Card>

        <Card variant="default">
          <h2 className="font-display text-lg font-bold mb-4">System Status</h2>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600"><Server size={16} /></div>
                <div>
                  <p className="font-medium text-sm">API Server</p>
                  <p className="text-[11px] text-muted-foreground">Running on port 3000</p>
                </div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Database size={16} /></div>
                <div>
                  <p className="font-medium text-sm">Firebase DB</p>
                  <p className="text-[11px] text-muted-foreground">Connected</p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-100 text-cyan-600"><Wifi size={16} /></div>
                <div>
                  <p className="font-medium text-sm">Real-time Sync</p>
                  <p className="text-[11px] text-muted-foreground">Dashboard stream active</p>
                </div>
              </div>
              <Badge variant="accent">Live</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-border">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-600"><ShieldCheck size={16} /></div>
                <div>
                  <p className="font-medium text-sm">Auth System</p>
                  <p className="text-[11px] text-muted-foreground">JWT tokens active</p>
                </div>
              </div>
              <Badge variant="success">Secure</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Server({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>; }
function Database({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>; }
function Wifi({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>; }
function ShieldCheck({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c6.6 0 12-5.5 12-12S18.6 4 12 4 0 9.5 0 15.5 5.4 21 12 21z"/><path d="M9 12l2 2 4-4"/></svg>; }