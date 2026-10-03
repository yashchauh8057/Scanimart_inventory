import { useState, useEffect } from 'react';
import { ClipboardList, Search, Edit, Trash2, Eye, Package, User, DollarSign, Calendar, CreditCard, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const STATUS_COLORS = { Delivered: 'success', Pending: 'warning', Cancelled: 'destructive' };

const COLUMNS = [
  { key: 'customer', label: 'Customer', render: (v) => <p className="font-semibold text-sm">{v}</p> },
  { key: 'product', label: 'Product', render: (v) => (
    <div>
      <p className="font-semibold text-sm">{v}</p>
      <p className="text-[11px] text-muted-foreground">Electronics</p>
    </div>
  )},
  { key: 'category', label: 'Category', render: (v) => <Badge variant="lavender">{v}</Badge> },
  { key: 'total', label: 'Total', render: (v) => <span className="font-bold text-primary">{money(v)}</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_COLORS[v] || 'subtle'}>{v}</Badge> },
  { key: 'createdAt', label: 'Date', render: (v) => <span className="text-sm text-muted-foreground">{new Date(v).toLocaleDateString()}</span> },
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [statuses] = useState(['Delivered', 'Pending', 'Cancelled']);

  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'orders',
    columns: COLUMNS,
    title: 'Orders',
    addLabel: 'Create Order',
    emptyMessage: 'No orders yet',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Eye size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
      </div>

      <Card variant="default" className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Eye size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No orders found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}