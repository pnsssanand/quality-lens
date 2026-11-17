import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FilterBar, FilterState } from '../components/common/FilterBar';
import {
  BarChart3,
  Layers,
  AlertTriangle,
  Percent,
  CheckCircle,
  TrendingUp,
  Cpu,
  Factory,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export const DefectAnalysis: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({});
  const [filterOptions, setFilterOptions] = useState<{
    production_lines: string[];
    machines: string[];
    products: string[];
    defect_categories: string[];
  }>({
    production_lines: [],
    machines: [],
    products: [],
    defect_categories: [],
  });

  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [paretoData, setParetoData] = useState<any>(null);
  const [machineData, setMachineData] = useState<any[]>([]);

  useEffect(() => {
    api.getFilterOptions()
      .then((res) => setFilterOptions(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDefectAnalysis(filters),
      api.getParetoAnalysis(filters),
      api.getMachinePerformance(filters),
    ])
      .then(([analysisRes, paretoRes, machineRes]) => {
        setAnalysisData(analysisRes.data);
        setParetoData(paretoRes.data);
        setMachineData(machineRes.data || []);
      })
      .catch((err) => console.error('Error fetching defect analytics:', err))
      .finally(() => setLoading(false));
  }, [filters]);

  const kpis = analysisData?.kpis;
  const paretoItems = paretoData?.items || [];
  const topDefect = paretoItems.length > 0 ? paretoItems[0].category : 'None';

  // Worst machine
  const worstMachine = machineData.length > 0
    ? [...machineData].sort((a, b) => b.defect_rate - a.defect_rate)[0]
    : null;

  // Worst line
  const lines = analysisData?.production_lines || [];
  const worstLine = lines.length > 0
    ? [...lines].sort((a, b) => b.defect_rate - a.defect_rate)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Defect Analytics & Pareto Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative failure mode breakdown, cumulative Pareto ranking and machine station variation
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        options={filterOptions}
      />

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Defective Units</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis?.total_defective_units?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Non-conforming items</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">Overall Defect Rate</span>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {kpis?.overall_defect_rate || 0}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">(Defects / Inspected) * 100</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">First Pass Yield (FPY)</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {kpis?.first_pass_yield || 100}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Passing first inspection</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">Primary Failure Mode</span>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            {topDefect}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Highest frequency</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">Highest-Defect Line</span>
          <div className="text-sm font-bold text-amber-700 mt-1 truncate">
            {worstLine ? `${worstLine.production_line} (${worstLine.defect_rate}%)` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Production line variance</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500">Highest-Defect Machine</span>
          <div className="text-sm font-bold text-rose-700 mt-1 truncate">
            {worstMachine ? `${worstMachine.machine_id} (${worstMachine.defect_rate}%)` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Assembly station spike</p>
        </div>
      </div>

      {/* Pareto Distribution Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Pareto Defect Frequency & Cumulative Impact Analysis
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Mathematical 80/20 Rule
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies the critical 'vital few' failure modes accounting for approximately 80% of aggregate defects.
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoItems} margin={{ top: 20, right: 35, left: 10, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#475569' }} angle={-25} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Defects Count', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="right" y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '80% Cumulative Threshold', position: 'top', fill: '#dc2626', fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="defect_count" name="Defects Observed" fill="#1e5284" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative_percentage" name="Cumulative %" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4, fill: '#ea580c' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Vital Few Notice */}
        {paretoData?.vital_few_categories && paretoData.vital_few_categories.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Prioritized Engineering Action Target: </span>
              Failure categories <span className="font-semibold underline">{paretoData.vital_few_categories.join(', ')}</span> generate ~80% of all recorded non-conformances. Focusing corrective actions on these modes delivers the greatest yield improvement.
            </div>
          </div>
        )}
      </div>

      {/* Detailed Pareto Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Pareto Failure Mode Ranking Table</h2>
          <span className="text-xs text-slate-500 font-medium">Total Defects: {paretoData?.total_defects?.toLocaleString() || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Defect Category</th>
                <th className="py-3 px-4">Defect Count</th>
                <th className="py-3 px-4">Contribution (%)</th>
                <th className="py-3 px-4">Cumulative (%)</th>
                <th className="py-3 px-4">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {paretoItems.map((item: any, idx: number) => (
                <tr key={item.category} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                  <td className="py-3 px-4 font-semibold">{item.defect_count.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600">{item.percentage}%</td>
                  <td className="py-3 px-4 font-semibold text-amber-600">{item.cumulative_percentage}%</td>
                  <td className="py-3 px-4">
                    {item.is_vital_few ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Vital Few (80% Zone)
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        Useful Many
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
