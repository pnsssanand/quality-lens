import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { KPICard } from '../components/common/KPICard';
import { FilterBar, FilterState } from '../components/common/FilterBar';
import {
  Package,
  AlertTriangle,
  Percent,
  CheckCircle2,
  Layers,
  Search,
  TrendingUp,
  BarChart2,
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const SEVERITY_COLORS = {
  Low: '#38bdf8',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#991b1b',
};

export const OverviewDashboard: React.FC = () => {
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
  const [kpis, setKpis] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [trendGrouping, setTrendGrouping] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paretoData, setParetoData] = useState<any>(null);
  const [lineComparison, setLineComparison] = useState<any[]>([]);
  const [recentInvestigations, setRecentInvestigations] = useState<any[]>([]);
  const [severityDist, setSeverityDist] = useState<any[]>([]);

  // Load filter options
  useEffect(() => {
    api.getFilterOptions()
      .then((res) => setFilterOptions(res.data))
      .catch((err) => console.error('Filter options load failed:', err));
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    setLoading(true);
    const params = {
      ...filters,
      grouping: trendGrouping,
    };

    Promise.all([
      api.getDashboardSummary(params),
      api.getDefectTrends(params),
      api.getDefectsByCategory(params),
      api.getParetoAnalysis(params),
      api.getLineComparison(params),
      api.getRecentInvestigations(),
      api.getDefectAnalysis(params),
    ])
      .then(([summaryRes, trendsRes, catRes, paretoRes, lineRes, invRes, defectRes]) => {
        setKpis(summaryRes.data);
        setTrends(trendsRes.data.points || []);
        setCategoryData(catRes.data || []);
        setParetoData(paretoRes.data);
        setLineComparison(lineRes.data || []);
        setRecentInvestigations(invRes.data || []);

        const sev = defectRes.data.severity_distribution || {};
        setSeverityDist(
          Object.entries(sev).map(([name, value]) => ({ name, value }))
        );
      })
      .catch((err) => {
        console.error('Error loading dashboard analytics:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, trendGrouping]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Engineering Quality Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time manufacturing performance indicators, defect trends and Pareto distribution
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        options={filterOptions}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Units Inspected"
          value={kpis?.total_inspected_units ? kpis.total_inspected_units.toLocaleString() : '0'}
          subtitle={`Across ${kpis?.total_inspections || 0} inspection events`}
          icon={Package}
          badge="Verified"
          badgeColor="slate"
        />
        <KPICard
          title="Defective Units"
          value={kpis?.total_defective_units ? kpis.total_defective_units.toLocaleString() : '0'}
          subtitle="Non-conforming items identified"
          icon={AlertTriangle}
          badge={kpis?.total_defective_units > 0 ? "Observed" : "Zero"}
          badgeColor={kpis?.total_defective_units > 0 ? "amber" : "emerald"}
        />
        <KPICard
          title="Overall Defect Rate"
          value={`${kpis?.overall_defect_rate || 0}%`}
          subtitle="Status: Normal (<2%), Warning (2-5%)"
          icon={Percent}
          badge={kpis?.threshold_status || "NORMAL"}
          badgeColor={
            kpis?.threshold_status === 'CRITICAL'
              ? 'rose'
              : kpis?.threshold_status === 'WARNING'
              ? 'amber'
              : 'emerald'
          }
        />
        <KPICard
          title="First Pass Yield"
          value={`${kpis?.first_pass_yield || 100}%`}
          subtitle="Initial pass without rework"
          icon={CheckCircle2}
          badge="FPY Metric"
          badgeColor="blue"
        />
        <KPICard
          title="Defect Categories"
          value={kpis?.number_of_defect_categories || 0}
          subtitle="Active failure mode classes"
          icon={Layers}
          badge="Categories"
          badgeColor="slate"
        />
        <KPICard
          title="Open Investigations"
          value={kpis?.open_investigations || 0}
          subtitle="Active 5 Whys root cause cases"
          icon={Search}
          badge={kpis?.open_investigations > 0 ? "Action Required" : "All Closed"}
          badgeColor={kpis?.open_investigations > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Charts Section: Row 1 - Defect Trend & Pareto Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Defect Trend Over Time</h2>
              <p className="text-[11px] text-slate-500">Defect rate percentage across inspection dates</p>
            </div>
            {/* Grouping Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setTrendGrouping('daily')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  trendGrouping === 'daily' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTrendGrouping('weekly')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  trendGrouping === 'weekly' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTrendGrouping('monthly')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  trendGrouping === 'monthly' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 'auto']} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Defect Rate']}
                  labelStyle={{ fontWeight: 600, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="defect_rate"
                  name="Defect Rate (%)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pareto Chart (Bars + Cumulative % Curve + 80% Threshold) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Pareto Failure Mode Analysis</h2>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  80/20 Rule
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Defect counts with cumulative contribution curve</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData?.items || []} margin={{ top: 10, right: 30, left: 0, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#64748b' }} angle={-25} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '80% Threshold', position: 'top', fill: '#dc2626', fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="defect_count" name="Defect Count" fill="#1e5284" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative_percentage" name="Cumulative %" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3, fill: '#ea580c' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 - Line Comparison & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Line Comparison */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Production Line Defect Rate Comparison</h2>
              <p className="text-[11px] text-slate-500">Benchmark defect percentages across manufacturing lines</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineComparison} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="production_line" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Defect Rate']} />
                <Bar dataKey="defect_rate" name="Defect Rate (%)" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Defect Severity Breakdown</h2>
              <p className="text-[11px] text-slate-500">Classification of logged anomalies</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {severityDist.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(SEVERITY_COLORS as any)[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 - Recent Investigations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Root Cause Investigations (5 Whys)</h2>
            <p className="text-[11px] text-slate-500">Active and recently updated failure mode investigations</p>
          </div>
          <Link
            to="/investigations"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Investigations</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Defect Category</th>
                <th className="py-3 px-4">Production Line</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Lead Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {recentInvestigations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No active root cause investigations recorded.
                  </td>
                </tr>
              ) : (
                recentInvestigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {inv.investigation_reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.defect_category}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.production_line || 'All Lines'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.severity === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : inv.severity === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {inv.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.investigation_owner}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.investigation_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/investigations?open=${inv.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Review 5 Whys →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
