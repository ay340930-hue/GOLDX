import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Sliders, AlertTriangle, ArrowRight, Activity, 
  HelpCircle, RefreshCw, BarChart2, ShieldCheck
} from 'lucide-react';
import InteractiveSpreadChart from '../components/charts/InteractiveSpreadChart';
import ZScoreTimelineChart from '../components/charts/ZScoreTimelineChart';
import { fetchRelativeValue } from '../services/api';

export default function RelativeValueView({ onNavigate, onSelectAnomaly }) {
  const [symbolA, setSymbolA] = useState('GOLDM');
  const [symbolB, setSymbolB] = useState('GOLDGUINEA');
  const [lookbackWindow, setLookbackWindow] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetchRelativeValue(symbolA, symbolB, lookbackWindow);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setData(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load relative value data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [symbolA, symbolB, lookbackWindow]);

  const series = data?.data || [];
  const latest = series[series.length - 1];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Cross-Contract Relative-Value & Spread Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Compare normalized price differentials, rolling statistical distributions, and historical Z-scores.
          </p>
        </div>

        <button
          onClick={() => onNavigate('anomalies')}
          className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          Inspect Flagged Anomalies
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Control Panel: Pair & Lookback Selection */}
      <div className="p-5 rounded-xl gold-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 text-xs w-full md:w-auto">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Leg A (Long / Reference)</label>
            <select
              value={symbolA}
              onChange={(e) => setSymbolA(e.target.value)}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono min-w-36"
            >
              <option value="GOLDM" disabled={symbolB === 'GOLDM'}>GOLDM (Gold Mini)</option>
              <option value="GOLDTEN" disabled={symbolB === 'GOLDTEN'}>GOLDTEN (Gold 10g)</option>
              <option value="GOLDGUINEA" disabled={symbolB === 'GOLDGUINEA'}>GOLDGUINEA (Guinea)</option>
              <option value="GOLDPETAL" disabled={symbolB === 'GOLDPETAL'}>GOLDPETAL (Petal)</option>
            </select>
          </div>

          <span className="text-slate-600 font-bold self-end pb-2.5">VS</span>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Leg B (Short / Counter)</label>
            <select
              value={symbolB}
              onChange={(e) => setSymbolB(e.target.value)}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono min-w-36"
            >
              <option value="GOLDGUINEA" disabled={symbolA === 'GOLDGUINEA'}>GOLDGUINEA (Guinea)</option>
              <option value="GOLDTEN" disabled={symbolA === 'GOLDTEN'}>GOLDTEN (Gold 10g)</option>
              <option value="GOLDM" disabled={symbolA === 'GOLDM'}>GOLDM (Gold Mini)</option>
              <option value="GOLDPETAL" disabled={symbolA === 'GOLDPETAL'}>GOLDPETAL (Petal)</option>
            </select>
          </div>
        </div>

        {/* Lookback Slider */}
        <div className="flex flex-col gap-1.5 w-full md:w-72">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Rolling Lookback Window (W):
            </span>
            <strong className="text-amber-400 font-mono">{lookbackWindow} sessions</strong>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={lookbackWindow}
            onChange={(e) => setLookbackWindow(parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 font-mono">
            Zero look-ahead bias: statistics at t computed over [t-W, t]
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Statistical Summary Tiles */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Current Spread</span>
            <div className={`text-xl font-bold font-mono ${latest.Spread >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {latest.Spread >= 0 ? `+₹${latest.Spread}` : `-₹${Math.abs(latest.Spread)}`}
            </div>
            <span className="text-[10px] text-slate-500">₹ / 10g Basis</span>
          </div>

          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Percentage Spread</span>
            <div className={`text-xl font-bold font-mono ${latest.PctSpread >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {latest.PctSpread >= 0 ? `+${latest.PctSpread}` : latest.PctSpread}%
            </div>
            <span className="text-[10px] text-slate-500">% of mid price</span>
          </div>

          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Rolling Mean (μ)</span>
            <div className="text-xl font-bold font-mono text-slate-200">
              {latest.RollingMean !== null ? `₹${latest.RollingMean}` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-500">{lookbackWindow}d Historical Average</span>
          </div>

          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Rolling Std (σ)</span>
            <div className="text-xl font-bold font-mono text-slate-200">
              {latest.RollingStd !== null ? `₹${latest.RollingStd}` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-500">Historical Volatility</span>
          </div>

          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Z-Score Deviation</span>
            <div className={`text-xl font-bold font-mono ${Math.abs(latest.ZScore) >= 2.0 ? "text-amber-400" : "text-slate-200"}`}>
              {latest.ZScore !== null ? `${latest.ZScore >= 0 ? `+${latest.ZScore}` : latest.ZScore}σ` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-500">
              {Math.abs(latest.ZScore) >= 2.0 ? "⚠️ Anomaly Threshold" : "Normal Dispersion"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
            <span className="text-slate-400">Percentile Rank</span>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {latest.Percentile !== null ? `${latest.Percentile}%` : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-500">Rolling Window Rank</span>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            {symbolA} vs {symbolB} — Time-Series Spread History
          </h3>
          <p className="text-xs text-slate-400">
            Interactive dual-axis chart showing Leg A price, Leg B price, and cross-contract spread.
          </p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
            Calculating historical spreads...
          </div>
        ) : (
          <InteractiveSpreadChart 
            data={series} 
            symbolA={symbolA} 
            symbolB={symbolB} 
          />
        )}

        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 mb-2">Rolling Z-Score Deviation Series</h4>
          <ZScoreTimelineChart 
            data={series} 
            threshold={2.0} 
            onSelectAnomaly={() => onNavigate('anomalies')}
          />
        </div>
      </div>

      {/* Important Quant Caveat Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200">Quantitative Caveat:</strong> A high statistical Z-score does not imply a guaranteed convergence or risk-free arbitrage. Different expiries, physical coin packaging costs (e.g. Guinea coins or Petal packaging), and tender-period delivery obligations create genuine economic divergence that must survive transaction friction and liquidity constraints.
        </div>
      </div>
    </div>
  );
}
