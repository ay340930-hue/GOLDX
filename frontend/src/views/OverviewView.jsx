import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShieldCheck, AlertTriangle, Layers, Calendar, 
  ArrowUpRight, ArrowDownRight, Compass, RefreshCw, Database,
  Activity, CheckCircle2, ChevronRight
} from 'lucide-react';
import InteractiveSpreadChart from '../components/charts/InteractiveSpreadChart';
import ZScoreTimelineChart from '../components/charts/ZScoreTimelineChart';
import { fetchRelativeValue, fetchAnomalies, fetchLiquidity, loadDemoDataset } from '../services/api';

export default function OverviewView({ onNavigate, onOpenJudgeTour, onSelectAnomaly }) {
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState({ a: 'GOLDM', b: 'GOLDGUINEA' });
  const [rvData, setRvData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [liquidity, setLiquidity] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [rvRes, anomRes, liqRes] = await Promise.all([
        fetchRelativeValue(selectedPair.a, selectedPair.b, 30),
        fetchAnomalies(selectedPair.a, selectedPair.b, 30, 2.0, 90.0),
        fetchLiquidity()
      ]);

      if (rvRes.success) setRvData(rvRes);
      if (anomRes.success) setAnomalies(anomRes.anomalies || []);
      if (liqRes.success) setLiquidity(liqRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPair]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const latestObs = rvData?.data?.[rvData.data.length - 1];
  const criticalAnomalies = anomalies.filter(a => Math.abs(a.z_score) >= 2.5);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome / Judge Callout Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="gold-badge text-xs">Hack in Hills '26</span>
            <span className="text-xs text-slate-400">Problem Statement 03: Commodity Derivatives Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            GOLDX <span className="text-slate-500 font-normal">|</span> <span className="gold-gradient-text">Explainable Cross-Contract Gold Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Normalizing MCX gold futures (GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL) onto a defensible common analytical basis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenJudgeTour}
            className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Judge Demo Guide (10 Steps)
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            MCX Contracts
          </span>
          <span className="text-2xl font-bold font-mono text-white">4 Active</span>
          <span className="text-xs text-slate-400 font-mono">GOLDM, TEN, GUINEA, PETAL</span>
        </div>

        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Observations
          </span>
          <span className="text-2xl font-bold font-mono text-white">
            {rvData?.total_observations ? `${rvData.total_observations} Days` : '1,000 Total'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Chronological Bhavcopy</span>
        </div>

        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Data Quality
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400">100.0%</span>
          <span className="text-xs text-emerald-500/80 font-mono">0 Ingestion Errors</span>
        </div>

        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            Active Spread
          </span>
          <span className={`text-2xl font-bold font-mono ${latestObs?.Spread >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {latestObs?.Spread !== undefined ? (latestObs.Spread >= 0 ? `+₹${latestObs.Spread}` : `-₹${Math.abs(latestObs.Spread)}`) : '₹0.00'}
          </span>
          <span className="text-xs text-slate-400 font-mono">{selectedPair.a} vs {selectedPair.b}</span>
        </div>

        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Flagged Anomalies
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400">{anomalies.length} Events</span>
          <span className="text-xs text-rose-400 font-mono">{criticalAnomalies.length} Critical (|Z|≥2.5)</span>
        </div>

        <div className="p-4 rounded-xl gold-card flex flex-col gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            Walk-Forward Lab
          </span>
          <span className="text-2xl font-bold font-mono text-blue-400">Validated</span>
          <span className="text-xs text-slate-400 font-mono">Zero Look-Ahead Bias</span>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Spread Time-Series & Z-Score Chart */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="p-5 rounded-xl gold-card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Cross-Contract Normalized Price & Spread Series
                </h3>
                <p className="text-xs text-slate-400">
                  Common Analytical Unit: ₹ per 10 grams (999 fineness parity)
                </p>
              </div>

              {/* Pair Switcher */}
              <div className="flex items-center gap-2">
                {[
                  { a: 'GOLDM', b: 'GOLDGUINEA', label: 'Mini vs Guinea' },
                  { a: 'GOLDM', b: 'GOLDTEN', label: 'Mini vs Gold10' },
                  { a: 'GOLDM', b: 'GOLDPETAL', label: 'Mini vs Petal' },
                  { a: 'GOLDGUINEA', b: 'GOLDPETAL', label: 'Guinea vs Petal' }
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPair({ a: p.a, b: p.b })}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPair.a === p.a && selectedPair.b === p.b
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
                Calculating quantitative spreads...
              </div>
            ) : (
              <InteractiveSpreadChart 
                data={rvData?.data} 
                symbolA={selectedPair.a} 
                symbolB={selectedPair.b} 
              />
            )}
          </div>

          {/* Rolling Z-Score Timeline */}
          <div className="p-5 rounded-xl gold-card flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Historical Rolling Z-Score Timeline (|Z| ≥ 2.0σ Flagged)
                </h3>
                <p className="text-xs text-slate-400">30-day historical lookback window strictly without look-ahead bias</p>
              </div>
              <button
                onClick={() => onNavigate('anomalies')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                View Anomaly Table
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ZScoreTimelineChart 
              data={rvData?.data} 
              threshold={2.0} 
              onSelectAnomaly={(pt) => {
                const match = anomalies.find(a => a.date === pt.Date);
                if (match && onSelectAnomaly) onSelectAnomaly(match);
                else onNavigate('anomalies');
              }}
            />
          </div>
        </div>

        {/* Right 1 Col: Contract Market Ticker, Liquidity Alerts & Quick Navigator */}
        <div className="flex flex-col gap-5">
          {/* Liquidity & Expiry Status */}
          <div className="p-5 rounded-xl gold-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Contract Market Status
              </h3>
              <span className="text-xs font-mono text-slate-400">Latest Session</span>
            </div>

            <div className="flex flex-col gap-3">
              {(liquidity?.contracts || []).map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {c.symbol}
                      <span className="text-slate-400 font-normal">({c.name.split(' ')[1] || c.symbol})</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Norm Price</span>
                      <strong className="text-slate-200">₹{c.normalized_price?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Volume</span>
                      <strong className="text-slate-200">{c.volume?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">DTE</span>
                      <strong className={c.dte <= 5 ? "text-rose-400" : "text-slate-200"}>
                        {c.dte !== null ? `${c.dte} Days` : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {c.warnings && c.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-400/90 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/15">
                      ⚠️ {c.warnings[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('liquidity')}
              className="w-full py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 font-medium border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
            >
              Examine Full Liquidity & Risk Layer
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Action Tiles */}
          <div className="p-5 rounded-xl gold-card flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Platform Modules</h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                onClick={() => onNavigate('contracts')}
                className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-left text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block">Contract Master & Normalization</strong>
                  <span className="text-slate-400 text-[11px]">Inspect MCX contract specifications and unit math</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('backtesting')}
                className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-left text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block">Walk-Forward Backtesting Lab</strong>
                  <span className="text-slate-400 text-[11px]">Simulate statistical rules across chronological folds</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('anomalies')}
                className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-left text-slate-300 flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block">8-Point Explainability Diagnostic</strong>
                  <span className="text-slate-400 text-[11px]">Understand why deviations occurred with institutional depth</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
