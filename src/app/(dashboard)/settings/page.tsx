'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useApplicationStore } from '@/store/application.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User, 
  Database, 
  Download, 
  Trash2, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { applications, fetchApplications } = useApplicationStore();
  const [isResetting, setIsResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Export full JSON Backup
  const exportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
      applications: applications,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `jobtrack_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleResetData = async () => {
    if (!confirm('CRITICAL WARNING: This will delete ALL your job applications, stages logs, reminders, and notes permanently. This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setIsResetting(true);
    try {
      // Loop and delete each application via endpoint
      for (const app of applications) {
        await fetch(`/api/applications/${app.id}`, { method: 'DELETE' });
      }
      await fetchApplications();
      setSuccessMsg('All application data has been successfully wiped.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage account information, data configuration, and backup operations.</p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-700">
          {successMsg}
        </div>
      )}

      <div className="surface-card space-y-6 rounded-3xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <User size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Account Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="profileName"
            label="Name"
            value={user?.name || 'User'}
            disabled
            className="opacity-70"
          />
          <Input
            id="profileEmail"
            label="Email Address"
            value={user?.email || ''}
            disabled
            className="opacity-70"
          />
        </div>
      </div>

      <div className="surface-card space-y-6 rounded-3xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Database size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Database & Server Connections</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            <p className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck size={14} className="text-emerald-600" /> Active Configuration: PostgreSQL
            </p>
            <p className="leading-relaxed">
              Database operations are initialized using the <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-indigo-700">DATABASE_URL</code> environment variable in your root <code className="font-semibold text-slate-700">.env</code>.
            </p>
            <p className="leading-relaxed">
              To spin up a local PostgreSQL database container easily, you can execute:
              <br />
              <code className="mt-1.5 block w-fit rounded-xl border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">
                docker compose up -d
              </code>
            </p>
            <p className="mt-2 leading-relaxed text-slate-500">
              Note: Database schema migrations are handled by Prisma. Apply new schema migrations with <code className="font-semibold text-indigo-700">npx prisma db push</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card space-y-6 rounded-3xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Download size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Import / Export Backup Data</h3>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-500">
          <p>
            Keep records safe. You can export a full copy of your applications, logs, notes, and profile details as a single structured JSON file.
          </p>
          <Button variant="glass" onClick={exportFullBackup} className="gap-2 text-xs">
            <Download size={14} /> Download JSON Backup
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
          <AlertTriangle size={18} className="text-rose-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Danger Zone</h3>
        </div>

        <div className="space-y-4 pt-6">
          <p className="text-sm leading-normal text-slate-500">
            Permanently erase all your job tracking details. This operation removes all database entries associated with your applications logs, stages, and reminders.
          </p>
          <Button 
            variant="danger" 
            onClick={handleResetData} 
            isLoading={isResetting} 
            className="gap-2 text-xs"
            disabled={applications.length === 0}
          >
            <Trash2 size={14} /> Reset Application Data
          </Button>
        </div>
      </div>

    </div>
  );
}
