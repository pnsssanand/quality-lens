import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  days?: number;
  production_line?: string;
  machine_id?: string;
  product_name?: string;
  defect_category?: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  options: {
    production_lines: string[];
    machines: string[];
    products: string[];
    defect_categories: string[];
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, options }) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange({ ...filters, days: val === 'ALL' ? undefined : Number(val) });
  };

  const handleSelectChange = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange({ ...filters, [key]: val === 'ALL' ? undefined : val });
  };

  const handleReset = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== 'ALL');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs shrink-0">
        <Filter className="w-4 h-4 text-blue-600" />
        <span>Filter Scope:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Time Period */}
        <select
          value={filters.days !== undefined ? String(filters.days) : 'ALL'}
          onChange={handleTimeChange}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Recorded Dates</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last 12 Months</option>
        </select>

        {/* Production Line */}
        <select
          value={filters.production_line || 'ALL'}
          onChange={handleSelectChange('production_line')}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Production Lines</option>
          {options.production_lines.map((line) => (
            <option key={line} value={line}>{line}</option>
          ))}
        </select>

        {/* Machine */}
        <select
          value={filters.machine_id || 'ALL'}
          onChange={handleSelectChange('machine_id')}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Workstations / Machines</option>
          {options.machines.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Product */}
        <select
          value={filters.product_name || 'ALL'}
          onChange={handleSelectChange('product_name')}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
        >
          <option value="ALL">All Product Types</option>
          {options.products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Defect Category */}
        <select
          value={filters.defect_category || 'ALL'}
          onChange={handleSelectChange('defect_category')}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Defect Categories</option>
          {options.defect_categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
