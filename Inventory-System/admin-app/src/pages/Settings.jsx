import { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Palette, Globe, Key, Save, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function Settings() {
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sections = [
    {
      title: 'Profile',
      icon: User,
      fields: [
        { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'admin@scanimart.com' },
        { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 9876543210' },
      ]
    },
    {
      title: 'Security',
      icon: Shield,
      fields: [
        { key: 'currentPassword', label: 'Current Password', type: 'password', placeholder: 'Enter current password' },
        { key: 'newPassword', label: 'New Password', type: 'password', placeholder: 'Enter new password' },
        { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm new password' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      fields: [
        { key: 'emailNotifications', label: 'Email Notifications', type: 'checkbox' },
        { key: 'smsAlerts', label: 'SMS Alerts', type: 'checkbox' },
        { key: 'lowStockAlerts', label: 'Low Stock Alerts', type: 'checkbox' },
        { key: 'salesReports', label: 'Daily Sales Reports', type: 'checkbox' },
      ]
    },
    {
      title: 'System',
      icon: Database,
      fields: [
        { key: 'storeName', label: 'Store Name', type: 'text', placeholder: 'Scanimart' },
        { key: 'currency', label: 'Currency', type: 'select', options: ['INR (₹)', 'USD ($)', 'EUR (€)'] },
        { key: 'timezone', label: 'Timezone', type: 'select', options: ['Asia/Kolkata', 'UTC', 'America/New_York'] },
        { key: 'language', label: 'Language', type: 'select', options: ['English', 'Hindi', 'Gujarati'] },
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      fields: [
        { key: 'theme', label: 'Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
        { key: 'compactMode', label: 'Compact Mode', type: 'checkbox' },
        { key: 'animations', label: 'Animations', type: 'checkbox' },
      ]
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Settings</h1>
          <p className="text-muted-foreground">Configure your admin panel preferences</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="mr-2" size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {sections.map((section, idx) => (
        <Card key={idx} variant="default">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <section.icon size={20} />
            </div>
            <h2 className="font-display text-lg font-bold">{section.title}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((field, i) => (
              <div key={i} className={field.type === 'checkbox' ? 'flex items-center' : ''}>
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id={field.key}
                      className="w-4 h-4 rounded border-input bg-white text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm font-medium">Enabled</span>
                  </label>
                ) : field.type === 'select' ? (
                  <select id={field.key} className="mt-1.5 w-full h-12 rounded-xl border border-input bg-white/90 px-4 text-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15">
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <Input id={field.key} type={field.type} placeholder={field.placeholder} className="mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card variant="lavender">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-rose-800">Danger Zone</h3>
            <p className="mt-1 text-sm text-rose-700">These actions are irreversible. Please proceed with caution.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                <Database size={16} className="mr-2" /> Export All Data
              </Button>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                <Trash2 size={16} className="mr-2" /> Clear Activity Log
              </Button>
              <Button variant="destructive">
                <User size={16} className="mr-2" /> Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Scanimart Admin Panel v2.0.0 — Built with React, Tailwind CSS, and Firebase
      </div>
    </div>
  );
}