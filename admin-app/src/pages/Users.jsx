import { useState, useEffect } from 'react';
import { User, Search, Edit, Trash2, Shield, UserPlus, Key, Mail, Phone, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Modal, DataTable, Pagination, useListPage } from '../components/ListPage';
import { api } from '../lib/api';

const ROLE_COLORS = { Admin: 'bg-gradient-to-r from-rose-500 to-orange-500', Manager: 'bg-gradient-to-r from-primary to-violet-600', Cashier: 'bg-gradient-to-r from-emerald-500 to-green-600', Staff: 'bg-gradient-to-r from-cyan-500 to-blue-600' };

const COLUMNS = [
  { key: 'name', label: 'User', render: (v, item) => (
    <div>
      <p className="font-semibold text-sm">{v}</p>
      <p className="text-[11px] text-muted-foreground">{item.email}</p>
    </div>
  )},
  { key: 'role', label: 'Role', render: (v) => (
    <Badge className="px-3 py-1" style={{ background: ROLE_COLORS[v] || 'gray', color: 'white' }}>{v}</Badge>
  )},
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : v === 'Inactive' ? 'subtle' : 'destructive'}>{v}</Badge> },
  { key: 'lastLogin', label: 'Last Login', render: (v) => <span className="text-sm text-muted-foreground">{v || 'Never'}</span> },
];

export default function Users() {
  const { data, loading, search, setSearch, page, setPage, modalOpen, setModalOpen, editing, formData, setFormData, submitting, filtered, totalPages, paginated, handleSubmit, openCreate, openEdit, handleDelete, handleInputChange, loadData } = useListPage({
    collection: 'users',
    columns: COLUMNS,
    title: 'Users',
    addLabel: 'Add User',
    emptyMessage: 'No users yet',
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
          <h1 className="font-display text-2xl font-extrabold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and roles</p>
        </div>
        <Button variant="primary" onClick={openCreate}><UserPlus size={18} className="mr-2" /> Add User</Button>
      </div>

      <Card variant="default" className="p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
      </Card>

      <DataTable columns={COLUMNS} data={paginated} loading={loading} renderActions={(item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(item)}><Edit size={14} /></Button>
          <Button variant="ghost" size="iconSm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      )} emptyMessage="No users found" />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setFormData({}); }} title={editing ? 'Edit User' : 'Add User'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@scanimart.com" required />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="mt-1.5 h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15" required>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Staff">Staff</option>
              </select>
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
            <Label htmlFor="password">Password {editing ? '(leave blank to keep current)' : '*'}</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={editing ? '••••••••' : 'Enter password'} required={!editing} />
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