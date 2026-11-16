import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Save,
  X,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const RootCauseInvestigations: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Detail Modal / Active Investigation
  const [activeInv, setActiveInv] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInv, setNewInv] = useState({
    defect_category: 'Assembly Misalignment',
    product_name: '',
    production_line: 'Line Beta',
    machine_id: 'MCH-04',
    problem_description: '',
    severity: 'Medium',
    investigation_owner: 'Lead Quality Engineer',
    observed_evidence: '',
    suspected_factors: '',
  });

  const fetchInvestigations = () => {
    setLoading(true);
    api.listInvestigations({ status: statusFilter === 'ALL' ? undefined : statusFilter })
      .then((res) => {
        setInvestigations(res.data);
        // Check if query param specifies an investigation to open
        const openId = searchParams.get('open');
        if (openId && !activeInv) {
          const match = res.data.find((i: any) => String(i.id) === openId);
          if (match) setActiveInv(match);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter]);

  const handleUpdateActiveInv = async () => {
    if (!activeInv) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await api.updateInvestigation(activeInv.id, {
        investigation_status: activeInv.investigation_status,
        severity: activeInv.severity,
        investigation_owner: activeInv.investigation_owner,
        observed_evidence: activeInv.observed_evidence,
        suspected_factors: activeInv.suspected_factors,
        root_cause_hypothesis: activeInv.root_cause_hypothesis,
        verified_root_cause: activeInv.verified_root_cause,
        verification_method: activeInv.verification_method,
        corrective_action: activeInv.corrective_action,
        preventive_action: activeInv.preventive_action,
        why_steps: activeInv.why_steps,
      });
      setActiveInv(res.data);
      setSuccessMsg('Investigation & 5 Whys analysis updated successfully!');
      fetchInvestigations();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update investigation');
    } finally {
      setSaving(false);
    }
  };

  const handleWhyStepChange = (stepNumber: number, field: string, val: string) => {
    if (!activeInv) return;
    const updatedSteps = (activeInv.why_steps || []).map((s: any) => {
      if (s.step_number === stepNumber) {
        return { ...s, [field]: val };
      }
      return s;
    });
    setActiveInv({ ...activeInv, why_steps: updatedSteps });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createInvestigation(newInv);
      setShowCreateModal(false);
      setActiveInv(res.data);
      fetchInvestigations();
    } catch (err: any) {
      console.error(err);
      alert('Error creating investigation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Root Cause Investigation Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured 5 Whys causal analysis, engineering hypothesis verification, and CAPA (Corrective & Preventive Action) tracking
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation Case</span>
        </button>
      </div>

      {/* Filter and Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter by Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Open', 'Under Investigation', 'Root Cause Identified', 'Corrective Action In Progress', 'Closed'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Investigations List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Failure Category</th>
                <th className="py-3 px-4">Line / Machine</th>
                <th className="py-3 px-4">Problem Description</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {investigations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No investigations match current filter criteria.
                  </td>
                </tr>
              ) : (
                investigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {inv.investigation_reference}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.defect_category}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.production_line} / <span className="font-mono">{inv.machine_id}</span>
                    </td>
                    <td className="py-3 px-4 truncate max-w-[240px] text-slate-600">
                      {inv.problem_description}
                    </td>
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
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.investigation_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveInv(inv)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Open Dossier →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Dossier & 5 Whys Drawer / Modal */}
      {activeInv && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-blue-600">
                    {activeInv.investigation_reference}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {activeInv.defect_category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {activeInv.problem_description}
                </h2>
              </div>
              <button
                onClick={() => setActiveInv(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Status and Attributes Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Investigation Status
                </label>
                <select
                  value={activeInv.investigation_status}
                  onChange={(e) =>
                    setActiveInv({ ...activeInv, investigation_status: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-800"
                >
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Root Cause Identified">Root Cause Identified</option>
                  <option value="Corrective Action In Progress">Corrective Action In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Severity Level
                </label>
                <select
                  value={activeInv.severity}
                  onChange={(e) => setActiveInv({ ...activeInv, severity: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-800"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Investigation Owner
                </label>
                <input
                  type="text"
                  value={activeInv.investigation_owner || ''}
                  onChange={(e) =>
                    setActiveInv({ ...activeInv, investigation_owner: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Date Opened
                </label>
                <div className="text-slate-700 font-medium py-1">
                  {new Date(activeInv.date_opened).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Interactive 5 Whys Methodology Workflow */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>5 Whys Root Cause Analysis Protocol</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Systematic iterative interrogation drilling down to underlying engineering root causes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(activeInv.why_steps || []).map((step: any) => (
                  <div
                    key={step.step_number}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-sm space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                        {step.step_number}
                      </span>
                      <span>{step.question}</span>
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        placeholder="Document verified causal condition or observation..."
                        value={step.answer || ''}
                        onChange={(e) =>
                          handleWhyStepChange(step.step_number, 'answer', e.target.value)
                        }
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Supporting evidence, sensor trace, or micrometer log..."
                        value={step.evidence || ''}
                        onChange={(e) =>
                          handleWhyStepChange(step.step_number, 'evidence', e.target.value)
                        }
                        className="flex-1 text-[11px] px-2.5 py-1 border border-slate-200 rounded bg-slate-50/50 text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause Conclusion and CAPA (Corrective and Preventive Actions) */}
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-slate-900">
                CAPA: Corrective & Preventive Action Plan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verified Root Cause (Confirmed by Engineer)
                  </label>
                  <textarea
                    rows={2}
                    value={activeInv.verified_root_cause || ''}
                    onChange={(e) =>
                      setActiveInv({ ...activeInv, verified_root_cause: e.target.value })
                    }
                    placeholder="Engineering confirmation of true root cause..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verification Method Used
                  </label>
                  <textarea
                    rows={2}
                    value={activeInv.verification_method || ''}
                    onChange={(e) =>
                      setActiveInv({ ...activeInv, verification_method: e.target.value })
                    }
                    placeholder="e.g. Laser micrometer vibration test, high-speed camera, metallurgic inspection..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corrective Action (Immediate Fix)
                  </label>
                  <textarea
                    rows={2}
                    value={activeInv.corrective_action || ''}
                    onChange={(e) =>
                      setActiveInv({ ...activeInv, corrective_action: e.target.value })
                    }
                    placeholder="Direct repair, component replacement, or calibration applied..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preventive Action (Systemic Recurrence Prevention)
                  </label>
                  <textarea
                    rows={2}
                    value={activeInv.preventive_action || ''}
                    onChange={(e) =>
                      setActiveInv({ ...activeInv, preventive_action: e.target.value })
                    }
                    placeholder="ECN change, tooling redesign, automated inspection rule..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveInv(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleUpdateActiveInv}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Dossier & 5 Whys'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Investigation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Initiate Root Cause Investigation
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect Category
                </label>
                <select
                  value={newInv.defect_category}
                  onChange={(e) => setNewInv({ ...newInv, defect_category: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="Surface Scratch">Surface Scratch</option>
                  <option value="Dimensional Deviation">Dimensional Deviation</option>
                  <option value="Material Crack">Material Crack</option>
                  <option value="Assembly Misalignment">Assembly Misalignment</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Electrical Failure">Electrical Failure</option>
                  <option value="Missing Component">Missing Component</option>
                  <option value="Packaging Damage">Packaging Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Production Line & Machine ID
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newInv.production_line}
                    onChange={(e) => setNewInv({ ...newInv, production_line: e.target.value })}
                    placeholder="e.g. Line Beta"
                    className="text-xs p-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newInv.machine_id}
                    onChange={(e) => setNewInv({ ...newInv, machine_id: e.target.value })}
                    placeholder="e.g. MCH-04"
                    className="text-xs p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newInv.problem_description}
                  onChange={(e) => setNewInv({ ...newInv, problem_description: e.target.value })}
                  placeholder="Concise engineering statement of observed failure condition..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Create Case & Generate 5 Whys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
