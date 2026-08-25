import { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';

const COLUMNS = [
  { key: 'emoji', label: '', render: (v) => <span className="text-xl">{v || '🏷️'}</span> },
  { key: 'name', label: 'Category', render: (v) => <p className="font-semibold text-sm">{v}</p> },
  { key: 'description', label: 'Description', render: (v) => <span className="text-sm text-muted-foreground truncate max-w-xs">{v || '—'}</span> },
  { key: 'totalProducts', label: 'Products', render: (v) => <Badge variant="accent">{v || 0}</Badge> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'subtle'}>{v}</Badge> },
];

export default function Categories() {
  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'categories',
    columns: COLUMNS,
    title: 'Categories',
    addLabel: 'Add Category',
    emptyMessage: 'No categories yet',
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
          <h1 className="font-display text-2xl font-extrabold">Categories</h1>
          <p className="text-muted-foreground">Organize your products</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={18} className="mr-2" /> Add Category</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No categories found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Dairy" required />
            </div>
            <div>
              <Label htmlFor="emoji">Emoji</Label>
              <Input id="emoji" name="emoji" value={formData.emoji} onChange={handleInputChange} placeholder="🥛" maxLength={2} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1.5 w-full rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 resize-none" placeholder="Category description..." />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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