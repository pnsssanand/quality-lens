import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Bell, Database } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout, isDemoUser } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Manufacturing Analytics
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            Plant Alpha-Main
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Synthetic Data Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
          <Database className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-medium">Synthetic Engineering Data</span>
        </div>

        {/* User Info & Role */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
              {currentUser?.displayName || currentUser?.email || 'Quality Engineer'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span>{isDemoUser ? 'Demo Access' : 'Verified Lead'}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
