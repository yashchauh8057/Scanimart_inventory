import { useState, useEffect } from 'react';
import { Receipt, Search, Edit, Trash2, DollarSign, Calendar, CreditCard, Building, Tag, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const COLUMNS = [
  { key: 'category', label: 'Category', render: (v) => <Badge variant="lavender">{v}</Badge> },
  { key: 'description', label: 'Description', render: (v) => <p className="font-semibold text-sm">{v}</p> },
  { key: 'amount', label: 'Amount', render: (v) => <span className="font-bold text-red-600">{money(v)}</span> },
  { key: 'date', label: 'Date', render: (v) => <span className="text-sm text-muted-foreground">{new Date(v).toLocaleDateString()}</span> },
  { key: 'method', label: 'Method', render: (v) => (
    <Badge variant={v === 'Bank Transfer' ? 'accent' : v === 'UPI' ? 'success' : v === 'Card' ? 'primary' : 'subtle'}>{v}</Badge>
  )},
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Paid' ? 'success' : 'warning'}>{v}</Badge> },
];

export default function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);

  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'expenses',
    columns: COLUMNS,
    title: 'Expenses',
    addLabel: 'Add Expense',
    emptyMessage: 'No expenses recorded',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

  useEffect(() => {
    setCategories([...new Set(data.map(e => e.category).filter(Boolean))]);
    setMethods([...new Set(data.map(e => e.method).filter(Boolean))]);
  }, [data]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={18} className="mr-2" /> Add Expense</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }} className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
            <option value="">All Methods</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No expenses found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category *</Label>
              <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15" required>
                <option value="">Select</option>
                <option value="Rent">Rent</option>
                <option value="Salary">Salary</option>
                <option value="Electricity">Electricity</option>
                <option value="Transport">Transport</option>
                <option value="Marketing">Marketing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Internet">Internet</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Office Rent" required />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} placeholder="45000" required />
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <select id="method" name="method" value={formData.method} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15" required>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
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