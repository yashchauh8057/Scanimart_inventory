import { useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, Tag, Barcode, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const COLUMNS = [
  { key: 'emoji', label: '', render: (v) => <span className="text-xl">{v || '📦'}</span> },
  { key: 'name', label: 'Product', render: (v, item) => (
    <div>
      <p className="font-semibold text-sm">{v}</p>
      <p className="text-[11px] text-muted-foreground">{item.brand} · {item.category}</p>
    </div>
  )},
  { key: 'sku', label: 'SKU', render: (v) => <span className="font-mono text-xs text-muted-foreground">{v}</span> },
  { key: 'price', label: 'Price', render: (v) => <span className="font-bold text-primary">{money(v)}</span> },
  { key: 'mrp', label: 'MRP', render: (v, item) => v > item.price ? <span className="text-[11px] line-through text-muted-foreground">{money(v)}</span> : <span className="text-[11px] text-muted-foreground">—</span> },
  { key: 'stock', label: 'Stock', render: (v, item) => (
    <span className={`font-bold ${v <= (item.reorderLevel || 10) ? 'text-red-600' : 'text-emerald-600'}`}>
      {v} {v <= (item.reorderLevel || 10) && <AlertTriangle size={10} className="inline ml-1" />}
    </span>
  )},
  { key: 'reorderLevel', label: 'Reorder' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'subtle'}>{v}</Badge> },
];

export default function Products() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const {
    data,
    loading,
    search,
    setSearch,
    page,
    setPage,
    modalOpen,
    setModalOpen,
    editing,
    formData,
    setFormData,
    submitting,
    filters,
    setFilters,
    filtered,
    totalPages,
    paginated,
    handleSubmit,
    openCreate,
    openEdit,
    handleDelete,
    handleInputChange,
    loadData,
  } = useListPage({
    collection: 'products',
    columns: COLUMNS,
    title: 'Products',
    addLabel: 'Add Product',
    emptyMessage: 'No products found. Add your first product!',
    renderActions: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="iconSm" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Edit size={14} /></Button>
        <Button variant="ghost" size="iconSm" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
      </div>
    ),
  });

  const allCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
  const allBrands = [...new Set(data.map(p => p.brand).filter(Boolean))];

  useEffect(() => {
    setCategories(allCategories);
    setBrands(allBrands);
  }, [data]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={18} className="mr-2" /> Add Product</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, brand..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={brandFilter}
            onChange={e => handleFilterChange('brand', e.target.value)}
            className="h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </Card>

      <DataTable
        columns={COLUMNS}
        data={paginated}
        loading={loading}
        renderActions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
            <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
          </div>
        )}
        emptyMessage="No products found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Amul Butter 500g" required />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Auto-generated" disabled />
            </div>
            <div>
              <Label htmlFor="emoji">Emoji</Label>
              <Input id="emoji" name="emoji" value={formData.emoji} onChange={handleInputChange} placeholder="🧈" maxLength={2} />
            </div>
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="e.g., Amul" required />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15" required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="280" required />
            </div>
            <div>
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input id="mrp" name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleInputChange} placeholder="310" />
            </div>
            <div>
              <Label htmlFor="stock">Stock *</Label>
              <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="48" required />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleInputChange} placeholder="10" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1.5 w-full rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 resize-none" placeholder="Product description..." />
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