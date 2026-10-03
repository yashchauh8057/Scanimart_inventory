import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Filter, MoreHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { money } from '../lib/utils';

const ITEMS_PER_PAGE = 10;

export function useListPage({ collection, fetchFn, columns, renderActions, title, addLabel, emptyMessage }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = fetchFn ? await fetchFn() : await api.list(collection);
      setData(result);
    } catch (error) {
      toast.error(`Failed to load ${collection}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [collection, fetchFn]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(item => {
    const matchesSearch = search === '' || Object.values(item).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    );
    const matchesFilters = Object.entries(filters).every(([key, value]) =>
      value === '' || String(item[key]).toLowerCase().includes(value.toLowerCase())
    );
    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.update(collection, editing.id, formData);
        toast.success('Updated successfully');
      } else {
        await api.create(collection, formData);
        toast.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      setFormData({});
      loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({});
    setModalOpen(true);
  };

  const openEdit = item => {
    setEditing(item);
    setFormData(item);
    setModalOpen(true);
  };

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(collection, id);
      toast.success('Deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return {
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
  };
}

export function DataTable({ columns, data, loading, renderActions, emptyMessage, onRowClick }) {
  return (
    <div className="rounded-xl border border-border bg-white/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-lavender/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                  {col.label}
                </th>
              ))}
              {renderActions && <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto animate-spin h-6 w-6 text-primary" size={24} />
                  <p className="mt-2 text-sm">Loading...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage || 'No records found'}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className={`border-t border-border/50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : ''}`} onClick={() => onRowClick?.(item)}>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.render ? col.render(item[col.key], item) : String(item[col.key] || '')}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3 text-right">
                      {renderActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in">
      <div className={`w-full ${sizes[size]} glass-strong rounded-2xl shadow-[0_24px_80px_-20px_rgba(30,27,75,.3)] border border-white/50 animate-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft size={16} /></Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}><ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}