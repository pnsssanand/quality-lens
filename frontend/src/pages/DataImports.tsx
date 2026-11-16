import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  Copy,
  AlertCircle
} from 'lucide-react';

export const DataImports: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchImports = () => {
    api.listImports()
      .then((res) => setImportHistory(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationData(null);
      setCommitSuccess(null);
      setErrorMsg(null);
    }
  };

  const handleValidateUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    setCommitSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadCSV(formData);
      setValidationData(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Validation request failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!validationData?.import_id) return;
    setCommitLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.commitImport(validationData.import_id);
      setCommitSuccess(`Successfully committed and mirrored ${res.data.created} new inspection records to PostgreSQL!`);
      setValidationData(null);
      setFile(null);
      fetchImports();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Commit failed');
    } finally {
      setCommitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Data Ingestion & Dataset Validation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload engineering inspection CSV files with strict schema validation, anomaly detection, and PostgreSQL synchronization
          </p>
        </div>

        {/* Download CSV Template */}
        <a
          href={api.downloadTemplateUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Download Inspection CSV Template</span>
        </a>
      </div>

      {commitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{commitSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Ingest Inspection Dataset</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select or drag-and-drop a CSV dataset containing inspection IDs, dates, products, production lines, machine IDs, inspected units, and defect classes.
        </p>

        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="csv-file-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{file ? file.name : 'Select CSV Dataset File'}</span>
          </label>
          <p className="text-[11px] text-slate-400 mt-2">
            Standard UTF-8 formatted CSV up to 25 MB
          </p>
        </div>

        {file && !validationData && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setFile(null)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleValidateUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating Dataset...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Run Validation Check</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Validation Results & Preview Section */}
      {validationData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Rows Uploaded</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {validationData.report.total_records}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Valid Records</span>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {validationData.report.valid_records_count}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-700">Invalid Records</span>
              <div className="text-xl font-bold text-rose-800 mt-1">
                {validationData.report.invalid_records_count}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-700">Duplicates Detected</span>
              <div className="text-xl font-bold text-amber-800 mt-1">
                {validationData.report.duplicate_records_count}
              </div>
            </div>
          </div>

          {/* Validation Errors Table (if any) */}
          {validationData.report.errors && validationData.report.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-rose-900">
                    Validation Errors Report ({validationData.report.errors.length} issues identified)
                  </h3>
                </div>
                <span className="text-[11px] text-rose-700 font-medium">
                  Invalid records are safely quarantined and not imported
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Row #</th>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">Value Found</th>
                      <th className="py-2.5 px-4">Validation Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {validationData.report.errors.map((err: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/30">
                        <td className="py-2 px-4 font-mono font-semibold text-slate-900">{err.row_number}</td>
                        <td className="py-2 px-4 font-mono text-blue-600">{err.field}</td>
                        <td className="py-2 px-4 font-mono text-slate-500 truncate max-w-[150px]">{String(err.invalid_value)}</td>
                        <td className="py-2 px-4 text-rose-700">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview of Valid Records */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Data Preview</h3>
                <p className="text-[11px] text-slate-500">Sample of validated records parsed from CSV</p>
              </div>

              {/* Commit Button */}
              {validationData.ready_to_commit && (
                <button
                  onClick={handleCommit}
                  disabled={commitLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {commitLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Writing to Database & Syncing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Commit {validationData.report.valid_records_count} Valid Records</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Inspection ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Line</th>
                    <th className="py-2.5 px-3">Machine</th>
                    <th className="py-2.5 px-3">Inspected</th>
                    <th className="py-2.5 px-3">Defective</th>
                    <th className="py-2.5 px-3">Defect Category</th>
                    <th className="py-2.5 px-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {validationData.report.preview_records.map((rec: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium text-blue-600">{rec.inspection_id}</td>
                      <td className="py-2 px-3 text-slate-600">{rec.inspection_date}</td>
                      <td className="py-2 px-3 truncate max-w-[120px]">{rec.product_name}</td>
                      <td className="py-2 px-3">{rec.production_line}</td>
                      <td className="py-2 px-3 font-mono">{rec.machine_id}</td>
                      <td className="py-2 px-3 font-semibold">{rec.units_inspected}</td>
                      <td className="py-2 px-3 font-semibold text-rose-600">{rec.defective_units}</td>
                      <td className="py-2 px-3">{rec.defect_category}</td>
                      <td className="py-2 px-3">{rec.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Imports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ingestion History</h2>
            <p className="text-[11px] text-slate-500">Audit trail of previously ingested datasets</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Import ID</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Total Records</th>
                <th className="py-3 px-4">Valid Imported</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Imported At</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {importHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No historical imports found.
                  </td>
                </tr>
              ) : (
                importHistory.map((imp) => (
                  <tr key={imp.import_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">{imp.import_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{imp.filename}</span>
                    </td>
                    <td className="py-3 px-4">{imp.total_records.toLocaleString()}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{imp.valid_records.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {imp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(imp.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{imp.uploaded_by || 'Engineer'}</td>
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
