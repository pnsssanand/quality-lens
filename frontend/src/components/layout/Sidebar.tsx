import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Search,
  Activity,
  FileText,
  Image as ImageIcon,
  Settings,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Data Imports', path: '/imports', icon: UploadCloud },
  { name: 'Defect Analysis', path: '/defect-analysis', icon: BarChart3 },
  { name: 'Investigations (5 Whys)', path: '/investigations', icon: Search },
  { name: 'Quality Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Image Evidence', path: '/images', icon: ImageIcon },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-900 text-slate-200 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
          QL
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-tight leading-tight text-base">
            QualityLens
          </h1>
          <p className="text-[11px] text-blue-300 font-medium">Quality Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Database & Sync Status Footer */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PostgreSQL Mirror</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Relational SQL mirror synced with primary Firestore records.
        </p>
      </div>

      <div className="px-6 py-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>QualityLens v1.0</span>
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Secure
        </span>
      </div>
    </aside>
  );
};
