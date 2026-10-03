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
  { key: 'name', label: 'Customer', render: (v, item) => (
    <div>
      <p className="font-semibold text-sm">{v}</p>
      <p className="text-[11px] text-muted-foreground">{item.email}</p>
    </div>
  )},
  { key: 'phone', label: 'Phone', render: (v) => <span className="text-sm font-mono">{v}</span> },
  { key: 'membership', label: 'Membership', render: (v) => (
    <Badge className="px-3 py-1" style={{ background: MEMBERSHIP_COLORS[v] || 'gray', color: v === 'Silver' ? '#1e1b4b' : 'white' }}>{v}</Badge>
  )},
  { key: 'orders', label: 'Orders', render: (v) => <Badge variant="accent">{v || 0}</Badge> },
  { key: 'totalPurchase', label: 'Total Spent', render: (v) => <span className="font-bold text-primary">{money(v)}</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : v === 'Inactive' ? 'subtle' : 'destructive'}>{v}</Badge> },
];

export default function Customers() {
  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'customers',
    columns: COLUMNS,
    title: 'Customers',
    addLabel: 'Add Customer',
    emptyMessage: 'No customers yet',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

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
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" required />
            </div>
            <div>
              <Label htmlFor="membership">Membership</Label>
              <select id="membership" name="membership" value={formData.membership} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="Regular">Regular</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={editing ? 'Leave blank to keep current' : 'Enter password'} required={!editing} />
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