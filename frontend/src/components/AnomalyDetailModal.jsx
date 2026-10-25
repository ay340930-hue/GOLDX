import React from 'react';
import { X, AlertTriangle, Calculator, History, CheckSquare, Droplets, DollarSign, ShieldAlert, FileSearch, ArrowRight } from 'lucide-react';

export default function AnomalyDetailModal({ anomaly, onClose }) {
  if (!anomaly) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 flex flex-col gap-6 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                anomaly.severity === 'CRITICAL_DEVIATION' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                anomaly.severity === 'HIGH_DEVIATION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {anomaly.severity?.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">{anomaly.date}</span>
              <span className="gold-badge text-xs">{anomaly.direction}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {anomaly.symbol_a} vs {anomaly.symbol_b} — Statistical Spread Deviation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400">Observed Spread</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${anomaly.spread >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {anomaly.spread >= 0 ? `+₹${anomaly.spread}` : `-₹${Math.abs(anomaly.spread)}`}
            </div>
            <span className="text-xs text-slate-500 font-mono">({anomaly.pct_spread > 0 ? `+${anomaly.pct_spread}` : anomaly.pct_spread}%)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400">Statistical Z-Score</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {anomaly.z_score >= 0 ? `+${anomaly.z_score}` : anomaly.z_score}σ
            </div>
            <span className="text-xs text-slate-500 font-mono">Threshold: ±{anomaly.threshold_applied}σ</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400">Analytical Basis</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">₹ / 10 grams</div>
            <span className="text-xs text-slate-500 font-mono">999 Fineness</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400">Cost-Adjusted Edge</span>
            <div className="text-sm font-semibold mt-1">
              <span className={anomaly.q6_costs?.includes('SURVIVES_COSTS') ? 'text-emerald-400' : 'text-rose-400'}>
                {anomaly.q6_costs?.includes('SURVIVES_COSTS') ? 'Survives Costs' : 'Absorbed by Costs'}
              </span>
            </div>
            <span className="text-xs text-slate-500">Round-trip friction</span>
          </div>
        </div>

        {/* 8-Point Institutional Diagnostic Cards */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-sm font-bold tracking-wider text-amber-400 uppercase flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Institutional 8-Point Explainability Diagnostic
          </h3>

          {/* 1. Observation */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">1. What did GOLDX observe?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q1_observation}</p>
            </div>
          </div>

          {/* 2. Calculation */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">2. How was it calculated?</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">{anomaly.q2_calculation}</p>
            </div>
          </div>

          {/* 3. Historical Reference */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
              <History className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">3. What historical reference was used?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q3_historical_reference}</p>
            </div>
          </div>

          {/* 4. Assumptions */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">4. What assumptions were applied?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q4_assumptions}</p>
            </div>
          </div>

          {/* 5. Liquidity & Expiry */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">5. What do liquidity and expiry tell us?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q5_liquidity_expiry}</p>
            </div>
          </div>

          {/* 6. Costs */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">6. Were transaction costs available and included?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q6_costs}</p>
            </div>
          </div>

          {/* 7. Limitations */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">7. What are the limitations?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q7_limitations}</p>
            </div>
          </div>

          {/* 8. Additional Evidence */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <FileSearch className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-slate-300">8. What additional evidence is required?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{anomaly.q8_additional_evidence}</p>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
          <strong>Responsible Analytics Note:</strong> This diagnostic is an explainable statistical observation of relative contract pricing on historical MCX data. It does not constitute investment advice or a recommendation to execute commodity futures positions.
        </div>
      </div>
    </div>
  );
}
