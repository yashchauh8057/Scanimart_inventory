import { useState, useEffect } from 'react';
import { Activity, Search, Filter, Clock, Bell, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

const ICONS = {
  'fa-box': '📦', 'fa-layer-group': '🏷️', 'fa-user': '👤', 'fa-truck': '🚚',
  'fa-file-invoice': '🧾', 'fa-cart-shopping': '🛒', 'fa-warehouse': '🏭',
  'fa-money-bill': '💰', 'fa-user-plus': '👥', 'fa-circle-check': '✅',
  'fa-clock-rotate-left': '🕐'
};

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [iconFilter, setIconFilter] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.activities();
        setActivities(data);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allIcons = [...new Set(activities.map(a => a.icon).filter(Boolean))];

  const filtered = activities.filter(act => {
    const matchesSearch = search === '' || act.message.toLowerCase().includes(search.toLowerCase());
    const matchesIcon = iconFilter === '' || act.icon === iconFilter;
    return matchesSearch && matchesIcon;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Activity Log</h1>
          <p className="text-muted-foreground">System activity and audit trail</p>
        </div>
      </div>

      <Card variant="default" className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search activities..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <select value={iconFilter} onChange={e => { setIconFilter(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
            <option value="">All Types</option>
            {allIcons.map(icon => <option key={icon} value={icon}>{ICONS[icon] || icon} {icon.replace('fa-', '').replace(/-/g, ' ')}</option>)}
          </select>
        </div>
      </Card>

      <Card variant="default">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lavender/50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Icon</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Message</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                    <p className="mt-2 text-sm">Loading activities...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">No activities found</td>
                </tr>
              ) : (
                paginated.map((act, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 text-center text-2xl">{ICONS[act.icon] || '📋'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{act.message}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} activities
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}><span>←</span></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}><span>→</span></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}