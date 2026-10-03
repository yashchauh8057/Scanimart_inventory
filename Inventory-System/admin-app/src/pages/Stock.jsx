import { useState, useEffect } from 'react';
import { Warehouse, Search, Edit, Trash2, AlertTriangle, Plus, Minus, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';

const COLUMNS = [
  { key: 'product', label: 'Product', render: (v) => <p className="font-semibold text-sm">{v}</p> },
  { key: 'category', label: 'Category', render: (v) => <Badge variant="lavender">{v}</Badge> },
  { key: 'available', label: 'Available', render: (v, item) => (
    <span className={`font-bold ${v <= (item.minimum || 10) ? 'text-red-600' : 'text-emerald-600'}`}>
      {v} {v <= (item.minimum || 10) && <AlertTriangle size={10} className="inline ml-1" />}
    </span>
  )},
  { key: 'minimum', label: 'Min Level', render: (v) => <span className="text-sm font-mono">{v}</span> },
  { key: 'warehouse', label: 'Warehouse', render: (v) => <Badge variant="accent">{v}</Badge> },
  { key: 'status', label: 'Status', render: (v) => (
    <Badge variant={v === 'In Stock' ? 'success' : v === 'Low Stock' ? 'warning' : 'destructive'}>
      {v}
    </Badge>
  )},
];

export default function Stock() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filters, setFilters, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'stock',
    columns: COLUMNS,
    title: 'Stock',
    addLabel: 'Add Stock Item',
    emptyMessage: 'No stock items yet',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

  const allStatuses = [...new Set(data.map(s => s.status).filter(Boolean))];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Stock Management</h1>
          <p className="text-muted-foreground">Monitor inventory levels</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={18} className="mr-2" /> Add Stock Item</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search stock..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => handleFilterChange('status', e.target.value)} className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
            <option value="">All Status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No stock items found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit Stock Item' : 'Add Stock Item'}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="product">Product *</Label>
              <Input id="product" name="product" value={formData.product} onChange={handleInputChange} placeholder="Product name" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="Category" />
            </div>
            <div>
              <Label htmlFor="available">Available Stock *</Label>
              <Input id="available" name="available" type="number" value={formData.available} onChange={handleInputChange} placeholder="100" required />
            </div>
            <div>
              <Label htmlFor="minimum">Minimum Level *</Label>
              <Input id="minimum" name="minimum" type="number" value={formData.minimum} onChange={handleInputChange} placeholder="10" required />
            </div>
            <div>
              <Label htmlFor="warehouse">Warehouse *</Label>
              <select id="warehouse" name="warehouse" value={formData.warehouse} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15" required>
                <option value="W1">Warehouse 1</option>
                <option value="W2">Warehouse 2</option>
                <option value="W3">Warehouse 3</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out Of Stock">Out Of Stock</option>
              </select>
            </div>
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