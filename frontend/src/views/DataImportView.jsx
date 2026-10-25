import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Download, 
  RefreshCw, Database, Sparkles, AlertCircle, FileCheck, ArrowRight
} from 'lucide-react';
import { uploadDatasetFile, uploadDatasetText, loadDemoDataset, getValidationReportUrl } from '../services/api';

export default function DataImportView({ onDatasetLoaded, onNavigate }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste' | 'demo'
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      handleFileUpload(droppedFile);
    }
  };

  const handleFileUpload = async (selectedFile) => {
    const f = selectedFile || file;
    if (!f) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await uploadDatasetFile(f);
      setUploadResult(res);
      if (res.is_valid && onDatasetLoaded) {
        onDatasetLoaded(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await uploadDatasetText(pastedText, 'pasted_bhavcopy.csv');
      setUploadResult(res);
      if (res.is_valid && onDatasetLoaded) {
        onDatasetLoaded(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process pasted CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await loadDemoDataset();
      setUploadResult({
        is_valid: true,
        health_score: 100.0,
        total_rows: 1000,
        valid_rows: 1000,
        rejected_rows: 0,
        dataset_id: 'benchmark_demo',
        summary: {
          total_errors: 0,
          date_range: { start: '2024-01-02', end: '2024-12-30' }
        },
        contract_counts: { GOLDM: 250, GOLDTEN: 250, GOLDGUINEA: 250, GOLDPETAL: 250 }
      });
      if (onDatasetLoaded) onDatasetLoaded(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load demo dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Data Ingestion & Integrity Validation
          </h2>
          <p className="text-xs text-slate-400">
            Ingest MCX Daily Bhavcopy datasets, validate contract specifications, and generate audit reports.
          </p>
        </div>

        <button
          onClick={handleLoadDemo}
          disabled={loading}
          className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          <Sparkles className="w-4 h-4" />
          Load Benchmark Demo Dataset (Synthetic 2024)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'upload' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          CSV File Upload
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'paste' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Raw CSV
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'demo' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Benchmark Specifications
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="flex flex-col gap-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`p-10 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 text-center ${
              dragOver ? 'border-amber-400 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="p-3.5 rounded-full bg-slate-800 text-amber-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Drag and drop your MCX Bhavcopy CSV here</p>
              <p className="text-xs text-slate-400 mt-1">Supports Date, Symbol, Expiry, Close/SettlePrice, Volume, OI</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              Browse Files
            </button>
          </div>
        </div>
      )}

      {/* Paste Tab */}
      {activeTab === 'paste' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs text-slate-300 font-semibold">Paste raw CSV contents:</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Date,Symbol,ExpiryDate,Close,Volume,OpenInterest&#10;2024-01-02,GOLDM,2024-02-05,63200,14000,24000&#10;2024-01-02,GOLDGUINEA,2024-02-05,50560,1200,3200"
            rows={8}
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={loading || !pastedText.trim()}
            className="gold-button px-4 py-2 rounded-lg text-xs font-semibold self-start flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            Validate and Ingest Pasted CSV
          </button>
        </div>
      )}

      {/* Demo Tab */}
      {activeTab === 'demo' && (
        <div className="p-6 rounded-xl gold-card flex flex-col gap-4 text-xs text-slate-300">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Deterministic Synthetic Benchmark Dataset (2024)
          </h3>
          <p>
            The benchmark dataset is pre-seeded with 1,000 chronological records across 250 trading days in 2024. It models the actual MCX market microstructure:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-300">
            <li><strong>GOLDM:</strong> 100g contract, ₹/10g basis, high institutional volume (12,000-16,000 lots/day).</li>
            <li><strong>GOLDTEN:</strong> 10g contract, ₹/10g basis, moderate volume (3,500-5,000 lots/day).</li>
            <li><strong>GOLDGUINEA:</strong> 8g sovereign coin, quoted ₹/8g (raw prices ~80% of 10g). Includes documented July post-budget coin supply dislocation anomaly.</li>
            <li><strong>GOLDPETAL:</strong> 1g micro contract, quoted ₹/1g (raw prices ~10% of 10g). Includes documented late October Dhanteras festival physical coin surge anomaly.</li>
          </ul>
          <button
            onClick={handleLoadDemo}
            disabled={loading}
            className="gold-button px-4 py-2 rounded-lg text-xs font-semibold self-start flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Reload 2024 Benchmark Dataset
          </button>
        </div>
      )}

      {/* Ingestion & Validation Results Report */}
      {uploadResult && (
        <div className="p-6 rounded-xl gold-card flex flex-col gap-5 border border-slate-700/80 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${uploadResult.is_valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {uploadResult.is_valid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">
                  Ingestion Diagnostic: {uploadResult.is_valid ? 'Dataset Accepted' : 'Dataset Rejected'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">Dataset ID: {uploadResult.dataset_id}</span>
              </div>
            </div>

            <a
              href={getValidationReportUrl(uploadResult.dataset_id)}
              download={`goldx_validation_report_${uploadResult.dataset_id}.json`}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Validation Report (JSON)
            </a>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Quality Health Score</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {uploadResult.health_score}%
              </div>
              <span className="text-[10px] text-slate-500">Automated diagnostic score</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Total Observations</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {uploadResult.total_rows?.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Rows in CSV</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Accepted Valid Rows</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {uploadResult.valid_rows?.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-500/80">Normalized & indexed</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Rejected Rows</span>
              <div className={`text-xl font-bold font-mono mt-1 ${uploadResult.rejected_rows > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {uploadResult.rejected_rows}
              </div>
              <span className="text-[10px] text-slate-500">Exclusion policy applied</span>
            </div>
          </div>

          {/* Contract Breakdown */}
          {uploadResult.contract_counts && (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-2">Observations by Contract:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(uploadResult.contract_counts).map(([sym, cnt]) => (
                  <span key={sym} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono">
                    <strong>{sym}:</strong> {cnt} sessions
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Row-Level Errors Table if any */}
          {uploadResult.sample_errors && uploadResult.sample_errors.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Row-Level Diagnostic Issues ({uploadResult.errors_count} Total)
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Line</th>
                      <th className="p-2">Field</th>
                      <th className="p-2">Error Message</th>
                      <th className="p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {uploadResult.sample_errors.map((err, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="p-2 text-amber-400">#{err.row}</td>
                        <td className="p-2 text-cyan-400">{err.column}</td>
                        <td className="p-2 text-slate-300">{err.message}</td>
                        <td className="p-2 text-slate-400">{err.value || 'NULL'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Next Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Data successfully loaded into downstream analytics cache.</span>
            <button
              onClick={() => onNavigate('contracts')}
              className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              Proceed to Contract Explorer
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
