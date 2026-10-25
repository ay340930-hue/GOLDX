import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Filter, Search, FileSearch, ArrowRight, 
  DollarSign, RefreshCw, CheckCircle2, ShieldAlert, Sparkles
} from 'lucide-react';
import { fetchAnomalies } from '../services/api';
import AnomalyDetailModal from '../components/AnomalyDetailModal';

export default function AnomalyAnalysisView({ onNavigate, selectedAnomaly, setSelectedAnomaly }) {
  const [symbolA, setSymbolA] = useState('GOLDM');
  const [symbolB, setSymbolB] = useState('GOLDGUINEA');
  const [threshold, setThreshold] = useState(2.0);
  const [costPer10g, setCostPer10g] = useState(90.0);
  const [allPairs, setAllPairs] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalAnomaly, setActiveModalAnomaly] = useState(null);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const res = await fetchAnomalies(symbolA, symbolB, 30, threshold, costPer10g, allPairs);
      if (res.anomalies) setAnomalies(res.anomalies);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [symbolA, symbolB, threshold, costPer10g, allPairs]);

  useEffect(() => {
    if (selectedAnomaly) {
      setActiveModalAnomaly(selectedAnomaly);
    }
  }, [selectedAnomaly]);

  const filtered = anomalies.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.date.toLowerCase().includes(term) ||
      a.symbol_a.toLowerCase().includes(term) ||
      a.symbol_b.toLowerCase().includes(term) ||
      a.severity.toLowerCase().includes(term) ||
      a.direction.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Explainable Historical Anomaly Analysis
          </h2>
          <p className="text-xs text-slate-400">
            Institutional 8-point diagnostics explaining why statistical spread dislocations occurred and whether they survived costs.
          </p>
        </div>

        <button
          onClick={() => onNavigate('backtesting')}
          className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          Validate in Walk-Forward Lab
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Control Bar */}
      <div className="p-5 rounded-xl gold-card flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* All Pairs Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllPairs(!allPairs)}
              className={`px-3 py-2 rounded-lg font-semibold border transition-colors flex items-center gap-1.5 ${
                allPairs ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {allPairs ? 'Scanning All Contract Pairs' : 'Scanning Single Pair'}
            </button>
          </div>

          {!allPairs && (
            <div className="flex items-center gap-2">
              <select
                value={symbolA}
                onChange={(e) => setSymbolA(e.target.value)}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
              >
                <option value="GOLDM">GOLDM</option>
                <option value="GOLDTEN">GOLDTEN</option>
                <option value="GOLDGUINEA">GOLDGUINEA</option>
                <option value="GOLDPETAL">GOLDPETAL</option>
              </select>
              <span className="text-slate-500 font-bold">vs</span>
              <select
                value={symbolB}
                onChange={(e) => setSymbolB(e.target.value)}
                className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
              >
                <option value="GOLDGUINEA">GOLDGUINEA</option>
                <option value="GOLDTEN">GOLDTEN</option>
                <option value="GOLDM">GOLDM</option>
                <option value="GOLDPETAL">GOLDPETAL</option>
              </select>
            </div>
          )}

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search date, contract..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          {/* Z-Score Threshold Slider */}
          <div className="flex flex-col gap-1 min-w-44">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Anomaly Threshold:</span>
              <strong className="text-amber-400 font-mono">±{threshold.toFixed(1)}σ</strong>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Cost Hurdle Input */}
          <div className="flex flex-col gap-1 min-w-36">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Cost Hurdle:</span>
              <strong className="text-emerald-400 font-mono">₹{costPer10g}/10g</strong>
            </div>
            <input
              type="number"
              value={costPer10g}
              onChange={(e) => setCostPer10g(parseFloat(e.target.value) || 0)}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-white font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* Anomaly Table */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-cyan-400" />
              Detected Statistical Dislocation Events ({filtered.length} Flagged)
            </h3>
            <p className="text-xs text-slate-400">Click any event to open the institutional 8-point diagnostic deep-dive</p>
          </div>

          <span className="gold-badge text-xs font-mono">
            Lookback: 30 sessions | Zero look-ahead bias
          </span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
            Scanning historical bhavcopy observations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>No historical anomalies detected exceeding ±{threshold}σ under current filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3">Event Date</th>
                  <th className="p-3">Contract Pair</th>
                  <th className="p-3">Observed Spread</th>
                  <th className="p-3">Spread %</th>
                  <th className="p-3">Z-Score</th>
                  <th className="p-3">Deviation Severity</th>
                  <th className="p-3">Cost-Adjusted Feasibility</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filtered.map((anom, i) => {
                  const survivesCost = anom.q6_costs?.includes('SURVIVES_COSTS');
                  return (
                    <tr 
                      key={i} 
                      onClick={() => setActiveModalAnomaly(anom)}
                      className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-white">{anom.date}</td>
                      <td className="p-3 font-bold text-cyan-400">{anom.symbol_a} - {anom.symbol_b}</td>
                      <td className={`p-3 font-bold ${anom.spread >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {anom.spread >= 0 ? `+₹${anom.spread}` : `-₹${Math.abs(anom.spread)}`}
                      </td>
                      <td className="p-3">{anom.pct_spread > 0 ? `+${anom.pct_spread}` : anom.pct_spread}%</td>
                      <td className="p-3 font-bold text-amber-400">{anom.z_score >= 0 ? `+${anom.z_score}` : anom.z_score}σ</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          anom.severity === 'CRITICAL_DEVIATION' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' :
                          anom.severity === 'HIGH_DEVIATION' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                          'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        }`}>
                          {anom.severity?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-max ${
                          survivesCost ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {survivesCost ? 'Survives Friction' : 'Absorbed by Costs'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalAnomaly(anom);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors text-[11px]"
                        >
                          Explain Why ➔
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep-dive 8-Point Explainability Modal */}
      {activeModalAnomaly && (
        <AnomalyDetailModal
          anomaly={activeModalAnomaly}
          onClose={() => {
            setActiveModalAnomaly(null);
            if (setSelectedAnomaly) setSelectedAnomaly(null);
          }}
        />
      )}
    </div>
  );
}
