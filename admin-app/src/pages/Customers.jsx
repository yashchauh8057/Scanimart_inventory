import { useState, useEffect } from 'react';
import { User, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const MEMBERSHIP_COLORS = { Premium: 'bg-gradient-to-r from-rose-500 to-orange-500', Gold: 'bg-gradient-to-r from-amber-500 to-yellow-500', Silver: 'bg-gradient-to-r from-gray-400 to-gray-500', Regular: 'bg-gray-200' };

const COLUMNS = [
  { key: 'name', label: 'Live User', render: (v, item) => (
    <div>
      <p className="font-semibold text-sm">{v}</p>
      <p className="text-[11px] text-muted-foreground">{item.email}</p>
    </div>
  )},
  { key: 'role', label: 'Role', render: (v) => <Badge variant="accent">{v || 'User'}</Badge> },
  { key: 'provider', label: 'Provider', render: (v) => <Badge variant={v === 'google' ? 'success' : 'subtle'}>{v === 'google' ? 'Google' : 'Local'}</Badge> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : v === 'Inactive' ? 'subtle' : 'destructive'}>{v || 'Active'}</Badge> },
  { key: 'lastLogin', label: 'Last Login', render: (v) => <span className="text-sm">{v || 'Never'}</span> },
  { key: 'lastAction', label: 'Latest Action', render: (v, item) => (
    <div>
      <p className="text-sm">{v || 'No activity yet'}</p>
      {item.lastActionAt && <p className="text-[11px] text-muted-foreground">{new Date(item.lastActionAt).toLocaleString()}</p>}
    </div>
  )},
  { key: 'createdAt', label: 'Joined', render: (v) => <span className="text-sm">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
];

export default function Customers() {
  const { data, setData, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'users',
    fetchFn: async () => {
      const users = await api.users();
      return users.filter(u => String(u.role || '').toLowerCase() === 'user');
    },
    columns: COLUMNS,
    title: 'Customers',
    addLabel: 'Add Customer',
    emptyMessage: 'No live Google/local customers yet',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

  useEffect(() => {
    const stream = api.usersStream();
    const refreshCustomers = () => {
      api.users()
        .then(users => setData(users.filter(u => String(u.role || '').toLowerCase() === 'user')))
        .catch(() => {});
    };
    stream.onmessage = event => {
      try {
        setData(JSON.parse(event.data));
      } catch { /* Ignore malformed stream events and keep the last good list. */ }
    };
    stream.onerror = () => {
      // EventSource automatically retries; the existing list remains usable while it reconnects.
    };
    const fallbackTimer = window.setInterval(refreshCustomers, 5000);
    return () => {
      stream.close();
      window.clearInterval(fallbackTimer);
    };
  }, [setData]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Customers</h1>
          <p className="text-muted-foreground">Manage customer accounts</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={18} className="mr-2" /> Add Customer</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No customers found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" value={formData.role || 'User'} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Security">Security</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status || 'Active'} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <Label htmlFor="provider">Provider</Label>
              <select id="provider" name="provider" value={formData.provider || 'local'} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="local">Local</option>
                <option value="google">Google</option>
              </select>
            </div>
            {!editing && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Enter password" required />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditing(null); setFormData({}); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
