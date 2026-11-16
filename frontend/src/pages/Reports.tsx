import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Download,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  Search,
  Sparkles
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reportTitle, setReportTitle] = useState('Quality Engineering Analytics & CAPA Intelligence Report');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    production_lines: [],
    machines: [],
    products: [],
    defect_categories: [],
  });

  const [selectedLine, setSelectedLine] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    api.getFilterOptions()
      .then((res) => setFilterOptions(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleDownload = async (format: 'pdf' | 'csv') => {
    setGenerating(true);
    try {
      const payload = {
        title: reportTitle,
        production_line: selectedLine === 'ALL' ? undefined : selectedLine,
        product_name: selectedProduct === 'ALL' ? undefined : selectedProduct,
        machine_id: selectedMachine === 'ALL' ? undefined : selectedMachine,
        defect_category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        export_format: format,
      };

      const res = await api.generateReport(payload);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QualityLens_Report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Error generating report: ' + (err.message || 'Server error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Executive Quality & CAPA Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated multi-section executive reports detailing manufacturing performance, Pareto failure mode distributions, and CAPA resolution status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Report Parameters & Scope Configuration</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Production Line Scope
              </label>
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">All Production Lines</option>
                {filterOptions.production_lines.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Machine / Assembly Station
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">All Machines</option>
                {filterOptions.machines.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800 truncate"
              >
                <option value="ALL">All Products</option>
                {filterOptions.products.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Defect Category Focus
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">All Failure Categories</option>
                {filterOptions.defect_categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Official PDF Dossier</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload('csv')}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Raw Analysis CSV</span>
            </button>
          </div>
        </div>

        {/* Report Contents Outline & Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Included Report Sections
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every generated dossier compiles actual SQL mirrored data and analytics algorithms:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><b>Executive Quality KPIs:</b> Inspected units, defect rate %, First Pass Yield (FPY).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><b>Pareto Failure Ranking:</b> 80/20 contribution curves and vital few isolation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><b>Line & Machine Comparison:</b> Station capability variance tables.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><b>CAPA Investigation Summary:</b> Verified 5 Whys hypotheses and corrective actions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span><b>Methodology Notes:</b> Transparent mathematical assumptions and dataset disclosures.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
