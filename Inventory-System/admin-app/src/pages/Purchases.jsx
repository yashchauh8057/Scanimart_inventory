import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Edit, Trash2, Eye, Truck, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const PAYMENT_COLORS = { Paid: 'success', Pending: 'warning', Overdue: 'destructive' };
const STATUS_COLORS = { Received: 'success', Processing: 'warning', Pending: 'subtle' };

const COLUMNS = [
  { key: 'invoice', label: 'Invoice', render: (v) => <span className="font-mono text-sm font-bold">{v}</span> },
  { key: 'supplier', label: 'Supplier', render: (v) => <p className="font-semibold text-sm">{v}</p> },
  { key: 'date', label: 'Date', render: (v) => <span className="text-sm text-muted-foreground">{new Date(v).toLocaleDateString()}</span> },
  { key: 'items', label: 'Items', render: (v) => <Badge variant="accent">{v}</Badge> },
  { key: 'total', label: 'Total', render: (v) => <span className="font-bold text-primary">{money(v)}</span> },
  { key: 'payment', label: 'Payment', render: (v) => <Badge variant={PAYMENT_COLORS[v] || 'subtle'}>{v}</Badge> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_COLORS[v] || 'subtle'}>{v}</Badge> },
];

export default function Purchases() {
  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'purchases',
    columns: COLUMNS,
    title: 'Purchases',
    addLabel: 'New Purchase',
    emptyMessage: 'No purchase orders yet',
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
          <h1 className="font-display text-2xl font-extrabold">Purchases</h1>
          <p className="text-muted-foreground">Manage purchase orders</p>
        </div>
      </div>

      <Card variant="default" className="p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search purchases..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Eye size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No purchases found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}