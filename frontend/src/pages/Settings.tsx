import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  User,
  Database,
  Cloud,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Sliders
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, isDemoUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchSync = () => {
    api.getSyncStatus()
      .then((res) => setSyncStatus(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSync();
  }, []);

  const handleTriggerSync = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await api.triggerSync();
      setSyncMessage(res.data.message || 'Sync verification completed successfully!');
      fetchSync();
    } catch (err: any) {
      console.error(err);
      alert('Sync trigger failed');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Architecture & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          User identity, database synchronization health, and integrated cloud service configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Identity & Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Identity & Access</h2>
              <p className="text-[11px] text-slate-500">Firebase Authentication session credentials</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email Identifier</span>
              <span className="font-semibold text-slate-900">{currentUser?.email || 'quality.lead@demo.qualitylens.io'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">User UID</span>
              <span className="font-mono text-slate-700">{currentUser?.uid || 'demo-user-id'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Role / Clearance</span>
              <span className="font-semibold text-blue-600">Lead Quality & Automation Engineer</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Session Mode</span>
              <span className="font-semibold text-slate-700">
                {isDemoUser ? 'Demonstration Reviewer Mode' : 'Firebase Authenticated'}
              </span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Relational Mirror Synchronization */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">PostgreSQL Relational Mirror</h2>
                <p className="text-[11px] text-slate-500">Secondary structured analytical SQL replica</p>
              </div>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={syncLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>Verify Sync</span>
            </button>
          </div>

          {syncMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mirror Health Status</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{syncStatus?.status || 'HEALTHY'}</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Relational Inspection Records</span>
              <span className="font-bold text-slate-900">
                {syncStatus?.total_relational_inspections?.toLocaleString() || '1,200'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Ingestion Batches Logged</span>
              <span className="font-semibold text-slate-700">
                {syncStatus?.total_data_imports || '1'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Failed Sync Transactions</span>
              <span className="font-semibold text-slate-700">
                {syncStatus?.failed_sync_events || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cloud Services Configuration Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cloud Services Configuration</h2>
              <p className="text-[11px] text-slate-500">Integrated cloud infrastructure parameters</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Firebase Project ID</span>
              <span className="font-mono text-slate-800">quality-lens-c174e</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Firestore Primary Collections</span>
              <span className="font-semibold text-slate-700">inspections, defects, investigations, sync_logs</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cloudinary Cloud Name</span>
              <span className="font-mono text-slate-800">dlvjvskje</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Cloudinary Upload Preset</span>
              <span className="font-semibold text-slate-800">Quality lens</span>
            </div>
          </div>
        </div>

        {/* Portfolio Architecture Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Architecture Rationale</h2>
              <p className="text-[11px] text-slate-500">Engineering Quality Analytics System Design</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            <b>Why Dual-Store Architecture?</b> Firebase Firestore acts as the flexible document store for reactive web state, user profiles, and image metadata. PostgreSQL acts as the relational analytical mirror where window functions, grouping, and aggregations compute high-speed analytical KPIs without costly collection scans.
          </p>

          <p className="text-xs text-slate-600 leading-relaxed">
            <b>Synthetic Data Policy:</b> In strict compliance with engineering ethics, all inspection records and failure modes are synthetic demonstration models created specifically for technical portfolio evaluation.
          </p>
        </div>
      </div>
    </div>
  );
};
