import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Bell,
  Save,
  Radio,
  Cpu,
  RefreshCw,
  Info
} from 'lucide-react';

export const QualityMonitoring: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [thresholds, setThresholds] = useState({ normal_max: 2.0, warning_max: 5.0 });
  const [loading, setLoading] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempThresholds, setTempThresholds] = useState({ normal_max: 2.0, warning_max: 5.0 });
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const fetchMonitoring = () => {
    setLoading(true);
    api.getMonitoringStatus()
      .then((res) => {
        setMonitoringData(res.data);
        if (res.data.thresholds) {
          setThresholds(res.data.thresholds);
          setTempThresholds(res.data.thresholds);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThresholds(true);
    try {
      await api.updateThresholds(tempThresholds);
      setThresholds(tempThresholds);
      setShowConfigModal(false);
      setAlertSuccess('Quality threshold parameters updated across system!');
      fetchMonitoring();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  const stations = monitoringData?.stations || [];
  const criticalCount = monitoringData?.critical_alerts_count || 0;
  const warningCount = monitoringData?.warning_alerts_count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Process Quality & Station Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of assembly stations against statistical warning and critical defect rate limits
          </p>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Configure Threshold Limits</span>
        </button>
      </div>

      {alertSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Threshold Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Normal Range</span>
            <div className="text-lg font-bold text-slate-900">
              0% — {thresholds.normal_max}%
            </div>
            <p className="text-[10px] text-slate-400">Process running within standard capability</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-700">Warning Threshold</span>
            <div className="text-lg font-bold text-amber-900">
              {thresholds.normal_max}% — {thresholds.warning_max}%
            </div>
            <p className="text-[10px] text-amber-700">{warningCount} stations in warning state</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
            <Radio className="w-5 h-5 animate-pulse text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-rose-700">Critical Alerts</span>
            <div className="text-lg font-bold text-rose-900">
              &gt; {thresholds.warning_max}%
            </div>
            <p className="text-[10px] text-rose-700">{criticalCount} stations breaching threshold</p>
          </div>
        </div>
      </div>

      {/* Real-time Alert Banner if critical breaches exist */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Process Threshold Breach Notification</h4>
            <p className="mt-0.5 text-rose-800">
              {criticalCount} manufacturing stations are currently operating with defect rates exceeding the configured critical boundary ({thresholds.warning_max}%). Immediate inspection and fixture verification is recommended.
            </p>
          </div>
        </div>
      )}

      {/* Assembly Workstations Monitoring Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Station & Machine Performance Monitor</h2>
            <p className="text-[11px] text-slate-500">Live capability tracking derived from imported inspection records</p>
          </div>
          <button
            onClick={fetchMonitoring}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Station ID</th>
                <th className="py-3 px-4">Production Line</th>
                <th className="py-3 px-4">Inspected Units</th>
                <th className="py-3 px-4">Defective Units</th>
                <th className="py-3 px-4">Defect Rate</th>
                <th className="py-3 px-4">Primary Defect</th>
                <th className="py-3 px-4">Quality Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {stations.map((st: any) => (
                <tr
                  key={st.machine_id}
                  className={`hover:bg-slate-50 transition-colors ${
                    st.status === 'CRITICAL' ? 'bg-rose-50/20' : st.status === 'WARNING' ? 'bg-amber-50/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>{st.machine_id}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{st.production_line}</td>
                  <td className="py-3 px-4 font-semibold">{st.units_inspected.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-rose-600">{st.defective_units.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{st.defect_rate}%</td>
                  <td className="py-3 px-4 text-slate-600">{st.top_defect_category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : st.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                    {st.last_updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Configuration Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Configure Quality Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Define the percentage boundaries for standard operating limits, warning alerts, and critical breach flags.
            </p>

            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Normal Ceiling / Warning Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tempThresholds.normal_max}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      normal_max: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Defect rates above this value will trigger Warning state. Default: 2.0%
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Critical Ceiling Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tempThresholds.warning_max}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      warning_max: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Defect rates above this value will trigger Critical alerts. Default: 5.0%
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingThresholds}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingThresholds ? 'Saving...' : 'Apply Thresholds'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
